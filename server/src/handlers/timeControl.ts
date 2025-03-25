import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage, findConnectionBySessionId } from '../services/websocket';
import { GameState, PlayerColor } from '@gambit-chess/shared';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a time flag notification (player ran out of time)
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Time flag payload
 */
export async function handleTimeFlag(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string; player: PlayerColor }
): Promise<void> {
  try {
    const { gameId, player } = payload;
    
    // Validate input
    if (!gameId || !player) {
      sendMessage(ws, 'error', { message: 'Invalid time flag notification' });
      return;
    }
    
    logger.debug('Time flag notification', { gameId, sessionId, player });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Determine which player sent the notification
    const gameStateDTO = gameEngine.createGameStateDTO(sessionId);
    const senderColor = gameStateDTO.playerRole === 'player_white' 
      ? PlayerColor.WHITE 
      : PlayerColor.BLACK;
    
    // Verify the player has authority to send this notification
    // In a real implementation, the server would track time independently
    if (senderColor !== player && gameStateDTO.playerRole !== 'spectator') {
      sendMessage(ws, 'error', { message: 'Unauthorized time flag notification' });
      return;
    }
    
    // Update game state to reflect the time flag
    const winningColor = player === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    
    // Update game status to game over
    const internalState = (gameEngine as any).gameState;
    if (internalState) {
      internalState.gameState = GameState.CHECKMATE; // Using checkmate for time flag as well
      internalState.currentTurn = winningColor; // Set winner as current turn
      await (gameEngine as any).saveState();
    }
    
    // Notify all players
    broadcastTimeFlag(gameEngine, sessionId, gameId, player, winningColor);
    
    logger.info('Time flag processed', { 
      gameId, 
      sessionId, 
      flaggedPlayer: player,
      winningColor 
    });
  } catch (err) {
    logger.error('Error processing time flag', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process time flag', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Handle a request for more time
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Time request payload
 */
export async function handleRequestMoreTime(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string; requestedSeconds: number }
): Promise<void> {
  try {
    const { gameId, requestedSeconds } = payload;
    
    // Validate input
    if (!gameId || requestedSeconds <= 0 || requestedSeconds > 300) { // Max 5 minutes
      sendMessage(ws, 'error', { message: 'Invalid time request' });
      return;
    }
    
    logger.debug('More time requested', { gameId, sessionId, requestedSeconds });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // Determine which player is requesting more time
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
    
    // Find opponent's connection
    const opponentWs = findConnectionBySessionId(opponentSessionId);
    if (!opponentWs) {
      sendMessage(ws, 'error', { message: 'Opponent not connected' });
      return;
    }
    
    // Send request to opponent
    // In a real implementation, this would interact with a time control system
    sendMessage(opponentWs, 'time_extension_request', {
      gameId,
      requestingPlayer: playerColor,
      requestedSeconds
    });
    
    // Acknowledge the request
    sendMessage(ws, 'time_extension_requested', {
      gameId,
      success: true,
      requestedSeconds
    });
    
    logger.info('Time extension requested', { 
      gameId, 
      sessionId, 
      playerColor,
      requestedSeconds 
    });
  } catch (err) {
    logger.error('Error processing time extension request', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process time extension request', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Broadcast time flag to all players
 */
function broadcastTimeFlag(
  gameEngine: GameEngine,
  senderSessionId: string,
  gameId: string,
  flaggedPlayer: PlayerColor,
  winningColor: PlayerColor
): void {
  try {
    // Get all session IDs for this game
    const gameState = (gameEngine as any).gameState;
    if (!gameState) return;
    
    // Broadcast to all participants
    const allSessionIds = [
      gameState.whiteSessionId,
      gameState.blackSessionId,
      ...(gameState.spectatorSessionIds || [])
    ].filter(Boolean);
    
    for (const sessionId of allSessionIds) {
      if (sessionId === senderSessionId) continue; // Skip sender
      
      const playerWs = findConnectionBySessionId(sessionId);
      if (playerWs) {
        const playerState = gameEngine.createGameStateDTO(sessionId);
        
        sendMessage(playerWs, 'game_over', {
          gameId,
          gameState: playerState,
          reason: 'time_flag',
          flaggedPlayer,
          winner: winningColor
        });
      }
    }
  } catch (err) {
    logger.error('Error broadcasting time flag', { error: err });
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