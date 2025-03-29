import { createClient, RedisClientType } from 'redis';
import { IGameRepository } from '../interfaces/IGameRepository';
import { GameState } from '../types/GameState';
import { env, REDIS_OPTIONS, REDIS_KEYS, REDIS_TTL } from '../config';

/**
 * Redis implementation of IGameRepository
 * Persists game states in Redis
 */
export class RedisGameRepository implements IGameRepository {
  private client: RedisClientType;
  private readonly gameKeyPrefix: string = REDIS_KEYS.GAME_PREFIX;
  private readonly activeGamesKey: string = REDIS_KEYS.ACTIVE_GAMES;
  private isConnected: boolean = false;
  
  /**
   * Creates a new Redis game repository
   * 
   * @param redisOptions Redis connection options (defaults to config)
   */
  constructor(redisOptions = REDIS_OPTIONS) {
    this.client = createClient(redisOptions);
    
    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to Redis');
    });
    
    this.client.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from Redis');
    });
  }
  
  /**
   * Connects to Redis if not already connected
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }
  
  /**
   * Gets the full key for a game
   * @param gameId Unique game identifier
   * @returns Redis key
   */
  private getGameKey(gameId: string): string {
    return `${this.gameKeyPrefix}${gameId}`;
  }
  
  /**
   * Saves a game state to Redis
   * @param gameId Unique game identifier
   * @param state Current game state
   */
  public async saveGame(gameId: string, state: GameState): Promise<void> {
    await this.ensureConnection();
    
    // Save the game state
    const serialized = JSON.stringify(this.prepareForSerialization(state));
    await this.client.setEx(
      this.getGameKey(gameId), 
      REDIS_TTL.GAME_STATE, 
      serialized
    );
    
    // Add to active games set if not already present
    await this.client.sAdd(this.activeGamesKey, gameId);
  }
  
  /**
   * Loads a game state from Redis
   * @param gameId Unique game identifier
   * @returns Game state or null if not found
   */
  public async loadGame(gameId: string): Promise<GameState | null> {
    await this.ensureConnection();
    
    const serialized = await this.client.get(this.getGameKey(gameId));
    if (!serialized) {
      return null;
    }
    
    try {
      return this.restoreFromSerialization(JSON.parse(serialized));
    } catch (error) {
      console.error(`Error parsing game state for ${gameId}:`, error);
      return null;
    }
  }
  
  /**
   * Lists all active game IDs
   * @returns Array of active game IDs
   */
  public async listActiveGames(): Promise<string[]> {
    await this.ensureConnection();
    
    return await this.client.sMembers(this.activeGamesKey);
  }
  
  /**
   * Deletes a game from Redis
   * @param gameId Unique game identifier
   */
  public async deleteGame(gameId: string): Promise<void> {
    await this.ensureConnection();
    
    // Remove from active games set
    await this.client.sRem(this.activeGamesKey, gameId);
    
    // Delete the game state
    await this.client.del(this.getGameKey(gameId));
  }
  
  /**
   * Checks if a game exists in Redis
   * @param gameId Unique game identifier
   * @returns True if the game exists
   */
  public async gameExists(gameId: string): Promise<boolean> {
    await this.ensureConnection();
    
    return (await this.client.exists(this.getGameKey(gameId))) === 1;
  }
  
  /**
   * Updates game metadata without replacing the entire state
   * @param gameId Unique game identifier
   * @param metadata Metadata to update
   */
  public async updateGameMetadata(gameId: string, metadata: Record<string, any>): Promise<void> {
    await this.ensureConnection();
    
    // Load the current state
    const state = await this.loadGame(gameId);
    if (!state) {
      return;
    }
    
    // Update metadata
    state.metadata = {
      ...state.metadata,
      ...metadata
    };
    state.updatedAt = Date.now();
    
    // Save the updated state
    await this.saveGame(gameId, state);
  }
  
  /**
   * Prepares a game state for serialization
   * Handles circular references and non-serializable objects
   * @param state Game state to prepare
   * @returns Serializable game state
   */
  private prepareForSerialization(state: GameState): any {
    // Create a deep copy to avoid modifying the original
    const copy = JSON.parse(JSON.stringify({
      ...state,
      // Handle the board specially
      board: {
        pieces: state.board.getAllPieces(),
        currentTurn: state.board.getCurrentTurn(),
        activePlayer: state.board.getActivePlayer(),
        enPassantTarget: state.board.getEnPassantTarget(),
        // Other board state that needs to be preserved
        capturedPieces: state.board.getCapturedPieces(),
        // Save these separately as needed - we recreate them when restoring
        moveHistory: state.moveHistory
      }
    }));
    
    return copy;
  }
  
  /**
   * Restores a game state from serialization
   * @param serialized Serialized game state
   * @returns Restored game state
   */
  private restoreFromSerialization(serialized: any): GameState {
    // Create a new board
    const board = new (require('../models/Board').Board)(false);
    
    // Restore board state
    if (serialized.board) {
      // Add all pieces
      for (const piece of serialized.board.pieces) {
        board.addPiece(piece.type, piece.color, piece.position);
      }
      
      // Set active player
      if (serialized.board.activePlayer) {
        board.setActivePlayer(serialized.board.activePlayer);
      }
      
      // Set other board state as needed
      // This would need to be expanded based on what board state needs to be preserved
    }
    
    // Reconstruct the complete game state
    return {
      ...serialized,
      board, // Replace with the reconstructed board
      moveHistory: serialized.moveHistory || [],
      metadata: serialized.metadata || {}
    };
  }
  
  /**
   * Closes the Redis connection
   */
  public async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }
} 