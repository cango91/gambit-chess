import { BaseGameState, GameStatus, GameEvent, GameEventType, GambitMove, Player } from '@gambit-chess/shared';
import { RedisService } from './redis.service';
import { prisma } from '../index';
import { createNewGame } from '@gambit-chess/shared';
import crypto from 'crypto';
import GameEventsService from './game-events.service';
import GameEventTrackerService from './game-event-tracker.service';

const GAME_TTL = 24 * 60 * 60; // 24 hours in seconds
const GAME_KEY_PREFIX = 'live_game:';
const GAME_EVENTS_KEY_PREFIX = 'game_events:';

export interface LiveGameOptions {
  whitePlayerId?: string;
  blackPlayerId?: string;
  anonymousUserId?: string;
  gameType: 'ai' | 'human' | 'practice';
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  colorPreference?: 'white' | 'black' | 'random';
}

// Helper function to convert shared GameStatus to Prisma GameStatus
function convertToPrismaGameStatus(status: GameStatus): 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' {
  switch (status) {
    case GameStatus.WAITING_FOR_PLAYERS:
      return 'WAITING';
    case GameStatus.IN_PROGRESS:
    case GameStatus.DUEL_IN_PROGRESS:
    case GameStatus.TACTICAL_RETREAT_DECISION:
      return 'IN_PROGRESS';
    case GameStatus.CHECKMATE:
    case GameStatus.STALEMATE:
    case GameStatus.DRAW:
      return 'COMPLETED';
    case GameStatus.ABANDONED:
      return 'ABANDONED';
    default:
      return 'IN_PROGRESS';
  }
}

/**
 * Service for managing live games in Redis
 * - Active games (WAITING/IN_PROGRESS) are stored in Redis for fast access
 * - Game events are published for real-time updates
 * - Completed games (COMPLETED/ABANDONED) are moved to persistent database storage
 */
export class LiveGameService {
  
  /**
   * Create a new live game in Redis
   */
  static async createGame(options: LiveGameOptions): Promise<{ gameId: string; gameState: BaseGameState }> {
    const gameId = crypto.randomUUID();
    
    // Determine color preference (default: white)
    const colorPreference = options.colorPreference || 'white';
    
    // Determine player IDs based on game type and color preference
    let whitePlayerId = options.whitePlayerId;
    let blackPlayerId = options.blackPlayerId;
    
    if (options.gameType === 'ai') {
      const playerId = options.whitePlayerId || options.anonymousUserId || 'anonymous';
      
      if (colorPreference === 'white') {
        whitePlayerId = playerId;
        blackPlayerId = 'ai';
      } else if (colorPreference === 'black') {
        whitePlayerId = 'ai';
        blackPlayerId = playerId;
      } else { // random
        const randomChoice = Math.random() < 0.5;
        if (randomChoice) {
          whitePlayerId = playerId;
          blackPlayerId = 'ai';
        } else {
          whitePlayerId = 'ai';
          blackPlayerId = playerId;
        }
      }
    } else if (options.gameType === 'practice') {
      const playerId = options.whitePlayerId || options.anonymousUserId || 'practice';
      
      // In practice mode, the same player controls both sides
      whitePlayerId = playerId;
      blackPlayerId = playerId;
    } else if (options.gameType === 'human') {
      // For human vs human, the creator gets their preferred color
      const playerId = options.whitePlayerId!;
      
      if (colorPreference === 'white') {
        whitePlayerId = playerId;
        blackPlayerId = undefined; // Will be set when opponent joins
      } else if (colorPreference === 'black') {
        whitePlayerId = undefined; // Will be set when opponent joins
        blackPlayerId = playerId;
      } else { // random
        const randomChoice = Math.random() < 0.5;
        if (randomChoice) {
          whitePlayerId = playerId;
          blackPlayerId = undefined;
        } else {
          whitePlayerId = undefined;
          blackPlayerId = playerId;
        }
      }
    }
    
    // Create game state using shared function
    const gameState = createNewGame(gameId, whitePlayerId || '', blackPlayerId, options.gameType);
    
    // Initialize event tracking for this game session
    GameEventTrackerService.startGameSession(gameId);
    GameEventTrackerService.logGameStateSnapshot(gameId, gameState, 'game_created');
    
    // Store in Redis
    await this.saveGameState(gameId, gameState);
    
    // Emit game created event
    await this.emitGameEvent({
      type: GameEventType.GAME_CREATED,
      gameId,
      timestamp: Date.now(),
      payload: {
        gameType: options.gameType,
        whitePlayerId,
        blackPlayerId,
        anonymousUserId: options.anonymousUserId,
        colorPreference: colorPreference,
      },
    });
    
    // Also create a database record for persistence linking
    await prisma.game.create({
      data: {
        id: gameId,
        status: convertToPrismaGameStatus(gameState.gameStatus),
        whitePlayerId: options.whitePlayerId || null,
        blackPlayerId: options.blackPlayerId || null,
        anonymousUserId: options.anonymousUserId || null,
        initialConfig: gameState.config as any,
        moveHistory: [],
      },
    });
    
    return { gameId, gameState };
  }
  
