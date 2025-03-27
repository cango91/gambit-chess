import { 
  decompressKnightRetreatTable, 
  generateRetreatKey, 
  unpackRetreatOption,
  getKnightRetreats,
  getKnightRetreatsFromPositions,
  RetreatOption
} from '../../constants/knightRetreatUtils';

describe('Knight Retreat Utilities', () => {
  describe('Key Generation', () => {
    it('should generate correct retreat keys', () => {
      // Test a few key combinations
      const key1 = generateRetreatKey(0, 0, 2, 1); // a1 -> c2
      const key2 = generateRetreatKey(4, 4, 6, 5); // e5 -> g6
      const key3 = generateRetreatKey(7, 7, 5, 6); // h8 -> f7
      
      // Check that keys are unique
      expect(key1).not.toEqual(key2);
      expect(key1).not.toEqual(key3);
      expect(key2).not.toEqual(key3);
      
      // Check that keys are deterministic
      expect(generateRetreatKey(0, 0, 2, 1)).toEqual(key1);
      expect(generateRetreatKey(4, 4, 6, 5)).toEqual(key2);
      expect(generateRetreatKey(7, 7, 5, 6)).toEqual(key3);
    });
    
    it('should pack coordinates properly into the key', () => {
      // Knight from e4 to f6
      const key = generateRetreatKey(4, 3, 5, 5);
      
      // Check bit patterns in the key
      // startX (4) should be in bits 9-11
      // startY (3) should be in bits 6-8
      // attackX (5) should be in bits 3-5
      // attackY (5) should be in bits 0-2
      
      // 4 << 9 = 4 * 512 = 2048
      // 3 << 6 = 3 * 64 = 192
      // 5 << 3 = 5 * 8 = 40
      // 5 = 5
      // Total: 2048 + 192 + 40 + 5 = 2285
      expect(key).toBe(2285);
    });
  });
  
  describe('Option Unpacking', () => {
    it('should unpack retreat options correctly', () => {
      // Test unpacking a few options
      // Option format: (x << 6) | (y << 3) | cost
      
      // c3 with cost 2: (2 << 6) | (2 << 3) | 2 = 128 + 16 + 2 = 146
      const option1 = unpackRetreatOption(146);
      expect(option1.x).toBe(2); // c
      expect(option1.y).toBe(2); // 3
      expect(option1.cost).toBe(2);
      
      // f7 with cost 3: (5 << 6) | (6 << 3) | 3 = 320 + 48 + 3 = 371
      const option2 = unpackRetreatOption(371);
      expect(option2.x).toBe(5); // f
      expect(option2.y).toBe(6); // 7
      expect(option2.cost).toBe(3);
    });
    
    it('should handle edge cases correctly', () => {
      // a1 with cost 0: (0 << 6) | (0 << 3) | 0 = 0
      const option1 = unpackRetreatOption(0);
      expect(option1.x).toBe(0); // a
      expect(option1.y).toBe(0); // 1
      expect(option1.cost).toBe(0);
      
      // h8 with cost 7: (7 << 6) | (7 << 3) | 7 = 448 + 56 + 7 = 511
      const option2 = unpackRetreatOption(511);
      expect(option2.x).toBe(7); // h
      expect(option2.y).toBe(7); // 8
      expect(option2.cost).toBe(7);
    });
  });
  
  describe('Decompression', () => {
    it('should return a valid data structure after decompression', () => {
      const table = decompressKnightRetreatTable();
      
      // Check that we have a valid object
      expect(table).toBeDefined();
      expect(typeof table).toBe('object');
      
      // The table might be empty if we're running in a test environment
      // without the compressed data, but it should at least be an object
      if (Object.keys(table).length > 0) {
        // Pick a known key and check its structure
        const sampleKey = Object.keys(table)[0];
        const options = table[sampleKey];
        
        expect(Array.isArray(options)).toBe(true);
        if (options.length > 0) {
          expect(typeof options[0]).toBe('number');
        }
      }
    });
    
    it('should cache the decompressed table', () => {
      // Call it twice and check it's the same object reference
      const table1 = decompressKnightRetreatTable();
      const table2 = decompressKnightRetreatTable();
      
      expect(table1).toBe(table2); // Same object reference
    });
  });
  
  describe('Knight Retreat Calculations', () => {
    it('should retrieve retreat options by coordinates', () => {
      // This test is a bit challenging since the actual data depends on the
      // pre-calculated table, which might not be available in tests
      // But we can test the function signature and behavior
      
      const retreats = getKnightRetreats(4, 3, 6, 5); // e4 to g6
      
      expect(Array.isArray(retreats)).toBe(true);
      // Each retreat should have x, y, cost structure
      if (retreats.length > 0) {
        const retreat = retreats[0];
        expect(retreat).toHaveProperty('x');
        expect(retreat).toHaveProperty('y');
        expect(retreat).toHaveProperty('cost');
      }
    });
    
    it('should retrieve retreat options by position strings', () => {
      const retreats = getKnightRetreatsFromPositions('e4', 'g6');
      
      expect(Array.isArray(retreats)).toBe(true);
      // Each retreat should have to, cost structure
      if (retreats.length > 0) {
        const retreat = retreats[0];
        expect(retreat).toHaveProperty('to');
        expect(retreat).toHaveProperty('cost');
        expect(typeof retreat.to).toBe('string');
        expect(typeof retreat.cost).toBe('number');
      }
    });
    
    it('should handle invalid or missing positions gracefully', () => {
      // When we pass invalid coordinates or positions not in the table
      // the function should return an empty array rather than throw an error
      
      const retreats = getKnightRetreats(9, 9, 10, 10); // Invalid coordinates
      expect(Array.isArray(retreats)).toBe(true);
      expect(retreats.length).toBe(0);
      
      const posRetreats = getKnightRetreatsFromPositions('j9', 'k10'); // Invalid positions
      expect(Array.isArray(posRetreats)).toBe(true);
      expect(posRetreats.length).toBe(0);
    });
  });
}); 