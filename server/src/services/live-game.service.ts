import { BaseGameState, GameStatus, GameEvent, GameEventType, GambitMove, Player } from '@gambit-chess/shared';
import { RedisService } from './redis.service';
import { prisma } from '../index';
import { createNewGame } from '@gambit-chess/shared';
import crypto from 'crypto';
import GameEventsService from './game-events.service';

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
   * Get game state from Redis
   */
  static async getGameState(gameId: string): Promise<BaseGameState | null> {
    try {
      const key = `${GAME_KEY_PREFIX}${gameId}`;
      const gameStateJson = await RedisService.get(key);
      
      if (!gameStateJson) {
        return null;
      }
      
      const gameState = JSON.parse(gameStateJson) as BaseGameState;
      
      console.log('📖 Loading game state from Redis');
      console.log('📖 Serialized chess data:', JSON.stringify((gameState.chess as any), null, 2));
      
      // Reconstruct Chess instance properly
      const Chess = require('chess.js').Chess;
      const chess = new Chess();
      
      // Handle different serialization formats
      if (gameState.chess && typeof gameState.chess === 'object') {
        const chessData = gameState.chess as any;
        
        // If we have move history, replay the moves to get proper chess.js state
        if (chessData.history && Array.isArray(chessData.history) && chessData.history.length > 0) {
          console.log('📖 Replaying moves:', chessData.history);
          try {
            for (const move of chessData.history) {
              const result = chess.move(move);
              if (!result) {
                console.error('📖 Failed to replay move:', move);
                break;
              }
            }
            console.log('📖 After replaying moves, FEN:', chess.fen());
            
            // CRITICAL: If we have a serialized FEN that differs from the replayed state,
            // use the serialized FEN as it represents the authoritative state
            // (e.g., after tactical retreats that don't correspond to chess.js moves)
            if (chessData.fen && chessData.fen !== chess.fen()) {
              console.log('📖 Using serialized FEN as authoritative state:', chessData.fen);
              chess.load(chessData.fen);
            }
          } catch (error) {
            console.error('📖 Error replaying moves:', error);
            // Fallback to FEN if available
            const currentFen = chessData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
            chess.load(currentFen);
            console.log('📖 Fallback to FEN:', currentFen);
          }
        } else if (chessData.fen && typeof chessData.fen === 'string') {
          // Use FEN directly if no history
          chess.load(chessData.fen);
          console.log('📖 Loaded from FEN:', chessData.fen);
        }
      }
      
      // Replace the serialized chess object with the reconstructed instance
      gameState.chess = chess;
      
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
    
    if (event) {
      await this.emitGameEvent(event);
    }
    
    // Check if game is completed and should be moved to database
    if (this.isGameCompleted(gameState)) {
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
  static async emitGameEvent(event: GameEvent): Promise<void> {
    try {
      const eventsKey = `${GAME_EVENTS_KEY_PREFIX}${event.gameId}`;
      
      // Store event in Redis for event history (with shorter TTL)
      const eventJson = JSON.stringify(event);
      await RedisService.setWithTTL(eventsKey, eventJson, 60 * 60); // 1 hour
      
      // Process event through GameEventsService for Socket.IO broadcasting
      await GameEventsService.processGameEvent(event);
      
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
  private static isGameCompleted(gameState: BaseGameState): boolean {
    return [
      GameStatus.CHECKMATE,
      GameStatus.STALEMATE,
      GameStatus.DRAW,
      GameStatus.ABANDONED
    ].includes(gameState.gameStatus);
  }
  
  /**
   * Archive completed game to database and remove from Redis
   */
  private static archiveCompletedGame(gameId: string, gameState: BaseGameState): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Update database with final game state
        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: convertToPrismaGameStatus(gameState.gameStatus),
            moveHistory: gameState.moveHistory as any,
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
            const Chess = require('chess.js').Chess;
            const chess = new Chess();
            
            if (gameState.chess && typeof gameState.chess === 'object') {
              const chessData = gameState.chess as any;
              
              if (chessData.history && Array.isArray(chessData.history) && chessData.history.length > 0) {
                try {
                  for (const move of chessData.history) {
                    chess.move(move);
                  }
                } catch (error) {
                  console.error('Error replaying moves in getWaitingGames:', error);
                  const currentFen = chessData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                  chess.load(currentFen);
                }
              } else if (chessData.fen) {
                chess.load(chessData.fen);
              }
            }
            
            gameState.chess = chess;
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