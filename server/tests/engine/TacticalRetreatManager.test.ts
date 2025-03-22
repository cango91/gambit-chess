import { GameState } from '../../src/engine/GameState';
import { TacticalRetreatManager } from '../../src/engine/TacticalRetreatManager';
import { DuelResolver } from '../../src/engine/DuelResolver';
import { MoveExecutor } from '../../src/engine/MoveExecutor';
import { ScenarioFactory } from '../../src/utils/ScenarioFactory';
import {
  PlayerColor,
  GamePhase,
  Position
} from '@gambit-chess/shared';

describe('TacticalRetreatManager', () => {
  // Setup for tactical retreat
  describe('retreat initiation', () => {
    it('should initiate tactical retreat when duel is lost by attacker', () => {
      // Create a duel scenario
      const gameState = ScenarioFactory.createDuelScenario();
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      
      // Attempt capture to trigger duel
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      // Make defender win
      duelResolver.allocateBP(PlayerColor.WHITE, 2);
      duelResolver.allocateBP(PlayerColor.BLACK, 3);
      
      // Game should be in tactical retreat phase
      const state = gameState.getState();
      expect(state.gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
      expect(state.tacticalRetreat).toBeDefined();
      
      // Check tactical retreat data
      const retreatData = state.tacticalRetreat;
      expect(retreatData?.piece.color).toBe(PlayerColor.WHITE);
      expect(retreatData?.piece.type).toBe('KNIGHT');
      expect(retreatData?.originalPosition).toEqual({ x: 2, y: 2 });
      expect(retreatData?.failedCapturePosition).toEqual({ x: 4, y: 4 });
      expect(retreatData?.retreatOptions.length).toBeGreaterThan(0);
    });
  });
  
  // Executing retreats
  describe('retreat execution', () => {
    it('should allow returning to original position with no BP cost', () => {
      // Setup a tactical retreat scenario
      const gameState = ScenarioFactory.createDuelScenario();
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      const tacticalRetreatManager = new TacticalRetreatManager(gameState);
      
      // Trigger duel and defender wins
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      duelResolver.allocateBP(PlayerColor.WHITE, 2);
      duelResolver.allocateBP(PlayerColor.BLACK, 3);
      
      // Initial BP value
      const initialBP = gameState.getPlayerBP(PlayerColor.WHITE);
      
      // Execute retreat back to original position
      const result = tacticalRetreatManager.executeRetreat(
        { x: 2, y: 2 }, // Original position
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(true);
      expect(result.bpCost).toBe(0); // No BP cost for returning to original position
      
      // Check BP value didn't change
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(initialBP);
      
      // Check that the knight is back at the original position
      const state = gameState.getState();
      const knight = state.pieces.find(p => 
        p.color === PlayerColor.WHITE && p.type === 'KNIGHT'
      );
      expect(knight?.position).toEqual({ x: 2, y: 2 });
      
      // Game should be back in normal move phase and it should be black's turn
      expect(state.gamePhase).toBe(GamePhase.NORMAL_MOVE);
      expect(state.currentTurn).toBe(PlayerColor.BLACK);
    });
    
    it('should allow retreating to a different position with BP cost', () => {
      // Setup a tactical retreat scenario
      const gameState = ScenarioFactory.createDuelScenario();
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      const tacticalRetreatManager = new TacticalRetreatManager(gameState);
      
      // Trigger duel and defender wins
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      duelResolver.allocateBP(PlayerColor.WHITE, 2);
      duelResolver.allocateBP(PlayerColor.BLACK, 3);
      
      // Wait for the game to enter tactical retreat phase
      expect(gameState.getState().gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
      
      // Initial BP value
      const initialBP = gameState.getPlayerBP(PlayerColor.WHITE);
      
      // Find a valid retreat option
      const retreatOptions = gameState.getState().tacticalRetreat?.retreatOptions || [];
      const retreatOption = retreatOptions.find(option => 
        option.position.x !== 2 || option.position.y !== 2 // Not the original position
      );
      
      expect(retreatOption).toBeDefined();
      
      if (retreatOption) {
        // Execute retreat to a different position
        const result = tacticalRetreatManager.executeRetreat(
          retreatOption.position,
          PlayerColor.WHITE
        );
        
        expect(result.success).toBe(true);
        expect(result.bpCost).toBeGreaterThan(0); // Should have a BP cost
        
        // Check BP was deducted
        expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(initialBP - (result.bpCost || 0));
        
        // Check that the knight is at the new position
        const state = gameState.getState();
        const knight = state.pieces.find(p => 
          p.color === PlayerColor.WHITE && p.type === 'KNIGHT'
        );
        expect(knight?.position).toEqual(retreatOption.position);
        
        // Game should be back in normal move phase
        expect(state.gamePhase).toBe(GamePhase.NORMAL_MOVE);
      }
    });
  });
  
  // Error cases
  describe('error cases', () => {
    it('should reject retreat when not in tactical retreat phase', () => {
      const gameState = new GameState();
      const tacticalRetreatManager = new TacticalRetreatManager(gameState);
      
      // Try to retreat during normal move phase
      const result = tacticalRetreatManager.executeRetreat(
        { x: 0, y: 0 },
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not in tactical retreat phase');
    });
    
    it('should reject retreat when position is invalid', () => {
      // Setup a tactical retreat scenario
      const gameState = ScenarioFactory.createDuelScenario();
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      const tacticalRetreatManager = new TacticalRetreatManager(gameState);
      
      // Trigger duel and defender wins
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      duelResolver.allocateBP(PlayerColor.WHITE, 2);
      duelResolver.allocateBP(PlayerColor.BLACK, 3);
      
      // Try to retreat to an invalid position
      const result = tacticalRetreatManager.executeRetreat(
        { x: 7, y: 7 }, // Invalid position (not in retreat options)
        PlayerColor.WHITE
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid retreat position');
    });
    
    it('should reject retreat when player has insufficient BP', () => {
      // Setup a tactical retreat scenario with low BP
      const gameState = ScenarioFactory.createDuelScenario();
      gameState.setPlayerBP(PlayerColor.WHITE, 1); // Set very low BP
      
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      const tacticalRetreatManager = new TacticalRetreatManager(gameState);
      
      // Trigger duel and defender wins
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      duelResolver.allocateBP(PlayerColor.WHITE, 1);
      duelResolver.allocateBP(PlayerColor.BLACK, 2);
      
      // Wait for the game to enter tactical retreat phase
      expect(gameState.getState().gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
      
      // Find a retreat option that costs more BP than we have
      const retreatOptions = gameState.getState().tacticalRetreat?.retreatOptions || [];
      const expensiveOption = retreatOptions.find(option => 
        option.position.x !== 2 || option.position.y !== 2 && // Not the original position
        option.bpCost > 0 // Has a BP cost
      );
      
      if (expensiveOption && expensiveOption.bpCost > gameState.getPlayerBP(PlayerColor.WHITE)) {
        // Try to retreat with insufficient BP
        const result = tacticalRetreatManager.executeRetreat(
          expensiveOption.position,
          PlayerColor.WHITE
        );
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('Not enough BP');
        expect(result.bpCost).toBe(expensiveOption.bpCost);
      }
    });
  });
}); 