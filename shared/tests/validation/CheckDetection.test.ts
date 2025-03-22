import { CheckDetection } from '../../src/validation';
import { BoardImpl, PieceFactoryImpl } from '../../src/models';
import { PieceType, PlayerColor } from '../../src/types';

// Add Jest types at the top of the file to fix linting issues
declare const describe: any;
declare const it: any;
declare const expect: any;

describe('CheckDetection', () => {
  const pieceFactory = new PieceFactoryImpl();
  
  describe('isInCheck', () => {
    it('should detect when a king is in check from a rook', () => {
      // Create a board with white king at e1 and black rook at e8
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 4, y: 7 })  // e8
      ]);
      
      // White king is in check since the black rook has a clear path
      expect(CheckDetection.isInCheck(board, PlayerColor.WHITE)).toBe(true);
    });
    
    it('should not detect check when path is blocked', () => {
      // Create a board with white king at e1, black rook at e8, and white pawn at e2
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }), // e2
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 4, y: 7 })  // e8
      ]);
      
      // White king is not in check since the white pawn blocks the rook's path
      expect(CheckDetection.isInCheck(board, PlayerColor.WHITE)).toBe(false);
    });
    
    it('should detect check from a knight', () => {
      // Create a board with white king at e1 and black knight at f3
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 5, y: 2 })  // f3
      ]);
      
      // White king is in check from the knight
      expect(CheckDetection.isInCheck(board, PlayerColor.WHITE)).toBe(true);
    });
    
    it('should detect check from a pawn', () => {
      // Create a board with white king at e1 and black pawn at d2
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x: 3, y: 1 })  // d2
      ]);
      
      // White king is in check from the pawn's diagonal attack
      expect(CheckDetection.isInCheck(board, PlayerColor.WHITE)).toBe(true);
    });
    
    it('should not detect check from the same color pieces', () => {
      // Create a board with white king at e1 and white rook at e8
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 4, y: 7 })  // e8
      ]);
      
      // White king is not in check from the white rook
      expect(CheckDetection.isInCheck(board, PlayerColor.WHITE)).toBe(false);
    });
  });
  
  describe('isPositionUnderAttack', () => {
    it('should detect when a position is under attack by a bishop', () => {
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 0, y: 0 }), // a1
      ]);
      
      // Position d4 is under attack by the bishop at a1
      expect(CheckDetection.isPositionUnderAttack(
        board, 
        { x: 3, y: 3 }, // d4
        PlayerColor.WHITE
      )).toBe(true);
    });
    
    it('should not detect attack when path is blocked', () => {
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 0, y: 0 }), // a1
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 2, y: 2 }),  // c3
      ]);
      
      // Position d4 is not under attack by the bishop because the pawn blocks the path
      expect(CheckDetection.isPositionUnderAttack(
        board, 
        { x: 3, y: 3 }, // d4
        PlayerColor.WHITE
      )).toBe(false);
    });
    
    it('should detect when a position is under attack by a pawn', () => {
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x: 2, y: 6 }), // c7
      ]);
      
      // Position b6 is under attack by the black pawn's diagonal capture move
      expect(CheckDetection.isPositionUnderAttack(
        board, 
        { x: 1, y: 5 }, // b6
        PlayerColor.WHITE
      )).toBe(true);
      
      // Position c5 is not under attack by the black pawn (forward move, not a capture)
      expect(CheckDetection.isPositionUnderAttack(
        board, 
        { x: 2, y: 4 }, // c5
        PlayerColor.WHITE
      )).toBe(false);
    });
  });
  
  describe('wouldMoveResultInCheck', () => {
    it('should detect when moving a piece would put the king in check', () => {
      // White king at e1, white pawn at e2 blocking black rook at e8
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }), // e2
        pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 4, y: 7 })  // e8
      ]);
      
      // Moving the pawn would expose the king to check by the black rook
      expect(CheckDetection.wouldMoveResultInCheck(
        board,
        { x: 4, y: 1 }, // e2 - pawn
        { x: 3, y: 2 }, // d3 - diagonal move
        PlayerColor.WHITE
      )).toBe(true);
    });
    
    it('should detect when moving the king would put it in check', () => {
      // White king at e1, black bishop at a5
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 0, y: 4 })  // a5
      ]);
      
      // Moving the king to d2 would put it in check from the bishop
      expect(CheckDetection.wouldMoveResultInCheck(
        board,
        { x: 4, y: 0 }, // e1
        { x: 3, y: 1 }, // d2
        PlayerColor.WHITE
      )).toBe(true);
      
      // Moving the king to f2 would not put it in check
      expect(CheckDetection.wouldMoveResultInCheck(
        board,
        { x: 4, y: 0 }, // e1
        { x: 5, y: 1 }, // f2
        PlayerColor.WHITE
      )).toBe(false);
    });
    
    it('should handle capturing a piece that was giving check', () => {
      // White king at e1, black bishop at c3 giving check
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }), // e1
        pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 2, y: 2 })  // c3
      ]);
      
      // King is currently in check
      expect(CheckDetection.isInCheck(board, PlayerColor.WHITE)).toBe(true);
      
      // Moving the king to capture the bishop would remove the check
      expect(CheckDetection.wouldMoveResultInCheck(
        board,
        { x: 4, y: 0 }, // e1
        { x: 2, y: 2 }, // c3
        PlayerColor.WHITE
      )).toBe(false);
    });
  });
}); 