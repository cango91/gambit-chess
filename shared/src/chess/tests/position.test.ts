import { ChessPosition } from '../types';
import { BOARD_SIZE } from '../../constants';

describe('ChessPosition', () => {
  describe('constructor and validation', () => {
    it('should create a valid position from string', () => {
      const position = new ChessPosition('e4');
      expect(position.value).toBe('e4');
    });

    it('should create a valid position from file and rank', () => {
      const position = new ChessPosition('e', 4);
      expect(position.value).toBe('e4');
    });

    it('should create a valid position from coordinates array', () => {
      const position = new ChessPosition([4, 3]); // e4
      expect(position.value).toBe('e4');
    });

    it('should create a valid position from coordinates object', () => {
      const position = new ChessPosition({ x: 4, y: 3 }); // e4
      expect(position.value).toBe('e4');
    });

    it('should create a valid position from another ChessPosition', () => {
      const original = new ChessPosition('e4');
      const position = new ChessPosition(original);
      expect(position.value).toBe('e4');
    });

    it('should throw an error for invalid position string', () => {
      expect(() => new ChessPosition('e9')).toThrow('Invalid position');
      expect(() => new ChessPosition('i4')).toThrow('Invalid position');
      expect(() => new ChessPosition('invalid')).toThrow('Invalid position');
    });

    it('should throw an error for invalid coordinates', () => {
      expect(() => new ChessPosition([8, 3])).toThrow('Invalid coordinates values');
      expect(() => new ChessPosition([4, 8])).toThrow('Invalid coordinates values');
      expect(() => new ChessPosition([-1, 3])).toThrow('Invalid coordinates values');
    });
  });

  describe('conversion methods', () => {
    it('should convert to coordinates correctly', () => {
      expect(new ChessPosition('a1').toCoordinates()).toEqual([0, 0]);
      expect(new ChessPosition('h8').toCoordinates()).toEqual([7, 7]);
      expect(new ChessPosition('e4').toCoordinates()).toEqual([4, 3]);
    });

    it('should convert from coordinates correctly', () => {
      expect(ChessPosition.fromCoordinates(0, 0).value).toBe('a1');
      expect(ChessPosition.fromCoordinates(7, 7).value).toBe('h8');
      expect(ChessPosition.fromCoordinates(4, 3).value).toBe('e4');
    });

    it('should convert to string correctly', () => {
      const position = new ChessPosition('e4');
      expect(position.toString()).toBe('e4');
      expect(`Position: ${position}`).toBe('Position: e4');
    });

    it('should handle valueOf correctly', () => {
      expect(new ChessPosition('e4').valueOf()).toBe(43);
      expect(new ChessPosition('a1').valueOf()).toBe(0);
    });
  });

  describe('position comparison', () => {
    it('should check if two positions are equal', () => {
      const pos1 = new ChessPosition('e4');
      const pos2 = new ChessPosition('e4');
      const pos3 = new ChessPosition('d4');
      
      expect(pos1.equals(pos2)).toBe(true);
      expect(pos1.equals(pos3)).toBe(false);
    });

    it('should check if positions are on the same rank', () => {
      const pos1 = new ChessPosition('e4');
      const pos2 = new ChessPosition('d4');
      const pos3 = new ChessPosition('e5');
      
      expect(pos1.isSameRank(pos2)).toBe(true);
      expect(pos1.isSameRank(pos3)).toBe(false);
      expect(pos1.isSameRank('d4')).toBe(true);
    });

    it('should check if positions are on the same file', () => {
      const pos1 = new ChessPosition('e4');
      const pos2 = new ChessPosition('e5');
      const pos3 = new ChessPosition('d4');
      
      expect(pos1.isSameFile(pos2)).toBe(true);
      expect(pos1.isSameFile(pos3)).toBe(false);
      expect(pos1.isSameFile('e5')).toBe(true);
    });

    it('should check if positions are on the same diagonal', () => {
      const pos1 = new ChessPosition('e4');
      const pos2 = new ChessPosition('f5'); // Diagonal up-right
      const pos3 = new ChessPosition('d3'); // Diagonal down-left
      const pos4 = new ChessPosition('e1'); // Not on diagonal (vertical move)
      
      expect(pos1.isSameDiagonal(pos2)).toBe(true);
      expect(pos1.isSameDiagonal(pos3)).toBe(true);
      expect(pos1.isSameDiagonal(pos4)).toBe(false);
    });
  });

  describe('positions between', () => {
    it('should return positions between two positions on the same rank', () => {
      const pos1 = new ChessPosition('a1');
      const pos2 = new ChessPosition('d1');
      const between = pos1.getPositionsBetween(pos2);
      
      expect(between.length).toBe(2);
      expect(between[0].value).toBe('b1');
      expect(between[1].value).toBe('c1');
    });

    it('should return positions between two positions on the same file', () => {
      const pos1 = new ChessPosition('a1');
      const pos2 = new ChessPosition('a4');
      const between = pos1.getPositionsBetween(pos2);
      
      expect(between.length).toBe(2);
      expect(between[0].value).toBe('a2');
      expect(between[1].value).toBe('a3');
    });

    it('should return positions between two positions on the same diagonal', () => {
      const pos1 = new ChessPosition('a1');
      const pos2 = new ChessPosition('d4');
      const between = pos1.getPositionsBetween(pos2);
      
      expect(between.length).toBe(2);
      expect(between[0].value).toBe('b2');
      expect(between[1].value).toBe('c3');
    });

    it('should return an empty array for non-aligned positions', () => {
      const pos1 = new ChessPosition('a1');
      const pos2 = new ChessPosition('c4');
      const between = pos1.getPositionsBetween(pos2);
      
      expect(between.length).toBe(0);
    });
  });

  describe('static methods', () => {
    it('should create a position from a string using fromString', () => {
      const position = ChessPosition.fromString('e4');
      expect(position.value).toBe('e4');
    });

    it('should validate if a position is valid', () => {
      expect(ChessPosition.isValidPosition('e4')).toBe(true);
      expect(ChessPosition.isValidPosition('e9')).toBe(false);
      expect(ChessPosition.isValidPosition([4, 3])).toBe(true);
      expect(ChessPosition.isValidPosition([9, 3])).toBe(false);
    });

    it('should create a position with the generic from method', () => {
      expect(ChessPosition.from('e4').value).toBe('e4');
      expect(ChessPosition.from([4, 3]).value).toBe('e4');
      expect(ChessPosition.from({ x: 4, y: 3 }).value).toBe('e4');
      expect(ChessPosition.from(43).value).toBe('e4'); // from number
      
      const original = new ChessPosition('e4');
      expect(ChessPosition.from(original).value).toBe('e4');
    });

    it('should throw for invalid inputs to from', () => {
      expect(() => ChessPosition.from(null)).toThrow('Invalid position');
      expect(() => ChessPosition.from(undefined)).toThrow('Invalid position');
      expect(() => ChessPosition.from({})).toThrow('Invalid position');
    });
  });
}); 