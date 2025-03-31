import { ChessPieceColor, ChessPieceType } from '../types';

describe('ChessPieceColor', () => {
  describe('constructor and validation', () => {
    it('should create a valid color from string', () => {
      expect(new ChessPieceColor('w').value).toBe('w');
      expect(new ChessPieceColor('b').value).toBe('b');
      expect(new ChessPieceColor('white').value).toBe('w');
      expect(new ChessPieceColor('black').value).toBe('b');
    });

    it('should create a valid color from another ChessPieceColor', () => {
      const original = new ChessPieceColor('w');
      const color = new ChessPieceColor(original);
      expect(color.value).toBe('w');
    });

    it('should normalize color case', () => {
      expect(new ChessPieceColor('W').value).toBe('w');
      expect(new ChessPieceColor('B').value).toBe('b');
      expect(new ChessPieceColor('WHITE').value).toBe('w');
    });

    it('should throw an error for invalid color', () => {
      expect(() => new ChessPieceColor('')).toThrow('Invalid color');
      expect(() => new ChessPieceColor('x')).toThrow('Invalid color');
    });
  });

  describe('conversion methods', () => {
    it('should convert to string correctly', () => {
      expect(new ChessPieceColor('w').toString()).toBe('white');
      expect(new ChessPieceColor('b').toString()).toBe('black');
    });

    it('should handle valueOf correctly', () => {
      expect(new ChessPieceColor('w').valueOf()).toBe(1);
      expect(new ChessPieceColor('b').valueOf()).toBe(-1);
    });
  });

  describe('comparison methods', () => {
    it('should compare colors correctly', () => {
      const white1 = new ChessPieceColor('w');
      const white2 = new ChessPieceColor('white');
      const black = new ChessPieceColor('b');

      expect(white1.equals(white2)).toBe(true);
      expect(white1.equals(black)).toBe(false);
    });

    it('should generate consistent hash codes', () => {
      expect(new ChessPieceColor('w').hashCode()).toBe('w');
      expect(new ChessPieceColor('b').hashCode()).toBe('b');
    });
  });

  describe('static methods', () => {
    it('should create a color using the from method', () => {
      expect(ChessPieceColor.from('w').value).toBe('w');
      expect(ChessPieceColor.from('black').value).toBe('b');
    });
  });
});

describe('ChessPieceType', () => {
  describe('constructor and validation', () => {
    it('should create a valid piece type from string', () => {
      expect(new ChessPieceType('p').value).toBe('p');
      expect(new ChessPieceType('n').value).toBe('n');
      expect(new ChessPieceType('b').value).toBe('b');
      expect(new ChessPieceType('r').value).toBe('r');
      expect(new ChessPieceType('q').value).toBe('q');
      expect(new ChessPieceType('k').value).toBe('k');
    });

    it('should create a valid piece type from another ChessPieceType', () => {
      const original = new ChessPieceType('p');
      const pieceType = new ChessPieceType(original);
      expect(pieceType.value).toBe('p');
    });

    it('should normalize piece type case', () => {
      expect(new ChessPieceType('P').value).toBe('p');
      expect(new ChessPieceType('K').value).toBe('k');
    });

    it('should throw an error for invalid piece type', () => {
      expect(() => new ChessPieceType('')).toThrow('Invalid piece type');
      expect(() => new ChessPieceType('x')).toThrow('Invalid piece type');
    });
  });

  describe('conversion methods', () => {
    it('should convert to string correctly', () => {
      expect(new ChessPieceType('p').toString()).toBe('pawn');
      expect(new ChessPieceType('n').toString()).toBe('knight');
      expect(new ChessPieceType('b').toString()).toBe('bishop');
      expect(new ChessPieceType('r').toString()).toBe('rook');
      expect(new ChessPieceType('q').toString()).toBe('queen');
      expect(new ChessPieceType('k').toString()).toBe('king');
    });

    it('should handle valueOf correctly', () => {
      expect(new ChessPieceType('p').valueOf()).toBe(0);
      expect(new ChessPieceType('n').valueOf()).toBe(1);
      expect(new ChessPieceType('b').valueOf()).toBe(2);
      expect(new ChessPieceType('r').valueOf()).toBe(3);
      expect(new ChessPieceType('q').valueOf()).toBe(4);
      expect(new ChessPieceType('k').valueOf()).toBe(5);
    });
  });

  describe('piece values', () => {
    it('should return correct classic chess values', () => {
      expect(new ChessPieceType('p').classicValue).toBe(1);
      expect(new ChessPieceType('n').classicValue).toBe(3);
      expect(new ChessPieceType('b').classicValue).toBe(3);
      expect(new ChessPieceType('r').classicValue).toBe(5);
      expect(new ChessPieceType('q').classicValue).toBe(9);
      expect(new ChessPieceType('k').classicValue).toBe(0);
    });

    it('should identify long range pieces correctly', () => {
      expect(new ChessPieceType('p').isLongRange()).toBe(false);
      expect(new ChessPieceType('n').isLongRange()).toBe(false);
      expect(new ChessPieceType('b').isLongRange()).toBe(true);
      expect(new ChessPieceType('r').isLongRange()).toBe(true);
      expect(new ChessPieceType('q').isLongRange()).toBe(true);
      expect(new ChessPieceType('k').isLongRange()).toBe(false);
    });
  });

  describe('comparison methods', () => {
    it('should compare piece types correctly', () => {
      const pawn1 = new ChessPieceType('p');
      const pawn2 = new ChessPieceType('p');
      const knight = new ChessPieceType('n');

      expect(pawn1.equals(pawn2)).toBe(true);
      expect(pawn1.equals(knight)).toBe(false);
    });

    it('should generate consistent hash codes', () => {
      expect(new ChessPieceType('p').hashCode()).toBe('p');
      expect(new ChessPieceType('k').hashCode()).toBe('k');
    });
  });

  describe('static methods', () => {
    it('should create a piece type using the from method', () => {
      expect(ChessPieceType.from('p').value).toBe('p');
      expect(ChessPieceType.from('KING').value).toBe('k');
    });

    it('should create a piece type from name using fromValue', () => {
      expect(ChessPieceType.fromValue('pawn').value).toBe('p');
      expect(ChessPieceType.fromValue('knight').value).toBe('n');
      expect(ChessPieceType.fromValue('bishop').value).toBe('b');
      expect(ChessPieceType.fromValue('rook').value).toBe('r');
      expect(ChessPieceType.fromValue('queen').value).toBe('q');
      expect(ChessPieceType.fromValue('king').value).toBe('k');
    });

    it('should throw for invalid piece type value', () => {
      expect(() => ChessPieceType.fromValue('invalid')).toThrow('Invalid piece type value');
    });
  });
}); 