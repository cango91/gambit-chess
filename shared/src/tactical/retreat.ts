/**
 * Chess Tactical Retreat Calculator
 * 
 * This module provides utilities for calculating valid retreat options
 * for chess pieces based on the piece type and position.
 */

import { ChessPosition, ChessPieceType, ChessPositionType } from '../chess/types';
import { isSlidingPiece } from '../chess/movement';
import { 
  getKnightRetreatsFromPositions 
} from '../constants/knightRetreatUtils';
import { IChessPiece } from '../chess/contracts';

// Knight move directions
const KNIGHT_MOVES = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];

/**
 * Interface for a single tactical retreat option with position and cost
 */
export interface RetreatCost {
  to: ChessPosition;
  cost: number;
}

/**
 * Calculates all valid tactical retreat options for a given piece and failed capture attempt.
 * 
 * @param originalPosition Original position of the piece before capture attempt
 * @param capturePosition Position where capture was attempted
 * @param boardState Map of positions to pieceTypes, used to check if spaces are occupied
 * Attacker should be on the original position and defender should be on the capture position
 * @returns Array of valid retreat options with positions and BP costs
 */
export function calculateTacticalRetreats(
  originalPosition: ChessPosition,
  capturePosition: ChessPosition,
  boardState: Map<ChessPosition, IChessPiece>
): RetreatCost[] {
  const attacker = boardState.get(originalPosition);
  const defender = boardState.get(capturePosition);
  if (!attacker || !defender) {
    throw new Error('Invalid board state');
  }
  const pieceType = attacker.type;
  // Original position is always a valid retreat option at 0 BP cost
  const retreats: RetreatCost[] = [
    { to: originalPosition, cost: 0 }
  ];

  // Handle knight retreats differently
  if (pieceType.value === 'n') {
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
  pieceType: ChessPieceType,
  originalPosition: ChessPosition,
  capturePosition: ChessPosition,
  boardState: Map<ChessPosition, IChessPiece>
): RetreatCost[] {
  const retreats: RetreatCost[] = [];
  const [origX, origY] = originalPosition.toCoordinates();
  const [capX, capY] = capturePosition.toCoordinates();

  // Determine the axis of attack
  const isDiagonal = originalPosition.isSameDiagonal(capturePosition);
  const isHorizontal = originalPosition.isSameRank(capturePosition);
  const isVertical = originalPosition.isSameFile(capturePosition);

  // Check if the piece can move along this axis
  const validAxis = (
    (pieceType.value === 'b' && isDiagonal) ||
    (pieceType.value === 'r' && (isHorizontal || isVertical)) ||
    (pieceType.value === 'q' && (isDiagonal || isHorizontal || isVertical))
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
      const [posX, posY] = position.toCoordinates();
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
  startPosition: ChessPosition,
  dx: number,
  dy: number,
  boardState: Map<ChessPosition, IChessPiece>,
  excludePosition?: ChessPosition
): ChessPosition[] {
  const positions: ChessPosition[] = [];
  const [startX, startY] = startPosition.toCoordinates();
  
  let x = startX + dx;
  let y = startY + dy;
  
  while (x >= 0 && x < 8 && y >= 0 && y < 8) {
    const position = ChessPosition.fromCoordinates(x, y);
    
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
  originalPosition: ChessPosition,
  capturePosition: ChessPosition,
  boardState: Map<ChessPosition, any>
): RetreatCost[] {
  // Use the pre-calculated lookup table
  return getKnightRetreatsFromPositions(originalPosition, capturePosition);

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
  boardState: Map<ChessPosition, IChessPiece>
): RetreatCost[] {
  const retreats: RetreatCost[] = [];
  
  // Check each direction
  for (const [dx, dy] of directions) {
    let x = startX + dx;
    let y = startY + dy;
    
    // Continue in this direction until board edge or occupied square
    while (x >= 0 && x < 8 && y >= 0 && y < 8) {
      const position = ChessPosition.fromCoordinates(x, y);
      
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