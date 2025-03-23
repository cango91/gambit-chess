import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { redis } from '../services/redis';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { GameEngine } from '../engine/GameEngine';
import { PlayerRole } from '@gambit-chess/shared';
import { v4 as uuidv4 } from 'uuid';
import { gameConfig } from '../config/gameConfig';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a find game request via matchmaking
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Request payload
 */
export async function handleFindGame(
  ws: WebSocket,
  sessionId: string,
  payload: any
): Promise<void> {
  try {
    logger.debug('Find game request', { sessionId });
    
    // Add player to matchmaking queue
    await redis.matchmaking.addToQueue(sessionId);
    
    // Send confirmation
    sendMessage(ws, 'matchmaking_joined', {
      message: 'Joined matchmaking queue',
      queuedAt: Date.now()
    });
    
    // Check for match immediately
    const result = await findMatch(sessionId);
    
    if (result.matched) {
      logger.info('Match found immediately', { 
        sessionId, 
        opponentId: result.opponentId,
        gameId: result.gameId 
      });
    } else {
      // Set up periodical matchmaking checks
      // In a real implementation, you'd use a worker or proper queue system
      // For simplicity, we're using setTimeout
      setTimeout(async () => {
        // Check if player is still in queue
        const queue = await redis.matchmaking.getQueue();
        if (!queue.includes(sessionId)) {
          return; // Player left the queue
        }
        
        // Try to find a match
        const delayedResult = await findMatch(sessionId);
        
        if (!delayedResult.matched) {
          // No match found, could retry or timeout
          logger.info('No match found after delay', { sessionId });
          
          // Remove from queue after maximum wait time
          // This would be handled by a worker in a real implementation
          // For the game jam, we'll just use setTimeout
          setTimeout(async () => {
            // Check if player is still in queue
            const queue = await redis.matchmaking.getQueue();
            if (queue.includes(sessionId)) {
              // Remove from queue
              await redis.matchmaking.removeFromQueue(sessionId);
              
              // Notify player
              const playerWs = findConnectionBySessionId(sessionId);
              if (playerWs) {
                sendMessage(playerWs, 'matchmaking_timeout', {
                  message: 'No match found'
                });
              }
            }
          }, gameConfig.MATCHMAKING.MAX_WAIT_TIME * 1000); // Convert to milliseconds
        }
      }, gameConfig.MATCHMAKING.CHECK_INTERVAL); // Check again after interval
    }
  } catch (err) {
    logger.error('Error processing find game request', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to join matchmaking', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
    
    // Remove from queue if there was an error
    await redis.matchmaking.removeFromQueue(sessionId);
  }
}

/**
 * Try to find a match for the player
 */
async function findMatch(sessionId: string): Promise<{
  matched: boolean;
  opponentId?: string;
  gameId?: string;
}> {
  try {
    // Get all players in queue
    const queue = await redis.matchmaking.getQueue();
    
    // Exclude the requesting player
    const otherPlayers = queue.filter(id => id !== sessionId);
    
    if (otherPlayers.length === 0) {
      return { matched: false };
    }
    
    // For simplicity, match with the first player
    // In a real implementation, you might use MMR or other criteria
    const opponentId = otherPlayers[0];
    
    // Remove both players from the queue
    await redis.matchmaking.removeFromQueue(sessionId);
    await redis.matchmaking.removeFromQueue(opponentId);
    
    // Create a new game
    const gameId = uuidv4();
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    
    // Initialize game with both players
    // Coin toss to decide who plays white
    const isWhite = Math.random() >= 0.5;
    await gameEngine.initialize({
      whiteSessionId: isWhite ? sessionId : opponentId,
      blackSessionId: isWhite ? opponentId : sessionId
    });
    
    // Notify both players
    const playerRole = isWhite ? PlayerRole.PLAYER_WHITE : PlayerRole.PLAYER_BLACK;
    const opponentRole = isWhite ? PlayerRole.PLAYER_BLACK : PlayerRole.PLAYER_WHITE;
    
    // Notify requesting player
    const playerWs = findConnectionBySessionId(sessionId);
    if (playerWs) {
      sendMessage(playerWs, 'game_found', {
        gameId,
        playerRole,
        success: true
      });
      
      const gameState = gameEngine.createGameStateDTO(sessionId);
      sendMessage(playerWs, 'game_state', gameState);
    }
    
    // Notify opponent
    const opponentWs = findConnectionBySessionId(opponentId);
    if (opponentWs) {
      sendMessage(opponentWs, 'game_found', {
        gameId,
        playerRole: opponentRole,
        success: true
      });
      
      const opponentGameState = gameEngine.createGameStateDTO(opponentId);
      sendMessage(opponentWs, 'game_state', opponentGameState);
    }
    
    return {
      matched: true,
      opponentId,
      gameId
    };
  } catch (err) {
    logger.error('Error in findMatch', { error: err, sessionId });
    return { matched: false };
  }
} 