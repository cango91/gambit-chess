import { DuelOutcome, MoveType, PieceType, PlayerColor, Position } from './index';

/**
 * Represents a move in standard algebraic notation with extensions for Gambit Chess
 */
export interface MoveNotation {
  /**
   * Unique identifier for the move
   */
  id: string;
  
  /**
   * Move number (e.g., 1 for White's first move, 1.5 for Black's first move)
   * Using half moves where whole numbers are White's moves
   */
  moveNumber: number;
  
  /**
   * Player who made the move
   */
  player: PlayerColor;
  
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
   * Related duel (if move triggered a duel)
   */
  duel?: DuelNotation;
  
  /**
   * Related tactical retreat (if a duel resulted in a retreat)
   */
  tacticalRetreat?: TacticalRetreatNotation;
  
  /**
   * Standard algebraic notation (SAN) representation
   * e.g., "Nf3", "exd5", "O-O", "Qxf7#"
   */
  san: string;
  
  /**
   * Extended notation for Gambit Chess (includes BP information)
   */
  extended: string;
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
   * Outcome of the duel
   */
  outcome: DuelOutcome;
  
  /**
   * Standard notation representation of the duel
   * e.g., "R⚔️N:R+" (Rook attacks Knight, Rook wins)
   */
  notation: string;
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
   * Target position for the retreat in algebraic notation
   */
  to: string;
  
  /**
   * Standard notation representation of the retreat
   * e.g., "B↩️c4" (Bishop retreats to c4)
   */
  notation: string;
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

/**
 * Convert a position to algebraic notation
 * @param position Position object (x,y coordinates)
 * @returns String in algebraic notation (e.g., "e4")
 */
export function positionToNotation(position: Position): string {
  const file = String.fromCharCode(97 + position.x); // 'a' = 97 in ASCII
  const rank = position.y + 1; // Chess ranks start at 1
  return `${file}${rank}`;
}

/**
 * Convert algebraic notation to a position
 * @param notation String in algebraic notation (e.g., "e4")
 * @returns Position object
 */
export function notationToPosition(notation: string): Position {
  const file = notation.charCodeAt(0) - 97; // 'a' = 97 in ASCII
  const rank = parseInt(notation.substring(1)) - 1; // Chess ranks start at 1
  return { x: file, y: rank };
}

/**
 * Get the piece symbol for notation
 * @param pieceType The type of piece
 * @returns Symbol representing the piece (e.g., "N" for Knight)
 */
export function getPieceSymbol(pieceType: PieceType): string {
  switch (pieceType) {
    case PieceType.PAWN:
      return '';
    case PieceType.KNIGHT:
      return 'N';
    case PieceType.BISHOP:
      return 'B';
    case PieceType.ROOK:
      return 'R';
    case PieceType.QUEEN:
      return 'Q';
    case PieceType.KING:
      return 'K';
    default:
      return '?';
  }
} 