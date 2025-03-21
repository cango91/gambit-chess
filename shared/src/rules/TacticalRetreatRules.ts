import { PieceType, PlayerColor, Position, RetreatOption } from '../types';
import { 
  isValidPosition, 
  isValidKnightRetreatPosition, 
  getKnightRetreatCost,
  getKnightRetreatOptions,
  initializeKnightRetreatTable
} from '../utils';
import { MovementRules } from './MovementRules';

// Initialize the knight retreat table 
// This ensures the table is ready when first needed
initializeKnightRetreatTable();

/**
 * Rules for tactical retreat mechanics.
 * Contains only validation logic that can be shared between client and server.
 * Actual retreat resolution happens on the server.
 */
export class TacticalRetreatRules {
  /**
   * Calculate the base BP cost for a retreat move
   * @param pieceType The type of piece
   * @param originalPosition Original position before attack
   * @param retreatPosition Position to retreat to
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @returns BP cost for the retreat (0 if returning to original position)
   */
  static calculateRetreatBPCost(
    pieceType: PieceType,
    originalPosition: Position,
    retreatPosition: Position,
    failedCapturePosition: Position
  ): number {
    // No cost to return to original position
    if (originalPosition.x === retreatPosition.x && originalPosition.y === retreatPosition.y) {
      return 0;
    }
    
    // Knight uses a special lookup table for retreat cost calculation
    if (pieceType === PieceType.KNIGHT) {
      return getKnightRetreatCost(originalPosition, failedCapturePosition, retreatPosition);
    }
    
    // For long-range pieces, cost is the distance from original position
    const dx = Math.abs(retreatPosition.x - originalPosition.x);
    const dy = Math.abs(retreatPosition.y - originalPosition.y);
    const distance = Math.max(dx, dy);
    
    // Cost is 1 BP per square of retreat beyond original position
    return distance;
  }

  /**
   * Determine if retreating to a position is valid based on attack vector
   * @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @returns True if the retreat follows the attack vector and doesn't pass the failed capture
   */
  static isOnRetreatVector(
    pieceType: PieceType,
    originalPosition: Position,
    failedCapturePosition: Position,
    retreatPosition: Position
  ): boolean {
    // Return to original position is always valid
    if (originalPosition.x === retreatPosition.x && originalPosition.y === retreatPosition.y) {
      return true;
    }

    // Knight retreat validation uses a pre-computed lookup table
    if (pieceType === PieceType.KNIGHT) {
      return isValidKnightRetreatPosition(originalPosition, failedCapturePosition, retreatPosition);
    }
    
    // For long-range pieces, check if retreat is on the same line as the attack
    // Get the attack vector (direction of attack)
    const attackDx = failedCapturePosition.x - originalPosition.x;
    const attackDy = failedCapturePosition.y - originalPosition.y;
    
    // Get retreat vector
    const retreatDx = retreatPosition.x - originalPosition.x;
    const retreatDy = retreatPosition.y - originalPosition.y;
    
    // Check if the retreat is along the same line/diagonal as the attack
    // For rooks (horizontal/vertical movement)
    if (pieceType === PieceType.ROOK) {
      // If attack was horizontal, retreat must be horizontal
      if (attackDy === 0) {
        return retreatDy === 0;
      }
      // If attack was vertical, retreat must be vertical
      if (attackDx === 0) {
        return retreatDx === 0;
      }
      return false;
    }
    
    // For bishops (diagonal movement)
    if (pieceType === PieceType.BISHOP) {
      // Attack and retreat must be on the same diagonal (same absolute slope)
      return Math.abs(attackDx) === Math.abs(attackDy) && 
             Math.abs(retreatDx) === Math.abs(retreatDy) &&
             Math.abs(attackDx/attackDy - retreatDx/retreatDy) < 0.001; // Account for floating point imprecision
    }
    
    // For queen (can move in any direction)
    if (pieceType === PieceType.QUEEN) {
      // If attack was horizontal/vertical
      if (attackDx === 0 || attackDy === 0) {
        // Retreat must be on the same axis
        return (attackDx === 0 && retreatDx === 0) || (attackDy === 0 && retreatDy === 0);
      }
      // If attack was diagonal
      if (Math.abs(attackDx) === Math.abs(attackDy)) {
        // Retreat must be on the same diagonal
        return Math.abs(retreatDx) === Math.abs(retreatDy) &&
               Math.abs(attackDx/attackDy - retreatDx/retreatDy) < 0.001; // Account for floating point imprecision
      }
      return false;
    }
    
    return false;
  }

