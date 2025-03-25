import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, registerSessionWithGame } from '../services/websocket';
import { PlayerRole } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a request to spectate a game
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Spectate request payload
 */
export async function handleSpectateGame(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid spectate request' });
      return;
    }
    
    logger.debug('Spectate request', { gameId, sessionId });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Add the spectator to the game state
    const internalState = (gameEngine as any).gameState;
    if (internalState) {
      // Make sure spectatorSessionIds exists
      if (!internalState.spectatorSessionIds) {
        internalState.spectatorSessionIds = [];
      }
      
      // Don't add duplicate entries
      if (!internalState.spectatorSessionIds.includes(sessionId)) {
        internalState.spectatorSessionIds.push(sessionId);
      }
      
      await (gameEngine as any).saveState();
    }
    
    // Register the spectator's session with this game
    registerSessionWithGame(gameId, sessionId);
    
    // Send confirmation and game state to spectator
    sendMessage(ws, 'spectating', {
      gameId,
      success: true
    });
    
    // Send game state to the new spectator
    const gameState = gameEngine.createGameStateDTO(sessionId);
    
    // Verify the spectator role is correctly set
    if (gameState.playerRole !== PlayerRole.SPECTATOR) {
      // If not, we need to modify it before sending
      gameState.playerRole = PlayerRole.SPECTATOR;
    }
    
    sendMessage(ws, 'game_state', gameState);
    
    logger.info('Spectator added to game', { gameId, sessionId });
  } catch (err) {
    logger.error('Error processing spectate request', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process spectate request', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 