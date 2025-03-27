/**
 * Chess Tactical Retreat Calculator
 * 
 * This module provides utilities for calculating valid retreat options
 * for chess pieces based on the piece type and position.
 */

import { isSlidingPiece } from '../chess/movement';
import { 
  getKnightRetreatsFromPositions 
} from '../constants/knightRetreatUtils';
import { Position, PieceType } from '../types';
import { 
  isValidPosition,
  positionToCoordinates,
  coordinatesToPosition,
  isSameFile,
  isSameRank,
  isSameDiagonal,
  getPositionsBetween
} from '../utils/position';

// Knight move directions
const KNIGHT_MOVES = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];

// Sliding piece directions
const DIAGONALS = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Bishop
const ORTHOGONALS = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Rook
const ALL_DIRECTIONS = [...DIAGONALS, ...ORTHOGONALS]; // Queen

/**
 * Interface for retreat options with position and cost
 */
export interface Retreat {
  to: Position;
  cost: number;
}

/**
 * Calculates all valid tactical retreat options for a given piece and failed capture attempt.
 * 
 * @param pieceType Type of piece that failed the capture
 * @param originalPosition Original position of the piece before capture attempt
 * @param capturePosition Position where capture was attempted
 * @param boardState Map of positions to pieceTypes, used to check if spaces are occupied
 * @returns Array of valid retreat options with positions and BP costs
 */
export function calculateTacticalRetreats(
  pieceType: PieceType,
  originalPosition: Position,
  capturePosition: Position,
  boardState: Map<Position, any>
): Retreat[] {
  if (!isValidPosition(originalPosition) || !isValidPosition(capturePosition)) {
    throw new Error('Invalid positions provided for tactical retreat calculation');
  }

  // Original position is always a valid retreat option at 0 BP cost
  const retreats: Retreat[] = [
    { to: originalPosition, cost: 0 }
  ];

  // Handle knight retreats differently
  if (pieceType === 'n') {
    return [...retreats, ...calculateKnightRetreats(originalPosition, capturePosition, boardState)];
  }
  
  // Handle long-range pieces (bishop, rook, queen)
  if (isSlidingPiece(pieceType)) {
    return [...retreats, ...calculateSlidingPieceRetreats(
      pieceType,
      originalPosition,
      capturePosition,
      boardState
    )];
  }

  // Other pieces (pawn, king) can only return to original position
  return retreats;
}

/**
 * Calculates retreat options for sliding pieces (bishop, rook, queen)
 * along their axis of attack.
 * 
 * @param pieceType Type of sliding piece
 * @param originalPosition Original position before capture attempt
 * @param capturePosition Position where capture was attempted
 * @param boardState Map of positions to pieceTypes, used to check if spaces are occupied
 * @returns Array of valid retreat options with positions and BP costs
 */
function calculateSlidingPieceRetreats(
  pieceType: PieceType,
  originalPosition: Position,
  capturePosition: Position,
  boardState: Map<Position, any>
): Retreat[] {
  const retreats: Retreat[] = [];
  const [origX, origY] = positionToCoordinates(originalPosition);
  const [capX, capY] = positionToCoordinates(capturePosition);

  // Determine the axis of attack
  const isDiagonal = isSameDiagonal(originalPosition, capturePosition);
  const isHorizontal = isSameRank(originalPosition, capturePosition);
  const isVertical = isSameFile(originalPosition, capturePosition);

  // Check if the piece can move along this axis
  const validAxis = (
    (pieceType === 'b' && isDiagonal) ||
    (pieceType === 'r' && (isHorizontal || isVertical)) ||
    (pieceType === 'q' && (isDiagonal || isHorizontal || isVertical))
  );

  if (!validAxis) {
    return retreats;
  }

  // Calculate direction vector from original to capture position
  const dx = Math.sign(capX - origX);
  const dy = Math.sign(capY - origY);

  // Find positions along axis of attack in both directions
  const positionsInAttackDirection = findPositionsAlongAxis(
    originalPosition, dx, dy, boardState, capturePosition
  );
  
  // Find positions in the opposite direction
  const positionsInOppositeDirection = findPositionsAlongAxis(
    originalPosition, -dx, -dy, boardState
  );

  // Convert positions to retreat options with costs
  // Cost is distance from original position
  const allPositions = [...positionsInAttackDirection, ...positionsInOppositeDirection];
  
  for (const position of allPositions) {
    if (position !== originalPosition) {
      const [posX, posY] = positionToCoordinates(position);
      const distance = Math.max(Math.abs(posX - origX), Math.abs(posY - origY));
      retreats.push({ to: position, cost: distance });
    }
  }

  return retreats;
}

