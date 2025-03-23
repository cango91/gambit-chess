import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redis } from './redis';
import { handleCreateGame } from '../handlers/createGame';
import { handleMove } from '../handlers/move';
import { handleBPAllocation } from '../handlers/bpAllocation';
import { handleTacticalRetreat } from '../handlers/tacticalRetreat';
import { handleFindGame } from '../handlers/findGame';
import { handleJoinGame } from '../handlers/joinGame';

// Extend WebSocket type to include custom properties
interface ExtendedWebSocket extends WebSocket {
  // We don't need this anymore as we're using WeakMap
  // sessionId?: string;
  isAlive?: boolean;
}

// Store all active WebSocket connections with their session IDs
const connections = new Map<string, ExtendedWebSocket>();

// Store session IDs for each WebSocket instance
const sessions = new WeakMap<ExtendedWebSocket, string>();

// Track client health status
const clientStatus = new Map<string, {
  isAlive: boolean;
}>();

// Track game sessions: gameId -> [sessionIds]
const gameSessions = new Map<string, Set<string>>();

/**
 * Set up WebSocket server and message handlers
 */
export function setupWebSocketHandlers(wss: WebSocket.Server): void {
  wss.on('connection', (ws: ExtendedWebSocket) => {
    const clientId = uuidv4();
    
    // Initialize the connection with a session ID
    const sessionId = initializeConnection(ws);
    
    // Track client health status
    clientStatus.set(clientId, { isAlive: true });
    ws.isAlive = true;
    
    logger.info('Client connected', { clientId, sessionId });
    
    // Send initial session message
    sendMessage(ws, 'session', { sessionId });
    
    // Store session in Redis
    redis.session.save(sessionId, { clientId }, 86400); // 24 hour expiry
    
    // Set up ping/pong for connection health checks
    ws.on('pong', () => {
      ws.isAlive = true;
      const status = clientStatus.get(clientId);
      if (status) {
        status.isAlive = true;
      }
    });
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;
        
        logger.debug('Received message', { clientId, type, sessionId });
        
        // Update session if provided
        if (type === 'update_session' && payload.sessionId) {
          // Remove old session
          await redis.session.delete(sessionId);
          
          // Update session tracker
          sessions.delete(ws);
          sessions.set(ws, payload.sessionId);
          
          // Update connection
          connections.delete(sessionId);
          connections.set(payload.sessionId, ws);
          
          // Store session in Redis
          await redis.session.save(payload.sessionId, { clientId }, 86400);
          
          sendMessage(ws, 'session_updated', { sessionId: payload.sessionId });
          return;
        }
        
        // Validate session for game actions
        if (['move', 'bp_allocation', 'tactical_retreat'].includes(type)) {
          if (!validateSessionForGameAction(ws, sessionId, payload.gameId)) {
            sendError(ws, 'Unauthorized: Invalid session for this game action');
            logger.warn('Unauthorized game action attempt', { 
              sessionId,
              gameId: payload.gameId,
              actionType: type
            });
            return;
          }
        }
        
        // Route to appropriate handler based on message type
        switch (type) {
          case 'create_game':
            await handleCreateGame(ws, sessionId, payload);
            break;
            
          case 'find_game':
            await handleFindGame(ws, sessionId, payload);
            break;
            
          case 'join_game':
            await handleJoinGame(ws, sessionId, payload);
            // When a player joins a game, register their session with this game
            if (payload.gameId) {
              registerSessionWithGame(payload.gameId, sessionId);
            }
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
            
          case 'ping':
            // Respond to ping messages with a pong
            sendMessage(ws, 'pong', { timestamp: Date.now() });
            break;
            
          default:
            sendError(ws, 'Unsupported message type');
        }
      } catch (err) {
        logger.error('Error processing message', { clientId, error: err });
        sendError(ws, 'Invalid message format');
      }
    });
    
    // Handle disconnection
    ws.on('close', async () => {
      logger.info('Client disconnected', { clientId, sessionId });
      
      // Clean up resources
      handleConnectionClosed(ws);
      clientStatus.delete(clientId);
    });
  });
  
  // Setup periodic ping to detect disconnected clients
  setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      const sessionId = getSessionId(ws);
      if (!sessionId) return;
      
      const clientId = Array.from(connections.keys()).find(key => 
        connections.get(key) === ws
      );
      
      if (!clientId) return;
      
      if (ws.isAlive === false) {
        logger.info('Terminating inactive connection', { clientId, sessionId });
        ws.terminate();
        handleConnectionClosed(ws);
        clientStatus.delete(clientId);
        return;
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds
}

/**
 * Initialize a new WebSocket connection with a session ID
 * @param ws The WebSocket connection
 * @returns The session ID
 */
export function initializeConnection(ws: ExtendedWebSocket): string {
  // Generate a unique session ID
  const sessionId = uuidv4();
  
  // Store the connection by session ID
  connections.set(sessionId, ws);
  
  // Store session ID for this WebSocket
  sessions.set(ws, sessionId);
  
  // Initialize health status
  ws.isAlive = true;
  
  logger.debug('WebSocket connection initialized', { sessionId });
  
  return sessionId;
}

/**
 * Handle a WebSocket connection closing
 * @param ws The WebSocket connection that closed
 */
