import express, { Request, Response, NextFunction } from 'express';
import AnonymousSessionService from '../services/anonymous-session.service';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const CreateSessionSchema = z.object({
  userAgent: z.string(),
  acceptLanguage: z.string().optional(),
  xForwardedFor: z.string().optional(),
});

const RefreshSessionSchema = z.object({
  sessionToken: z.string(),
  userAgent: z.string(),
  acceptLanguage: z.string().optional(),
  xForwardedFor: z.string().optional(),
});

/**
 * POST /api/anonymous/session
 * Create a new anonymous session
 */
router.post('/session', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userAgent, acceptLanguage, xForwardedFor } = CreateSessionSchema.parse(req.body);
    
    // Generate client fingerprint
    const clientFingerprint = AnonymousSessionService.generateClientFingerprint(
      userAgent,
      acceptLanguage || req.headers['accept-language'] as string,
      xForwardedFor || req.ip
    );
    
    // Create new session
    const sessionToken = await AnonymousSessionService.createSession(clientFingerprint);
    
    res.status(201).json({
      success: true,
      sessionToken: sessionToken.sessionToken,
      sessionId: sessionToken.sessionId,
      expiresAt: sessionToken.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid input', 
        errors: error.errors 
      });
      return;
    }
    console.error('Anonymous session creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * POST /api/anonymous/refresh
 * Refresh an anonymous session
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionToken, userAgent, acceptLanguage, xForwardedFor } = RefreshSessionSchema.parse(req.body);
    
    // Generate client fingerprint
    const clientFingerprint = AnonymousSessionService.generateClientFingerprint(
      userAgent,
      acceptLanguage || req.headers['accept-language'] as string,
      xForwardedFor || req.ip
    );
    
    // Refresh session
    const newSessionToken = await AnonymousSessionService.refreshSession(sessionToken, clientFingerprint);
    
    if (!newSessionToken) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid or expired session' 
      });
      return;
    }
    
    res.json({
      success: true,
      sessionToken: newSessionToken.sessionToken,
      sessionId: newSessionToken.sessionId,
      expiresAt: newSessionToken.expiresAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid input', 
        errors: error.errors 
      });
      return;
    }
    console.error('Anonymous session refresh error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * GET /api/anonymous/session/:sessionId/stats
 * Get session statistics (for debugging)
 */
router.get('/session/:sessionId/stats', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const stats = await AnonymousSessionService.getSessionStats(sessionId);
    
    if (!stats) {
      res.status(404).json({ 
        success: false,
        message: 'Session not found' 
      });
      return;
    }
    
    res.json({
      success: true,
      stats: {
        sessionId: stats.sessionId,
        createdAt: stats.createdAt,
        lastActivity: stats.lastActivity,
        gamesPlayed: stats.gamesPlayed,
        // Don't expose client fingerprint for security
      },
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/anonymous/session
 * Revoke an anonymous session
 */
router.delete('/session', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sessionToken, userAgent, acceptLanguage, xForwardedFor } = req.body;
    
    if (!sessionToken) {
      res.status(400).json({ 
        success: false,
        message: 'Session token required' 
      });
      return;
    }
    
    // Generate client fingerprint
    const clientFingerprint = AnonymousSessionService.generateClientFingerprint(
      userAgent || req.headers['user-agent'] as string,
      acceptLanguage || req.headers['accept-language'] as string,
      xForwardedFor || req.ip
    );
    
    // Validate session before revoking
    const validation = await AnonymousSessionService.validateSession(sessionToken, clientFingerprint);
    
    if (validation) {
      await AnonymousSessionService.revokeSession(validation.sessionId);
      res.json({ 
        success: true,
        message: 'Session revoked successfully' 
      });
    } else {
      res.status(401).json({ 
        success: false,
        message: 'Invalid session' 
      });
    }
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

export default router; 