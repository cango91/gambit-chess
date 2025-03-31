/**
 * Gambit Chess Server
 * Main entry point for the server application
 */

import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config';
import { ServiceFactory } from './services/factory';
// Commented out until WebSocketController is fully implemented
// import { WebSocketController } from './controllers/WebSocketController';

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

// Initialize services
const serviceFactory = ServiceFactory.getInstance();

// Get services (these will be initialized on demand)
const gameManager = serviceFactory.getGameManager(env.NODE_ENV !== 'test');
const playerSessionManager = serviceFactory.getPlayerSessionManager();

// TODO: Initialize WebSocketController with dependencies
// Currently commented out because methods don't match existing implementation
// const webSocketController = new WebSocketController(io, gameManager, playerSessionManager);
// gameManager.setEventDispatcher(webSocketController);

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

// API routes for game creation and joining
app.post('/api/games', async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerName } = req.body;
    const sanitizedName = playerName?.toString().substring(0, 30) || 'Anonymous';
    
    // Create a new game and register player
    const gameId = await gameManager.createGame();
    const playerId = uuidv4();
    
    // Register player
    playerSessionManager.registerPlayer(playerId, {
      displayName: sanitizedName
    });
    
    // Add player to game
    const playerColor = await gameManager.addPlayerToGame(gameId, playerId);
    
    if (!playerColor) {
      res.status(500).json({ error: 'Failed to add player to game' });
      return;
    }
    
    res.status(201).json({
      gameId,
      playerId,
      playerColor: playerColor.toString(),
      message: 'Game created successfully'
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.post('/api/games/:gameId/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { playerName } = req.body;
    const sanitizedName = playerName?.toString().substring(0, 30) || 'Anonymous';
    
    // Register new player
    const playerId = uuidv4();
    playerSessionManager.registerPlayer(playerId, {
      displayName: sanitizedName
    });
    
    // Add player to game
    const playerColor = await gameManager.addPlayerToGame(gameId, playerId);
    
    if (!playerColor) {
      res.status(400).json({ error: 'Failed to join game' });
      return;
    }
    
    res.status(200).json({
      gameId,
      playerId,
      playerColor: playerColor.toString(),
      message: 'Joined game successfully'
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(400).json({ error: 'Failed to join game' });
  }
});

app.post('/api/games/:gameId/spectate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.params;
    const { spectatorName } = req.body;
    const sanitizedName = spectatorName?.toString().substring(0, 30) || 'Spectator';
    
    // Generate spectator ID
    const spectatorId = uuidv4();
    
    // Add spectator to game
    const success = await gameManager.addSpectator(gameId, spectatorId);
    
    if (!success) {
      res.status(400).json({ error: 'Failed to join as spectator' });
      return;
    }
    
    res.status(200).json({
      gameId,
      spectatorId,
      message: 'Joined as spectator successfully'
    });
  } catch (error) {
    console.error('Error joining as spectator:', error);
    res.status(400).json({ error: 'Failed to join as spectator' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Clean up services
  await serviceFactory.cleanup();
  
  process.exit(0);
});

// Start server
server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  console.log(`Game manager initialized with ${env.NODE_ENV !== 'test' ? 'Redis' : 'in-memory'} storage`);
});

export default server; 