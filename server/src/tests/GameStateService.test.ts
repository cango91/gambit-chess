import { BPManager } from '../services/BPManager';
import { GameStateService } from '../services/GameStateService';
import { TacticalRetreatService } from '../services/TacticalRetreatService';
import { TacticalDetectorService } from '../services/TacticalDetectorService';
import { Board } from '../models/Board';
import { GamePhase, PieceColor, GameResult } from '@gambit-chess/shared';

describe('GameStateService', () => {
  let gameStateService: GameStateService;
  let bpManager: BPManager;
  let tacticalRetreatService: TacticalRetreatService;
  let tacticalDetectorService: TacticalDetectorService;
  
  beforeEach(() => {
    tacticalDetectorService = new TacticalDetectorService();
    bpManager = new BPManager(10, tacticalDetectorService);
    tacticalRetreatService = new TacticalRetreatService();
    gameStateService = new GameStateService(
      'test-game-id',
      bpManager,
      tacticalRetreatService,
      300000, // 5 minutes for white
      300000  // 5 minutes for black
    );
  });
  
  describe('Game State Management', () => {
    it('should initialize with correct default values', () => {
      const state = gameStateService.getGameState();
      
      expect(state.gameId).toBe('test-game-id');
      expect(state.currentPhase).toBe(GamePhase.NORMAL);
      expect(state.playerToMove).toBe('white');
      expect(state.gameResult).toBeNull();
      expect(state.moveHistory).toEqual([]);
    });
    
    it('should create a game state DTO with correct values', () => {
      const stateDTO = gameStateService.createGameStateDTO('white');
      
      expect(stateDTO.gameId).toBe('test-game-id');
      expect(stateDTO.phase).toBe(GamePhase.NORMAL);
      expect(stateDTO.turn).toBe('white');
      expect(stateDTO.bp).toBeDefined();
      expect(stateDTO.pieces).toBeDefined();
      expect(stateDTO.whiteTimeRemaining).toBe(300000);
      expect(stateDTO.blackTimeRemaining).toBe(300000);
      expect(stateDTO.activeTimer).toBe('white');
    });
    
    it('should update game phase', () => {
      gameStateService.updateGamePhase(GamePhase.DUEL_ALLOCATION);
      
      const state = gameStateService.getGameState();
      expect(state.currentPhase).toBe(GamePhase.DUEL_ALLOCATION);
    });
  });
  
  describe('Basic Move Processing', () => {
    it('should process a valid pawn move', () => {
      // e2 to e4 - standard pawn opening
      const result = gameStateService.processMove('e2', 'e4', 'white');
      
      expect(result.success).toBe(true);
      
      // Check that turn switched
      const state = gameStateService.getGameState();
      expect(state.playerToMove).toBe('black');
      
      // Check that move was recorded in history
      expect(state.moveHistory.length).toBe(1);
      expect(state.moveHistory[0].from).toBe('e2');
      expect(state.moveHistory[0].to).toBe('e4');
    });
    
    it('should reject move on wrong turn', () => {
      const result = gameStateService.processMove('e7', 'e5', 'black');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not your turn');
    });
    
    it('should reject invalid move', () => {
      // Knight on b1 can't move to b3
      const result = gameStateService.processMove('b1', 'b3', 'white');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid move');
    });
  });
  
  describe('Time Management', () => {
    it('should update time correctly', () => {
      // Update white's time by 10 seconds
      gameStateService.updateTime('white', 10000);
      
      const stateDTO = gameStateService.createGameStateDTO();
      expect(stateDTO.whiteTimeRemaining).toBe(290000);
      expect(stateDTO.blackTimeRemaining).toBe(300000);
    });
    
    it('should not update time for inactive player', () => {
      // Try to update black's time while it's white's turn
      const result = gameStateService.updateTime('black', 10000);
      
      expect(result).toBe(false);
      
      const stateDTO = gameStateService.createGameStateDTO();
      expect(stateDTO.blackTimeRemaining).toBe(300000);
    });
  });
  
  describe('Duel Processing', () => {
    beforeEach(() => {
      // Set up a more realistic scenario with a white pawn ready to capture
      const board = gameStateService.getBoard();
      board.addPiece('p', 'white', 'e4');
      board.addPiece('p', 'black', 'd5');
      
      // Ensure we're in normal phase and it's white's turn
      gameStateService.updateGamePhase(GamePhase.NORMAL);
    });
    
    it('should transition to duel allocation phase on capture attempt', () => {
      // White attempts to capture black's pawn
      const result = gameStateService.processMove('e4', 'd5', 'white');
      
      expect(result.success).toBe(true);
      expect(result.isCapture).toBe(true);
      
      const state = gameStateService.getGameState();
      expect(state.currentPhase).toBe(GamePhase.DUEL_ALLOCATION);
    });
    
    it('should process duel allocation', () => {
      // Setup capture attempt
      gameStateService.processMove('e4', 'd5', 'white');
      
      // Check we're in the right phase
      expect(gameStateService.getGameState().currentPhase).toBe(GamePhase.DUEL_ALLOCATION);
      
      // Allocate BP for white (attacker)
      const whiteAllocation = gameStateService.processDuelAllocation('white', 3);
      expect(whiteAllocation).toBe(true);
      
      // Check BP was deducted
      expect(bpManager.getBpPool('white')).toBe(7); // 10 - 3 = 7
    });
    
    it('should fail duel allocation if not enough BP', () => {
      // Setup capture attempt
      gameStateService.processMove('e4', 'd5', 'white');
      
      // Set BP pool to a low value
      bpManager.setBpPool('white', 2);
      
      // Try to allocate more BP than available
      const whiteAllocation = gameStateService.processDuelAllocation('white', 3);
      expect(whiteAllocation).toBe(false);
      
      // Check BP was not deducted
      expect(bpManager.getBpPool('white')).toBe(2);
    });
    
    it('should fail duel allocation if not in duel phase', () => {
      // We're still in normal phase
      const whiteAllocation = gameStateService.processDuelAllocation('white', 3);
      expect(whiteAllocation).toBe(false);
    });
  });
  
  describe('Retreat Options', () => {
    it('should return null for retreat options when not in retreat phase', () => {
      const retreatOptions = gameStateService.createRetreatOptionsDTO();
      expect(retreatOptions).toBeNull();
    });
  });
  
  describe('Board and BP Manager access', () => {
    it('should provide access to the board', () => {
      const board = gameStateService.getBoard();
      expect(board).toBeDefined();
      expect(board instanceof Board).toBe(true);
    });
    
    it('should provide access to the BP manager', () => {
      const bpManager = gameStateService.getBPManager();
      expect(bpManager).toBeDefined();
      expect(bpManager instanceof BPManager).toBe(true);
    });
    
    it('should provide access to game result', () => {
      const gameResult = gameStateService.getGameResult();
      expect(gameResult).toBeNull();
    });
    
    it('should provide access to move history', () => {
      const moveHistory = gameStateService.getMoveHistory();
      expect(Array.isArray(moveHistory)).toBe(true);
      expect(moveHistory.length).toBe(0);
    });
  });
  
  describe('Duel Resolution', () => {
    it('should fail to resolve duel when not in duel allocation phase', () => {
      // Try to resolve when no duel is active
      const outcome = gameStateService.resolveDuel();
      
      expect(outcome.success).toBe(false);
    });
  });
  
  describe('Game Over Detection', () => {
    it('should provide accurate game result', () => {
      // Initially the game result should be null
      expect(gameStateService.getGameResult()).toBeNull();
      
      // Set up a sample game state with timeouts
      const whiteTimeoutGame = new GameStateService(
        'timeout-test',
        bpManager,
        tacticalRetreatService,
        5000, // 5 seconds for white
        5000  // 5 seconds for black
      );
      
      // Simulate white running out of time
      whiteTimeoutGame.updateTime('white', 5000);
      
      // Game should be over with black winning
      expect(whiteTimeoutGame.getGameResult()).toBe(GameResult.BLACK_WIN);
      expect(whiteTimeoutGame.getGameState().currentPhase).toBe(GamePhase.GAME_OVER);
    });
  });
}); 