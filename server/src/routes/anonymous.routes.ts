import express, { Request, Response, NextFunction } from 'express';
import AnonymousSessionService from '../services/anonymous-session.service';
import { z } from 'zod';

const router = express.Router();

// Rate limiting map to prevent session creation spam
const sessionCreationAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Validation schemas
const CreateSessionSchema = z.object({
  userAgent: z.string().optional(),
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
 * Rate limiting middleware for session creation
 */
function rateLimitSessionCreation(req: Request, res: Response, next: NextFunction) {
  const clientIP = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up old entries
  for (const [ip, data] of sessionCreationAttempts) {
    if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
      sessionCreationAttempts.delete(ip);
    }
  }
  
  // Check current attempts
  const attempts = sessionCreationAttempts.get(clientIP);
  if (attempts && attempts.count >= MAX_ATTEMPTS_PER_MINUTE && (now - attempts.lastAttempt) < RATE_LIMIT_WINDOW) {
    console.warn(`🚫 Rate limit exceeded for session creation from IP: ${clientIP}`);
    res.status(429).json({
      success: false,
      message: 'Too many session creation attempts. Please wait a minute.'
    });
    return;
  }
  
  // Update attempts
  sessionCreationAttempts.set(clientIP, {
    count: (attempts?.count || 0) + 1,
    lastAttempt: now
  });
  
  next();
}

/**
 * POST /api/anonymous/session
 * Create or reuse anonymous session (Cookie-based reconnection)
 */
router.post('/session', rateLimitSessionCreation, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = CreateSessionSchema.parse(req.body);
    
    // Get values from headers (same as WebSocket will use)
    const actualUserAgent = req.headers['user-agent'] || 'unknown';
    const actualAcceptLanguage = req.headers['accept-language'] as string || 'unknown';
    const actualXForwardedFor = req.ip;
    
    console.log(`🔍 HTTP Session Creation Fingerprint Components:`, {
      userAgent: actualUserAgent,
      acceptLanguage: actualAcceptLanguage,
      xForwardedFor: actualXForwardedFor
    });
    
    const clientFingerprint = AnonymousSessionService.generateClientFingerprint(
      actualUserAgent,
      actualAcceptLanguage,
      actualXForwardedFor
    );
    
    // PHASE 1: Check for existing session in cookies
    const existingToken = AnonymousSessionService.parseTokenFromRequest(req);
    if (existingToken) {
      console.log('🔄 Found existing session token in cookies, validating...');
      const validation = await AnonymousSessionService.validateSession(existingToken, clientFingerprint);
      
      if (validation) {
        console.log(`🔄 Reusing existing session: ${validation.sessionId}`);
        
        // Refresh the existing session and set new cookies
        const refreshedToken = await AnonymousSessionService.refreshSession(existingToken, clientFingerprint);
        if (refreshedToken) {
          AnonymousSessionService.setSessionCookies(res, refreshedToken);
          
          res.status(200).json({
            success: true,
            sessionToken: refreshedToken.sessionToken,
            sessionId: refreshedToken.sessionId,
            expiresAt: refreshedToken.expiresAt,
            reconnected: true,
          });
          return;
        }
      } else {
        console.log('🗑️ Existing session token invalid, creating new session');
        // Clear invalid cookies
        AnonymousSessionService.clearSessionCookies(res);
      }
    }
    
    // Create new session
    const sessionToken = await AnonymousSessionService.createSession(clientFingerprint);
    
    // Set secure session cookies (Phase 1: Cookie-based authentication)
    AnonymousSessionService.setSessionCookies(res, sessionToken);
    
    res.status(201).json({
      success: true,
      sessionToken: sessionToken.sessionToken,
      sessionId: sessionToken.sessionId,
      expiresAt: sessionToken.expiresAt,
      reconnected: false,
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
    
    // Update secure session cookies
    AnonymousSessionService.setSessionCookies(res, newSessionToken);
    
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
      
      // Clear session cookies
      AnonymousSessionService.clearSessionCookies(res);
      
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