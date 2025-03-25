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
    logger.info('Create game handler invoked', { 
      sessionId,
      payload: JSON.stringify(payload)
    });
    
    const { againstAI, aiDifficulty, playerName } = payload || {};
    
    // Generate a unique game ID
    const gameId = uuidv4();
    
    logger.debug('Creating new game', { gameId, sessionId, againstAI, playerName });
    
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
    
    // Prepare response data
    const responseData = {
      gameId,
      success: true,
      playerRole: PlayerRole.PLAYER_WHITE
    };
    
    logger.info('Sending game_created response', { 
      gameId, 
      sessionId,
      response: JSON.stringify(responseData)
    });
    
    // Send confirmation to the client
    sendMessage(ws, 'game_created', responseData);
    
    // If against AI, send the current game state immediately
    if (againstAI) {
      const gameState = gameEngine.createGameStateDTO(sessionId);
      sendMessage(ws, 'game_state', gameState);
    }
    
    logger.info('Game created successfully', { gameId, sessionId, againstAI });
  } catch (error) {
    logger.error('Error creating game', { error, sessionId });
    sendMessage(ws, 'error', {
      message: 'Failed to create game',
      code: 'CREATE_GAME_ERROR'
    });
  }
} 