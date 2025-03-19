import { BP_CAPACITY, PieceType, Piece, PlayerColor } from '../types';

/**
 * Rules for the Battle Points duel system.
 * Contains only validation logic that can be shared between client and server.
 * Actual BP allocation and duel resolution happens on the server.
 */
export class DuelRules {
  /**
   * Calculate the maximum BP a player can allocate for a piece
   * @param pieceType The type of piece
   * @returns Maximum BP capacity for the piece
   */
  static getBPCapacity(pieceType: PieceType): number {
    return BP_CAPACITY[pieceType];
  }

  /**
   * Calculate BP cost for allocation
   * @param pieceType The type of piece
   * @param amount Amount of BP being allocated
   * @returns The actual BP cost (doubles if exceeding capacity)
   */
  static calculateBPCost(pieceType: PieceType, amount: number): number {
    const capacity = this.getBPCapacity(pieceType);
    
    // King has no BP capacity as it cannot be captured
    if (pieceType === PieceType.KING) {
      return 0;
    }
    
    // BP exceeding capacity costs double
    if (amount <= capacity) {
      return amount;
    } else {
      const baseCost = capacity;
      const excessCost = (amount - capacity) * 2;
      return baseCost + excessCost;
    }
  }

  /**
   * Validate BP allocation
   * @param pieceType The type of piece
   * @param amount Amount of BP to allocate
   * @param playerTotalBP Total BP available to the player
   * @returns Whether the allocation is valid
   */
  static isValidAllocation(pieceType: PieceType, amount: number, playerTotalBP: number): boolean {
    // Cannot allocate BP to King
    if (pieceType === PieceType.KING) {
      return false;
    }
    
    // Cannot allocate negative or zero BP
    if (amount <= 0) {
      return false;
    }
    
    // Maximum BP allocation is 10 for any piece
    if (amount > 10) {
      return false;
    }
    
    // Check if player has enough BP
    const cost = this.calculateBPCost(pieceType, amount);
    return cost <= playerTotalBP;
  }

  /**
   * Check if a piece is eligible for tactical retreat
   * @param pieceType The type of piece
   * @returns Whether the piece can perform tactical retreat
   */
  static canPerformTacticalRetreat(pieceType: PieceType): boolean {
    // Long-range pieces and knights can perform tactical retreat
    return [
      PieceType.BISHOP, 
      PieceType.ROOK, 
      PieceType.QUEEN,
      PieceType.KNIGHT
    ].includes(pieceType);
  }
} 