/**
 * Chess piece movement pattern utilities
 */

import { BOARD_SIZE } from '../constants';
import { PieceType, Position } from '../types';
import {
  isValidPosition,
  positionToCoordinates,
  coordinatesToPosition,
  isSameFile,
  isSameRank,
  isSameDiagonal,
} from '../utils/position';

/**
 * Generates possible move directions for a specific piece type
 * @param pieceType The type of chess piece
 * @returns Array of [dx, dy] direction vectors
 */
export function getPieceDirections(pieceType: PieceType): [number, number][] {
  switch (pieceType) {
    case 'p':
      // Pawns are handled separately due to their special movement rules
      return [];
    case 'n':
      // Knight moves in L-shapes
      return [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
      ];
    case 'b':
      // Bishop moves diagonally
      return [
        [1, 1], [1, -1], [-1, -1], [-1, 1]
      ];
    case 'r':
      // Rook moves horizontally and vertically
      return [
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ];
    case 'q':
    case 'k':
      // Queen and King move in all 8 directions (king just moves one square at a time)
      return [
        [0, 1], [1, 1], [1, 0], [1, -1],
        [0, -1], [-1, -1], [-1, 0], [-1, 1]
      ];
    default:
      throw new Error(`Invalid piece type: ${pieceType}`);
  }
}

/**
 * Checks if a move is valid for a pawn
 * @param from Starting position
 * @param to Destination position
 * @param isWhite Whether the pawn is white (true) or black (false)
 * @param isCapture Whether the move is a capture
 * @param isFirstMove Whether this is the pawn's first move (allows double move)
 * @returns True if the move is valid for a pawn
 */
export function isValidPawnMove(
  from: Position,
  to: Position,
  isWhite: boolean,
  isCapture: boolean = false,
  isFirstMove: boolean = false
): boolean {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    return false;
  }

  const [fromX, fromY] = positionToCoordinates(from);
  const [toX, toY] = positionToCoordinates(to);

  // Direction of movement (up for white, down for black)
  const direction = isWhite ? 1 : -1;

  // Capture move
  if (isCapture) {
    return (
      (toY - fromY) === direction &&
      Math.abs(toX - fromX) === 1
    );
  }

  // Forward one square
  if ((toY - fromY) === direction && toX === fromX) {
    return true;
  }

  // First move can be two squares from the starting rank
  if (isFirstMove && toX === fromX && (toY - fromY) === 2 * direction) {
    // Check if we're on the correct starting rank
    const startingRank = isWhite ? 1 : 6; // Rank 2 for white, Rank 7 for black
    
    // Only allow two-square moves from the starting rank
    if (fromY === startingRank) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a move is valid for a knight
 * @param from Starting position
 * @param to Destination position
 * @returns True if the move is valid for a knight
 */
export function isValidKnightMove(from: Position, to: Position): boolean {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    return false;
  }

  const [fromX, fromY] = positionToCoordinates(from);
  const [toX, toY] = positionToCoordinates(to);

  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);

  // Knight moves in an L-shape: 2 squares in one direction and 1 square perpendicular
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

/**
 * Checks if a move is valid for a bishop
 * @param from Starting position
 * @param to Destination position
 * @returns True if the move is valid for a bishop
 */
export function isValidBishopMove(from: Position, to: Position): boolean {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    return false;
  }

  // Bishop moves diagonally
  return isSameDiagonal(from, to);
}

/**
 * Checks if a move is valid for a rook
 * @param from Starting position
 * @param to Destination position
 * @returns True if the move is valid for a rook
 */
export function isValidRookMove(from: Position, to: Position): boolean {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    return false;
  }

  // Rook moves horizontally or vertically
  return isSameFile(from, to) || isSameRank(from, to);
}

/**
 * Checks if a move is valid for a queen
 * @param from Starting position
 * @param to Destination position
 * @returns True if the move is valid for a queen
 */
export function isValidQueenMove(from: Position, to: Position): boolean {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    return false;
  }

  // Queen moves horizontally, vertically, or diagonally
  return isSameFile(from, to) || isSameRank(from, to) || isSameDiagonal(from, to);
}

/**
 * Checks if a move is valid for a king
 * @param from Starting position
 * @param to Destination position
 * @param includeCastle Whether to include castling moves
 * @returns True if the move is valid for a king
 */
export function isValidKingMove(
  from: Position,
  to: Position,
  includeCastle: boolean = false
): boolean {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    return false;
  }

  const [fromX, fromY] = positionToCoordinates(from);
  const [toX, toY] = positionToCoordinates(to);

  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);

  // Normal king move: one square in any direction
  if (dx <= 1 && dy <= 1) {
    return true;
  }

  // Castling moves are now validated by the BoardSnapshot class based on piece movement history
  return false;
}

/**
 * Checks if a move is valid for a given piece type
 * @param pieceType The type of chess piece
 * @param from Starting position
 * @param to Destination position
 * @param isWhitePiece Whether the piece is white (relevant for pawns)
 * @param isCapture Whether the move is a capture (relevant for pawns)
 * @param isFirstMove Whether this is the piece's first move (relevant for pawns)
 * @returns True if the move is valid for the piece type
 */
export function isValidPieceMove(
  pieceType: PieceType,
  from: Position,
  to: Position,
  isWhitePiece: boolean = true,
  isCapture: boolean = false,
  isFirstMove: boolean = false
): boolean {
  switch (pieceType) {
    case 'p':
      return isValidPawnMove(from, to, isWhitePiece, isCapture, isFirstMove);
    case 'n':
      return isValidKnightMove(from, to);
    case 'b':
      return isValidBishopMove(from, to);
    case 'r':
      return isValidRookMove(from, to);
    case 'q':
      return isValidQueenMove(from, to);
    case 'k':
      return isValidKingMove(from, to);
    default:
      throw new Error(`Invalid piece type: ${pieceType}`);
  }
}

/**
 * Checks if a piece is a sliding piece (bishop, rook, queen)
 * @param pieceType The type of chess piece
 * @returns True if the piece is a sliding piece
 */
export function isSlidingPiece(pieceType: PieceType): boolean {
  return pieceType === 'b' || pieceType === 'r' || pieceType === 'q';
}

/**
 * Determines if a piece can move along a specific movement axis
 * @param pieceType The type of chess piece
 * @param dx Direction vector x component
 * @param dy Direction vector y component
 * @returns True if the piece can move in the given direction
 */
export function canMoveInDirection(pieceType: PieceType, dx: number, dy: number): boolean {
  // Normalize the direction vector
  if (dx !== 0) dx = dx / Math.abs(dx);
  if (dy !== 0) dy = dy / Math.abs(dy);
  
  const directions = getPieceDirections(pieceType);
  return directions.some(([dirX, dirY]) => dirX === dx && dirY === dy);
} 