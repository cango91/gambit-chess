import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId, notifyGameParticipants } from '../services/websocket';
import { GamePhase, GameState, PlayerColor } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

// Track active takeback requests
const takebackRequests = new Map<string, {
  gameId: string;
  requestedBy: string;
  requestedTo: string;
  moveCount: number;
  timestamp: number;
}>();

/**
 * Handle a takeback request from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Takeback request payload
 */
export async function handleRequestTakeback(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string; moveCount?: number }
): Promise<void> {
  try {
    const { gameId, moveCount = 1 } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid takeback request' });
      return;
    }
    
    if (moveCount < 1 || moveCount > 2) {
      sendMessage(ws, 'error', { message: 'Invalid move count (must be 1 or 2)' });
      return;
    }
    
    logger.debug('Takeback request', { gameId, sessionId, moveCount });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Make sure game is not in special state (duel or tactical retreat)
    const gameStateDTO = gameEngine.createGameStateDTO(sessionId);
    if (gameStateDTO.gamePhase !== GamePhase.NORMAL_MOVE) {
      sendMessage(ws, 'error', { 
        message: 'Cannot request takeback during duel or tactical retreat phase' 
      });
      return;
    }
    
    // Determine the player's color
    const playerColor = gameStateDTO.playerRole === 'player_white' 
      ? PlayerColor.WHITE 
      : PlayerColor.BLACK;
    
    // Get opponent's session ID
    const opponentSessionId = getOpponentSessionId(gameEngine, sessionId);
    if (!opponentSessionId) {
      sendMessage(ws, 'error', { message: 'Opponent not connected' });
      return;
    }
    
    // Store the takeback request
    takebackRequests.set(gameId, {
      gameId,
      requestedBy: sessionId,
      requestedTo: opponentSessionId,
      moveCount,
      timestamp: Date.now()
    });
    
    // Send confirmation to the requesting player
    sendMessage(ws, 'takeback_requested', {
      gameId,
      success: true,
      moveCount
    });
    
    // Send notification to opponent
    const opponentWs = findConnectionBySessionId(opponentSessionId);
    if (opponentWs) {
      sendMessage(opponentWs, 'takeback_requested', {
        gameId,
        requestedBy: playerColor,
        moveCount
      });
    }
    
    // Set a timeout to automatically expire the takeback request after 1 minute
    setTimeout(() => {
      const request = takebackRequests.get(gameId);
      if (request && request.requestedBy === sessionId) {
        takebackRequests.delete(gameId);
        logger.debug('Takeback request expired', { gameId, sessionId });
      }
    }, 60000); // 1 minute
    
    logger.info('Takeback requested', { gameId, sessionId, playerColor, moveCount });
  } catch (err) {
    logger.error('Error processing takeback request', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process takeback request', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Handle a takeback acceptance from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Takeback acceptance payload
 */
export async function handleAcceptTakeback(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid takeback acceptance request' });
      return;
    }
    
    logger.debug('Takeback acceptance', { gameId, sessionId });
    
    // Check if there is an active takeback request
    const takebackRequest = takebackRequests.get(gameId);
    if (!takebackRequest || takebackRequest.requestedTo !== sessionId) {
      sendMessage(ws, 'error', { message: 'No active takeback request' });
      return;
    }
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // In a real implementation, we would:
    // 1. Store move history as part of game state
    // 2. Revert the board state to the appropriate position
    // 3. Update the game state to reflect the takeback
    
    // For this implementation, we'll just simulate by updating the current turn
    // and adding a message to indicate the takeback happened
    
    const internalState = (gameEngine as any).gameState;
    if (internalState) {
      // Determine which player requested the takeback
      const requestingPlayerState = gameEngine.createGameStateDTO(takebackRequest.requestedBy);
      const requestingColor = requestingPlayerState.playerRole === 'player_white' 
        ? PlayerColor.WHITE 
        : PlayerColor.BLACK;
      
      // Determine which player's turn it should be after takeback
      // If moveCount = 1, it's the requester's turn
      // If moveCount = 2, it's the opponent's turn
      const newTurn = takebackRequest.moveCount === 1
        ? requestingColor
        : requestingColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
      
      // Update the game state
      internalState.currentTurn = newTurn;
      internalState.phase = GamePhase.NORMAL_MOVE;
      internalState.lastMove = null; // Clear last move
      
      // In a real implementation, we would also:
      // - Revert the board positions
      // - Restore captured pieces if needed
      // - Update BP counts to previous values
      
      await (gameEngine as any).saveState();
    }
    
    // Clear the takeback request
    takebackRequests.delete(gameId);
    
    // Notify both players
    const currentPlayerState = gameEngine.createGameStateDTO(sessionId);
    sendMessage(ws, 'takeback_accepted', {
      gameId,
      gameState: currentPlayerState,
      moveCount: takebackRequest.moveCount
    });
    
    // Notify requester
    const requesterWs = findConnectionBySessionId(takebackRequest.requestedBy);
    if (requesterWs) {
      const requesterState = gameEngine.createGameStateDTO(takebackRequest.requestedBy);
      sendMessage(requesterWs, 'takeback_accepted', {
        gameId,
        gameState: requesterState,
        moveCount: takebackRequest.moveCount
      });
    }
    
    // Notify spectators about the takeback
    await notifyGameParticipants(
      gameId,
      'takeback_accepted',
      {
        gameId,
        moveCount: takebackRequest.moveCount,
        // Include a public version of game state without sensitive info
        gameState: {
          gameId,
          playerRole: 'spectator',
          currentTurn: internalState.currentTurn,
          gamePhase: internalState.phase,
          gameState: internalState.gameState
        }
      }
    );
    
    logger.info('Takeback accepted', { gameId, sessionId, moveCount: takebackRequest.moveCount });
  } catch (err) {
    logger.error('Error processing takeback acceptance', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process takeback acceptance', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Handle a takeback rejection from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Takeback rejection payload
 */
export async function handleRejectTakeback(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid takeback rejection request' });
      return;
    }
    
    logger.debug('Takeback rejection', { gameId, sessionId });
    
    // Check if there is an active takeback request
    const takebackRequest = takebackRequests.get(gameId);
    if (!takebackRequest || takebackRequest.requestedTo !== sessionId) {
      sendMessage(ws, 'error', { message: 'No active takeback request' });
      return;
    }
    
    // Clear the takeback request
    takebackRequests.delete(gameId);
    
    // Send confirmation to the rejecting player
    sendMessage(ws, 'takeback_rejected', {
      gameId,
      success: true
    });
    
    // Notify requester
    const requesterWs = findConnectionBySessionId(takebackRequest.requestedBy);
    if (requesterWs) {
      sendMessage(requesterWs, 'takeback_rejected', {
        gameId
      });
    }
    
    logger.info('Takeback rejected', { gameId, sessionId });
  } catch (err) {
    logger.error('Error processing takeback rejection', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process takeback rejection', 
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