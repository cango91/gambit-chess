import dotenv from 'dotenv';
import path from 'path';
import { IGameConfig } from '../interfaces/IGameConfig';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Environment configuration
 */
export const env = {
  PORT: +(process.env.PORT || 3001),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'gambit-chess-secret-key',
  SESSION_TTL: +(process.env.SESSION_TTL || 86400), // 24 hours
  CHESS_TIMEOUT: +(process.env.CHESS_TIMEOUT || 300), // 5 minutes
  INITIAL_BP: +(process.env.INITIAL_BP || 39), // Default initial BP
  MAX_BP_ALLOCATION: +(process.env.MAX_BP_ALLOCATION || 10), // Maximum BP allocation per piece
};

/**
 * Redis connection options
 */
export const REDIS_OPTIONS = {
  url: env.REDIS_URL,
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

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: IGameConfig = {
  initialBpPool: env.INITIAL_BP,
  maxBpCapacity: env.MAX_BP_ALLOCATION,
  initialTimeWhite: 600000, // 10 minutes
  initialTimeBlack: 600000, // 10 minutes
  timeIncrement: 3000, // 3 seconds
  allowSpectators: true,
  spectatorDelay: 0,
  reconnectionWindow: 30000, // 30 seconds
  checkBpRegeneration: 2,
  standardPosition: true,
  enforceDrawRules: true
}; 