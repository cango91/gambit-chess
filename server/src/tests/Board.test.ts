import { Board } from '../models/Board';
import { GamePhase, PieceColor, Position } from '@gambit-chess/shared';

describe('Board', () => {
  let board: Board;

  beforeEach(() => {
    // Create a new empty board for each test
    board = new Board(false);
  });

  describe('Piece Management', () => {
    it('should add pieces correctly', () => {
      // Add various pieces to the board
      const pawn = board.addPiece('p', 'white', 'e2');
      const knight = board.addPiece('n', 'black', 'g8');
      const king = board.addPiece('k', 'white', 'e1');
      
      // Verify the pieces were added correctly
      expect(board.getPiece('e2')).toEqual(pawn);
      expect(board.getPiece('g8')).toEqual(knight);
      expect(board.getPiece('e1')).toEqual(king);
    });
    
    it('should get all pieces', () => {
      // Add pieces to the board
      board.addPiece('p', 'white', 'e2');
      board.addPiece('n', 'black', 'g8');
      board.addPiece('k', 'white', 'e1');
      
      // Get all pieces
      const allPieces = board.getAllPieces();
      
      // Check if all pieces are returned
      expect(allPieces.length).toBe(3);
      expect(allPieces.some(p => p.position === 'e2' && p.type === 'p')).toBe(true);
      expect(allPieces.some(p => p.position === 'g8' && p.type === 'n')).toBe(true);
      expect(allPieces.some(p => p.position === 'e1' && p.type === 'k')).toBe(true);
    });
    
    it('should get pieces by color', () => {
      // Add pieces of different colors
      board.addPiece('p', 'white', 'e2');
      board.addPiece('n', 'black', 'g8');
      board.addPiece('k', 'white', 'e1');
      
      // Get white pieces
      const whitePieces = board.getPiecesByColor('white');
      
      // Check if only white pieces are returned
      expect(whitePieces.length).toBe(2);
      expect(whitePieces.some(p => p.position === 'e2' && p.type === 'p')).toBe(true);
      expect(whitePieces.some(p => p.position === 'e1' && p.type === 'k')).toBe(true);
      
      // Get black pieces
      const blackPieces = board.getPiecesByColor('black');
      
      // Check if only black pieces are returned
      expect(blackPieces.length).toBe(1);
      expect(blackPieces.some(p => p.position === 'g8' && p.type === 'n')).toBe(true);
    });
    
    it('should get king position', () => {
      // Add kings
      board.addPiece('k', 'white', 'e1');
      board.addPiece('k', 'black', 'e8');
      
      // Check king positions
      expect(board.getKingPosition('white')).toBe('e1');
      expect(board.getKingPosition('black')).toBe('e8');
    });
  });
  
  describe('Move Validation', () => {
    it('should validate pawn moves correctly', () => {
      // Add a white pawn on e2
      board.addPiece('p', 'white', 'e2');
      
      // Valid moves: forward one or two squares from starting position
      expect(board.isValidMove('e2', 'e3')).toBe(true);
      expect(board.isValidMove('e2', 'e4')).toBe(true);
      
      // Invalid moves: backward, sideways, or too far
      expect(board.isValidMove('e2', 'e1')).toBe(false);
      expect(board.isValidMove('e2', 'd2')).toBe(false);
      expect(board.isValidMove('e2', 'e5')).toBe(false);
    });
    
    it('should validate pawn captures correctly', () => {
      // Setup: white pawn on e4, black pawn on d5
      board.addPiece('p', 'white', 'e4');
      board.addPiece('p', 'black', 'd5');
      
      // Valid diagonal capture
      expect(board.isValidMove('e4', 'd5')).toBe(true);
      
      // Invalid move: can't capture empty square diagonally
      expect(board.isValidMove('e4', 'f5')).toBe(false);
      
      // Invalid move: can't capture own piece
      board.addPiece('p', 'white', 'f5');
      expect(board.isValidMove('e4', 'f5')).toBe(false);
    });
    
    it('should validate knight moves correctly', () => {
      // Add a knight on e4
      board.addPiece('n', 'white', 'e4');
      
      // Valid L-shaped moves
      expect(board.isValidMove('e4', 'f6')).toBe(true);
      expect(board.isValidMove('e4', 'g5')).toBe(true);
      expect(board.isValidMove('e4', 'g3')).toBe(true);
      expect(board.isValidMove('e4', 'f2')).toBe(true);
      expect(board.isValidMove('e4', 'd2')).toBe(true);
      expect(board.isValidMove('e4', 'c3')).toBe(true);
      expect(board.isValidMove('e4', 'c5')).toBe(true);
      expect(board.isValidMove('e4', 'd6')).toBe(true);
      
      // Invalid non-L-shaped move
      expect(board.isValidMove('e4', 'e5')).toBe(false);
    });
  });
  
  describe('Game Phase Management', () => {
    it('should track and update game phase', () => {
      // Initial phase should be NORMAL
      expect(board.getCurrentPhase()).toBe(GamePhase.NORMAL);
      
      // Transition to duel phase
      board.transitionToDuel('white', 'e4', 'd5');
      expect(board.getCurrentPhase()).toBe(GamePhase.DUEL_ALLOCATION);
    });
    
    it('should track active player', () => {
      // Default active player should be white
      expect(board.getActivePlayer()).toBe('white');
      
      // Switch active player
      board.switchActivePlayer();
      expect(board.getActivePlayer()).toBe('black');
      
      // Set active player directly
      board.setActivePlayer('white');
      expect(board.getActivePlayer()).toBe('white');
    });
  });
  
  describe('Board State', () => {
    it('should create a snapshot', () => {
      // Add some pieces
      board.addPiece('p', 'white', 'e2');
      board.addPiece('k', 'white', 'e1');
      board.addPiece('k', 'black', 'e8');
      
      // Get snapshot
      const snapshot = board.toSnapshot();
      
      // Verify snapshot contains the pieces
      expect(snapshot.getPiece('e2')).toBeDefined();
      expect(snapshot.getPiece('e1')).toBeDefined();
      expect(snapshot.getPiece('e8')).toBeDefined();
    });
    
    it('should clone correctly', () => {
      // Add pieces to original board
      board.addPiece('p', 'white', 'e2');
      board.addPiece('k', 'white', 'e1');
      
      // Create a deep clone
      const clonedBoard = board.clone();
      
      // Modify original board
      board.addPiece('q', 'white', 'd1');
      
      // Verify cloned board is independent
      expect(clonedBoard.getPiece('e2')).toBeDefined();
      expect(clonedBoard.getPiece('e1')).toBeDefined();
      expect(clonedBoard.getPiece('d1')).toBeUndefined();
    });
  });
}); 