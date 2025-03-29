import { 
  GamePhase, 
  PieceColor, 
  GameResult, 
  Move
} from '@gambit-chess/shared';
import { Board } from '../models/Board';

/**
 * Represents the complete state of a game
 * Used for persistence and reconstruction
 */
export interface GameState {
  /**
   * Unique game identifier
   */
  gameId: string;
  
  /**
   * Current game board state
   */
  board: Board;
  
  /**
   * Current game phase
   */
  currentPhase: GamePhase;
  
  /**
   * Color of the player whose turn it is
   */
  playerToMove: PieceColor;
  
  /**
   * Game result if the game is complete, null otherwise
   */
  gameResult: GameResult | null;
  
  /**
   * Complete move history
   */
  moveHistory: Move[];
  
  /**
   * Timestamp when the game was created
   */
  createdAt: number;
  
  /**
   * Timestamp of the last update to the game state
   */
  updatedAt: number;
  
  /**
   * White player's remaining time in milliseconds
   */
  whiteTimeRemaining: number;
  
  /**
   * Black player's remaining time in milliseconds
   */
  blackTimeRemaining: number;
  
  /**
   * Color of the player whose timer is currently active, or null if timers are paused
   */
  activeTimer: PieceColor | null;
  
  /**
   * State sequence number for reconciliation
   */
  sequenceNumber: number;
  
  /**
   * White player's BP pool
   */
  whiteBpPool: number;
  
  /**
   * Black player's BP pool
   */
  blackBpPool: number;
  
  /**
   * Arbitrary metadata for the game (e.g., player names, game mode)
   */
  metadata: Record<string, any>;
} 