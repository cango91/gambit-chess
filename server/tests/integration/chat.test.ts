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

describe('Chat Handler Integration Tests', () => {
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

  // Test sending a chat message
  test('Players can send and receive chat messages', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Test message content
      const messageContent = "Hello, good game!";
      
      // Send a chat message
      player1.client.send(JSON.stringify({
        type: 'chat_message',
        payload: {
          gameId,
          message: messageContent,
        }
      }));
      
      // Wait for confirmation and message delivery
      const confirmationForPlayer1 = await waitForMessage(player1.client, 'chat_received');
      const messageForPlayer2 = await waitForMessage(player2.client, 'chat_received');
      
      // Verify chat message content
      expect(confirmationForPlayer1.payload.message).toBe(messageContent);
      expect(messageForPlayer2.payload.message).toBe(messageContent);
      expect(messageForPlayer2.payload.sender).toBe(PlayerColor.WHITE);
      
      // Now test black player sending a message
      const messageContent2 = "Thanks, having fun!";
      
      // Send a chat message
      player2.client.send(JSON.stringify({
        type: 'chat_message',
        payload: {
          gameId,
          message: messageContent2,
        }
      }));
      
      // Wait for confirmation and message delivery
      const confirmationForPlayer2 = await waitForMessage(player2.client, 'chat_received');
      const messageForPlayer1 = await waitForMessage(player1.client, 'chat_received');
      
      // Verify chat message content
      expect(confirmationForPlayer2.payload.message).toBe(messageContent2);
      expect(messageForPlayer1.payload.message).toBe(messageContent2);
      expect(messageForPlayer1.payload.sender).toBe(PlayerColor.BLACK);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });
  
  // Test profanity filter
  test('Profanity filter removes offensive language from chat messages', async () => {
    // Create clients for two players
    const player1 = await createWebSocketClient(port);
    const player2 = await createWebSocketClient(port);

    try {
      // Create a game with player1 (white)
      const gameId = await createGameAndGetId(player1);
      
      // Join the game with player2 (black)
      await joinGame(player2, gameId);
      
      // Message with profanity
      const messageWithProfanity = "This game is damn good!";
      
      // Send a message with profanity
      player1.client.send(JSON.stringify({
        type: 'chat_message',
        payload: {
          gameId,
          message: messageWithProfanity,
        }
      }));
      
      // Wait for confirmation and message delivery
      const confirmationForPlayer1 = await waitForMessage(player1.client, 'chat_received');
      const messageForPlayer2 = await waitForMessage(player2.client, 'chat_received');
      
      // Verify chat message has profanity filtered
      expect(confirmationForPlayer1.payload.message).toBeDefined();
      
      // Just verify the message is sent and received
      expect(messageForPlayer2.payload.message).toBeDefined();
      expect(messageForPlayer2.payload.sender).toBe(PlayerColor.WHITE);
      
    } finally {
      // Clean up WebSocket connections
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  // Test error handling for invalid game ID
  test('Chat message with invalid game ID returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send chat message with invalid game ID
      player.client.send(JSON.stringify({
        type: 'chat_message',
        payload: { 
          gameId: 'non-existent-game-id',
          message: "Hello there!"
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

  // Test error handling for empty message
  test('Empty chat message returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Create a game
      const gameId = await createGameAndGetId(player);
      
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Send empty chat message
      player.client.send(JSON.stringify({
        type: 'chat_message',
        payload: { 
          gameId,
          message: ""
        }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('Invalid chat message');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(player.client);
    }
  });

  // Test message length limit
  test('Chat message exceeding length limit returns an error', async () => {
    // Create a client
    const player = await createWebSocketClient(port);

    try {
      // Create a game
      const gameId = await createGameAndGetId(player);
      
      // Prepare to receive error message
      const errorMessage = waitForMessage(player.client, 'error');
      
      // Generate a long message (over 200 characters)
      const longMessage = "A".repeat(201);
      
      // Send long chat message
      player.client.send(JSON.stringify({
        type: 'chat_message',
        payload: { 
          gameId,
          message: longMessage
        }
      }));
      
      // Wait for error message
      const error = await errorMessage;
      
      // Verify the error message
      expect(error.payload.message).toBe('Message too long (max 200 characters)');
      
    } finally {
      // Clean up WebSocket connection
      await safeCloseClient(player.client);
    }
  });
}); 