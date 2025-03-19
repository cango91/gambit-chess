export * from './MovementRules';
export * from './DuelRules';
export * from './TacticalRetreatRules';

/**
 * Export documentation for all rule modules
 */

// MovementRules documentation
const movementRulesDoc = {
  name: "MovementRules",
  purpose: "Basic chess piece movement validation shared between client and server",
  publicAPI: {
    isValidBasicMove: "Validates if a move follows basic chess movement patterns",
    isValidPawnMove: "Validates pawn movement including first move and captures",
    isValidKnightMove: "Validates knight L-shaped movement",
    isValidBishopMove: "Validates bishop diagonal movement",
    isValidRookMove: "Validates rook orthogonal movement",
    isValidQueenMove: "Validates queen movement (combination of bishop and rook)",
    isValidKingMove: "Validates king movement including castling"
  },
  dependencies: [
    "types",
    "utils"
  ],
  implementationStatus: "Complete"
};

// DuelRules documentation
const duelRulesDoc = {
  name: "DuelRules",
  purpose: "Validation rules for the Battle Points duel system",
  publicAPI: {
    getBPCapacity: "Returns the maximum BP capacity for a piece type",
    calculateBPCost: "Calculates the actual BP cost for allocation (doubles if exceeding capacity)",
    isValidAllocation: "Checks if a BP allocation is valid based on piece type and available BP",
    canPerformTacticalRetreat: "Determines if a piece type is eligible for tactical retreat (long-range pieces and knights)"
  },
  dependencies: [
    "types"
  ],
  implementationStatus: "Complete"
};

// TacticalRetreatRules documentation
const tacticalRetreatRulesDoc = {
  name: "TacticalRetreatRules",
  purpose: "Validates and calculates tactical retreat options and costs for pieces after failed captures",
  publicAPI: {
    calculateRetreatBPCost: "Calculates the BP cost for a retreat move based on piece type and distance",
    isOnRetreatVector: "Determines if a retreat position follows the appropriate retreat pattern for the piece",
    isBeyondFailedCapture: "Checks if a retreat position is beyond the failed capture target",
    isValidRetreatMove: "Validates if a retreat move is legal based on piece movement and retreat rules",
    getValidRetreats: "Returns all valid retreat options with their associated BP costs"
  },
  dependencies: [
    "types",
    "utils",
    "MovementRules"
  ],
  notes: "Includes special handling for knight retreats using pre-computed lookup tables for optimal performance",
  implementationStatus: "Complete"
};

// Export module documentation for reference by other modules
export const __documentation = {
  name: "GameRules",
  purpose: "Provides all game rules and validation logic that can be shared between client and server",
  modules: {
    MovementRules: movementRulesDoc,
    DuelRules: duelRulesDoc,
    TacticalRetreatRules: tacticalRetreatRulesDoc
  },
  dependencies: [
    "types",
    "utils"
  ],
  changes: [
    "Added tactical retreat capabilities for knights using pre-computed lookup tables"
  ],
  implementationStatus: "Complete"
}; 