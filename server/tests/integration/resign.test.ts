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

describe('Resign Handler Integration Tests', () => {
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

  // Test resignation from white player
  test('White player can resign a game', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive game_over messages for both players
      const gameOverForWhite = waitForMessage(player1.client, 'game_over');
      const gameOverForBlack = waitForMessage(player2.client, 'game_over');
      
      // Player1 (white) resigns
      player1.client.send(JSON.stringify({
        type: 'resign',
        payload: { gameId }
      }));
      
      // Wait for game_over messages
      const whiteGameOver = await gameOverForWhite;
      const blackGameOver = await gameOverForBlack;
      
      // Verify game over messages
      expect(whiteGameOver.payload.reason).toBe('resignation');
      expect(whiteGameOver.payload.winner).toBe(PlayerColor.BLACK);
      expect(whiteGameOver.payload.gameState.gameState).toBe(GameState.CHECKMATE); // Resignation is treated as checkmate
      
      expect(blackGameOver.payload.reason).toBe('resignation');
      expect(blackGameOver.payload.winner).toBe(PlayerColor.BLACK);
      expect(blackGameOver.payload.gameState.gameState).toBe(GameState.CHECKMATE);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });
  
  // Test resignation from black player
  test('Black player can resign a game', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive game_over messages for both players
      const gameOverForWhite = waitForMessage(player1.client, 'game_over');
      const gameOverForBlack = waitForMessage(player2.client, 'game_over');
      
      // Player2 (black) resigns
      player2.client.send(JSON.stringify({
        type: 'resign',
        payload: { gameId }
      }));
      
      // Wait for game_over messages
      const whiteGameOver = await gameOverForWhite;
      const blackGameOver = await gameOverForBlack;
      
      // Verify game over messages
      expect(whiteGameOver.payload.reason).toBe('resignation');
      expect(whiteGameOver.payload.winner).toBe(PlayerColor.WHITE);
      expect(whiteGameOver.payload.gameState.gameState).toBe(GameState.CHECKMATE);
      
      expect(blackGameOver.payload.reason).toBe('resignation');
      expect(blackGameOver.payload.winner).toBe(PlayerColor.WHITE);
      expect(blackGameOver.payload.gameState.gameState).toBe(GameState.CHECKMATE);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for invalid game ID
  test('Resign with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send resign message with invalid game ID
      player.client.send(JSON.stringify({
        type: 'resign',
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

  // Test error handling for missing game ID
  test('Resign with missing game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send resign message with missing game ID
      player.client.send(JSON.stringify({
        type: 'resign',
        payload: {}
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('Invalid resign request');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(player.client);
    }
  });
}); 