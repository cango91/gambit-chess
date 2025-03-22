import { GameState } from '../../src/engine/GameState';
import { BPRegenerationService } from '../../src/engine/BPRegenerationService';
import { MoveExecutor } from '../../src/engine/MoveExecutor';
import { ScenarioFactory } from '../../src/utils/ScenarioFactory';
import {
  PlayerColor,
  MoveType,
  PieceType,
  Position
} from '@gambit-chess/shared';

describe('BPRegenerationService', () => {
  // Basic BP regeneration
  describe('basic regeneration', () => {
    it('should provide base regeneration for normal moves', () => {
      const gameState = new GameState();
      const bpRegenerationService = new BPRegenerationService(gameState);
      
      // Calculate regeneration for a normal pawn move
      const regeneration = bpRegenerationService.calculateRegeneration(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        MoveType.NORMAL,
        {
          id: 'pawn',
          type: PieceType.PAWN,
          color: PlayerColor.WHITE,
          position: { x: 4, y: 3 }, // e4
          hasMoved: true
        }
      );
      
      // Should at least provide base regeneration (1 BP)
      expect(regeneration).toBeGreaterThanOrEqual(1);
    });
  });
  
  // Tactical BP regeneration
  describe('tactical regeneration', () => {
    it('should provide additional BP for fork', () => {
      // Setup a scenario where a piece can fork
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // Add white knight at d5
      pieces.push({
        id: 'white-knight',
        type: PieceType.KNIGHT,
        color: PlayerColor.WHITE,
        position: { x: 3, y: 4 }, // d5
        hasMoved: true
      });
      
      // Add black rook at c7
      pieces.push({
        id: 'black-rook1',
        type: PieceType.ROOK,
        color: PlayerColor.BLACK,
        position: { x: 2, y: 6 }, // c7
        hasMoved: true
      });
      
      // Add black bishop at e7
      pieces.push({
        id: 'black-bishop',
        type: PieceType.BISHOP,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 6 }, // e7
        hasMoved: true
      });
      
      gameState.setBoardState(pieces);
      
      const bpRegenerationService = new BPRegenerationService(gameState);
      
      // Move knight to b6, forking the two black pieces
      const regeneration = bpRegenerationService.calculateRegeneration(
        { x: 3, y: 4 }, // d5
        { x: 1, y: 5 }, // b6
        MoveType.NORMAL,
        {
          id: 'white-knight',
          type: PieceType.KNIGHT,
          color: PlayerColor.WHITE,
          position: { x: 1, y: 5 }, // b6
          hasMoved: true
        }
      );
      
      // Should provide extra BP for fork (base + fork bonus)
      const baseRegen = 1;
      expect(regeneration).toBeGreaterThan(baseRegen);
    });
    
    it('should provide additional BP for pin', () => {
      // Setup a scenario where a piece can pin another
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // Add white bishop at c4
      pieces.push({
        id: 'white-bishop',
        type: PieceType.BISHOP,
        color: PlayerColor.WHITE,
        position: { x: 2, y: 3 }, // c4
        hasMoved: true
      });
      
      // Add black knight at e6
      pieces.push({
        id: 'black-knight',
        type: PieceType.KNIGHT,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 5 }, // e6
        hasMoved: true
      });
      
      // Add black queen at g8
      pieces.push({
        id: 'black-queen',
        type: PieceType.QUEEN,
        color: PlayerColor.BLACK,
        position: { x: 6, y: 7 }, // g8
        hasMoved: true
      });
      
      gameState.setBoardState(pieces);
      
      const bpRegenerationService = new BPRegenerationService(gameState);
      
      // Move bishop to a2, which pins the knight to the queen
      const regeneration = bpRegenerationService.calculateRegeneration(
        { x: 2, y: 3 }, // c4
        { x: 0, y: 1 }, // a2
        MoveType.NORMAL,
        {
          id: 'white-bishop',
          type: PieceType.BISHOP,
          color: PlayerColor.WHITE,
          position: { x: 0, y: 1 }, // a2
          hasMoved: true
        }
      );
      
      // Should provide extra BP for pin (base + pin bonus)
      const baseRegen = 1;
      expect(regeneration).toBeGreaterThan(baseRegen);
    });
    
    it('should provide additional BP for discovered attack', () => {
      // Setup a scenario where moving creates a discovered attack
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // Add white queen at d1
      pieces.push({
        id: 'white-queen',
        type: PieceType.QUEEN,
        color: PlayerColor.WHITE,
        position: { x: 3, y: 0 }, // d1
        hasMoved: true
      });
      
      // Add white pawn at e2 blocking the queen
      pieces.push({
        id: 'white-pawn',
        type: PieceType.PAWN,
        color: PlayerColor.WHITE,
        position: { x: 4, y: 1 }, // e2
        hasMoved: false
      });
      
      // Add black rook at e8
      pieces.push({
        id: 'black-rook',
        type: PieceType.ROOK,
        color: PlayerColor.BLACK,
        position: { x: 4, y: 7 }, // e8
        hasMoved: true
      });
      
      gameState.setBoardState(pieces);
      
      const bpRegenerationService = new BPRegenerationService(gameState);
      
      // Move pawn to e4, revealing queen's attack on e8
      const regeneration = bpRegenerationService.calculateRegeneration(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        MoveType.NORMAL,
        {
          id: 'white-pawn',
          type: PieceType.PAWN,
          color: PlayerColor.WHITE,
          position: { x: 4, y: 3 }, // e4
          hasMoved: true
        }
      );
      
      // Should provide extra BP for discovered attack (base + discovered attack bonus)
      const baseRegen = 1;
      expect(regeneration).toBeGreaterThan(baseRegen);
    });
  });
  
  // Cumulative regeneration
  describe('cumulative regeneration', () => {
    it('should accumulate BP regeneration from multiple tactics', () => {
      // Setup a complex scenario with multiple tactical opportunities
      const gameState = ScenarioFactory.createEmptyBoardWithKings();
      const pieces = gameState.getState().pieces;
      
      // [Create a more complex board setup where a move could create multiple tactics]
      // This is a simplified test since detecting multiple tactics simultaneously
      // is complex and depends on the internal implementation
      
      gameState.setBoardState(pieces);
      
      const bpRegenerationService = new BPRegenerationService(gameState);
      
      // For now, just test that regeneration values can be higher than a single tactic
      // This would need to be expanded based on the actual implementation
      
      // Use the direct methods to simulate multiple tactics
      // This is just to verify that accumulation works as expected
      const baseRegen = 1;
      const forkBonus = 1;
      const pinBonus = 1;
      
      // We expect at least baseRegen + forkBonus + pinBonus
      const expectedMinimum = baseRegen + forkBonus + pinBonus;
      
      // Mock the detection methods to return true for multiple tactics
      jest.spyOn(bpRegenerationService as any, 'detectFork').mockReturnValue(true);
      jest.spyOn(bpRegenerationService as any, 'detectPin').mockReturnValue(true);
      
      const regeneration = bpRegenerationService.calculateRegeneration(
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        MoveType.NORMAL,
        {
          id: 'test-piece',
          type: PieceType.BISHOP,
          color: PlayerColor.WHITE,
          position: { x: 1, y: 1 },
          hasMoved: true
        }
      );
      
      expect(regeneration).toBeGreaterThanOrEqual(expectedMinimum);
    });
  });
  
  // Pending regeneration
  describe('pending regeneration', () => {
    it('should apply pending regeneration on turn switch', () => {
      const gameState = new GameState();
      const moveExecutor = new MoveExecutor(gameState);
      
      // Initial BP values
      const initialWhiteBP = gameState.getPlayerBP(PlayerColor.WHITE);
      
      // Add pending regeneration
      gameState.addPendingBPRegeneration(PlayerColor.WHITE, 3);
      
      // Make a move to trigger turn switch
      moveExecutor.executeMove(
        { x: 4, y: 1 }, // e2
        { x: 4, y: 3 }, // e4
        PlayerColor.WHITE
      );
      
      // Check that white's BP increased by the pending amount
      const expectedBP = initialWhiteBP + 3;
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(expectedBP);
    });
  });
}); 