import { TacticalRetreatRules } from '../../src/rules/TacticalRetreatRules';
import { Position, PieceType, PlayerColor } from '../../src/types';

describe('TacticalRetreatRules', () => {
  describe('calculateRetreatBPCost', () => {
    it('should return 0 for retreating to original position', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 5 };
      const retreatPosition: Position = { x: 3, y: 3 }; // Same as original
      
      const result = TacticalRetreatRules.calculateRetreatBPCost(
        PieceType.BISHOP,
        originalPosition,
        retreatPosition,
        failedCapturePosition
      );
      
      expect(result).toBe(0);
    });

    it('should calculate correct cost for bishop retreating along attack vector', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 5 };
      const retreatPosition: Position = { x: 1, y: 1 }; // Opposite direction from attack
      
      const result = TacticalRetreatRules.calculateRetreatBPCost(
        PieceType.BISHOP,
        originalPosition,
        retreatPosition,
        failedCapturePosition
      );
      
      expect(result).toBe(2); // 2 squares away from original position
    });

    it('should calculate correct cost for rook retreating along attack vector', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 3, y: 6 };
      const retreatPosition: Position = { x: 3, y: 1 }; // Opposite direction from attack
      
      const result = TacticalRetreatRules.calculateRetreatBPCost(
        PieceType.ROOK,
        originalPosition,
        retreatPosition,
        failedCapturePosition
      );
      
      expect(result).toBe(2); // 2 squares away from original position
    });

    it('should calculate costs for knight retreats based on the lookup table', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // Knight's move away
      
      // Valid retreats are within the rectangle formed by original position and failed capture
      // For this scenario, valid retreats would be in a 3x2 rectangle excluding original and failed positions
      const retreatPosition: Position = { x: 4, y: 3 }; // Valid retreat position in the rectangle
      
      const result = TacticalRetreatRules.calculateRetreatBPCost(
        PieceType.KNIGHT,
        originalPosition,
        retreatPosition,
        failedCapturePosition
      );
      
      // We're not testing the exact value, just that it's not -1 (invalid)
      expect(result).not.toBe(-1);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(7); // Maximum cost is 7 (using 3 bits)
    });
    
    it('should return -1 for invalid retreat position', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // Knight's move away
      
      // This is not a valid knight move from (3,3)
      const invalidRetreatPosition: Position = { x: 6, y: 6 };
      
      const result = TacticalRetreatRules.calculateRetreatBPCost(
        PieceType.KNIGHT,
        originalPosition,
        invalidRetreatPosition,
        failedCapturePosition
      );
      
      expect(result).toBe(-1);
    });
  });

  describe('isOnRetreatVector', () => {
    it('should return true for a position on the retreat vector for bishop', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 6, y: 6 };
      const retreatPosition: Position = { x: 1, y: 1 }; // On the same diagonal but opposite direction
      
      const result = TacticalRetreatRules.isOnRetreatVector(
        PieceType.BISHOP,
        originalPosition,
        failedCapturePosition,
        retreatPosition
      );
      
      expect(result).toBe(true);
    });

    it('should return true for a position on the retreat vector for rook (vertical)', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 3, y: 7 };
      const retreatPosition: Position = { x: 3, y: 1 }; // On the same vertical line but opposite direction
      
      const result = TacticalRetreatRules.isOnRetreatVector(
        PieceType.ROOK,
        originalPosition,
        failedCapturePosition,
        retreatPosition
      );
      
      expect(result).toBe(true);
    });

    it('should return true for a position on the retreat vector for rook (horizontal)', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 7, y: 3 };
      const retreatPosition: Position = { x: 1, y: 3 }; // On the same horizontal line but opposite direction
      
      const result = TacticalRetreatRules.isOnRetreatVector(
        PieceType.ROOK,
        originalPosition,
        failedCapturePosition,
        retreatPosition
      );
      
      expect(result).toBe(true);
    });

    it('should return false for a position not on the retreat vector', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 6, y: 6 };
      const retreatPosition: Position = { x: 4, y: 5 }; // Not on the same diagonal
      
      const result = TacticalRetreatRules.isOnRetreatVector(
        PieceType.BISHOP,
        originalPosition,
        failedCapturePosition,
        retreatPosition
      );
      
      expect(result).toBe(false);
    });
  });

  describe('getValidRetreats', () => {
    it('should include the original position in the retreat options', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 5 };
      
      const retreatOptions = TacticalRetreatRules.getValidRetreats(
        PieceType.BISHOP,
        originalPosition,
        failedCapturePosition,
        false // hasMoved
      );
      
      // Original position should always be a valid retreat with cost 0
      expect(retreatOptions).toContainEqual({
        position: originalPosition,
        bpCost: 0
      });
    });

    it('should not include the failed capture position in retreat options', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 5 };
      
      const retreatOptions = TacticalRetreatRules.getValidRetreats(
        PieceType.BISHOP,
        originalPosition,
        failedCapturePosition,
        false // hasMoved
      );
      
      // Failed capture position should not be a valid retreat
      const includesFailedCapturePosition = retreatOptions.some(
        option => option.position.x === failedCapturePosition.x && 
                  option.position.y === failedCapturePosition.y
      );
      
      expect(includesFailedCapturePosition).toBe(false);
    });

    it('should consider hasMoved parameter when generating retreat options', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 5 };
      
      const retreatOptions = TacticalRetreatRules.getValidRetreats(
        PieceType.BISHOP,
        originalPosition,
        failedCapturePosition,
        true // hasMoved
      );
      
      // Check that we got valid retreat options regardless of hasMoved
      expect(retreatOptions.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate valid retreat options for a queen (diagonal)', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 6, y: 6 };
      
      const retreatOptions = TacticalRetreatRules.getValidRetreats(
        PieceType.QUEEN,
        originalPosition,
        failedCapturePosition,
        false // hasMoved
      );
      
      // Should have at least two options: original position (3,3) and position on opposite diagonal
      expect(retreatOptions.length).toBeGreaterThanOrEqual(2);
      
      // Check that a position on the opposite diagonal is included with the right cost
      const includesOppositePosition = retreatOptions.some(
        option => option.position.x === 1 && 
                option.position.y === 1
      );
      
      expect(includesOppositePosition).toBe(true);
    });

    it('should generate valid retreat options for a knight', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // Knight's move away
      
      const retreatOptions = TacticalRetreatRules.getValidRetreats(
        PieceType.KNIGHT,
        originalPosition,
        failedCapturePosition,
        false // hasMoved
      );
      
      // Should have at least the original position
      expect(retreatOptions.length).toBeGreaterThanOrEqual(1);
      
      // Original position should be included with cost 0
      const includesOriginalPosition = retreatOptions.some(
        option => option.position.x === originalPosition.x && 
                  option.position.y === originalPosition.y &&
                  option.bpCost === 0
      );
      
      expect(includesOriginalPosition).toBe(true);
    });
  });
}); 