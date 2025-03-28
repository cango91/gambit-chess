import { createClient } from 'redis';
import env from '../config/env';

/**
 * Redis client for managing game state and session data
 */
class RedisService {
  private client;

  constructor() {
    this.client = createClient({
      url: env.REDIS_URL
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  /**
   * Connect to Redis server
   */
  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  /**
   * Store data with expiration
   */
  async set(key: string, value: any, expirationInSeconds = env.SESSION_TTL): Promise<void> {
    await this.client.set(key, JSON.stringify(value), {
      EX: expirationInSeconds
    });
  }

  /**
   * Retrieve data by key
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  /**
   * Delete data by key
   */
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  /**
   * Set expiration time for a key
   */
  async expire(key: string, expirationInSeconds: number): Promise<void> {
    await this.client.expire(key, expirationInSeconds);
  }
}

// Singleton instance
const redisService = new RedisService();

export default redisService; 