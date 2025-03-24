import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { 
  createTestServer, 
  createWebSocketClient,
  TestClient,
  safeCloseClient,
  waitForMessage,
  collectMessages
} from './test-utils';
import { PlayerRole, PlayerColor } from '@gambit-chess/shared';
// Define message interface types
interface GameMessage {
  type: string;
  payload: {
    gameId?: string;
    playerRole?: string;
    timestamp?: number;
    [key: string]: any;
  };
}

interface PlayerJoinedMessage {
  type: 'player_joined';
  payload: {
    gameId: string;
    playerRole: string;
    timestamp: number;
  };
}

// Type guard function
function isPlayerJoinedMessage(msg: any): msg is PlayerJoinedMessage {
  return msg && msg.type === 'player_joined' && msg.payload && 
    typeof msg.payload.gameId === 'string' && 
    typeof msg.payload.playerRole === 'string';
}

// Increase test timeout for all tests in this file
jest.setTimeout(60000); // 60 seconds

describe('Join Game Integration Tests', () => {
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
  
  // Track active clients across tests to ensure they're all closed
  const activeClients: WebSocket[] = [];
  
  // Helper to track clients for cleanup
  const trackClient = (client: TestClient) => {
    activeClients.push(client.client);
    return client;
  };
  
  afterAll(async () => {
    // Cleanup resources
    console.log('Cleaning up test resources...');
    try {
      // Close all active WebSocket connections first
      console.log(`Closing ${activeClients.length} active WebSocket connections...`);
      const closePromises = activeClients.map(client => safeCloseClient(client));
      await Promise.all(closePromises);
      
      // Then close the server
      if (closeServer) {
        await closeServer();
        console.log('Test server closed');
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  // Override the createWebSocketClient function to track clients
  async function createTrackedClient(port: number): Promise<TestClient> {
    const client = await createWebSocketClient(port);
    return trackClient(client);
  }

  // Helper function to create a game and return the game ID
  async function createGameAndGetId(client: TestClient): Promise<string> {
    const gameIdSuggestion = `test-game-${uuidv4()}`;
    
    client.client.send(JSON.stringify({
      type: 'create_game',
      payload: {
        gameId: gameIdSuggestion
      }
    }));
    
    const response = await waitForMessage(client.client, 'game_created');
    console.log('Created game with ID:', response.payload.gameId);
    return response.payload.gameId;
  }

  // Helper to wait for specific message type
  async function waitForSpecificMessage(client: TestClient, messageType: string, timeoutMs = 5000): Promise<any> {
    console.log(`Waiting for message type: ${messageType}...`);
    
    return new Promise((resolve, reject) => {
      const messages: any[] = [];
      let timeoutId: NodeJS.Timeout;
      
      const onMessage = (message: WebSocket.Data) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          console.log(`Received message while waiting: ${parsedMessage.type}`);
          
          if (parsedMessage.type === messageType) {
            console.log(`Found ${messageType} message!`);
            clearTimeout(timeoutId);
            client.client.removeListener('message', onMessage);
            resolve(parsedMessage);
          } else {
            messages.push(parsedMessage);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      // Add message listener
      client.client.on('message', onMessage);
      
      // Set timeout
      timeoutId = setTimeout(() => {
        client.client.removeListener('message', onMessage);
        console.log(`Timeout waiting for ${messageType}. Other messages received:`, 
          messages.map(m => m.type));
        reject(new Error(`Timed out waiting for ${messageType}`));
      }, timeoutMs);
    });
  }

  test('should allow a player to join an existing game as white', async () => {
    // Create a player client
    const player1 = await createTrackedClient(port);
    console.log('Created player1 with session ID:', player1.sessionId);
    
    try {
      // Create a game
      const gameId = await createGameAndGetId(player1);
      
      // Send join game request
      player1.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId
        }
      }));
      
      // Collect messages (both game_joined and game_state)
      const messages = await collectMessages(player1.client, 3000);
      console.log('Collected messages:', messages.map(m => m.type));
      
      // Verify join confirmation
      const joinConfirmation = messages.find(m => m.type === 'game_joined');
      expect(joinConfirmation).toBeDefined();
      expect(joinConfirmation.payload.gameId).toBe(gameId);
      expect(joinConfirmation.payload.playerRole).toBe(PlayerRole.PLAYER_WHITE);
      expect(joinConfirmation.payload.success).toBe(true);
      
      // Verify game state
      const gameState = messages.find(m => m.type === 'game_state');
      expect(gameState).toBeDefined();
      expect(gameState.payload.gameId).toBe(gameId);
      expect(gameState.payload.playerRole).toBe(PlayerRole.PLAYER_WHITE);
      expect(gameState.payload.currentTurn).toBe(PlayerColor.WHITE);
    } finally {
      // Clean up resources
      safeCloseClient(player1.client);
    }
  });

  test('should allow a second player to join an existing game as black', async () => {
    // Create two player clients for this test
    const player1 = await createTrackedClient(port);
    const player2 = await createTrackedClient(port);
    
    try {
      // Create a game with player1
      const gameId = await createGameAndGetId(player1);
      
      // Player 1 joins as white
      player1.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId
        }
      }));
      
      // Wait for player 1 to join
      await collectMessages(player1.client, 2000);
      
      // Add an explicit listener for player_joined before player2 joins
      let playerJoinedMessage: any = null;
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'player_joined') {
            playerJoinedMessage = data;
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      player1.client.on('message', messageHandler);
      
      // Player 2 joins the game
      player2.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId
        }
      }));
      
      // Collect messages for player 2
      const player2Messages = await collectMessages(player2.client, 3000);
      
      // Wait a bit longer to ensure notification reaches player1
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clean up the listener
      player1.client.removeListener('message', messageHandler);
      
      // Verify player 2 join confirmation
      const joinConfirmation = player2Messages.find(m => m.type === 'game_joined');
      expect(joinConfirmation).toBeDefined();
      expect(joinConfirmation.payload.gameId).toBe(gameId);
      expect(joinConfirmation.payload.playerRole).toBe(PlayerRole.PLAYER_BLACK);
      expect(joinConfirmation.payload.success).toBe(true);
      
      // Verify player 2 game state
      const gameState = player2Messages.find(m => m.type === 'game_state');
      expect(gameState).toBeDefined();
      expect(gameState.payload.gameId).toBe(gameId);
      expect(gameState.payload.playerRole).toBe(PlayerRole.PLAYER_BLACK);
      
      // Check for player joined notification
      expect(playerJoinedMessage).toBeDefined();
      expect(playerJoinedMessage.type).toBe('player_joined');
      expect(playerJoinedMessage.payload.gameId).toBe(gameId);
      expect(playerJoinedMessage.payload.playerRole).toBe(PlayerRole.PLAYER_BLACK);
    } finally {
      // Clean up resources
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
    }
  });

  test('should allow a third player to join an existing game as spectator', async () => {
    // Create three player clients for this test
    const player1 = await createTrackedClient(port);
    const player2 = await createTrackedClient(port);
    const spectator = await createTrackedClient(port);
    
    try {
      // Create a game with player1
      const gameId = await createGameAndGetId(player1);
      
      // Player 1 joins as white
      player1.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId
        }
      }));
      
      // Wait for player 1 to join
      await collectMessages(player1.client, 2000);
      
      // Player 2 joins as black
      player2.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId
        }
      }));
      
      // Wait for player 2 to join
      await collectMessages(player2.client, 2000);
      
      // Add explicit listeners for player_joined notifications
      let player1Notification: any = null;
      let player2Notification: any = null;
      
      const player1MessageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'player_joined' && data.payload.playerRole === PlayerRole.SPECTATOR) {
            player1Notification = data;
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      const player2MessageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'player_joined' && data.payload.playerRole === PlayerRole.SPECTATOR) {
            player2Notification = data;
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      player1.client.on('message', player1MessageHandler);
      player2.client.on('message', player2MessageHandler);
      
      // Spectator joins the game
      spectator.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId
        }
      }));
      
      // Collect messages for spectator
      const spectatorMessages = await collectMessages(spectator.client, 3000);
      
      // Wait a bit longer to ensure notifications reach players
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clean up listeners
      player1.client.removeListener('message', player1MessageHandler);
      player2.client.removeListener('message', player2MessageHandler);
      
      // Verify spectator join confirmation
      const joinConfirmation = spectatorMessages.find(m => m.type === 'game_joined');
      expect(joinConfirmation).toBeDefined();
      expect(joinConfirmation.payload.gameId).toBe(gameId);
      expect(joinConfirmation.payload.playerRole).toBe(PlayerRole.SPECTATOR);
      expect(joinConfirmation.payload.success).toBe(true);
      
      // Verify spectator game state
      const gameState = spectatorMessages.find(m => m.type === 'game_state');
      expect(gameState).toBeDefined();
      expect(gameState.payload.gameId).toBe(gameId);
      expect(gameState.payload.playerRole).toBe(PlayerRole.SPECTATOR);
      
      // Check player joined notifications were received
      expect(player1Notification).toBeDefined();
      expect(player1Notification?.payload.gameId).toBe(gameId);
      
      expect(player2Notification).toBeDefined();
      expect(player2Notification?.payload.gameId).toBe(gameId);
    } finally {
      // Clean up resources
      await safeCloseClient(player1.client);
      await safeCloseClient(player2.client);
      await safeCloseClient(spectator.client);
    }
  });

  test('should handle joining a non-existent game', async () => {
    const player = await createTrackedClient(port);
    
    try {
      // Try to join a non-existent game
      player.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId: 'non-existent-game-id'
        }
      }));
      
      const errorMessage = await waitForMessage(player.client, 'error');
      expect(errorMessage.payload.message).toBe('Game not found');
    } finally {
      // Clean up resources
      await safeCloseClient(player.client);
    }
  });

  test('should handle invalid join game request (missing gameId)', async () => {
    const player = await createTrackedClient(port);
    
    try {
      // Send invalid join game request without gameId
      player.client.send(JSON.stringify({
        type: 'join_game',
        payload: {}
      }));
      
      const errorMessage = await waitForMessage(player.client, 'error');
      expect(errorMessage.payload.message).toBe('Game ID is required');
    } finally {
      // Clean up resources
      await safeCloseClient(player.client);
    }
  });
}); 