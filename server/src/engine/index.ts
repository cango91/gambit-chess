/**
 * Game Engine Module
 * 
 * This module contains the core game engine components for Gambit Chess.
 * It implements the game rules, state management, and game mechanics.
 */

// Export game state management
export { GameState } from './GameState';

// Export move execution
export { MoveExecutor } from './MoveExecutor';

// Export duel resolution
export { DuelResolver } from './DuelResolver';

// Export tactical retreat
export { TacticalRetreatManager } from './TacticalRetreatManager';

// Export BP regeneration
export { BPRegenerationService } from './BPRegenerationService';

/**
 * Module documentation
 */
export const __documentation = {
  name: "GameEngine",
  purpose: "Provides the core game engine components for Gambit Chess",
  modules: {
    GameState: {
      purpose: "Manages the authoritative game state",
      publicAPI: {
        getGameId: "Get the game ID",
        getState: "Get the current game state",
        getBoard: "Get the board implementation",
        isGameOver: "Check if the game is over",
        isInCheck: "Check if a player is in check",
        assignPlayerSession: "Assign a session ID to a player",
        setGamePhase: "Update the game phase",
        setGameState: "Update the game state",
        getPlayerBP: "Get BP for a player",
        addPlayerBP: "Add BP to a player's pool",
        switchTurn: "Switch to the next player's turn",
        addPendingBPRegeneration: "Record BP regeneration for the next turn",
        findPieceAt: "Find a piece at a position",
        isPlayerTurn: "Check if it's a player's turn"
      }
    },
    MoveExecutor: {
      purpose: "Executes and validates moves on the game state",
      publicAPI: {
        executeMove: "Validate and execute a move"
      }
    },
    DuelResolver: {
      purpose: "Resolves battle point duels between pieces",
      publicAPI: {
        allocateBP: "Allocate BP for a player in a duel"
      }
    },
    TacticalRetreatManager: {
      purpose: "Manages tactical retreats after failed captures",
      publicAPI: {
        executeRetreat: "Execute a tactical retreat"
      }
    },
    BPRegenerationService: {
      purpose: "Calculates BP regeneration based on chess tactics",
      publicAPI: {
        calculateRegeneration: "Calculate BP regeneration for a move"
      }
    }
  },
  implementationStatus: "In Progress"
}; 