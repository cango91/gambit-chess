import { GameState } from '../types/GameState';

/**
 * Interface for game state persistence
 * Abstracts storage mechanism for game state data
 */
export interface IGameRepository {
  /**
   * Saves a game state to the repository
   * @param gameId Unique game identifier
   * @param state Current game state
   */
  saveGame(gameId: string, state: GameState): Promise<void>;
  
  /**
   * Loads a game state from the repository
   * @param gameId Unique game identifier
   * @returns Game state or null if not found
   */
  loadGame(gameId: string): Promise<GameState | null>;
  
  /**
   * Lists all active game IDs
   * @returns Array of active game IDs
   */
  listActiveGames(): Promise<string[]>;
  
  /**
   * Deletes a game from the repository
   * @param gameId Unique game identifier
   */
  deleteGame(gameId: string): Promise<void>;
  
  /**
   * Checks if a game exists
   * @param gameId Unique game identifier
   * @returns True if the game exists
   */
  gameExists(gameId: string): Promise<boolean>;
  
  /**
   * Updates game metadata without replacing the entire state
   * @param gameId Unique game identifier
   * @param metadata Metadata to update
   */
  updateGameMetadata(gameId: string, metadata: Record<string, any>): Promise<void>;
} 