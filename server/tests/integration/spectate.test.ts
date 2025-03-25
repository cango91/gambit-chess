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

describe('Spectate Handler Integration Tests', () => {
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

  // Test spectator can join a game
  test('Spectator can join a game and receive confirmation', async () => {
    // Create clients for two players and a spectator
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);
    const spectator = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive spectating confirmation
      const spectatingConfirmation = waitForMessage(spectator.client, 'spectating');
      
      // Spectator joins the game
      spectator.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId }
      }));
      
      // Wait for spectating confirmation
      const spectatingResponse = await spectatingConfirmation;
      
      // Verify spectating response
      expect(spectatingResponse.payload.success).toBe(true);
      expect(spectatingResponse.payload.gameId).toBe(gameId);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator.client);
    }
  });

  // Test multiple spectators can join a game
  test('Multiple spectators can join a game', async () => {
    // Create clients for two players and two spectators
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);
    const spectator1 = await createWebSocketClient(port);
    const spectator2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive spectating confirmations
      const spectating1Confirmation = waitForMessage(spectator1.client, 'spectating');
      
      // First spectator joins the game
      spectator1.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId }
      }));
      
      // Wait for first spectator confirmation
      const spectating1Response = await spectating1Confirmation;
      
      // Verify first spectator response
      expect(spectating1Response.payload.success).toBe(true);
      expect(spectating1Response.payload.gameId).toBe(gameId);
      
      // Prepare to receive second spectator confirmation
      const spectating2Confirmation = waitForMessage(spectator2.client, 'spectating');
      
      // Second spectator joins the game
      spectator2.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId }
      }));
      
      // Wait for second spectator confirmation
      const spectating2Response = await spectating2Confirmation;
      
      // Verify second spectator response
      expect(spectating2Response.payload.success).toBe(true);
      expect(spectating2Response.payload.gameId).toBe(gameId);
      
      // Skip testing move updates as they may vary
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator1.client);
      await safeCloseClient(spectator2.client);
    }
  });

  // Test error handling for invalid game ID
  test('Spectating with invalid game ID returns an error', async () => {
    // Create a client
    const spectator = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(spectator.client, 'error');
      
      // Send spectate message with invalid game ID
      spectator.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId: 'non-existent-game-id' }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('Game not found');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(spectator.client);
    }
  });

  // Import the collectMessages function from test-utils
  const { collectMessages } = require('./test-utils');

  // Define interface for messages
  interface Message {
    type: string;
    payload: any;
  }

  // Test spectator receives updates when moves are made
  test('Spectator receives game updates when moves are made', async () => {
    // Create clients for two players and a spectator
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);
    const spectator = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      console.log("Created game with ID:", gameId);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      console.log("Player 2 joined the game");
      
      // Set up spectator
      console.log("Setting up spectator");
      const spectatePromise = waitForMessage(spectator.client, 'spectating');
      
      // Spectator joins the game
      spectator.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId }
      }));
      
      // Wait for spectating confirmation
      console.log("Waiting for spectating confirmation");
      const spectateResponse = await spectatePromise;
      expect(spectateResponse.payload.success).toBe(true);
      console.log("Received spectating confirmation");
      
      // Give some time for the initial game_state to arrive
      console.log("Waiting for initial state...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Player1 (white) makes a move
      console.log("Player 1 making move");
      player1.client.send(JSON.stringify({
        type: 'move',
        payload: {
          gameId,
          from: { x: 4, y: 6 }, // e2 pawn
          to: { x: 4, y: 5 }   // e3 - one square forward
        }
      }));
      
      // Collect messages after the move
      console.log("Collecting messages after move");
      const messages = await collectMessages(spectator.client, 3000) as Message[];
      console.log("Messages received:", messages.map((m: Message) => m.type));
      
      // Verify that we received a move_result message
      const moveResult = messages.find((msg: Message) => msg.type === 'move_result');
      console.log("Move result message:", moveResult);
      
      expect(moveResult).toBeDefined();
      if (moveResult) {
        expect(moveResult.payload.gameId).toBe(gameId);
        expect(moveResult.payload.success).toBe(true);
      }
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator.client);
    }
  });
}); 