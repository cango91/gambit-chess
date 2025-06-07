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
  
  // Return the base case: return to original position using config cost
  const originalSquareCost = config.pieceLossRules.retreatPaymentRules.enabled 
    ? config.pieceLossRules.retreatPaymentRules.originalSquareRetreatCost
    : 0;
    
  const retreats: { square: Square; cost: number }[] = [
    { square: originalSquare, cost: originalSquareCost }
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
      
    case 'p':
      // Pawns can only retreat to their original square
      return [...retreats];

    default:
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
      
      const baseCost = config.pieceLossRules.retreatPaymentRules.enabled 
        ? config.pieceLossRules.retreatPaymentRules.originalSquareRetreatCost
        : config.tacticalRetreatRules.costCalculation.baseReturnCost;
      const cost = baseCost + (distance * config.tacticalRetreatRules.costCalculation.distanceMultiplier);
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
      
      const baseCost = config.pieceLossRules.retreatPaymentRules.enabled 
        ? config.pieceLossRules.retreatPaymentRules.originalSquareRetreatCost
        : config.tacticalRetreatRules.costCalculation.baseReturnCost;
      const cost = baseCost + (distance * config.tacticalRetreatRules.costCalculation.distanceMultiplier);
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
  console.log('🏃 calculateKnightRetreats', originalSquare, failedCaptureSquare);
  
  // Check if we should use the lookup table or manual calculation
  if (config.tacticalRetreatRules.costCalculation.useKnightLookupTable) {
    // Use the pre-calculated lookup table
    const lookupOptions = getKnightRetreatOptions(originalSquare, failedCaptureSquare);
    console.log('🏃 lookupOptions', lookupOptions);
    
    // Filter out occupied squares
    for (const option of lookupOptions) {
      if (!chess.get(option.square)) {
        retreats.push(option);
      }
    }
  } 
  return retreats;
}