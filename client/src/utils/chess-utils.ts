import { Chess } from 'chess.js';
/**
 * Possibly due to Vite's rollup static analysis,
 * Some named const exports are not being recognized by Vite.
 * The workaround is to use namespace destructuring for the imports that don't work.
 * Bizarrely, regular named imports don't work with namespace destructuring.
 */
import { BaseGameState } from '@gambit-chess/shared';
import * as shared from '@gambit-chess/shared';
const { DEFAULT_GAME_CONFIG } = shared;
// Type for the server's response format
export interface GameStateResponse {
  id: string;
  status: string;
  currentTurn: 'w' | 'b';
  board: string; // FEN string
  moveHistory: any[];
  whitePlayer: {
    id: string;
    battlePoints: number;
    isAnonymous: boolean;
  };
  blackPlayer: {
    id: string;
    battlePoints: number;
    isAnonymous: boolean;
  };
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
}

/**
 * Converts a server GameStateResponse to a client BaseGameState
 * This handles the format conversion between server and client representations
 */
export function convertGameStateResponse(response: GameStateResponse): BaseGameState {
  const chess = new Chess(response.board);
  
  const gameState: BaseGameState = {
    id: response.id,
    gameStatus: response.status as any, // Convert string to GameStatus enum
    currentTurn: response.currentTurn,
    chess: chess,
    moveHistory: response.moveHistory || [],
    whitePlayer: {
      id: response.whitePlayer.id,
      color: 'w',
      battlePoints: response.whitePlayer.battlePoints,
    },
    blackPlayer: {
      id: response.blackPlayer.id,
      color: 'b',
      battlePoints: response.blackPlayer.battlePoints,
    },
    config: DEFAULT_GAME_CONFIG, // Use the default config from shared
    pendingDuel: null,
    halfmoveClockManual: 0,
    positionHistory: [{ fen: response.board, turn: response.currentTurn }],
  };
  
  return gameState;
}

/**
 * Reconstructs a Chess instance from a potentially serialized chess object
 * This handles cases where the chess object has been JSON serialized and lost its methods
 */
export function reconstructChessInstance(gameState: BaseGameState): Chess {
  // If chess doesn't exist at all, create a new game
  if (!gameState.chess) {
    return new Chess();
  }
  
  // If chess is already a proper Chess instance with methods, return it
  if (typeof gameState.chess.fen === 'function') {
    return gameState.chess as Chess;
  }
  
  // If chess is serialized, reconstruct from the fen property
  const currentFen = (gameState.chess as any).fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  return new Chess(currentFen);
}

/**
 * Ensures a game state has a properly reconstructed chess instance
 * This mutates the game state to replace the chess object with a proper Chess instance
 */
export function ensureChessInstance(gameState: BaseGameState): BaseGameState {
  // If chess doesn't exist at all, create a new game
  if (!gameState.chess) {
    console.log('🔧 No chess object, creating new game');
    gameState.chess = new Chess();
    return gameState;
  }
  
  // If chess is a serialized object from the server (has fen property but no fen method),
  // reconstruct it from the serialized data
  if (typeof gameState.chess.fen !== 'function') {
    console.log('🔧 Reconstructing chess instance from serialized data');
    const chessData = gameState.chess as any;
    console.log('🔍 DEBUG: Serialized chess data:', JSON.stringify(chessData, null, 2));
    
    // If we have a FEN string, use it
    if (chessData.fen && typeof chessData.fen === 'string') {
      console.log('🔧 Using FEN from serialized data:', chessData.fen);
      gameState.chess = new Chess(chessData.fen);
    } else {
      // Fallback to starting position
      console.log('🔧 No valid FEN found, falling back to starting position');
      console.log('🔍 chessData.fen:', chessData.fen, 'type:', typeof chessData.fen);
      gameState.chess = new Chess();
    }
  } else {
    console.log('🔧 Chess object already has working fen() method');
  }
  
  return gameState;
}

/**
 * Extracts standard FEN from potentially extended Gambit Chess notation
 * Extended notation might include BP allocations like: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 {A:5/D:7}"
 */
export function extractStandardFen(extendedFen: string): string {
  // Split on space and take only the first 6 parts (standard FEN)
  const parts = extendedFen.trim().split(' ');
  if (parts.length >= 6) {
    return parts.slice(0, 6).join(' ');
  }
  return extendedFen;
}

/**
 * Extracts Gambit Chess extended notation from a move or FEN string
 * This could include BP allocations, retreat costs, etc.
 */
export function extractExtendedNotation(notation: string): {
  standardPart: string;
  bpAllocation?: string;
  retreatCost?: string;
  tacticalAdvantage?: string;
} {
  const result: ReturnType<typeof extractExtendedNotation> = {
    standardPart: notation,
  };
  
  // Extract BP allocation: [A:5/D:7]
  const bpMatch = notation.match(/\[([A-Z]:[\d]+(?:\/[A-Z]:[\d]+)*)\]/);
  if (bpMatch) {
    result.bpAllocation = bpMatch[1];
    result.standardPart = result.standardPart.replace(bpMatch[0], '').trim();
  }
  
  // Extract retreat cost: →c3(2)
  const retreatMatch = notation.match(/→([a-h][1-8])\((\d+)\)/);
  if (retreatMatch) {
    result.retreatCost = `${retreatMatch[1]} (-${retreatMatch[2]} BP)`;
    result.standardPart = result.standardPart.replace(retreatMatch[0], '').trim();
  }
  
  // Extract tactical advantage: {+3}
  const tacMatch = notation.match(/\{(\+\d+)\}/);
  if (tacMatch) {
    result.tacticalAdvantage = tacMatch[1];
    result.standardPart = result.standardPart.replace(tacMatch[0], '').trim();
  }
  
  return result;
} 