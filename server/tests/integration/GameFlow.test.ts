import { GameState } from '../../src/engine/GameState';
import { MoveExecutor } from '../../src/engine/MoveExecutor';
import { DuelResolver } from '../../src/engine/DuelResolver';
import { TacticalRetreatManager } from '../../src/engine/TacticalRetreatManager';
import { ScenarioFactory } from '../../src/utils/ScenarioFactory';
import {
  PlayerColor,
  GamePhase,
  MoveType,
  GameState as SharedGameState
} from '@gambit-chess/shared';

describe('Game Flow Integration', () => {
  // Full game flow with normal moves
  describe('normal moves', () => {
    it('should execute a sequence of normal moves correctly', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // First move: e4
      const move1 = moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        PlayerColor.WHITE
      );
      
      expect(move1.success).toBe(true);
      expect(gameState.getState().currentTurn).toBe(PlayerColor.BLACK);
      
      // Second move: e5
      const move2 = moveExecutor.executeMove(
        { x: 4, y: 6 }, // e7
        { x: 4, y: 4 }, // e5
        PlayerColor.BLACK
      );
      
      expect(move2.success).toBe(true);
      expect(gameState.getState().currentTurn).toBe(PlayerColor.WHITE);
      
      // Third move: Nf3
      const move3 = moveExecutor.executeMove(
        { x: 6, y: 0 }, // g1
        { x: 5, y: 2 }, // f3
        PlayerColor.WHITE
      );
      
      expect(move3.success).toBe(true);
      expect(gameState.getState().currentTurn).toBe(PlayerColor.BLACK);
      
      // Fourth move: Nc6
      const move4 = moveExecutor.executeMove(
        { x: 1, y: 7 }, // b8
        { x: 2, y: 5 }, // c6
        PlayerColor.BLACK
      );
      
      expect(move4.success).toBe(true);
      expect(gameState.getState().currentTurn).toBe(PlayerColor.WHITE);
      
      // Check move history
      const state = gameState.getState();
      expect(state.moveHistory.length).toBe(4);
      expect(state.gamePhase).toBe(GamePhase.NORMAL_MOVE);
      expect(state.gameState).toBe(SharedGameState.ACTIVE);
    });
  });
  
  // Duel flow
  describe('duel flow', () => {
    it('should handle the complete duel flow correctly', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      
      // First move: e4
      moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        PlayerColor.WHITE
      );
      
      // Second move: d5
      moveExecutor.executeMove(
        { x: 3, y: 6 }, // d7
        { x: 3, y: 4 }, // d5
        PlayerColor.BLACK
      );
      
      // Third move: exd5 (capture attempt - triggers duel)
      const captureResult = moveExecutor.executeMove(
        { x: 4, y: 3 }, // e4
        { x: 3, y: 4 }, // d5
        PlayerColor.WHITE
      );
      
      expect(captureResult.success).toBe(true);
      expect(captureResult.triggersDuel).toBe(true);
      expect(gameState.getState().gamePhase).toBe(GamePhase.DUEL_ALLOCATION);
      
      // Allocate BP for white (attacker)
      const whiteAllocation = duelResolver.allocateBP(PlayerColor.WHITE, 2);
      expect(whiteAllocation.success).toBe(true);
      
      // Allocate BP for black (defender)
      const blackAllocation = duelResolver.allocateBP(PlayerColor.BLACK, 1);
      expect(blackAllocation.success).toBe(true);
      
      // After both allocations, duel should resolve automatically
      // White allocated more, so white should win
      
      const stateAfterDuel = gameState.getState();
      expect(stateAfterDuel.gamePhase).toBe(GamePhase.NORMAL_MOVE);
      
      // Check that white pawn captured black pawn
      const whitePawn = stateAfterDuel.pieces.find(p => 
        p.color === PlayerColor.WHITE && 
        p.type === 'PAWN' && 
        p.position.x === 3 && 
        p.position.y === 4
      );
      expect(whitePawn).toBeDefined();
      
      // Check that black pawn is captured
      const blackPawn = stateAfterDuel.pieces.find(p => 
        p.color === PlayerColor.BLACK && 
        p.type === 'PAWN' && 
        p.position.x === 3 && 
        p.position.y === 4
      );
      expect(blackPawn).toBeUndefined();
      
      // Check move history
      expect(stateAfterDuel.moveHistory.length).toBe(3);
      expect(stateAfterDuel.moveHistory[2].type).toBe(MoveType.CAPTURE);
      expect(stateAfterDuel.moveHistory[2].capturedPiece).toBeDefined();
      
      // Check BP was deducted
      expect(stateAfterDuel.whitePlayerBP).toBe(39 - 2);
      expect(stateAfterDuel.blackPlayerBP).toBe(39 - 1);
    });
  });
  
  // Tactical retreat flow
  describe('tactical retreat flow', () => {
    it('should handle tactical retreat flow when attacker loses duel', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      const duelResolver = new DuelResolver(gameState);
      const tacticalRetreatManager = new TacticalRetreatManager(gameState);
      
      // First move: Nf3
      moveExecutor.executeMove(
        { x: 6, y: 0 }, // g1
        { x: 5, y: 2 }, // f3
        PlayerColor.WHITE
      );
      
      // Second move: e5
      moveExecutor.executeMove(
        { x: 4, y: 6 }, // e7
        { x: 4, y: 4 }, // e5
        PlayerColor.BLACK
      );
      
      // Third move: Ne5 (capture attempt - triggers duel)
      const captureResult = moveExecutor.executeMove(
        { x: 5, y: 2 }, // f3
        { x: 4, y: 4 }, // e5
        PlayerColor.WHITE
      );
      
      expect(captureResult.success).toBe(true);
      expect(captureResult.triggersDuel).toBe(true);
      
      // Allocate BP (black defends with more)
      duelResolver.allocateBP(PlayerColor.WHITE, 2);
      duelResolver.allocateBP(PlayerColor.BLACK, 3);
      
      // After both allocations, duel should resolve with black winning
      // This should trigger tactical retreat for white's knight
      
      const stateAfterDuel = gameState.getState();
      expect(stateAfterDuel.gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
      expect(stateAfterDuel.tacticalRetreat).toBeDefined();
      
      // Knights can retreat to multiple squares - let's choose one
      const retreatOptions = stateAfterDuel.tacticalRetreat?.retreatOptions || [];
      const retreatOption = retreatOptions.find(option => 
        option.position.x === 5 && option.position.y === 0 // Return to original g1
      );
      
      expect(retreatOption).toBeDefined();
      
      if (retreatOption) {
        // Execute retreat
        const retreatResult = tacticalRetreatManager.executeRetreat(
          retreatOption.position,
          PlayerColor.WHITE
        );
        
        expect(retreatResult.success).toBe(true);
        
        // Check that knight is back at retreat position
        const stateAfterRetreat = gameState.getState();
        const knight = stateAfterRetreat.pieces.find(p => 
          p.color === PlayerColor.WHITE && p.type === 'KNIGHT'
        );
        
        expect(knight?.position).toEqual(retreatOption.position);
        
        // Game should be back in normal move phase and it should be black's turn
        expect(stateAfterRetreat.gamePhase).toBe(GamePhase.NORMAL_MOVE);
        expect(stateAfterRetreat.currentTurn).toBe(PlayerColor.BLACK);
      }
    });
  });
  
  // Checkmate flow
  describe('checkmate flow', () => {
    it('should detect checkmate correctly', () => {
      // Use Scholar's mate sequence
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // 1. e4
      moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        PlayerColor.WHITE
      );
      
      // 1... e5
      moveExecutor.executeMove(
        { x: 4, y: 6 }, // e7
        { x: 4, y: 4 }, // e5
        PlayerColor.BLACK
      );
      
      // 2. Bc4
      moveExecutor.executeMove(
        { x: 5, y: 0 }, // f1
        { x: 2, y: 3 }, // c4
        PlayerColor.WHITE
      );
      
      // 2... Nc6
      moveExecutor.executeMove(
        { x: 1, y: 7 }, // b8
        { x: 2, y: 5 }, // c6
        PlayerColor.BLACK
      );
      
      // 3. Qh5
      moveExecutor.executeMove(
        { x: 3, y: 0 }, // d1
        { x: 7, y: 4 }, // h5
        PlayerColor.WHITE
      );
      
      // 3... Nf6?? (blunder)
      moveExecutor.executeMove(
        { x: 6, y: 7 }, // g8
        { x: 5, y: 5 }, // f6
        PlayerColor.BLACK
      );
      
      // 4. Qxf7# (checkmate)
      // Would normally trigger a duel, but we'll simplify for this test
      // by making white have overwhelming BP
      gameState.setPlayerBP(PlayerColor.WHITE, 100);
      gameState.setPlayerBP(PlayerColor.BLACK, 1);
      
      const captureResult = moveExecutor.executeMove(
        { x: 7, y: 4 }, // h5
        { x: 5, y: 6 }, // f7
        PlayerColor.WHITE
      );
      
      expect(captureResult.success).toBe(true);
      expect(captureResult.triggersDuel).toBe(true);
      
      // Complete the duel with white winning
      const duelResolver = new DuelResolver(gameState);
      duelResolver.allocateBP(PlayerColor.WHITE, 10);
      duelResolver.allocateBP(PlayerColor.BLACK, 1);
      
      // Check game state
      const finalState = gameState.getState();
      expect(finalState.gameState).toBe(SharedGameState.CHECKMATE);
      
      // Black should be in check
      expect(gameState.isInCheck(PlayerColor.BLACK)).toBe(true);
    });
  });
}); 