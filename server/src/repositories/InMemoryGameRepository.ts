import { IGameRepository } from '../interfaces/IGameRepository';
import { GameState } from '../types/GameState';

/**
 * In-memory implementation of IGameRepository for testing
 * Stores game states in memory without persistence
 */
export class InMemoryGameRepository implements IGameRepository {
  // In-memory storage for game states
  private gameStates: Map<string, GameState> = new Map();
  
  /**
   * Saves a game state to memory
   * @param gameId Unique game identifier
   * @param state Current game state
   */
  public async saveGame(gameId: string, state: GameState): Promise<void> {
    this.gameStates.set(gameId, { ...state });
  }
  
  /**
   * Loads a game state from memory
   * @param gameId Unique game identifier
   * @returns Game state or null if not found
   */
  public async loadGame(gameId: string): Promise<GameState | null> {
    const state = this.gameStates.get(gameId);
    return state ? { ...state } : null;
  }
  
  /**
   * Lists all active game IDs
   * @returns Array of active game IDs
   */
  public async listActiveGames(): Promise<string[]> {
    return Array.from(this.gameStates.keys());
  }
  
  /**
   * Deletes a game from memory
   * @param gameId Unique game identifier
   */
  public async deleteGame(gameId: string): Promise<void> {
    this.gameStates.delete(gameId);
  }
  
  /**
   * Checks if a game exists in memory
   * @param gameId Unique game identifier
   * @returns True if the game exists
   */
  public async gameExists(gameId: string): Promise<boolean> {
    return this.gameStates.has(gameId);
  }
  
  /**
   * Updates game metadata without replacing the entire state
   * @param gameId Unique game identifier
   * @param metadata Metadata to update
   */
  public async updateGameMetadata(gameId: string, metadata: Record<string, any>): Promise<void> {
    const state = this.gameStates.get(gameId);
    if (state) {
      this.gameStates.set(gameId, {
        ...state,
        metadata: {
          ...state.metadata,
          ...metadata
        },
        updatedAt: Date.now()
      });
    }
  }
} 