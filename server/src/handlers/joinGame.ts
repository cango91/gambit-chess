import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { PlayerRole } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a join game request
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Request payload
 */
export async function handleJoinGame(
  ws: WebSocket,
  sessionId: string,
  payload: any
): Promise<void> {
  try {
    const { gameId } = payload;
    
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Game ID is required' });
      return;
    }
    
    logger.debug('Join game request', { gameId, sessionId });
    
    // Load the game
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Get game state to determine available roles
    const gameState = (gameEngine as any).gameState;
    if (!gameState) {
      sendMessage(ws, 'error', { message: 'Invalid game state' });
      return;
    }
    
    // Determine player role
    let playerRole: PlayerRole | null = null;
    
    // Check if already a player in the game
    if (gameState.whiteSessionId === sessionId) {
      playerRole = PlayerRole.PLAYER_WHITE;
    } else if (gameState.blackSessionId === sessionId) {
      playerRole = PlayerRole.PLAYER_BLACK;
    } else if (gameState.spectatorSessionIds.includes(sessionId)) {
      playerRole = PlayerRole.SPECTATOR;
    } else {
      // New player joining
      
      // Check if white seat is available
      if (!gameState.whiteSessionId) {
        gameState.whiteSessionId = sessionId;
        playerRole = PlayerRole.PLAYER_WHITE;
      } 
      // Check if black seat is available
      else if (!gameState.blackSessionId) {
        gameState.blackSessionId = sessionId;
        playerRole = PlayerRole.PLAYER_BLACK;
      }
      // Otherwise, join as spectator
      else {
        gameState.spectatorSessionIds.push(sessionId);
        playerRole = PlayerRole.SPECTATOR;
      }
      
      // Save updated game state
      await (gameEngine as any).saveState();
    }
    
    if (!playerRole) {
      sendMessage(ws, 'error', { message: 'Failed to join game' });
      return;
    }
    
    // Send join confirmation
    sendMessage(ws, 'game_joined', {
      gameId,
      playerRole,
      success: true
    });
    
    // Send current game state
    const playerGameState = gameEngine.createGameStateDTO(sessionId);
    sendMessage(ws, 'game_state', playerGameState);
    
    // Notify other players about the join
    notifyOtherPlayers(gameEngine, sessionId, {
      type: 'player_joined',
      payload: {
        gameId,
        playerRole,
        timestamp: Date.now()
      }
    });
  } catch (err) {
    logger.error('Error joining game', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to join game', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Notify other players in the game
 */
async function notifyOtherPlayers(
  gameEngine: GameEngine,
  excludeSessionId: string,
  message: {
    type: string;
    payload: any;
  }
): Promise<void> {
  try {
    // Get game state to get all player session IDs
    const gameState = (gameEngine as any).gameState;
    if (!gameState) {
      return;
    }
    
    // Collect all active players
    const playerSessions: string[] = [];
    
    if (gameState.whiteSessionId && gameState.whiteSessionId !== excludeSessionId) {
      playerSessions.push(gameState.whiteSessionId);
    }
    
    if (gameState.blackSessionId && gameState.blackSessionId !== excludeSessionId) {
      playerSessions.push(gameState.blackSessionId);
    }
    
    for (const spectatorId of gameState.spectatorSessionIds) {
      if (spectatorId !== excludeSessionId) {
        playerSessions.push(spectatorId);
      }
    }
    
    // Send message to all other players
    for (const sessionId of playerSessions) {
      const ws = findConnectionBySessionId(sessionId);
      if (ws) {
        sendMessage(ws, message.type, message.payload);
      }
    }
  } catch (err) {
    logger.error('Error notifying other players', { error: err });
  }
} 