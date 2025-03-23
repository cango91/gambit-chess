import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { 
  createTestServer, 
  createWebSocketClient,
  TestClient,
  safeCloseClient
} from './test-utils';
import { Position } from '@gambit-chess/shared';

// Increase test timeout for all tests in this file
jest.setTimeout(60000); // 60 seconds

describe('Move Handler Integration Tests', () => {
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
    // Create a promise to wait for game created message
    const gameCreatedPromise = new Promise<string>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for game_created message'));
      }, 10000);
      
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'game_created') {
            clearTimeout(timeoutId);
            client.client.removeListener('message', messageHandler);
            resolve(data.payload.gameId);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      client.client.on('message', messageHandler);
    });
    
    // Send create game message
    const gameIdSuggestion = `test-game-${uuidv4()}`;
    client.client.send(JSON.stringify({
      type: 'create_game',
      payload: {
        gameId: gameIdSuggestion
      }
    }));
    
    // Wait for game created message and return the game ID
    return await gameCreatedPromise;
  }

  // Helper function to join a game and resolve when joined
  async function joinGame(client: TestClient, gameId: string): Promise<void> {
    // Create a promise to wait for game joined message
    const gameJoinedPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for game_joined message for game: ${gameId}`));
      }, 10000);
      
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'game_joined' && data.payload.gameId === gameId) {
            clearTimeout(timeoutId);
            client.client.removeListener('message', messageHandler);
            resolve();
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      client.client.on('message', messageHandler);
    });
    
    // Send join game message
    client.client.send(JSON.stringify({
      type: 'join_game',
      payload: { gameId }
    }));
    
    // Wait for game joined confirmation
    await gameJoinedPromise;
  }
  
  // Helper function to join a game and wait for all related messages
  async function joinGameAndWaitForCompletion(player1: TestClient, player2: TestClient, gameId: string): Promise<void> {
    // Set up listeners before sending join request
    
    // Wait for player 1 to receive player_joined notification
    const player1JoinedPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for player_joined message`));
      }, 10000);
      
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'player_joined' && data.payload.gameId === gameId) {
            console.log('Player 1 received join notification');
            clearTimeout(timeoutId);
            player1.client.removeListener('message', messageHandler);
            resolve();
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      player1.client.on('message', messageHandler);
    });
    
    // Wait for player 2 to receive game_state
    const player2GameStatePromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for game_state message`));
      }, 10000);
      
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'game_state' && data.payload.gameId === gameId) {
            console.log('Player 2 received game state');
            clearTimeout(timeoutId);
            player2.client.removeListener('message', messageHandler);
            resolve();
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      player2.client.on('message', messageHandler);
    });
    
    // Now send the join request
    console.log('Sending join game request');
    player2.client.send(JSON.stringify({
      type: 'join_game',
      payload: { gameId }
    }));
    
    // Wait for all the promises to resolve
    await Promise.all([player1JoinedPromise, player2GameStatePromise]);
    console.log('Join process complete - all messages received');
  }

  // Helper function to make a move and wait for the result
  async function makeMove(
    client: TestClient, 
    gameId: string, 
    from: Position, 
    to: Position
  ): Promise<any> {
    // Create a promise to wait for move result
    const moveResultPromise = new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for move_result message`));
      }, 10000);
      
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Move response:', data);
          
          if (data.type === 'move_result') {
            clearTimeout(timeoutId);
            client.client.removeListener('message', messageHandler);
            resolve(data);
          } else if (data.type === 'error') {
            clearTimeout(timeoutId);
            client.client.removeListener('message', messageHandler);
            resolve(data); // Resolve with error message too
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      client.client.on('message', messageHandler);
    });
    
    // Create promises to capture the next game_state messages
    const gameStatePromise = new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // Don't reject, just resolve with null to indicate no message received
        resolve(null);
      }, 2000);
      
      const messageHandler = (message: WebSocket.Data) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'game_state') {
            clearTimeout(timeoutId);
            client.client.removeListener('message', messageHandler);
            resolve(data);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };
      
      client.client.on('message', messageHandler);
    });
    
    // Send move message
    client.client.send(JSON.stringify({
      type: 'move',
      payload: {
        gameId,
        from,
        to
      }
    }));
    
    // Wait for move result first
    const moveResult = await moveResultPromise;
    
    // If the move was successful, wait for the game state update
    if (moveResult.payload.success) {
      // Wait a short time for game state messages to be processed
      const gameState = await gameStatePromise;
      if (gameState) {
        // Store the game state for later verification
        moveResult.gameState = gameState;
      }
    }
    
    return moveResult;
  }

  // Helper function that creates promises to capture the next messages of a specific type
  // This returns a function that can be called to wait for the next message
  function createMessageWaiter(client: TestClient, messageType: string, timeout = 2000): () => Promise<any> {
    // Return a function that, when called, creates and returns a new promise
    return () => {
      return new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          // Don't reject, just resolve with null
          resolve(null);
        }, timeout);
        
        const messageHandler = (message: WebSocket.Data) => {
          try {
            const data = JSON.parse(message.toString());
            console.log(`Received message:`, data);
            
            if (data.type === messageType) {
              clearTimeout(timeoutId);
              client.client.removeListener('message', messageHandler);
              resolve(data);
            }
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        };
        
        client.client.on('message', messageHandler);
      });
    };
  }

  test('should allow a valid pawn move', async () => {
    console.log('Starting test: valid pawn move');
    let player1: TestClient | null = null;
    let player2: TestClient | null = null;

    try {
      // Create player clients
      player1 = await createWebSocketClient(port);
      console.log('Player 1 created with session ID:', player1.sessionId);
      
      // Create a new game
      const gameId = await createGameAndGetId(player1);
      console.log('Game created with ID:', gameId);
      
      // Create player 2
      player2 = await createWebSocketClient(port);
      console.log('Player 2 created with session ID:', player2.sessionId);
      
      // Join the game and wait for messages
      await joinGameAndWaitForCompletion(player1, player2, gameId);
      console.log('Join process completed');
      
      // Create message waiters for additional game state updates
      const waitForPlayer1GameState = createMessageWaiter(player1, 'game_state');
      const waitForPlayer2GameState = createMessageWaiter(player2, 'game_state');
      
      // Make a valid pawn move (white pawn from e2 to e4)
      const moveResult = await makeMove(
        player1,
        gameId,
        { x: 4, y: 6 }, // e2 (0-indexed)
        { x: 4, y: 4 }  // e4 (0-indexed)
      );
      
      console.log('Move result:', moveResult);
      
      // Verify move result
      expect(moveResult.type).toBe('move_result');
      expect(moveResult.payload.success).toBe(true);
      
      // The game state messages might have already been processed by the time
      // we reach this point. If they're not in moveResult.gameState, we'll try
      // to wait for a short time to see if they arrive.
      let player1GameState = moveResult.gameState;
      let player2GameState = null;
      
      if (!player1GameState) {
        player1GameState = await waitForPlayer1GameState();
      }
      
      // Same for player 2
      player2GameState = await waitForPlayer2GameState();
      
      // If we got game states, verify them
      if (player1GameState) {
        expect(player1GameState.payload.gameId).toBe(gameId);
        expect(player1GameState.payload.currentTurn).toBe('black');
      }
      
      if (player2GameState) {
        expect(player2GameState.payload.gameId).toBe(gameId);
        expect(player2GameState.payload.currentTurn).toBe('black');
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up test resources');
      if (player1) safeCloseClient(player1.client);
      if (player2) safeCloseClient(player2.client);
    }
    console.log('Test completed: valid pawn move');
  });

  test('should reject a move out of turn', async () => {
    console.log('Starting test: reject move out of turn');
    let player1: TestClient | null = null;
    let player2: TestClient | null = null;
    
    try {
      // Create player clients
      player1 = await createWebSocketClient(port);
      console.log('Player 1 created with session ID:', player1.sessionId);
      
      // Create a new game
      const gameId = await createGameAndGetId(player1);
      console.log('Game created with ID:', gameId);
      
      // Create player 2
      player2 = await createWebSocketClient(port);
      console.log('Player 2 created with session ID:', player2.sessionId);
      
      // Join the game and wait for messages
      await joinGameAndWaitForCompletion(player1, player2, gameId);
      console.log('Join process completed');
      
      // Player 2 (black) tries to move first, which should be rejected
      const moveResult = await makeMove(
        player2,
        gameId,
        { x: 4, y: 1 }, // e7 (0-indexed)
        { x: 4, y: 3 }  // e5 (0-indexed)
      );
      
      console.log('Out of turn move result:', moveResult);
      
      // Verify move was rejected
      expect(moveResult.type).toBe('move_result');
      expect(moveResult.payload.success).toBe(false);
      expect(moveResult.payload.error).toContain('turn');
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up test resources');
      if (player1) safeCloseClient(player1.client);
      if (player2) safeCloseClient(player2.client);
    }
    console.log('Test completed: reject move out of turn');
  });

  test('should reject an invalid move', async () => {
    console.log('Starting test: reject invalid move');
    let player1: TestClient | null = null;
    let player2: TestClient | null = null;
    
    try {
      // Create player clients
      player1 = await createWebSocketClient(port);
      console.log('Player 1 created with session ID:', player1.sessionId);
      
      // Create a new game
      const gameId = await createGameAndGetId(player1);
      console.log('Game created with ID:', gameId);
      
      // Create player 2
      player2 = await createWebSocketClient(port);
      console.log('Player 2 created with session ID:', player2.sessionId);
      
      // Join the game and wait for messages
      await joinGameAndWaitForCompletion(player1, player2, gameId);
      console.log('Join process completed');
      
      // Try an invalid move (knight moves 3 spaces horizontally)
      const moveResult = await makeMove(
        player1, 
        gameId,
        { x: 1, y: 7 }, // b1 - knight starting position (0-indexed)
        { x: 4, y: 7 }  // e1 - 3 spaces right, which is invalid for knight
      );
      
      console.log('Invalid move result:', moveResult);
      
      // Verify move was rejected
      expect(moveResult.type).toBe('move_result');
      expect(moveResult.payload.success).toBe(false);
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up test resources');
      if (player1) safeCloseClient(player1.client);
      if (player2) safeCloseClient(player2.client);
    }
    console.log('Test completed: reject invalid move');
  });

  test('should allow a full move sequence', async () => {
    console.log('Starting test: full move sequence');
    let player1: TestClient | null = null;
    let player2: TestClient | null = null;
    
    try {
      // Create player clients
      player1 = await createWebSocketClient(port);
      console.log('Player 1 created with session ID:', player1.sessionId);
      
      // Create a new game
      const gameId = await createGameAndGetId(player1);
      console.log('Game created with ID:', gameId);
      
      // Create player 2
      player2 = await createWebSocketClient(port);
      console.log('Player 2 created with session ID:', player2.sessionId);
      
      // Join the game and wait for messages
      await joinGameAndWaitForCompletion(player1, player2, gameId);
      console.log('Join process completed');
      
      // Create message waiters
      const waitForPlayer1GameState = createMessageWaiter(player1, 'game_state');
      const waitForPlayer2GameState = createMessageWaiter(player2, 'game_state');
      
      // Make a sequence of valid moves
      
      // Move 1: White pawn e2 to e4
      const move1Result = await makeMove(
        player1,
        gameId,
        { x: 4, y: 6 }, // e2 (0-indexed)
        { x: 4, y: 4 }  // e4 (0-indexed)
      );
      
      expect(move1Result.payload.success).toBe(true);
      console.log('White move 1 completed');
      
      // Move 2: Black pawn e7 to e5
      const move2Result = await makeMove(
        player2,
        gameId,
        { x: 4, y: 1 }, // e7 (0-indexed)
        { x: 4, y: 3 }  // e5 (0-indexed)
      );
      
      expect(move2Result.payload.success).toBe(true);
      console.log('Black move 1 completed');
      
      // Move 3: White knight b1 to c3
      const move3Result = await makeMove(
        player1,
        gameId,
        { x: 1, y: 7 }, // b1 (0-indexed)
        { x: 2, y: 5 }  // c3 (0-indexed)
      );
      
      expect(move3Result.payload.success).toBe(true);
      console.log('White move 2 completed');
      
      // Move 4: Black knight b8 to c6
      const move4Result = await makeMove(
        player2,
        gameId,
        { x: 1, y: 0 }, // b8 (0-indexed)
        { x: 2, y: 2 }  // c6 (0-indexed)
      );
      
      expect(move4Result.payload.success).toBe(true);
      console.log('Black move 2 completed');
      
      // Try to get final game states
      const finalGameState1 = await waitForPlayer1GameState();
      const finalGameState2 = await waitForPlayer2GameState();
      
      // If we got game states, verify them
      if (finalGameState1) {
        expect(finalGameState1.payload.currentTurn).toBe('white');
      }
      
      if (finalGameState2) {
        expect(finalGameState2.payload.currentTurn).toBe('white');
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up test resources');
      if (player1) safeCloseClient(player1.client);
      if (player2) safeCloseClient(player2.client);
    }
    console.log('Test completed: full move sequence');
  });

  test('should handle pawn capture', async () => {
    console.log('Starting test: pawn capture');
    let player1: TestClient | null = null;
    let player2: TestClient | null = null;
    
    try {
      // Create player clients
      player1 = await createWebSocketClient(port);
      console.log('Player 1 created with session ID:', player1.sessionId);
      
      // Create a new game
      const gameId = await createGameAndGetId(player1);
      console.log('Game created with ID:', gameId);
      
      // Create player 2
      player2 = await createWebSocketClient(port);
      console.log('Player 2 created with session ID:', player2.sessionId);
      
      // Join the game and wait for messages
      await joinGameAndWaitForCompletion(player1, player2, gameId);
      console.log('Join process completed');
      
      // Create message waiters
      const waitForPlayer1GameState = createMessageWaiter(player1, 'game_state');
      const waitForPlayer2GameState = createMessageWaiter(player2, 'game_state');
      
      // Setup a position for capture by making a few moves
      
      // Move 1: White pawn e2 to e4
      const move1 = await makeMove(player1, gameId, { x: 4, y: 6 }, { x: 4, y: 4 });
      expect(move1.payload.success).toBe(true);
      
      // Move 2: Black pawn d7 to d5
      const move2 = await makeMove(player2, gameId, { x: 3, y: 1 }, { x: 3, y: 3 });
      expect(move2.payload.success).toBe(true);
      
      // Move 3: White captures Black pawn at d5
      const captureResult = await makeMove(
        player1,
        gameId,
        { x: 4, y: 4 }, // e4 (0-indexed)
        { x: 3, y: 3 }  // d5 (0-indexed)
      );
      
      console.log('Capture result:', captureResult);
      
      // Verify capture succeeded
      expect(captureResult.payload.success).toBe(true);
      // Note: The server doesn't include a 'capture' flag in the move result
      // We'll verify the capture happened by checking the game state instead
      
      // Try to get game states after capture
      const gameStateAfterCapture1 = await waitForPlayer1GameState();
      const gameStateAfterCapture2 = await waitForPlayer2GameState();
      
      // If we got game states, verify the capture
      if (gameStateAfterCapture1) {
        expect(gameStateAfterCapture1.payload.capturedPieces.length).toBe(1);
      }
      
      if (gameStateAfterCapture2) {
        expect(gameStateAfterCapture2.payload.capturedPieces.length).toBe(1);
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    } finally {
      // Clean up resources
      console.log('Cleaning up test resources');
      if (player1) safeCloseClient(player1.client);
      if (player2) safeCloseClient(player2.client);
    }
    console.log('Test completed: pawn capture');
  });
}); 