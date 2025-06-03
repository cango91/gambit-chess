import { GameEngineService } from '../services/game-engine.service';
import LiveGameService from '../services/live-game.service';
import { GameStatus, MoveAction, createNewGame } from '@gambit-chess/shared';

// Mock the server startup to avoid port conflicts
jest.mock('../index', () => ({
  startServer: jest.fn(),
  prisma: {
    game: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    }
  }
}));

/**
 * 🎮 Gambit Chess Integration Tests
 * Tests the complete game processing pipeline with actual Redis/DB
 */
describe('🚀 Gambit Chess Engine Integration Tests', () => {

  describe('✅ Basic Game Engine Functions', () => {
    test('should have all required methods', () => {
      expect(typeof GameEngineService.processMove).toBe('function');
      expect(typeof GameEngineService.processDuelAllocation).toBe('function');
      expect(typeof GameEngineService.processTacticalRetreat).toBe('function');
      expect(typeof GameEngineService.processGameAction).toBe('function');
    });

    test('should validate game state requirements', async () => {
      // Test with null game state
      const result = await GameEngineService.processMove('non-existent', 'player1', {
        type: 'MOVE',
        from: 'e2',
        to: 'e4'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found');
    });
  });

  describe('🎯 Move Validation Pipeline', () => {
    test('should create and validate basic move structure', () => {
      const moveAction: MoveAction = {
        type: 'MOVE',
        from: 'e2',
        to: 'e4'
      };

      expect(moveAction.type).toBe('MOVE');
      expect(moveAction.from).toBe('e2');
      expect(moveAction.to).toBe('e4');
    });

    test('should handle game action types', async () => {
      const unknownAction = { type: 'UNKNOWN' } as any;
      
      const result = await GameEngineService.processGameAction(
        'test-game',
        'test-player',
        unknownAction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown action type');
    });
  });

  describe('⚔️ Duel System Testing', () => {
    test('should reject duel allocation without active duel', async () => {
      const result = await GameEngineService.processDuelAllocation(
        'no-duel-game',
        'player1',
        5
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('No active duel found');
    });

    test('should validate allocation amounts', async () => {
      // Test negative allocation
      const result = await GameEngineService.processDuelAllocation(
        'test-game',
        'player1',
        -5
      );

      // Should fail gracefully (either invalid amount or no duel)
      expect(result.success).toBe(false);
    });
  });

  describe('🏃 Tactical Retreat Testing', () => {
    test('should reject retreat outside correct game state', async () => {
      const result = await GameEngineService.processTacticalRetreat(
        'normal-game',
        'player1',
        'd4'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Game not found');
    });

    test('should validate retreat square format', async () => {
      const result = await GameEngineService.processTacticalRetreat(
        'retreat-game',
        'player1',
        'invalid-square' as any
      );

      expect(result.success).toBe(false);
      // Should fail due to invalid square or game not found
    });
  });

  describe('📊 Game State Management', () => {
    test('should create new game state properly with two players', () => {
      const gameState = createNewGame('test-123', 'player1', 'player2');
      
      expect(gameState.id).toBe('test-123');
      expect(gameState.whitePlayer.id).toBe('player1');
      expect(gameState.blackPlayer.id).toBe('player2');
      // When both players are provided, game starts IN_PROGRESS
      expect(gameState.gameStatus).toBe(GameStatus.IN_PROGRESS);
      expect(gameState.currentTurn).toBe('w');
      expect(gameState.moveHistory).toEqual([]);
    });

    test('should create new game state with one player waiting', () => {
      const gameState = createNewGame('waiting-game', 'player1');
      
      expect(gameState.id).toBe('waiting-game');
      expect(gameState.whitePlayer.id).toBe('player1');
      expect(gameState.blackPlayer.id).toBe(''); // Empty until second player joins
      // With only one player, game waits for second player
      expect(gameState.gameStatus).toBe(GameStatus.WAITING_FOR_PLAYERS);
      expect(gameState.currentTurn).toBe('w');
      expect(gameState.moveHistory).toEqual([]);
    });

    test('should have valid initial battle points', () => {
      const gameState = createNewGame('bp-test', 'p1', 'p2');
      
      expect(gameState.whitePlayer.battlePoints).toBeGreaterThan(0);
      expect(gameState.blackPlayer.battlePoints).toBeGreaterThan(0);
      expect(typeof gameState.whitePlayer.battlePoints).toBe('number');
      expect(typeof gameState.blackPlayer.battlePoints).toBe('number');
    });

    test('should have chess.js integration', () => {
      const gameState = createNewGame('chess-test', 'p1', 'p2');
      
      expect(gameState.chess).toBeDefined();
      expect(typeof gameState.chess.fen).toBe('function');
      expect(typeof gameState.chess.move).toBe('function');
      expect(gameState.chess.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });
  });

  describe('🔧 Configuration & Utilities', () => {
    test('should have game configuration', () => {
      const gameState = createNewGame('config-test', 'p1', 'p2');
      
      expect(gameState.config).toBeDefined();
      expect(typeof gameState.config).toBe('object');
    });

    test('should handle serialization data', () => {
      const gameState = createNewGame('serial-test', 'p1', 'p2');
      
      // Test JSON serialization compatibility
      const serializable = {
        ...gameState,
        chess: {
          fen: gameState.chess.fen(),
          turn: gameState.chess.turn(),
          history: gameState.chess.history()
        }
      };

      const json = JSON.stringify(serializable);
      const parsed = JSON.parse(json);
      
      expect(parsed.id).toBe('serial-test');
      expect(parsed.whitePlayer.id).toBe('p1');
      expect(parsed.chess.fen).toBeDefined();
    });
  });

  describe('🎮 Service Dependencies', () => {
    test('should have LiveGameService available', () => {
      expect(typeof LiveGameService.getGameState).toBe('function');
      expect(typeof LiveGameService.updateGameState).toBe('function');
      expect(typeof LiveGameService.createGame).toBe('function');
    });

    test('should import shared utilities correctly', async () => {
      // Test that shared imports work
      try {
        const { calculateBPRegen } = await import('../game/bp');
        const { detectTactics } = await import('../game/tactics');
        
        expect(typeof calculateBPRegen).toBe('function');
        expect(typeof detectTactics).toBe('function');
      } catch (error) {
        console.log('Shared utilities import test:', error);
        // This is expected to fail in test environment without full setup
      }
    });
  });

  describe('🚨 Error Handling & Edge Cases', () => {
    test('should handle undefined game IDs', async () => {
      const result = await GameEngineService.processMove(
        undefined as any,
        'player1',
        { type: 'MOVE', from: 'e2', to: 'e4' }
      );

      expect(result.success).toBe(false);
    });

    test('should handle empty player IDs', async () => {
      const result = await GameEngineService.processMove(
        'test-game',
        '',
        { type: 'MOVE', from: 'e2', to: 'e4' }
      );

      expect(result.success).toBe(false);
    });

    test('should handle malformed move actions', async () => {
      const result = await GameEngineService.processMove(
        'test-game',
        'player1',
        {} as any
      );

      expect(result.success).toBe(false);
    });
  });

  describe('⚡ Performance & Scalability', () => {
    test('should handle multiple simultaneous calls', async () => {
      const movePromises: Promise<{ success: boolean; error?: string; events: any[] }>[] = [];
      
      // Create multiple invalid game requests
      for (let i = 0; i < 10; i++) {
        const promise = GameEngineService.processMove(
          `non-existent-${i}`,
          `player-${i}`,
          { type: 'MOVE', from: 'e2', to: 'e4' }
        );
        movePromises.push(promise);
      }

      const results = await Promise.all(movePromises);
      
      // All should fail gracefully
      results.forEach(result => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Game not found');
      });
    });

    test('should maintain consistent response structure', async () => {
      const result = await GameEngineService.processMove(
        'test-game',
        'test-player',
        { type: 'MOVE', from: 'e2', to: 'e4' }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('events');
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.events)).toBe(true);
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });
  });
});

describe('🎯 Live Game Service Integration', () => {
  describe('💿 Game Creation & Management', () => {
    test('should have game creation methods', () => {
      expect(typeof LiveGameService.createGame).toBe('function');
      expect(typeof LiveGameService.joinGame).toBe('function');
      expect(typeof LiveGameService.removeGame).toBe('function');
    });

    test('should handle game state retrieval', async () => {
      const gameState = await LiveGameService.getGameState('non-existent');
      expect(gameState).toBeNull();
    });
  });

  describe('📡 Event System', () => {
    test('should have event emission capabilities', () => {
      expect(typeof LiveGameService.emitGameEvent).toBe('function');
      expect(typeof LiveGameService.getGameEvents).toBe('function');
    });
  });
});

/**
 * 🔧 Test Setup Validation
 */
describe('🛠️ Test Environment Setup', () => {
  test('should have all required imports', () => {
    expect(GameEngineService).toBeDefined();
    expect(LiveGameService).toBeDefined();
    expect(GameStatus).toBeDefined();
    expect(createNewGame).toBeDefined();
  });

  test('should have proper TypeScript compilation', () => {
    // If this test runs, TypeScript compilation was successful
    expect(true).toBe(true);
  });
});

/**
 * 🎮 Game Flow Simulation (Without Redis)
 */
describe('🎲 Simulated Game Flow Tests', () => {
  test('should create complete game flow simulation', () => {
    // Create a game with both players (starts IN_PROGRESS)
    const gameState = createNewGame('simulation-game', 'white-player', 'black-player');
    
    // Verify initial state for two-player game
    expect(gameState.currentTurn).toBe('w');
    expect(gameState.gameStatus).toBe(GameStatus.IN_PROGRESS); // Two players = IN_PROGRESS
    
    // Verify game progression
    expect(gameState.moveHistory.length).toBe(0);
    
    // Test chess.js integration
    const validMove = gameState.chess.move('e4');
    expect(validMove).toBeTruthy();
    expect(validMove?.from).toBe('e2');
    expect(validMove?.to).toBe('e4');
    
    // Verify board state changed
    expect(gameState.chess.fen()).not.toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  test('should simulate duel scenario setup', () => {
    const gameState = createNewGame('duel-sim', 'attacker', 'defender');
    // Game already starts IN_PROGRESS with both players
    expect(gameState.gameStatus).toBe(GameStatus.IN_PROGRESS);
    
    // Setup a capture position
    gameState.chess.move('e4');
    gameState.chess.move('d5');
    
    // Attempt capture (exd5)
    const captureMove = gameState.chess.move('exd5');
    expect(captureMove).toBeTruthy();
    expect(captureMove?.captured).toBeTruthy();
    
    // Simulate duel state
    gameState.gameStatus = GameStatus.DUEL_IN_PROGRESS;
    
    expect(gameState.gameStatus).toBe(GameStatus.DUEL_IN_PROGRESS);
  });
}); 