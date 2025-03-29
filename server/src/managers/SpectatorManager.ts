import { ISpectatorManager } from '../interfaces/ISpectatorManager';

/**
 * Manages spectator sessions and game observation
 * Implements ISpectatorManager interface
 */
export class SpectatorManager implements ISpectatorManager {
  // Map of game ID to spectator IDs
  private gameSpectators: Map<string, Set<string>> = new Map();
  
  // Map of spectator ID to game ID
  private spectatorGame: Map<string, string> = new Map();
  
  // Map of spectator ID to info
  private spectatorInfo: Map<string, Record<string, any>> = new Map();
  
  /**
   * Adds a spectator to a game
   * @param spectatorId Unique spectator identifier
   * @param gameId Unique game identifier
   * @returns Success indicator
   */
  public addSpectator(spectatorId: string, gameId: string): boolean {
    // If spectator is already watching a game, remove them first
    this.removeSpectator(spectatorId);
    
    // Add spectator to the game
    let spectators = this.gameSpectators.get(gameId);
    if (!spectators) {
      spectators = new Set<string>();
      this.gameSpectators.set(gameId, spectators);
    }
    
    spectators.add(spectatorId);
    this.spectatorGame.set(spectatorId, gameId);
    
    // Initialize spectator info if not exists
    if (!this.spectatorInfo.has(spectatorId)) {
      this.spectatorInfo.set(spectatorId, {
        joinedAt: Date.now(),
        lastActive: Date.now()
      });
    }
    
    return true;
  }
  
  /**
   * Removes a spectator from a game
   * @param spectatorId Unique spectator identifier
   * @returns Success indicator
   */
  public removeSpectator(spectatorId: string): boolean {
    const gameId = this.spectatorGame.get(spectatorId);
    if (!gameId) {
      return false;
    }
    
    // Remove from game spectators
    const spectators = this.gameSpectators.get(gameId);
    if (spectators) {
      spectators.delete(spectatorId);
      
      // If no spectators left, clean up
      if (spectators.size === 0) {
        this.gameSpectators.delete(gameId);
      }
    }
    
    // Remove from spectator game map
    this.spectatorGame.delete(spectatorId);
    
    return true;
  }
  
  /**
   * Gets all spectators for a specific game
   * @param gameId Unique game identifier
   * @returns Array of spectator IDs
   */
  public getSpectators(gameId: string): string[] {
    const spectators = this.gameSpectators.get(gameId);
    return spectators ? Array.from(spectators) : [];
  }
  
  /**
   * Checks if a user is a spectator for a game
   * @param spectatorId Unique spectator identifier
   * @param gameId Unique game identifier
   * @returns True if the user is a spectator for the game
   */
  public isSpectator(spectatorId: string, gameId: string): boolean {
    const spectatorGameId = this.spectatorGame.get(spectatorId);
    return spectatorGameId === gameId;
  }
  
  /**
   * Gets the game a spectator is watching
   * @param spectatorId Unique spectator identifier
   * @returns Game ID or null if not spectating
   */
  public getSpectatedGame(spectatorId: string): string | null {
    return this.spectatorGame.get(spectatorId) || null;
  }
  
  /**
   * Updates spectator information
   * @param spectatorId Unique spectator identifier
   * @param info Spectator information
   */
  public updateSpectatorInfo(spectatorId: string, info: Record<string, any>): void {
    const currentInfo = this.spectatorInfo.get(spectatorId) || {};
    this.spectatorInfo.set(spectatorId, {
      ...currentInfo,
      ...info,
      lastActive: Date.now()
    });
  }
  
  /**
   * Gets spectator information
   * @param spectatorId Unique spectator identifier
   * @returns Spectator information or null if not found
   */
  public getSpectatorInfo(spectatorId: string): Record<string, any> | null {
    return this.spectatorInfo.get(spectatorId) || null;
  }
} 