  /**
   * Check if a retreat position is beyond the failed capture target
   * @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @returns True if the retreat doesn't go beyond the failed capture
   */
  static isBeyondFailedCapture(
    pieceType: PieceType,
    originalPosition: Position,
    failedCapturePosition: Position, 
    retreatPosition: Position
  ): boolean {
    // Knights have pre-validated retreat positions in the lookup table
    if (pieceType === PieceType.KNIGHT) {
      return false; // Already validated by isValidKnightRetreatPosition
    }
    
    // Get attack and retreat directions
    const attackDx = failedCapturePosition.x - originalPosition.x;
    const attackDy = failedCapturePosition.y - originalPosition.y;
    
    // Calculate vector from original to retreat position
    const originalToRetreatDx = retreatPosition.x - originalPosition.x;
    const originalToRetreatDy = retreatPosition.y - originalPosition.y;
    
    // If advancing in the attack direction, check if beyond the failed capture
    if (Math.sign(originalToRetreatDx) === Math.sign(attackDx) && 
        Math.sign(originalToRetreatDy) === Math.sign(attackDy)) {
        
      // Check if the retreat goes beyond the failed capture
      const attackDist = Math.max(Math.abs(attackDx), Math.abs(attackDy));
      const retreatDist = Math.max(Math.abs(originalToRetreatDx), Math.abs(originalToRetreatDy));
      
      // If retreating further than attack distance, it's beyond the failed capture
      return retreatDist >= attackDist;
    }
    
    // If retreating in the opposite direction, it's never beyond the failed capture
    return false;
  }

  /**
   * Check if a retreat move is valid based on piece movement rules and retreat vectors
   * @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @param hasMoved Whether the piece has moved before the attack
   * @returns True if the retreat move is valid
   */
  static isValidRetreatMove(
    pieceType: PieceType,
    originalPosition: Position,
    failedCapturePosition: Position,
    retreatPosition: Position,
    hasMoved: boolean
  ): boolean {
    // Return to original position is always valid
    if (originalPosition.x === retreatPosition.x && originalPosition.y === retreatPosition.y) {
      return true;
    }
    
    // Pawns can't retreat to a new position
    if (pieceType === PieceType.PAWN) {
      return false;
    }
    
    // Kings can only "retreat" by returning to their original position
    if (pieceType === PieceType.KING) {
      return false;
    }
    
    // For knights, retreat positions are pre-validated
    if (pieceType === PieceType.KNIGHT) {
      if (!isValidKnightRetreatPosition(originalPosition, failedCapturePosition, retreatPosition)) {
        return false;
      }
    } else {
      // For other pieces, check that the retreat follows the attack vector
      if (!this.isOnRetreatVector(pieceType, originalPosition, failedCapturePosition, retreatPosition)) {
        return false;
      }
      
      // Also check that the retreat position is not beyond the failed capture
      if (this.isBeyondFailedCapture(pieceType, originalPosition, failedCapturePosition, retreatPosition)) {
        return false;
      }
    }
    
    // Check that the retreat position is a valid move for the piece
    // This validates that the piece is moving according to its movement pattern
    // The hasTargetPiece parameter is false for retreat moves
    const isValidMovement = MovementRules.isValidBasicMove(
      pieceType,
      PlayerColor.WHITE, // Color doesn't matter for non-pawn pieces
      originalPosition,
      retreatPosition,
      hasMoved,
      false // No target piece at retreat position
    );
    
    if (!isValidMovement) {
      return false;
    }
    
    // Ensure position is valid
    if (!isValidPosition(retreatPosition)) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate all valid retreat options for a piece with BP costs
   * @param pieceType The type of piece
   * @param originalPosition Position before attack 
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param hasMoved Whether the piece has moved before (pre-attack)
   * @returns Array of retreat options with positions and BP costs
   */
  static getValidRetreats(
    pieceType: PieceType,
    originalPosition: Position,
    failedCapturePosition: Position,
    hasMoved: boolean
  ): RetreatOption[] {
    // Check if piece type is eligible for retreat
    if (![PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN, PieceType.KNIGHT].includes(pieceType)) {
      return [];
    }

    // Always add the original position as a no-cost retreat option
    const retreatOptions: RetreatOption[] = [
      {
        position: { ...originalPosition },
        bpCost: 0
      }
    ];
    
    // For knights, use the pre-computed lookup table
    if (pieceType === PieceType.KNIGHT) {
      // Get knight retreat options from the lookup table (excluding the original position)
      const knightOptions = getKnightRetreatOptions(originalPosition, failedCapturePosition)
        .filter(option => 
          !(option.position.x === originalPosition.x && option.position.y === originalPosition.y)
        );
      
      // Add knight options to retreat options
      retreatOptions.push(...knightOptions);
      return retreatOptions;
    }
    
    // For long-range pieces, calculate retreat options
    // Calculate all possible positions on the board
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const targetPos: Position = { x, y };
        
        // Skip the original position (already added)
        if (x === originalPosition.x && y === originalPosition.y) {
          continue;
        }
        
        // Check if this is a valid retreat move
        if (this.isValidRetreatMove(pieceType, originalPosition, failedCapturePosition, targetPos, hasMoved)) {
          const bpCost = this.calculateRetreatBPCost(
            pieceType,
            originalPosition, 
            targetPos, 
            failedCapturePosition
          );
          
          retreatOptions.push({
            position: targetPos,
            bpCost: bpCost
          });
        }
      }
    }
    
    return retreatOptions;
  }
} 