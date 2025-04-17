import { Square } from 'chess.js';
import { compressedKnightRetreatTable } from '../constants/knightRetreatData';
import pako from 'pako';

// Knight retreat lookup table (decompressed on demand)
let knightRetreatTable: Record<number, number[]> | null = null;

/**
 * Decompresses the knight retreat table data using pako
 * Handles both Node.js and browser environments
 */
function decompressKnightRetreatTable(): Record<number, number[]> {
  if (knightRetreatTable) {
    return knightRetreatTable;
  }

  try {
    // Convert base64 to binary
    let binaryData: Uint8Array;
    
    // Check if running in a Node.js environment
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js environment - use Buffer
      const buffer = Buffer.from(compressedKnightRetreatTable, 'base64');
      binaryData = new Uint8Array(buffer);
    } else {
      // Browser environment - convert base64 manually
      const binaryString = atob(compressedKnightRetreatTable);
      const len = binaryString.length;
      binaryData = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        binaryData[i] = binaryString.charCodeAt(i);
      }
    }
    
    // Use pako to decompress the data
    const decompressed = pako.inflate(binaryData, { to: 'string' });
    knightRetreatTable = JSON.parse(decompressed);
    if (!knightRetreatTable) {
      throw new Error('Failed to decompress knight retreat table');
    }
    return knightRetreatTable;
  } catch (error) {
    console.error('Failed to decompress knight retreat table:', error);
    return {}; // Return empty table on error, forcing fallback to manual calculation
  }
}

/**
 * Generates a compact key for the knight retreat table lookup
 */
export function generateRetreatKey(startX: number, startY: number, attackX: number, attackY: number): number {
  return (startX << 9) | (startY << 6) | (attackX << 3) | attackY;
}

/**
 * Unpacks a retreat option from its compact bit representation
 * Format: x (3 bits) | y (3 bits) | cost (3 bits)
 */
export function unpackRetreatOption(packed: number): { x: number; y: number; cost: number } {
  const x = (packed >> 6) & 0x7;
  const y = (packed >> 3) & 0x7;
  const cost = packed & 0x7;
  return { x, y, cost };
}

/**
 * Converts chess notation to board coordinates (0-7)
 */
export function squareToCoords(square: Square): { x: number; y: number } {
  const x = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const y = 8 - parseInt(square.charAt(1));
  return { x, y };
}

/**
 * Converts board coordinates to chess notation
 */
export function coordsToSquare(x: number, y: number): Square {
  return (String.fromCharCode('a'.charCodeAt(0) + x) + (8 - y)) as Square;
}

/**
 * Gets knight retreat options from a start square to an attack square
 * Returns array of { square, cost } objects
 */
export function getKnightRetreatOptions(
  startSquare: Square,
  attackSquare: Square
): { square: Square; cost: number }[] {
  const start = squareToCoords(startSquare);
  const attack = squareToCoords(attackSquare);
  
  // Generate lookup key
  const key = generateRetreatKey(start.x, start.y, attack.x, attack.y);
  
  // Get retreat options from table
  const table = decompressKnightRetreatTable();
  const packedOptions = table[key] || [];
  
  // If no options found in the table, use fallback calculation
  if (packedOptions.length === 0) {
    const fallbackOptions = calculateKnightRetreatOptions(
      start.x, start.y, attack.x, attack.y
    );
    
    return fallbackOptions.map(opt => ({
      square: coordsToSquare(opt.x, opt.y),
      cost: opt.cost
    }));
  }
  
  // Convert to squares and costs
  return packedOptions.map(packed => {
    const { x, y, cost } = unpackRetreatOption(packed);
    return {
      square: coordsToSquare(x, y),
      cost
    };
  });
}

/**
 * Fallback method to calculate knight retreat options
 * Used when lookup table is not available
 */
export function calculateKnightRetreatOptions(
  startFile: number,
  startRank: number,
  attackFile: number,
  attackRank: number
): { x: number; y: number; cost: number }[] {
  const options: { x: number; y: number; cost: number }[] = [];
  
  // Define the bounding rectangle
  const minFile = Math.min(startFile, attackFile);
  const maxFile = Math.max(startFile, attackFile);
  const minRank = Math.min(startRank, attackRank);
  const maxRank = Math.max(startRank, attackRank);
  
  // Check all positions in the bounding rectangle
  for (let x = minFile; x <= maxFile; x++) {
    for (let y = minRank; y <= maxRank; y++) {
      // Skip the attack position
      if (x === attackFile && y === attackRank) {
        continue;
      }
      
      // Calculate the distance in knight moves
      const cost = calculateKnightDistance(startFile, startRank, x, y);
      
      // Only include reachable positions (cost < 8 moves)
      if (cost >= 0 && cost < 8) {
        options.push({ x, y, cost });
      }
    }
  }
  
  return options;
}

/**
 * Calculate the minimum number of knight moves required to reach a target square
 * Uses breadth-first search (BFS)
 */
export function calculateKnightDistance(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): number {
  // If already at target, cost is 0
  if (startX === endX && startY === endY) {
    return 0;
  }
  
  // Knight move directions
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  // Track visited positions and their distances
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
      if (
        nextX < 0 || nextX >= 8 || nextY < 0 || nextY >= 8 || 
        visited[nextY][nextX]
      ) {
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
  
  // Impossible to reach (should never happen on a standard board)
  return -1;
}