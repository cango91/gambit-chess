/**
 * Validation index file
 * Exports all validation utilities for the shared module
 */

export * from './CheckDetection';
export * from './MoveValidator';

/**
 * Module documentation
 */
export const __documentation = {
  name: "Validation",
  purpose: "Provides utilities for validating chess moves and detecting check situations",
  modules: {
    CheckDetection: {
      purpose: "Utilities for detecting check situations",
      publicAPI: {
        isInCheck: "Check if a player is in check",
        isPositionUnderAttack: "Check if a position is under attack by any opponent pieces",
        wouldMoveResultInCheck: "Check if a move would result in the moving player being in check"
      }
    },
    MoveValidator: {
      purpose: "Comprehensive move validation with board context",
      publicAPI: {
        validateMove: "Validate a chess move in the context of a board state"
      }
    }
  },
  implementationStatus: "Complete"
}; 