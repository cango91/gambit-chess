import { PieceSymbol } from 'chess.js';
import { DuelContext, DuelOutcome } from '../types/duel';
import { GameConfig } from '../types/config';

/**
 * Resolve a duel between two pieces based on BP allocations
 */
export function resolveDuel(
  context: DuelContext,
  attackerAllocation: number,
  defenderAllocation: number,
  config: GameConfig
): DuelOutcome {
  // Validate allocations don't exceed available BP
  const validatedAttackerAllocation = Math.min(
    attackerAllocation,
    context.attackingPiece.playerBattlePoints
  );
  
  const validatedDefenderAllocation = Math.min(
    defenderAllocation,
    context.defendingPiece.playerBattlePoints
  );

  // Calculate effective allocations based on piece capacity
  const attackerEffectiveAllocation = calculateEffectiveAllocation(
    context.attackingPiece.type,
    validatedAttackerAllocation,
    config
  );
  
  const defenderEffectiveAllocation = calculateEffectiveAllocation(
    context.defendingPiece.type,
    validatedDefenderAllocation,
    config
  );

  // Determine the winner
  const attackerWon = attackerEffectiveAllocation > defenderEffectiveAllocation;

  // Calculate remaining BP after duel
  const attackerRemainingBP = context.attackingPiece.playerBattlePoints - validatedAttackerAllocation;
  const defenderRemainingBP = context.defendingPiece.playerBattlePoints - validatedDefenderAllocation;

  return {
    attackerAllocation: validatedAttackerAllocation,
    defenderAllocation: validatedDefenderAllocation,
    attackerWon,
    attackerRemainingBP,
    defenderRemainingBP
  };
}

/**
 * Calculate the effective allocation considering piece capacity
 * If allocation exceeds capacity, the overage costs double
 */
export function calculateEffectiveAllocation(
  pieceType: PieceSymbol,
  allocation: number,
  config: GameConfig
): number {
  const pieceCapacity = config.pieceValues[pieceType];
  const maxPieceBP = config.maxPieceBattlePoints;
  
  // Calculate effective allocation
  if (allocation <= pieceCapacity) {
    // Within capacity, 1:1 effectiveness
    return allocation;
  } else if (allocation <= maxPieceBP) {
    // Above capacity but below max, overage costs double
    const baseAmount = pieceCapacity;
    const overage = allocation - pieceCapacity;
    return baseAmount + (overage / 2);
  } else {
    // Above max, capped at max effective BP
    const baseAmount = pieceCapacity;
    const overage = maxPieceBP - pieceCapacity;
    return baseAmount + (overage / 2);
  }
}

/**
 * Calculate the maximum effective BP that can be allocated to a piece
 */
export function getMaxEffectiveAllocation(
  pieceType: PieceSymbol,
  config: GameConfig
): number {
  const pieceCapacity = config.pieceValues[pieceType];
  const maxPieceBP = config.maxPieceBattlePoints;
  
  // Calculate maximum effective BP
  const baseAmount = pieceCapacity;
  const overage = maxPieceBP - pieceCapacity;
  return baseAmount + (overage / 2);
}

/**
 * Calculate the total BP needed to guarantee a win against a piece
 */
export function getBPToGuaranteeWin(
  defendingPieceType: PieceSymbol,
  config: GameConfig
): number {
  const maxDefenderEffective = getMaxEffectiveAllocation(defendingPieceType, config);
  
  // To guarantee a win, need slightly more than max effective defender can have
  return Math.ceil(maxDefenderEffective * 2);
}

/**
 * Suggest a reasonable BP allocation based on piece values and context
 * This can be used for AI opponents or player suggestions
 */
export function suggestAllocation(
  context: DuelContext,
  isAttacker: boolean,
  config: GameConfig
): number {
  const ownPiece = isAttacker ? context.attackingPiece : context.defendingPiece;
  const opponentPiece = isAttacker ? context.defendingPiece : context.attackingPiece;
  
  const ownPieceValue = config.pieceValues[ownPiece.type];
  const opponentPieceValue = config.pieceValues[opponentPiece.type];
  
  // Basic strategy: allocate based on relative piece values
  if (isAttacker) {
    // Attacker strategy: invest more if attacking higher value piece
    const valueRatio = opponentPieceValue / ownPieceValue;
    const baseAllocation = Math.min(
      ownPiece.playerBattlePoints * 0.4, // Don't use more than 40% of BP
      opponentPieceValue * 1.5 // 1.5x the value of the piece being attacked
    );
    
    return Math.ceil(baseAllocation * Math.min(2, valueRatio));
  } else {
    // Defender strategy: defend more valuable pieces more strongly
    const valueRatio = ownPieceValue / opponentPieceValue;
    const baseAllocation = Math.min(
      ownPiece.playerBattlePoints * 0.3, // Don't use more than 30% of BP
      ownPieceValue // Base on your own piece value
    );
    
    return Math.ceil(baseAllocation * Math.min(2, valueRatio));
  }
}