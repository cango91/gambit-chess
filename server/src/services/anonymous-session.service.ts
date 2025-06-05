import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RedisService } from './redis.service';

const ANONYMOUS_SESSION_SECRET = process.env.ANONYMOUS_SESSION_SECRET || 'anonymous-session-secret-change-in-production';
const ANONYMOUS_SESSION_TTL = 24 * 60 * 60; // 24 hours in seconds
const SESSION_KEY_PREFIX = 'anon_session:';

export interface AnonymousSessionData {
  sessionId: string;
  clientFingerprint: string;
  createdAt: number;
  lastActivity: number;
  gamesPlayed: number;
}

export interface AnonymousSessionToken {
  sessionToken: string;
  sessionId: string;
  expiresAt: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: number;
}

/**
 * Secure Anonymous Session Service
 * Provides cryptographically signed sessions for anonymous users
 * Prevents session hijacking through signed tokens and fingerprinting
 */
export class AnonymousSessionService {
  
  /**
   * Create a new anonymous session with signed token
   */
  static async createSession(clientFingerprint: string): Promise<AnonymousSessionToken> {
    // Create new session (fingerprinting kept for tracking only, not session reuse)
    const sessionId = crypto.randomUUID();
    const createdAt = Date.now();
    const expiresAt = createdAt + (ANONYMOUS_SESSION_TTL * 1000);
    
    // Store session data in Redis
    const sessionData: AnonymousSessionData = {
      sessionId,
      clientFingerprint,
      createdAt,
      lastActivity: createdAt,
      gamesPlayed: 0,
    };
    
    await RedisService.setWithTTL(
      `${SESSION_KEY_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      ANONYMOUS_SESSION_TTL
    );
    
    // Generate signed JWT token
    const sessionToken = jwt.sign(
      {
        sessionId,
        clientFingerprint,
        type: 'anonymous',
        iat: Math.floor(createdAt / 1000),
        exp: Math.floor(expiresAt / 1000),
      },
      ANONYMOUS_SESSION_SECRET,
      { algorithm: 'HS256' }
    );
    
    console.log(`Created anonymous session: ${sessionId} for fingerprint: ${clientFingerprint.substring(0, 8)}...`);
    
    return {
      sessionToken,
      sessionId,
      expiresAt,
    };
  }

  /**
   * Create session with refresh token support (Phase 2 ready)
   */
  static async createSessionWithRefresh(clientFingerprint: string): Promise<TokenPair> {
    const sessionId = crypto.randomUUID();
    const createdAt = Date.now();
    const accessExpiresAt = createdAt + (15 * 60 * 1000); // 15 minutes
    const refreshExpiresAt = createdAt + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Store session data in Redis
    const sessionData: AnonymousSessionData = {
      sessionId,
      clientFingerprint,
      createdAt,
      lastActivity: createdAt,
      gamesPlayed: 0,
    };
    
    await RedisService.setWithTTL(
      `${SESSION_KEY_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      ANONYMOUS_SESSION_TTL
    );
    
    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        sessionId,
        clientFingerprint,
        type: 'anonymous',
        tokenType: 'access',
        iat: Math.floor(createdAt / 1000),
        exp: Math.floor(accessExpiresAt / 1000),
      },
      ANONYMOUS_SESSION_SECRET,
      { algorithm: 'HS256' }
    );
    
    // Generate refresh token (long-lived)
    const refreshToken = jwt.sign(
      {
        sessionId,
        clientFingerprint,
        type: 'anonymous',
        tokenType: 'refresh',
        iat: Math.floor(createdAt / 1000),
        exp: Math.floor(refreshExpiresAt / 1000),
      },
      ANONYMOUS_SESSION_SECRET,
      { algorithm: 'HS256' }
    );
    
