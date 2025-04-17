import { BaseGameState, DuelAllocationAction, GameStatus } from '../types/game';
import { z } from 'zod';

/**
 * Zod schema for validating duel allocation input
 */
export const duelAllocationSchema = z.object({
  type: z.literal('DUEL_ALLOCATION'),
  allocation: z.number().int().min(0)
});

/**
 * Validate if a duel allocation is valid in the current game state
 */
export function validateDuelAllocation(
  gameState: BaseGameState,
  playerId: string,
  allocationAction: DuelAllocationAction
): { valid: boolean; error?: string } {
  // Check if the game is in a state where duel allocations are allowed
  if (gameState.gameStatus !== GameStatus.DUEL_IN_PROGRESS) {
    return { 
      valid: false, 
      error: `Game is not in duel state. Current status: ${gameState.gameStatus}`
    };
  }
  
  // Check if there's a pending duel
  if (!gameState.pendingDuel) {
    return { 
      valid: false, 
      error: 'No pending duel found'
    };
  }
  
  // Get the player's role in the duel
  const isAttacker = gameState.pendingDuel.attackerColor === 
    (playerId === gameState.whitePlayer.id ? 'w' : 'b');
  
  // Check if the player has already submitted an allocation
  if (isAttacker && gameState.pendingDuel.attackerAllocation !== undefined) {
    return { 
      valid: false, 
      error: 'Attacker has already submitted an allocation'
    };
  }
  
  if (!isAttacker && gameState.pendingDuel.defenderAllocation !== undefined) {
    return { 
      valid: false, 
      error: 'Defender has already submitted an allocation'
    };
  }
  
  // Get the player's battle points
  const player = playerId === gameState.whitePlayer.id 
    ? gameState.whitePlayer 
    : gameState.blackPlayer;
  
  // Check if the player has enough battle points
  if (allocationAction.allocation > player.battlePoints) {
    return { 
      valid: false, 
      error: `Not enough battle points. Available: ${player.battlePoints}, Requested: ${allocationAction.allocation}`
    };
  }
  
  return { valid: true };
}

/**
 * Check if a duel is complete (both players have submitted allocations)
 */
export function isDuelComplete(gameState: BaseGameState): boolean {
  if (!gameState.pendingDuel) {
    return false;
  }
  
  return (
    gameState.pendingDuel.attackerAllocation !== undefined &&
    gameState.pendingDuel.defenderAllocation !== undefined
  );
}

/**
 * Check if a player is allowed to allocate battle points in the current duel
 */
export function canAllocateInDuel(
  gameState: BaseGameState,
  playerId: string
): boolean {
  if (
    gameState.gameStatus !== GameStatus.DUEL_IN_PROGRESS ||
    !gameState.pendingDuel
  ) {
    return false;
  }
  
  const playerColor = playerId === gameState.whitePlayer.id ? 'w' : 'b';
  
  // Check if the player is involved in the duel
  if (
    gameState.pendingDuel.attackerColor !== playerColor &&
    gameState.pendingDuel.defenderColor !== playerColor
  ) {
    return false;
  }
  
  // Check if the player has already allocated
  if (
    (gameState.pendingDuel.attackerColor === playerColor && 
     gameState.pendingDuel.attackerAllocation !== undefined) ||
    (gameState.pendingDuel.defenderColor === playerColor && 
     gameState.pendingDuel.defenderAllocation !== undefined)
  ) {
    return false;
  }
  
  return true;
}