  /**
   * Reconstruct a GambitMove from serialized data, ensuring all methods are available
   */
  static reconstructGambitMove(serializedMove: any): GambitMove {
    // If it's already a proper GambitMove with methods, return as is
    if (serializedMove && typeof serializedMove.isEnPassant === 'function') {
      return serializedMove as GambitMove;
    }

    // Reconstruct the move with proper method bindings
    const reconstructed: GambitMove = {
      ...serializedMove,
      // Ensure all chess.js Move methods are available
      isCapture: () => !!serializedMove.captured,
      isPromotion: () => !!serializedMove.promotion,
      isEnPassant: () => serializedMove.flags?.includes('e') || false,
      isKingsideCastle: () => serializedMove.flags?.includes('k') || false,
      isQueensideCastle: () => serializedMove.flags?.includes('q') || false,
      isBigPawn: () => serializedMove.flags?.includes('b') || false,
    };

    return reconstructed;
  }
  
  /**
   * Get game state from Redis
   */
  static async getGameState(gameId: string): Promise<BaseGameState | null> {
    try {
      const key = `${GAME_KEY_PREFIX}${gameId}`;
      const gameStateJson = await RedisService.get(key);
      
      if (!gameStateJson) {
        console.log('📖 No game state found in Redis for:', gameId);
        return null;
      }

      const gameState = JSON.parse(gameStateJson) as BaseGameState;
      
      // Reconstruct Chess instance properly
      const { Chess } = require('chess.js');
      const chess = new Chess();
      
      // If chess is stored as serialized data, reconstruct it
      if (gameState.chess && typeof gameState.chess === 'object') {
        const chessData = gameState.chess as any;
        console.log('📖 Serialized chess data:', {
          fen: chessData.fen,
          turn: chessData.turn,
          history: chessData.history,
          pgn: chessData.pgn?.substring(0, 100) + '...'
        });
        
        // Try to use FEN directly first (most reliable)
        if (chessData.fen && typeof chessData.fen === 'string') {
          try {
            chess.load(chessData.fen);
            console.log('📖 Successfully loaded from FEN:', chessData.fen);
          } catch (error) {
            console.error('📖 Error loading FEN:', chessData.fen, error);
            // Fallback to starting position
            chess.reset();
          }
        } else {
          console.log('📖 No valid FEN found, using starting position');
          chess.reset();
        }
        
        // WARNING: DO NOT replay history unless absolutely necessary
        // The FEN should be the authoritative state
        console.log('📖 Using FEN as authoritative state instead of replaying moves');
      }
      
      // Replace the serialized chess object with the reconstructed instance
      gameState.chess = chess;
      
      // Reconstruct GambitMoves in moveHistory to ensure they have proper methods
      if (gameState.moveHistory && Array.isArray(gameState.moveHistory)) {
        gameState.moveHistory = gameState.moveHistory.map(move => 
          this.reconstructGambitMove(move)
        );
      }
      
      console.log('📖 Final reconstructed FEN:', gameState.chess.fen());
      console.log('📖 Final turn:', gameState.chess.turn());
      
      return gameState;
    } catch (error) {
      console.error('Error getting game state from Redis:', error);
      return null;
    }
  }
  
