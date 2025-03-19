import { BP_CAPACITY, PieceType, PlayerColor, Position } from '../types';

/**
 * Check if a piece is a long-range piece (bishop, rook, queen)
 * @param pieceType The type of the piece
 * @returns True if the piece is long-range
 */
export function isLongRangePiece(pieceType: PieceType): boolean {
  return (
    pieceType === PieceType.BISHOP ||
    pieceType === PieceType.ROOK ||
    pieceType === PieceType.QUEEN
  );
}

/**
 * Get the BP capacity for a piece type
 * @param pieceType The type of the piece
 * @returns The BP capacity
 */
export function getBPCapacity(pieceType: PieceType): number {
  return BP_CAPACITY[pieceType];
}

/**
 * Check if a position is within the board boundaries
 * @param position The position to check
 * @returns True if the position is valid
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.x >= 0 && position.x < 8 && 
    position.y >= 0 && position.y < 8
  );
}

/**
 * Get the opponent color
 * @param color The player color
 * @returns The opponent color
 */
export function getOpponentColor(color: PlayerColor): PlayerColor {
  return color === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
}

/**
 * Convert a position to algebraic notation (e.g., {x: 0, y: 0} to "a1")
 * @param position The position to convert
 * @returns The position in algebraic notation
 */
export function positionToAlgebraic(position: Position): string {
  const file = String.fromCharCode(97 + position.x); // 'a' is 97 in ASCII
  const rank = position.y + 1;
  return `${file}${rank}`;
}

/**
 * Convert algebraic notation to a position (e.g., "a1" to {x: 0, y: 0})
 * @param algebraic The position in algebraic notation
 * @returns The position object
 */
export function algebraicToPosition(algebraic: string): Position {
  const file = algebraic.charCodeAt(0) - 97; // 'a' is 97 in ASCII
  const rank = parseInt(algebraic.substring(1)) - 1;
  return { x: file, y: rank };
}

/**
 * Check if a position is a dark square
 * @param position The position to check
 * @returns True if the position is a dark square
 */
export function isDarkSquare(position: Position): boolean {
  return (position.x + position.y) % 2 === 1;
} 