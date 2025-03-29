import { PieceColor } from '@gambit-chess/shared';
import { PlayerSession } from '../types/PlayerSession';

/**
 * Interface for managing player sessions
 * Handles player connections, game assignments, and session data
 */
export interface IPlayerSessionManager {
  /**
   * Registers a new player session
   * @param playerId Unique player identifier
   * @param playerInfo Player information
   * @returns The created player session
   */
  registerPlayer(playerId: string, playerInfo: any): PlayerSession;
  
  /**
   * Gets a player's session by ID
   * @param playerId Unique player identifier
   * @returns Player session or null if not found
   */
  getPlayerSession(playerId: string): PlayerSession | null;
  
  /**
   * Assigns a player to a game
   * @param playerId Unique player identifier
   * @param gameId Unique game identifier
   * @param color Player's color in the game
   * @returns Success indicator
   */
  assignPlayerToGame(playerId: string, gameId: string, color: PieceColor): boolean;
  
  /**
   * Removes a player from their current game
   * @param playerId Unique player identifier
   * @returns Success indicator
   */
  removePlayerFromGame(playerId: string): boolean;
  
  /**
   * Checks if a player is in a game
   * @param playerId Unique player identifier
   * @returns True if the player is in a game
   */
  isPlayerInGame(playerId: string): boolean;
  
  /**
   * Gets the game ID a player is in
   * @param playerId Unique player identifier
   * @returns Game ID or null if not in a game
   */
  getPlayerGame(playerId: string): string | null;
  
  /**
   * Gets the player ID for a specific game and color
   * @param gameId Unique game identifier
   * @param color Player color
   * @returns Player ID or null if not found
   */
  getPlayerIdByGameAndColor(gameId: string, color: PieceColor): string | null;
  
  /**
   * Marks a player as connected
   * @param playerId Unique player identifier
   */
  setPlayerConnected(playerId: string): void;
  
  /**
   * Marks a player as disconnected
   * @param playerId Unique player identifier
   */
  setPlayerDisconnected(playerId: string): void;
  
  /**
   * Checks if a player is connected
   * @param playerId Unique player identifier
   * @returns True if the player is connected
   */
  isPlayerConnected(playerId: string): boolean;
  
  /**
   * Gets all players in a game
   * @param gameId Unique game identifier
   * @returns Array of player IDs
   */
  getPlayersInGame(gameId: string): string[];
} 