import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let client: RedisClientType | null = null;
let isConnecting = false;

async function getRedisClient(): Promise<RedisClientType> {
  if (client && client.isOpen) {
    return client;
  }

  if (isConnecting) {
      // Wait for the existing connection attempt to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      return getRedisClient(); // Retry getting the client
  }

  isConnecting = true;

  console.log(`Connecting to Redis at ${redisUrl}...`);
  const newClient = createClient({
    url: redisUrl,
  });

  newClient.on('error', (err) => {
      console.error('Redis Client Error', err);
      client = null; // Reset client on error
      isConnecting = false;
  });
  newClient.on('connect', () => console.log('Connected to Redis.'));
  newClient.on('reconnecting', () => console.log('Reconnecting to Redis...'));
  newClient.on('end', () => {
      console.log('Redis connection closed.');
      client = null;
      isConnecting = false;
  });

  try {
    await newClient.connect();
    client = newClient as RedisClientType; // Cast after connect confirms type
    isConnecting = false;
    return client;
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    client = null;
    isConnecting = false;
    throw err; // Re-throw connection error
  }
}

// Ensure graceful shutdown
process.on('SIGINT', async () => {
  if (client && client.isOpen) {
    console.log('Closing Redis connection...');
    await client.quit();
  }
  process.exit(0);
});

// --- Service Methods --- 

/**
 * Sets a key-value pair in Redis with an expiration time (TTL).
 * @param key The key to set.
 * @param value The value to store.
 * @param ttlSeconds Time-to-live in seconds.
 */
async function setWithTTL(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.set(key, value, { EX: ttlSeconds });
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
    // Decide on error handling: throw, log, return status?
    throw error;
  }
}

/**
 * Gets the value associated with a key from Redis.
 * @param key The key to retrieve.
 * @returns The value string, or null if the key doesn't exist or an error occurs.
 */
async function get(key: string): Promise<string | null> {
  try {
    const redis = await getRedisClient();
    return await redis.get(key);
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null; // Return null on error to prevent crashes
  }
}

/**
 * Deletes a key from Redis.
 * @param key The key to delete.
 * @returns True if deleted, false otherwise or on error.
 */
async function del(key: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const result = await redis.del(key);
    return result > 0;
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Gets all keys matching a pattern from Redis.
 * @param pattern The pattern to match (e.g., "game:*").
 * @returns Array of matching keys.
 */
async function keys(pattern: string): Promise<string[]> {
  try {
    const redis = await getRedisClient();
    return await redis.keys(pattern);
  } catch (error) {
    console.error(`Redis KEYS error for pattern ${pattern}:`, error);
    return [];
  }
}

/**
 * Checks if a key exists in Redis.
 * @param key The key to check.
 * @returns True if exists, false otherwise.
 */
async function exists(key: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const result = await redis.exists(key);
    return result > 0;
  } catch (error) {
    console.error(`Redis EXISTS error for key ${key}:`, error);
    return false;
  }
}

export const RedisService = {
  setWithTTL,
  get,
  del,
  keys,
  exists,
  getRedisClient // Expose client getter if needed elsewhere (use cautiously)
}; 