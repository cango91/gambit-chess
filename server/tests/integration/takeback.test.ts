import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { 
  createTestServer, 
  createWebSocketClient,
  TestClient,
  waitForMessage,
  safeCloseClient,
  collectMessages
} from './test-utils';
import { GameState, PlayerColor } from '@gambit-chess/shared';

// Increase test timeout for all tests in this file
jest.setTimeout(60000); // 60 seconds

describe('Takeback Handler Integration Tests', () => {
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
    const moveResult = waitForMessage(client.client, 'move_result');
    
    // Send move message
    client.client.send(JSON.stringify({
      type: 'move',
      payload: { 
        gameId, 
        from: from, 
        to: to 
      }
    }));
    
    // Wait for move result message
    await moveResult;
    console.log(`Client ${client.sessionId} made move ${from} to ${to}`);
  }

  // Test full takeback request and acceptance flow
  test('Player can request takeback and opponent can accept it', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Make a move with player1 (white)
      await makeMove(player1, gameId, 'e2', 'e3');
      
      // Make a move with player2 (black)
      await makeMove(player2, gameId, 'e7', 'e5');
      
      // Prepare to receive takeback request confirmation for white player
      const takebackRequestedConfirmation = waitForMessage(player1.client, 'takeback_requested');
      
      // Prepare to receive takeback request for black player
      const takebackRequestedNotification = waitForMessage(player2.client, 'takeback_requested');
      
      // Player1 (white) requests a takeback
      player1.client.send(JSON.stringify({
        type: 'request_takeback',
        payload: { gameId }
      }));
      
      // Wait for takeback request messages
      const whiteConfirmation = await takebackRequestedConfirmation;
      const blackNotification = await takebackRequestedNotification;
      
      // Verify takeback request messages
      expect(whiteConfirmation.payload.success).toBe(true);
      expect(blackNotification.payload.requestedBy).toBe(PlayerColor.WHITE);
      
      // Prepare to receive takeback accepted message
      const takebackAcceptedConfirmation = waitForMessage(player2.client, 'takeback_accepted');
      const takebackAcceptedNotification = waitForMessage(player1.client, 'takeback_accepted');
      
      // Player2 (black) accepts the takeback
      player2.client.send(JSON.stringify({
        type: 'accept_takeback',
        payload: { gameId }
      }));
      
      // Wait for takeback accepted messages
      const blackConfirmation = await takebackAcceptedConfirmation;
      const whiteNotification = await takebackAcceptedNotification;
      
      // Verify the takeback was accepted successfully
      expect(blackConfirmation.payload.gameId).toBe(gameId);
      expect(whiteNotification.payload.gameId).toBe(gameId);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });
  
  // Test takeback request and rejection flow
  test('Player can request takeback and opponent can reject it', async () => {
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
      
      // Prepare to receive takeback request confirmation for white player
      const takebackRequestedConfirmation = waitForMessage(player1.client, 'takeback_requested');
      
      // Prepare to receive takeback request for black player
      const takebackRequestedNotification = waitForMessage(player2.client, 'takeback_requested');
      
      // Player1 (white) requests a takeback
      player1.client.send(JSON.stringify({
        type: 'request_takeback',
        payload: { gameId }
      }));
      
      // Wait for takeback request messages
      const whiteConfirmation = await takebackRequestedConfirmation;
      const blackNotification = await takebackRequestedNotification;
      
      // Verify takeback request messages
      expect(whiteConfirmation.payload.success).toBe(true);
      expect(blackNotification.payload.requestedBy).toBe(PlayerColor.WHITE);
      
      // Prepare to receive takeback rejection confirmation
      const takebackRejectedConfirmation = waitForMessage(player2.client, 'takeback_rejected');
      
      // Prepare to receive takeback rejection notification
      const takebackRejectedNotification = waitForMessage(player1.client, 'takeback_rejected');
      
      // Player2 (black) rejects the takeback
      player2.client.send(JSON.stringify({
        type: 'reject_takeback',
        payload: { gameId }
      }));
      
      // Wait for takeback rejection messages
      const blackConfirmation = await takebackRejectedConfirmation;
      const whiteNotification = await takebackRejectedNotification;
      
      // Verify takeback rejection messages
      expect(blackConfirmation.payload.success).toBe(true);
      expect(whiteNotification.payload.gameId).toBe(gameId);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for invalid game ID in takeback request
  test('Takeback request with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send takeback request message with invalid game ID
      player.client.send(JSON.stringify({
        type: 'request_takeback',
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

  // Test error handling for accepting a non-existent takeback request
  test('Accepting a non-existent takeback request returns an error', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive error message
      const errorMessage = waitForMessage(player2.client, 'error');
      
      // Player2 tries to accept a non-existent takeback request
      player2.client.send(JSON.stringify({
        type: 'accept_takeback',
        payload: { gameId }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('No active takeback request');
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for rejecting a non-existent takeback request
  test('Rejecting a non-existent takeback request returns an error', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive error message
      const errorMessage = waitForMessage(player2.client, 'error');
      
      // Player2 tries to reject a non-existent takeback request
      player2.client.send(JSON.stringify({
        type: 'reject_takeback',
        payload: { gameId }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('No active takeback request');
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Define interface for messages
  interface Message {
    type: string;
    payload: any;
  }

  // Add a new test verifying spectator notifications for takeback acceptance
  test('Spectator receives notification when takeback is accepted', async () => {
    // Create clients for two players and a spectator
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);
    const spectator = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Set up spectator
      const spectatePromise = waitForMessage(spectator.client, 'spectating');
      
      // Spectator joins the game
      spectator.client.send(JSON.stringify({
        type: 'spectate_game',
        payload: { gameId }
      }));
      
      // Wait for spectating confirmation
      const spectateResponse = await spectatePromise;
      expect(spectateResponse.payload.success).toBe(true);
      
      // Give some time for the initial game_state to arrive
      console.log("Waiting for initial state...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Player1 (white) makes a move
      await makeMove(player1, gameId, "e2", "e3");
      
      // Player1 requests a takeback
      const takebackRequestedPromise = waitForMessage(player1.client, 'takeback_requested');
      
      player1.client.send(JSON.stringify({
        type: 'request_takeback',
        payload: {
          gameId,
          moveCount: 1
        }
      }));
      
      // Wait for takeback requested confirmation
      await takebackRequestedPromise;
      
      // Player2 receives takeback request
      const takebackRequestReceived = await waitForMessage(player2.client, 'takeback_requested');
      expect(takebackRequestReceived.payload.gameId).toBe(gameId);
      
      // Start collecting messages from the spectator
      console.log("Starting to collect spectator messages");
      
      // Player2 accepts the takeback
      player2.client.send(JSON.stringify({
        type: 'accept_takeback',
        payload: {
          gameId
        }
      }));
      
      // Collect messages for the spectator for 3 seconds
      const spectatorMessages = await collectMessages(spectator.client, 3000) as Message[];
      console.log("Messages received by spectator:", spectatorMessages.map((msg: Message) => msg.type));
      
      // Find takeback_accepted message
      const takebackNotification = spectatorMessages.find((msg: Message) => msg.type === 'takeback_accepted');
      console.log('Takeback notification received:', takebackNotification);
      
      // Verify the takeback notification
      expect(takebackNotification).toBeDefined();
      
      if (takebackNotification) {
        expect(takebackNotification.type).toBe('takeback_accepted');
        expect(takebackNotification.payload).toBeDefined();
        expect(takebackNotification.payload.gameId).toBe(gameId);
        expect(takebackNotification.payload.moveCount).toBe(1);
        expect(takebackNotification.payload.gameState).toBeDefined();
        expect(takebackNotification.payload.gameState.playerRole).toBe('spectator');
      }
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator.client);
    }
  });
}); 