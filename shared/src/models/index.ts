/**
 * Models index file
 * Exports all models for the shared module
 */

// Import files first to resolve any circular dependencies
import './AbstractPiece';
import './BoardImpl';
import './PieceFactory';

// Then export from them
export * from './AbstractPiece';
export * from './BoardImpl';
export * from './PieceFactory';

/**
 * Module documentation
 */
export const __documentation = {
  name: "Models",
  purpose: "Provides model implementations for chess pieces and boards",
  modules: {
    AbstractPiece: {
      purpose: "Base class for all chess piece implementations",
      publicAPI: {
        battlePoints: "Get or set battle points for the piece",
        getBPCapacity: "Get the maximum BP capacity based on piece type",
        allocateBattlePoints: "Allocate battle points to this piece",
        resetBattlePoints: "Reset battle points to zero",
        moveTo: "Move piece to a new position",
        isLongRangePiece: "Check if this is a long-range piece",
        clone: "Create a deep copy of this piece",
        toDTO: "Convert to a data transfer object"
      }
    },
    BoardImpl: {
      purpose: "Implementation of the Board interface for validation",
      publicAPI: {
        getPieces: "Get all pieces on the board",
        getPieceAt: "Get piece at a specific position",
        isOccupied: "Check if a position is occupied",
        isOccupiedByColor: "Check if a position is occupied by a piece of a specific color",
        isPathClear: "Check if a path between two positions is clear",
        getKingPosition: "Get the position of a king",
        snapshot: "Create a read-only snapshot of the board"
      }
    },
    PieceFactory: {
      purpose: "Factory for creating piece instances",
      publicAPI: {
        createPiece: "Create a piece from a DTO",
        createNewPiece: "Create a new piece with a generated ID"
      }
    }
  },
  implementationStatus: "Complete"
}; 