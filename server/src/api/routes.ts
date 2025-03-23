import { Express } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { GameEngine } from '../engine/GameEngine';

/**
 * Set up API routes for the Express app
 */
export function setupApiRoutes(app: Express): void {
  /**
   * Create a new game via HTTP (WebSocket is preferred)
   */
  app.post('/api/games/create', async (req, res) => {
    try {
      const { againstAI = false, aiDifficulty = 'intermediate' } = req.body;
      
      // Create a new game ID
      const gameId = uuidv4();
      
      // Initialize a new game
      const gameEngine = new GameEngine(gameId);
      await gameEngine.initialize({
        againstAI,
        aiDifficulty
      });
      
      // Respond with game ID
      res.status(201).json({
        gameId,
        success: true
      });
    } catch (err) {
      logger.error('Error creating game via API', { error: err });
      res.status(500).json({
        success: false,
        error: 'Failed to create game'
      });
    }
  });
} 