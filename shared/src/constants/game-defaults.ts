import { GameConfig } from '../types/config';
import { STANDARD_PIECE_VALUES, TOTAL_STARTING_PIECES_VALUE } from './piece-values';
import { SpecialAttackType } from '../types/tactics';

// Default game configuration
export const DEFAULT_GAME_CONFIG: GameConfig = {
  initialBattlePoints: TOTAL_STARTING_PIECES_VALUE,
  maxPieceBattlePoints: 10,
  pieceValues: STANDARD_PIECE_VALUES,
  pieceBPCapacities: STANDARD_PIECE_VALUES,
  regenerationRules: {
    baseTurnRegeneration: 1,
    specialAttackRegeneration: {
      [SpecialAttackType.PIN]: {
        enabled: true,
        formula: 'pinnedPieceValue + (isPinnedToKing ? 1 : 0)',
        description: 'Regenerate the pinned piece\'s value plus 1 if pinned to king'
      },
      [SpecialAttackType.SKEWER]: {
        enabled: true,
        formula: 'Math.max(1, Math.abs(frontPieceValue - backPieceValue))',
        description: 'Regenerate the difference of skewered pieces\' values (minimum 1)'
      },
      [SpecialAttackType.FORK]: {
        enabled: true,
        formula: 'Math.min(...forkedPiecesValues)',
        description: 'Regenerate the lower of the forked pieces\' values'
      },
      [SpecialAttackType.DISCOVERED_ATTACK]: {
        enabled: true,
        formula: 'Math.ceil(attackedPieceValue / 2)',
        description: 'Regenerate half of the attacked piece\'s value (rounded up)'
      },
      [SpecialAttackType.CHECK]: {
        enabled: true,
        formula: '2',
        description: 'Regenerate 2 BP for putting the opponent\'s king in check'
      }
    }
  },
  tacticalRetreatRules: {
    enabled: true,
    longRangePiecesEnabled: true,
    knightsEnabled: true,
    costCalculation: {
      baseReturnCost: 0,
      distanceMultiplier: 1,
      knightCustomCostEnabled: true,
      useKnightLookupTable: true
    }
  },
  duelResolutionRules: {
    defenderWinsTies: true, // Current implementation: defender wins ties
    rulesetType: 'current'
  },
  pieceLossRules: {
    attackerCanLosePiece: false, // Current implementation: attacker never loses piece
    retreatPaymentRules: {
      enabled: true, // Retreats can cost BP (but original square is free)
      originalSquareRetreatCost: 0, // Current implementation: free retreat to original
      costToDefenderEnabled: false, // Current implementation: no payment to defender
      costToDefenderPercentage: 0
    }
  },
  informationHiding: {
    hideBattlePoints: false,
    hideAllocationHistory: false
  }
};

// Beginner-friendly configuration with simplified BP regeneration
export const BEGINNER_GAME_CONFIG: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  initialBattlePoints: Math.round(TOTAL_STARTING_PIECES_VALUE * 1.5), // More starting BP
  regenerationRules: {
    baseTurnRegeneration: 2, // More regeneration per turn
    specialAttackRegeneration: {
      [SpecialAttackType.PIN]: {
        enabled: false,
        formula: '0',
        description: 'No regeneration for pins in beginner mode'
      },
      [SpecialAttackType.SKEWER]: {
        enabled: false,
        formula: '0',
        description: 'No regeneration for skewers in beginner mode'
      },
      [SpecialAttackType.FORK]: {
        enabled: false,
        formula: '0',
        description: 'No regeneration for forks in beginner mode'
      },
      [SpecialAttackType.DISCOVERED_ATTACK]: {
        enabled: false,
        formula: '0',
        description: 'No regeneration for discovered attacks in beginner mode'
      },
      [SpecialAttackType.CHECK]: {
        enabled: true,
        formula: '3',
        description: 'Regenerate 3 BP for putting the opponent\'s king in check (increased)'
      }
    }
  },
  tacticalRetreatRules: {
    enabled: true,
    longRangePiecesEnabled: true,
    knightsEnabled: true,
    costCalculation: {
      baseReturnCost: 0,
      distanceMultiplier: 0.5, // Half cost for retreats
      knightCustomCostEnabled: false, // Simplified knight costs
      useKnightLookupTable: true
    }
  },
  duelResolutionRules: {
    defenderWinsTies: true, // Keep beginner-friendly defender advantage
    rulesetType: 'current'
  },
  pieceLossRules: {
    attackerCanLosePiece: false, // Beginner-friendly: no piece loss
    retreatPaymentRules: {
      enabled: true,
      originalSquareRetreatCost: 0, // Free retreats for beginners
      costToDefenderEnabled: false,
      costToDefenderPercentage: 0
    }
  },
  informationHiding: {
    hideBattlePoints: false, // Show BP in beginner mode to help learning
    hideAllocationHistory: false
  }
};

