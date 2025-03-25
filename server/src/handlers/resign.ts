import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId, registerSessionWithGame } from '../services/websocket';
import { GameState, PlayerColor } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a resign request from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Resign payload
 */
export async function handleResign(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid resign request' });
      return;
    }
    
    logger.debug('Resign request', { gameId, sessionId });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Determine which player is resigning
    const gameState = gameEngine.createGameStateDTO(sessionId);
    const resigningColor = gameState.playerRole === 'player_white' 
      ? PlayerColor.WHITE 
      : PlayerColor.BLACK;
    
    // Update game state to reflect resignation
    const winningColor = resigningColor === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
    
    // Update game status to game over
    // Access internal gameState directly (with type casting) to modify it
    const internalState = (gameEngine as any).gameState;
    if (internalState) {
      internalState.gameState = GameState.CHECKMATE; // Using checkmate as the end state for resignation
      internalState.currentTurn = winningColor; // Set winner as current turn
      await (gameEngine as any).saveState();
    }
    
    // Notify both players
    const currentPlayerState = gameEngine.createGameStateDTO(sessionId);
    sendMessage(ws, 'game_over', {
      gameId,
      gameState: currentPlayerState,
      reason: 'resignation',
      winner: winningColor
    });
    
    // Notify opponent
    const opponentSessionId = getOpponentSessionId(gameEngine, sessionId);
    if (opponentSessionId) {
      const opponentWs = findConnectionBySessionId(opponentSessionId);
      if (opponentWs) {
        const opponentState = gameEngine.createGameStateDTO(opponentSessionId);
        sendMessage(opponentWs, 'game_over', {
          gameId,
          gameState: opponentState,
          reason: 'resignation',
          winner: winningColor
        });
      }
    }
    
    logger.info('Player resigned', { 
      gameId, 
      sessionId, 
      resigningColor,
      winningColor 
    });
  } catch (err) {
    logger.error('Error processing resignation', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process resignation', 
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