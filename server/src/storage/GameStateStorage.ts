/**
 * Interface for game state persistence
 * This abstraction allows decoupling the game engine from specific storage implementations
 */
export interface GameStateStorage {
  /**
   * Get a game state by ID
   * @param gameId The unique game identifier
   * @returns The game state or null if not found
   */
  getGameState(gameId: string): Promise<any | null>;
  
  /**
   * Save a game state
   * @param gameId The unique game identifier
   * @param gameState The game state to save
   * @param expirySeconds Optional expiry time in seconds
   */
  saveGameState(gameId: string, gameState: any, expirySeconds?: number): Promise<void>;
  
  /**
   * Delete a game state
   * @param gameId The unique game identifier
   */
  deleteGameState(gameId: string): Promise<void>;
} 