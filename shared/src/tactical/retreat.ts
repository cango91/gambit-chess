/**
 * Gambit Chess Tactical Retreat Calculator
 * 
 * This module provides utilities for calculating valid retreat options
 * for chess pieces based on the piece type and position.
 */

import { ChessPosition, ChessPieceType } from '../chess/types';
import { isSlidingPiece } from '../chess/movement';
import { 
  getKnightRetreatsFromPositions 
} from '../constants/knightRetreatUtils';
import { IBoard, IRetreatOption } from '../chess/contracts';

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
  boardState: IBoard
): IRetreatOption[] {
  const attacker = boardState.getPieceAt(originalPosition);
  const defender = boardState.getPieceAt(capturePosition);
  if (!attacker || !defender) {
    throw new Error('Invalid board state');
  }
  const pieceType = attacker.type;
  // Original position is always a valid retreat option at 0 BP cost
  const retreats: IRetreatOption[] = [
    { to: originalPosition.value, cost: 0 }
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
  boardState: IBoard
): IRetreatOption[] {

  const retreats: IRetreatOption[] = [];
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
      retreats.push({ to: position.value, cost: distance });
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
  boardState: IBoard,
  excludePosition?: ChessPosition
): ChessPosition[] {
  const positions: ChessPosition[] = [];
  const [startX, startY] = startPosition.toCoordinates();
  
  let x = startX + dx;
  let y = startY + dy;
  
  while (x >= 0 && x < 8 && y >= 0 && y < 8) {
    const position = ChessPosition.fromCoordinates(x, y);
    
    // Skip if position is occupied
    if (boardState.getPieceAt(position)) {
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
  boardState: IBoard
): IRetreatOption[] {
  // Use the pre-calculated lookup table
  const validRetreats = getKnightRetreatsFromPositions(originalPosition, capturePosition);
  return validRetreats.filter(retreat => !boardState.getPieceAt(retreat.to));
}