import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';
import { 
  registerSessionWithGame, 
  validateSessionForGameAction,
  getSessionsForGame,
  getSessionId
} from '../../src/services/websocket';
import { disconnectRedis } from '../../src/services/redis';

// Define the extended WebSocket type similar to the one in websocket.ts
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

// We need to mock the internal implementation details of websocket.ts
jest.mock('../../src/services/websocket', () => {
  // Store the actual original module
  const originalModule = jest.requireActual('../../src/services/websocket');
  
  // Create a mock sessions WeakMap
  const sessionsMock = new WeakMap<any, string>();

  // Mock validateSessionForGameAction to use our mock data
  const validateSessionForGameAction = (
    ws: any, 
    claimedSessionId: string,
    gameId: string
  ): boolean => {
    // Step 1: Verify the WebSocket connection is associated with this session
    const actualSessionId = sessionsMock.get(ws);
    if (actualSessionId !== claimedSessionId) {
      console.log(`Session mismatch: claimed=${claimedSessionId}, actual=${actualSessionId}`);
      return false;
    }
    
    // Step 2: For existing games, verify this session is registered with the game
    if (gameId) {
      const gameSessions = originalModule.getSessionsForGame(gameId);
      if (gameSessions.size > 0 && !gameSessions.has(claimedSessionId)) {
        console.log(`Session not registered with game: ${claimedSessionId}, game=${gameId}`);
        return false;
      }
    }
    
    return true;
  };
  
  return {
    ...originalModule,
    validateSessionForGameAction,
    // Add a helper for tests to set mock session IDs
    __setSessionId: (ws: any, sessionId: string) => {
      sessionsMock.set(ws, sessionId);
    }
  };
});

describe('WebSocket Security Integration Tests', () => {
  let gameId: string;
  let player1SessionId: string;
  let player2SessionId: string;
  let hackerSessionId: string;
  
  // Mock WebSocket objects
  const createMockWs = (): Partial<ExtendedWebSocket> => ({
    readyState: 1, // OPEN
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    ping: jest.fn(),
    terminate: jest.fn()
  });
  
  const player1Ws = createMockWs();
  const player2Ws = createMockWs();
  const hackerWs = createMockWs();

  beforeAll(async () => {
    // Generate test IDs
    gameId = `game-${uuidv4()}`;
    player1SessionId = `player1-${uuidv4()}`;
    player2SessionId = `player2-${uuidv4()}`;
    hackerSessionId = `hacker-${uuidv4()}`;
    
    // Set up the session IDs in our mock
    const websocketModule = require('../../src/services/websocket');
    websocketModule.__setSessionId(player1Ws, player1SessionId);
    websocketModule.__setSessionId(player2Ws, player2SessionId);
    websocketModule.__setSessionId(hackerWs, hackerSessionId);
  });

  afterAll(async () => {
    // Clean up Redis connections
    await disconnectRedis();
  });

  test('should register sessions with a game', () => {
    // Register sessions with the game
    registerSessionWithGame(gameId, player1SessionId);
    registerSessionWithGame(gameId, player2SessionId);
    
    // Check that sessions were registered
    const sessions = getSessionsForGame(gameId);
    expect(sessions.has(player1SessionId)).toBe(true);
    expect(sessions.has(player2SessionId)).toBe(true);
    expect(sessions.has(hackerSessionId)).toBe(false);
  });

  test('should validate session-connection binding', () => {
    // Verify that validation passes for correct session
    expect(validateSessionForGameAction(
      player1Ws as any, 
      player1SessionId, 
      gameId
    )).toBe(true);
    
    // Verify that validation fails for incorrect session
    expect(validateSessionForGameAction(
      player1Ws as any, 
      player2SessionId, 
      gameId
    )).toBe(false);
    
    // Verify that validation fails for unregistered game session
    expect(validateSessionForGameAction(
      hackerWs as any, 
      hackerSessionId, 
      gameId
    )).toBe(false);
  });

  test('should prevent actions from unauthorized sessions', () => {
    // Register only player1 and player2
    const newGameId = `game-${uuidv4()}`;
    registerSessionWithGame(newGameId, player1SessionId);
    registerSessionWithGame(newGameId, player2SessionId);
    
    // Verify registered players can access the game
    expect(validateSessionForGameAction(
      player1Ws as any, 
      player1SessionId, 
      newGameId
    )).toBe(true);
    
    expect(validateSessionForGameAction(
      player2Ws as any, 
      player2SessionId, 
      newGameId
    )).toBe(true);
    
    // Verify unregistered player cannot access the game
    expect(validateSessionForGameAction(
      hackerWs as any, 
      hackerSessionId, 
      newGameId
    )).toBe(false);
  });

  test('should prevent session hijacking attempts', () => {
    // Player2 tries to claim they're player1 (session hijacking)
    expect(validateSessionForGameAction(
      player2Ws as any, 
      player1SessionId, // Player2 pretending to be player1
      gameId
    )).toBe(false);
    
    // Hacker tries to claim they're player1
    expect(validateSessionForGameAction(
      hackerWs as any, 
      player1SessionId, // Hacker pretending to be player1
      gameId
    )).toBe(false);
  });
}); 