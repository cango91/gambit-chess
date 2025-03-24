import { v4 as uuidv4 } from 'uuid';
import { redis, redisClient, disconnectRedis } from '../../src/services/redis';
import { RedisGameStateStorage } from '../../src/storage/RedisGameStateStorage';
// Import types from shared directly for testing
import { 
  GamePhase, 
  GameState, 
  PieceType, 
  PlayerColor, 
  PlayerRole 
} from '../../../shared/src';

// Define test timeouts
jest.setTimeout(30000);

describe('Redis Game State Storage Integration Tests', () => {
  let redisStorage: RedisGameStateStorage;
  
  beforeAll(async () => {
    // Create a fresh Redis connection for testing
    redisStorage = new RedisGameStateStorage();
  });
  
  afterAll(async () => {
    // Clean up Redis connection
    try {
      await disconnectRedis();
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  });
  
  beforeEach(async () => {
    // Clean up test data before each test
    const testKeys = await redisClient.keys('test:*');
    if (testKeys.length > 0) {
      await redisClient.del(testKeys);
    }
  });
  
  test('should save and retrieve game state correctly', async () => {
    // Arrange
    const gameId = `test:${uuidv4()}`;
    const initialGameState = {
      gameId,
      currentTurn: PlayerColor.WHITE,
      gamePhase: GamePhase.NORMAL_MOVE,
      gameState: GameState.ACTIVE,
      pieces: [
        {
          id: uuidv4(),
          type: PieceType.KING,
          color: PlayerColor.WHITE,
          position: { x: 4, y: 0 },
          hasMoved: false
        },
        {
          id: uuidv4(),
          type: PieceType.KING,
          color: PlayerColor.BLACK,
          position: { x: 4, y: 7 },
          hasMoved: false
        }
      ],
      capturedPieces: [],
      bpPool: {
        [PlayerColor.WHITE]: 39,
        [PlayerColor.BLACK]: 39
      },
      players: {
        [PlayerColor.WHITE]: { connected: true, sessionId: uuidv4() },
        [PlayerColor.BLACK]: { connected: true, sessionId: uuidv4() }
      },
      lastMove: null,
      check: {
        [PlayerColor.WHITE]: false,
        [PlayerColor.BLACK]: false
      },
      moveHistory: [],
      timeControl: {
        [PlayerColor.WHITE]: 600,
        [PlayerColor.BLACK]: 600
      },
      created: new Date().toISOString()
    };
    
    // Act
    await redisStorage.saveGameState(gameId, initialGameState);
    const retrievedState = await redisStorage.getGameState(gameId);
    
    // Assert
    expect(retrievedState).not.toBeNull();
    expect(retrievedState?.gameId).toBe(gameId);
    expect(retrievedState?.currentTurn).toBe(PlayerColor.WHITE);
    expect(retrievedState?.gamePhase).toBe(GamePhase.NORMAL_MOVE);
    expect(retrievedState?.gameState).toBe(GameState.ACTIVE);
    expect(retrievedState?.pieces.length).toBe(2);
    expect(retrievedState?.bpPool[PlayerColor.WHITE]).toBe(39);
    expect(retrievedState?.bpPool[PlayerColor.BLACK]).toBe(39);
  });
  
  test('should return null when game state does not exist', async () => {
    // Arrange
    const nonExistentGameId = `test:non-existent-${uuidv4()}`;
    
    // Act
    const retrievedState = await redisStorage.getGameState(nonExistentGameId);
    
    // Assert
    expect(retrievedState).toBeNull();
  });
  
  test('should update existing game state correctly', async () => {
    // Arrange
    const gameId = `test:${uuidv4()}`;
    const initialGameState = {
      gameId,
      currentTurn: PlayerColor.WHITE,
      gamePhase: GamePhase.NORMAL_MOVE,
      gameState: GameState.ACTIVE,
      pieces: [
        {
          id: uuidv4(),
          type: PieceType.KING,
          color: PlayerColor.WHITE,
          position: { x: 4, y: 0 },
          hasMoved: false
        },
        {
          id: uuidv4(),
          type: PieceType.KING,
          color: PlayerColor.BLACK,
          position: { x: 4, y: 7 },
          hasMoved: false
        }
      ],
      capturedPieces: [],
      bpPool: {
        [PlayerColor.WHITE]: 39,
        [PlayerColor.BLACK]: 39
      },
      players: {
        [PlayerColor.WHITE]: { connected: true, sessionId: uuidv4() },
        [PlayerColor.BLACK]: { connected: true, sessionId: uuidv4() }
      },
      lastMove: null,
      check: {
        [PlayerColor.WHITE]: false,
        [PlayerColor.BLACK]: false
      },
      moveHistory: [],
      timeControl: {
        [PlayerColor.WHITE]: 600,
        [PlayerColor.BLACK]: 600
      },
      created: new Date().toISOString()
    };
    
    // Save initial state
    await redisStorage.saveGameState(gameId, initialGameState);
    
    // Update state
    const updatedGameState = {
      ...initialGameState,
      currentTurn: PlayerColor.BLACK,
      gamePhase: GamePhase.DUEL_ALLOCATION,
      bpPool: {
        [PlayerColor.WHITE]: 35,
        [PlayerColor.BLACK]: 39
      },
      lastMove: {
        from: { x: 4, y: 1 },
        to: { x: 4, y: 3 },
        piece: {
          id: uuidv4(),
          type: PieceType.PAWN,
          color: PlayerColor.WHITE,
          position: { x: 4, y: 3 },
          hasMoved: true
        }
      }
    };
    
    // Act
    await redisStorage.saveGameState(gameId, updatedGameState);
    const retrievedState = await redisStorage.getGameState(gameId);
    
    // Assert
    expect(retrievedState).not.toBeNull();
    expect(retrievedState?.currentTurn).toBe(PlayerColor.BLACK);
    expect(retrievedState?.gamePhase).toBe(GamePhase.DUEL_ALLOCATION);
    expect(retrievedState?.bpPool[PlayerColor.WHITE]).toBe(35);
    expect(retrievedState?.lastMove).not.toBeNull();
    expect(retrievedState?.lastMove?.from).toEqual({ x: 4, y: 1 });
    expect(retrievedState?.lastMove?.to).toEqual({ x: 4, y: 3 });
  });
  
  test('should delete game state correctly', async () => {
    // Arrange
    const gameId = `test:${uuidv4()}`;
    const initialGameState = {
      gameId,
      currentTurn: PlayerColor.WHITE,
      gamePhase: GamePhase.NORMAL_MOVE,
      gameState: GameState.ACTIVE,
      pieces: [],
      capturedPieces: [],
      bpPool: {
        [PlayerColor.WHITE]: 39,
        [PlayerColor.BLACK]: 39
      },
      players: {},
      lastMove: null,
      check: {
        [PlayerColor.WHITE]: false,
        [PlayerColor.BLACK]: false
      },
      moveHistory: [],
      timeControl: {
        [PlayerColor.WHITE]: 600,
        [PlayerColor.BLACK]: 600
      },
      created: new Date().toISOString()
    };
    
    // Save initial state
    await redisStorage.saveGameState(gameId, initialGameState);
    
    // Verify it exists
    const stateBeforeDelete = await redisStorage.getGameState(gameId);
    expect(stateBeforeDelete).not.toBeNull();
    
    // Act
    await redisStorage.deleteGameState(gameId);
    
    // Assert
    const stateAfterDelete = await redisStorage.getGameState(gameId);
    expect(stateAfterDelete).toBeNull();
  });
  
  test('should handle connection errors gracefully', async () => {
    // Mock Redis client error
    const originalHget = redisClient.hget;
    
    // Replace hget with a function that throws an error
    redisClient.hget = jest.fn().mockRejectedValue(new Error('Redis connection error'));
    
    try {
      // Act & Assert - The implementation returns null on error rather than throwing
      const result = await redisStorage.getGameState('test:some-game');
      expect(result).toBeNull();
    } finally {
      // Restore original function
      redisClient.hget = originalHget;
    }
  });
  
  test('should handle expiring game states', async () => {
    // Arrange
    const gameId = `test:${uuidv4()}`;
    const initialGameState = {
      gameId,
      currentTurn: PlayerColor.WHITE,
      gamePhase: GamePhase.NORMAL_MOVE,
      gameState: GameState.ACTIVE,
      pieces: [],
      capturedPieces: [],
      bpPool: {
        [PlayerColor.WHITE]: 39,
        [PlayerColor.BLACK]: 39
      },
      players: {},
      lastMove: null,
      check: {
        [PlayerColor.WHITE]: false,
        [PlayerColor.BLACK]: false
      },
      moveHistory: [],
      timeControl: {
        [PlayerColor.WHITE]: 600,
        [PlayerColor.BLACK]: 600
      },
      created: new Date().toISOString()
    };
    
    // Act
    await redisStorage.saveGameState(gameId, initialGameState, 1); // Expire after 1 second
    
    // Verify it exists
    const stateBeforeExpiry = await redisStorage.getGameState(gameId);
    expect(stateBeforeExpiry).not.toBeNull();
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 seconds
    
    // Assert
    const stateAfterExpiry = await redisStorage.getGameState(gameId);
    expect(stateAfterExpiry).toBeNull();
  });
}); 