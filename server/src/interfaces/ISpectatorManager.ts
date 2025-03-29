/**
 * Interface for managing spectators
 * Handles spectator sessions and game observation
 */
export interface ISpectatorManager {
  /**
   * Adds a spectator to a game
   * @param spectatorId Unique spectator identifier
   * @param gameId Unique game identifier
   * @returns Success indicator
   */
  addSpectator(spectatorId: string, gameId: string): boolean;
  
  /**
   * Removes a spectator from a game
   * @param spectatorId Unique spectator identifier
   * @returns Success indicator
   */
  removeSpectator(spectatorId: string): boolean;
  
  /**
   * Gets all spectators for a specific game
   * @param gameId Unique game identifier
   * @returns Array of spectator IDs
   */
  getSpectators(gameId: string): string[];
  
  /**
   * Checks if a user is a spectator for a game
   * @param spectatorId Unique spectator identifier
   * @param gameId Unique game identifier
   * @returns True if the user is a spectator for the game
   */
  isSpectator(spectatorId: string, gameId: string): boolean;
  
  /**
   * Gets the game a spectator is watching
   * @param spectatorId Unique spectator identifier
   * @returns Game ID or null if not spectating
   */
  getSpectatedGame(spectatorId: string): string | null;
  
  /**
   * Updates spectator information
   * @param spectatorId Unique spectator identifier
   * @param info Spectator information
   */
  updateSpectatorInfo(spectatorId: string, info: Record<string, any>): void;
  
  /**
   * Gets spectator information
   * @param spectatorId Unique spectator identifier
   * @returns Spectator information or null if not found
   */
  getSpectatorInfo(spectatorId: string): Record<string, any> | null;
} 