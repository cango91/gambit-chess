import dotenv from 'dotenv';
import path from 'path';
import * as gameConfig from './gameConfig';

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Server configuration
const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Redis configuration
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  prefix: process.env.REDIS_PREFIX || 'gambit-chess:',
};

// Export combined configuration
export const config = {
  server: serverConfig,
  redis: redisConfig,
  game: gameConfig,
};

// Re-export game config for convenience
export * from './gameConfig'; 