/**
 * Utilities index file
 * Exports all utility functions for the shared module
 */

/**
 * Public API exports from pieceUtils
 * These functions are available for both client and server use
 */
export {
  isLongRangePiece,
  getBPCapacity,
  isValidPosition,
  getOpponentColor,
  positionToAlgebraic,
  algebraicToPosition,
  isDarkSquare
} from './pieceUtils';

/**
 * Public API exports from notationUtils
 * These functions are available for both client and server use
 */
export {
  PieceWithBP,
  positionToNotation,
  notationToPosition,
  createMoveNotation,
  createDuelNotation,
  createTacticalRetreatNotation,
  createGameHistory,
  addMoveToHistory,
  generateSAN,
  getPieceSymbol
} from './notationUtils';

/**
 * Public API exports from knightRetreatUtils
 * These functions are available for both client and server use
 */
export * from './knightRetreatUtils';

/**
 * Module documentation
 */
export const __documentation = {
  name: "Utils",
  purpose: "Provides utility functions for various chess operations",
  modules: {
    pieceUtils: {
      purpose: "Basic piece-related utility functions",
      publicAPI: {
        isLongRangePiece: "Check if a piece is long-range (bishop, rook, queen)",
        getBPCapacity: "Get the battle points capacity for a piece type",
        isValidPosition: "Check if a position is within the board boundaries",
        getOpponentColor: "Get the opponent's color",
        positionToAlgebraic: "Convert a position to algebraic notation",
        algebraicToPosition: "Convert algebraic notation to a position",
        isDarkSquare: "Check if a position is a dark square"
      }
    },
    notationUtils: {
      purpose: "Utilities for chess notation and game history",
      publicAPI: {
        positionToNotation: "Convert a position to notation format",
        notationToPosition: "Convert notation to a position",
        createMoveNotation: "Create a move notation object",
        createDuelNotation: "Create a duel notation object",
        createTacticalRetreatNotation: "Create a tactical retreat notation object",
        createGameHistory: "Create a new game history object",
        addMoveToHistory: "Add a move to the game history",
        generateSAN: "Generate standard algebraic notation for a move",
        getPieceSymbol: "Get the symbol for a piece type"
      }
    },
    knightRetreatUtils: {
      purpose: "Utilities for knight retreat calculations",
      publicAPI: {
        initializeKnightRetreatTable: "Initialize the knight retreat lookup table",
        getKnightRetreatOptions: "Get valid retreat options for a knight",
        getKnightRetreatCost: "Calculate the BP cost for a knight retreat"
      }
    }
  },
  implementationStatus: "Complete"
}; 