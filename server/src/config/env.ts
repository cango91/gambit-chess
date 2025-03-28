import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  REDIS_URL: string;
  JWT_SECRET: string;
  SESSION_TTL: number; // in seconds
  CHESS_TIMEOUT: number; // in seconds
  INITIAL_BP: number;
  MAX_BP_ALLOCATION: number;
}

const env: EnvConfig = {
  PORT: +(process.env.PORT || 3001),
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'gambit-chess-secret-key',
  SESSION_TTL: +(process.env.SESSION_TTL || 86400), // 24 hours
  CHESS_TIMEOUT: +(process.env.CHESS_TIMEOUT || 300), // 5 minutes
  INITIAL_BP: +(process.env.INITIAL_BP || 39), // Default initial BP
  MAX_BP_ALLOCATION: +(process.env.MAX_BP_ALLOCATION || 10), // Maximum BP allocation per piece
};

export default env; 