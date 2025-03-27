/**
 * Knight Retreat Table Generator
 *
 * This script generates a pre-computed lookup table for knight retreats in chess.
 * The generated table maps from position and attack coordinates to valid retreat options.
 * 
 * The output is a TypeScript module with the compressed lookup table data.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Constants
const BOARD_SIZE = 8;
const MAX_RETREAT_COST = 7; // Maximum moves a knight would need (unlikely to exceed 4 in practice)

// Knight move directions
const KNIGHT_MOVES = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1]
];

/**
 * Validates if a position is within board boundaries
 */
function isValidPosition(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

/**
 * Calculates the minimum number of knight moves needed to go from start to end
 * Uses breadth-first search (BFS)
 */
function calculateKnightDistance(startX, startY, endX, endY) {
  // If already at target, cost is 0
  if (startX === endX && startY === endY) {
    return 0;
  }

  // Track visited positions and their distances
  const visited = new Array(BOARD_SIZE)
    .fill(0)
    .map(() => new Array(BOARD_SIZE).fill(false));
  
  // BFS queue with [x, y, distance]
  const queue = [[startX, startY, 0]];
  visited[startY][startX] = true;

  while (queue.length > 0) {
    const [x, y, distance] = queue.shift();

    // Check all knight moves
    for (const [dx, dy] of KNIGHT_MOVES) {
      const nextX = x + dx;
      const nextY = y + dy;

      // Skip invalid positions or already visited
      if (!isValidPosition(nextX, nextY) || visited[nextY][nextX]) {
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

/**
 * Gets all valid attack positions for a knight at a given position
 */
function getKnightAttackPositions(x, y) {
  const positions = [];
  
  for (const [dx, dy] of KNIGHT_MOVES) {
    const attackX = x + dx;
    const attackY = y + dy;
    
    if (isValidPosition(attackX, attackY)) {
      positions.push([attackX, attackY]);
    }
  }
  
  return positions;
}

/**
 * Gets all valid retreat options for a knight from start position to attack position
 * Returns array of [x, y, cost] for each valid retreat position
 */
function getKnightRetreatOptions(startX, startY, attackX, attackY) {
  // A retreat position must be:
  // 1. In rectangle defined by start and attack positions
  // 2. Not equal to the attack position (can't retreat to where you're attacking)
  
  // Define the bounding rectangle
  const minX = Math.min(startX, attackX);
  const maxX = Math.max(startX, attackX);
  const minY = Math.min(startY, attackY);
  const maxY = Math.max(startY, attackY);
  
  const validRetreats = [];
  
  // Check all positions in the bounding rectangle
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // Skip the attack position
      if (x === attackX && y === attackY) {
        continue;
      }
      
      // Calculate cost (moves needed) from start to this retreat position
      const cost = calculateKnightDistance(startX, startY, x, y);
      
      // Add valid retreat options (cost < MAX_RETREAT_COST)
      if (cost >= 0 && cost < MAX_RETREAT_COST) {
        validRetreats.push([x, y, cost]);
      }
    }
  }
  
  return validRetreats;
}

/**
 * Generates a compact key for the knight retreat table lookup
 */
function generateRetreatKey(startX, startY, attackX, attackY) {
  return (startX << 9) | (startY << 6) | (attackX << 3) | attackY;
}

/**
 * Packs a retreat option into a compact bit representation
 * Format: x (3 bits) | y (3 bits) | cost (3 bits)
 */
function packRetreatOption(x, y, cost) {
  return (x << 6) | (y << 3) | (cost & 0x7);
}

/**
 * Main function to generate the knight retreat table
 */
function generateKnightRetreatTable() {
  const table = {};
  
  // Iterate through all positions on the board
  for (let startX = 0; startX < BOARD_SIZE; startX++) {
    for (let startY = 0; startY < BOARD_SIZE; startY++) {
      // Get all possible knight attack positions from this start
      const attackPositions = getKnightAttackPositions(startX, startY);
      
      // For each attack position, calculate valid retreat options
      for (const [attackX, attackY] of attackPositions) {
        // Get retreat options
        const retreatOptions = getKnightRetreatOptions(startX, startY, attackX, attackY);
        
        // Pack each retreat option
        const packedOptions = retreatOptions.map(([x, y, cost]) => packRetreatOption(x, y, cost));
        
        // Add to table with compact key
        const key = generateRetreatKey(startX, startY, attackX, attackY);
        table[key] = packedOptions;
      }
    }
  }
  
  return table;
}

/**
 * Compress data using gzip and encode as base64 string
 */
function compressData(data) {
  const jsonString = JSON.stringify(data);
  const compressed = zlib.gzipSync(jsonString);
  return compressed.toString('base64');
}

/**
 * Save the compressed knight retreat table to a TypeScript file
 */
function saveCompressedData(table) {
  const compressedData = compressData(table);
  
  // Template for the TypeScript file with only data
  const template = `/**
 * Knight Retreat Table Data
 * 
 * This file contains the compressed knight retreat lookup table data.
 * This file is auto-generated by the prebuild script from
 * scripts/generateKnightRetreatTable.js
 * 
 * DO NOT EDIT THIS FILE MANUALLY
 */

/**
 * Compressed knight retreat lookup table as a base64 string.
 * Contains pre-calculated retreat options for knight pieces.
 */
export const compressedKnightRetreatTable = "${compressedData}";
`;

  // Path to output file in the constants directory
  const outputPath = path.resolve(__dirname, '../src/constants/knightRetreatData.ts');
  
  // Write file
  fs.writeFileSync(outputPath, template, 'utf8');
  console.log(`Generated knight retreat table with ${Object.keys(table).length} entries`);
  console.log(`Saved to: ${outputPath}`);
}

// Generate and save the knight retreat table
const knightRetreatTable = generateKnightRetreatTable();
saveCompressedData(knightRetreatTable); 