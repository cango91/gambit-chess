import WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { createTestServer, safeCloseClient } from './test-utils';

// Increase test timeout
jest.setTimeout(60000);

describe('WebSocket Connection Tests', () => {
  let server: any;
  let port: number;
  let wss: WebSocketServer;
  let closeServer: () => Promise<void>;
  
  beforeAll(async () => {
    console.log('Starting test server...');
    const testServer = await createTestServer();
    server = testServer.server;
    wss = testServer.wss;
    port = testServer.port;
    closeServer = testServer.closeServer;
    console.log(`Test server started on port ${port}`);
  });
  
  afterAll(async () => {
    console.log('Cleaning up test resources...');
    if (closeServer) {
      await closeServer();
      console.log('Test server closed');
    }
  });
  
  test('should establish a WebSocket connection and receive a session ID', async () => {
    console.log('Creating WebSocket client');
    
    // Create a Promise to capture session data
    const sessionPromise = new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for session message'));
      }, 10000);
      
      // Create client and set up handlers BEFORE connecting
      const client = new WebSocket(`ws://localhost:${port}`);
      
      // Set up error handler
      client.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(timeoutId);
        reject(error);
      });
      
      // Set up message handler BEFORE connection opens
      client.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received message:', data);
          
          if (data.type === 'session') {
            clearTimeout(timeoutId);
            resolve({ client, data });
          }
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      });
      
      // Set up open handler
      client.on('open', () => {
        console.log('WebSocket connection opened');
      });
      
      // Set up close handler
      client.on('close', (code, reason) => {
        console.log(`WebSocket closed with code ${code}, reason: ${reason}`);
      });
      
      // If client fails to connect, handle it
      client.on('unexpected-response', (req, res) => {
        console.error(`Unexpected response: ${res.statusCode}`);
        clearTimeout(timeoutId);
        reject(new Error(`Unexpected response: ${res.statusCode}`));
      });
    });
    
    try {
      // Wait for session data
      const { client, data: sessionData } = await sessionPromise;
      
      // Verify session data
      expect(sessionData).toBeDefined();
      expect(sessionData.type).toBe('session');
      expect(sessionData.payload).toBeDefined();
      expect(sessionData.payload.sessionId).toBeDefined();
      console.log(`Received session ID: ${sessionData.payload.sessionId}`);
      
      // Clean up
      safeCloseClient(client);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });
}); 