import { 
  positionToNotation,
  notationToPosition
} from '../../src/utils/notationUtils';
import { Position } from '../../src/types';

describe('notationUtils', () => {
  describe('positionToNotation', () => {
    it('should convert positions to algebraic notation correctly', () => {
      expect(positionToNotation({ x: 0, y: 0 })).toBe('a1');
      expect(positionToNotation({ x: 7, y: 7 })).toBe('h8');
      expect(positionToNotation({ x: 3, y: 3 })).toBe('d4');
    });

    it('should handle edge positions correctly', () => {
      expect(positionToNotation({ x: 0, y: 7 })).toBe('a8');
      expect(positionToNotation({ x: 7, y: 0 })).toBe('h1');
    });
  });

  describe('notationToPosition', () => {
    it('should convert valid algebraic notation to positions correctly', () => {
      expect(notationToPosition('a1')).toEqual({ x: 0, y: 0 });
      expect(notationToPosition('h8')).toEqual({ x: 7, y: 7 });
      expect(notationToPosition('d4')).toEqual({ x: 3, y: 3 });
    });

    it('should handle edge positions correctly', () => {
      expect(notationToPosition('a8')).toEqual({ x: 0, y: 7 });
      expect(notationToPosition('h1')).toEqual({ x: 7, y: 0 });
    });

    it('should return null for invalid notation', () => {
      // Out of bounds
      expect(notationToPosition('i8')).toBeNull();
      expect(notationToPosition('a9')).toBeNull();
      
      // Invalid format
      expect(notationToPosition('a')).toBeNull();
      expect(notationToPosition('11')).toBeNull();
      expect(notationToPosition('')).toBeNull();
    });
  });
}); 