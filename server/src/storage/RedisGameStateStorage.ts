import { redis } from '../services/redis';
import { GameStateStorage } from './GameStateStorage';
import { logger } from '../utils/logger';

/**
 * Redis implementation of the GameStateStorage interface
 */
export class RedisGameStateStorage implements GameStateStorage {
  private readonly keyPrefix: string = 'game:';
  
  /**
   * Get a game state by ID
   * @param gameId The unique game identifier
   * @returns The game state or null if not found
   */
  public async getGameState(gameId: string): Promise<any | null> {
    try {
      return await redis.game.get(gameId);
    } catch (error) {
      logger.error('Failed to get game state from Redis', { error, gameId });
      return null;
    }
  }
  
  /**
   * Save a game state
   * @param gameId The unique game identifier
   * @param gameState The game state to save
   * @param expirySeconds Optional expiry time in seconds
   */
  public async saveGameState(gameId: string, gameState: any, expirySeconds?: number): Promise<void> {
    try {
      await redis.game.save(gameId, gameState, expirySeconds);
    } catch (error) {
      logger.error('Failed to save game state to Redis', { error, gameId });
    }
  }
  
  /**
   * Delete a game state
   * @param gameId The unique game identifier
   */
  public async deleteGameState(gameId: string): Promise<void> {
    try {
      await redis.game.delete(gameId);
    } catch (error) {
      logger.error('Failed to delete game state from Redis', { error, gameId });
    }
  }
} 