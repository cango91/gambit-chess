/**
 * Interface for game configuration
 * Contains settings for game initialization and rules
 */
export interface IGameConfig {
  /**
   * Initial BP pool for each player
   */
  initialBpPool: number;
  
  /**
   * Maximum BP a piece can have
   */
  maxBpCapacity: number;
  
  /**
   * Initial time for white player in milliseconds
   * 0 means no time limit
   */
  initialTimeWhite: number;
  
  /**
   * Initial time for black player in milliseconds
   * 0 means no time limit
   */
  initialTimeBlack: number;
  
  /**
   * Increment added after each move in milliseconds
   */
  timeIncrement: number;
  
  /**
   * Whether to allow spectators
   */
  allowSpectators: boolean;
  
  /**
   * Delay for spectator view in milliseconds (anti-cheat)
   */
  spectatorDelay: number;
  
  /**
   * Maximum time for reconnection in milliseconds
   */
  reconnectionWindow: number;
  
  /**
   * BP regeneration value for check
   */
  checkBpRegeneration: number;
  
  /**
   * Whether to use standard chess starting position
   */
  standardPosition: boolean;
  
  /**
   * Custom starting position in FEN notation (optional)
   */
  customPositionFen?: string;
  
  /**
   * Whether to enforce standard chess draw rules
   */
  enforceDrawRules: boolean;
} 