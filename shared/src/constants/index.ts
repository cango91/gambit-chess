export * from './initialBoardSetup';
export * from './knightRetreatData';

/**
 * Knight retreat lookup table
 * 
 * The knight retreat data is exported from knightRetreatData.ts,
 * which contains compressed data generated during the build process.
 * 
 * The data is a base64-encoded gzipped JSON string that needs to be:
 * 1. Decoded from base64
 * 2. Decompressed (gunzip)
 * 3. Parsed as JSON
 * 
 * The resulting table is a map from numeric keys to arrays of bit-packed integers:
 * - Keys are 12-bit integers encoding startX, startY, attackX, attackY (3 bits each)
 * - Values are arrays of 8-bit integers where:
 *   - Bits 0-2: x-coordinate (0-7)
 *   - Bits 3-5: y-coordinate (0-7)
 *   - Bits 6-7: cost (0-3)
 * 
 * See knightRetreatUtils.ts for functions to work with this data.
 */ 