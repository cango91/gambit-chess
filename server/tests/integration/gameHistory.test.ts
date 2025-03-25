import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { 
  createTestServer, 
  createWebSocketClient,
  TestClient,
  waitForMessage,
  safeCloseClient
} from './test-utils';
import { PlayerColor } from '@gambit-chess/shared';

// Increase test timeout for all tests in this file
jest.setTimeout(60000); // 60 seconds

describe('Game History Handler Integration Tests', () => {
  let server: any;
  let port: number;
  let wss: WebSocketServer;
  let closeServer: () => Promise<void>;
  
  beforeAll(async () => {
    // Setup test server once for all tests
    try {
      console.log('Starting test server...');
      const testServer = await createTestServer();
      server = testServer.server;
      wss = testServer.wss;
      port = testServer.port;
      closeServer = testServer.closeServer;
      console.log(`Test server started on port ${port}`);
    } catch (error) {
      console.error('Failed to start test server:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    // Cleanup resources
    console.log('Cleaning up test resources...');
    try {
      if (closeServer) {
        await closeServer();
        console.log('Test server closed');
      }
    } catch (error) {
      console.error('Error closing server:', error);
    }
  });

  // Helper function to create a game and return the game ID
  async function createGameAndGetId(client: TestClient): Promise<string> {
    // Set up listener BEFORE sending message
    const gameCreated = waitForMessage(client.client, 'game_created');
    
    // Generate a unique game ID suggestion
    const gameIdSuggestion = `test-game-${Date.now()}`;
    console.log(`Creating game with suggested ID: ${gameIdSuggestion}`);
    
    // Send create game message
    client.client.send(JSON.stringify({
      type: 'create_game',
      payload: {
        gameId: gameIdSuggestion
      }
    }));
    
    // Wait for game created message
    const response = await gameCreated;
    console.log('Game created:', response.payload.gameId);
    return response.payload.gameId;
  }
  
  // Helper function to join a game
  async function joinGame(client: TestClient, gameId: string): Promise<void> {
    // Set up listener BEFORE sending message
    const gameJoined = waitForMessage(client.client, 'game_joined');
    
    // Send join game message
    client.client.send(JSON.stringify({
      type: 'join_game',
      payload: { 
        gameId 
      }
    }));
    
    // Wait for game joined message
    await gameJoined;
    console.log(`Client ${client.sessionId} joined game ${gameId}`);
  }
  
  // Helper function to make a move
  async function makeMove(client: TestClient, gameId: string, from: string, to: string): Promise<void> {
    // Set up listener BEFORE sending message
    const moveMade = waitForMessage(client.client, 'move_result');
    
    // Send move message
    client.client.send(JSON.stringify({
      type: 'move',
      payload: { 
        gameId, 
        from: from, 
        to: to 
      }
    }));
    
    // Wait for move made message
    await moveMade;
    console.log(`Client ${client.sessionId} made move ${from} to ${to}`);
  }

  // Test requesting game history
  test('Player can request game history', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Make a move with player1 (white)
      await makeMove(player1, gameId, 'e2', 'e4');
      
      // Make a move with player2 (black)
      await makeMove(player2, gameId, 'e7', 'e5');
      
      // Prepare to receive game history response
      const gameHistoryResponse = waitForMessage(player1.client, 'game_history_update');
      
      // Player1 (white) requests game history
      player1.client.send(JSON.stringify({
        type: 'request_game_history',
        payload: { gameId }
      }));
      
      // Wait for game history response
      const historyResponse = await gameHistoryResponse;
      
      // Verify the game history response
      expect(historyResponse.payload).toBeDefined();
      expect(historyResponse.payload.history).toBeDefined();
      
      // Verify that the history exists
      const history = historyResponse.payload.history;
      expect(history).toBeDefined();
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test requesting game history with a spectator
  test('Spectator can request game history', async () => {
    // Create clients for two players and a spectator
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);
    const spectator = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Make a move with player1 (white)
      await makeMove(player1, gameId, 'e2', 'e4');
      
      // Make a move with player2 (black)
      await makeMove(player2, gameId, 'e7', 'e5');
      
      // Spectate the game
      const spectatingConfirmation = waitForMessage(spectator.client, 'spectating');
      
      // Spectator joins the game
      spectator.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId }
      }));
      
      // Wait for spectating confirmation
      await spectatingConfirmation;
      
      // Prepare to receive game history response
      const gameHistoryResponse = waitForMessage(spectator.client, 'game_history_update');
      
      // Spectator requests game history
      spectator.client.send(JSON.stringify({
        type: 'request_game_history',
        payload: { gameId }
      }));
      
      // Wait for game history response
      const historyResponse = await gameHistoryResponse;
      
      // Verify the game history response
      expect(historyResponse.payload).toBeDefined();
      expect(historyResponse.payload.history).toBeDefined();
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator.client);
    }
  });

  // Test error handling for invalid game ID
  test('Game history request with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send game history request with invalid game ID
      player.client.send(JSON.stringify({
        type: 'request_game_history',
        payload: { gameId: 'non-existent-game-id' }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('Game not found');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(player.client);
    }
  });
}); 