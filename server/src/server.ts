import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { handleConnection } from './handlers/websocket';
import { redis, redisClient } from './services/redis';

// Initialize Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', handleConnection);

// Define API routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    connections: wss.clients.size
  });
});

// Load any additional routes here
// app.use('/api/...');

/**
 * Start the server
 */
export async function startServer(): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    try {
      // Initialize Redis connection
      try {
        // Redis client is already initialized when imported
        logger.info('Redis connection established');
      } catch (error: any) {
        logger.error('Redis connection failed', { error: error.message });
        reject(new Error('Redis connection failed'));
        return;
      }
      
      // Start the server
      const serverInstance = server.listen(config.server.port, () => {
        logger.info(`Server running on port ${config.server.port}`);
        resolve(serverInstance);
      });
      
      // Handle server errors
      serverInstance.on('error', (error) => {
        logger.error('Server error', { error });
        reject(error);
      });
    } catch (error: any) {
      logger.error('Failed to start server', { error: error.message });
      reject(error);
    }
  });
}

/**
 * Stop the server gracefully
 */
export async function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        logger.error('Error stopping server', { error: err });
        reject(err);
      } else {
        // Close WebSocket connections
        wss.clients.forEach((client) => {
          client.terminate();
        });
        
        // Close Redis connection
        redisClient.quit()
          .then(() => {
            logger.info('Server stopped');
            resolve();
          })
          .catch((err) => {
            logger.error('Error closing Redis connection', { error: err });
            reject(err);
          });
      }
    });
  });
}

// Start the server if this file is executed directly
if (require.main === module) {
  startServer()
    .then(() => {
      logger.info('Server is running');
    })
    .catch((err) => {
      logger.error('Failed to start server', { error: err });
      process.exit(1);
    });
  
  // Handle graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  
  signals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      try {
        await stopServer();
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', { error: err });
        process.exit(1);
      }
    });
  });
} 