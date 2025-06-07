import { Server as SocketIOServer } from 'socket.io';
import { GameEvent, GameEventType, BaseGameState } from '@gambit-chess/shared';
import { broadcastGameEvent, broadcastGameUpdate } from '../socket/game.socket';
import LiveGameService from './live-game.service';

/**
 * Service for handling game events and broadcasting them via Socket.IO
 * Bridges the gap between Redis events and real-time WebSocket communication
 */
export class GameEventsService {
  private static io: SocketIOServer | null = null;
  
  // Player-Socket Mapping System for Private Communications
  private static playerSocketMap: Map<string, string> = new Map(); // playerId -> socketId
  private static socketPlayerMap: Map<string, string> = new Map(); // socketId -> playerId
  private static playerGameMap: Map<string, string> = new Map(); // playerId -> gameId

  /**
   * CRITICAL PRIVACY WARNING: Current Implementation Has Major Security Flaws
   * 
   * 🚨 KNOWN PRIVACY VIOLATIONS:
   * 
   * 1. Battle Points Updates (Line ~200): Claims "only broadcast to specific player"
   *    but actually broadcasts to ALL players in game room via `io.to('game:gameId')`
   * 
   * 2. Duel Allocations: While duel allocation handler doesn't broadcast allocations,
   *    the game state updates do broadcast the ENTIRE game state including sensitive data
   * 
   * 3. All `broadcastGameUpdate()` calls send complete game state to all players,
   *    potentially exposing information that should be player-specific
   * 
   * 🔧 TO FIX PRIVACY VIOLATIONS:
   * 
   * A. Implement Player-Socket Mapping:
   *    - Track which socket belongs to which player: Map<playerId, socketId>
   *    - Send private messages: `io.to(socketId).emit(...)`
   *    - Maintain mapping on join/disconnect
   * 
   * B. Implement State Filtering:
   *    - Create `getGameStateForPlayer(gameState, playerId)` that filters sensitive data
   *    - Send player-specific state: hidden BP, masked opponent allocations, etc.
   *    - Follow INFORMATION_ARCHITECTURE.md visibility rules
   * 
   * C. Review All Broadcast Points:
   *    - `handleBattlePointsUpdated()` - MUST be player-specific
   *    - `broadcastGameUpdate()` - MUST filter state per player
   *    - Duel resolution - Show allocations only after resolution
   * 
   * ⚠️  CURRENT STATUS: All "privacy" claims in this file are FALSE
   *     Players can see opponent's battle points and potentially other sensitive data
   */

  /**
   * Initialize the service with Socket.IO server instance
   */
  static initialize(socketServer: SocketIOServer): void {
    this.io = socketServer;
    console.log('GameEventsService initialized with Socket.IO server');
  }

  /**
   * Register a player-socket mapping when they join a game
   */
  static registerPlayerSocket(playerId: string, socketId: string, gameId: string): void {
    // Clean up any existing mappings for this player
    this.unregisterPlayerSocket(playerId);
    
    // Store the mappings
    this.playerSocketMap.set(playerId, socketId);
    this.socketPlayerMap.set(socketId, playerId);
    this.playerGameMap.set(playerId, gameId);
    
    console.log(`🔐 Registered player-socket mapping: ${playerId} -> ${socketId} (game: ${gameId})`);
  }

  /**
   * Unregister a player-socket mapping when they disconnect
   */
  static unregisterPlayerSocket(playerId: string): void {
    const existingSocketId = this.playerSocketMap.get(playerId);
    if (existingSocketId) {
      this.socketPlayerMap.delete(existingSocketId);
      this.playerGameMap.delete(playerId);
      console.log(`🔐 Unregistered player-socket mapping: ${playerId} -> ${existingSocketId}`);
    }
    this.playerSocketMap.delete(playerId);
  }

  /**
   * Unregister a socket when it disconnects
   */
  static unregisterSocket(socketId: string): void {
    const playerId = this.socketPlayerMap.get(socketId);
    if (playerId) {
      this.unregisterPlayerSocket(playerId);
    }
  }

  /**
   * Get socket ID for a player (for private messages)
   */
  static getSocketIdForPlayer(playerId: string): string | undefined {
    return this.playerSocketMap.get(playerId);
  }

