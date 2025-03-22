import { BoardImpl, PieceFactoryImpl } from '../../src/models';
import { PieceType, PlayerColor, Position } from '../../src/types';

// Add Jest types at the top of the file to fix linting issues
declare const describe: any;
declare const it: any;
declare const expect: any;

describe('BoardImpl', () => {
  const pieceFactory = new PieceFactoryImpl();
  
  // Create some test pieces
  const whitePawn = pieceFactory.createNewPiece(
    PieceType.PAWN, 
    PlayerColor.WHITE, 
    { x: 0, y: 1 }
  );
  
  const whiteRook = pieceFactory.createNewPiece(
    PieceType.ROOK,
    PlayerColor.WHITE,
    { x: 0, y: 0 }
  );
  
  const blackKing = pieceFactory.createNewPiece(
    PieceType.KING,
    PlayerColor.BLACK,
    { x: 4, y: 7 }
  );
  
  const whiteKing = pieceFactory.createNewPiece(
    PieceType.KING,
    PlayerColor.WHITE,
    { x: 4, y: 0 }
  );
  
  describe('constructor', () => {
    it('should create a board with the provided pieces', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.getPieces()).toHaveLength(3);
      expect(board.getPieceAt({ x: 0, y: 1 })).toBe(whitePawn);
      expect(board.getPieceAt({ x: 0, y: 0 })).toBe(whiteRook);
      expect(board.getPieceAt({ x: 4, y: 7 })).toBe(blackKing);
    });
  });
  
  describe('getPieceAt', () => {
    it('should return the piece at the specified position', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.getPieceAt({ x: 0, y: 1 })).toBe(whitePawn);
    });
    
    it('should return undefined if no piece is at the position', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.getPieceAt({ x: 1, y: 1 })).toBeUndefined();
    });
  });
  
  describe('isOccupied', () => {
    it('should return true if a position is occupied', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.isOccupied({ x: 0, y: 1 })).toBe(true);
    });
    
    it('should return false if a position is not occupied', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.isOccupied({ x: 1, y: 1 })).toBe(false);
    });
  });
  
  describe('isOccupiedByColor', () => {
    it('should return true if a position is occupied by a piece of the specified color', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.isOccupiedByColor({ x: 0, y: 1 }, PlayerColor.WHITE)).toBe(true);
    });
    
    it('should return false if a position is occupied by a piece of a different color', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.isOccupiedByColor({ x: 0, y: 1 }, PlayerColor.BLACK)).toBe(false);
    });
    
    it('should return false if a position is not occupied', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      expect(board.isOccupiedByColor({ x: 1, y: 1 }, PlayerColor.WHITE)).toBe(false);
    });
  });
  
  describe('isPathClear', () => {
    it('should return true if path is clear horizontally', () => {
      const board = new BoardImpl([
        whiteRook,
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 3, y: 0 })
      ]);
      expect(board.isPathClear({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(true);
    });
    
    it('should return false if path is blocked horizontally', () => {
      const board = new BoardImpl([
        whiteRook,
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 1, y: 0 }),
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 3, y: 0 })
      ]);
      expect(board.isPathClear({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe(false);
    });
    
    it('should return true if path is clear vertically', () => {
      const board = new BoardImpl([
        whitePawn,
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 0, y: 4 })
      ]);
      expect(board.isPathClear({ x: 0, y: 1 }, { x: 0, y: 3 })).toBe(true);
    });
    
    it('should return false if path is blocked vertically', () => {
      const board = new BoardImpl([
        whitePawn,
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 0, y: 2 }),
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 0, y: 4 })
      ]);
      expect(board.isPathClear({ x: 0, y: 1 }, { x: 0, y: 3 })).toBe(false);
    });
    
    it('should return true if path is clear diagonally', () => {
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.WHITE, { x: 2, y: 2 }),
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 5, y: 5 })
      ]);
      expect(board.isPathClear({ x: 2, y: 2 }, { x: 4, y: 4 })).toBe(true);
    });
    
    it('should return false if path is blocked diagonally', () => {
      const board = new BoardImpl([
        pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.WHITE, { x: 2, y: 2 }),
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 3, y: 3 }),
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 5, y: 5 })
      ]);
      expect(board.isPathClear({ x: 2, y: 2 }, { x: 4, y: 4 })).toBe(false);
    });
    
    it('should return false for invalid paths (not straight or diagonal)', () => {
      const board = new BoardImpl([whitePawn, whiteRook]);
      expect(board.isPathClear({ x: 0, y: 0 }, { x: 1, y: 2 })).toBe(false);
    });
  });
  
  describe('getKingPosition', () => {
    it('should return the position of the king of the specified color', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing, whiteKing]);
      expect(board.getKingPosition(PlayerColor.WHITE)).toEqual({ x: 4, y: 0 });
      expect(board.getKingPosition(PlayerColor.BLACK)).toEqual({ x: 4, y: 7 });
    });
    
    it('should throw an error if no king of the specified color is found', () => {
      const board = new BoardImpl([whitePawn, whiteRook]);
      expect(() => board.getKingPosition(PlayerColor.BLACK)).toThrow();
    });
  });
  
  describe('snapshot', () => {
    it('should create a board snapshot with the current pieces', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      const snapshot = board.snapshot();
      
      // Snapshot should have the same number of pieces
      expect(snapshot.getPieces()).toHaveLength(3);
      
      // Snapshot pieces should be copies, not the originals
      expect(snapshot.getPieces()[0]).not.toBe(whitePawn);
      expect(snapshot.getPieces()[1]).not.toBe(whiteRook);
      expect(snapshot.getPieces()[2]).not.toBe(blackKing);
      
      // Snapshot pieces should have same properties
      expect(snapshot.getPieces()[0].type).toBe(whitePawn.type);
      expect(snapshot.getPieces()[0].color).toBe(whitePawn.color);
      expect(snapshot.getPieces()[0].position).toEqual(whitePawn.position);
    });
    
    it('should allow simulating moves with withMove', () => {
      const board = new BoardImpl([whitePawn, whiteRook, blackKing]);
      const originalSnapshot = board.snapshot();
      
      // Simulate moving the pawn
      const newSnapshot = originalSnapshot.withMove(
        { x: 0, y: 1 },
        { x: 0, y: 3 }
      );
      
      // Original snapshot should remain unchanged
      const originalPawnPosition = originalSnapshot.getPieceAt({ x: 0, y: 1 });
      expect(originalPawnPosition).toBeDefined();
      expect(originalPawnPosition?.type).toBe(PieceType.PAWN);
      
      // New snapshot should have the pawn at the new position
      const newPawnPosition = newSnapshot.getPieceAt({ x: 0, y: 3 });
      expect(newPawnPosition).toBeDefined();
      expect(newPawnPosition?.type).toBe(PieceType.PAWN);
      
      // New snapshot should not have a piece at the old position
      expect(newSnapshot.getPieceAt({ x: 0, y: 1 })).toBeUndefined();
    });
    
    it('should handle captures correctly with withMove', () => {
      const board = new BoardImpl([
        whitePawn,
        pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x: 1, y: 2 })
      ]);
      const originalSnapshot = board.snapshot();
      
      // Simulate capturing the black pawn
      const newSnapshot = originalSnapshot.withMove(
        { x: 0, y: 1 },
        { x: 1, y: 2 }
      );
      
      // New snapshot should have the white pawn at the captured position
      const capturedPosition = newSnapshot.getPieceAt({ x: 1, y: 2 });
      expect(capturedPosition).toBeDefined();
      expect(capturedPosition?.type).toBe(PieceType.PAWN);
      expect(capturedPosition?.color).toBe(PlayerColor.WHITE);
      
      // Original snapshot should remain unchanged
      expect(originalSnapshot.getPieceAt({ x: 1, y: 2 })?.color).toBe(PlayerColor.BLACK);
    });
  });
}); 