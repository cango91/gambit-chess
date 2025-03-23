import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { BPAllocationRequest } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a BP allocation request during a duel
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload BP allocation request payload
 */
export async function handleBPAllocation(
  ws: WebSocket,
  sessionId: string,
  payload: BPAllocationRequest
): Promise<void> {
  try {
    const { gameId, amount } = payload;
    
    // Validate input
    if (!gameId || amount === undefined) {
      sendMessage(ws, 'error', { message: 'Invalid BP allocation request' });
      return;
    }
    
    logger.debug('BP allocation request', { 
      gameId, 
      sessionId, 
      amount 
    });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Process the BP allocation
    const result = await gameEngine.processBPAllocation(
      sessionId,
      amount
    );
    
    // If allocation failed, send error
    if (!result.success) {
      sendMessage(ws, 'error', { 
        message: 'BP allocation failed', 
        details: result.error 
      });
      return;
    }
    
    // Send confirmation to client
    sendMessage(ws, 'bp_allocation_confirmed', {
      gameId,
      amount,
      success: true
    });
    
    // Check if duel is resolved (both players have allocated)
    // This will be reflected in the game state phase
    const gameState = gameEngine.createGameStateDTO(sessionId);
    
    // If game phase has changed from duel allocation, it means 
    // the duel is resolved and we should send updated game state
    if (gameState.gamePhase !== 'duel_allocation') {
      await sendUpdatedGameState(gameId, sessionId, ws, gameEngine);
    } else {
      // Let the opponent know their turn to allocate (without revealing our allocation)
      await notifyOpponent(gameId, sessionId, 'opponent_allocated', {
        gameId,
        message: 'Opponent has allocated battle points'
      });
    }
  } catch (err) {
    logger.error('Error processing BP allocation', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process BP allocation', 
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
 * Notify opponent with an event
 */
async function notifyOpponent(
  gameId: string,
  requestingSessionId: string,
  eventType: string,
  payload: any
): Promise<void> {
  try {
    // Load game state to get opponent session
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) return;
    
    // Get opponent session ID
    const opponentSessionId = getOpponentSessionId(gameEngine, requestingSessionId);
    
    if (!opponentSessionId) {
      logger.debug('No opponent to notify', { gameId });
      return;
    }
    
    // Find opponent's connection
    const opponentWs = findConnectionBySessionId(opponentSessionId);
    
    if (opponentWs) {
      sendMessage(opponentWs, eventType, payload);
    }
  } catch (err) {
    logger.error('Error notifying opponent', { error: err, gameId });
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