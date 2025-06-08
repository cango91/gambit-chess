import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '../auth/jwt';
import LiveGameService from '../services/live-game.service';
import AnonymousSessionService from '../services/anonymous-session.service';
import GameEngineService from '../services/game-engine.service';
import GameEventTrackerService from '../services/game-event-tracker.service';
import { GameEventType, GameEvent, MoveAction } from '@gambit-chess/shared';
import { Square } from 'chess.js';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
  anonymousSession?: { sessionId: string; sessionData: any };
}

/**
 * Socket.IO middleware for authentication
 */
export const socketAuthMiddleware = async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;
  const anonymousSessionToken = socket.handshake.auth.anonymousSessionToken;
  const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
  const acceptLanguage = socket.handshake.headers['accept-language'] as string || 'unknown';
  
  // FIXED: Use socket.handshake.address to match req.ip behavior (no trust proxy configured)
  // This ensures consistent client fingerprints between HTTP and WebSocket
  const xForwardedFor = socket.handshake.address;

  // Try JWT authentication first
  if (token) {
    const decoded = verifyAccessToken(token);
    if (decoded) {
      socket.user = decoded;
      console.log(`Authenticated user connected: ${decoded.username} (${socket.id})`);
      next();
      return;
    }
  }

  // Try anonymous session authentication
  if (anonymousSessionToken) {
    try {
      console.log(`🔍 WebSocket Auth Fingerprint Components:`, {
        userAgent,
        acceptLanguage,
        xForwardedFor,
        socketAddress: socket.handshake.address,
        socketHeaders: socket.handshake.headers
      });
      
      // Generate client fingerprint for validation
      const clientFingerprint = AnonymousSessionService.generateClientFingerprint(
        userAgent,
        acceptLanguage,
        xForwardedFor
      );
      
      console.log(`🔍 Generated WebSocket fingerprint: ${clientFingerprint.substring(0, 8)}...`);
      
      // Validate session token
      const validation = await AnonymousSessionService.validateSession(anonymousSessionToken, clientFingerprint);
      
      if (validation) {
        socket.anonymousSession = validation;
        console.log(`Anonymous user connected: ${validation.sessionId} (${socket.id})`);
        next();
        return;
      } else {
        console.log(`Invalid anonymous session token rejected: ${socket.id}`);
      }
    } catch (error) {
      console.error('Anonymous session validation error:', error);
    }
  }

  // No valid authentication
  console.log(`Unauthenticated connection rejected: ${socket.id}`);
  next(new Error('Authentication required - provide either JWT token or valid anonymous session token'));
};

/**
 * Handle game-related Socket.IO events
 */
