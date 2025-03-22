import { MoveValidator } from '../../src/validation';
import { BoardImpl, PieceFactoryImpl } from '../../src/models';
import { MoveType, PieceType, PlayerColor } from '../../src/types';

// Add Jest types at the top of the file to fix linting issues
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

describe('MoveValidator', () => {
  const pieceFactory = new PieceFactoryImpl();
  let consoleWarnSpy: any;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  describe('validateMove', () => {
    it('should validate a basic pawn move', () => {
      // Create a board with white pawn at e2
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }), // e2
      ]);
      
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 4, y: 1 }, // e2
        { x: 4, y: 2 }  // e3
      );
      
      expect(moveType).toBe(MoveType.NORMAL);
    });
    
    it('should validate a pawn capture', () => {
      // Create a board with white pawn at e2 and black pawn at d3
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }), // e2
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x: 3, y: 2 }), // d3
      ]);
      
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 4, y: 1 }, // e2
        { x: 3, y: 2 }  // d3
      );
      
      expect(moveType).toBe(MoveType.CAPTURE);
    });
    
    it('should throw error for a move that would result in check', () => {
      // White king at e1, white pawn at e2, black pawn at d3, and black rook at e8
      // If white pawn captures black pawn, it would expose the king to check from the black rook
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }), // e2
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x: 3, y: 2 }), // d3
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 4, y: 7 })  // e8
      ]);
      
      expect(() => {
        MoveValidator.validateMove(
          board, 
          { x: 4, y: 1 }, // e2
          { x: 3, y: 2 }  // d3 - capturing the black pawn would expose king to check
        );
      }).toThrow('Move would result in check');
    });
    
    it('should throw error for moving from an empty square', () => {
      // Empty board
      const board = new BoardImpl([]);
      
      expect(() => {
        MoveValidator.validateMove(
          board, 
          { x: 4, y: 1 }, // e2
          { x: 4, y: 2 }  // e3
        );
      }).toThrow('No piece at starting position');
    });
    
    it('should validate a castling move', () => {
      // White king at e1 and white rook at h1, neither has moved
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }, false), // e1
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 7, y: 0 }, false), // h1
      ]);
      
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 4, y: 0 }, // e1
        { x: 6, y: 0 }  // g1
      );
      
      expect(moveType).toBe(MoveType.CASTLE);
    });
    
    it('should validate a double pawn move from starting position', () => {
      // White pawn at e2 (starting position)
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }, false), // e2
      ]);
      
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }  // e4
      );
      
      expect(moveType).toBe(MoveType.NORMAL);
    });
    
    it('should validate a knight move properly', () => {
      // White knight at b1
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 1, y: 0 }), // b1
      ]);
      
      // Valid knight move
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 1, y: 0 }, // b1
        { x: 2, y: 2 }  // c3
      );
      
      expect(moveType).toBe(MoveType.NORMAL);
      
      // Invalid knight move - should throw error
      expect(() => {
        MoveValidator.validateMove(
          board, 
          { x: 1, y: 0 }, // b1
          { x: 3, y: 0 }  // d1
        );
      }).toThrow('Invalid move for this piece type');
    });
    
    it('should validate a rook move and path clearance', () => {
      // White rook at a1
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 0, y: 0 }), // a1
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 0, y: 2 }), // a3
      ]);
      
      // Valid rook move
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 0, y: 0 }, // a1
        { x: 0, y: 1 }  // a2
      );
      
      expect(moveType).toBe(MoveType.NORMAL);
    });
    
    it('should validate a pawn promotion move', () => {
      // White pawn about to promote
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 6 }), // e7
      ]);
      
      // Pawn moves to e8 (promotion square)
      const moveType = MoveValidator.validateMove(
        board, 
        { x: 4, y: 6 }, // e7
        { x: 4, y: 7 }  // e8
      );
      
      expect(moveType).toBe(MoveType.PROMOTION);
    });
  });
}); 