import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as path from 'path';
import cors from 'cors';
import { Request, Response } from 'express';
import { WebSocketController } from './websocket/websocket-controller';
import { ServerConfigProvider } from './config/provider';
import { RepositoryFactory } from './repositories';
import { ServiceFactory } from './services';

// Initialize config provider
const config = ServerConfigProvider.getInstance();

// Create repository
const gameRepository = RepositoryFactory.createGameRepository('memory');

// Create service factory and initialize game manager
const gameManager = ServiceFactory.getGameManager(gameRepository);

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// HTTP routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/config', (req: Request, res: Response) => {
  // Return client-safe subset of config
  const clientConfig = {
    timeControl: config.timeControl,
    gambitChess: {
      initialBP: config.gambitChess.initialBP,
      maxBPAllocation: config.gambitChess.maxBPAllocation,
      bpCapacities: config.gambitChess.bpCapacities,
      bpCapacityOverloadMultiplier: config.gambitChess.bpCapacityOverloadMultiplier,
      bpRegen: config.gambitChess.bpRegen,
      opponentBPChar: config.gambitChess.opponentBPChar
    },
    chat: {
      maxMessageLength: config.chat.maxMessageLength,
      profanityFilter: config.chat.profanityFilter
    }
  };
  
  res.json(clientConfig);
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize WebSocket controller with game manager
const wsController = new WebSocketController();
wsController.initialize(wss);

// Start server
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
  console.log(`WebSocket server available at ws://localhost:${port}`);
});

// Handle server shutdown
const gracefulShutdown = () => {
  console.log('Shutting down server...');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      console.error('Forcing server shutdown...');
      process.exit(1);
    }, 5000);
  });
};

// Register shutdown handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown();
});

export { app, server, wss }; 