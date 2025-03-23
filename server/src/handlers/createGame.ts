import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, registerSessionWithGame } from '../services/websocket';
import { PlayerRole } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a create game request
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
    const { againstAI, aiDifficulty } = payload || {};
    
    // Generate a unique game ID
    const gameId = uuidv4();
    
    logger.debug('Creating new game', { gameId, sessionId, againstAI });
    
    // Create a new game engine with the default storage
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    
    // Initialize the game state
    await gameEngine.initialize({
      againstAI,
      aiDifficulty,
      whiteSessionId: sessionId
    });
    
    // Register this session with the game for security validation
    registerSessionWithGame(gameId, sessionId);
    
    // Send confirmation to the client
    sendMessage(ws, 'game_created', {
      gameId,
      success: true,
      playerRole: PlayerRole.PLAYER_WHITE
    });
    
    // If against AI, send the current game state immediately
    if (againstAI) {
      const gameState = gameEngine.createGameStateDTO(sessionId);
      sendMessage(ws, 'game_state', gameState);
    }
    
    logger.info('Game created', { gameId, sessionId, againstAI });
  } catch (error) {
    logger.error('Error creating game', { error, sessionId });
    sendMessage(ws, 'error', {
      message: 'Failed to create game',
      code: 'CREATE_GAME_ERROR'
    });
  }
} 