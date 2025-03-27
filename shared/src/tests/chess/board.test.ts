import { BoardSnapshot } from '../../chess/board';
import { ChessPiece, PieceColor, PieceType, Position } from '../../types';

describe('BoardSnapshot', () => {
  describe('Initialization', () => {
    it('should set up the initial position correctly when setupBoard is true', () => {
      const board = new BoardSnapshot(true);
      
      // Check that all 32 pieces are on the board
      expect(board.getAllPieces().length).toBe(32);
      
      // Check some specific pieces
      expect(board.getPiece('e1')?.type).toBe('k');
      expect(board.getPiece('e1')?.color).toBe('white');
      expect(board.getPiece('e8')?.type).toBe('k');
      expect(board.getPiece('e8')?.color).toBe('black');
      expect(board.getPiece('d1')?.type).toBe('q');
      expect(board.getPiece('d8')?.type).toBe('q');
      
      // Check that pawns are set up correctly
      for (let file = 0; file < 8; file++) {
        const fileChar = String.fromCharCode(97 + file); // 'a' to 'h'
        
        expect(board.getPiece(`${fileChar}2`)?.type).toBe('p');
        expect(board.getPiece(`${fileChar}2`)?.color).toBe('white');
        expect(board.getPiece(`${fileChar}7`)?.type).toBe('p');
        expect(board.getPiece(`${fileChar}7`)?.color).toBe('black');
      }
    });
    
    it('should create an empty board when setupBoard is false', () => {
      const board = new BoardSnapshot(false);
      
      expect(board.getAllPieces().length).toBe(0);
    });
  });
  
  describe('Piece Manipulation', () => {
    let board: BoardSnapshot;
    
    beforeEach(() => {
      board = new BoardSnapshot(false); // Start with an empty board
    });
    
    it('should add a piece correctly', () => {
      const piece = board.addPiece('p', 'white', 'e4');
      
      expect(piece.type).toBe('p');
      expect(piece.color).toBe('white');
      expect(piece.position).toBe('e4');
      expect(piece.hasMoved).toBe(false);
      
      expect(board.getPiece('e4')).toEqual(piece);
    });
    
    it('should throw an error when adding a piece to an invalid position', () => {
      expect(() => board.addPiece('p', 'white', 'i9')).toThrow('Invalid position');
    });
    
    it('should remove a piece correctly', () => {
      board.addPiece('p', 'white', 'e4');
      
      const removedPiece = board.removePiece('e4');
      
      expect(removedPiece?.type).toBe('p');
      expect(removedPiece?.color).toBe('white');
      expect(board.getPiece('e4')).toBeUndefined();
      
      // Check that the piece was added to captured pieces
      expect(board.getCapturedPieces().length).toBe(1);
    });
    
    it('should return undefined when removing from an empty position', () => {
      const removedPiece = board.removePiece('e4');
      
      expect(removedPiece).toBeUndefined();
      expect(board.getCapturedPieces().length).toBe(0);
    });
    
    it('should get pieces by color correctly', () => {
      board.addPiece('p', 'white', 'e2');
      board.addPiece('p', 'white', 'd2');
      board.addPiece('p', 'black', 'e7');
      
      const whitePieces = board.getPiecesByColor('white');
      const blackPieces = board.getPiecesByColor('black');
      
      expect(whitePieces.length).toBe(2);
      expect(blackPieces.length).toBe(1);
      expect(whitePieces[0].color).toBe('white');
      expect(blackPieces[0].color).toBe('black');
    });
    
    it('should get king position correctly', () => {
      board.addPiece('k', 'white', 'e1');
      board.addPiece('k', 'black', 'e8');
      
      expect(board.getKingPosition('white')).toBe('e1');
      expect(board.getKingPosition('black')).toBe('e8');
    });
    
    it('should return undefined when king is not on the board', () => {
      expect(board.getKingPosition('white')).toBeUndefined();
    });
  });
  
  describe('Move Validation', () => {
    let board: BoardSnapshot;
    
    beforeEach(() => {
      board = new BoardSnapshot(false); // Start with an empty board
    });
    
    it('should validate pawn moves correctly', () => {
      board.addPiece('p', 'white', 'e2');
      
      // One square forward
      expect(board.isValidMove('e2', 'e3')).toBe(true);
      
      // Two squares forward (first move)
      expect(board.isValidMove('e2', 'e4')).toBe(true);
      
      // Invalid moves
      expect(board.isValidMove('e2', 'e5')).toBe(false); // Too far
      expect(board.isValidMove('e2', 'd3')).toBe(false); // Diagonal without capture
      expect(board.isValidMove('e2', 'f3')).toBe(false); // Diagonal without capture
      
      // Add opponent piece for capture
      board.addPiece('p', 'black', 'd3');
      
      // Valid capture
      expect(board.isValidMove('e2', 'd3')).toBe(true);
    });
    
    it('should validate knight moves correctly', () => {
      board.addPiece('n', 'white', 'e4');
      
      // Valid L-shaped moves
      expect(board.isValidMove('e4', 'f6')).toBe(true);
      expect(board.isValidMove('e4', 'd6')).toBe(true);
      expect(board.isValidMove('e4', 'c5')).toBe(true);
      expect(board.isValidMove('e4', 'c3')).toBe(true);
      expect(board.isValidMove('e4', 'd2')).toBe(true);
      expect(board.isValidMove('e4', 'f2')).toBe(true);
      expect(board.isValidMove('e4', 'g5')).toBe(true);
      expect(board.isValidMove('e4', 'g3')).toBe(true);
      
      // Invalid moves
      expect(board.isValidMove('e4', 'e5')).toBe(false);
      expect(board.isValidMove('e4', 'f4')).toBe(false);
      
      // Add a friendly piece
      board.addPiece('p', 'white', 'f6');
      
      // Cannot move to square with friendly piece
      expect(board.isValidMove('e4', 'f6')).toBe(false);
      
      // Add an opponent piece
      board.addPiece('p', 'black', 'g5');
      
      // Can capture opponent piece
      expect(board.isValidMove('e4', 'g5')).toBe(true);
    });
    
    it('should validate rook moves correctly', () => {
      board.addPiece('r', 'white', 'e4');
      
      // Valid moves
      expect(board.isValidMove('e4', 'e8')).toBe(true); // Vertical
      expect(board.isValidMove('e4', 'e1')).toBe(true); // Vertical
      expect(board.isValidMove('e4', 'a4')).toBe(true); // Horizontal
      expect(board.isValidMove('e4', 'h4')).toBe(true); // Horizontal
      
      // Invalid moves
      expect(board.isValidMove('e4', 'f5')).toBe(false); // Diagonal
      
      // Add pieces to block paths
      board.addPiece('p', 'white', 'e6'); // Block vertical path
      board.addPiece('p', 'black', 'g4'); // Block horizontal path
      
      // Cannot move through pieces
      expect(board.isValidMove('e4', 'e8')).toBe(false);
      expect(board.isValidMove('e4', 'h4')).toBe(false);
      
      // Can move up to blocking piece
      expect(board.isValidMove('e4', 'e5')).toBe(true);
      
      // Can capture opponent piece
      expect(board.isValidMove('e4', 'g4')).toBe(true);
      
      // Cannot capture friendly piece
      expect(board.isValidMove('e4', 'e6')).toBe(false);
    });

    it('should prevent moves that would leave the king in check', () => {
      // Set up a position where moving a piece would expose the king to check
      board.addPiece('k', 'white', 'e1');
      board.addPiece('r', 'white', 'e2'); // Rook protecting the king
      board.addPiece('q', 'black', 'e8'); // Queen aligned with the king but blocked by rook

      // Moving the rook horizontally would leave the king in check
      expect(board.isValidMove('e2', 'd2')).toBe(false);
      expect(board.isValidMove('e2', 'f2')).toBe(false);

      // Moving the rook vertically (still blocking the check) is valid
      expect(board.isValidMove('e2', 'e3')).toBe(true);
      expect(board.isValidMove('e2', 'e4')).toBe(true);

      // King can't move into a checked position
      board.addPiece('r', 'black', 'd8');
      expect(board.isValidMove('e1', 'd1')).toBe(false); // d-file is attacked by black rook
    });

    it('should allow king to capture an attacking piece', () => {
      board.addPiece('k', 'white', 'e1');
      board.addPiece('p', 'black', 'd2'); // Adjacent to king, so king can capture it
      board.addPiece('q', 'black', 'd1'); // Attacking king, but king can capture it

      // King can capture the attacking queen
      expect(board.isValidMove('e1', 'd1')).toBe(true);
    });

    it('should validate moves with respect to pins', () => {
      // Set up a position where a piece is pinned to the king
      board.addPiece('k', 'white', 'e1');
      board.addPiece('b', 'white', 'd2'); // Bishop pinned to king
      board.addPiece('b', 'black', 'c3'); // Enemy bishop creating the pin

      // Bishop can't move off the diagonal because it's pinned
      expect(board.isValidMove('d2', 'c2')).toBe(false);
      expect(board.isValidMove('d2', 'e2')).toBe(false);

      // Bishop can't move in a way that would expose the king to check
      expect(board.isValidMove('d2', 'c1')).toBe(false);
      
      // Bishop can't move along the diagonal toward the attacking piece
      expect(board.isValidMove('d2', 'e3')).toBe(false);

      // Bishop can capture the pinning piece
      expect(board.isValidMove('d2', 'c3')).toBe(true);
      
      // Let's try a different pin scenario along a rank
      board.removePiece('d2');
      board.removePiece('c3');
      
      // Add a rook pinned along a rank
      board.addPiece('r', 'white', 'e2'); // Rook protecting the king
      board.addPiece('q', 'black', 'e8'); // Queen creating the pin
      
      // Rook can't move off the e-file when pinned
      expect(board.isValidMove('e2', 'd2')).toBe(false);
      expect(board.isValidMove('e2', 'f2')).toBe(false);
      
      // Rook can move along the e-file
      expect(board.isValidMove('e2', 'e3')).toBe(true);
      expect(board.isValidMove('e2', 'e4')).toBe(true);
    });
  });
  
  describe('Making Moves', () => {
    let board: BoardSnapshot;
    
    beforeEach(() => {
      board = new BoardSnapshot(true); // Standard position
    });
    
    it('should make a basic pawn move correctly', () => {
      const result = board.makeMove('e2', 'e4');
      
      expect(result.success).toBe(true);
      expect(board.getPiece('e4')?.type).toBe('p');
      expect(board.getPiece('e2')).toBeUndefined();
      expect(board.getPiece('e4')?.hasMoved).toBe(true);
    });
    
    it('should handle captures correctly', () => {
      // Move pieces to set up a capture scenario
      board.makeMove('e2', 'e4');
      board.makeMove('d7', 'd5');
      
      // Capture the pawn
      const result = board.makeMove('e4', 'd5');
      
      expect(result.success).toBe(true);
      expect(result.captured?.type).toBe('p');
      expect(result.captured?.color).toBe('black');
      expect(board.getPiece('d5')?.type).toBe('p');
      expect(board.getPiece('d5')?.color).toBe('white');
      expect(board.getCapturedPieces().length).toBe(1);
    });
    
    it('should detect check correctly', () => {
      // Start with an empty board to set up a simple check situation
      const emptyBoard = new BoardSnapshot(false);
      
      // Add kings
      emptyBoard.addPiece('k', 'white', 'e1');
      emptyBoard.addPiece('k', 'black', 'e8');
      
      // Add queen to directly check the black king
      emptyBoard.addPiece('q', 'white', 'e5');
      
      // Move queen to check the king
      const result = emptyBoard.makeMove('e5', 'e7');
      
      expect(result.success).toBe(true);
      expect(result.check).toBe(true);
      expect(emptyBoard.isInCheck('black')).toBe(true);
    });

    it('should reject moves that would leave the player in check', () => {
      const testBoard = new BoardSnapshot(false);
      
      // Set up a position
      testBoard.addPiece('k', 'white', 'e1');
      testBoard.addPiece('r', 'white', 'e2');
      testBoard.addPiece('q', 'black', 'e8');
      
      // Try to move the rook, which would expose the king to check
      const result = testBoard.makeMove('e2', 'd2');
      
      expect(result.success).toBe(false);
    });
  });
}); 