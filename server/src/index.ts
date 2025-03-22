import { initializeGameData } from 'gambit-chess-shared';
import { GameState } from './engine/GameState';
import { ScenarioFactory } from './utils/ScenarioFactory';

// Initialize shared game data
initializeGameData();

/**
 * Initialize and start the Gambit Chess server
 */
async function main() {
  console.log('Initializing Gambit Chess server...');
  
  // Create a new game (standard setup)
  const standardGame = ScenarioFactory.createStandardGame();
  console.log(`Standard game created with ID: ${standardGame.getGameId()}`);
  console.log(`Pieces on board: ${standardGame.getState().pieces.length}`);
  
  // Test a checkmate scenario
  const checkmateGame = ScenarioFactory.createCheckmateScenario();
  console.log(`Checkmate scenario created with ID: ${checkmateGame.getGameId()}`);
  console.log(`Game state: ${checkmateGame.getState().gameState}`);
  
  // Test a duel scenario
  const duelGame = ScenarioFactory.createDuelScenario();
  console.log(`Duel scenario created with ID: ${duelGame.getGameId()}`);
  console.log(`White player BP: ${duelGame.getPlayerBP(
    duelGame.getState().currentTurn
  )}`);
  
  // TODO: Initialize HTTP server
  // TODO: Initialize WebSocket server
  // TODO: Set up game manager
  // TODO: Set up session management
}

// Start the server
main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 