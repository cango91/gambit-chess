import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId, notifyGameParticipants } from '../services/websocket';
import { GameState, PlayerColor } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

// Track active draw offers
const drawOffers = new Map<string, {
  gameId: string;
  offeredBy: string;
  offeredTo: string;
  timestamp: number;
}>();

/**
 * Handle a draw offer from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Draw offer payload
 */
export async function handleOfferDraw(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid draw offer request' });
      return;
    }
    
    logger.debug('Draw offer', { gameId, sessionId });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Determine the player's color
    const gameStateDTO = gameEngine.createGameStateDTO(sessionId);
    const playerColor = gameStateDTO.playerRole === 'player_white' 
      ? PlayerColor.WHITE 
      : PlayerColor.BLACK;
    
    // Get opponent's session ID
    const opponentSessionId = getOpponentSessionId(gameEngine, sessionId);
    if (!opponentSessionId) {
      sendMessage(ws, 'error', { message: 'Opponent not connected' });
      return;
    }
    
    // Store the draw offer
    drawOffers.set(gameId, {
      gameId,
      offeredBy: sessionId,
      offeredTo: opponentSessionId,
      timestamp: Date.now()
    });
    
    // Send confirmation to the offering player
    sendMessage(ws, 'draw_offered', {
      gameId,
      success: true
    });
    
    // Send notification to opponent
    const opponentWs = findConnectionBySessionId(opponentSessionId);
    if (opponentWs) {
      sendMessage(opponentWs, 'draw_offered', {
        gameId,
        offeredBy: playerColor
      });
    }
    
    // Set a timeout to automatically expire the draw offer after 2 minutes
    setTimeout(() => {
      const offer = drawOffers.get(gameId);
      if (offer && offer.offeredBy === sessionId) {
        drawOffers.delete(gameId);
        logger.debug('Draw offer expired', { gameId, sessionId });
      }
    }, 120000); // 2 minutes
    
    logger.info('Draw offered', { gameId, sessionId, playerColor });
  } catch (err) {
    logger.error('Error processing draw offer', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process draw offer', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Handle a draw acceptance from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Draw acceptance payload
 */
export async function handleAcceptDraw(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid draw acceptance request' });
      return;
    }
    
    logger.debug('Draw acceptance', { gameId, sessionId });
    
    // Check if there is an active draw offer
    const drawOffer = drawOffers.get(gameId);
    if (!drawOffer || drawOffer.offeredTo !== sessionId) {
      sendMessage(ws, 'error', { message: 'No active draw offer' });
      return;
    }
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Update game state to draw
    const internalState = (gameEngine as any).gameState;
    if (internalState) {
      internalState.gameState = GameState.DRAW;
      await (gameEngine as any).saveState();
    }
    
    // Clear the draw offer
    drawOffers.delete(gameId);
    
    // Notify both players
    const currentPlayerState = gameEngine.createGameStateDTO(sessionId);
    sendMessage(ws, 'game_over', {
      gameId,
      gameState: currentPlayerState,
      reason: 'draw_agreement',
      winner: null
    });
    
    // Notify opponent
    const opponentWs = findConnectionBySessionId(drawOffer.offeredBy);
    if (opponentWs) {
      const opponentState = gameEngine.createGameStateDTO(drawOffer.offeredBy);
      sendMessage(opponentWs, 'game_over', {
        gameId,
        gameState: opponentState,
        reason: 'draw_agreement',
        winner: null
      });
    }
    
    // Notify spectators about the game ending in a draw
    await notifyGameParticipants(
      gameId, 
      'game_over', 
      {
        gameId,
        reason: 'draw_agreement',
        winner: null,
        // Send a generic game state for spectators without sensitive info
        gameState: {
          gameState: GameState.DRAW,
          playerRole: 'spectator',
          gameId
        }
      }
      // No excludeSessionId parameter - will send to all spectators
    );
    
    logger.info('Draw accepted', { gameId, sessionId });
  } catch (err) {
    logger.error('Error processing draw acceptance', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process draw acceptance', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Handle a draw rejection from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Draw rejection payload
 */
export async function handleRejectDraw(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid draw rejection request' });
      return;
    }
    
    logger.debug('Draw rejection', { gameId, sessionId });
    
    // Check if there is an active draw offer
    const drawOffer = drawOffers.get(gameId);
    if (!drawOffer || drawOffer.offeredTo !== sessionId) {
      sendMessage(ws, 'error', { message: 'No active draw offer' });
      return;
    }
    
    // Clear the draw offer
    drawOffers.delete(gameId);
    
    // Send confirmation to the rejecting player
    sendMessage(ws, 'draw_rejected', {
      gameId,
      success: true
    });
    
    // Notify opponent
    const opponentWs = findConnectionBySessionId(drawOffer.offeredBy);
    if (opponentWs) {
      sendMessage(opponentWs, 'draw_rejected', {
        gameId
      });
    }
    
    logger.info('Draw rejected', { gameId, sessionId });
  } catch (err) {
    logger.error('Error processing draw rejection', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process draw rejection', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Get opponent's session ID - helper function
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