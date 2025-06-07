import { PieceSymbol } from 'chess.js';
import { SpecialAttackType } from './tactics';

// Duel resolution rules
export interface DuelResolutionRules {
  defenderWinsTies: boolean; // true = defender wins ties, false = attacker wins ties
  rulesetType: 'current' | 'risky' | 'custom'; // Predefined ruleset types
}

// Piece loss and retreat rules
export interface PieceLossRules {
  attackerCanLosePiece: boolean; // false = current (always can retreat), true = can lose piece
  retreatPaymentRules: {
    enabled: boolean; // Whether retreats cost BP
    originalSquareRetreatCost: number; // Cost to retreat to original square (0 in current rules)
    costToDefenderEnabled: boolean; // Whether part of retreat cost goes to defender
    costToDefenderPercentage: number; // What percentage of retreat cost goes to defender (0-100)
  };
}

// Game configuration
export interface GameConfig {
  initialBattlePoints: number;
  maxPieceBattlePoints: number;
  pieceValues: Record<PieceSymbol, number>;
  pieceBPCapacities: Record<PieceSymbol, number>;
  regenerationRules: BPRegenerationRules;
  tacticalRetreatRules: TacticalRetreatRules;
  duelResolutionRules: DuelResolutionRules;
  pieceLossRules: PieceLossRules;
  informationHiding: {
    hideBattlePoints: boolean;
    hideAllocationHistory: boolean;
  };
}

// BP regeneration rules
export interface BPRegenerationRules {
  baseTurnRegeneration: number;
  specialAttackRegeneration: Record<SpecialAttackType, SpecialAttackRegenRule>;
  turnRegenCap?: number;
}

// Special attack regeneration rule
export interface SpecialAttackRegenRule {
  enabled: boolean;
  formula: string; // A string representation of the formula to calculate regeneration
  description: string;
}

// Tactical retreat rules
export interface TacticalRetreatRules {
  enabled: boolean;
  longRangePiecesEnabled: boolean;
  knightsEnabled: boolean;
  costCalculation: {
    baseReturnCost: number; // Cost to return to original position (usually 0)
    distanceMultiplier: number; // How much BP per square moved for long range pieces
    knightCustomCostEnabled: boolean; // Whether to use custom knight costs
    useKnightLookupTable: boolean; // Whether to use the pre-calculated knight cost lookup table
  };
}

// Default configuration template
export type ConfigurationTemplate = 'standard' | 'beginner' | 'advanced' | 'custom';