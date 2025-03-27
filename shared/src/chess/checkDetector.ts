/**
 * Check Detection Module for Gambit Chess
 * 
 * This module provides utilities for detecting check conditions.
 * It is designed to be used by both client (for UX validation) and server (for authoritative validation).
 * 
 * Usage patterns:
 * 
 * 1. Client-side UX validation:
 *    - Highlight king when in check
 *    - Show valid moves that can resolve check
 *    - Validate moves client-side before sending to server
 * 
 * 2. Server-side authoritative validation:
 *    - Validate moves ensure they don't leave king in check
 *    - Detect check and checkmate conditions
 *    - Enforce game rules around check
 * 
 * Note: While this code is shared, the server always remains the
 * authoritative source of truth for game state progression.
 */

import { ChessPiece, PieceColor, Position } from '../types';
import { 
  positionToCoordinates, 
  coordinatesToPosition, 
  getPositionsBetween
} from '../utils/position';
import { isValidPieceMove, isSlidingPiece } from './movement';

/**
 * Minimal interface for a board to be used with check detector functions
 * This helps avoid circular dependencies with the full BoardSnapshot class
 */
export interface IBoardForCheckDetection {
  getPiece(position: Position): ChessPiece | undefined;
  getPiecesByColor(color: PieceColor): ChessPiece[];
  getKingPosition(color: PieceColor): Position | undefined;
  makeMove(from: Position, to: Position): { success: boolean };
  clone(): IBoardForCheckDetection;
}

/**
 * Detects if a king is in check on the given board
 * @param board The board to analyze
 * @param kingColor The color of the king to check
 * @returns True if the king is in check, false otherwise
 */
