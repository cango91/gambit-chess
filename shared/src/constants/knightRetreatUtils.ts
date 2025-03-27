/**
 * Knight Retreat Table Utilities
 * 
 * This file contains utility functions for working with the pre-calculated
 * knight retreat lookup table data.
 */

// @ts-ignore
import pako from 'pako';
import { compressedKnightRetreatTable } from './knightRetreatData';

/**
 * Interface for knight retreat position with cost
 */
export interface RetreatOption {
  x: number;
  y: number;
  cost: number;
}

// Cache the decompressed table to avoid repeated decompression
let decompressedTable: Record<string, number[]> | null = null;

/**
 * Decompresses the knight retreat table data
 * 
 * @returns The decompressed knight retreat table lookup object
 */
export function decompressKnightRetreatTable(): Record<string, number[]> {
  // Return cached table if already decompressed
  if (decompressedTable) {
    return decompressedTable;
  }

  // If empty, return an empty object - this means the table hasn't been generated yet
  if (!compressedKnightRetreatTable) {
    return {};
  }

  try {
    // Different decompression approaches based on environment
    if (typeof window !== 'undefined') {
      // Browser environment
      decompressedTable = decompressBrowser();
    } else {
      // Node.js environment
      decompressedTable = decompressNode();
    }
    return decompressedTable;
  } catch (error) {
    console.error('Error decompressing knight retreat table:', error);
    return {};
  }
}

/**
 * Browser-specific decompression using pako
 */
function decompressBrowser(): Record<string, number[]> {
  try {
    // Convert base64 to binary data
    const binaryString = atob(compressedKnightRetreatTable);
    const bytes = new Uint8Array(binaryString.length);
    
    // Fill the byte array
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Decompress using pako
    const decompressed = pako.inflate(bytes, { to: 'string' });
    
    // Parse JSON
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Error in browser decompression:', error);
    return {};
  }
}

/**
 * Node.js-specific decompression using zlib
 */
function decompressNode(): Record<string, number[]> {
  try {
    // This code will only run in Node.js environment
    // Dynamic import to avoid bundling issues
    const zlib = require('zlib');
    const buffer = Buffer.from(compressedKnightRetreatTable, 'base64');
    const decompressed = zlib.gunzipSync(buffer).toString();
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Error decompressing with Node.js zlib:', error);
    // Fallback to pako in case zlib is not available
    try {
      return decompressBrowser();
    } catch (fallbackError) {
      console.error('Fallback decompression also failed:', fallbackError);
      return {};
    }
  }
}

/**
 * Generates a compact key for the knight retreat table lookup
 * 
 * @param startX Original position X coordinate (0-7)
 * @param startY Original position Y coordinate (0-7)
 * @param attackX Attack position X coordinate (0-7)
 * @param attackY Attack position Y coordinate (0-7)
 * @returns Compact numeric key for table lookup
 */
export function generateRetreatKey(
  startX: number, startY: number, 
  attackX: number, attackY: number
): number {
  return (startX << 9) | (startY << 6) | (attackX << 3) | attackY;
}

/**
 * Unpacks a retreat option from its bit-packed representation
 * 
 * @param packed Bit-packed retreat option (9 bits)
 * @returns Unpacked retreat option with x, y coordinates and cost
 */
export function unpackRetreatOption(packed: number): RetreatOption {
  return {
    x: (packed >> 6) & 0x7,
    y: (packed >> 3) & 0x7,
    cost: packed & 0x7
  };
}

/**
 * Gets all valid knight retreat options for a given original position and attack position
 * 
 * @param startX Original position X coordinate (0-7)
 * @param startY Original position Y coordinate (0-7)
 * @param attackX Attack position X coordinate (0-7)
 * @param attackY Attack position Y coordinate (0-7)
 * @returns Array of valid retreat options with positions and costs
 */
export function getKnightRetreats(
  startX: number, startY: number,
  attackX: number, attackY: number
): RetreatOption[] {
  // Get the lookup table
  const table = decompressKnightRetreatTable();
  
  // Generate the key for lookup
  const key = generateRetreatKey(startX, startY, attackX, attackY).toString();
  
  // Get the packed retreat options
  const packedOptions = table[key] || [];
  
  // Unpack each option
  return packedOptions.map(unpackRetreatOption);
}

/**
 * Gets all valid knight retreat options from string positions
 * This wrapper simplifies the API by handling coordinate conversion
 * 
 * @param startPosition Original knight position (e.g., "e4")
 * @param attackPosition Attack position (e.g., "f6")
 * @returns Array of valid retreat options with positions and costs, converted to board positions
 */
export function getKnightRetreatsFromPositions(
  startPosition: string,
  attackPosition: string
): Array<{ to: string, cost: number }> {
  // Convert string positions to coordinates
  const [startX, startY] = positionToCoordinates(startPosition);
  const [attackX, attackY] = positionToCoordinates(attackPosition);
  
  // Get retreats using coordinates
  const retreats = getKnightRetreats(startX, startY, attackX, attackY);
  
  // Convert coordinates back to string positions
  return retreats.map(option => ({
    to: coordinatesToPosition(option.x, option.y),
    cost: option.cost
  }));
}

/**
 * Utility function to convert position string to coordinates
 * @param position Position string (e.g., "e4")
 * @returns [x, y] coordinates (0-indexed)
 */
function positionToCoordinates(position: string): [number, number] {
  const file = position.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = parseInt(position.charAt(1), 10) - 1;
  return [file, rank];
}

/**
 * Utility function to convert coordinates to position string
 * @param x X coordinate (0-7)
 * @param y Y coordinate (0-7)
 * @returns Position string (e.g., "e4")
 */
function coordinatesToPosition(x: number, y: number): string {
  const file = String.fromCharCode('a'.charCodeAt(0) + x);
  const rank = y + 1;
  return `${file}${rank}`;
} 