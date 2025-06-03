import express, { Request, Response, NextFunction } from 'express';
import GameService, { CreateGameOptions } from '../services/game.service';
import { authenticateToken, AuthenticatedRequest } from '../auth/jwt';
import AnonymousSessionService from '../services/anonymous-session.service';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const CreateGameSchema = z.object({
  gameType: z.enum(['ai', 'human', 'practice']),
  aiDifficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  colorPreference: z.enum(['white', 'black', 'random']).optional().default('white'),
  anonymousSessionToken: z.string().optional(),
  whitePlayerId: z.string().optional(),
  blackPlayerId: z.string().optional(),
});

const JoinGameSchema = z.object({
  gameId: z.string().uuid(),
  anonymousSessionToken: z.string().optional(),
});

/**
 * Helper function to validate anonymous session
 */
async function validateAnonymousSession(req: Request): Promise<{ sessionId: string; sessionData: any } | null> {
  const sessionToken = req.body.anonymousSessionToken || req.query.anonymousSessionToken;
  
  if (!sessionToken) {
    return null;
  }
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  const acceptLanguage = req.headers['accept-language'] as string;
  const xForwardedFor = req.ip;
  
  const clientFingerprint = AnonymousSessionService.generateClientFingerprint(
    userAgent,
    acceptLanguage,
    xForwardedFor
  );
  
  return await AnonymousSessionService.validateSession(sessionToken as string, clientFingerprint);
}

/**
 * POST /api/games
 * Create a new game
 */
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = CreateGameSchema.parse(req.body);
    
    // Check if user is authenticated (for registered games)
    const authUser = (req as AuthenticatedRequest).user;
    
    // Validate anonymous session if provided
    let anonymousSession = null;
    if (validatedData.anonymousSessionToken) {
      anonymousSession = await validateAnonymousSession(req);
      if (!anonymousSession) {
        res.status(401).json({ message: 'Invalid anonymous session' });
        return;
      }
    }
    
    const options: CreateGameOptions = {
      gameType: validatedData.gameType,
      aiDifficulty: validatedData.aiDifficulty,
      colorPreference: validatedData.colorPreference,
    };

    // Handle different game creation scenarios
    if (validatedData.gameType === 'ai') {
      if (authUser) {
        // Authenticated user vs AI
        options.whitePlayerId = authUser.userId;
      } else if (anonymousSession) {
        // Anonymous user vs AI
        options.anonymousUserId = anonymousSession.sessionId;
        // Increment games played counter
        await AnonymousSessionService.incrementGamesPlayed(anonymousSession.sessionId);
      } else {
        res.status(400).json({ message: 'Either login or provide valid anonymous session for AI games' });
        return;
      }
    } else if (validatedData.gameType === 'human') {
      if (!authUser) {
        res.status(401).json({ message: 'Authentication required for human vs human games' });
        return;
      }
      options.whitePlayerId = authUser.userId;
      // blackPlayerId will be set when someone joins
    } else if (validatedData.gameType === 'practice') {
      if (authUser) {
        options.whitePlayerId = authUser.userId;
      } else if (anonymousSession) {
        options.anonymousUserId = anonymousSession.sessionId;
        await AnonymousSessionService.incrementGamesPlayed(anonymousSession.sessionId);
      } else {
        res.status(400).json({ message: 'Either login or provide valid anonymous session for practice games' });
        return;
      }
    }

    const result = await GameService.createGame(options);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid input', errors: error.errors });
      return;
    }
    console.error('Game creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/games/:gameId
 * Get game state
 */
router.get('/:gameId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const gameId = req.params.gameId;
    
    // Get requesting user ID (could be authenticated user or anonymous session)
    const authUser = (req as AuthenticatedRequest).user;
    let requestingUserId = authUser?.userId;
    
    // Check for anonymous session
    if (!requestingUserId) {
      const anonymousSession = await validateAnonymousSession(req);
      if (anonymousSession) {
        requestingUserId = anonymousSession.sessionId;
      }
    }

    const gameState = await GameService.getGameState(gameId, requestingUserId);
    
    if (!gameState) {
      res.status(404).json({ message: 'Game not found' });
      return;
    }

    res.json(gameState);
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/games/waiting
 * Get all games waiting for players (for discovery/matchmaking)
 */
router.get('/waiting', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const waitingGames = await GameService.getWaitingGames();
    res.json({ games: waitingGames });
  } catch (error) {
    console.error('Get waiting games error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/games
 * Get user's games
 */
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authUser = (req as AuthenticatedRequest).user;
    
    let userId: string;
    let isAnonymous = false;
    
    if (authUser) {
      userId = authUser.userId;
    } else {
      // Check for anonymous session
      const anonymousSession = await validateAnonymousSession(req);
      if (!anonymousSession) {
        res.status(400).json({ message: 'Either login or provide valid anonymous session to get games' });
        return;
      }
      userId = anonymousSession.sessionId;
      isAnonymous = true;
    }

    const games = await GameService.getUserGames(userId, isAnonymous);
    res.json({ games });
  } catch (error) {
    console.error('Get user games error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/games/:gameId/join
 * Join an existing game
 */
router.post('/:gameId/join', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const gameId = req.params.gameId;
    const authUser = (req as AuthenticatedRequest).user;
    
    let playerId: string;
    let isAnonymous = false;
    
    if (authUser) {
      playerId = authUser.userId;
    } else {
      // Check for anonymous session
      const anonymousSession = await validateAnonymousSession(req);
      if (!anonymousSession) {
        res.status(400).json({ message: 'Either login or provide valid anonymous session to join games' });
        return;
      }
      playerId = anonymousSession.sessionId;
      isAnonymous = true;
      
      // Increment games played counter
      await AnonymousSessionService.incrementGamesPlayed(anonymousSession.sessionId);
    }

    const gameState = await GameService.joinGame(gameId, playerId, isAnonymous);
    
    if (!gameState) {
      res.status(400).json({ message: 'Cannot join game - game not found, not waiting for players, or already full' });
      return;
    }

    res.json(gameState);
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 