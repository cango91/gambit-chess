import { DuelOutcome, MoveType, PieceType, PlayerColor } from './index';

/**
 * Represents a move in standard algebraic notation with extensions for Gambit Chess
 */
export interface MoveNotation {
  /**
   * Unique identifier for the move
   */
  id: string;
  
  /**
   * Piece that was moved
   */
  piece: PieceType;
  
  /**
   * Starting position in algebraic notation (e.g., "e2")
   */
  from: string;
  
  /**
   * Target position in algebraic notation (e.g., "e4")
   */
  to: string;
  
  /**
   * Type of move
   */
  moveType: MoveType;
  
  /**
   * Captured piece type (if any)
   */
  capturedPiece?: PieceType;
  
  /**
   * Piece type after promotion (if applicable)
   */
  promotedTo?: PieceType;
  
  /**
   * Whether the move resulted in check
   */
  isCheck: boolean;
  
  /**
   * Whether the move resulted in checkmate
   */
  isCheckmate: boolean;
  
  /**
   * Standard algebraic notation (SAN) representation
   * e.g., "Nf3", "exd5", "O-O", "Qxf7#"
   */
  san: string;
}

/**
 * Represents a duel in Gambit Chess notation
 */
export interface DuelNotation {
  /**
   * Unique identifier for the duel
   */
  id: string;
  
  /**
   * Attacker's piece type
   */
  attackerPiece: PieceType;
  
  /**
   * Defender's piece type
   */
  defenderPiece: PieceType;
  
  /**
   * Attacker's position in algebraic notation
   */
  attackerPosition: string;
  
  /**
   * Defender's position in algebraic notation
   */
  defenderPosition: string;
  
  /**
   * Outcome of the duel
   */
  outcome: DuelOutcome;
}

/**
 * Represents a tactical retreat after a failed capture attempt
 */
export interface TacticalRetreatNotation {
  /**
   * Unique identifier for the retreat
   */
  id: string;
  
  /**
   * Retreating piece type
   */
  piece: PieceType;
  
  /**
   * Original position before the retreat in algebraic notation
   */
  from: string;
  
  /**
   * Target position for the retreat in algebraic notation
   */
  to: string;
  
  /**
   * Position of the failed capture attempt in algebraic notation
   */
  failedCapturePosition: string;
}

/**
 * Represents the complete game history
 */
export interface GameHistory {
  /**
   * Array of moves in the game
   */
  moves: MoveNotation[];
  
  /**
   * Get a string representation of the full game history
   */
  toString: () => string;
} 