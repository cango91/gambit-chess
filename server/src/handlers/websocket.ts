import WebSocket from 'ws';
import { logger } from '../utils/logger';
import { initializeConnection, getSessionId, sendMessage } from '../services/websocket';

// Import all handler functions
import { handleCreateGame } from './createGame';
import { handleJoinGame } from './joinGame';
import { handleMove } from './move';
import { handleBPAllocation } from './bpAllocation';
import { handleTacticalRetreat } from './tacticalRetreat';
import { handleFindGame } from './findGame';

/**
 * Handle an incoming WebSocket connection
 * @param ws The WebSocket connection
 */
export function handleConnection(ws: WebSocket): void {
  // Initialize the connection and get a session ID
  const sessionId = initializeConnection(ws);
  
  logger.info('New WebSocket connection established', { sessionId });
  
  // Send session confirmation to client
  sendMessage(ws, 'session', { sessionId });
  
  // Set up message handler
  ws.on('message', (data: WebSocket.Data) => {
    handleMessage(ws, sessionId, data);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    logger.error('WebSocket error', { error, sessionId });
  });
}

/**
 * Handle an incoming message from a client
 * @param ws The WebSocket connection
 * @param sessionId The client's session ID
 * @param data The raw message data
 */
async function handleMessage(
  ws: WebSocket,
  sessionId: string,
  data: WebSocket.Data
): Promise<void> {
  try {
    // Parse the message data
    const message = JSON.parse(data.toString());
    const { type, payload } = message;
    
    logger.debug('Received WebSocket message', { type, sessionId });
    
    // Route the message to the appropriate handler
    switch (type) {
      case 'create_game':
        await handleCreateGame(ws, sessionId, payload);
        break;
        
      case 'join_game':
        await handleJoinGame(ws, sessionId, payload);
        break;
        
      case 'move':
        await handleMove(ws, sessionId, payload);
        break;
        
      case 'bp_allocation':
        await handleBPAllocation(ws, sessionId, payload);
        break;
        
      case 'tactical_retreat':
        await handleTacticalRetreat(ws, sessionId, payload);
        break;
        
      case 'find_game':
        await handleFindGame(ws, sessionId, payload);
        break;
        
      case 'ping':
        // Respond to ping messages with a pong
        sendMessage(ws, 'pong', { timestamp: Date.now() });
        break;
        
      default:
        logger.warn('Unknown message type received', { type, sessionId });
        sendMessage(ws, 'error', { message: 'Unknown message type' });
    }
  } catch (error) {
    logger.error('Error handling WebSocket message', { error, sessionId });
    
    // Send error to client
    sendMessage(ws, 'error', { 
      message: 'Failed to process message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 