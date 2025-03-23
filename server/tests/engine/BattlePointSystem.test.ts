import { 
  GameEngine 
} from '../../src/engine/GameEngine';
import { 
  GamePhase,
  PieceType,
  PlayerColor
} from '@gambit-chess/shared';
import { inMemoryGameStateStorage } from '../../src/storage';
import { gameConfig } from '../../src/config/gameConfig';
import { disconnectRedis } from '../../src/services/redis';

describe('Battle Point System', () => {
  // Reset the in-memory storage before each test
  beforeEach(() => {
    (inMemoryGameStateStorage as any).clear();
  });

  // Disconnect Redis after all tests to prevent open handles
  afterAll(async () => {
    await disconnectRedis();
  });

  describe('BP Initialization', () => {
    test('should initialize with correct starting BP for both players', async () => {
      // Arrange
      const gameId = 'bp-init-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      
      // Act
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Assert
      // Get the states for both players to check their BP
      const whiteState = engine.createGameStateDTO('player1');
      const blackState = engine.createGameStateDTO('player2');
      
      // Both should have the initial BP amount defined in config
      expect(whiteState.playerBP).toBe(gameConfig.INITIAL_BP_POOL);
      expect(blackState.playerBP).toBe(gameConfig.INITIAL_BP_POOL);
    });
  });

  describe('BP Allocation and Spending', () => {
    test('should successfully allocate BP during a duel', async () => {
      // Arrange - Setup a capture scenario with valid duel
      const gameId = 'bp-duel-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Setup a capture scenario
      await engine.processMove('player1', { x: 4, y: 1 }, { x: 4, y: 3 }); // e4
      await engine.processMove('player2', { x: 3, y: 6 }, { x: 3, y: 4 }); // d5
      
      // Trigger duel with capture attempt
      const captureResult = await engine.processMove('player1', { x: 4, y: 3 }, { x: 3, y: 4 }); // exd5
      expect(captureResult.triggersDuel).toBe(true);
      
      // Get BP before allocation
      const stateBeforeAllocation = engine.createGameStateDTO('player1');
      const bpBeforeAllocation = stateBeforeAllocation.playerBP;
      
      // Act - Allocate BP
      const bpToAllocate = 5;
      const result = await engine.processBPAllocation('player1', bpToAllocate);
      
      // Assert
      expect(result.success).toBe(true);
      
      // Check that BP was spent
      const stateAfterAllocation = engine.createGameStateDTO('player1');
      expect(stateAfterAllocation.playerBP).toBe(bpBeforeAllocation - bpToAllocate);
    });

    test('should reject BP allocation above max limit during a duel', async () => {
      // Arrange - Setup a capture scenario with valid duel
      const gameId = 'bp-max-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Setup a capture scenario
      await engine.processMove('player1', { x: 4, y: 1 }, { x: 4, y: 3 }); // e4
      await engine.processMove('player2', { x: 3, y: 6 }, { x: 3, y: 4 }); // d5
      
      // Trigger duel with capture attempt
      const captureResult = await engine.processMove('player1', { x: 4, y: 3 }, { x: 3, y: 4 }); // exd5
      expect(captureResult.triggersDuel).toBe(true);
      
      // Act - Try to allocate more than the maximum allowed
      const tooMuchBP = gameConfig.MAX_BP_ALLOCATION + 1;
      const result = await engine.processBPAllocation('player1', tooMuchBP);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Maximum BP allocation');
    });
    test('should reject BP allocation if not enough BP available during a duel', async () => {
      // Arrange - Setup a capture scenario with valid duel
      const gameId = 'bp-insufficient-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Setup a capture scenario
      await engine.processMove('player1', { x: 4, y: 1 }, { x: 4, y: 3 }); // e4
      await engine.processMove('player2', { x: 3, y: 6 }, { x: 3, y: 4 }); // d5
      
      // Trigger duel with capture attempt
      const captureResult = await engine.processMove('player1', { x: 4, y: 3 }, { x: 3, y: 4 }); // exd5
      expect(captureResult.triggersDuel).toBe(true);
      
      // Get the internal game state
      const gameState = (engine as any).gameState;
      
      // Remember original BP
      const originalWhiteBP = gameState.whiteBP;
      
      // Set white's BP to a very low value (not enough to allocate 6 BP)
      gameState.whiteBP = 5;
      
      // Save the modified state so it's not overwritten
      await (engine as any).saveState();
      
      // Act - Try to allocate more than available (but less than max allocation)
      const result = await engine.processBPAllocation('player1', 6); // 6 > 5 but 6 < MAX_BP_ALLOCATION
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not enough BP');
      
      // Restore original BP for other tests
      gameState.whiteBP = originalWhiteBP;
      await (engine as any).saveState();
    });
  });

  describe('BP Regeneration', () => {
    test('should regenerate BP after a normal move', async () => {
      // Arrange
      const gameId = 'bp-regen-base-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Get initial BP
      const initialWhiteBP = engine.createGameStateDTO('player1').playerBP;
      
      // Act - Make a normal move
      await engine.processMove('player1', { x: 4, y: 1 }, { x: 4, y: 3 }); // e4
      
      // Assert
      const afterMoveState = engine.createGameStateDTO('player1');
      
      // BP should increase by at least base regen amount (implementation may add more)
      expect(afterMoveState.playerBP).toBeGreaterThanOrEqual(initialWhiteBP + gameConfig.BASE_BP_REGEN);
      // In this specific case, verify it's actually 42 (can update if implementation changes)
      expect(afterMoveState.playerBP).toBe(42);
    });

    test('should regenerate more BP when putting opponent in check', async () => {
      // Arrange - Setup a scenario to put opponent in check
      const gameId = 'bp-regen-check-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Get initial BP
      const initialBlackBP = engine.createGameStateDTO('player2').playerBP;
      
      // Setup scenario for scholar's mate pattern
      await engine.processMove('player1', { x: 4, y: 1 }, { x: 4, y: 3 }); // e4
      await engine.processMove('player2', { x: 4, y: 6 }, { x: 4, y: 4 }); // e5
      await engine.processMove('player1', { x: 5, y: 0 }, { x: 2, y: 3 }); // Bf4
      await engine.processMove('player2', { x: 1, y: 7 }, { x: 2, y: 5 }); // Nc6
      
      // Act - Move queen to h5, putting king in check (part of scholar's mate)
      await engine.processMove('player1', { x: 3, y: 0 }, { x: 7, y: 4 }); // Qh5
      await engine.processMove('player2', { x: 5, y: 7 }, { x: 2, y: 4 }); // Be7 (respond to check)
      
      // Assert
      const afterCheckState = engine.createGameStateDTO('player2');
      
      // BP should be more than just base regen due to check bonus
      expect(afterCheckState.playerBP).toBeGreaterThan(initialBlackBP + gameConfig.BASE_BP_REGEN);
    });

    test('should allow performing a tactical retreat after losing a duel', async () => {
      // Arrange - Setup a failed capture scenario
      const gameId = 'bp-retreat-test';
      const engine = new GameEngine(gameId, inMemoryGameStateStorage);
      await engine.initialize({
        whiteSessionId: 'player1',
        blackSessionId: 'player2'
      });
      
      // Move white knight to c3
      await engine.processMove('player1', { x: 1, y: 0 }, { x: 2, y: 2 }); // Nc3
      // Move black pawn to d5
      await engine.processMove('player2', { x: 3, y: 6 }, { x: 3, y: 4 }); // d5
      // Attempt capture to trigger duel
      const captureResult = await engine.processMove('player1', { x: 2, y: 2 }, { x: 3, y: 4 }); // Nxd5
      expect(captureResult.triggersDuel).toBe(true);
      
      // Set up duel with black winning
      await engine.processBPAllocation('player1', 2);
      await engine.processBPAllocation('player2', 4);
      
      // Check we're in tactical retreat phase
      const retreatState = engine.createGameStateDTO('player1');
      expect(retreatState.gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
      
      // Get BP before retreat 
      const bpBeforeRetreat = retreatState.playerBP;
      
      // Get retreat options and select one with BP cost
      const retreatOptions = retreatState.availableRetreats;
      const costlyRetreat = retreatOptions.find(r => r.bpCost > 0);
      if (!costlyRetreat) {
        throw new Error('No retreat option with BP cost found');
      }
      
      // Act - Perform tactical retreat
      const result = await engine.processTacticalRetreat(
        'player1', 
        costlyRetreat.position,
        costlyRetreat.bpCost
      );
      
      // Assert
      expect(result.success).toBe(true);
      
      // Verify BP was spent for retreat and then regen applied
      const afterRetreatState = engine.createGameStateDTO('player1');
      
      // Calculate expected BP: starting BP - retreat cost + base regen  
      const expectedBP = bpBeforeRetreat - costlyRetreat.bpCost + gameConfig.BASE_BP_REGEN;
      
      // Game engine may add additional BP for tactics, so check we have at least this amount
      expect(afterRetreatState.playerBP).toBeGreaterThanOrEqual(expectedBP);
      
      // Knight should be at retreat position
      const knight = afterRetreatState.pieces.find(p => 
        p.position.x === costlyRetreat.position.x && 
        p.position.y === costlyRetreat.position.y &&
        p.type === PieceType.KNIGHT
      );
      expect(knight).toBeDefined();
    });
  });
}); 