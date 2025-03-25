import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { GameEngine } from '../engine/GameEngine';
import { sendMessage } from '../services/websocket';
import { defaultGameStateStorage } from '../storage';

/**
 * Handle a request for game history
 * @param ws WebSocket connection
 * @param sessionId Client session ID
 * @param payload Game history request payload
 */
export async function handleRequestGameHistory(
  ws: WebSocket,
  sessionId: string,
  payload: { gameId: string }
): Promise<void> {
  try {
    const { gameId } = payload;
    
    // Validate input
    if (!gameId) {
      sendMessage(ws, 'error', { message: 'Invalid game history request' });
      return;
    }
    
    logger.debug('Game history request', { gameId, sessionId });
    
    // Create game engine and load state
    const gameEngine = new GameEngine(gameId, defaultGameStateStorage);
    const loaded = await gameEngine.loadState();
    
    if (!loaded) {
      sendMessage(ws, 'error', { message: 'Game not found' });
      return;
    }
    
    // In a real implementation, we would:
    // 1. Generate or retrieve move history from the game state
    // 2. Format it in a user-friendly way (with notation)
    
    // For this simulation, we'll create a mock history based on lastMove
    const internalState = (gameEngine as any).gameState;
    let history = null;
    
    if (internalState) {
      // Mock history - in a real implementation this would be stored in the game state
      const mockMoves = [];
      
      // If there's a last move, add it to history
      if (internalState.lastMove) {
        mockMoves.push({
          id: 'move1',
          moveNumber: 1,
          player: internalState.currentTurn === 'white' ? 'black' : 'white', // Opposite of current turn
          san: `${getNotation(internalState.lastMove.from)}-${getNotation(internalState.lastMove.to)}`,
          extended: `${internalState.currentTurn === 'white' ? 'Black' : 'White'} moved from ${getNotation(internalState.lastMove.from)} to ${getNotation(internalState.lastMove.to)}`
        });
      }
      
      history = {
        moves: mockMoves,
        notationText: mockMoves.map(m => m.san).join(' ')
      };
    }
    
    // Send the game history
    sendMessage(ws, 'game_history_update', {
      gameId,
      history: history || { moves: [], notationText: '' }
    });
    
    logger.info('Game history sent', { gameId, sessionId });
  } catch (err) {
    logger.error('Error processing game history request', { error: err, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process game history request', 
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Convert position coordinates to chess notation
 * @param position The position to convert
 * @returns Chess notation (e.g., "e4")
 */
function getNotation(position: { x: number; y: number }): string {
  if (!position) return '';
  
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const file = files[position.x];
  const rank = position.y + 1;
  
  return `${file}${rank}`;
} 