/**
 * Finds all unoccupied positions along a specific axis from a starting position
 * 
 * @param startPosition Starting position
 * @param dx X direction component
 * @param dy Y direction component
 * @param boardState Map of positions to pieceTypes, used to check if spaces are occupied
 * @param excludePosition Optional position to exclude from results (e.g., the capture position)
 * @returns Array of valid positions along the axis
 */
function findPositionsAlongAxis(
  startPosition: Position,
  dx: number,
  dy: number,
  boardState: Map<Position, any>,
  excludePosition?: Position
): Position[] {
  const positions: Position[] = [];
  const [startX, startY] = positionToCoordinates(startPosition);
  
  let x = startX + dx;
  let y = startY + dy;
  
  while (x >= 0 && x < 8 && y >= 0 && y < 8) {
    const position = coordinatesToPosition(x, y);
    
    // Skip if position is occupied
    if (boardState.has(position)) {
      break;
    }
    
    // Add to results only if it's not the excluded position
    if (position !== excludePosition) {
      positions.push(position);
    }
    
    x += dx;
    y += dy;
  }
  
  return positions;
}

/**
 * Calculates knight retreat options using the pre-calculated lookup table.
 * 
 * @param originalPosition Original position before capture attempt
 * @param capturePosition Position where capture was attempted
 * @param boardState Map of positions to pieceTypes, used to check if spaces are occupied
 * @returns Array of valid knight retreat options with positions and BP costs
 */
function calculateKnightRetreats(
  originalPosition: Position,
  capturePosition: Position,
  boardState: Map<Position, any>
): Retreat[] {
  // Use the pre-calculated lookup table
  const retreatOptions = getKnightRetreatsFromPositions(originalPosition, capturePosition);
  
  // Filter out occupied positions
  return retreatOptions
    .filter(option => option.to !== originalPosition && !boardState.has(option.to))
    .map(option => ({ to: option.to, cost: option.cost }));
}

/**
 * Gets valid retreat options for sliding pieces (bishop, rook, queen)
 * 
 * @param startX Starting X coordinate (0-7)
 * @param startY Starting Y coordinate (0-7) 
 * @param attackX Attack X coordinate (0-7)
 * @param attackY Attack Y coordinate (0-7)
 * @param directions Array of direction vectors to check ([dx, dy])
 * @param board Current board state to track occupied squares
 * @returns Array of valid retreat positions
 */
function getSlidingPieceRetreats(
  startX: number, startY: number,
  attackX: number, attackY: number,
  directions: number[][],
  boardState: Map<Position, any>
): Retreat[] {
  const retreats: Retreat[] = [];
  
  // Check each direction
  for (const [dx, dy] of directions) {
    let x = startX + dx;
    let y = startY + dy;
    
    // Continue in this direction until board edge or occupied square
    while (x >= 0 && x < 8 && y >= 0 && y < 8) {
      const position = coordinatesToPosition(x, y);
      
      // Stop at occupied square
      if (boardState.has(position)) {
        break;
      }
      
      // Add to valid retreats if within the retreat rectangle
      // and not the attack position
      if (isInRetreatArea(x, y, startX, startY, attackX, attackY) && 
          !(x === attackX && y === attackY)) {
        retreats.push({ to: position, cost: Math.max(Math.abs(x - startX), Math.abs(y - startY)) });
      }
      
      // Continue in the same direction
      x += dx;
      y += dy;
    }
  }
  
  return retreats;
}

/**
 * Checks if a position is within the valid retreat area
 * (The rectangle formed by the original position and attack position)
 */
function isInRetreatArea(
  x: number, y: number,
  startX: number, startY: number,
  attackX: number, attackY: number
): boolean {
  const minX = Math.min(startX, attackX);
  const maxX = Math.max(startX, attackX);
  const minY = Math.min(startY, attackY);
  const maxY = Math.max(startY, attackY);
  
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
} 