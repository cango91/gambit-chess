import { 
  isValidPosition,
  positionToCoordinates,
  coordinatesToPosition,
  getDistance,
  isSameRank,
  isSameFile,
  isSameDiagonal,
  getPositionsBetween
} from '../../utils/position';

describe('Position Utilities', () => {
  describe('isValidPosition', () => {
    it('should return true for valid positions', () => {
      expect(isValidPosition('a1')).toBe(true);
      expect(isValidPosition('h8')).toBe(true);
      expect(isValidPosition('e4')).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isValidPosition('a0')).toBe(false);
      expect(isValidPosition('i1')).toBe(false);
      expect(isValidPosition('a9')).toBe(false);
      expect(isValidPosition('xx')).toBe(false);
      expect(isValidPosition('')).toBe(false);
    });
  });

  describe('positionToCoordinates', () => {
    it('should convert positions to coordinates', () => {
      expect(positionToCoordinates('a1')).toEqual([0, 0]);
      expect(positionToCoordinates('h8')).toEqual([7, 7]);
      expect(positionToCoordinates('e4')).toEqual([4, 3]);
    });

    it('should throw error for invalid positions', () => {
      expect(() => positionToCoordinates('i9')).toThrow();
    });
  });

  describe('coordinatesToPosition', () => {
    it('should convert coordinates to positions', () => {
      expect(coordinatesToPosition(0, 0)).toBe('a1');
      expect(coordinatesToPosition(7, 7)).toBe('h8');
      expect(coordinatesToPosition(4, 3)).toBe('e4');
    });

    it('should throw error for invalid coordinates', () => {
      expect(() => coordinatesToPosition(-1, 0)).toThrow();
      expect(() => coordinatesToPosition(0, -1)).toThrow();
      expect(() => coordinatesToPosition(8, 0)).toThrow();
      expect(() => coordinatesToPosition(0, 8)).toThrow();
    });
  });

  describe('getDistance', () => {
    it('should calculate correct distances', () => {
      expect(getDistance('a1', 'a2')).toBe(1);
      expect(getDistance('a1', 'b1')).toBe(1);
      expect(getDistance('a1', 'h8')).toBe(14);
      expect(getDistance('e4', 'e4')).toBe(0);
    });
  });

  describe('isSameRank', () => {
    it('should detect positions on same rank', () => {
      expect(isSameRank('a1', 'h1')).toBe(true);
      expect(isSameRank('a2', 'c2')).toBe(true);
    });

    it('should detect positions on different ranks', () => {
      expect(isSameRank('a1', 'a2')).toBe(false);
      expect(isSameRank('h1', 'h8')).toBe(false);
    });
  });

  describe('isSameFile', () => {
    it('should detect positions on same file', () => {
      expect(isSameFile('a1', 'a8')).toBe(true);
      expect(isSameFile('c2', 'c7')).toBe(true);
    });

    it('should detect positions on different files', () => {
      expect(isSameFile('a1', 'b1')).toBe(false);
      expect(isSameFile('h1', 'a1')).toBe(false);
    });
  });

  describe('isSameDiagonal', () => {
    it('should detect positions on same diagonal', () => {
      expect(isSameDiagonal('a1', 'h8')).toBe(true);
      expect(isSameDiagonal('h1', 'a8')).toBe(true);
      expect(isSameDiagonal('c3', 'e5')).toBe(true);
    });

    it('should detect positions not on same diagonal', () => {
      expect(isSameDiagonal('a1', 'a2')).toBe(false);
      expect(isSameDiagonal('a1', 'h1')).toBe(false);
      expect(isSameDiagonal('a1', 'c4')).toBe(false);
    });
  });

  describe('getPositionsBetween', () => {
    it('should get positions between two squares on same rank', () => {
      expect(getPositionsBetween('a1', 'd1')).toEqual(['b1', 'c1']);
      expect(getPositionsBetween('h8', 'e8')).toEqual(['g8', 'f8']);
    });

    it('should get positions between two squares on same file', () => {
      expect(getPositionsBetween('a1', 'a4')).toEqual(['a2', 'a3']);
      expect(getPositionsBetween('h8', 'h5')).toEqual(['h7', 'h6']);
    });

    it('should get positions between two squares on same diagonal', () => {
      expect(getPositionsBetween('a1', 'd4')).toEqual(['b2', 'c3']);
      expect(getPositionsBetween('h1', 'e4')).toEqual(['g2', 'f3']);
    });

    it('should return empty array for adjacent positions', () => {
      expect(getPositionsBetween('a1', 'a2')).toEqual([]);
      expect(getPositionsBetween('a1', 'b1')).toEqual([]);
      expect(getPositionsBetween('a1', 'b2')).toEqual([]);
    });

    it('should return empty array for positions not on same rank, file or diagonal', () => {
      expect(getPositionsBetween('a1', 'b3')).toEqual([]);
      expect(getPositionsBetween('c3', 'h5')).toEqual([]);
    });
  });
}); 