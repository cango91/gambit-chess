import { PieceSymbol } from 'chess.js';
import { SpecialAttackType } from './tactics';

// Game configuration
export interface GameConfig {
  initialBattlePoints: number;
  maxPieceBattlePoints: number;
  pieceValues: Record<PieceSymbol, number>;
  pieceBPCapacities: Record<PieceSymbol, number>;
  regenerationRules: BPRegenerationRules;
  tacticalRetreatRules: TacticalRetreatRules;
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