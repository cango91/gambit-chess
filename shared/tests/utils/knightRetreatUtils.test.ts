import { 
  initializeKnightRetreatTable,
  getKnightRetreatOptions,
  isValidKnightRetreatPosition,
  getKnightRetreatCost,
  generateRetreatKey,
  unpackRetreatOption
} from '../../src/utils/knightRetreatUtils';
import { Position } from '../../src/types';

describe('knightRetreatUtils', () => {
  beforeAll(() => {
    // Initialize the knight retreat table before tests
    initializeKnightRetreatTable();
  });

  describe('unpackRetreatOption', () => {
    it('should correctly unpack a retreat option', () => {
      // 3 bits for x (3), 3 bits for y (4), 2 bits for cost (2)
      // (3 << 5) | (4 << 2) | 2 = 96 + 16 + 2 = 114
      const packedOption = 114;
      
      const unpacked = unpackRetreatOption(packedOption);
      
      expect(unpacked.position.x).toBe(3);
      expect(unpacked.position.y).toBe(4);
      expect(unpacked.bpCost).toBe(2);
    });

    it('should handle edge values correctly', () => {
      // 3 bits for x (7), 3 bits for y (7), 2 bits for cost (3)
      // (7 << 5) | (7 << 2) | 3 = 224 + 28 + 3 = 255
      const packedOption = 255;
      
      const unpacked = unpackRetreatOption(packedOption);
      
      expect(unpacked.position.x).toBe(7);
      expect(unpacked.position.y).toBe(7);
      expect(unpacked.bpCost).toBe(3);
    });

    it('should unpack the maximum cost value correctly', () => {
      // 3 bits for x (0), 3 bits for y (1), 2 bits for cost (3 as max)
      // (0 << 5) | (1 << 2) | 3 = 0 + 4 + 3 = 7
      const packedOption = 7;
      
      const unpacked = unpackRetreatOption(packedOption);
      
      expect(unpacked.position.x).toBe(0);
      expect(unpacked.position.y).toBe(1);
      expect(unpacked.bpCost).toBe(3);
    });
  });

  describe('generateRetreatKey', () => {
    it('should generate unique keys for different position pairs', () => {
      const original1: Position = { x: 3, y: 3 };
      const capture1: Position = { x: 5, y: 4 };
      
      const original2: Position = { x: 5, y: 4 };
      const capture2: Position = { x: 3, y: 3 };
      
      const key1 = generateRetreatKey(original1, capture1);
      const key2 = generateRetreatKey(original2, capture2);
      
      expect(key1).not.toBe(key2);
    });
    
    it('should generate consistent keys', () => {
      const original: Position = { x: 3, y: 3 };
      const capture: Position = { x: 5, y: 4 };
      
      const key1 = generateRetreatKey(original, capture);
      const key2 = generateRetreatKey(original, capture);
      
      expect(key1).toBe(key2);
    });
  });

  describe('getKnightRetreatOptions', () => {
    it('should include the original position in retreat options', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // Knight's move away
      
      const retreatOptions = getKnightRetreatOptions(
        originalPosition,
        failedCapturePosition
      );
      
      // Original position should always be a valid retreat with cost 0
      const includesOriginalPosition = retreatOptions.some(
        option => option.position.x === originalPosition.x && 
                  option.position.y === originalPosition.y &&
                  option.bpCost === 0
      );
      
      expect(includesOriginalPosition).toBe(true);
    });

    it('should not include the failed capture position in retreat options', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // Knight's move away
      
      const retreatOptions = getKnightRetreatOptions(
        originalPosition,
        failedCapturePosition
      );
      
      // Failed capture position should not be a valid retreat
      const includesFailedCapturePosition = retreatOptions.some(
        option => option.position.x === failedCapturePosition.x && 
                  option.position.y === failedCapturePosition.y
      );
      
      expect(includesFailedCapturePosition).toBe(false);
    });

    it('should generate valid knight retreat options', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // Knight's move away
      
      const retreatOptions = getKnightRetreatOptions(
        originalPosition,
        failedCapturePosition
      );
      
      // Should have at least two options
      expect(retreatOptions.length).toBeGreaterThanOrEqual(2);
      
      // All retreat options should be within the board
      const allValid = retreatOptions.every(
        option => 
          option.position.x >= 0 && option.position.x < 8 &&
          option.position.y >= 0 && option.position.y < 8
      );
      
      expect(allValid).toBe(true);
    });

    it('should handle edge positions correctly', () => {
      const originalPosition: Position = { x: 0, y: 0 };
      const failedCapturePosition: Position = { x: 2, y: 1 }; // Knight's move away
      
      const retreatOptions = getKnightRetreatOptions(
        originalPosition,
        failedCapturePosition
      );
      
      // Should have at least one option (the original position)
      expect(retreatOptions.length).toBeGreaterThanOrEqual(1);
      
      // All retreat options should be within the board
      const allValid = retreatOptions.every(
        option => 
          option.position.x >= 0 && option.position.x < 8 &&
          option.position.y >= 0 && option.position.y < 8
      );
      
      expect(allValid).toBe(true);
    });
  });

  describe('isValidKnightRetreatPosition', () => {
    it('should return true for original position', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // L-shaped move from original
      
      // @ts-ignore - accessing private function for testing
      const result = isValidKnightRetreatPosition(
        originalPosition,
        failedCapturePosition,
        originalPosition
      );
      
      expect(result).toBe(true);
    });
    
    it('should return true for valid retreat position in rectangle', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // L-shaped move from original
      const retreatPosition: Position = { x: 4, y: 3 }; // In the retreat rectangle
      
      // @ts-ignore - accessing private function for testing
      const result = isValidKnightRetreatPosition(
        originalPosition,
        failedCapturePosition,
        retreatPosition
      );
      
      expect(result).toBe(true);
    });
    
    it('should return false for position outside retreat area', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // L-shaped move from original
      const invalidPosition: Position = { x: 1, y: 1 }; // Outside the retreat rectangle
      
      // @ts-ignore - accessing private function for testing
      const result = isValidKnightRetreatPosition(
        originalPosition,
        failedCapturePosition,
        invalidPosition
      );
      
      expect(result).toBe(false);
    });
  });

  describe('getKnightRetreatCost', () => {
    it('should return 0 for the original position', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // L-shaped move from original
      
      // @ts-ignore - accessing private function for testing
      const cost = getKnightRetreatCost(
        originalPosition,
        failedCapturePosition,
        originalPosition
      );
      
      expect(cost).toBe(0);
    });
    
    it('should return a non-negative cost for valid retreat positions', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // L-shaped move from original
      
      // First find a valid retreat position other than the original
      // @ts-ignore - accessing private function for testing
      const options = getKnightRetreatOptions(originalPosition, failedCapturePosition);
      const retreatOption = options.find(
        option => !(option.position.x === originalPosition.x && 
                    option.position.y === originalPosition.y)
      );
      
      if (retreatOption) {
        // @ts-ignore - accessing private function for testing
        const cost = getKnightRetreatCost(
          originalPosition,
          failedCapturePosition,
          retreatOption.position
        );
        
        expect(cost).toBeGreaterThan(0);
      }
    });
    
    it('should return -1 for invalid retreat positions', () => {
      const originalPosition: Position = { x: 3, y: 3 };
      const failedCapturePosition: Position = { x: 5, y: 4 }; // L-shaped move from original
      const invalidPosition: Position = { x: 7, y: 7 }; // Far outside the retreat rectangle
      
      // @ts-ignore - accessing private function for testing
      const cost = getKnightRetreatCost(
        originalPosition,
        failedCapturePosition,
        invalidPosition
      );
      
      expect(cost).toBe(-1);
    });
  });
}); 