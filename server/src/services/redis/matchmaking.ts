import { redisClient } from './index';
import { logger } from '../../utils/logger';
import { config } from '../../config';

// Key patterns
const QUEUE_KEY = 'matchmaking:queue';
const SESSION_QUEUE_KEY = 'matchmaking:session:';

/**
 * Add a player to the matchmaking queue
 * @param sessionId The player's session ID
 * @returns true if successfully added
 */
export async function addToQueue(sessionId: string): Promise<boolean> {
  try {
    const timestamp = Date.now();
    
    // Add to sorted set with timestamp as score
    await redisClient.zAdd(QUEUE_KEY, { score: timestamp, value: sessionId });
    
    // Store additional session data
    await redisClient.set(`${SESSION_QUEUE_KEY}${sessionId}`, JSON.stringify({
      joinedAt: timestamp,
      active: true
    }));
    
    logger.debug('Added player to matchmaking queue', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to add player to matchmaking queue', { error, sessionId });
    return false;
  }
}

/**
 * Remove a player from the matchmaking queue
 * @param sessionId The player's session ID
 * @returns true if successfully removed
 */
export async function removeFromQueue(sessionId: string): Promise<boolean> {
  try {
    // Remove from sorted set
    await redisClient.zRem(QUEUE_KEY, sessionId);
    
    // Remove session data
    await redisClient.del(`${SESSION_QUEUE_KEY}${sessionId}`);
    
    logger.debug('Removed player from matchmaking queue', { sessionId });
    return true;
  } catch (error) {
    logger.error('Failed to remove player from matchmaking queue', { error, sessionId });
    return false;
  }
}

/**
 * Find a potential match for a player
 * @param sessionId The player's session ID
 * @returns The session ID of the matched player, or null if no match found
 */
export async function findMatch(sessionId: string): Promise<string | null> {
  try {
    // Get all players in queue except this one, sorted by join time
    const queueMembers = await redisClient.zRange(QUEUE_KEY, 0, -1);
    
    // Filter out the requesting player
    const potentialMatches = queueMembers.filter((id: string) => id !== sessionId);
    
    if (potentialMatches.length === 0) {
      logger.debug('No potential matches found', { sessionId });
      return null;
    }
    
    // Take the first player in the queue (who has been waiting the longest)
    const matchedSessionId = potentialMatches[0];
    
    // Check if this player is still actively waiting
    const matchDataStr = await redisClient.get(`${SESSION_QUEUE_KEY}${matchedSessionId}`);
    if (!matchDataStr) {
      logger.debug('Matched player not found in session data, removing from queue', { matchedSessionId });
      await redisClient.zRem(QUEUE_KEY, matchedSessionId);
      return null;
    }
    
    const matchData = JSON.parse(matchDataStr);
    if (!matchData.active) {
      logger.debug('Matched player no longer active, removing from queue', { matchedSessionId });
      await redisClient.zRem(QUEUE_KEY, matchedSessionId);
      return null;
    }
    
    // Remove both players from the queue
    await Promise.all([
      removeFromQueue(sessionId),
      removeFromQueue(matchedSessionId)
    ]);
    
    logger.info('Found match for player', { sessionId, matchedSessionId });
    return matchedSessionId;
  } catch (error) {
    logger.error('Error finding match', { error, sessionId });
    return null;
  }
}

/**
 * Check if a player is still in the matchmaking queue
 * @param sessionId The player's session ID
 * @returns true if player is in queue
 */
export async function isInQueue(sessionId: string): Promise<boolean> {
  try {
    // Check if session ID exists in the sorted set
    const score = await redisClient.zScore(QUEUE_KEY, sessionId);
    return score !== null;
  } catch (error) {
    logger.error('Error checking if player is in queue', { error, sessionId });
    return false;
  }
}

/**
 * Mark a player as no longer active in the queue without removing them
 * Used when a player disconnects but we want to keep their place temporarily
 * @param sessionId The player's session ID
 */
export async function markInactive(sessionId: string): Promise<void> {
  try {
    const dataStr = await redisClient.get(`${SESSION_QUEUE_KEY}${sessionId}`);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      data.active = false;
      await redisClient.set(`${SESSION_QUEUE_KEY}${sessionId}`, JSON.stringify(data));
      logger.debug('Marked player as inactive in queue', { sessionId });
    }
  } catch (error) {
    logger.error('Error marking player as inactive', { error, sessionId });
  }
}

/**
 * Get the total number of players in the matchmaking queue
 * @returns The number of players in queue
 */
export async function getQueueLength(): Promise<number> {
  try {
    return await redisClient.zCard(QUEUE_KEY);
  } catch (error) {
    logger.error('Error getting queue length', { error });
    return 0;
  }
}

/**
 * Get the position of a player in the matchmaking queue
 * @param sessionId The player's session ID
 * @returns The 0-based position in queue, or -1 if not found
 */
export async function getPositionInQueue(sessionId: string): Promise<number> {
  try {
    const rank = await redisClient.zRank(QUEUE_KEY, sessionId);
    return rank !== null ? rank : -1;
  } catch (error) {
    logger.error('Error getting position in queue', { error, sessionId });
    return -1;
  }
}

/**
 * Get the wait time of a player in seconds
 * @param sessionId The player's session ID
 * @returns The wait time in seconds, or -1 if not found
 */
export async function getWaitTime(sessionId: string): Promise<number> {
  try {
    const dataStr = await redisClient.get(`${SESSION_QUEUE_KEY}${sessionId}`);
    if (!dataStr) return -1;
    
    const data = JSON.parse(dataStr);
    return Math.floor((Date.now() - data.joinedAt) / 1000);
  } catch (error) {
    logger.error('Error getting wait time', { error, sessionId });
    return -1;
  }
} 