// Advanced configuration with more complex BP regeneration
export const ADVANCED_GAME_CONFIG: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  initialBattlePoints: Math.round(TOTAL_STARTING_PIECES_VALUE * 0.8), // Less starting BP for more strategic play
  maxPieceBattlePoints: 15, // Higher max BP capacity
  regenerationRules: {
    baseTurnRegeneration: 0, // No automatic regeneration
    specialAttackRegeneration: {
      [SpecialAttackType.PIN]: {
        enabled: true,
        formula: 'pinnedPieceValue * 1.5 + (isPinnedToKing ? 2 : 0)',
        description: 'Regenerate 150% of the pinned piece\'s value plus 2 if pinned to king'
      },
      [SpecialAttackType.SKEWER]: {
        enabled: true,
        formula: 'Math.max(2, Math.abs(frontPieceValue - backPieceValue) * 1.5)',
        description: 'Regenerate 150% of the difference of skewered pieces\' values (minimum 2)'
      },
      [SpecialAttackType.FORK]: {
        enabled: true,
        formula: 'forkedPiecesValues.reduce((sum, value) => sum + value, 0) / 2',
        description: 'Regenerate 50% of the sum of all forked pieces\' values'
      },
      [SpecialAttackType.DISCOVERED_ATTACK]: {
        enabled: true,
        formula: 'attackedPieceValue',
        description: 'Regenerate the full value of the attacked piece'
      },
      [SpecialAttackType.CHECK]: {
        enabled: true,
        formula: '3',
        description: 'Regenerate 3 BP for putting the opponent\'s king in check'
      }
    }
  },
  tacticalRetreatRules: {
    enabled: true,
    longRangePiecesEnabled: true,
    knightsEnabled: true,
    costCalculation: {
      baseReturnCost: 0,
      distanceMultiplier: 1.5, // Higher cost for retreats
      knightCustomCostEnabled: true,
      useKnightLookupTable: true
    }
  },
  duelResolutionRules: {
    defenderWinsTies: false, // Advanced: attacker wins ties for more aggressive play
    rulesetType: 'custom'
  },
  pieceLossRules: {
    attackerCanLosePiece: false, // Keep current rules for now
    retreatPaymentRules: {
      enabled: true,
      originalSquareRetreatCost: 1, // Small cost even for original square retreat
      costToDefenderEnabled: false,
      costToDefenderPercentage: 0
    }
  },
  informationHiding: {
    hideBattlePoints: true, // Hide BP in advanced mode for more strategic play
    hideAllocationHistory: false
  }
};

// NEW: Risky Ruleset - Attackers can lose pieces, must pay for retreats
export const RISKY_GAME_CONFIG: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  initialBattlePoints: Math.round(TOTAL_STARTING_PIECES_VALUE * 1.2), // Slightly more BP for riskier gameplay
  duelResolutionRules: {
    defenderWinsTies: true, // Keep defender advantage to balance the risk
    rulesetType: 'risky'
  },
  pieceLossRules: {
    attackerCanLosePiece: true, // NEW: Attackers can lose pieces in failed captures
    retreatPaymentRules: {
      enabled: true,
      originalSquareRetreatCost: 3, // Cost to retreat even to original square
      costToDefenderEnabled: true, // NEW: Part of retreat cost goes to defender
      costToDefenderPercentage: 50 // 50% of retreat cost goes to defending player
    }
  },
  tacticalRetreatRules: {
    enabled: true,
    longRangePiecesEnabled: true,
    knightsEnabled: true,
    costCalculation: {
      baseReturnCost: 3, // Higher base cost for risky rules
      distanceMultiplier: 2, // Much higher cost for distant retreats
      knightCustomCostEnabled: true,
      useKnightLookupTable: true
    }
  },
  informationHiding: {
    hideBattlePoints: false, // Show BP so players can make informed risk decisions
    hideAllocationHistory: false
  }
};

// NEW: Experimental Tie-Breaking Ruleset
export const ATTACKER_WINS_TIES_CONFIG: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  duelResolutionRules: {
    defenderWinsTies: false, // NEW: Attacker wins ties
    rulesetType: 'custom'
  },
  // Keep all other rules the same for A/B testing
};

// Configuration templates mapping
export const GAME_CONFIG_TEMPLATES = {
  standard: DEFAULT_GAME_CONFIG,
  beginner: BEGINNER_GAME_CONFIG,
  advanced: ADVANCED_GAME_CONFIG,
  risky: RISKY_GAME_CONFIG, // NEW
  attackerWinsTies: ATTACKER_WINS_TIES_CONFIG, // NEW
};