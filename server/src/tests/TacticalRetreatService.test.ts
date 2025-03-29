import { TacticalRetreatService } from '../services/TacticalRetreatService';
import { Board } from '../models/Board';
import { Position } from '@gambit-chess/shared';

describe('TacticalRetreatService', () => {
  let tacticalRetreatService: TacticalRetreatService;
  let board: Board;

  beforeEach(() => {
    tacticalRetreatService = new TacticalRetreatService();
    board = new Board(false); // Create empty board
  });

  describe('Rook Retreats', () => {
    it('should calculate valid retreat options for a rook along its attack axis', () => {
      // Setup: white rook at e4 attacked black pawn at e7
      board.addPiece('r', 'white', 'e4');
      board.addPiece('p', 'black', 'e7');
      
      // Mock the lastCaptureAttempt
      jest.spyOn(board, 'getLastCaptureAttempt').mockReturnValue({
        from: 'e1',
        to: 'e7'
      });
      
      // Calculate retreat options
      const retreatOptions = tacticalRetreatService.calculateRetreatOptions(board, 'e4');
      
      // Should include options along the e-file (vertical line)
      // e1 (original, free), e2, e3 (cost based on distance)
      expect(retreatOptions.length).toBeGreaterThan(0);
      
      // Original position should be free
      const originalPosOption = retreatOptions.find(option => option.to === 'e1');
      expect(originalPosOption).toBeDefined();
      expect(originalPosOption?.cost).toBe(0);
      
      // Other positions should have costs based on distance
      const e2Option = retreatOptions.find(option => option.to === 'e2');
      const e3Option = retreatOptions.find(option => option.to === 'e3');
      
      expect(e2Option).toBeDefined();
      expect(e2Option?.cost).toBe(1);
      
      expect(e3Option).toBeDefined();
      expect(e3Option?.cost).toBe(2);
    });
    
    it('should not include blocked squares in retreat options', () => {
      // Setup: white rook at e4 attacked black pawn at e7
      // with a blocking piece at e3
      board.addPiece('r', 'white', 'e4');
      board.addPiece('p', 'black', 'e7');
      board.addPiece('p', 'white', 'e3'); // Blocking piece
      
      // Mock the lastCaptureAttempt
      jest.spyOn(board, 'getLastCaptureAttempt').mockReturnValue({
        from: 'e1',
        to: 'e7'
      });
      
      // Calculate retreat options
      const retreatOptions = tacticalRetreatService.calculateRetreatOptions(board, 'e4');
      
      // e3 should not be in the options (blocked)
      const e3Option = retreatOptions.find(option => option.to === 'e3');
      expect(e3Option).toBeUndefined();
      
      // e2 should still be available
      const e2Option = retreatOptions.find(option => option.to === 'e2');
      expect(e2Option).toBeDefined();
    });
  });

  describe('Bishop Retreats', () => {
    it('should calculate valid retreat options for a bishop along its attack axis', () => {
      // Setup: white bishop at c3 attacked black pawn at e5
      board.addPiece('b', 'white', 'c3');
      board.addPiece('p', 'black', 'e5');
      
      // Mock the lastCaptureAttempt
      jest.spyOn(board, 'getLastCaptureAttempt').mockReturnValue({
        from: 'a1',
        to: 'e5'
      });
      
      // Calculate retreat options
      const retreatOptions = tacticalRetreatService.calculateRetreatOptions(board, 'c3');
      
      // Should include options along the diagonal
      // a1 (original, free), b2 (with cost)
      expect(retreatOptions.length).toBeGreaterThan(0);
      
      // Original position should be free
      const originalPosOption = retreatOptions.find(option => option.to === 'a1');
      expect(originalPosOption).toBeDefined();
      expect(originalPosOption?.cost).toBe(0);
      
      // b2 should have cost based on distance
      const b2Option = retreatOptions.find(option => option.to === 'b2');
      expect(b2Option).toBeDefined();
      expect(b2Option?.cost).toBe(1);
    });
  });

  describe('Knight Retreats', () => {
    it('should calculate valid retreat options for a knight', () => {
      // Setup: white knight at c3 attacked black pawn at d5
      board.addPiece('n', 'white', 'c3');
      board.addPiece('p', 'black', 'd5');
      
      // Mock the lastCaptureAttempt
      jest.spyOn(board, 'getLastCaptureAttempt').mockReturnValue({
        from: 'b1',
        to: 'd5'
      });
      
      // Calculate retreat options
      const retreatOptions = tacticalRetreatService.calculateRetreatOptions(board, 'c3');
      
      // Should include original position (free) and other valid retreat positions
      expect(retreatOptions.length).toBeGreaterThan(0);
      
      // Original position should be free
      const originalPosOption = retreatOptions.find(option => option.to === 'b1');
      expect(originalPosOption).toBeDefined();
      expect(originalPosOption?.cost).toBe(0);
      
      // Knight has special retreat rules, so other positions will have costs
      // based on knight movement patterns
    });
  });

  describe('Queen Retreats', () => {
    it('should calculate valid retreat options for a queen along its attack axis', () => {
      // Setup: white queen at d4 attacked black pawn at g7
      board.addPiece('q', 'white', 'd4');
      board.addPiece('p', 'black', 'g7');
      
      // Mock the lastCaptureAttempt
      jest.spyOn(board, 'getLastCaptureAttempt').mockReturnValue({
        from: 'a1',
        to: 'g7'
      });
      
      // Calculate retreat options
      const retreatOptions = tacticalRetreatService.calculateRetreatOptions(board, 'd4');
      
      // Should include options along the diagonal
      // a1 (original, free), b2, c3 (with costs)
      expect(retreatOptions.length).toBeGreaterThan(0);
      
      // Original position should be free
      const originalPosOption = retreatOptions.find(option => option.to === 'a1');
      expect(originalPosOption).toBeDefined();
      expect(originalPosOption?.cost).toBe(0);
      
      // Other positions should have costs based on distance
      const b2Option = retreatOptions.find(option => option.to === 'b2');
      const c3Option = retreatOptions.find(option => option.to === 'c3');
      
      expect(b2Option).toBeDefined();
      expect(c3Option).toBeDefined();
    });
  });

  describe('Retreat Validation and Cost', () => {
    it('should correctly validate retreat positions', () => {
      const retreatOptions = [
        { to: 'e1', cost: 0 },
        { to: 'e2', cost: 1 },
        { to: 'e3', cost: 2 }
      ];
      
      // Valid retreat position
      expect(tacticalRetreatService.isValidRetreatPosition(retreatOptions, 'e1')).toBe(true);
      expect(tacticalRetreatService.isValidRetreatPosition(retreatOptions, 'e2')).toBe(true);
      
      // Invalid retreat position
      expect(tacticalRetreatService.isValidRetreatPosition(retreatOptions, 'e4')).toBe(false);
      expect(tacticalRetreatService.isValidRetreatPosition(retreatOptions, 'a1')).toBe(false);
    });
    
    it('should correctly get retreat cost', () => {
      const retreatOptions = [
        { to: 'e1', cost: 0 },
        { to: 'e2', cost: 1 },
        { to: 'e3', cost: 2 }
      ];
      
      // Get costs for valid positions
      expect(tacticalRetreatService.getRetreatCost(retreatOptions, 'e1')).toBe(0);
      expect(tacticalRetreatService.getRetreatCost(retreatOptions, 'e2')).toBe(1);
      expect(tacticalRetreatService.getRetreatCost(retreatOptions, 'e3')).toBe(2);
      
      // Get cost for invalid position
      expect(tacticalRetreatService.getRetreatCost(retreatOptions, 'e4')).toBeUndefined();
    });
  });
}); 