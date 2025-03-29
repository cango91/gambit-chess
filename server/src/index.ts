/**
 * Gambit Chess Server
 * Main entry point for the server application
 */

import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import env from './config/env';
import redisService from './services/redis';

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to specific domains
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to Redis
(async () => {
  try {
    await redisService.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
})();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic route
app.get('/', (_req: Request, res: Response): void => {
  res.send('Gambit Chess Server');
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', environment: env.NODE_ENV });
});

// Socket.IO connection setup is now handled by WebSocketController

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Disconnect from Redis
  await redisService.disconnect();
  
  process.exit(0);
});

// Start server
server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

export default server; 