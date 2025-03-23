import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger';
import { setupWebSocketHandlers } from './services/websocket';
import { setupApiRoutes } from './api/routes';
import { redisClient } from './services/redis';
import { startServer } from './server';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// HTTP Server setup
const server = createServer(app);

// WebSocket Server setup
const wss = new WebSocket.Server({ server });

// Setup API routes
setupApiRoutes(app);

// Setup WebSocket handlers
setupWebSocketHandlers(wss);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Home route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Gambit Chess Server',
    version: '1.0.0',
    status: 'running'
  });
});

// Start the server
startServer()
  .then(() => {
    logger.info('Server successfully started');
  })
  .catch((err) => {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close WebSocket server
  wss.close(() => {
    logger.info('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close Redis connection
    redisClient.quit().then(() => {
      logger.info('Redis connection closed');
      process.exit(0);
    }).catch(err => {
      logger.error('Error closing Redis connection', err);
      process.exit(1);
    });
  });
}); 