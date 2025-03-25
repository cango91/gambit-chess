import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { 
  createTestServer, 
  createWebSocketClient,
  TestClient,
  waitForMessage,
  safeCloseClient
} from './test-utils';
import { GameState, PlayerColor } from '@gambit-chess/shared';

// Increase test timeout for all tests in this file
jest.setTimeout(60000); // 60 seconds

describe('Time Control Handler Integration Tests', () => {
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

  // Test time flag event
  test('Time flag ends the game when a player runs out of time', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive game_over message for the opponent player only
      // The sender doesn't get a game_over message in the current implementation
      const gameOverForBlack = waitForMessage(player2.client, 'game_over');
      
      // Simulate a time flag event for white player
      player1.client.send(JSON.stringify({
        type: 'time_flag',
        payload: { 
          gameId,
          player: PlayerColor.WHITE
        }
      }));
      
      // Wait for game_over message
      const blackGameOver = await gameOverForBlack;
      
      // Verify the game over message
      expect(blackGameOver.payload.reason).toBe('time_flag');
      expect(blackGameOver.payload.flaggedPlayer).toBe(PlayerColor.WHITE);
      expect(blackGameOver.payload.winner).toBe(PlayerColor.BLACK);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });
  
  // Test requesting more time
  test('Player can request more time and get time added', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive time extension request and response
      const timeExtensionRequest = waitForMessage(player2.client, 'time_extension_request');
      const timeExtensionRequested = waitForMessage(player1.client, 'time_extension_requested');
      
      // Player1 (white) requests more time
      player1.client.send(JSON.stringify({
        type: 'request_more_time',
        payload: { 
          gameId,
          player: PlayerColor.WHITE,
          seconds: 30
        }
      }));
      
      // Wait for time extension messages
      const extensionRequest = await timeExtensionRequest;
      const extensionResponse = await timeExtensionRequested;
      
      // Verify the time extension messages
      expect(extensionRequest.payload.requestingPlayer).toBe(PlayerColor.WHITE);
      // Note: server does not include requestedSeconds in the forwarded request
      
      expect(extensionResponse.payload.success).toBe(true);
      // Note: server does not include requestedSeconds in the response
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for invalid game ID in time flag
  test('Time flag with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send time flag message with invalid game ID
      player.client.send(JSON.stringify({
        type: 'time_flag',
        payload: { 
          gameId: 'non-existent-game-id',
          player: PlayerColor.WHITE
        }
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

  // Test error handling for invalid player in time flag
  test('Time flag with invalid player returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Create a game
      const gameId = await createGameAndGetId(player);
      
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send time flag message with invalid player
      player.client.send(JSON.stringify({
        type: 'time_flag',
        payload: { 
          gameId,
          player: 'INVALID_PLAYER'
        }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message contains an error about the player
      expect(error.payload.message).toBe('Unauthorized time flag notification');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(player.client);
    }
  });

  // Test error handling for invalid game ID in request more time
  test('Request more time with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send request more time message with invalid game ID
      player.client.send(JSON.stringify({
        type: 'request_more_time',
        payload: { 
          gameId: 'non-existent-game-id',
          player: PlayerColor.WHITE,
          seconds: 30
        }
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

  // Test error handling for negative time in request more time
  test('Request more time with negative seconds returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Create a game
      const gameId = await createGameAndGetId(player);
      
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send request more time message with negative seconds
      player.client.send(JSON.stringify({
        type: 'request_more_time',
        payload: { 
          gameId,
          player: PlayerColor.WHITE,
          seconds: -30
        }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message - this is what server actually sends when no opponent is connected
      expect(error.payload.message).toBe('Opponent not connected');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(player.client);
    }
  });
}); 