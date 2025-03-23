import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { 
  createTestServer, 
  createWebSocketClient,
  TestClient,
  safeCloseClient
} from './test-utils';

// Increase test timeout for all tests in this file
jest.setTimeout(60000); // 60 seconds

describe('Game Flow Integration Tests', () => {
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
  
  test('should create a new game successfully', async () => {
    console.log('Starting test: create a new game');
    let player1: TestClient | null = null;
    
    try {
      // Create client
      player1 = await createWebSocketClient(port);
      console.log('Player 1 client created with session ID:', player1.sessionId);
      
      // Generate a unique game ID suggestion (server may generate its own)
      const gameIdSuggestion = `test-game-${uuidv4()}`;
      console.log(`Creating game with suggested ID: ${gameIdSuggestion}`);
      
      // Create a promise to wait for game created message
      const gameCreatedPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timeout waiting for game_created message`));
        }, 10000);
        
        const messageHandler = (message: WebSocket.Data) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);
            
            if (data.type === 'game_created') {
              clearTimeout(timeoutId);
              player1!.client.removeListener('message', messageHandler);
              resolve(data);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };
        
        player1!.client.on('message', messageHandler);
      });
      
      // Send create game message
      player1.client.send(JSON.stringify({
        type: 'create_game',
        payload: {
          gameId: gameIdSuggestion
        }
      }));
      
      // Wait for game created message
      const gameCreatedMessage = await gameCreatedPromise;
      console.log('Game created successfully:', gameCreatedMessage);
      
      // Verify game creation
      expect(gameCreatedMessage).toBeDefined();
      expect(gameCreatedMessage.type).toBe('game_created');
      expect(gameCreatedMessage.payload.gameId).toBeDefined();
      expect(gameCreatedMessage.payload.success).toBe(true);
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up player 1 client');
      if (player1) {
        safeCloseClient(player1.client);
      }
    }
    console.log('Test completed: create a new game');
  });
  
  test('should allow a player to join an existing game', async () => {
    console.log('Starting test: join existing game');
    let player1: TestClient | null = null;
    let player2: TestClient | null = null;
    
    try {
      // Create clients
      console.log('Creating player 1 client');
      player1 = await createWebSocketClient(port);
      console.log('Creating player 2 client');
      player2 = await createWebSocketClient(port);
      
      // Create a game with player 1
      const gameIdSuggestion = `test-game-${uuidv4()}`;
      console.log(`Creating game with suggested ID: ${gameIdSuggestion}`);
      
      // Setup promise to listen for game created
      const gameCreatedPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timeout waiting for game_created message`));
        }, 10000);
        
        const messageHandler = (message: WebSocket.Data) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Player 1 received message:', data);
            
            if (data.type === 'game_created') {
              clearTimeout(timeoutId);
              player1!.client.removeListener('message', messageHandler);
              resolve(data);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };
        
        player1!.client.on('message', messageHandler);
      });
      
      // Send create game message
      player1.client.send(JSON.stringify({
        type: 'create_game',
        payload: { gameId: gameIdSuggestion }
      }));
      
      // Wait for game created confirmation
      const gameCreated = await gameCreatedPromise;
      console.log('Game created, now player 2 will join');
      
      // Get the actual game ID assigned by the server
      const actualGameId = gameCreated.payload.gameId;
      console.log(`Using server-assigned game ID: ${actualGameId}`);
      
      // Setup promise for joining game
      const gameJoinedPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timeout waiting for game_joined message for game: ${actualGameId}`));
        }, 10000);
        
        const messageHandler = (message: WebSocket.Data) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Player 2 received message:', data);
            
            if (data.type === 'game_joined' && data.payload.gameId === actualGameId) {
              clearTimeout(timeoutId);
              player2!.client.removeListener('message', messageHandler);
              resolve(data);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };
        
        player2!.client.on('message', messageHandler);
      });
      
      // Setup promise for player joined notification on player 1
      const playerJoinedPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timeout waiting for player_joined message for game: ${actualGameId}`));
        }, 10000);
        
        const messageHandler = (message: WebSocket.Data) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Player 1 received notification:', data);
            
            if (data.type === 'player_joined' && data.payload.gameId === actualGameId) {
              clearTimeout(timeoutId);
              player1!.client.removeListener('message', messageHandler);
              resolve(data);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };
        
        player1!.client.on('message', messageHandler);
      });
      
      // Player 2 joins the game
      player2.client.send(JSON.stringify({
        type: 'join_game',
        payload: { gameId: actualGameId }
      }));
      
      // Wait for game joined and player joined in parallel
      const [joinedMessage, playerJoinedMessage] = await Promise.all([
        gameJoinedPromise,
        playerJoinedPromise
      ]);
      
      console.log('Game join successful');
      
      // Verify join was successful
      expect(joinedMessage).toBeDefined();
      expect(joinedMessage.type).toBe('game_joined');
      expect(joinedMessage.payload.gameId).toBe(actualGameId);
      expect(joinedMessage.payload.success).toBe(true);
      
      // Verify player 1 was notified
      expect(playerJoinedMessage).toBeDefined();
      expect(playerJoinedMessage.type).toBe('player_joined');
      expect(playerJoinedMessage.payload.gameId).toBe(actualGameId);
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up player clients');
      if (player1) {
        safeCloseClient(player1.client);
      }
      if (player2) {
        safeCloseClient(player2.client);
      }
    }
    console.log('Test completed: join existing game');
  });
  
  test('should reject joining a non-existent game', async () => {
    console.log('Starting test: reject non-existent game');
    let player: TestClient | null = null;
    
    try {
      // Create client
      console.log('Creating player client');
      player = await createWebSocketClient(port);
      
      // Generate a non-existent game ID
      const nonExistentGameId = `non-existent-${uuidv4()}`;
      console.log(`Attempting to join non-existent game: ${nonExistentGameId}`);
      
      // Setup promise for error message
      const errorPromise = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`Timeout waiting for error message`));
        }, 10000);
        
        const messageHandler = (message: WebSocket.Data) => {
          try {
            const data = JSON.parse(message.toString());
            console.log('Received message:', data);
            
            if (data.type === 'error') {
              clearTimeout(timeoutId);
              player!.client.removeListener('message', messageHandler);
              resolve(data);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };
        
        player!.client.on('message', messageHandler);
      });
      
      // Send join game message for non-existent game
      player.client.send(JSON.stringify({
        type: 'join_game',
        payload: {
          gameId: nonExistentGameId
        }
      }));
      
      // Wait for error message
      const errorMessage = await errorPromise;
      console.log('Received expected error message');
      
      // Verify error response
      expect(errorMessage).toBeDefined();
      expect(errorMessage.type).toBe('error');
      expect(errorMessage.payload.message).toContain('not found');
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up player client');
      if (player) {
        safeCloseClient(player.client);
      }
    }
    console.log('Test completed: reject non-existent game');
  });
}); 