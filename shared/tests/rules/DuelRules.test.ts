import { DuelRules } from '../../src/rules/DuelRules';
import { PieceType, PlayerColor, BP_CAPACITY } from '../../src/types';

describe('DuelRules', () => {
  describe('getBPCapacity', () => {
    it('should return the correct BP capacity for each piece type', () => {
      expect(DuelRules.getBPCapacity(PieceType.PAWN)).toBe(BP_CAPACITY[PieceType.PAWN]);
      expect(DuelRules.getBPCapacity(PieceType.KNIGHT)).toBe(BP_CAPACITY[PieceType.KNIGHT]);
      expect(DuelRules.getBPCapacity(PieceType.BISHOP)).toBe(BP_CAPACITY[PieceType.BISHOP]);
      expect(DuelRules.getBPCapacity(PieceType.ROOK)).toBe(BP_CAPACITY[PieceType.ROOK]);
      expect(DuelRules.getBPCapacity(PieceType.QUEEN)).toBe(BP_CAPACITY[PieceType.QUEEN]);
      expect(DuelRules.getBPCapacity(PieceType.KING)).toBe(BP_CAPACITY[PieceType.KING]);
    });
  });

  describe('calculateBPCost', () => {
    it('should return the allocated amount for values within capacity', () => {
      // PAWN capacity is 1
      const costPawn = DuelRules.calculateBPCost(PieceType.PAWN, 1);
      expect(costPawn).toBe(1);
      
      // KNIGHT capacity is 3
      const costKnight = DuelRules.calculateBPCost(PieceType.KNIGHT, 3);
      expect(costKnight).toBe(3);
      
      // BISHOP capacity is 3
      const costBishop = DuelRules.calculateBPCost(PieceType.BISHOP, 3);
      expect(costBishop).toBe(3);
    });
    
    it('should apply doubled cost for allocations exceeding capacity', () => {
      // PAWN capacity is 1, allocation of 3 should cost 1 + (3-1)*2 = 5
      const costPawn = DuelRules.calculateBPCost(PieceType.PAWN, 3);
      expect(costPawn).toBe(5);
      
      // ROOK capacity is 5, allocation of 7 should cost 5 + (7-5)*2 = 9
      const costRook = DuelRules.calculateBPCost(PieceType.ROOK, 7);
      expect(costRook).toBe(9);
    });
    
    it('should return 0 for king regardless of allocation', () => {
      const cost = DuelRules.calculateBPCost(PieceType.KING, 3);
      expect(cost).toBe(0); // King cannot be allocated BP
    });
  });

  describe('isValidAllocation', () => {
    it('should return true for valid pawn allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.PAWN, 3, playerTotalBP);
      expect(result).toBe(true);
    });

    it('should return true for valid knight allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.KNIGHT, 4, playerTotalBP);
      expect(result).toBe(true);
    });

    it('should return true for valid bishop allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.BISHOP, 3, playerTotalBP);
      expect(result).toBe(true);
    });

    it('should return true for valid rook allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.ROOK, 5, playerTotalBP);
      expect(result).toBe(true);
    });

    it('should return true for valid queen allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.QUEEN, 7, playerTotalBP);
      expect(result).toBe(true);
    });

    it('should return false for king allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.KING, 3, playerTotalBP);
      expect(result).toBe(false);
    });

    it('should return false for negative allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.PAWN, -1, playerTotalBP);
      expect(result).toBe(false);
    });

    it('should return false for zero allocation', () => {
      const playerTotalBP = 10;
      const result = DuelRules.isValidAllocation(PieceType.PAWN, 0, playerTotalBP);
      expect(result).toBe(false);
    });

    it('should return false for allocation exceeding maximum', () => {
      const playerTotalBP = 15;
      const result = DuelRules.isValidAllocation(PieceType.QUEEN, 11, playerTotalBP);
      expect(result).toBe(false);
    });
    
    it('should return false if player does not have enough BP', () => {
      const playerTotalBP = 4;
      const result = DuelRules.isValidAllocation(PieceType.QUEEN, 5, playerTotalBP);
      expect(result).toBe(false);
    });
  });

  describe('canPerformTacticalRetreat', () => {
    it('should return true for long-range pieces', () => {
      expect(DuelRules.canPerformTacticalRetreat(PieceType.BISHOP)).toBe(true);
      expect(DuelRules.canPerformTacticalRetreat(PieceType.ROOK)).toBe(true);
      expect(DuelRules.canPerformTacticalRetreat(PieceType.QUEEN)).toBe(true);
      expect(DuelRules.canPerformTacticalRetreat(PieceType.KNIGHT)).toBe(true);
    });

    it('should return false for short-range pieces', () => {
      expect(DuelRules.canPerformTacticalRetreat(PieceType.PAWN)).toBe(false);
      expect(DuelRules.canPerformTacticalRetreat(PieceType.KING)).toBe(false);
    });
  });
}); 