function handleConnectionClosed(ws: ExtendedWebSocket): void {
  const sessionId = sessions.get(ws);
  
  if (sessionId) {
    logger.debug('WebSocket connection closed', { sessionId });
    
    // Remove from connections map
    connections.delete(sessionId);
    sessions.delete(ws);
    
    // Cleanup session from any games it was participating in
    for (const [gameId, sessionsSet] of gameSessions.entries()) {
      if (sessionsSet.has(sessionId)) {
        sessionsSet.delete(sessionId);
        logger.debug('Removed session from game', { sessionId, gameId });
        
        // If no sessions left for this game, clean up the entry
        if (sessionsSet.size === 0) {
          gameSessions.delete(gameId);
          logger.debug('Removed empty game session tracking', { gameId });
        }
      }
    }
    
    // Here you would add any additional cleanup like:
    // - redis.matchmaking.markInactive(sessionId)
  }
}

/**
 * Register a session with a game for security validation
 * @param gameId The game ID
 * @param sessionId The session ID to register
 */
export function registerSessionWithGame(gameId: string, sessionId: string): void {
  if (!gameSessions.has(gameId)) {
    gameSessions.set(gameId, new Set<string>());
  }
  
  gameSessions.get(gameId)?.add(sessionId);
  logger.debug('Registered session with game', { sessionId, gameId });
}

/**
 * Validate that a session is authorized to perform actions on a game
 * This combines WebSocket connection validation with game session validation
 * @param ws The WebSocket connection
 * @param claimedSessionId The session ID claimed in the message
 * @param gameId The game ID being acted upon
 * @returns True if the session is valid for this game action
 */
export function validateSessionForGameAction(
  ws: ExtendedWebSocket, 
  claimedSessionId: string,
  gameId: string
): boolean {
  // Step 1: Verify the WebSocket connection is associated with this session
  const actualSessionId = sessions.get(ws);
  if (actualSessionId !== claimedSessionId) {
    logger.warn('WebSocket connection session mismatch', {
      claimedSessionId,
      actualSessionId,
      gameId
    });
    return false;
  }
  
  // Step 2: For existing games, verify this session is registered with the game
  if (gameId) {
    const gameSessions = getSessionsForGame(gameId);
    if (gameSessions.size > 0 && !gameSessions.has(claimedSessionId)) {
      // Only validate once we have session registrations for this game
      logger.warn('Session not registered with game', {
        sessionId: claimedSessionId,
        gameId,
        registeredSessions: Array.from(gameSessions)
      });
      return false;
    }
  }
  
  return true;
}

/**
 * Get all sessions registered with a game
 * @param gameId The game ID
 * @returns Set of session IDs
 */
export function getSessionsForGame(gameId: string): Set<string> {
  return gameSessions.get(gameId) || new Set<string>();
}

/**
 * Find a WebSocket connection by session ID
 * @param sessionId The session ID to look for
 * @returns The WebSocket connection if found, undefined otherwise
 */
export function findConnectionBySessionId(sessionId: string): ExtendedWebSocket | undefined {
  return connections.get(sessionId);
}

/**
 * Get the session ID for a WebSocket connection
 * @param ws The WebSocket connection
 * @returns The session ID if found, undefined otherwise
 */
export function getSessionId(ws: ExtendedWebSocket): string | undefined {
  return sessions.get(ws);
}

/**
 * Send a message to a client
 * @param ws The WebSocket connection
 * @param type The message type
 * @param payload The message payload
 */
export function sendMessage(
  ws: WebSocket,
  type: string,
  payload: any
): void {
  if (ws.readyState === WebSocket.OPEN) {
    try {
      const message = JSON.stringify({
        type,
        payload
      });
      
      ws.send(message);
    } catch (error) {
      logger.error('Error sending WebSocket message', { error, type });
    }
  }
}

/**
 * Send an error message to a client
 * @param ws The WebSocket connection
 * @param message The error message
 */
export function sendError(ws: WebSocket, message: string): void {
  sendMessage(ws, 'error', { message });
}

/**
 * Broadcast a message to all connected clients
 * @param type The message type
 * @param payload The message payload
 * @param excludeSessionId Optional session ID to exclude from the broadcast
 */
export function broadcastMessage(
  type: string,
  payload: any,
  excludeSessionId?: string
): void {
  try {
    const message = JSON.stringify({
      type,
      payload
    });
    
    // Send to all connected clients except excluded one
    connections.forEach((ws, sessionId) => {
      if (excludeSessionId && sessionId === excludeSessionId) {
        return;
      }
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  } catch (error) {
    logger.error('Error broadcasting WebSocket message', { error, type });
  }
}

/**
 * Get the number of active connections
 * @returns The number of active connections
 */
export function getActiveConnectionCount(): number {
  return connections.size;
}

/**
 * Get all active session IDs
 * @returns Array of active session IDs
 */
export function getActiveSessions(): string[] {
  return Array.from(connections.keys());
}

/**
 * Close a specific connection
 * @param sessionId The session ID to disconnect
 * @param code The WebSocket close code
 * @param reason The reason for closing
 * @returns True if the connection was found and closed
 */
export function closeConnection(
  sessionId: string,
  code?: number,
  reason?: string
): boolean {
  const ws = connections.get(sessionId);
  
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close(code, reason);
    return true;
  }
  
  return false;
} 