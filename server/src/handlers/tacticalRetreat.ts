import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { TacticalRetreatRequest } from '@gambit-chess/shared';

/**
 * Handle a tactical retreat request after a failed capture
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Tactical retreat request payload
 */
export async function handleTacticalRetreat(
  ws: WebSocket,
  sessionId: string,
  payload: TacticalRetreatRequest
): Promise<void> {
  try {
    const { gameId, to, acknowledgedBPCost } = payload;
    
    // Validate input
    if (!gameId || !to || acknowledgedBPCost === undefined) {
      sendMessage(ws, 'error', { message: 'Invalid tactical retreat request' });
      return;
    }
    
    logger.debug('Tactical retreat request', { 
      gameId, 
      sessionId, 
      to: `${to.x},${to.y}`, 
      cost: acknowledgedBPCost 
    });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Process the tactical retreat
    const result = await gameEngine.processTacticalRetreat(
      sessionId,
      to,
      acknowledgedBPCost
    );
    
    // If retreat failed, send error
    if (!result.success) {
      sendMessage(ws, 'error', { 
        message: 'Tactical retreat failed', 
        details: result.error 
      });
      return;
    }
    
    // Send confirmation to client
    sendMessage(ws, 'tactical_retreat_confirmed', {
      gameId,
      to,
      cost: acknowledgedBPCost,
      success: true
    });
    
    // Send updated game states to both players
    await sendUpdatedGameState(gameId, sessionId, ws, gameEngine);
  } catch (err) {
    logger.error('Error processing tactical retreat', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process tactical retreat', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Send updated game state to all players
 */
async function sendUpdatedGameState(
  gameId: string,
  sessionId: string,
  ws: WebSocket,
  gameEngine: GameEngine
): Promise<void> {
  try {
    // Send updated game state to requester
    const gameState = gameEngine.createGameStateDTO(sessionId);
    sendMessage(ws, 'game_state', gameState);
    
    // Notify opponent with their game state view
    await notifyOpponentGameState(gameId, sessionId, gameEngine);
  } catch (err) {
    logger.error('Error sending updated game state', { error: err, gameId });
  }
}

/**
 * Notify opponent with their view of the game state
 */
async function notifyOpponentGameState(
  gameId: string,
  requestingSessionId: string,
  gameEngine: GameEngine
): Promise<void> {
  try {
    // Get opponent session ID
    const opponentSessionId = getOpponentSessionId(gameEngine, requestingSessionId);
    
    if (!opponentSessionId) {
      return;
    }
    
    // Find opponent's connection
    const opponentWs = findConnectionBySessionId(opponentSessionId);
    
    if (!opponentWs) {
      return;
    }
    
    // Create game state specific to opponent
    const opponentGameState = gameEngine.createGameStateDTO(opponentSessionId);
    
    // Send game state to opponent
    sendMessage(opponentWs, 'game_state', opponentGameState);
  } catch (err) {
    logger.error('Error notifying opponent of game state', { error: err, gameId });
  }
}

/**
 * Get opponent's session ID
 */
function getOpponentSessionId(gameEngine: GameEngine, requestingSessionId: string): string | null {
  try {
    // This would need to be implemented in GameEngine to expose the opponent's session ID
    // For now, using any to bypass type checking
    const gameState = (gameEngine as any).gameState;
    
    if (!gameState) return null;
    
    if (gameState.whiteSessionId === requestingSessionId) {
      return gameState.blackSessionId;
    } else if (gameState.blackSessionId === requestingSessionId) {
      return gameState.whiteSessionId;
    }
    
    return null;
  } catch (err) {
    logger.error('Error getting opponent session ID', { error: err });
    return null;
  }
} 