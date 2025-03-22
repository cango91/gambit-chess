import { GameState } from '../../src/engine/GameState';
import { DuelResolver } from '../../src/engine/DuelResolver';
import { MoveExecutor } from '../../src/engine/MoveExecutor';
import { ScenarioFactory } from '../../src/utils/ScenarioFactory';
import {
  PlayerColor,
  GamePhase,
  DuelOutcome,
  GameState as SharedGameState
} from '@gambit-chess/shared';

describe('DuelResolver', () => {
  // BP allocation
  describe('BP allocation', () => {
    it('should allow valid BP allocation', () => {
      // Create a duel scenario
      const gameState = ScenarioFactory.createDuelScenario();
      const duelResolver = new DuelResolver(gameState);
      
      // Set up a duel
      // White knight vs black bishop
      const moveExecutor = new MoveExecutor(gameState);
      
      // Attempt capture to trigger duel
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      expect(gameState.getState().gamePhase).toBe(GamePhase.DUEL_ALLOCATION);
      
      // Allocate 3 BP for white
      const whiteResult = duelResolver.allocateBP(PlayerColor.WHITE, 3);
      expect(whiteResult.success).toBe(true);
      
      // Check that BP was deducted from white's pool
      const stateAfterWhite = gameState.getState();
      expect(stateAfterWhite.whitePlayerBP).toBe(7); // 10 - 3
      
      // Allocate 2 BP for black
      const blackResult = duelResolver.allocateBP(PlayerColor.BLACK, 2);
      expect(blackResult.success).toBe(true);
      
      // Check that BP was deducted from black's pool
      const stateAfterBlack = gameState.getState();
      expect(stateAfterBlack.blackPlayerBP).toBe(8); // 10 - 2
      
      // Check that the duel was resolved automatically
      expect(stateAfterBlack.gamePhase).toBe(GamePhase.NORMAL_MOVE);
      
      // Check the outcome (white should win)
      const moveHistory = stateAfterBlack.moveHistory;
      expect(moveHistory.length).toBe(1);
      expect(moveHistory[0].duelOutcome).toBe(DuelOutcome.ATTACKER_WINS);
    });
    
    it('should reject BP allocation above piece capacity', () => {
      // Create a duel scenario with low BP
      const gameState = ScenarioFactory.createDuelScenario();
      gameState.setPlayerBP(PlayerColor.WHITE, 5);
      gameState.setPlayerBP(PlayerColor.BLACK, 5);
      
      const duelResolver = new DuelResolver(gameState);
      
      // Set up a duel
      const moveExecutor = new MoveExecutor(gameState);
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      // Try to allocate more BP than the knight's capacity (3)
      const result = duelResolver.allocateBP(PlayerColor.WHITE, 6);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid BP allocation');
      
      // BP should not be deducted
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(5);
    });
    
    it('should apply double cost for allocation beyond piece capacity', () => {
      // Create a duel scenario
      const gameState = ScenarioFactory.createDuelScenario();
      const duelResolver = new DuelResolver(gameState);
      
      // Set up a duel
      const moveExecutor = new MoveExecutor(gameState);
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      // Allocate 1 BP over knight's capacity (3+1)
      const result = duelResolver.allocateBP(PlayerColor.WHITE, 4);
      expect(result.success).toBe(true);
      
      // Check that BP cost was doubled for the extra point
      // Cost should be 3 + (1*2) = 5
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(5); // 10 - 5
    });
  });
  
  // Duel resolution
  describe('duel resolution', () => {
    it('should resolve with attacker winning when higher BP', () => {
      // Set up a duel with white attacking
      const gameState = ScenarioFactory.createDuelScenario();
      const duelResolver = new DuelResolver(gameState);
      const moveExecutor = new MoveExecutor(gameState);
      
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      // White allocates more BP
      duelResolver.allocateBP(PlayerColor.WHITE, 3);
      duelResolver.allocateBP(PlayerColor.BLACK, 1);
      
      // Check the outcome
      const state = gameState.getState();
      expect(state.moveHistory[0].duelOutcome).toBe(DuelOutcome.ATTACKER_WINS);
      
      // Check that the bishop is captured
      const bishop = state.pieces.find(p => 
        p.color === PlayerColor.BLACK && p.type === 'BISHOP'
      );
      expect(bishop).toBeUndefined();
      
      // Knight should be at the bishop's position
      const knight = state.pieces.find(p => 
        p.color === PlayerColor.WHITE && p.type === 'KNIGHT'
      );
      expect(knight?.position).toEqual({ x: 4, y: 4 });
    });
    
    it('should resolve with defender winning when higher BP', () => {
      // Set up a duel with white attacking
      const gameState = ScenarioFactory.createDuelScenario();
      const duelResolver = new DuelResolver(gameState);
      const moveExecutor = new MoveExecutor(gameState);
      
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      // Black allocates more BP
      duelResolver.allocateBP(PlayerColor.WHITE, 1);
      duelResolver.allocateBP(PlayerColor.BLACK, 3);
      
      // Check the outcome
      const state = gameState.getState();
      expect(state.moveHistory[0].duelOutcome).toBe(DuelOutcome.DEFENDER_WINS);
      
      // Knight should remain in its original position
      const knight = state.pieces.find(p => 
        p.color === PlayerColor.WHITE && p.type === 'KNIGHT'
      );
      expect(knight?.position).toEqual({ x: 2, y: 2 });
      
      // Bishop should remain in its position
      const bishop = state.pieces.find(p => 
        p.color === PlayerColor.BLACK && p.type === 'BISHOP'
      );
      expect(bishop?.position).toEqual({ x: 4, y: 4 });
      
      // Game phase should change to tactical retreat for attacker
      expect(state.gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
    });
    
    it('should resolve with tie when BP allocation is equal', () => {
      // Set up a duel with white attacking
      const gameState = ScenarioFactory.createDuelScenario();
      const duelResolver = new DuelResolver(gameState);
      const moveExecutor = new MoveExecutor(gameState);
      
      moveExecutor.executeMove(
        { x: 2, y: 2 }, // Knight at c3
        { x: 4, y: 4 }, // Bishop at e5
        PlayerColor.WHITE
      );
      
      // Equal BP allocation
      duelResolver.allocateBP(PlayerColor.WHITE, 2);
      duelResolver.allocateBP(PlayerColor.BLACK, 2);
      
      // Check the outcome
      const state = gameState.getState();
      expect(state.moveHistory[0].duelOutcome).toBe(DuelOutcome.TIE);
      
      // Knight should remain in its original position
      const knight = state.pieces.find(p => 
        p.color === PlayerColor.WHITE && p.type === 'KNIGHT'
      );
      expect(knight?.position).toEqual({ x: 2, y: 2 });
      
      // Bishop should remain in its position
      const bishop = state.pieces.find(p => 
        p.color === PlayerColor.BLACK && p.type === 'BISHOP'
      );
      expect(bishop?.position).toEqual({ x: 4, y: 4 });
      
      // Game phase should change to tactical retreat for attacker
      expect(state.gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
    });
  });
  
  // Edge cases
  describe('edge cases', () => {
    it('should prevent allocation when not in duel phase', () => {
      const gameState = new GameState();
      const duelResolver = new DuelResolver(gameState);
      
      // Try to allocate BP during normal move phase
      const result = duelResolver.allocateBP(PlayerColor.WHITE, 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not in duel allocation phase');
    });
    
    it('should prevent allocation when not a participant in the duel', () => {
      // Create a duel scenario with no pending duel
      const gameState = ScenarioFactory.createDuelScenario();
      
      // Manually set a pending duel with only white and black pieces
      const pendingDuel = {
        attackerPiece: {
          id: 'attacker',
          type: 'KNIGHT',
          color: PlayerColor.WHITE,
          position: { x: 0, y: 0 },
          hasMoved: false
        },
        defenderPiece: {
          id: 'defender',
          type: 'BISHOP',
          color: PlayerColor.BLACK,
          position: { x: 1, y: 1 },
          hasMoved: false
        },
        from: { x: 0, y: 0 },
        to: { x: 1, y: 1 }
      };
      
      gameState.setPendingDuel(pendingDuel);
      gameState.setGamePhase(GamePhase.DUEL_ALLOCATION);
      
      const duelResolver = new DuelResolver(gameState);
      
      // Try to allocate with an invalid color (neither white nor black)
      const result = duelResolver.allocateBP('RED' as PlayerColor, 3);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a participant in this duel');
    });
  });
}); 