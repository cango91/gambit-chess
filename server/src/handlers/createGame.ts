import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage } from '../services/websocket';
import { PlayerRole } from '@gambit-chess/shared';

/**
 * Handle a create game request from client
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Request payload
 */
export async function handleCreateGame(
  ws: WebSocket,
  sessionId: string,
  payload: any
): Promise<void> {
  try {
    const { againstAI = false, aiDifficulty = 'intermediate' } = payload;
    
    // Create a unique game ID
    const gameId = uuidv4();
    
    // Create a new game engine instance
    const gameEngine = new GameEngine(gameId);
    
    // Initialize the game
    await gameEngine.initialize({
      againstAI,
      aiDifficulty,
      whiteSessionId: sessionId // Creator plays as white
    });
    
    logger.info('Game created', { gameId, sessionId, againstAI });
    
    // Send game created confirmation to client
    sendMessage(ws, 'game_created', {
      gameId,
      playerRole: PlayerRole.PLAYER_WHITE,
      success: true
    });
    
    // If against AI, send game state immediately
    if (againstAI) {
      const gameState = gameEngine.createGameStateDTO(sessionId);
      sendMessage(ws, 'game_state', gameState);
      
      // TODO: If AI's turn, make AI move
    }
  } catch (err) {
    logger.error('Error creating game', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to create game', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
} 