  /**
   * Save game state to Redis
   */
  static async saveGameState(gameId: string, gameState: BaseGameState): Promise<void> {
    try {
      const key = `${GAME_KEY_PREFIX}${gameId}`;
      
      // Create a serializable version of the game state
      const serializableState = {
        ...gameState,
        chess: {
          fen: gameState.chess.fen(),
          turn: gameState.chess.turn(),
          // Use preserved history if available (for tactical retreats), otherwise use current history
          history: (gameState.chess as any)._preservedHistory || gameState.chess.history(),
          pgn: gameState.chess.pgn(),
        },
      };
      
      await RedisService.setWithTTL(key, JSON.stringify(serializableState), GAME_TTL);
    } catch (error) {
      console.error('Error saving game state to Redis:', error);
      throw error;
    }
  }
  
  /**
   * Update game state and emit events
   */
  static async updateGameState(gameId: string, gameState: BaseGameState, event?: GameEvent): Promise<void> {
    await this.saveGameState(gameId, gameState);
    
    // Check if game is completed BEFORE emitting events
    const shouldArchive = this.isGameCompleted(gameId, gameState);
    
    if (event) {
      // Pass the gameState to event processing to ensure final broadcast works
      await this.emitGameEvent(event, shouldArchive ? gameState : undefined);
    }
    
    // Archive AFTER event processing to ensure final broadcast happens
    if (shouldArchive) {
      await this.archiveCompletedGame(gameId, gameState);
    }
  }
  
  /**
   * Join an existing live game
   */
  static async joinGame(gameId: string, playerId: string, isAnonymous: boolean = false): Promise<BaseGameState | null> {
    const gameState = await this.getGameState(gameId);
    
    if (!gameState || gameState.gameStatus !== GameStatus.WAITING_FOR_PLAYERS) {
      return null;
    }
    
    // Assign to empty slot
    if (!gameState.blackPlayer.id || gameState.blackPlayer.id === '') {
      gameState.blackPlayer.id = playerId;
      gameState.gameStatus = GameStatus.IN_PROGRESS;
      
      await this.updateGameState(gameId, gameState, {
        type: GameEventType.PLAYER_JOINED,
        gameId,
        timestamp: Date.now(),
        payload: {
          playerId,
          color: 'b',
          isAnonymous,
        },
      });
      
      return gameState;
    }
    
    return null; // Game is full
  }
  
  /**
   * Remove game from Redis (when completed or abandoned)
   */
  static async removeGame(gameId: string): Promise<void> {
    const key = `${GAME_KEY_PREFIX}${gameId}`;
    const eventsKey = `${GAME_EVENTS_KEY_PREFIX}${gameId}`;
    
    await Promise.all([
      RedisService.del(key),
      RedisService.del(eventsKey),
    ]);
  }
  
  /**
   * Emit a game event for real-time communication
   */
  static async emitGameEvent(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    try {
      const eventsKey = `${GAME_EVENTS_KEY_PREFIX}${event.gameId}`;
      
      // Store event in Redis for event history (with shorter TTL)
      const eventJson = JSON.stringify(event);
      await RedisService.setWithTTL(eventsKey, eventJson, 60 * 60); // 1 hour
      
      // Process event through GameEventsService for Socket.IO broadcasting
      await GameEventsService.processGameEvent(event, finalGameState);
      
    } catch (error) {
      console.error('Error emitting game event:', error);
    }
  }
  
  /**
   * Get recent game events for a specific game
   */
  static async getGameEvents(gameId: string): Promise<GameEvent[]> {
    try {
      const eventsKey = `${GAME_EVENTS_KEY_PREFIX}${gameId}`;
      const eventsJson = await RedisService.get(eventsKey);
      
      if (!eventsJson) {
        return [];
      }
      
      return JSON.parse(eventsJson) as GameEvent[];
    } catch (error) {
      console.error('Error getting game events:', error);
      return [];
    }
  }
  
