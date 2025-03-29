import { PieceColor } from '@gambit-chess/shared';

/**
 * Represents a player session
 * Tracks player information and game assignment
 */
export interface PlayerSession {
  /**
   * Unique player identifier
   */
  playerId: string;
  
  /**
   * Player's display name
   */
  displayName: string;
  
  /**
   * ID of the game the player is in, or null if not in a game
   */
  gameId: string | null;
  
  /**
   * Player's color in the game, or null if not in a game
   */
  color: PieceColor | null;
  
  /**
   * Whether the player is currently connected
   */
  connected: boolean;
  
  /**
   * Timestamp of player's last action
   */
  lastActiveTime: number;
  
  /**
   * Connection metadata (e.g., IP, user agent)
   */
  connectionMetadata: Record<string, any>;
  
  /**
   * Player preferences and settings
   */
  preferences: Record<string, any>;
  
  /**
   * Custom player data
   */
  userData: Record<string, any>;
} 