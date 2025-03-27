/**
 * Position utilities for chess board coordinates
 */

import { BOARD_SIZE } from '../constants';
import { Position } from '../types';

/**
 * Validates if a position is on the board
 * @param position Position to validate (e.g., "e4")
 * @returns boolean indicating if the position is valid
 */
export function isValidPosition(position: Position): boolean {
  if (typeof position !== 'string' || position.length !== 2) {
    return false;
  }
  
  const file = position[0].toLowerCase();
  const rank = parseInt(position[1], 10);
  
  return (
    file >= 'a' && file <= 'h' &&
    rank >= 1 && rank <= BOARD_SIZE
  );
}

/**
 * Converts a position to numeric coordinates
 * @param position Position in algebraic notation (e.g., "e4")
 * @returns [x, y] coordinates (0-indexed, bottom-left is [0,0])
 */
export function positionToCoordinates(position: Position): [number, number] {
  if (!isValidPosition(position)) {
    throw new Error(`Invalid position: ${position}`);
  }
  
  const file = position[0].toLowerCase();
  const rank = parseInt(position[1], 10);
  
  // Convert file (a-h) to x coordinate (0-7)
  const x = file.charCodeAt(0) - 'a'.charCodeAt(0);
  
  // Convert rank (1-8) to y coordinate (0-7), with 1 at the bottom
  const y = rank - 1;
  
  return [x, y];
}

/**
 * Converts numeric coordinates to a position
 * @param x X coordinate (0-7)
 * @param y Y coordinate (0-7)
 * @returns Position in algebraic notation (e.g., "e4")
 */
export function coordinatesToPosition(x: number, y: number): Position {
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    throw new Error(`Invalid coordinates: [${x}, ${y}]`);
  }
  
  // Convert x coordinate (0-7) to file (a-h)
  const file = String.fromCharCode('a'.charCodeAt(0) + x);
  
  // Convert y coordinate (0-7) to rank (1-8)
  const rank = y + 1;
  
  return `${file}${rank}`;
}

/**
 * Calculates the distance between two positions
 * @param from Starting position
 * @param to Ending position
 * @returns The distance in squares
 */
export function getDistance(from: Position, to: Position): number {
  const [x1, y1] = positionToCoordinates(from);
  const [x2, y2] = positionToCoordinates(to);
  
  // Manhattan distance
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

/**
 * Checks if two positions are on the same rank
 * @param pos1 First position
 * @param pos2 Second position
 * @returns True if positions are on the same rank
 */
export function isSameRank(pos1: Position, pos2: Position): boolean {
  if (!isValidPosition(pos1) || !isValidPosition(pos2)) {
    return false;
  }
  
  return pos1[1] === pos2[1];
}

/**
 * Checks if two positions are on the same file
 * @param pos1 First position
 * @param pos2 Second position
 * @returns True if positions are on the same file
 */
export function isSameFile(pos1: Position, pos2: Position): boolean {
  if (!isValidPosition(pos1) || !isValidPosition(pos2)) {
    return false;
  }
  
  return pos1[0] === pos2[0];
}

/**
 * Checks if two positions are on the same diagonal
 * @param pos1 First position
 * @param pos2 Second position
 * @returns True if positions are on the same diagonal
 */
export function isSameDiagonal(pos1: Position, pos2: Position): boolean {
  if (!isValidPosition(pos1) || !isValidPosition(pos2)) {
    return false;
  }
  
  const [x1, y1] = positionToCoordinates(pos1);
  const [x2, y2] = positionToCoordinates(pos2);
  
  // On same diagonal if the absolute difference between x and y coordinates is the same
  return Math.abs(x2 - x1) === Math.abs(y2 - y1);
}

/**
 * Calculates the positions between two positions on the same rank, file, or diagonal
 * @param from Starting position
 * @param to Ending position
 * @returns Array of positions between from and to (exclusive of from and to)
 */
export function getPositionsBetween(from: Position, to: Position): Position[] {
  if (!isValidPosition(from) || !isValidPosition(to)) {
    throw new Error('Invalid positions');
  }
  
  // Positions must be on the same rank, file, or diagonal
  if (!isSameRank(from, to) && !isSameFile(from, to) && !isSameDiagonal(from, to)) {
    return [];
  }
  
  const [x1, y1] = positionToCoordinates(from);
  const [x2, y2] = positionToCoordinates(to);
  
  const positions: Position[] = [];
  
  // Determine direction of movement
  const dx = Math.sign(x2 - x1);
  const dy = Math.sign(y2 - y1);
  
  let currentX = x1 + dx;
  let currentY = y1 + dy;
  
  // Add all positions between from and to
  while (currentX !== x2 || currentY !== y2) {
    positions.push(coordinatesToPosition(currentX, currentY));
    currentX += dx;
    currentY += dy;
  }
  
  return positions;
}

/**
 * Gets all positions along a rank
 * @param rank Rank number (1-8)
 * @returns Array of positions on the rank
 */
export function getPositionsOnRank(rank: number): Position[] {
  if (rank < 1 || rank > BOARD_SIZE) {
    throw new Error(`Invalid rank: ${rank}`);
  }
  
  const positions: Position[] = [];
  
  for (let file = 0; file < BOARD_SIZE; file++) {
    positions.push(coordinatesToPosition(file, rank - 1));
  }
  
  return positions;
}

/**
 * Gets all positions along a file
 * @param file File letter (a-h)
 * @returns Array of positions on the file
 */
export function getPositionsOnFile(file: string): Position[] {
  const fileChar = file.toLowerCase();
  if (fileChar < 'a' || fileChar > 'h') {
    throw new Error(`Invalid file: ${file}`);
  }
  
  const fileIndex = fileChar.charCodeAt(0) - 'a'.charCodeAt(0);
  const positions: Position[] = [];
  
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    positions.push(coordinatesToPosition(fileIndex, rank));
  }
  
  return positions;
} 