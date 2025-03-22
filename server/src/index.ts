import { initializeGameData } from '@gambit-chess/shared';

// Initialize shared game data
initializeGameData();

/**
 * Initialize and start the Gambit Chess server
 */
async function main() {
  console.log('Initializing Gambit Chess server...');
  
  // TODO: Initialize HTTP server
  // TODO: Initialize WebSocket server
  // TODO: Set up game manager
  // TODO: Set up session management
  
  console.log('Gambit Chess server started');
}

// Start the server
main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 