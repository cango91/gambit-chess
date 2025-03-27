import { calculateTacticalRetreats } from '../../tactical/retreat';
import { coordinatesToPosition, positionToCoordinates } from '../../utils/position';
import { RetreatOption } from '../../constants/knightRetreatUtils';
import { getKnightRetreats } from '../../constants/knightRetreatUtils';

// Mock implementation of calculateKnightRetreatsRuntime to validate against
function mockCalculateKnightRetreats(
  startX: number, startY: number,
  attackX: number, attackY: number
): RetreatOption[] {
  const retreats: RetreatOption[] = [];
  
  // Always include original position with 0 cost
  retreats.push({ x: startX, y: startY, cost: 0 });
  
  // Define the rectangle's bounds
  const minX = Math.min(startX, attackX);
  const maxX = Math.max(startX, attackX);
  const minY = Math.min(startY, attackY);
  const maxY = Math.max(startY, attackY);
  
  // Loop through all positions in the rectangle
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // Skip original position (already included) and attack position
      if ((x === startX && y === startY) || (x === attackX && y === attackY)) {
        continue;
      }
      
      // Calculate cost based on minimum knight moves from original position
      const cost = calculateKnightMoveCost(startX, startY, x, y);
      retreats.push({ x, y, cost });
    }
  }
  
  return retreats;
}

// Calculate the minimum number of knight moves required between two positions
function calculateKnightMoveCost(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  
  if (dx === 0 && dy === 0) return 0;
  if (dx === 1 && dy === 2) return 1; // Knight's move
  if (dx === 2 && dy === 1) return 1; // Knight's move
  
  if (dx === dy) return Math.ceil(dx / 2); // Diagonal
  
  if (dx < dy) {
    return Math.ceil(dy / 2) + Math.floor((dy % 2 === 0 ? dx : dx - 1) / 3);
  } else {
    return Math.ceil(dx / 2) + Math.floor((dx % 2 === 0 ? dy : dy - 1) / 3);
  }
}

// Calculate ground truth knight retreat cost using breadth-first search
function calculateGroundTruthKnightCost(startX: number, startY: number, endX: number, endY: number): number {
  // If already at target, cost is 0
  if (startX === endX && startY === endY) {
    return 0;
  }

  // Knight move directions
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  // Track visited positions
  const visited = Array(8).fill(0).map(() => Array(8).fill(false));
  
  // BFS queue with [x, y, distance]
  const queue: [number, number, number][] = [[startX, startY, 0]];
  visited[startY][startX] = true;

  while (queue.length > 0) {
    const [x, y, distance] = queue.shift()!;

    // Check all knight moves
    for (const [dx, dy] of knightMoves) {
      const nextX = x + dx;
      const nextY = y + dy;

      // Skip invalid positions or already visited
      if (nextX < 0 || nextX >= 8 || nextY < 0 || nextY >= 8 || visited[nextY][nextX]) {
        continue;
      }

      // If found target, return distance
      if (nextX === endX && nextY === endY) {
        return distance + 1;
      }

      // Mark as visited and add to queue
      visited[nextY][nextX] = true;
      queue.push([nextX, nextY, distance + 1]);
    }
  }

  // Impossible to reach
  return -1;
}

