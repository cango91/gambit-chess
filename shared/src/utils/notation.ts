import { Move } from 'chess.js';
import { GambitMove, DuelResult, TacticalRetreat } from '../types/game';

/**
 * Extended chess notation for Gambit Chess
 * 
 * Extends Standard Algebraic Notation (SAN) with:
 * 1. Duel information: {a:5;d:3} - attacker allocated 5, defender allocated 3
 * 2. Tactical retreat: →e4{2} - retreated to e4 with a cost of 2 BP
 */

/**
 * Convert a GambitMove to extended notation string
 */
export function moveToExtendedNotation(move: GambitMove): string {
  let notation = move.san || `${move.from}-${move.to}`;
  
  // Add duel information if present
  if (move.duelResult) {
    notation += duelToNotation(move.duelResult);
  }
  
  // Add tactical retreat information if present
  if (move.tacticalRetreat) {
    notation += retreatToNotation(move.tacticalRetreat);
  }
  
  return notation;
}

/**
 * Convert duel result to notation string
 */
export function duelToNotation(duelResult: DuelResult): string {
  return `{a:${duelResult.attackerAllocation};d:${duelResult.defenderAllocation}}`;
}

/**
 * Convert tactical retreat to notation string
 */
export function retreatToNotation(retreat: TacticalRetreat): string {
  return `→${retreat.retreatSquare}{${retreat.battlePointsCost}}`;
}

/**
 * Parse extended notation string to extract move, duel, and retreat information
 */
export function parseExtendedNotation(notation: string): {
  baseMove: string;
  duel?: {
    attackerAllocation: number;
    defenderAllocation: number;
  };
  retreat?: {
    square: string;
    cost: number;
  };
} {
  // Regular expressions for matching parts of the notation
  const duelRegex = /\{a:(\d+);d:(\d+)\}/;
  const retreatRegex = /→([a-h][1-8])\{(\d+)\}/;
  
  // Extract duel information
  const duelMatch = notation.match(duelRegex);
  const duel = duelMatch ? {
    attackerAllocation: parseInt(duelMatch[1]),
    defenderAllocation: parseInt(duelMatch[2])
  } : undefined;
  
  // Extract retreat information
  const retreatMatch = notation.match(retreatRegex);
  const retreat = retreatMatch ? {
    square: retreatMatch[1],
    cost: parseInt(retreatMatch[2])
  } : undefined;
  
  // Remove duel and retreat notation to get the base move
  let baseMove = notation;
  if (duelMatch) {
    baseMove = baseMove.replace(duelMatch[0], '');
  }
  if (retreatMatch) {
    baseMove = baseMove.replace(retreatMatch[0], '');
  }
  
  return {
    baseMove: baseMove.trim(),
    duel,
    retreat
  };
}

/**
 * Generate a PGN-like string representation of the game history
 * Includes Gambit Chess specific extensions
 */
export function generateGambitPGN(
  moves: GambitMove[],
  hideAllocations: boolean = false
): string {
  let pgn = '';
  let moveNumber = 1;
  
  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    
    // Add move number before white's move
    if (move.color === 'w') {
      pgn += `${moveNumber}. `;
    }
    
    // Convert move to notation, possibly hiding allocation details
    let notation = move.san || `${move.from}-${move.to}`;
    
    // Add duel information if present
    if (move.duelResult) {
      if (hideAllocations) {
        // Hide the actual allocation amounts
        notation += `{duel:${move.duelResult.attackerWon ? 'capture' : 'failed'}}`;
      } else {
        notation += duelToNotation(move.duelResult);
      }
    }
    
    // Add tactical retreat information
    if (move.tacticalRetreat) {
      notation += retreatToNotation(move.tacticalRetreat);
    }
    
    pgn += notation + ' ';
    
    // Increment move number after black's move
    if (move.color === 'b') {
      moveNumber++;
    }
  }
  
  return pgn.trim();
}

/**
 * Convert a GambitMove to standard chess.js compatible Move
 * Strips Gambit Chess specific information
 */
export function gambitMoveToChessMove(move: GambitMove): Move {
    // Create a new object with only the standard chess.js Move properties
    const chessMove: Partial<Move> = {
      color: move.color,
      from: move.from,
      to: move.to,
      flags: move.flags,
      piece: move.piece,
      san: move.san,
      captured: move.captured,
      promotion: move.promotion
    };
    
    // Handle tactical retreat
    if (move.tacticalRetreat && !move.duelResult?.attackerWon) {
      // If the capture failed and there was a retreat, 
      // the actual destination is the retreat square
      chessMove.to = move.tacticalRetreat.retreatSquare;
      
      // Remove capture information since it didn't happen
      delete chessMove.captured;
    }
    
    return chessMove as Move;
  }

/**
 * Extend a standard chess.js Move with Gambit Chess specific information
 */
export function chessToGambitMove(
  move: Move, 
  duelResult?: DuelResult, 
  retreat?: TacticalRetreat
): GambitMove {
  return {
    ...move,
    captureAttempt: !!move.captured,
    duelResult,
    tacticalRetreat: retreat,
    isCapture: move.isCapture,
    isPromotion: move.isPromotion,
    isEnPassant: move.isEnPassant,
    isKingsideCastle: move.isKingsideCastle,
    isQueensideCastle: move.isQueensideCastle,
    isBigPawn: move.isBigPawn
  };
}