export function isKingInCheck(board: IBoardForCheckDetection, kingColor: PieceColor): boolean {
  const kingPosition = board.getKingPosition(kingColor);
  if (!kingPosition) {
    return false; // No king found (shouldn't happen in a valid game)
  }
  
  // Get all opponent pieces
  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  const opponentPieces = board.getPiecesByColor(opponentColor);
  
  // Check if any opponent piece can capture the king
  for (const piece of opponentPieces) {
    if (canPieceAttackKing(board, piece, kingPosition)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Determines if a specific piece can attack the king
 * @param board The board to analyze
 * @param piece The attacking piece
 * @param kingPosition The king's position
 * @returns True if the piece can attack the king, false otherwise
 */
function canPieceAttackKing(board: IBoardForCheckDetection, piece: ChessPiece, kingPosition: Position): boolean {
  const pieceType = piece.type;
  const isWhitePiece = piece.color === 'white';
  
  // For pawns, need special attack check (different from movement)
  if (pieceType === 'p') {
    return canPawnAttack(piece.position, kingPosition, isWhitePiece);
  }
  
  // For all other pieces, check if the move would be valid
  // and if there are no pieces in between (for sliding pieces)
  if (isValidPieceMove(pieceType, piece.position, kingPosition, isWhitePiece, true)) {
    // For sliding pieces (bishop, rook, queen), check if path is clear
    if (isSlidingPiece(pieceType)) {
      const positionsBetween = getPositionsBetween(piece.position, kingPosition);
      
      // Check if all positions between are empty
      for (const pos of positionsBetween) {
        if (board.getPiece(pos)) {
          return false; // Path is blocked
        }
      }
    }
    
    return true; // Valid attack
  }
  
  return false;
}

/**
 * Checks if a pawn can attack a specific position
 * @param pawnPosition The pawn's position
 * @param targetPosition The target position (king's position)
 * @param isWhitePawn Whether the pawn is white
 * @returns True if the pawn can attack the target position
 */
function canPawnAttack(pawnPosition: Position, targetPosition: Position, isWhitePawn: boolean): boolean {
  const [pawnX, pawnY] = positionToCoordinates(pawnPosition);
  const [targetX, targetY] = positionToCoordinates(targetPosition);
  
  const forwardDirection = isWhitePawn ? 1 : -1;
  
  // Pawns attack diagonally forward
  return (
    targetY === pawnY + forwardDirection &&
    Math.abs(targetX - pawnX) === 1
  );
}

/**
 * Gets all pieces attacking the king
 * @param board The board to analyze
 * @param kingColor The color of the king
 * @returns Array of pieces that are attacking the king
 */
export function getKingAttackers(board: IBoardForCheckDetection, kingColor: PieceColor): ChessPiece[] {
  const kingPosition = board.getKingPosition(kingColor);
  if (!kingPosition) {
    return []; // No king found
  }
  
  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  const opponentPieces = board.getPiecesByColor(opponentColor);
  const attackers: ChessPiece[] = [];
  
  for (const piece of opponentPieces) {
    if (canPieceAttackKing(board, piece, kingPosition)) {
      attackers.push(piece);
    }
  }
  
  return attackers;
}

/**
 * Gets all positions that can block an attack on the king
 * Only relevant for sliding pieces (bishop, rook, queen)
 * @param board The board to analyze
 * @param kingColor The color of the king
 * @returns Array of positions that could block the attack
 */
export function getCheckBlockingPositions(board: IBoardForCheckDetection, kingColor: PieceColor): Position[] {
  const kingPosition = board.getKingPosition(kingColor);
  if (!kingPosition) {
    return []; // No king found
  }
  
  const attackers = getKingAttackers(board, kingColor);
  
  // If no attackers or more than one attacker, can't block
  if (attackers.length !== 1) {
    return [];
  }
  
  const attacker = attackers[0];
  
  // Can only block sliding pieces
  if (!isSlidingPiece(attacker.type)) {
    return [];
  }
  
  // Get positions between attacker and king
  return getPositionsBetween(attacker.position, kingPosition);
}

/**
 * Checks if a move would put the moving player's king in check
 * This implementation avoids circular dependencies by simulating the move
 * without calling isValidMove from the board class
 * 
 * @param board The current board state
 * @param from The starting position
 * @param to The destination position
 * @returns True if the move would result in self-check
 */
export function wouldMoveResultInSelfCheck(board: IBoardForCheckDetection, from: Position, to: Position): boolean {
  const piece = board.getPiece(from);
  if (!piece) {
    return false;
  }
  
  // If the piece is a king, we need special handling
  if (piece.type === 'k') {
    // Check if any opponent piece would attack the king at its new position
    const kingColor = piece.color;
    const opponentColor = kingColor === 'white' ? 'black' : 'white';
    const opponentPieces = board.getPiecesByColor(opponentColor);
    
    for (const opponentPiece of opponentPieces) {
      // Skip if we're capturing this opponent piece
      if (opponentPiece.position === to) {
        continue;
      }
      
      // Check if this opponent piece can attack the king at its new position
      if (canPieceAttackSquare(board, opponentPiece, to)) {
        return true;
      }
    }
    
    return false;
  }
  
  // For non-king pieces, delegate to wouldMoveLeaveKingInCheck
  return wouldMoveLeaveKingInCheck(board, from, to);
}

/**
 * Checks if a piece can attack a square (considering blocked paths)
 */
function canPieceAttackSquare(board: IBoardForCheckDetection, piece: ChessPiece, target: Position): boolean {
  // Check if the piece can attack according to movement rules
  const canAttack = isValidPieceMove(
    piece.type,
    piece.position,
    target,
    piece.color === 'white',
    true, // Treating as capture
    false
  );
  
  if (!canAttack) {
    return false;
  }
  
  // Knights, kings and pawns don't need path checking
  if (piece.type === 'n' || piece.type === 'k' || piece.type === 'p') {
    return true;
  }
  
  // For sliding pieces, check if the path is clear
  const positions = getPositionsBetween(piece.position, target);
  for (const pos of positions) {
    if (board.getPiece(pos)) {
      return false; // Path is blocked
    }
  }
  
  return true;
}

/**
 * A simplified version of wouldMoveResultInSelfCheck that doesn't call board.makeMove
 * This helps avoid circular dependencies in the check detection logic
 * 
 * @param board The current board state 
 * @param from Starting position
 * @param to Destination position
 * @returns True if the move would leave the king in check
 */
export function wouldMoveLeaveKingInCheck(board: IBoardForCheckDetection, from: Position, to: Position): boolean {
  const piece = board.getPiece(from);
  if (!piece) {
    return false;
  }
  
  const kingColor = piece.color;
  // If the king is moving, use the destination as the king position
  const kingPos = piece.type === 'k' ? to : board.getKingPosition(kingColor);
  
  if (!kingPos) {
    return false; // No king found (shouldn't happen)
  }
  
  // Get all opponent pieces
  const opponentColor = kingColor === 'white' ? 'black' : 'white';
  const opponentPieces = board.getPiecesByColor(opponentColor);
  
  for (const opponentPiece of opponentPieces) {
    // Skip if this opponent piece is being captured
    if (opponentPiece.position === to) {
      continue;
    }
    
    // Check if this opponent piece would attack the king after the move
    if (wouldPieceAttackKingAfterMove(board, opponentPiece, kingPos, from, to)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if an opponent piece would attack the king after a move is made
 * This function handles scenarios with sliding pieces (especially pin scenarios)
 * and determines if a move would leave the king open to attack
 * 
 * @param board The board state
 * @param opponentPiece The opponent piece to check
 * @param kingPos The king's position
 * @param moveFrom The from position of the move being checked
 * @param moveTo The to position of the move being checked
 * @returns True if the opponent piece would attack the king after the move
 */
function wouldPieceAttackKingAfterMove(
  board: IBoardForCheckDetection,
  opponentPiece: ChessPiece,
  kingPos: Position,
  moveFrom: Position,
  moveTo: Position
): boolean {
  // First check if the opponent piece can attack the king's position
  // according to basic movement rules
  const canAttack = isValidPieceMove(
    opponentPiece.type,
    opponentPiece.position,
    kingPos,
    opponentPiece.color === 'white',
    true, // Treating as capture
    false
  );
  
  if (!canAttack) {
    return false;
  }
  
  // For non-sliding pieces (knight, pawn, king), if they can attack, they will attack
  if (opponentPiece.type === 'n' || opponentPiece.type === 'p' || opponentPiece.type === 'k') {
    return true;
  }
  
  // For sliding pieces (bishop, rook, queen), check if the path will be clear after the move
  const positionsBetween = getPositionsBetween(opponentPiece.position, kingPos);
  
  // If moving the piece from the attack line
  if (moveFrom === kingPos || positionsBetween.includes(moveFrom)) {
    // Check if the piece is moving along the same attack line
    const onSameLine = moveTo === kingPos || positionsBetween.includes(moveTo);
    
    // If moving along the same line (maintaining the pin), it's safe
    if (onSameLine) {
      return false;
    }
    
    // If moving off the line, we need to check if there are other pieces
    // still blocking the attack
    let blockingPieces = 0;
    for (const pos of positionsBetween) {
      // Skip the position the piece is moving from
      if (pos === moveFrom) continue;
      
      // Count blocking pieces
      if (board.getPiece(pos)) {
        blockingPieces++;
      }
    }
    
    // If there are blocking pieces, king is safe
    return blockingPieces === 0;
  }
  
  // If the piece wasn't on the attack line, check if the path is clear
  for (const pos of positionsBetween) {
    // If we're moving to block the attack, king is safe
    if (pos === moveTo) {
      return false;
    }
    
    // If any other piece blocks the path, king is safe
    if (board.getPiece(pos) && pos !== moveFrom) {
      return false;
    }
  }
  
  // If we get here, the path is clear and the king will be attacked
  return true;
}

/**
 * Checks if a move would get a king out of check
 * @param board The current board state
 * @param kingColor The color of the king in check
 * @param from The starting position
 * @param to The destination position
 * @returns True if the move would get the king out of check
 */
export function wouldMoveResolveCheck(board: IBoardForCheckDetection, kingColor: PieceColor, from: Position, to: Position): boolean {
  // If king isn't in check, any valid move is fine
  if (!isKingInCheck(board, kingColor)) {
    return true;
  }
  
  // Create a copy of the board to test the move
  const testBoard = board.clone();
  const moveResult = testBoard.makeMove(from, to);
  
  // If the move wasn't successful, it can't resolve check
  if (!moveResult.success) {
    return false;
  }
  
  // Check if the king is still in check after the move
  return !isKingInCheck(testBoard, kingColor);
} 