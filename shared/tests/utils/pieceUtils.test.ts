import { 
  isLongRangePiece, 
  getBPCapacity, 
  isValidPosition, 
  getOpponentColor, 
  positionToAlgebraic,
  algebraicToPosition,
  isDarkSquare
} from '../../src/utils/pieceUtils';
import { PieceType, Position, PlayerColor } from '../../src/types';

describe('pieceUtils', () => {
  describe('isLongRangePiece', () => {
    it('should identify long range pieces correctly', () => {
      expect(isLongRangePiece(PieceType.BISHOP)).toBe(true);
      expect(isLongRangePiece(PieceType.ROOK)).toBe(true);
      expect(isLongRangePiece(PieceType.QUEEN)).toBe(true);
      // Knight is NOT a long range piece according to the implementation
      expect(isLongRangePiece(PieceType.KNIGHT)).toBe(false);
      expect(isLongRangePiece(PieceType.PAWN)).toBe(false);
      expect(isLongRangePiece(PieceType.KING)).toBe(false);
    });
  });

  describe('getBPCapacity', () => {
    it('should return the correct BP capacity for each piece type', () => {
      expect(getBPCapacity(PieceType.PAWN)).toBeGreaterThan(0);
      expect(getBPCapacity(PieceType.KNIGHT)).toBeGreaterThan(0);
      expect(getBPCapacity(PieceType.BISHOP)).toBeGreaterThan(0);
      expect(getBPCapacity(PieceType.ROOK)).toBeGreaterThan(0);
      expect(getBPCapacity(PieceType.QUEEN)).toBeGreaterThan(0);
      // King has 0 BP capacity as it cannot be captured
      expect(getBPCapacity(PieceType.KING)).toBe(0);
    });
  });

  describe('isValidPosition', () => {
    it('should return true for positions within the board', () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 7, y: 7 })).toBe(true);
      expect(isValidPosition({ x: 3, y: 4 })).toBe(true);
    });

    it('should return false for positions outside the board', () => {
      expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: -1 })).toBe(false);
      expect(isValidPosition({ x: 8, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 0, y: 8 })).toBe(false);
    });
  });

  describe('getOpponentColor', () => {
    it('should return BLACK for WHITE', () => {
      expect(getOpponentColor(PlayerColor.WHITE)).toBe(PlayerColor.BLACK);
    });

    it('should return WHITE for BLACK', () => {
      expect(getOpponentColor(PlayerColor.BLACK)).toBe(PlayerColor.WHITE);
    });
  });

  describe('positionToAlgebraic', () => {
    it('should convert positions to algebraic notation correctly', () => {
      expect(positionToAlgebraic({ x: 0, y: 0 })).toBe('a1');
      expect(positionToAlgebraic({ x: 7, y: 7 })).toBe('h8');
      expect(positionToAlgebraic({ x: 3, y: 3 })).toBe('d4');
    });
  });

  describe('algebraicToPosition', () => {
    it('should convert algebraic notation to positions correctly', () => {
      expect(algebraicToPosition('a1')).toEqual({ x: 0, y: 0 });
      expect(algebraicToPosition('h8')).toEqual({ x: 7, y: 7 });
      expect(algebraicToPosition('d4')).toEqual({ x: 3, y: 3 });
    });
  });

  describe('isDarkSquare', () => {
    it('should identify dark squares correctly', () => {
      // On a standard chess board, a8, c8, e8, g8, b7, d7, f7, h7, etc. are dark
      expect(isDarkSquare({ x: 0, y: 7 })).toBe(true); // a8
      expect(isDarkSquare({ x: 2, y: 7 })).toBe(true); // c8
      expect(isDarkSquare({ x: 1, y: 6 })).toBe(true); // b7
      expect(isDarkSquare({ x: 3, y: 6 })).toBe(true); // d7
    });

    it('should identify light squares correctly', () => {
      // On a standard chess board, b8, d8, f8, h8, a7, c7, e7, g7, etc. are light
      expect(isDarkSquare({ x: 1, y: 7 })).toBe(false); // b8
      expect(isDarkSquare({ x: 3, y: 7 })).toBe(false); // d8
      expect(isDarkSquare({ x: 0, y: 6 })).toBe(false); // a7
      expect(isDarkSquare({ x: 2, y: 6 })).toBe(false); // c7
    });
  });
}); 