import { Chess, PieceSymbol, Square } from 'chess.js';
import { GameConfig } from '../types/config';
import { getKnightRetreatOptions } from './knight-retreat-utils';

/**
 * Calculate all valid tactical retreat options after a failed capture
 */
export function calculateTacticalRetreats(
  chess: Chess,
  originalSquare: Square,
  failedCaptureSquare: Square,
  config: GameConfig
): { square: Square; cost: number }[] {
  // Get the piece that attempted the capture
  const piece = chess.get(originalSquare);
  if (!piece) return [];
  
  // Return the base case: return to original position with 0 cost
  const retreats: { square: Square; cost: number }[] = [
    { square: originalSquare, cost: 0 }
  ];
  
  // Check if tactical retreats are enabled
  if (!config.tacticalRetreatRules.enabled) {
    return retreats;
  }
  
  // Handle different piece types
  switch (piece.type) {
    case 'b':
    case 'r':
    case 'q':
      if (config.tacticalRetreatRules.longRangePiecesEnabled) {
        return [...retreats, ...calculateLongPieceRetreats(
          chess,
          piece.type,
          originalSquare,
          failedCaptureSquare,
          config
        )];
      }
      break;
    
    case 'n':
      if (config.tacticalRetreatRules.knightsEnabled) {
        return [...retreats, ...calculateKnightRetreats(
          chess,
          originalSquare,
          failedCaptureSquare,
          config
        )];
      }
      break;
  }
  
  return retreats;
}

/**
 * Calculate valid retreat squares for long range pieces (bishop, rook, queen)
 */
function calculateLongPieceRetreats(
  chess: Chess,
  pieceType: PieceSymbol,
  originalSquare: Square,
  failedCaptureSquare: Square,
  config: GameConfig
): { square: Square; cost: number }[] {
  const retreats: { square: Square; cost: number }[] = [];
  
  // Determine the direction of the attack
  const origFile = originalSquare.charCodeAt(0) - 'a'.charCodeAt(0);
  const origRank = parseInt(originalSquare.charAt(1)) - 1;
  const targFile = failedCaptureSquare.charCodeAt(0) - 'a'.charCodeAt(0);
  const targRank = parseInt(failedCaptureSquare.charAt(1)) - 1;
  
  const fileDir = origFile === targFile ? 0 : (targFile - origFile) / Math.abs(targFile - origFile);
  const rankDir = origRank === targRank ? 0 : (targRank - origRank) / Math.abs(targRank - origRank);
  
  // Check if the piece can move in this direction
  const validDirection = (
    (pieceType === 'r' && (fileDir === 0 || rankDir === 0)) || // Rook: horizontal/vertical
    (pieceType === 'b' && fileDir !== 0 && rankDir !== 0) ||   // Bishop: diagonal
    (pieceType === 'q')                                         // Queen: any direction
  );
  
  if (!validDirection) {
    return retreats;
  }
  
  // Calculate retreat squares along the attack axis
  let currFile = origFile;
  let currRank = origRank;
  
  // Look in both directions from the original position along the attack axis
  // First in the direction of the attack
  while (true) {
    currFile += fileDir;
    currRank += rankDir;
    
    // Check if we're still on the board
    if (currFile < 0 || currFile > 7 || currRank < 0 || currRank > 7) {
      break;
    }
    
    const square = String.fromCharCode('a'.charCodeAt(0) + currFile) + (currRank + 1) as Square;
    
    // Stop if we reach the failed capture square
    if (square === failedCaptureSquare) {
      break;
    }
    
    // Check if the square is empty
    if (!chess.get(square)) {
      const distance = Math.max(
        Math.abs(currFile - origFile),
        Math.abs(currRank - origRank)
      );
      
      const cost = distance * config.tacticalRetreatRules.costCalculation.distanceMultiplier;
      retreats.push({ square, cost });
    } else {
      // Stop if we hit a piece
      break;
    }
  }
  
  // Reset to look in the opposite direction
  currFile = origFile;
  currRank = origRank;
  
  // Look in the opposite direction
  while (true) {
    currFile -= fileDir;
    currRank -= rankDir;
    
    // Check if we're still on the board
    if (currFile < 0 || currFile > 7 || currRank < 0 || currRank > 7) {
      break;
    }
    
    const square = String.fromCharCode('a'.charCodeAt(0) + currFile) + (currRank + 1) as Square;
    
    // Check if the square is empty
    if (!chess.get(square)) {
      const distance = Math.max(
        Math.abs(currFile - origFile),
        Math.abs(currRank - origRank)
      );
      
      const cost = distance * config.tacticalRetreatRules.costCalculation.distanceMultiplier;
      retreats.push({ square, cost });
    } else {
      // Stop if we hit a piece
      break;
    }
  }
  
  return retreats;
}

