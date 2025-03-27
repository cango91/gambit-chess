/**
 * Tests for chess movement utilities
 */

import {
  getPieceDirections,
  isValidPawnMove,
  isValidKnightMove,
  isValidBishopMove,
  isValidRookMove,
  isValidQueenMove,
  isValidKingMove,
  isValidPieceMove,
  isSlidingPiece
} from '../../chess/movement';
import { PieceType } from '../../types';

describe('Chess Movement Utilities', () => {
  describe('getPieceDirections', () => {
    it('should return correct directions for each piece type', () => {
      // Pawns are handled separately
      expect(getPieceDirections('p')).toEqual([]);
      
      // Knight moves in L-shapes
      expect(getPieceDirections('n')).toEqual([
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
      ]);
      
      // Bishop moves diagonally
      expect(getPieceDirections('b')).toEqual([
        [1, 1], [1, -1], [-1, -1], [-1, 1]
      ]);
      
      // Rook moves horizontally and vertically
      expect(getPieceDirections('r')).toEqual([
        [0, 1], [1, 0], [0, -1], [-1, 0]
      ]);
      
      // Queen and King move in all 8 directions
      const allDirections = [
        [0, 1], [1, 1], [1, 0], [1, -1],
        [0, -1], [-1, -1], [-1, 0], [-1, 1]
      ];
      expect(getPieceDirections('q')).toEqual(allDirections);
      expect(getPieceDirections('k')).toEqual(allDirections);
    });

    it('should throw error for invalid piece type', () => {
      // @ts-ignore testing with invalid type
      expect(() => getPieceDirections('x')).toThrow();
    });
  });

  describe('isValidPawnMove', () => {
    it('should validate basic white pawn moves', () => {
      // Forward one square
      expect(isValidPawnMove('e2', 'e3', true)).toBe(true);
      expect(isValidPawnMove('a2', 'a3', true)).toBe(true);
      expect(isValidPawnMove('h2', 'h3', true)).toBe(true);
      
      // Forward two squares from starting position
      expect(isValidPawnMove('e2', 'e4', true, false, true)).toBe(true);
      expect(isValidPawnMove('a2', 'a4', true, false, true)).toBe(true);
      expect(isValidPawnMove('h2', 'h4', true, false, true)).toBe(true);
      
      // Cannot move forward two squares if not first move
      expect(isValidPawnMove('e2', 'e4', true, false, false)).toBe(false);
      expect(isValidPawnMove('e3', 'e5', true, false, true)).toBe(false);
      expect(isValidPawnMove('e3', 'e5', true, false, false)).toBe(false);
      
      // Diagonal capture
      expect(isValidPawnMove('e2', 'd3', true, true)).toBe(true);
      expect(isValidPawnMove('e2', 'f3', true, true)).toBe(true);
      
      // Cannot move diagonally without capture
      expect(isValidPawnMove('e2', 'd3', true, false)).toBe(false);
      expect(isValidPawnMove('e2', 'f3', true, false)).toBe(false);
      
      // Cannot move backward
      expect(isValidPawnMove('e3', 'e2', true)).toBe(false);
      
      // Cannot move sideways
      expect(isValidPawnMove('e2', 'd2', true)).toBe(false);
      expect(isValidPawnMove('e2', 'f2', true)).toBe(false);
    });
    
    it('should validate basic black pawn moves', () => {
      // Forward one square
      expect(isValidPawnMove('e7', 'e6', false)).toBe(true);
      expect(isValidPawnMove('a7', 'a6', false)).toBe(true);
      expect(isValidPawnMove('h7', 'h6', false)).toBe(true);
      
      // Forward two squares from starting position
      expect(isValidPawnMove('e7', 'e5', false, false, true)).toBe(true);
      expect(isValidPawnMove('a7', 'a5', false, false, true)).toBe(true);
      expect(isValidPawnMove('h7', 'h5', false, false, true)).toBe(true);
      
      // Cannot move forward two squares if not first move
      expect(isValidPawnMove('e7', 'e5', false, false, false)).toBe(false);
      expect(isValidPawnMove('e6', 'e4', false, false, true)).toBe(false);
      expect(isValidPawnMove('e6', 'e4', false, false, false)).toBe(false);
      
      // Diagonal capture
      expect(isValidPawnMove('e7', 'd6', false, true)).toBe(true);
      expect(isValidPawnMove('e7', 'f6', false, true)).toBe(true);
      
      // Cannot move diagonally without capture
      expect(isValidPawnMove('e7', 'd6', false, false)).toBe(false);
      expect(isValidPawnMove('e7', 'f6', false, false)).toBe(false);
      
      // Cannot move backward
      expect(isValidPawnMove('e6', 'e7', false)).toBe(false);
      
      // Cannot move sideways
      expect(isValidPawnMove('e7', 'd7', false)).toBe(false);
      expect(isValidPawnMove('e7', 'f7', false)).toBe(false);
    });

    it('should validate pawn capture moves', () => {
      // Valid white pawn capture
      expect(isValidPawnMove('e4', 'd5', true, true)).toBe(true);
      expect(isValidPawnMove('e4', 'f5', true, true)).toBe(true);
      
      // Valid black pawn capture
      expect(isValidPawnMove('e5', 'd4', false, true)).toBe(true);
      expect(isValidPawnMove('e5', 'f4', false, true)).toBe(true);
      
      // Invalid capture moves
      expect(isValidPawnMove('e4', 'e5', true, true)).toBe(false); // Forward
      expect(isValidPawnMove('e4', 'd4', true, true)).toBe(false); // Sideways
      expect(isValidPawnMove('e4', 'd3', true, true)).toBe(false); // Backward diagonal
    });

    it('should handle invalid positions', () => {
      expect(isValidPawnMove('e2', 'e9', true)).toBe(false);
      expect(isValidPawnMove('j2', 'j3', true)).toBe(false);
    });
  });

  describe('isValidKnightMove', () => {
    it('should validate standard knight moves', () => {
      const position = 'e4';
      
      // All valid knight moves from e4
      expect(isValidKnightMove(position, 'd6')).toBe(true); // Up 2, Left 1
      expect(isValidKnightMove(position, 'f6')).toBe(true); // Up 2, Right 1
      expect(isValidKnightMove(position, 'c5')).toBe(true); // Up 1, Left 2
      expect(isValidKnightMove(position, 'g5')).toBe(true); // Up 1, Right 2
      expect(isValidKnightMove(position, 'c3')).toBe(true); // Down 1, Left 2
      expect(isValidKnightMove(position, 'g3')).toBe(true); // Down 1, Right 2
      expect(isValidKnightMove(position, 'd2')).toBe(true); // Down 2, Left 1
      expect(isValidKnightMove(position, 'f2')).toBe(true); // Down 2, Right 1
      
      // Invalid knight moves
      expect(isValidKnightMove(position, 'e5')).toBe(false); // Up 1 (not L-shape)
      expect(isValidKnightMove(position, 'd4')).toBe(false); // Left 1 (not L-shape)
      expect(isValidKnightMove(position, 'h6')).toBe(false); // Not an L-shape
    });

    it('should handle invalid positions', () => {
      expect(isValidKnightMove('e4', 'e9')).toBe(false);
      expect(isValidKnightMove('j4', 'h5')).toBe(false);
    });
  });

  describe('isValidBishopMove', () => {
    it('should validate standard bishop moves', () => {
      const position = 'e4';
      
      // Diagonal moves in all directions
      expect(isValidBishopMove(position, 'f5')).toBe(true); // Up-right
      expect(isValidBishopMove(position, 'g6')).toBe(true); // Up-right (longer)
      expect(isValidBishopMove(position, 'd5')).toBe(true); // Up-left
      expect(isValidBishopMove(position, 'c6')).toBe(true); // Up-left (longer)
      expect(isValidBishopMove(position, 'f3')).toBe(true); // Down-right
      expect(isValidBishopMove(position, 'g2')).toBe(true); // Down-right (longer)
      expect(isValidBishopMove(position, 'd3')).toBe(true); // Down-left
      expect(isValidBishopMove(position, 'c2')).toBe(true); // Down-left (longer)
      
      // Invalid bishop moves
      expect(isValidBishopMove(position, 'e5')).toBe(false); // Vertical
      expect(isValidBishopMove(position, 'f4')).toBe(false); // Horizontal
      expect(isValidBishopMove(position, 'g5')).toBe(false); // Not a diagonal
    });

    it('should handle invalid positions', () => {
      expect(isValidBishopMove('e4', 'e9')).toBe(false);
      expect(isValidBishopMove('j4', 'h6')).toBe(false);
    });
  });

  describe('isValidRookMove', () => {
    it('should validate standard rook moves', () => {
      const position = 'e4';
      
      // Horizontal and vertical moves
      expect(isValidRookMove(position, 'e5')).toBe(true); // Up
      expect(isValidRookMove(position, 'e8')).toBe(true); // Up (longer)
      expect(isValidRookMove(position, 'e3')).toBe(true); // Down
      expect(isValidRookMove(position, 'e1')).toBe(true); // Down (longer)
      expect(isValidRookMove(position, 'f4')).toBe(true); // Right
      expect(isValidRookMove(position, 'h4')).toBe(true); // Right (longer)
      expect(isValidRookMove(position, 'd4')).toBe(true); // Left
      expect(isValidRookMove(position, 'a4')).toBe(true); // Left (longer)
      
      // Invalid rook moves
      expect(isValidRookMove(position, 'f5')).toBe(false); // Diagonal
      expect(isValidRookMove(position, 'd3')).toBe(false); // Diagonal
      expect(isValidRookMove(position, 'f6')).toBe(false); // Not horizontal or vertical
    });

    it('should handle invalid positions', () => {
      expect(isValidRookMove('e4', 'e9')).toBe(false);
      expect(isValidRookMove('j4', 'j5')).toBe(false);
    });
  });

  describe('isValidQueenMove', () => {
    it('should validate standard queen moves', () => {
      const position = 'e4';
      
      // Diagonal moves (like bishop)
      expect(isValidQueenMove(position, 'f5')).toBe(true); // Up-right
      expect(isValidQueenMove(position, 'g6')).toBe(true); // Up-right (longer)
      expect(isValidQueenMove(position, 'd5')).toBe(true); // Up-left
      expect(isValidQueenMove(position, 'c6')).toBe(true); // Up-left (longer)
      
      // Horizontal and vertical moves (like rook)
      expect(isValidQueenMove(position, 'e5')).toBe(true); // Up
      expect(isValidQueenMove(position, 'e8')).toBe(true); // Up (longer)
      expect(isValidQueenMove(position, 'f4')).toBe(true); // Right
      expect(isValidQueenMove(position, 'h4')).toBe(true); // Right (longer)
      
      // Invalid queen moves
      expect(isValidQueenMove(position, 'f6')).toBe(false); // Not diagonal or straight
      expect(isValidQueenMove(position, 'd6')).toBe(false); // Not diagonal or straight
    });

    it('should handle invalid positions', () => {
      expect(isValidQueenMove('e4', 'e9')).toBe(false);
      expect(isValidQueenMove('j4', 'j5')).toBe(false);
    });
  });

  describe('isValidKingMove', () => {
    it('should validate standard king moves', () => {
      // One square in any direction
      expect(isValidKingMove('e4', 'e5')).toBe(true);
      expect(isValidKingMove('e4', 'f5')).toBe(true);
      expect(isValidKingMove('e4', 'f4')).toBe(true);
      expect(isValidKingMove('e4', 'f3')).toBe(true);
      expect(isValidKingMove('e4', 'e3')).toBe(true);
      expect(isValidKingMove('e4', 'd3')).toBe(true);
      expect(isValidKingMove('e4', 'd4')).toBe(true);
      expect(isValidKingMove('e4', 'd5')).toBe(true);
      
      // Invalid moves (more than one square)
      expect(isValidKingMove('e4', 'e6')).toBe(false);
      expect(isValidKingMove('e4', 'g4')).toBe(false);
      expect(isValidKingMove('e4', 'c4')).toBe(false);
      expect(isValidKingMove('e4', 'e2')).toBe(false);
    });
    
    it('should validate castling moves when enabled', () => {
      // Note: Castling validation is now handled by the BoardSnapshot class
      // This test is kept for reference but modified to expect false
      // since isValidKingMove no longer handles castling
      
      // White kingside castling
      expect(isValidKingMove('e1', 'g1', true)).toBe(false);
      
      // White queenside castling
      expect(isValidKingMove('e1', 'c1', true)).toBe(false);
      
      // Black kingside castling
      expect(isValidKingMove('e8', 'g8', true)).toBe(false);
      
      // Black queenside castling
      expect(isValidKingMove('e8', 'c8', true)).toBe(false);
    });
    
    it('should reject castling moves when disabled', () => {
      expect(isValidKingMove('e1', 'g1')).toBe(false);
      expect(isValidKingMove('e1', 'c1')).toBe(false);
      expect(isValidKingMove('e8', 'g8')).toBe(false);
      expect(isValidKingMove('e8', 'c8')).toBe(false);
    });

    it('should handle invalid positions', () => {
      expect(isValidKingMove('e4', 'e9')).toBe(false);
      expect(isValidKingMove('j4', 'j5')).toBe(false);
    });
  });

  describe('isValidPieceMove', () => {
    it('should validate moves for all piece types', () => {
      // Pawn moves (white)
      expect(isValidPieceMove('p', 'e2', 'e3', true)).toBe(true);
      expect(isValidPieceMove('p', 'e2', 'e4', true, false, true)).toBe(true);
      expect(isValidPieceMove('p', 'e2', 'e4', true, false, false)).toBe(false);
      expect(isValidPieceMove('p', 'e2', 'd3', true, true)).toBe(true);
      
      // Pawn moves (black)
      expect(isValidPieceMove('p', 'e7', 'e6', false)).toBe(true);
      expect(isValidPieceMove('p', 'e7', 'e5', false, false, true)).toBe(true);
      expect(isValidPieceMove('p', 'e7', 'e5', false, false, false)).toBe(false);
      expect(isValidPieceMove('p', 'e7', 'd6', false, true)).toBe(true);
      
      // Knight moves
      expect(isValidPieceMove('n', 'e4', 'f6')).toBe(true);
      expect(isValidPieceMove('n', 'e4', 'f6')).toBe(true);
      expect(isValidPieceMove('n', 'e4', 'e6')).toBe(false);
      
      // Bishop moves
      expect(isValidPieceMove('b', 'e4', 'h7')).toBe(true);
      expect(isValidPieceMove('b', 'e4', 'h7')).toBe(true);
      expect(isValidPieceMove('b', 'e4', 'e6')).toBe(false);
      
      // Rook moves
      expect(isValidPieceMove('r', 'e4', 'e8')).toBe(true);
      expect(isValidPieceMove('r', 'e4', 'e8')).toBe(true);
      expect(isValidPieceMove('r', 'e4', 'f6')).toBe(false);
      
      // Queen moves
      expect(isValidPieceMove('q', 'e4', 'e8')).toBe(true);
      expect(isValidPieceMove('q', 'e4', 'h7')).toBe(true);
      expect(isValidPieceMove('q', 'e4', 'e8')).toBe(true);
      expect(isValidPieceMove('q', 'e4', 'h7')).toBe(true);
      expect(isValidPieceMove('q', 'e4', 'f6')).toBe(false);
      
      // King moves
      expect(isValidPieceMove('k', 'e4', 'e5')).toBe(true);
      expect(isValidPieceMove('k', 'e4', 'e5')).toBe(true);
      expect(isValidPieceMove('k', 'e4', 'e6')).toBe(false);
      
      // Invalid piece type
      expect(() => isValidPieceMove('x' as PieceType, 'e4', 'e5')).toThrow('Invalid piece type');
    });
  });

  describe('isSlidingPiece', () => {
    it('should correctly identify sliding pieces', () => {
      expect(isSlidingPiece('b')).toBe(true);
      expect(isSlidingPiece('r')).toBe(true);
      expect(isSlidingPiece('q')).toBe(true);
      
      expect(isSlidingPiece('p')).toBe(false);
      expect(isSlidingPiece('n')).toBe(false);
      expect(isSlidingPiece('k')).toBe(false);
    });
  });
}); 