  /**
   * Send a private message to a specific player
   */
  static sendToPlayer(playerId: string, event: string, data: any): boolean {
    const socketId = this.getSocketIdForPlayer(playerId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Process and broadcast a game event
   */
  static async processGameEvent(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    if (!this.io) {
      console.error('GameEventsService not initialized with Socket.IO server');
      return;
    }

    try {
      switch (event.type) {
        case GameEventType.GAME_CREATED:
          await this.handleGameCreated(event);
          break;
        
        case GameEventType.PLAYER_JOINED:
          await this.handlePlayerJoined(event);
          break;
        
        case GameEventType.MOVE_MADE:
          await this.handleMoveMade(event);
          break;
        
        case GameEventType.DUEL_INITIATED:
          await this.handleDuelInitiated(event);
          break;
        
        case GameEventType.DUEL_ALLOCATION_SUBMITTED:
          await this.handleDuelAllocation(event);
          break;
        
        case GameEventType.DUEL_RESOLVED:
          await this.handleDuelResolved(event, finalGameState);
          break;
        
        case GameEventType.TACTICAL_RETREAT_MADE:
          await this.handleTacticalRetreat(event);
          break;
        
        case GameEventType.BATTLE_POINTS_UPDATED:
          await this.handleBattlePointsUpdated(event);
          break;
        
        case GameEventType.GAME_ENDED:
          await this.handleGameEnded(event, finalGameState);
          break;
        
        default:
          console.log(`Unhandled game event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing game event:', error);
    }
  }

  /**
   * Handle game creation events
   */
  private static async handleGameCreated(event: GameEvent): Promise<void> {
    console.log(`Game created: ${event.gameId}`);
    // Could broadcast to a general games lobby if implemented
  }

  /**
   * Handle player joined events
   */
  private static async handlePlayerJoined(event: GameEvent): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state for all players
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    }
  }

  /**
   * Handle move made events
   */
  private static async handleMoveMade(event: GameEvent): Promise<void> {
    console.log('🎯 Processing MOVE_MADE event for game:', event.gameId);
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state for all players
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      console.log('🔄 Broadcasting updated game state. FEN:', gameState.chess.fen());
      console.log('🔄 Current turn:', gameState.chess.turn());
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get updated game state for broadcast');
    }
  }

  /**
   * Handle duel initiated events
   */
  private static async handleDuelInitiated(event: GameEvent): Promise<void> {
    console.log('🥊 Processing DUEL_INITIATED event for game:', event.gameId);
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state for all players - CRITICAL: This broadcasts the duel state
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      console.log('🥊 Broadcasting duel game state. Status:', gameState.gameStatus);
      console.log('🥊 Pending duel:', gameState.pendingDuel ? 'Yes' : 'No');
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get updated game state for duel broadcast');
    }
    
    // Notify players that a duel has started
    this.io!.to(`game:${event.gameId}`).emit('game:duel_started', {
      attacker: event.payload.attacker,
      defender: event.payload.defender,
      piece: event.payload.piece,
    });
  }

  /**
   * Handle duel allocation events (keep secret from opponent)
   */
  private static async handleDuelAllocation(event: GameEvent): Promise<void> {
    // Don't broadcast allocations to prevent cheating
    // Only log for server-side tracking
    console.log(`Duel allocation received for game ${event.gameId}`);
    
    // Could check if both players have allocated and resolve duel here
    // For now, just acknowledge to the allocating player (handled in socket handler)
  }

  /**
   * Handle duel resolved events
   */
  private static async handleDuelResolved(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state after duel resolution
    // Use finalGameState if provided (for completed games) or fetch from Redis
    let gameState = finalGameState;
    if (!gameState) {
      const fetchedState = await LiveGameService.getGameState(event.gameId);
      gameState = fetchedState || undefined;
    }
    
    if (gameState) {
      console.log('🥊 Broadcasting final duel state. Status:', gameState.gameStatus, 'FEN:', gameState.chess.fen());
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get game state for duel resolution broadcast');
    }
    
    // Notify players about duel result
    this.io!.to(`game:${event.gameId}`).emit('game:duel_resolved', {
      winner: event.payload.winner,
      attackerAllocation: event.payload.attackerAllocation,
      defenderAllocation: event.payload.defenderAllocation,
      result: event.payload.result,
    });
  }

  /**
   * Handle tactical retreat events
   */
  private static async handleTacticalRetreat(event: GameEvent): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state after retreat
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    }
  }

  /**
   * Handle battle points updated events - FIXED with proper privacy
   */
  private static async handleBattlePointsUpdated(event: GameEvent): Promise<void> {
    const targetPlayerId = event.payload.playerId;
    
    // ✅ PRIVACY FIXED: Send only to the specific player whose BP changed
    const success = this.sendToPlayer(targetPlayerId, 'game:battle_points_updated', {
      playerId: targetPlayerId,
      newAmount: event.payload.newAmount,
      change: event.payload.change,
    });
    
    if (success) {
      console.log(`🔐 Sent private BP update to player ${targetPlayerId}: ${event.payload.change} BP`);
    } else {
      console.warn(`⚠️ Could not send BP update to player ${targetPlayerId} - not connected`);
    }
  }

  /**
   * Handle game ended events
   */
  private static async handleGameEnded(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Use finalGameState if provided (for completed games) or fetch from Redis
    // This is critical because when games end, they're often archived before this handler runs
    let gameState = finalGameState;
    if (!gameState) {
      const fetchedState = await LiveGameService.getGameState(event.gameId);
      gameState = fetchedState || undefined;
    }
    
    if (gameState) {
      console.log('🏁 Broadcasting final game state on game end. Status:', gameState.gameStatus, 'FEN:', gameState.chess.fen());
      console.log('🏁 Final move history length:', gameState.moveHistory.length);
      console.log('🏁 Final moves:', gameState.moveHistory.map(m => m.san || `${m.from}-${m.to}`));
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get final game state for game end broadcast');
    }
    
    // Notify about game end
    this.io!.to(`game:${event.gameId}`).emit('game:ended', {
      result: event.payload.result,
      winner: event.payload.winner,
      reason: event.payload.reason,
    });
    
    console.log(`Game ${event.gameId} ended: ${event.payload.result}`);
  }

  /**
   * Get Socket.IO server instance (for external use)
   */
  static getSocketServer(): SocketIOServer | null {
    return this.io;
  }
}

export default GameEventsService; 