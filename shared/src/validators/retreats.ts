import { BaseGameState, TacticalRetreatAction, GameStatus } from '../types/game';
import { z } from 'zod';
import { calculateTacticalRetreats } from '../utils/tactical-retreat';

/**
 * Zod schema for validating tactical retreat input
 */
export const tacticalRetreatSchema = z.object({
  type: z.literal('TACTICAL_RETREAT'),
  to: z.string().length(2)
});

/**
 * Validate if a tactical retreat is valid in the current game state
 */
export function validateTacticalRetreat(
  gameState: BaseGameState,
  playerId: string,
  retreatAction: TacticalRetreatAction
): { valid: boolean; error?: string; cost?: number } {
  // Check if the game is in a state where tactical retreats are allowed
  if (gameState.gameStatus !== GameStatus.TACTICAL_RETREAT_DECISION) {
    return { 
      valid: false, 
      error: `Game is not in tactical retreat state. Current status: ${gameState.gameStatus}`
    };
  }
  
  // Get the last move from history (which should be the failed capture)
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  if (!lastMove || !lastMove.duelResult || lastMove.duelResult.attackerWon) {
    return { 
      valid: false, 
      error: 'No failed capture found in game history'
    };
  }
  
  // Check if the player is the attacker who lost the duel
  const attackerColor = lastMove.color;
  
  // In practice mode, the same player controls both colors
  if (gameState.gameType === 'practice') {
    // In practice mode, allow the same player to make retreats for any color
    const isPlayerInGame = playerId === gameState.whitePlayer.id || playerId === gameState.blackPlayer.id;
    if (!isPlayerInGame) {
      return { 
        valid: false, 
        error: 'Only players in the game can execute a tactical retreat'
      };
    }
  } else {
    // In multiplayer mode, check if the player matches the attacking color
    const playerColor = playerId === gameState.whitePlayer.id ? 'w' : 'b';
    if (attackerColor !== playerColor) {
      return { 
        valid: false, 
        error: 'Only the attacking player can execute a tactical retreat'
      };
    }
  }
  
  // Calculate valid tactical retreat options
  const retreatOptions = calculateTacticalRetreats(
    gameState.chess,
    lastMove.from,
    lastMove.to,
    gameState.config
  );
  
  // Check if the chosen retreat square is valid
  const chosenRetreat = retreatOptions.find(opt => opt.square === retreatAction.to);
  if (!chosenRetreat) {
    return { 
      valid: false, 
      error: `Invalid retreat square: ${retreatAction.to}`
    };
  }
  
  // Check if player has enough battle points for the retreat
  // Determine which player we're checking based on the attacker color and game type
  let player;
  if (gameState.gameType === 'practice') {
    // In practice mode, use the attacking color to determine which BP pool to check
    player = attackerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
  } else {
    // In multiplayer mode, use the player's actual color
    const playerColor = playerId === gameState.whitePlayer.id ? 'w' : 'b';
    player = playerColor === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
  }
  if (chosenRetreat.cost > player.battlePoints) {
    return { 
      valid: false, 
      error: `Not enough battle points for this retreat. Required: ${chosenRetreat.cost}, Available: ${player.battlePoints}`
    };
  }
  
  return { 
    valid: true,
    cost: chosenRetreat.cost
  };
}

/**
 * Get all valid tactical retreat options for a player
 */
export function getValidTacticalRetreats(
  gameState: BaseGameState,
  playerId: string
): { square: string; cost: number }[] {
  // Check if the game is in a state where tactical retreats are allowed
  if (gameState.gameStatus !== GameStatus.TACTICAL_RETREAT_DECISION) {
    return [];
  }
  
  // Get the last move from history (which should be the failed capture)
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  if (!lastMove || !lastMove.duelResult || lastMove.duelResult.attackerWon) {
    return [];
  }
  
  // Check if the player is the attacker who lost the duel
  const attackerColor = lastMove.color;
  
  // In practice mode, the same player controls both colors
  if (gameState.gameType === 'practice') {
    // In practice mode, allow the same player to make retreats for any color
    const isPlayerInGame = playerId === gameState.whitePlayer.id || playerId === gameState.blackPlayer.id;
    if (!isPlayerInGame) {
      return [];
    }
  } else {
    // In multiplayer mode, check if the player matches the attacking color
    const playerColor = playerId === gameState.whitePlayer.id ? 'w' : 'b';
    if (attackerColor !== playerColor) {
      return [];
    }
  }
  console.log('🏃 Calculating retreat options for', lastMove.from, lastMove.to);
  // Calculate valid tactical retreat options
  return calculateTacticalRetreats(
    gameState.chess,
    lastMove.from,
    lastMove.to,
    gameState.config
  );
}

/**
 * Check if a player has any valid tactical retreat options
 */
export function hasValidTacticalRetreats(
  gameState: BaseGameState,
  playerId: string
): boolean {
  const retreats = getValidTacticalRetreats(gameState, playerId);
  return retreats.length > 0;
}