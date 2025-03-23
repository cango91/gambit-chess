import { createClient } from 'redis';
import { logger } from '../../utils/logger';
import { config } from '../../config';

// Create Redis client with connection URL from config
export const redisClient = createClient({
  url: config.redis.url,
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  logger.error('Redis error', { error: err });
});

// Log when Redis connects
redisClient.on('connect', () => {
  logger.info('Redis connected');
});

// Log when Redis reconnects
redisClient.on('reconnect', () => {
  logger.info('Redis reconnected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
  }
})();

// Export Redis connection functions
export * as matchmaking from './matchmaking';

// Import all Redis services to be used by the application
import './matchmaking'; 