import { BPManager } from '../services/BPManager';
import { TacticalDetectorService } from '../services/TacticalDetectorService';
import { Board } from '../models/Board';
import { PieceColor } from '@gambit-chess/shared';

// Mock TacticalDetectorService
jest.mock('../services/TacticalDetectorService');

describe('BPManager', () => {
  let bpManager: BPManager;
  let mockTacticalDetector: jest.Mocked<TacticalDetectorService>;
  
  beforeEach(() => {
    // Create a mocked TacticalDetectorService
    mockTacticalDetector = new TacticalDetectorService() as jest.Mocked<TacticalDetectorService>;
    mockTacticalDetector.calculateTacticalAdvantages = jest.fn().mockReturnValue(0);
    
    // Create a new BPManager with default initial BP
    bpManager = new BPManager(39, mockTacticalDetector);
  });
  
  describe('BP Pool Management', () => {
    it('should initialize with the correct BP values', () => {
      // Check initial BP values
      expect(bpManager.getBpPool('white')).toBe(39);
      expect(bpManager.getBpPool('black')).toBe(39);
    });
    
    it('should allow setting custom BP values', () => {
      // Set custom BP values
      bpManager.setBpPool('white', 20);
      bpManager.setBpPool('black', 25);
      
      // Check updated BP values
      expect(bpManager.getBpPool('white')).toBe(20);
      expect(bpManager.getBpPool('black')).toBe(25);
    });
    
    it('should reset BP pools correctly', () => {
      // First change the BP values
      bpManager.setBpPool('white', 10);
      bpManager.setBpPool('black', 15);
      
      // Reset to default
      bpManager.resetBpPools();
      
      // Check reset values
      expect(bpManager.getBpPool('white')).toBe(39);
      expect(bpManager.getBpPool('black')).toBe(39);
      
      // Reset to custom value
      bpManager.resetBpPools(50);
      
      // Check custom reset values
      expect(bpManager.getBpPool('white')).toBe(50);
      expect(bpManager.getBpPool('black')).toBe(50);
    });
    
    it('should throw an error when setting negative BP', () => {
      expect(() => {
        bpManager.setBpPool('white', -5);
      }).toThrow('BP pool cannot be negative');
    });
  });
  
  describe('BP Allocation', () => {
    it('should allocate BP successfully when enough is available', () => {
      // BP starting at 39, allocate 10
      const result = bpManager.allocateBP('white', 10);
      
      // Should succeed and deduct BP
      expect(result).toBe(true);
      expect(bpManager.getBpPool('white')).toBe(29);
    });
    
    it('should fail to allocate BP when not enough is available', () => {
      // Set a low BP value
      bpManager.setBpPool('white', 5);
      
      // Try to allocate more than available
      const result = bpManager.allocateBP('white', 10);
      
      // Should fail and not change BP
      expect(result).toBe(false);
      expect(bpManager.getBpPool('white')).toBe(5);
    });
    
    it('should throw an error when allocating negative BP', () => {
      expect(() => {
        bpManager.allocateBP('white', -5);
      }).toThrow('Cannot allocate negative BP');
    });
    
    it('should check BP availability correctly', () => {
      bpManager.setBpPool('white', 10);
      
      // Should have enough for 10 BP
      expect(bpManager.hasEnoughBP('white', 10)).toBe(true);
      
      // Should not have enough for 11 BP
      expect(bpManager.hasEnoughBP('white', 11)).toBe(false);
    });
  });
  
  describe('BP Regeneration', () => {
    it('should regenerate BP correctly with tactical advantages', () => {
      // Setup
      const currentBoard = new Board(false);
      const previousBoard = new Board(false);
      
      // Mock tactical detector to return 3 BP from advantages
      mockTacticalDetector.calculateTacticalAdvantages.mockReturnValueOnce(3);
      
      // White starts with 39 BP
      expect(bpManager.getBpPool('white')).toBe(39);
      
      // Regenerate BP (1 base + 3 tactical = 4 total)
      const regenAmount = bpManager.regenerateBP('white', currentBoard, previousBoard);
      
      // Check regeneration amount and updated pool
      expect(regenAmount).toBe(4);
      expect(bpManager.getBpPool('white')).toBe(43);
      
      // Verify tacticalDetector was called
      expect(mockTacticalDetector.calculateTacticalAdvantages).toHaveBeenCalledWith(
        'white',
        currentBoard,
        previousBoard
      );
    });
    
    it('should regenerate base BP (1) with no tactical advantages', () => {
      // Setup
      const currentBoard = new Board(false);
      const previousBoard = new Board(false);
      
      // Mock tactical detector to return 0 BP from advantages
      mockTacticalDetector.calculateTacticalAdvantages.mockReturnValueOnce(0);
      
      // White starts with 39 BP
      expect(bpManager.getBpPool('white')).toBe(39);
      
      // Regenerate BP (1 base + 0 tactical = 1 total)
      const regenAmount = bpManager.regenerateBP('white', currentBoard, previousBoard);
      
      // Check regeneration amount and updated pool
      expect(regenAmount).toBe(1);
      expect(bpManager.getBpPool('white')).toBe(40);
    });
  });
}); 