/**
 * Calculate valid retreat squares for knights
 */
function calculateKnightRetreats(
  chess: Chess,
  originalSquare: Square,
  failedCaptureSquare: Square,
  config: GameConfig
): { square: Square; cost: number }[] {
  const retreats: { square: Square; cost: number }[] = [];
  
  // Check if we should use the lookup table or manual calculation
  if (config.tacticalRetreatRules.costCalculation.useKnightLookupTable) {
    // Use the pre-calculated lookup table
    const lookupOptions = getKnightRetreatOptions(originalSquare, failedCaptureSquare);
    
    // Filter out occupied squares
    for (const option of lookupOptions) {
      if (!chess.get(option.square)) {
        retreats.push(option);
      }
    }
  } else {
    // Original rectangle-based calculation
    const origFile = originalSquare.charCodeAt(0) - 'a'.charCodeAt(0);
    const origRank = parseInt(originalSquare.charAt(1)) - 1;
    const targFile = failedCaptureSquare.charCodeAt(0) - 'a'.charCodeAt(0);
    const targRank = parseInt(failedCaptureSquare.charAt(1)) - 1;
    
    // Verify it's a valid knight move
    const fileDiff = Math.abs(targFile - origFile);
    const rankDiff = Math.abs(targRank - origRank);
    
    if (!((fileDiff === 1 && rankDiff === 2) || (fileDiff === 2 && rankDiff === 1))) {
      return retreats; // Not a valid knight move
    }
    
    // Determine the rectangle containing all potential retreat squares
    const minFile = Math.min(origFile, targFile);
    const maxFile = Math.max(origFile, targFile);
    const minRank = Math.min(origRank, targRank);
    const maxRank = Math.max(origRank, targRank);
    
    // Check all squares within the rectangle for valid retreat options
    for (let file = minFile; file <= maxFile; file++) {
      for (let rank = minRank; rank <= maxRank; rank++) {
        // Skip the original and target squares
        const square = String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1) as Square;
        if (square === originalSquare || square === failedCaptureSquare) {
          continue;
        }
        
        // Check if the square is empty
        if (!chess.get(square)) {
          // Calculate the cost based on how many knight moves it would take
          let cost: number;
          
          if (config.tacticalRetreatRules.costCalculation.knightCustomCostEnabled) {
            cost = calculateKnightMoveCost(origFile, origRank, file, rank);
          } else {
            // Simplified cost based on distance
            cost = Math.max(Math.abs(file - origFile), Math.abs(rank - origRank))
              * config.tacticalRetreatRules.costCalculation.distanceMultiplier;
          }
          
          retreats.push({ square, cost });
        }
      }
    }
  }
  
  // Always add the original square with 0 cost
  retreats.push({ square: originalSquare, cost: config.tacticalRetreatRules.costCalculation.baseReturnCost });
  
  return retreats;
}

/**
 * Calculate the minimum number of knight moves required to reach a target square
 */
function calculateKnightMoveCost(
  fromFile: number,
  fromRank: number,
  toFile: number,
  toRank: number
): number {
  // Special case for the same square
  if (fromFile === toFile && fromRank === toRank) {
    return 0;
  }
  
  // The mathematical solution to the Knight's Tour problem
  const dx = Math.abs(fromFile - toFile);
  const dy = Math.abs(fromRank - toRank);
  
  if (dx === 1 && dy === 0) return 3; // 3 moves for orthogonally adjacent
  if (dx === 0 && dy === 1) return 3;
  if (dx === 1 && dy === 1) return 2; // 2 moves for diagonally adjacent
  if (dx === 2 && dy === 2) return 4; // 4 moves for double diagonal
  
  // L-shaped move is a direct knight move
  if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) {
    return 1;
  }
  
  // General formula for knight distance
  // This is an approximation - exact solutions are complex
  if (dx <= dy) {
    return Math.ceil((dx + dy) / 3) + ((dx + dy) % 3 === 1 ? 1 : 0);
  } else {
    return Math.ceil((dx + dy) / 3) + ((dx + dy) % 3 === 1 ? 1 : 0);
  }
}