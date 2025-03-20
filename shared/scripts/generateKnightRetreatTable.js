/**
 * Knight Retreat Table Generator (Build-time Tool)
 * 
 * This script generates a pre-computed lookup table for knight retreats in chess.
 * It runs during the build process to create compressed data that is used at runtime.
 * 
 * Generated files:
 * - src/constants/knightRetreatTable.json (reference file)
 * - src/constants/knightRetreatData.ts (compressed data)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Position type definition for clarity
// { x: number, y: number }

// Knight move directions (8 possible L-shapes)
const KNIGHT_MOVES = [
  { x: 1, y: 2 }, { x: 2, y: 1 },
  { x: 2, y: -1 }, { x: 1, y: -2 },
  { x: -1, y: -2 }, { x: -2, y: -1 },
  { x: -2, y: 1 }, { x: -1, y: 2 }
];

/**
 * Checks if a position is within the chessboard bounds
 */
function isValidPosition(position) {
  return position.x >= 0 && position.x < 8 && position.y >= 0 && position.y < 8;
}

/**
 * Calculates the minimum number of knight moves needed to go from start to end
 * This is an implementation of the knight's shortest path algorithm
 */
function calculateKnightDistance(start, end) {
  // If same position, distance is 0
  if (start.x === end.x && start.y === end.y) {
    return 0;
  }
  
  // Initialize visited array and queue for BFS
  const visited = Array(8).fill(0).map(() => Array(8).fill(false));
  const queue = [];
  
  // Start BFS
  queue.push([start, 0]);
  visited[start.y][start.x] = true;
  
  while (queue.length > 0) {
    const [current, distance] = queue.shift();
    
    // Check all 8 possible knight moves
    for (const move of KNIGHT_MOVES) {
      const nextPos = { x: current.x + move.x, y: current.y + move.y };
      
      // Check if position is valid and not visited
      if (isValidPosition(nextPos) && !visited[nextPos.y][nextPos.x]) {
        // If this is the target, return the distance
        if (nextPos.x === end.x && nextPos.y === end.y) {
          return distance + 1;
        }
        
        // Mark as visited and add to queue
        visited[nextPos.y][nextPos.x] = true;
        queue.push([nextPos, distance + 1]);
      }
    }
  }
  
  // Should never reach here if positions are valid
  return -1;
}

/**
 * Generates a compact numeric key from starting position and attack position
 * Format: 12 bits total (3 bits each for startX, startY, attackX, attackY)
 */
function generateCompactKey(start, attack) {
  return (start.x << 9) | (start.y << 6) | (attack.x << 3) | attack.y;
}

/**
 * Creates a bit-packed representation of position and cost
 * Format: 
 * - x: 3 bits (bits 6-8), shifted left by 6
 * - y: 3 bits (bits 3-5), shifted left by 3
 * - cost: 3 bits (bits 0-2), no shift
 * Total: 9 bits
 */
function packRetreatOption(position, cost) {
  return (position.x << 6) | (position.y << 3) | (cost & 0x7);
}

/**
 * Gets all valid attack positions for a knight at the given position
 */
function getKnightAttackPositions(position) {
  return KNIGHT_MOVES
    .map(move => ({ x: position.x + move.x, y: position.y + move.y }))
    .filter(isValidPosition);
}

/**
 * Gets all squares in the rectangle formed by the knight's L path
 */
function getRetreatRectangle(start, attack) {
  // Determine the direction of attack
  const dx = attack.x - start.x;
  const dy = attack.y - start.y;
  
  // The rectangle is formed by the two possible L paths
  // First, determine the corner points of the rectangle
  const corners = [
    start, // Original position
    attack, // Attack position
    { x: start.x, y: attack.y }, // Corner 1
    { x: attack.x, y: start.y }  // Corner 2
  ];
  
  // Get all positions within this rectangle
  const retreatPositions = [];
  
  // Determine bounds of the rectangle
  const minX = Math.min(...corners.map(p => p.x));
  const maxX = Math.max(...corners.map(p => p.x));
  const minY = Math.min(...corners.map(p => p.y));
  const maxY = Math.max(...corners.map(p => p.y));
  
  // Add all positions in the rectangle
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      retreatPositions.push({ x, y });
    }
  }
  
  // Remove the attack position (knight can't retreat to where it tried to capture)
  return retreatPositions.filter(pos => !(pos.x === attack.x && pos.y === attack.y));
}

/**
 * Main function to generate the lookup table
 */
function generateKnightRetreatTable() {
  const table = {};
  let totalScenarios = 0;
  
  // For each position on the board
  for (let startX = 0; startX < 8; startX++) {
    for (let startY = 0; startY < 8; startY++) {
      const startPos = { x: startX, y: startY };
      
      // Get all possible attack positions
      const attackPositions = getKnightAttackPositions(startPos);
      
      // For each attack position
      for (const attackPos of attackPositions) {
        // Get retreat rectangle
        const retreatPositions = getRetreatRectangle(startPos, attackPos);
        
        // Calculate costs for each retreat position
        const retreatOptions = [];
        
        for (const retreatPos of retreatPositions) {
          // Calculate cost (minimum knight moves required)
          const cost = calculateKnightDistance(startPos, retreatPos);
          
          // No need to cap cost at 3 anymore - we now use 3 bits (0-7)
          // We expect costs to be 0, 2, 3, or 4 for knights
          
          // Pack position and cost
          const packedOption = packRetreatOption(retreatPos, cost);
          retreatOptions.push(packedOption);
        }
        
        // Store in table using compact key
        const key = generateCompactKey(startPos, attackPos);
        table[key] = retreatOptions;
        totalScenarios++;
      }
    }
  }
  
  console.log(`Generated table with ${totalScenarios} retreat scenarios.`);
  console.log(`Total retreat options: ${Object.values(table).flat().length}`);
  
  return table;
}

// Main execution
try {
  console.log('Generating knight retreat table...');
  const retreatTable = generateKnightRetreatTable();
  console.log(`Generated knight retreat table with ${Object.keys(retreatTable).length} entries`);

  // Save reference JSON file
  // const outputJsonPath = path.join(__dirname, '..', 'src', 'constants', 'knightRetreatTable.json');
  // fs.writeFileSync(outputJsonPath, JSON.stringify(retreatTable, null, 2));
  // console.log(`Saved reference file to ${outputJsonPath}`);

  // Compress the data
  const jsonData = JSON.stringify(retreatTable);
  const compressedData = zlib.gzipSync(jsonData);
  const base64Data = compressedData.toString('base64');
  
  // Create compressed data module
  const tsOutputPath = path.join(__dirname, '..', 'src', 'constants', 'knightRetreatData.ts');
  const tsContent = `/**
 * Knight Retreat Table - Auto-generated
 * 
 * This file contains the compressed knight retreat lookup table data.
 * It was automatically generated by the knightRetreatGenerator script.
 * DO NOT EDIT THIS FILE MANUALLY.
 */

/**
 * Compressed knight retreat table data as a base64 string.
 * This data is a gzipped JSON string of the knight retreat lookup table.
 */
export const compressedKnightRetreatTable = "${base64Data}";
`;
  fs.writeFileSync(tsOutputPath, tsContent);
  console.log(`Saved compressed data module to ${tsOutputPath}`);

  console.log('Knight retreat table generation completed successfully!');
} catch (error) {
  console.error('Error generating knight retreat table:', error);
  process.exit(1);
} 