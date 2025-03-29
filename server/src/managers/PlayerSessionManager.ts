import { PieceColor } from '@gambit-chess/shared';
import { IPlayerSessionManager } from '../interfaces/IPlayerSessionManager';
import { PlayerSession } from '../types/PlayerSession';

/**
 * Manages player sessions and connections
 * Implements IPlayerSessionManager interface
 */
export class PlayerSessionManager implements IPlayerSessionManager {
  // Map of player ID to player session
  private sessions: Map<string, PlayerSession> = new Map();
  
  // Map of game ID to player IDs by color
  private gamePlayerMap: Map<string, { white: string | null, black: string | null }> = new Map();
  
  /**
   * Registers a new player session
   * @param playerId Unique player identifier
   * @param playerInfo Player information
   * @returns The created player session
   */
  public registerPlayer(playerId: string, playerInfo: any): PlayerSession {
    const session: PlayerSession = {
      playerId,
      displayName: playerInfo.displayName || `Player_${playerId.substring(0, 5)}`,
      gameId: null,
      color: null,
      connected: true,
      lastActiveTime: Date.now(),
      connectionMetadata: playerInfo.connectionMetadata || {},
      preferences: playerInfo.preferences || {},
      userData: playerInfo.userData || {}
    };
    
    this.sessions.set(playerId, session);
    return session;
  }
  
  /**
   * Gets a player's session by ID
   * @param playerId Unique player identifier
   * @returns Player session or null if not found
   */
  public getPlayerSession(playerId: string): PlayerSession | null {
    return this.sessions.get(playerId) || null;
  }
  
  /**
   * Assigns a player to a game
   * @param playerId Unique player identifier
   * @param gameId Unique game identifier
   * @param color Player's color in the game
   * @returns Success indicator
   */
  public assignPlayerToGame(playerId: string, gameId: string, color: PieceColor): boolean {
    const session = this.sessions.get(playerId);
    if (!session) {
      return false;
    }
    
    // If the player is already in a game, remove them first
    if (session.gameId) {
      this.removePlayerFromGame(playerId);
    }
    
    // Update the player's session
    session.gameId = gameId;
    session.color = color;
    session.lastActiveTime = Date.now();
    
    // Update the game player map
    const gamePlayers = this.gamePlayerMap.get(gameId) || { white: null, black: null };
    if (color === 'white') {
      gamePlayers.white = playerId;
    } else {
      gamePlayers.black = playerId;
    }
    
    this.gamePlayerMap.set(gameId, gamePlayers);
    return true;
  }
  
  /**
   * Removes a player from their current game
   * @param playerId Unique player identifier
   * @returns Success indicator
   */
  public removePlayerFromGame(playerId: string): boolean {
    const session = this.sessions.get(playerId);
    if (!session || !session.gameId || !session.color) {
      return false;
    }
    
    const gameId = session.gameId;
    const color = session.color;
    
    // Update the game player map
    const gamePlayers = this.gamePlayerMap.get(gameId);
    if (gamePlayers) {
      if (color === 'white') {
        gamePlayers.white = null;
      } else {
        gamePlayers.black = null;
      }
      
      // If both players are gone, remove the game entry
      if (!gamePlayers.white && !gamePlayers.black) {
        this.gamePlayerMap.delete(gameId);
      } else {
        this.gamePlayerMap.set(gameId, gamePlayers);
      }
    }
    
    // Update the player's session
    session.gameId = null;
    session.color = null;
    
    return true;
  }
  
  /**
   * Checks if a player is in a game
   * @param playerId Unique player identifier
   * @returns True if the player is in a game
   */
  public isPlayerInGame(playerId: string): boolean {
    const session = this.sessions.get(playerId);
    return !!(session && session.gameId);
  }
  
  /**
   * Gets the game ID a player is in
   * @param playerId Unique player identifier
   * @returns Game ID or null if not in a game
   */
  public getPlayerGame(playerId: string): string | null {
    const session = this.sessions.get(playerId);
    return session ? session.gameId : null;
  }
  
  /**
   * Gets the player ID for a specific game and color
   * @param gameId Unique game identifier
   * @param color Player color
   * @returns Player ID or null if not found
   */
  public getPlayerIdByGameAndColor(gameId: string, color: PieceColor): string | null {
    const gamePlayers = this.gamePlayerMap.get(gameId);
    if (!gamePlayers) {
      return null;
    }
    
    return color === 'white' ? gamePlayers.white : gamePlayers.black;
  }
  
  /**
   * Marks a player as connected
   * @param playerId Unique player identifier
   */
  public setPlayerConnected(playerId: string): void {
    const session = this.sessions.get(playerId);
    if (session) {
      session.connected = true;
      session.lastActiveTime = Date.now();
    }
  }
  
  /**
   * Marks a player as disconnected
   * @param playerId Unique player identifier
   */
  public setPlayerDisconnected(playerId: string): void {
    const session = this.sessions.get(playerId);
    if (session) {
      session.connected = false;
      session.lastActiveTime = Date.now();
    }
  }
  
  /**
   * Checks if a player is connected
   * @param playerId Unique player identifier
   * @returns True if the player is connected
   */
  public isPlayerConnected(playerId: string): boolean {
    const session = this.sessions.get(playerId);
    return !!(session && session.connected);
  }
  
  /**
   * Gets all players in a game
   * @param gameId Unique game identifier
   * @returns Array of player IDs
   */
  public getPlayersInGame(gameId: string): string[] {
    const gamePlayers = this.gamePlayerMap.get(gameId);
    if (!gamePlayers) {
      return [];
    }
    
    const players: string[] = [];
    if (gamePlayers.white) {
      players.push(gamePlayers.white);
    }
    if (gamePlayers.black) {
      players.push(gamePlayers.black);
    }
    
    return players;
  }
} 