describe('Tactical Retreat Calculator', () => {
  describe('Knight retreats', () => {
    // Mock the knight retreat data for testing
    beforeEach(() => {
      // We're intentionally not mocking getKnightRetreats since our tests 
      // should validate against the runtime calculation instead
      jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should always include original position with 0 cost', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('n', 'e4', 'g5', boardState);
      
      // Original position should always be included with 0 cost
      expect(retreats).toContainEqual({ to: 'e4', cost: 0 });
    });
    
    it('should generate valid knight retreats within the rectangle using runtime calculation', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('n', 'e4', 'g5', boardState);
      
      // These positions should definitely be included
      const minimumExpectedPositions = ['e4', 'e5', 'f4', 'f5', 'g4'];
      
      // Verify all minimum expected positions are included
      for (const pos of minimumExpectedPositions) {
        expect(retreats.map(r => r.to)).toContain(pos);
      }
      
      // Verify the capture position isn't included
      expect(retreats.map(r => r.to)).not.toContain('g5');
      
      // Verify no unexpected positions outside the rectangle are included
      retreats.forEach(retreat => {
        const [x, y] = positionToCoordinates(retreat.to);
        expect(x >= 4 && x <= 6).toBe(true); // e-g columns (4-6)
        expect(y >= 3 && y <= 6).toBe(true); // 4-6 rows (3-6)
      });
      
      // Check costs are calculated correctly - original position should be 0
      expect(retreats.find(r => r.to === 'e4')?.cost).toBe(0);
    });
    
    it('should exclude occupied positions from retreat options', () => {
      // Create a board state with some occupied positions
      const boardState = new Map([
        ['f4', { type: 'p', color: 'white' }], // Occupy f4
        ['f5', { type: 'p', color: 'black' }]  // Occupy f5
      ]);
      
      const retreats = calculateTacticalRetreats('n', 'e4', 'g5', boardState);
      
      // Verify occupied positions are not included
      expect(retreats.map(r => r.to)).not.toContain('f4');
      expect(retreats.map(r => r.to)).not.toContain('f5');
      
      // These positions should definitely be included
      expect(retreats.map(r => r.to)).toContain('e4'); // Original position
      expect(retreats.map(r => r.to)).toContain('e5');
      expect(retreats.map(r => r.to)).toContain('g4');
    });
    
    it('should calculate knight retreat costs correctly', () => {
      // Test various knight positions and verify costs
      const testCases = [
        { start: 'e4', attack: 'g5' },
        { start: 'b1', attack: 'c3' },
        { start: 'h8', attack: 'f7' },
        { start: 'a1', attack: 'c2' },
        { start: 'd4', attack: 'b5' }
      ];
      
      testCases.forEach(({ start, attack }) => {
        // Get coordinates
        const [startX, startY] = positionToCoordinates(start);
        const [attackX, attackY] = positionToCoordinates(attack);
        
        // Get actual retreats
        const boardState = new Map();
        const actualRetreats = calculateTacticalRetreats('n', start, attack, boardState);
        
        // For each actual retreat, verify the cost makes sense
        actualRetreats.forEach(retreat => {
          const [x, y] = positionToCoordinates(retreat.to);
          
          // The original position should have cost 0
          if (retreat.to === start) {
            expect(retreat.cost).toBe(0);
            return;
          }
          
          // Calculate ground truth cost
          const groundTruthCost = calculateGroundTruthKnightCost(startX, startY, x, y);
          
          // Verify the retreats have the correct costs
          expect(retreat.cost).toBe(groundTruthCost);
          
          // Make sure all positions are in the retreat rectangle
          const minX = Math.min(startX, attackX);
          const maxX = Math.max(startX, attackX);
          const minY = Math.min(startY, attackY);
          const maxY = Math.max(startY, attackY);
          
          expect(x >= minX && x <= maxX).toBe(true);
          expect(y >= minY && y <= maxY).toBe(true);
        });
      });
    });

    it('should match pre-calculated costs with ground truth calculated costs', () => {
      // Test cases with different knight positions
      const testCases = [
        { start: [4, 3], attack: [6, 5] },   // e4 → g6
        { start: [1, 0], attack: [2, 2] },   // b1 → c3
        { start: [7, 7], attack: [5, 6] },   // h8 → f7
        { start: [0, 0], attack: [2, 1] },   // a1 → c2
        { start: [3, 3], attack: [1, 4] }    // d4 → b5
      ];

      testCases.forEach(({ start, attack }) => {
        const [startX, startY] = start;
        const [attackX, attackY] = attack;

        // Get the pre-calculated retreat options
        const preCalculatedOptions = getKnightRetreats(startX, startY, attackX, attackY);
        
        // For each pre-calculated option, validate against ground truth
        preCalculatedOptions.forEach(option => {
          // Skip the attack position (should not be in options)
          if (option.x === attackX && option.y === attackY) {
            fail('Attack position should not be included in retreat options');
          }
          
          // Verify position is within the rectangle
          expect(option.x >= Math.min(startX, attackX)).toBe(true);
          expect(option.x <= Math.max(startX, attackX)).toBe(true);
          expect(option.y >= Math.min(startY, attackY)).toBe(true);
          expect(option.y <= Math.max(startY, attackY)).toBe(true);
          
          // Calculate ground truth cost and compare
          const groundTruthCost = calculateGroundTruthKnightCost(
            startX, startY, option.x, option.y
          );
          
          // Check that the pre-calculated cost matches the ground truth
          expect(option.cost).toBe(groundTruthCost);
        });
      });
    });
  });
  
  describe('Bishop retreats', () => {
    it('should calculate diagonal retreat options for bishop', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('b', 'c1', 'f4', boardState);
      
      // Original position should always be included
      expect(retreats).toContainEqual({ to: 'c1', cost: 0 });
      
      // Bishop should be able to retreat along the attack diagonal and in the opposite direction
      // From c1 to f4 diagonal, valid retreats are: c1, d2, e3 (excluding f4 which is the capture position)
      // No opposite direction because c1 is at the edge
      const expectedPositions = ['c1', 'd2', 'e3'];
      
      // Verify all expected positions are included
      for (const pos of expectedPositions) {
        expect(retreats.map(r => r.to)).toContain(pos);
      }
      
      // Verify capture position is not included
      expect(retreats.map(r => r.to)).not.toContain('f4');
      
      // Check costs match the distance from original position
      expect(retreats.find(r => r.to === 'd2')?.cost).toBe(1); // 1 square away
      expect(retreats.find(r => r.to === 'e3')?.cost).toBe(2); // 2 squares away
    });
    
    it('should exclude occupied positions from bishop retreat options', () => {
      // Create a board state with some occupied positions
      const boardState = new Map([
        ['d2', { type: 'p', color: 'white' }] // Occupy d2
      ]);
      
      const retreats = calculateTacticalRetreats('b', 'c1', 'f4', boardState);
      
      // d2 is occupied, so e3 should also be excluded as it's blocked
      expect(retreats.map(r => r.to).sort()).toEqual(['c1'].sort());
    });
  });
  
  describe('Rook retreats', () => {
    it('should calculate horizontal retreat options for rook', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('r', 'a4', 'h4', boardState);
      
      // Original position should always be included
      expect(retreats).toContainEqual({ to: 'a4', cost: 0 });
      
      // Rook should be able to retreat along the attack rank and in the opposite direction
      // From a4 to h4 horizontal, valid retreats are: a4, b4, c4, d4, e4, f4, g4 (excluding h4 which is the capture position)
      const expectedPositions = ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4'];
      
      // Verify all expected positions are included
      for (const pos of expectedPositions) {
        expect(retreats.map(r => r.to)).toContain(pos);
      }
      
      // Verify capture position is not included
      expect(retreats.map(r => r.to)).not.toContain('h4');
      
      // Check costs match the distance from original position
      expect(retreats.find(r => r.to === 'b4')?.cost).toBe(1); // 1 square away
      expect(retreats.find(r => r.to === 'g4')?.cost).toBe(6); // 6 squares away
    });
    
    it('should calculate vertical retreat options for rook', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('r', 'e1', 'e8', boardState);
      
      // Original position should always be included
      expect(retreats).toContainEqual({ to: 'e1', cost: 0 });
      
      // Rook should be able to retreat along the attack file and in the opposite direction
      // From e1 to e8 vertical, valid retreats are: e1, e2, e3, e4, e5, e6, e7 (excluding e8 which is the capture position)
      const expectedPositions = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7'];
      
      // Verify all expected positions are included
      for (const pos of expectedPositions) {
        expect(retreats.map(r => r.to)).toContain(pos);
      }
      
      // Verify capture position is not included
      expect(retreats.map(r => r.to)).not.toContain('e8');
    });
    
    it('should exclude occupied positions from rook retreat options', () => {
      // Create a board state with some occupied positions
      const boardState = new Map([
        ['e3', { type: 'p', color: 'white' }] // Occupy e3
      ]);
      
      const retreats = calculateTacticalRetreats('r', 'e1', 'e8', boardState);
      
      // e3 is occupied, so e4-e7 should also be excluded as they're blocked
      expect(retreats.map(r => r.to).sort()).toEqual(['e1', 'e2'].sort());
    });
  });
  
  describe('Queen retreats', () => {
    it('should calculate diagonal retreat options for queen', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('q', 'a1', 'h8', boardState);
      
      // Original position should always be included
      expect(retreats).toContainEqual({ to: 'a1', cost: 0 });
      
      // Queen should be able to retreat along the attack diagonal and in the opposite direction
      // From a1 to h8 diagonal, valid retreats are: a1, b2, c3, d4, e5, f6, g7 (excluding h8 which is the capture position)
      const expectedPositions = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7'];
      
      // Verify all expected positions are included
      for (const pos of expectedPositions) {
        expect(retreats.map(r => r.to)).toContain(pos);
      }
      
      // Verify capture position is not included
      expect(retreats.map(r => r.to)).not.toContain('h8');
    });
    
    it('should calculate horizontal retreat options for queen', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('q', 'a4', 'h4', boardState);
      
      // Queen should be able to retreat along the attack rank
      // From a4 to h4 horizontal, valid retreats are: a4, b4, c4, d4, e4, f4, g4 (excluding h4 which is the capture position)
      const expectedPositions = ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4'];
      
      // Verify all expected positions are included
      for (const pos of expectedPositions) {
        expect(retreats.map(r => r.to)).toContain(pos);
      }
      
      // Verify capture position is not included
      expect(retreats.map(r => r.to)).not.toContain('h4');
    });
    
    it('should exclude occupied positions from queen retreat options', () => {
      // Create a board state with some occupied positions
      const boardState = new Map([
        ['c3', { type: 'p', color: 'white' }] // Occupy c3
      ]);
      
      const retreats = calculateTacticalRetreats('q', 'a1', 'h8', boardState);
      
      // c3 is occupied, so d4-g7 should also be excluded as they're blocked
      expect(retreats.map(r => r.to).sort()).toEqual(['a1', 'b2'].sort());
    });
  });
  
  describe('Pawn and King retreats', () => {
    it('should only allow return to original position for pawns', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('p', 'e4', 'f5', boardState);
      
      // Pawns can only return to their original position
      expect(retreats).toHaveLength(1);
      expect(retreats[0]).toEqual({ to: 'e4', cost: 0 });
    });
    
    it('should only allow return to original position for kings', () => {
      const boardState = new Map();
      const retreats = calculateTacticalRetreats('k', 'e1', 'e2', boardState);
      
      // Kings can only return to their original position
      expect(retreats).toHaveLength(1);
      expect(retreats[0]).toEqual({ to: 'e1', cost: 0 });
    });
  });
}); 