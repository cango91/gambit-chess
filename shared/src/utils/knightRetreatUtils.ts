/**
 * Knight Retreat Utilities
 * 
 * Utilities for working with the pre-computed knight retreat table.
 */

import { Position, RetreatOption } from '../types';
import { compressedKnightRetreatTable } from '../constants/knightRetreatData';
import * as pako from 'pako'; // For browser-side decompression

// Decompressed table cache
let knightRetreatTable: Record<number, number[]> = {};
let tableInitialized = false;

/**
 * Generates a key for the knight retreat table lookup
 * @param originalPosition The knight's original position
 * @param failedCapturePosition The position where the knight's attempted capture failed
 * @returns A numeric key for lookup in the retreat table
 */
export function generateRetreatKey(
  originalPosition: Position,
  failedCapturePosition: Position
): number {
  // Convert 2D positions to 1D index (0-63)
  // Use 6 bits for each position (max value 63)
  const originalIndex = originalPosition.x * 8 + originalPosition.y;
  const captureIndex = failedCapturePosition.x * 8 + failedCapturePosition.y;
  
  // Pack both into a single number, original in high bits, capture in low bits
  return (originalIndex << 6) | captureIndex;
}

/**
 * Unpacks a retreat option from its packed number representation
 * @param packedOption The numeric representation of a retreat option
 * @returns The unpacked RetreatOption object
 */
export function unpackRetreatOption(packedOption: number): RetreatOption {
  // Extract the components from the packed number
  // - x: 3 bits (0-7), shifted 5 bits left
  // - y: 3 bits (0-7), shifted 2 bits left
  // - bpCost: 2 bits (0-3), in the lowest 2 bits
  const x = (packedOption >> 5) & 0x7;
  const y = (packedOption >> 2) & 0x7;
  const bpCost = packedOption & 0x3; // Only using 2 bits for cost (0-3)
  
  return {
    position: { x, y },
    bpCost
  };
}

/**
 * Decompresses and initializes the knight retreat table
 */
export function initializeKnightRetreatTable(): void {
  if (tableInitialized) return;
  
  try {
    // Skip decompression if the table is empty (happens in development/tests)
    if (!compressedKnightRetreatTable) {
      console.warn('Knight retreat table data is empty. Using empty table.');
      knightRetreatTable = {};
      tableInitialized = true;
      return;
    }
    
    // Decode base64
    let decodedData: Uint8Array;
    
    // In a browser environment
    if (typeof window !== 'undefined') {
      // Use browser's atob and pako
      const binaryString = atob(compressedKnightRetreatTable);
      decodedData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        decodedData[i] = binaryString.charCodeAt(i);
      }
      
      // Use pako for decompression
      const decompressedData = pako.inflate(decodedData, { to: 'string' });
      knightRetreatTable = JSON.parse(decompressedData);
    } 
    // In a Node.js environment
    else {
      try {
        const zlib = require('zlib');
        const buffer = Buffer.from(compressedKnightRetreatTable, 'base64');
        const decompressed = zlib.gunzipSync(buffer);
        knightRetreatTable = JSON.parse(decompressed.toString());
      } catch (error) {
        console.warn('Error decompressing knight retreat table:', error);
        knightRetreatTable = {};
      }
    }
    
    tableInitialized = true;
    const entryCount = Object.keys(knightRetreatTable).length;
    console.log(`Knight retreat table initialized with ${entryCount} entries`);
    
  } catch (error) {
    console.warn('Failed to initialize knight retreat table:', error);
    knightRetreatTable = {};
    tableInitialized = true; // Prevent further initialization attempts
  }
}

/**
 * Gets knight retreat options from the lookup table
 * @param originalPosition The knight's original position
 * @param failedCapturePosition The position where the knight's attempted capture failed
 * @returns Array of valid retreat options with their BP costs
 */
export function getKnightRetreatOptions(
  originalPosition: Position,
  failedCapturePosition: Position
): RetreatOption[] {
  // Initialize table if needed
  if (!tableInitialized) {
    initializeKnightRetreatTable();
  }
  
  // Get compact key for lookup
  const key = generateRetreatKey(originalPosition, failedCapturePosition);
  
  // If no entry in table, return only the original position
  if (!knightRetreatTable[key]) {
    return [{
      position: { ...originalPosition },
      bpCost: 0
    }];
  }
  
  // Unpack the options from the lookup table
  const retreatOptions = knightRetreatTable[key].map(packed => unpackRetreatOption(packed));
  
  // Always ensure original position is included as a valid retreat with cost 0
  const hasOriginalPosition = retreatOptions.some(option => 
    option.position.x === originalPosition.x && option.position.y === originalPosition.y
  );
  
  if (!hasOriginalPosition) {
    retreatOptions.push({
      position: { ...originalPosition },
      bpCost: 0
    });
  }
  
  return retreatOptions;
}

/**
 * Checks if a position is a valid knight retreat position
 */
export function isValidKnightRetreatPosition(
  originalPosition: Position,
  failedCapturePosition: Position,
  retreatPosition: Position
): boolean {
  const retreatOptions = getKnightRetreatOptions(originalPosition, failedCapturePosition);
  
  return retreatOptions.some(option => 
    option.position.x === retreatPosition.x && option.position.y === retreatPosition.y
  );
}

/**
 * Gets the BP cost for a knight retreat
 */
export function getKnightRetreatCost(
  originalPosition: Position,
  failedCapturePosition: Position,
  retreatPosition: Position
): number {
  // Return to original position always costs 0
  if (originalPosition.x === retreatPosition.x && originalPosition.y === retreatPosition.y) {
    return 0;
  }
  
  const retreatOptions = getKnightRetreatOptions(originalPosition, failedCapturePosition);
  
  const option = retreatOptions.find(option => 
    option.position.x === retreatPosition.x && option.position.y === retreatPosition.y
  );
  
  if (!option) {
    console.warn('Invalid knight retreat position');
    return -1;
  }
  
  return option.bpCost;
}

// Export module documentation
export const __documentation = {
  name: "KnightRetreatUtils",
  purpose: "Runtime utilities for accessing and using the pre-computed knight retreat lookup table",
  publicAPI: {
    initializeKnightRetreatTable: "Decompresses and initializes the lookup table",
    getKnightRetreatOptions: "Gets all valid retreat options for a knight",
    isValidKnightRetreatPosition: "Checks if a position is a valid knight retreat position",
    getKnightRetreatCost: "Gets the BP cost for a knight retreat",
    generateRetreatKey: "Creates a numeric key for knight retreat table lookup",
    unpackRetreatOption: "Unpacks a retreat option from its compressed form"
  },
  dependencies: [
    "types",
    "constants/knightRetreatData",
    "pako"
  ],
  implementationStatus: "Complete",
  optimizations: [
    "Lazy decompression for optimal performance",
    "Platform-specific decompression (pako for browser, zlib for Node.js)",
    "Compact numeric keys and values for space efficiency"
  ]
}; 