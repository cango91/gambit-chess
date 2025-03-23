import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { MoveRequest, PieceType, Position } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a move request from client
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Move request payload
 */
export async function handleMove(
  ws: WebSocket,
  sessionId: string,
  payload: MoveRequest
): Promise<void> {
  try {
    const { gameId, from, to, promotionPiece } = payload;
    
    // Validate input
    if (!gameId || !from || !to) {
      sendMessage(ws, 'error', { message: 'Invalid move request' });
      return;
    }
    
    logger.debug('Move request', { 
      gameId, 
      sessionId, 
      from: `${from.x},${from.y}`, 
      to: `${to.x},${to.y}` 
    });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Process the move
    const moveResult = await gameEngine.processMove(
      sessionId,
      from,
      to,
      promotionPiece
    );
    
    // Send move result to client
    sendMessage(ws, 'move_result', moveResult);
    
    if (moveResult.success) {
      // If move triggers a duel, notify players
      if (moveResult.triggersDuel) {
        sendMessage(ws, 'duel_start', {
          gameId,
          from,
          to,
          piece: moveResult.move?.piece
        });
        
        // Notify opponent if connected
        notifyOpponent(gameId, sessionId, 'duel_start', {
          gameId,
          from,
          to,
          piece: moveResult.move?.piece
        });
      } else {
        // Move completed, send updated game state to players
        sendUpdatedGameState(gameId, sessionId, ws, gameEngine);
      }
    }
  } catch (err) {
    logger.error('Error processing move', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process move', 
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
    
    // Get game state for requesting player to find opponent
    const gameState = gameEngine.createGameStateDTO(requestingSessionId);
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