    console.log(`Created anonymous session with refresh: ${sessionId} for fingerprint: ${clientFingerprint.substring(0, 8)}...`);
    
    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresAt: accessExpiresAt,
    };
  }
  
  /**
   * Find existing session by client fingerprint
   */
  static async findSessionByFingerprint(clientFingerprint: string): Promise<{ sessionId: string; sessionData: AnonymousSessionData } | null> {
    try {
      const redis = await RedisService.getRedisClient();
      const keys = await redis.keys(`${SESSION_KEY_PREFIX}*`);
      
      for (const key of keys) {
        const sessionDataJson = await redis.get(key);
        if (sessionDataJson) {
          const sessionData = JSON.parse(sessionDataJson) as AnonymousSessionData;
          if (sessionData.clientFingerprint === clientFingerprint) {
            return {
              sessionId: sessionData.sessionId,
              sessionData,
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error finding session by fingerprint:', error);
      return null;
    }
  }

  /**
   * Validate an anonymous session token
   */
  static async validateSession(sessionToken: string, clientFingerprint: string): Promise<{ sessionId: string; sessionData: AnonymousSessionData } | null> {
    try {
      // Verify JWT signature and expiration
      const decoded = jwt.verify(sessionToken, ANONYMOUS_SESSION_SECRET) as any;
      
      if (decoded.type !== 'anonymous') {
        return null;
      }
      
      // Verify client fingerprint matches
      if (decoded.clientFingerprint !== clientFingerprint) {
        console.warn(`Anonymous session fingerprint mismatch: ${decoded.sessionId}`);
        return null;
      }
      
      // Get session data from Redis
      const sessionKey = `${SESSION_KEY_PREFIX}${decoded.sessionId}`;
      const sessionDataJson = await RedisService.get(sessionKey);
      
      if (!sessionDataJson) {
        console.warn(`Anonymous session not found in Redis: ${decoded.sessionId}`);
        return null;
      }
      
      const sessionData = JSON.parse(sessionDataJson) as AnonymousSessionData;
      
      // Update last activity
      sessionData.lastActivity = Date.now();
      await RedisService.setWithTTL(sessionKey, JSON.stringify(sessionData), ANONYMOUS_SESSION_TTL);
      
      return {
        sessionId: decoded.sessionId,
        sessionData,
      };
    } catch (error) {
      console.warn('Invalid anonymous session token:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  
  /**
   * Refresh an anonymous session (extend TTL)
   */
  static async refreshSession(sessionToken: string, clientFingerprint: string): Promise<AnonymousSessionToken | null> {
    const validation = await this.validateSession(sessionToken, clientFingerprint);
    if (!validation) {
      return null;
    }
    
    const { sessionId, sessionData } = validation;
    const now = Date.now();
    const expiresAt = now + (ANONYMOUS_SESSION_TTL * 1000);
    
    // Update session data
    sessionData.lastActivity = now;
    await RedisService.setWithTTL(
      `${SESSION_KEY_PREFIX}${sessionId}`,
      JSON.stringify(sessionData),
      ANONYMOUS_SESSION_TTL
    );
    
    // Generate new signed token
    const newSessionToken = jwt.sign(
      {
        sessionId,
        clientFingerprint,
        type: 'anonymous',
        iat: Math.floor(now / 1000),
        exp: Math.floor(expiresAt / 1000),
      },
      ANONYMOUS_SESSION_SECRET,
      { algorithm: 'HS256' }
    );
    
    return {
      sessionToken: newSessionToken,
      sessionId,
      expiresAt,
    };
  }
  
  /**
   * Increment games played counter
   */
  static async incrementGamesPlayed(sessionId: string): Promise<void> {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const sessionDataJson = await RedisService.get(sessionKey);
    
    if (sessionDataJson) {
      const sessionData = JSON.parse(sessionDataJson) as AnonymousSessionData;
      sessionData.gamesPlayed += 1;
      sessionData.lastActivity = Date.now();
      
      await RedisService.setWithTTL(sessionKey, JSON.stringify(sessionData), ANONYMOUS_SESSION_TTL);
    }
  }
  
  /**
   * Revoke an anonymous session (for security)
   */
  static async revokeSession(sessionId: string): Promise<void> {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    await RedisService.del(sessionKey);
    console.log(`Revoked anonymous session: ${sessionId}`);
  }
  
  /**
   * Get session statistics
   */
  static async getSessionStats(sessionId: string): Promise<AnonymousSessionData | null> {
    const sessionKey = `${SESSION_KEY_PREFIX}${sessionId}`;
    const sessionDataJson = await RedisService.get(sessionKey);
    
    if (!sessionDataJson) {
      return null;
    }
    
    return JSON.parse(sessionDataJson) as AnonymousSessionData;
  }
  
  /**
   * Parse session token from cookies or headers (transport-agnostic)
   */
  static parseTokenFromRequest(req: any): string | null {
    // Try cookies first (web clients)
    if (req.cookies?.gambit_session) {
      return req.cookies.gambit_session;
    }
    
    // Try Authorization header (mobile clients - Phase 2)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  }

  /**
   * Set secure session cookies (web clients)
   */
  static setSessionCookies(res: any, tokens: TokenPair | AnonymousSessionToken): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if ('accessToken' in tokens) {
      // Refresh token pair
      res.cookie('gambit_session', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      res.cookie('gambit_refresh', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    } else {
      // Legacy single token
      res.cookie('gambit_session', tokens.sessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: ANONYMOUS_SESSION_TTL * 1000,
      });
    }
    
    console.log(`🍪 Set secure session cookies for session: ${tokens.sessionId}`);
  }

  /**
   * Clear session cookies (logout)
   */
  static clearSessionCookies(res: any): void {
    res.clearCookie('gambit_session');
    res.clearCookie('gambit_refresh');
    console.log(`🍪 Cleared session cookies`);
  }

  /**
   * Generate client fingerprint from request headers
   */
  static generateClientFingerprint(userAgent: string, acceptLanguage: string, xForwardedFor?: string): string {
    const components = [
      userAgent || 'unknown',
      acceptLanguage || 'unknown',
      xForwardedFor || 'unknown',
    ];
    
    return crypto
      .createHash('sha256')
      .update(components.join('|'))
      .digest('hex');
  }
  
  /**
   * Clean up expired sessions (maintenance task)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const redis = await RedisService.getRedisClient();
      const keys = await redis.keys(`${SESSION_KEY_PREFIX}*`);
      
      let cleanedCount = 0;
      const now = Date.now();
      
      for (const key of keys) {
        const sessionDataJson = await redis.get(key);
        if (sessionDataJson) {
          const sessionData = JSON.parse(sessionDataJson) as AnonymousSessionData;
          const ageHours = (now - sessionData.lastActivity) / (1000 * 60 * 60);
          
          // Clean up sessions inactive for more than 48 hours
          if (ageHours > 48) {
            await redis.del(key);
            cleanedCount++;
          }
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} expired anonymous sessions`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up anonymous sessions:', error);
      return 0;
    }
  }
}

export default AnonymousSessionService; 