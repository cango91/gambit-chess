/**
 * Redis configuration
 * Centralizes Redis connection settings
 */

/**
 * Redis connection URL
 * Defaults to localhost but can be overridden by environment variables
 */
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Redis connection options
 */
export const REDIS_OPTIONS = {
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries: number) => {
      // Reconnect with exponential backoff
      return Math.min(retries * 50, 3000); // Max 3 seconds between retries
    }
  }
};

/**
 * Redis key prefixes for different data types
 */
export const REDIS_KEYS = {
  GAME_PREFIX: 'gambit:game:',
  ACTIVE_GAMES: 'gambit:active-games',
  PLAYER_PREFIX: 'gambit:player:',
  SESSION_PREFIX: 'gambit:session:',
  SPECTATOR_PREFIX: 'gambit:spectator:'
};

/**
 * Redis data TTL settings (in seconds)
 */
export const REDIS_TTL = {
  GAME_STATE: 24 * 60 * 60, // 24 hours
  PLAYER_SESSION: 2 * 60 * 60, // 2 hours
  SPECTATOR_SESSION: 1 * 60 * 60 // 1 hour
}; 