  /**
   * Check if game is completed (and should be archived)
   */
  private static isGameCompleted(gameId: string, gameState: BaseGameState): boolean {
    const isCompleted = [
      GameStatus.CHECKMATE,
      GameStatus.STALEMATE,
      GameStatus.DRAW,
      GameStatus.ABANDONED
    ].includes(gameState.gameStatus);
    
    // End event tracking session when game completes
    if (isCompleted) {
      GameEventTrackerService.endGameSession(gameId);
    }
    
    return isCompleted;
  }
  
  /**
   * Archive completed game to database and remove from Redis
   */
  private static archiveCompletedGame(gameId: string, gameState: BaseGameState): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Sanitize move history by removing function properties that can't be serialized
        const sanitizedMoveHistory = gameState.moveHistory.map(move => {
          // Create a plain object copy without function properties
          const sanitizedMove: any = {};
          
          // Copy all enumerable properties that are not functions
          for (const [key, value] of Object.entries(move)) {
            if (typeof value !== 'function') {
              sanitizedMove[key] = value;
            }
          }
          
          return sanitizedMove;
        });
        
        // Update database with final game state
        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: convertToPrismaGameStatus(gameState.gameStatus),
            moveHistory: sanitizedMoveHistory as any,
            endedAt: new Date(),
          },
        });
        
        // Remove from Redis
        await this.removeGame(gameId);
        
        console.log(`Game ${gameId} archived to database`);
        resolve();
      } catch (error) {
        console.error('Error archiving completed game:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Get all active games (for debugging/admin)
   */
  static async getActiveGamesCount(): Promise<number> {
    try {
      const redis = await RedisService.getRedisClient();
      const keys = await redis.keys(`${GAME_KEY_PREFIX}*`);
      return keys.length;
    } catch (error) {
      console.error('Error getting active games count:', error);
      return 0;
    }
  }
  
  /**
   * Get all active games waiting for players (for game discovery)
   */
  static async getWaitingGames(): Promise<BaseGameState[]> {
    try {
      // Get all game keys from Redis
      const keys = await RedisService.keys(`${GAME_KEY_PREFIX}*`);
      const waitingGames: BaseGameState[] = [];
      
      for (const key of keys) {
        const gameStateJson = await RedisService.get(key);
        if (gameStateJson) {
          const gameState = JSON.parse(gameStateJson) as BaseGameState;
          
          // Only include games waiting for players
          if (gameState.gameStatus === GameStatus.WAITING_FOR_PLAYERS) {
            // Reconstruct Chess instance properly (same as getGameState)
            const { Chess } = require('chess.js');
            const chess = new Chess();
            
            if (gameState.chess && typeof gameState.chess === 'object') {
              const chessData = gameState.chess as any;
              
              // Use FEN directly (most reliable) - avoid move replay
              if (chessData.fen && typeof chessData.fen === 'string') {
                try {
                  chess.load(chessData.fen);
                } catch (error) {
                  console.error('Error loading FEN in getWaitingGames:', chessData.fen, error);
                  chess.reset(); // Fallback to starting position
                }
              } else {
                chess.reset(); // Default to starting position
              }
            }
            
            gameState.chess = chess;
            
            // Reconstruct GambitMoves in moveHistory to ensure they have proper methods
            if (gameState.moveHistory && Array.isArray(gameState.moveHistory)) {
              gameState.moveHistory = gameState.moveHistory.map(move => 
                this.reconstructGambitMove(move)
              );
            }
            
            waitingGames.push(gameState);
          }
        }
      }
      
      // Sort by creation time (most recent first)
      return waitingGames.sort((a, b) => {
        // Assume games have timestamp in their ID or we could add createdAt field
        return b.id.localeCompare(a.id);
      });
    } catch (error) {
      console.error('Error getting waiting games:', error);
      return [];
    }
  }
}

export default LiveGameService; 