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
jest.setTimeout(30000); // 30 seconds

describe('Draw Handler Integration Tests', () => {
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

  // Test full draw offer and acceptance flow
  test('White player can offer a draw and black player can accept it', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive draw offer confirmation for white player
      const drawOfferedConfirmation = waitForMessage(player1.client, 'draw_offered');
      
      // Prepare to receive draw offer for black player
      const drawOfferedNotification = waitForMessage(player2.client, 'draw_offered');
      
      // Player1 (white) offers a draw
      player1.client.send(JSON.stringify({
        type: 'offer_draw',
        payload: { gameId }
      }));
      
      // Wait for draw offer messages
      const whiteConfirmation = await drawOfferedConfirmation;
      const blackNotification = await drawOfferedNotification;
      
      // Verify draw offer messages
      expect(whiteConfirmation.payload.success).toBe(true);
      expect(blackNotification.payload.offeredBy).toBe(PlayerColor.WHITE);
      
      // Prepare to receive game_over messages for both players
      const gameOverForWhite = waitForMessage(player1.client, 'game_over');
      const gameOverForBlack = waitForMessage(player2.client, 'game_over');
      
      // Player2 (black) accepts the draw
      player2.client.send(JSON.stringify({
        type: 'accept_draw',
        payload: { gameId }
      }));
      
      // Wait for game_over messages
      const whiteGameOver = await gameOverForWhite;
      const blackGameOver = await gameOverForBlack;
      
      // Verify the game over messages
      expect(whiteGameOver.payload.reason).toBe('draw_agreement');
      expect(whiteGameOver.payload.winner).toBeNull();
      expect(whiteGameOver.payload.gameState.gameState).toBe(GameState.DRAW);
      
      expect(blackGameOver.payload.reason).toBe('draw_agreement');
      expect(blackGameOver.payload.winner).toBeNull();
      expect(blackGameOver.payload.gameState.gameState).toBe(GameState.DRAW);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });
  
  // Test draw offer and rejection flow
  test('Black player can offer a draw and white player can reject it', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Prepare to receive draw offer confirmation for black player
      const drawOfferedConfirmation = waitForMessage(player2.client, 'draw_offered');
      
      // Prepare to receive draw offer for white player
      const drawOfferedNotification = waitForMessage(player1.client, 'draw_offered');
      
      // Player2 (black) offers a draw
      player2.client.send(JSON.stringify({
        type: 'offer_draw',
        payload: { gameId }
      }));
      
      // Wait for draw offer messages
      const blackConfirmation = await drawOfferedConfirmation;
      const whiteNotification = await drawOfferedNotification;
      
      // Verify draw offer messages
      expect(blackConfirmation.payload.success).toBe(true);
      expect(whiteNotification.payload.offeredBy).toBe(PlayerColor.BLACK);
      
      // Prepare to receive draw rejection confirmation
      const drawRejectedConfirmation = waitForMessage(player1.client, 'draw_rejected');
      
      // Prepare to receive draw rejection notification
      const drawRejectedNotification = waitForMessage(player2.client, 'draw_rejected');
      
      // Player1 (white) rejects the draw
      player1.client.send(JSON.stringify({
        type: 'reject_draw',
        payload: { gameId }
      }));
      
      // Wait for draw rejection messages
      const whiteConfirmation = await drawRejectedConfirmation;
      const blackNotification = await drawRejectedNotification;
      
      // Verify draw rejection messages
      expect(whiteConfirmation.payload.success).toBe(true);
      expect(blackNotification.payload.gameId).toBe(gameId);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for invalid game ID in draw offer
  test('Draw offer with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send draw offer message with invalid game ID
      player.client.send(JSON.stringify({
        type: 'offer_draw',
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

  // Test error handling for accepting a non-existent draw offer
  test('Accepting a non-existent draw offer returns an error', async () => {
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
      
      // Player2 tries to accept a non-existent draw offer
      player2.client.send(JSON.stringify({
        type: 'accept_draw',
        payload: { gameId }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('No active draw offer');
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for rejecting a non-existent draw offer
  test('Rejecting a non-existent draw offer returns an error', async () => {
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
      
      // Player2 tries to reject a non-existent draw offer
      player2.client.send(JSON.stringify({
        type: 'reject_draw',
        payload: { gameId }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('No active draw offer');
      
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

  // Add a new test verifying spectator notifications for draw acceptance
  test('Spectator receives notification when draw is accepted', async () => {
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
      
      // Player1 offers a draw
      const drawOfferedPromise = waitForMessage(player1.client, 'draw_offered');
      
      player1.client.send(JSON.stringify({
        type: 'offer_draw',
        payload: {
          gameId
        }
      }));
      
      // Wait for draw offered confirmation
      await drawOfferedPromise;
      
      // Player2 receives draw offer
      const drawOfferReceived = await waitForMessage(player2.client, 'draw_offered');
      expect(drawOfferReceived.payload.gameId).toBe(gameId);
      
      // Start collecting messages from the spectator
      console.log("Starting to collect spectator messages");
      
      // Player2 accepts the draw
      player2.client.send(JSON.stringify({
        type: 'accept_draw',
        payload: {
          gameId
        }
      }));
      
      // Collect messages for the spectator for 3 seconds
      const spectatorMessages = await collectMessages(spectator.client, 3000) as Message[];
      console.log("Messages received by spectator:", spectatorMessages.map((msg: Message) => msg.type));
      
      // Find game_over message
      const gameOverMessage = spectatorMessages.find((msg: Message) => msg.type === 'game_over');
      console.log('Game over notification received:', gameOverMessage);
      
      // Verify the game over notification
      expect(gameOverMessage).toBeDefined();
      
      if (gameOverMessage) {
        expect(gameOverMessage.type).toBe('game_over');
        expect(gameOverMessage.payload).toBeDefined();
        expect(gameOverMessage.payload.gameId).toBe(gameId);
        expect(gameOverMessage.payload.reason).toBe('draw_agreement');
        expect(gameOverMessage.payload.winner).toBeNull();
        expect(gameOverMessage.payload.gameState).toBeDefined();
        expect(gameOverMessage.payload.gameState.gameState).toBe('draw');
      }
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator.client);
    }
  });
});

// Helper function to collect messages
function setupMessageCollector(client: WebSocket) {
  const messages: Array<{type: string; payload?: any}> = [];
  const messageHandler = (message: WebSocket.Data) => {
    try {
      const data = JSON.parse(message.toString());
      messages.push(data);
    } catch (err) {
      // Ignore parsing errors
    }
  };
  
  client.on('message', messageHandler);
  
  return {
    getMessages: () => [...messages],
    stop: () => client.removeListener('message', messageHandler)
  };
} 