import { TacticalDetectorService } from '../services/TacticalDetectorService';
import { Board } from '../models/Board';
import { PieceColor, Position } from '@gambit-chess/shared';

describe('TacticalDetectorService', () => {
  let tacticalDetectorService: TacticalDetectorService;
  let board: Board;
  let previousBoard: Board;

  beforeEach(() => {
    // Create a new tactical detector for each test
    tacticalDetectorService = new TacticalDetectorService();
    
    // Create empty boards
    board = new Board(false); // false means don't set up the initial position
    previousBoard = new Board(false);
  });

  describe('Pin Detection', () => {
    it('should detect a pin correctly', () => {
      // Set up a position with a pin
      // White bishop pins black knight to black king
      const whiteBishop = board.addPiece('b', 'white', 'c4');
      const blackKnight = board.addPiece('n', 'black', 'd5');
      const blackKing = board.addPiece('k', 'black', 'e6');
      
      // Same setup for previous board but without the pin
      previousBoard.addPiece('b', 'white', 'a2'); // Bishop not on pinning square
      previousBoard.addPiece('n', 'black', 'd5');
      previousBoard.addPiece('k', 'black', 'e6');
      
      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // The knight is worth 3 points, so pin should generate some BP
      expect(bpRegen).toBeGreaterThan(0);
    });
    
    it('should not count a pin that already existed', () => {
      // Set up a position with a pin in both current and previous boards
      const whiteBishop = board.addPiece('b', 'white', 'c4');
      const blackKnight = board.addPiece('n', 'black', 'd5');
      const blackKing = board.addPiece('k', 'black', 'e6');
      
      // Same setup for previous board with the same pin
      previousBoard.addPiece('b', 'white', 'c4');
      previousBoard.addPiece('n', 'black', 'd5');
      previousBoard.addPiece('k', 'black', 'e6');
      
      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // No new pin, so should get 0 BP
      expect(bpRegen).toBe(0);
    });
  });

  describe('Check Detection', () => {
    it('should detect a new check correctly', () => {
      // Set up a position with a check
      // Simple setup - just king and queen
      board.addPiece('k', 'black', 'e8');
      board.addPiece('q', 'white', 'e7'); // Queen checks the king
      
      // Previous board without the check
      previousBoard.addPiece('k', 'black', 'e8');
      previousBoard.addPiece('q', 'white', 'e1'); // Queen away from checking position
      
      // We need to mock the isInCheck method since we're using a simplified board setup
      jest.spyOn(board, 'isInCheck').mockImplementation((color: PieceColor) => {
        return color === 'black'; // Black king is in check
      });
      
      jest.spyOn(previousBoard, 'isInCheck').mockImplementation((color: PieceColor) => {
        return false; // No check in previous board
      });
      
      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // New check should give 2 BP
      expect(bpRegen).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Fork Detection', () => {
    it('should detect a knight fork correctly', () => {
      // Set up a position with a knight fork
      // White knight forks black king and rook
      board.addPiece('n', 'white', 'd5');
      board.addPiece('k', 'black', 'c7');
      board.addPiece('r', 'black', 'e7');
      
      // Previous board with knight not in forking position
      previousBoard.addPiece('n', 'white', 'b4');
      previousBoard.addPiece('k', 'black', 'c7');
      previousBoard.addPiece('r', 'black', 'e7');
      
      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // Fork involving high value pieces should generate BP
      expect(bpRegen).toBeGreaterThan(0);
    });
    
    it('should not count a fork that already existed', () => {
      // Set up a position with a fork in both current and previous boards
      board.addPiece('n', 'white', 'd5');
      board.addPiece('k', 'black', 'c7');
      board.addPiece('r', 'black', 'e7');
      
      // Same fork in previous board
      previousBoard.addPiece('n', 'white', 'd5');
      previousBoard.addPiece('k', 'black', 'c7');
      previousBoard.addPiece('r', 'black', 'e7');
      
      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // No new fork, so should get 0 BP
      expect(bpRegen).toBe(0);
    });
  });

  describe('Skewer Detection', () => {
    it('should detect a bishop skewer correctly', () => {
      // Set up a position where white bishop skewers black queen and rook
      board.addPiece('b', 'white', 'c4');
      board.addPiece('q', 'black', 'e6'); // Higher value piece in front
      board.addPiece('r', 'black', 'g8'); // Lower value piece behind

      // Create previous board without the bishop
      const previousBoard = new Board(false);
      previousBoard.addPiece('q', 'black', 'e6');
      previousBoard.addPiece('r', 'black', 'g8');

      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // Should generate BP for the skewer
      expect(bpRegen).toBeGreaterThan(0);
    });

    it('should not count a skewer that already existed', () => {
      // Set up a position where white bishop skewers black queen and rook
      board.addPiece('b', 'white', 'c4');
      board.addPiece('q', 'black', 'e6');
      board.addPiece('r', 'black', 'g8');

      // Create previous board with the same setup
      const previousBoard = new Board(false);
      previousBoard.addPiece('b', 'white', 'c4');
      previousBoard.addPiece('q', 'black', 'e6');
      previousBoard.addPiece('r', 'black', 'g8');

      // Calculate BP regeneration
      const bpRegen = tacticalDetectorService.calculateTacticalAdvantages('white', board, previousBoard);
      
      // Should not generate BP for pre-existing skewer
      expect(bpRegen).toBe(0);
    });
  });
}); 