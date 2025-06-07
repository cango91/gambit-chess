import { BaseGameState, Player } from '@gambit-chess/shared';
import { GameConfig } from '@gambit-chess/shared';

/**
 * Filter game state for a specific player based on information hiding rules
 * Respects configuration settings for what information should be hidden
 */
export function getGameStateForPlayer(gameState: BaseGameState, playerId: string): BaseGameState {
  const config = gameState.config;
  const isWhitePlayer = gameState.whitePlayer.id === playerId;
  const isBlackPlayer = gameState.blackPlayer.id === playerId;
  
  // If not a player in this game, return minimal visible state
  if (!isWhitePlayer && !isBlackPlayer) {
    return getSpectatorGameState(gameState);
  }

  // Create filtered state based on information hiding configuration
  const filteredState: BaseGameState = {
    ...gameState,
    
    // Filter player battle points based on config
    whitePlayer: {
      ...gameState.whitePlayer,
      battlePoints: shouldHideBattlePoints(config, isWhitePlayer, 'white') 
        ? -1 // Use -1 to indicate hidden (client should show "?" or similar)
        : gameState.whitePlayer.battlePoints
    },
    
    blackPlayer: {
      ...gameState.blackPlayer,
      battlePoints: shouldHideBattlePoints(config, isBlackPlayer, 'black')
        ? -1 // Use -1 to indicate hidden
        : gameState.blackPlayer.battlePoints
    },
    
    // Filter BP calculation report based on current turn and config
    bpCalculationReport: shouldShowBPCalculationReport(gameState, playerId, config)
      ? gameState.bpCalculationReport
      : undefined,
    
    // Filter pending duel information
    pendingDuel: gameState.pendingDuel ? {
      ...gameState.pendingDuel,
      // Hide opponent's allocation until duel is resolved
      attackerAllocation: shouldShowDuelAllocation(gameState, playerId, 'attacker')
        ? gameState.pendingDuel.attackerAllocation
        : undefined,
      defenderAllocation: shouldShowDuelAllocation(gameState, playerId, 'defender')
        ? gameState.pendingDuel.defenderAllocation
        : undefined
    } : null,
    
    // Filter move history based on allocation history hiding
    moveHistory: config.informationHiding.hideAllocationHistory
      ? filterMoveHistoryAllocations(gameState.moveHistory, playerId, gameState)
      : gameState.moveHistory
  };

  return filteredState;
}

/**
 * Get minimal game state for spectators (non-players)
 */
function getSpectatorGameState(gameState: BaseGameState): BaseGameState {
  return {
    ...gameState,
    // Hide all battle points for spectators
    whitePlayer: { ...gameState.whitePlayer, battlePoints: -1 },
    blackPlayer: { ...gameState.blackPlayer, battlePoints: -1 },
    // Hide all sensitive reports
    bpCalculationReport: undefined,
    // Hide duel allocations
    pendingDuel: gameState.pendingDuel ? {
      ...gameState.pendingDuel,
      attackerAllocation: undefined,
      defenderAllocation: undefined
    } : null
  };
}

/**
 * Determine if battle points should be hidden for a specific player
 */
function shouldHideBattlePoints(config: GameConfig, isCurrentPlayer: boolean, playerColor: 'white' | 'black'): boolean {
  // Always show your own battle points
  if (isCurrentPlayer) {
    return false;
  }
  
  // Hide opponent's battle points if configuration requires it
  return config.informationHiding.hideBattlePoints;
}

/**
 * Determine if BP calculation report should be shown to a player
 */
function shouldShowBPCalculationReport(gameState: BaseGameState, playerId: string, config: GameConfig): boolean {
  // Only show BP calculation report to the current turn player
  // This contains sensitive information about tactics detected and regeneration
  const currentTurnPlayer = gameState.currentTurn === 'w' ? gameState.whitePlayer : gameState.blackPlayer;
  return currentTurnPlayer.id === playerId;
}

/**
 * Determine if duel allocation should be shown to a player
 */
function shouldShowDuelAllocation(gameState: BaseGameState, playerId: string, role: 'attacker' | 'defender'): boolean {
  if (!gameState.pendingDuel) {
    return false;
  }
  
  const isAttacker = gameState.pendingDuel.attackerColor === 'w' 
    ? gameState.whitePlayer.id === playerId
    : gameState.blackPlayer.id === playerId;
  
  const isDefender = !isAttacker && (
    gameState.whitePlayer.id === playerId || gameState.blackPlayer.id === playerId
  );
  
  // Show your own allocation, hide opponent's until duel is resolved
  if (role === 'attacker' && isAttacker) {
    return true;
  }
  if (role === 'defender' && isDefender) {
    return true;
  }
  
  return false;
}

/**
 * Filter move history to hide allocation details based on config
 */
function filterMoveHistoryAllocations(moveHistory: any[], playerId: string, gameState: BaseGameState): any[] {
  // If hideAllocationHistory is false, return as-is
  if (!gameState.config.informationHiding.hideAllocationHistory) {
    return moveHistory;
  }
  
  // Filter out detailed duel allocation information from historical moves
  // Keep the move notation and result, but remove the allocation details
  return moveHistory.map(move => ({
    ...move,
    duelResult: move.duelResult ? {
      ...move.duelResult,
      // Keep the result but hide the allocation amounts
      attackerAllocation: undefined,
      defenderAllocation: undefined
    } : undefined
  }));
}

/**
 * Create a debug summary of what information was filtered out
 * Useful for development and bug reporting
 */
export function getFilteringSummary(originalState: BaseGameState, filteredState: BaseGameState, playerId: string): string[] {
  const summary: string[] = [];
  
  if (originalState.whitePlayer.battlePoints !== filteredState.whitePlayer.battlePoints) {
    summary.push(`Hidden white player battle points (${originalState.whitePlayer.battlePoints} -> ${filteredState.whitePlayer.battlePoints})`);
  }
  
  if (originalState.blackPlayer.battlePoints !== filteredState.blackPlayer.battlePoints) {
    summary.push(`Hidden black player battle points (${originalState.blackPlayer.battlePoints} -> ${filteredState.blackPlayer.battlePoints})`);
  }
  
  if (originalState.bpCalculationReport && !filteredState.bpCalculationReport) {
    summary.push('Hidden BP calculation report');
  }
  
  if (originalState.pendingDuel?.attackerAllocation && !filteredState.pendingDuel?.attackerAllocation) {
    summary.push('Hidden attacker duel allocation');
  }
  
  if (originalState.pendingDuel?.defenderAllocation && !filteredState.pendingDuel?.defenderAllocation) {
    summary.push('Hidden defender duel allocation');
  }
  
  return summary;
} 