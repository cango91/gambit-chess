import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { PlayerColor } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

// Simple profanity filter - this would be more sophisticated in a production app
const PROFANITY_LIST = ['badword1', 'badword2', 'badword3']; 

/**
 * Handle a chat message from a player
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Chat message payload
 */
export async function handleChatMessage(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string; message: string }
): Promise<void> {
  try {
    const { gameId, message } = payload;
    
    // Validate input
    if (!gameId || !message) {
      sendMessage(ws, 'error', { message: 'Invalid chat message' });
      return;
    }
    
    if (message.length > 200) {
      sendMessage(ws, 'error', { message: 'Message too long (max 200 characters)' });
      return;
    }
    
    logger.debug('Chat message', { gameId, sessionId });
    
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
      : gameStateDTO.playerRole === 'player_black'
        ? PlayerColor.BLACK
        : null;
    
    // Filter profanity
    let filteredMessage = message;
    PROFANITY_LIST.forEach(word => {
      const regex = new RegExp(word, 'gi');
      filteredMessage = filteredMessage.replace(regex, '***');
    });
    
    // Prepare the message
    const chatMessage = {
      gameId,
      message: filteredMessage,
      sender: playerColor,
      timestamp: Date.now()
    };
    
    // Send confirmation to the sender
    sendMessage(ws, 'chat_received', chatMessage);
    
    // Broadcast to other players/spectators
    broadcastChatToOthers(gameEngine, sessionId, chatMessage);
    
    logger.info('Chat message sent', { 
      gameId, 
      sessionId, 
      playerColor,
      messageLength: filteredMessage.length 
    });
  } catch (err) {
    logger.error('Error processing chat message', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process chat message', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Broadcast chat message to other players/spectators
 */
async function broadcastChatToOthers(
  gameEngine: GameEngine,
  senderSessionId: string,
  chatMessage: any
): Promise<void> {
  try {
    // Get all session IDs for this game
    const gameState = (gameEngine as any).gameState;
    if (!gameState) return;
    
    const sessionIds: string[] = [];
    
    if (gameState.whiteSessionId && gameState.whiteSessionId !== senderSessionId) {
      sessionIds.push(gameState.whiteSessionId);
    }
    
    if (gameState.blackSessionId && gameState.blackSessionId !== senderSessionId) {
      sessionIds.push(gameState.blackSessionId);
    }
    
    if (gameState.spectatorSessionIds) {
      for (const spectatorId of gameState.spectatorSessionIds) {
        if (spectatorId !== senderSessionId) {
          sessionIds.push(spectatorId);
        }
      }
    }
    
    // Send to all other players/spectators
    for (const recipientId of sessionIds) {
      const recipientWs = findConnectionBySessionId(recipientId);
      if (recipientWs) {
        sendMessage(recipientWs, 'chat_received', chatMessage);
      }
    }
  } catch (err) {
    logger.error('Error broadcasting chat message', { error: err });
  }
} 