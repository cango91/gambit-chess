import { Server } from 'http';
import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { AddressInfo } from 'net';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setupWebSocketHandlers } from '../../src/services/websocket';
import { setupApiRoutes } from '../../src/api/routes';
import { disconnectRedis } from '../../src/services/redis';

// Type-safe client interface that guarantees non-null status
export interface TestClient {
  client: WebSocket;
  sessionId: string;
}

// Track any intervals created so we can clean them up
const intervalIds: NodeJS.Timeout[] = [];

// Monkey patch setInterval to track it
const originalSetInterval = global.setInterval;
// @ts-ignore - We're intentionally creating a simplified version for testing
global.setInterval = function(callback: any, ms?: number, ...args: any[]): NodeJS.Timeout {
  const intervalId = originalSetInterval(callback, ms, ...args);
  intervalIds.push(intervalId);
  return intervalId;
};

/**
 * Test utility to create a test server with WebSocket and HTTP support
 */
export async function createTestServer(): Promise<{
  server: Server;
  wss: WebSocketServer;
  port: number;
  url: string;
  closeServer: () => Promise<void>;
}> {
  // Create express app
  const app = express();
  app.use(express.json());
  
  // Setup API routes
  setupApiRoutes(app);
  
  // Create HTTP server
  const server = app.listen(0); // Use random available port
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server });
  setupWebSocketHandlers(wss);
  
  // Wait for server to start listening
  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });
  
  // Get assigned port
  const address = server.address() as AddressInfo;
  const port = address.port;
  const url = `http://localhost:${port}`;
  
  // Create cleanup function
  const closeServer = async (): Promise<void> => {
    console.log('Cleaning up resources...');
    
    // Clear all intervals first
    intervalIds.forEach(id => {
      clearInterval(id);
      console.log(`Cleared interval ${id}`);
    });
    
    // Close all WebSocket connections first
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.terminate(); // Force close
      }
    });

    // Close WebSocket server
    await new Promise<void>((resolve, reject) => {
      wss.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Close HTTP server
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    try {
      // Disconnect Redis
      await disconnectRedis();
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
    
    console.log('Server closed successfully');
  };
  
  return { server, wss, port, url, closeServer };
}

/**
 * Create a WebSocket client and connect to server
 */
export async function createWebSocketClient(port: number): Promise<TestClient> {
  console.log(`Creating WebSocket client connecting to port ${port}`);
  
  // Create a promise that will resolve with the session ID
  const sessionPromise = new Promise<{ client: WebSocket; sessionId: string }>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout waiting for session ID'));
    }, 10000);
    
    // Create client
    const client = new WebSocket(`ws://localhost:${port}`);
    
    // Set up error handler
    client.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearTimeout(timeoutId);
      reject(error);
    });
    
    // Set up message handler BEFORE connection opens
    const messageHandler = (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Processing message for session ID extraction:', data);
        if (data.type === 'session') {
          clearTimeout(timeoutId);
          client.removeListener('message', messageHandler);
          console.log(`Received session ID: ${data.payload.sessionId}`);
          resolve({ client, sessionId: data.payload.sessionId });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    client.on('message', messageHandler);
    
    // Handle debug logs for this client
    client.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Raw WebSocket message received:', message);
      } catch (err) {
        console.log('Raw non-JSON message received:', data);
      }
    });
    
    // Set up open handler
    client.on('open', () => {
      console.log('WebSocket connection opened');
    });
    
    // Handle close
    client.on('close', (code, reason) => {
      console.log(`WebSocket closed with code ${code}, reason: ${reason || 'none'}`);
    });
  });
  
  // Wait for the connection and session ID
  const { client, sessionId } = await sessionPromise;
  
  return { client, sessionId };
}

/**
 * Safely close a WebSocket client connection if it exists and is open
 */
export function safeCloseClient(client: WebSocket | null): void {
  if (!client) return;
  
  try {
    if (client.readyState === WebSocket.OPEN) {
      client.close();
      console.log('WebSocket client closed gracefully');
    } else if (client.readyState === WebSocket.CONNECTING) {
      client.terminate();
      console.log('WebSocket client terminated while connecting');
    }
  } catch (err) {
    console.error('Error closing WebSocket client:', err);
    // Force terminate as fallback
    try {
      client.terminate();
    } catch (e) {
      console.error('Failed to terminate WebSocket client:', e);
    }
  }
}

/**
 * Create a test game
 */
export async function createTestGame(
  client: WebSocket,
  options: { againstAI?: boolean; aiDifficulty?: string } = {}
): Promise<{ gameId: string }> {
  const gameId = `test-game-${uuidv4()}`;
  
  // Send create game message
  client.send(JSON.stringify({
    type: 'create_game',
    payload: {
      gameId,
      ...options
    }
  }));
  
  // Wait for game created confirmation
  await new Promise<void>((resolve) => {
    const messageHandler = (message: any) => {
      const data = JSON.parse(message.toString());
      if (data.type === 'game_created' && data.payload.gameId === gameId) {
        client.removeListener('message', messageHandler);
        resolve();
      }
    };
    
    client.on('message', messageHandler);
  });
  
  return { gameId };
}

/**
 * Join an existing game
 */
export async function joinTestGame(
  client: WebSocket,
  gameId: string
): Promise<void> {
  // Send join game message
  client.send(JSON.stringify({
    type: 'join_game',
    payload: {
      gameId
    }
  }));
  
  // Wait for game joined confirmation
  await new Promise<void>((resolve) => {
    const messageHandler = (message: any) => {
      const data = JSON.parse(message.toString());
      if (data.type === 'game_joined' && data.payload.gameId === gameId) {
        client.removeListener('message', messageHandler);
        resolve();
      }
    };
    
    client.on('message', messageHandler);
  });
}

/**
 * Utility to make a move in a game
 */
export async function makeMove(
  client: WebSocket,
  gameId: string,
  from: { x: number; y: number },
  to: { x: number; y: number }
): Promise<any> {
  // Send move message
  client.send(JSON.stringify({
    type: 'move',
    payload: {
      gameId,
      from,
      to
    }
  }));
  
  // Wait for move confirmation
  return new Promise<any>((resolve) => {
    const messageHandler = (message: any) => {
      const data = JSON.parse(message.toString());
      if ((data.type === 'move_result' || data.type === 'error') && 
          data.payload.gameId === gameId) {
        client.removeListener('message', messageHandler);
        resolve(data);
      }
    };
    
    client.on('message', messageHandler);
  });
}

/**
 * Collect all WebSocket messages for a period
 */
export async function collectMessages(
  client: WebSocket,
  timeoutMs: number = 500
): Promise<any[]> {
  const messages: any[] = [];
  
  // Setup message collector
  const messageHandler = (message: any) => {
    try {
      const data = JSON.parse(message.toString());
      messages.push(data);
    } catch (err) {
      // Ignore non-JSON messages
    }
  };
  
  client.on('message', messageHandler);
  
  // Wait for specified timeout
  await new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  
  // Clean up listener
  client.removeListener('message', messageHandler);
  
  return messages;
}

/**
 * Wait for a specific message type
 */
export async function waitForMessage(
  client: WebSocket, 
  messageType: string,
  timeoutMs: number = 5000
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      client.removeListener('message', messageHandler);
      reject(new Error(`Timeout waiting for message type: ${messageType}`));
    }, timeoutMs);
    
    const messageHandler = (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === messageType) {
          clearTimeout(timeoutId);
          client.removeListener('message', messageHandler);
          resolve(data);
        }
      } catch (err) {
        // Ignore parse errors
      }
    };
    
    client.on('message', messageHandler);
  });
} 