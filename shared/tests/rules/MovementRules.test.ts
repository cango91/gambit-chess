import { MovementRules } from '../../src/rules/MovementRules';
import { Position, PieceType, PlayerColor } from '../../src/types';

describe('MovementRules', () => {
  describe('isValidPawnMove', () => {
    it('should allow a white pawn to move one square forward', () => {
      const from: Position = { x: 3, y: 1 };
      const to: Position = { x: 3, y: 2 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, false, false);
      expect(result).toBe(true);
    });

    it('should allow a white pawn to move two squares forward on first move', () => {
      const from: Position = { x: 3, y: 1 };
      const to: Position = { x: 3, y: 3 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, false, false);
      expect(result).toBe(true);
    });

    it('should not allow a white pawn to move two squares forward after first move', () => {
      const from: Position = { x: 3, y: 2 }; // Not starting position
      const to: Position = { x: 3, y: 4 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, true, false);
      expect(result).toBe(false);
    });

    it('should allow a black pawn to move one square forward', () => {
      const from: Position = { x: 3, y: 6 };
      const to: Position = { x: 3, y: 5 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.BLACK, from, to, false, false);
      expect(result).toBe(true);
    });

    it('should allow a black pawn to move two squares forward on first move', () => {
      const from: Position = { x: 3, y: 6 };
      const to: Position = { x: 3, y: 4 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.BLACK, from, to, false, false);
      expect(result).toBe(true);
    });

    it('should allow a pawn to capture diagonally when there is a target piece', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 4, y: 4 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, true, true);
      expect(result).toBe(true);
    });

    it('should not allow a pawn to move diagonally when there is no target piece', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 4, y: 4 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, true, false);
      expect(result).toBe(false);
    });

    it('should not allow a pawn to move forwards when there is a target piece', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 4 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, true, true);
      expect(result).toBe(false);
    });

    it('should not allow a pawn to move backwards', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 2 };
      const result = MovementRules['isValidPawnMove'](PlayerColor.WHITE, from, to, true, false);
      expect(result).toBe(false);
    });
  });

  describe('isValidKnightMove', () => {
    it('should allow an L-shaped move (2-1)', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 4 };
      const result = MovementRules['isValidKnightMove'](from, to);
      expect(result).toBe(true);
    });

    it('should allow an L-shaped move (1-2)', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 4, y: 5 };
      const result = MovementRules['isValidKnightMove'](from, to);
      expect(result).toBe(true);
    });

    it('should not allow a non-L-shaped move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 5 };
      const result = MovementRules['isValidKnightMove'](from, to);
      expect(result).toBe(false);
    });
  });

  describe('isValidBishopMove', () => {
    it('should allow a diagonal move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 5 };
      const result = MovementRules['isValidBishopMove'](from, to);
      expect(result).toBe(true);
    });

    it('should not allow a non-diagonal move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 5 };
      const result = MovementRules['isValidBishopMove'](from, to);
      expect(result).toBe(false);
    });
  });

  describe('isValidRookMove', () => {
    it('should allow a horizontal move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 7, y: 3 };
      const result = MovementRules['isValidRookMove'](from, to);
      expect(result).toBe(true);
    });

    it('should allow a vertical move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 7 };
      const result = MovementRules['isValidRookMove'](from, to);
      expect(result).toBe(true);
    });

    it('should not allow a diagonal move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 5 };
      const result = MovementRules['isValidRookMove'](from, to);
      expect(result).toBe(false);
    });
  });

  describe('isValidQueenMove', () => {
    it('should allow a diagonal move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 5 };
      const result = MovementRules['isValidQueenMove'](from, to);
      expect(result).toBe(true);
    });

    it('should allow a horizontal move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 7, y: 3 };
      const result = MovementRules['isValidQueenMove'](from, to);
      expect(result).toBe(true);
    });

    it('should allow a vertical move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 7 };
      const result = MovementRules['isValidQueenMove'](from, to);
      expect(result).toBe(true);
    });

    it('should not allow a non-queen move', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 6 };
      const result = MovementRules['isValidQueenMove'](from, to);
      expect(result).toBe(false);
    });
  });

  describe('isValidKingMove', () => {
    it('should allow a one-square move in any direction', () => {
      const from: Position = { x: 3, y: 3 };
      const directions = [
        { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 },
        { x: 3, y: 2 }, /* origin */    { x: 3, y: 4 },
        { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }
      ];

      directions.forEach(to => {
        const result = MovementRules['isValidKingMove'](from, to, false);
        expect(result).toBe(true);
      });
    });

    it('should not allow a move of more than one square', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 5 };
      const result = MovementRules['isValidKingMove'](from, to, false);
      expect(result).toBe(false);
    });

    // Todo: Add castling tests
  });

  describe('isValidBasicMove', () => {
    // Pawn tests with hasTargetPiece
    it('should validate pawn forward moves correctly when no target piece', () => {
      const from: Position = { x: 3, y: 1 };
      const to: Position = { x: 3, y: 2 };
      const result = MovementRules.isValidBasicMove(
        PieceType.PAWN,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(true);
    });

    it('should reject pawn forward moves when there is a target piece', () => {
      const from: Position = { x: 3, y: 1 };
      const to: Position = { x: 3, y: 2 };
      const result = MovementRules.isValidBasicMove(
        PieceType.PAWN,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        true
      );
      expect(result).toBe(false);
    });

    it('should validate pawn diagonal capture moves when there is a target piece', () => {
      const from: Position = { x: 3, y: 1 };
      const to: Position = { x: 4, y: 2 };
      const result = MovementRules.isValidBasicMove(
        PieceType.PAWN,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        true
      );
      expect(result).toBe(true);
    });

    it('should reject pawn diagonal moves when there is no target piece', () => {
      const from: Position = { x: 3, y: 1 };
      const to: Position = { x: 4, y: 2 };
      const result = MovementRules.isValidBasicMove(
        PieceType.PAWN,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(false);
    });

    // Other piece tests
    it('should validate knight moves correctly', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 4 };
      const result = MovementRules.isValidBasicMove(
        PieceType.KNIGHT,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(true);
    });

    it('should validate bishop moves correctly', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 5 };
      const result = MovementRules.isValidBasicMove(
        PieceType.BISHOP,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(true);
    });

    it('should validate rook moves correctly', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 3, y: 7 };
      const result = MovementRules.isValidBasicMove(
        PieceType.ROOK,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(true);
    });

    it('should validate queen moves correctly', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 5, y: 5 };
      const result = MovementRules.isValidBasicMove(
        PieceType.QUEEN,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(true);
    });

    it('should validate king moves correctly', () => {
      const from: Position = { x: 3, y: 3 };
      const to: Position = { x: 4, y: 4 };
      const result = MovementRules.isValidBasicMove(
        PieceType.KING,
        PlayerColor.WHITE,
        from, 
        to, 
        false,
        false
      );
      expect(result).toBe(true);
    });
  });

  describe('getPositionsBetween', () => {
    it('should return positions between two points horizontally', () => {
      const from: Position = { x: 2, y: 3 };
      const to: Position = { x: 5, y: 3 };
      const positions = MovementRules.getPositionsBetween(from, to);
      expect(positions).toHaveLength(2);
      expect(positions).toContainEqual({ x: 3, y: 3 });
      expect(positions).toContainEqual({ x: 4, y: 3 });
    });

    it('should return positions between two points vertically', () => {
      const from: Position = { x: 3, y: 2 };
      const to: Position = { x: 3, y: 5 };
      const positions = MovementRules.getPositionsBetween(from, to);
      expect(positions).toHaveLength(2);
      expect(positions).toContainEqual({ x: 3, y: 3 });
      expect(positions).toContainEqual({ x: 3, y: 4 });
    });

    it('should return positions between two points diagonally', () => {
      const from: Position = { x: 2, y: 2 };
      const to: Position = { x: 5, y: 5 };
      const positions = MovementRules.getPositionsBetween(from, to);
      expect(positions).toHaveLength(2);
      expect(positions).toContainEqual({ x: 3, y: 3 });
      expect(positions).toContainEqual({ x: 4, y: 4 });
    });
  });
}); 