export const setupGameSocketHandlers = (io: SocketIOServer, socket: AuthenticatedSocket) => {
  /**
   * Join a game room for real-time updates
   */
  socket.on('game:join', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.user?.userId || socket.anonymousSession?.sessionId;

      console.log(`🏠 User ${userId} attempting to join game room: ${gameId}`);

      if (!userId) {
        socket.emit('error', { message: 'User identification required' });
        return;
      }

      // Verify user has access to this game
      const gameState = await LiveGameService.getGameState(gameId);
      if (!gameState) {
        console.log(`❌ Game ${gameId} not found for user ${userId}`);
        socket.emit('error', { message: 'Game not found or access denied' });
        return;
      }

      // Check if user is authorized to join this game
      const isPlayer = gameState.whitePlayer.id === userId || gameState.blackPlayer.id === userId;
      if (!isPlayer) {
        console.log(`❌ User ${userId} not authorized for game ${gameId}. White: ${gameState.whitePlayer.id}, Black: ${gameState.blackPlayer.id}`);
        // Could allow spectators here if desired
        socket.emit('error', { message: 'You are not a player in this game' });
        return;
      }

      // Join the game room
      socket.join(`game:${gameId}`);
      console.log(`✅ User ${userId} successfully joined game room: game:${gameId}`);
      console.log(`🏠 Room now has ${io.sockets.adapter.rooms.get(`game:${gameId}`)?.size || 0} members`);
      
      // 🔐 PRIVACY FIX: Register player-socket mapping for private messages
      const GameEventsService = require('../services/game-events.service').GameEventsService;
      GameEventsService.registerPlayerSocket(userId, socket.id, gameId);
      
      // 🔐 PRIVACY FIX: Send filtered game state to the joining player
      const { getGameStateForPlayer } = require('../utils/game-state-filter');
      const filteredGameState = getGameStateForPlayer(gameState, userId);
      const serializableState = {
        ...filteredGameState,
        chess: {
          fen: gameState.chess.fen(),
          turn: gameState.chess.turn(),
          history: gameState.chess.history(),
          pgn: gameState.chess.pgn(),
        },
      };
      
      socket.emit('game:state', serializableState);
      console.log(`📤🔐 Sent filtered game state to user ${userId}. FEN: ${gameState.chess.fen()}`);
      
      // Notify other players in the room
      socket.to(`game:${gameId}`).emit('game:player_connected', {
        playerId: socket.user?.username || 'Anonymous',
        socketId: socket.id,
      });

      console.log(`User ${userId} joined game room ${gameId}`);
    } catch (error) {
      console.error('Error joining game room:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  /**
   * Leave a game room
   */
  socket.on('game:leave', (data: { gameId: string }) => {
    const { gameId } = data;
    socket.leave(`game:${gameId}`);
    
    // Notify other players in the room
    socket.to(`game:${gameId}`).emit('game:player_disconnected', {
      playerId: socket.user?.username || 'Anonymous',
      socketId: socket.id,
    });

    console.log(`User ${socket.user?.userId || socket.anonymousSession?.sessionId} left game room ${gameId}`);
  });

  /**
   * Handle move attempts via WebSocket (proper Gambit Chess flow)
   */
  socket.on('game:move', async (data: { gameId: string; move: MoveAction }) => {
    try {
      const { gameId, move } = data;
      const userId = socket.user?.userId || socket.anonymousSession?.sessionId;

      if (!userId) {
        socket.emit('error', { message: 'User identification required' });
        return;
      }

      // Process the move using the Game Engine Service
      const result = await GameEngineService.processMove(gameId, userId, move);
      
      if (!result.success) {
        socket.emit('error', { message: result.error || 'Failed to process move' });
        return;
      }

      // Success response sent via game events
      socket.emit('game:move_result', { 
        success: true, 
        events: result.events.length 
      });

      console.log(`Move processed successfully in game ${gameId} by user ${userId}:`, move);
    } catch (error) {
      console.error('Error processing move:', error);
      socket.emit('error', { message: 'Failed to process move' });
    }
  });

  /**
   * Handle battle points allocation during duels
   */
  socket.on('game:duel_allocation', async (data: { gameId: string; allocation: number }) => {
    try {
      const { gameId, allocation } = data;
      const userId = socket.user?.userId || socket.anonymousSession?.sessionId;

      if (!userId) {
        socket.emit('error', { message: 'User identification required' });
        return;
      }

      // Process the duel allocation using the Game Engine Service
      const result = await GameEngineService.processDuelAllocation(gameId, userId, allocation);
      
      if (!result.success) {
        socket.emit('error', { message: result.error || 'Failed to process duel allocation' });
        return;
      }

      // Only notify the allocating player for confirmation (hide from opponent)
      socket.emit('game:duel_allocation_confirmed', { 
        allocation,
        success: true 
      });

      console.log(`Duel allocation processed in game ${gameId} by user ${userId}: ${allocation} BP`);
    } catch (error) {
      console.error('Error processing duel allocation:', error);
      socket.emit('error', { message: 'Failed to process duel allocation' });
    }
  });

  /**
   * Handle tactical retreat decisions
   */
  socket.on('game:tactical_retreat', async (data: { gameId: string; retreatSquare: string }) => {
    try {
      const { gameId, retreatSquare } = data;
      const userId = socket.user?.userId || socket.anonymousSession?.sessionId;

      if (!userId) {
        socket.emit('error', { message: 'User identification required' });
        return;
      }

      // Process the tactical retreat using the Game Engine Service
      const result = await GameEngineService.processTacticalRetreat(gameId, userId, retreatSquare as Square);
      
      if (!result.success) {
        socket.emit('error', { message: result.error || 'Failed to process tactical retreat' });
        return;
      }

      // Success response
      socket.emit('game:tactical_retreat_result', { 
        success: true,
        retreatSquare,
        events: result.events.length
      });

      console.log(`Tactical retreat processed in game ${gameId} by user ${userId} to ${retreatSquare}`);
    } catch (error) {
      console.error('Error processing tactical retreat:', error);
      socket.emit('error', { message: 'Failed to process tactical retreat' });
    }
  });

  /**
   * Handle chat messages in game
   */
  socket.on('game:chat', (data: { gameId: string; message: string }) => {
    const { gameId, message } = data;
    const username = socket.user?.username || 'Anonymous';
    
    // Broadcast message to all players in the game room
    io.to(`game:${gameId}`).emit('game:chat_message', {
      username,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Handle game state requests
   */
  socket.on('game:get_state', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.user?.userId || socket.anonymousSession?.sessionId;

      if (!userId) {
        socket.emit('error', { message: 'User identification required' });
        return;
      }

      const gameState = await LiveGameService.getGameState(gameId);
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Check authorization
      const isPlayer = gameState.whitePlayer.id === userId || gameState.blackPlayer.id === userId;
      if (!isPlayer) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Send current game state - use serialized format for consistency
      const serializableState = {
        ...gameState,
        chess: {
          fen: gameState.chess.fen(),
          turn: gameState.chess.turn(),
          history: gameState.chess.history(),
          pgn: gameState.chess.pgn(),
        },
      };
      
      socket.emit('game:state', serializableState);
    } catch (error) {
      console.error('Error getting game state:', error);
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });

  /**
   * Handle BP calculation history requests
   */
  socket.on('game:bp_history', async (data: { gameId: string }) => {
    try {
      const { gameId } = data;
      const userId = socket.user?.userId || socket.anonymousSession?.sessionId;

      if (!userId) {
        socket.emit('error', { message: 'User identification required' });
        return;
      }

      const gameState = await LiveGameService.getGameState(gameId);
      if (!gameState) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Check authorization
      const isPlayer = gameState.whitePlayer.id === userId || gameState.blackPlayer.id === userId;
      if (!isPlayer) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Get BP calculation history with privacy filtering
      const bpHistory = await GameEventTrackerService.getBPCalculationHistory(gameId, userId);
      
      socket.emit('game:bp_history_response', {
        gameId,
        history: bpHistory,
        timestamp: Date.now()
      });

      console.log(`BP history sent to ${userId} for game ${gameId}: ${bpHistory.length} entries`);
    } catch (error) {
      console.error('Error getting BP history:', error);
      socket.emit('error', { message: 'Failed to get BP history' });
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    const userId = socket.user?.userId || socket.anonymousSession?.sessionId;
    console.log(`User ${userId} disconnected (${socket.id})`);
    
    // 🔐 PRIVACY FIX: Clean up player-socket mappings on disconnect
    const GameEventsService = require('../services/game-events.service').GameEventsService;
    GameEventsService.unregisterSocket(socket.id);
    
    // The socket will automatically leave all rooms on disconnect
    console.log(`🔐 Cleaned up socket mappings for ${userId} (${socket.id})`);
  });
};

/**
 * Send filtered game state updates to each player individually - PRIVACY FIXED
 * 
 * ✅ PRIVACY COMPLIANT: Filters game state per player based on configuration settings
 * Each player receives only the information they should see according to:
 * - Information hiding configuration (config.informationHiding)
 * - Player-specific visibility rules (own BP vs opponent BP)
 * - Current game context (turn, duel state, etc.)
 */
export const broadcastGameUpdate = (io: SocketIOServer, gameId: string, gameState: any) => {
  console.log(`📡 Sending filtered game updates for game: ${gameId}`);
  console.log(`📡 Rooms in server:`, Array.from(io.sockets.adapter.rooms.keys()));
  console.log(`📡 Sockets in game room:`, io.sockets.adapter.rooms.get(`game:${gameId}`)?.size || 0);
  
  // Import the filtering utility (dynamic import to avoid circular dependency)
  const { getGameStateForPlayer, getFilteringSummary } = require('../utils/game-state-filter');
  
  // Send filtered state to white player
  const whitePlayerId = gameState.whitePlayer.id;
  const whiteFilteredState = getGameStateForPlayer(gameState, whitePlayerId);
  const whiteSerializedState = {
    ...whiteFilteredState,
    chess: {
      fen: gameState.chess.fen(),
      turn: gameState.chess.turn(),
      history: gameState.chess.history(),
      pgn: gameState.chess.pgn(),
    },
  };
  
  // Import GameEventsService to access socket mapping (avoid circular dependency)
  const GameEventsService = require('../services/game-events.service').GameEventsService;
  const whiteSocketId = GameEventsService.getSocketIdForPlayer(whitePlayerId);
  if (whiteSocketId) {
    io.to(whiteSocketId).emit('game:state_updated', whiteSerializedState);
    const filteringSummary = getFilteringSummary(gameState, whiteFilteredState, whitePlayerId);
    console.log(`🔐 Sent filtered state to white player ${whitePlayerId}. Filtered: [${filteringSummary.join(', ')}]`);
  }
  
  // Send filtered state to black player
  const blackPlayerId = gameState.blackPlayer.id;
  const blackFilteredState = getGameStateForPlayer(gameState, blackPlayerId);
  const blackSerializedState = {
    ...blackFilteredState,
    chess: {
      fen: gameState.chess.fen(),
      turn: gameState.chess.turn(),
      history: gameState.chess.history(),
      pgn: gameState.chess.pgn(),
    },
  };
  
  const blackSocketId = GameEventsService.getSocketIdForPlayer(blackPlayerId);
  if (blackSocketId) {
    io.to(blackSocketId).emit('game:state_updated', blackSerializedState);
    const filteringSummary = getFilteringSummary(gameState, blackFilteredState, blackPlayerId);
    console.log(`🔐 Sent filtered state to black player ${blackPlayerId}. Filtered: [${filteringSummary.join(', ')}]`);
  }
  
  console.log(`📡 Completed privacy-compliant game state broadcast for FEN: ${gameState.chess.fen()}`);
};

/**
 * Broadcast game event to all players in a game
 */
export const broadcastGameEvent = (io: SocketIOServer, gameId: string, event: GameEvent) => {
  io.to(`game:${gameId}`).emit('game:event', event);
}; 