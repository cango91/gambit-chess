/**
 * Gambit Chess Shared Module
 * Contains common types, utilities, and game logic used by both client and server
 */

// Re-export all types
export * from './types';

// Re-export all constants
export * from './constants';

// Re-export all utilities
export * from './utils';

// Re-export all validators
export * from './validators';

// Export a function to create a new game instance with default configuration
import { Chess } from 'chess.js';
import { BaseGameState, GameStatus, Player } from './types/game';
import { DEFAULT_GAME_CONFIG } from './constants/game-defaults';
import { GambitChess } from './utils/chess-extensions';

/**
 * Create a new Gambit Chess game state
 */
export function createNewGame(gameId: string, whitePlayerId: string, blackPlayerId?: string): BaseGameState {
  const chess = new Chess();
  
  const whitePlayer: Player = {
    id: whitePlayerId,
    color: 'w',
    battlePoints: DEFAULT_GAME_CONFIG.initialBattlePoints
  };
  
  const blackPlayer: Player = {
    id: blackPlayerId || '', // Empty string if no second player yet
    color: 'b',
    battlePoints: DEFAULT_GAME_CONFIG.initialBattlePoints
  };
  
  const gameStatus = blackPlayerId 
    ? GameStatus.IN_PROGRESS 
    : GameStatus.WAITING_FOR_PLAYERS;
  
  return {
    id: gameId,
    chess: chess,
    whitePlayer,
    blackPlayer,
    currentTurn: 'w',
    moveHistory: [],
    pendingDuel: null,
    gameStatus,
    config: DEFAULT_GAME_CONFIG
  };
}

/**
 * Create a GambitChess instance (extended Chess.js)
 */
export function createGambitChess(fen?: string) {
  return new GambitChess(fen, DEFAULT_GAME_CONFIG);
}