import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Create Redis client from environment variables
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisClient = new Redis(redisUrl);

// Set up event handlers
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
});

// Key prefixes for better organization
const KEY_PREFIXES = {
  GAME: 'game:',
  SESSION: 'session:',
  PLAYER: 'player:',
  MATCHMAKING: 'matchmaking:'
};

// Helper functions for working with Redis
export const redis = {
  /**
   * Set a key with expiration
   */
  async set(key: string, value: any, expirySeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (expirySeconds) {
      await redisClient.set(key, stringValue, 'EX', expirySeconds);
    } else {
      await redisClient.set(key, stringValue);
    }
  },

  /**
   * Get a value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    const value = await redisClient.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return value as unknown as T;
    }
  },

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    await redisClient.del(key);
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result === 1;
  },

  /**
   * Set expiry on a key
   */
  async expire(key: string, seconds: number): Promise<void> {
    await redisClient.expire(key, seconds);
  },

  // Game-specific helpers
  game: {
    /**
     * Get a game by ID
     */
    async get(gameId: string): Promise<any> {
      return redis.get(`${KEY_PREFIXES.GAME}${gameId}`);
    },

    /**
     * Save a game
     */
    async save(gameId: string, gameData: any, expirySeconds = 86400): Promise<void> {
      await redis.set(`${KEY_PREFIXES.GAME}${gameId}`, gameData, expirySeconds);
    },

    /**
     * Delete a game
     */
    async delete(gameId: string): Promise<void> {
      await redis.del(`${KEY_PREFIXES.GAME}${gameId}`);
    }
  },

  // Session-specific helpers
  session: {
    /**
     * Get a session by ID
     */
    async get(sessionId: string): Promise<any> {
      return redis.get(`${KEY_PREFIXES.SESSION}${sessionId}`);
    },

    /**
     * Save a session
     */
    async save(sessionId: string, sessionData: any, expirySeconds = 86400): Promise<void> {
      await redis.set(`${KEY_PREFIXES.SESSION}${sessionId}`, sessionData, expirySeconds);
    },

    /**
     * Delete a session
     */
    async delete(sessionId: string): Promise<void> {
      await redis.del(`${KEY_PREFIXES.SESSION}${sessionId}`);
    }
  },

  // Matchmaking-specific helpers
  matchmaking: {
    /**
     * Add a player to the matchmaking queue
     */
    async addToQueue(sessionId: string): Promise<void> {
      await redisClient.sadd(`${KEY_PREFIXES.MATCHMAKING}queue`, sessionId);
    },

    /**
     * Remove a player from the matchmaking queue
     */
    async removeFromQueue(sessionId: string): Promise<void> {
      await redisClient.srem(`${KEY_PREFIXES.MATCHMAKING}queue`, sessionId);
    },

    /**
     * Get all players in the matchmaking queue
     */
    async getQueue(): Promise<string[]> {
      return redisClient.smembers(`${KEY_PREFIXES.MATCHMAKING}queue`);
    }
  }
}; 