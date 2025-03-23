import { GameStateStorage } from './GameStateStorage';
import { logger } from '../utils/logger';

/**
 * In-memory implementation of GameStateStorage for testing purposes
 */
export class InMemoryGameStateStorage implements GameStateStorage {
  private gameStates: Map<string, any> = new Map();
  private expiryTimestamps: Map<string, number> = new Map();
  
  /**
   * Get a game state by ID
   * @param gameId The unique game identifier
   * @returns The game state or null if not found
   */
  public async getGameState(gameId: string): Promise<any | null> {
    try {
      this.checkExpiry(gameId);
      return this.gameStates.get(gameId) || null;
    } catch (error) {
      logger.error('Failed to get game state from memory', { error, gameId });
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
      // Deep clone the state to simulate Redis storing a copy
      this.gameStates.set(gameId, JSON.parse(JSON.stringify(gameState)));
      
      // Set expiry if provided
      if (expirySeconds) {
        const expiryTimestamp = Date.now() + (expirySeconds * 1000);
        this.expiryTimestamps.set(gameId, expiryTimestamp);
      }
    } catch (error) {
      logger.error('Failed to save game state to memory', { error, gameId });
    }
  }
  
  /**
   * Delete a game state
   * @param gameId The unique game identifier
   */
  public async deleteGameState(gameId: string): Promise<void> {
    try {
      this.gameStates.delete(gameId);
      this.expiryTimestamps.delete(gameId);
    } catch (error) {
      logger.error('Failed to delete game state from memory', { error, gameId });
    }
  }
  
  /**
   * Check if a game state has expired and delete it if necessary
   * @param gameId The unique game identifier
   */
  private checkExpiry(gameId: string): void {
    const expiryTimestamp = this.expiryTimestamps.get(gameId);
    
    if (expiryTimestamp && Date.now() > expiryTimestamp) {
      this.gameStates.delete(gameId);
      this.expiryTimestamps.delete(gameId);
    }
  }
  
  /**
   * Clear all game states (for testing)
   */
  public clear(): void {
    this.gameStates.clear();
    this.expiryTimestamps.clear();
  }
  
  /**
   * Get the number of stored game states (for testing)
   */
  public size(): number {
    return this.gameStates.size;
  }
} 