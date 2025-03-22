import { GameState } from '../../src/engine/GameState';
import { ScenarioFactory } from '../../src/utils/ScenarioFactory';
import {
  PlayerColor,
  GamePhase,
  GameState as SharedGameState,
  PieceType,
  Position
} from '@gambit-chess/shared';

describe('GameState', () => {
  // Basic initialization and getters
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const gameState = new GameState();
      const state = gameState.getState();

      // Check initial game properties
      expect(state.gameId).toBeDefined();
      expect(state.currentTurn).toBe(PlayerColor.WHITE);
      expect(state.gamePhase).toBe(GamePhase.NORMAL_MOVE);
      expect(state.gameState).toBe(SharedGameState.ACTIVE);
      expect(state.whitePlayerBP).toBe(39); // Default BP
      expect(state.blackPlayerBP).toBe(39); // Default BP
    });

    it('should initialize with custom game ID and BP pool', () => {
      const customId = 'test-game-id';
      const customBP = 50;
      const gameState = new GameState(customId, customBP);
      const state = gameState.getState();

      expect(state.gameId).toBe(customId);
      expect(state.whitePlayerBP).toBe(customBP);
      expect(state.blackPlayerBP).toBe(customBP);
    });

    it('should setup initial board with all pieces', () => {
      const gameState = new GameState();
      const state = gameState.getState();

      // Should have all 32 pieces
      expect(state.pieces.length).toBe(32);
      
      // Check for specific pieces
      const whitePawns = state.pieces.filter(p => p.type === PieceType.PAWN && p.color === PlayerColor.WHITE);
      const blackPawns = state.pieces.filter(p => p.type === PieceType.PAWN && p.color === PlayerColor.BLACK);
      const whiteKing = state.pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.WHITE);
      const blackKing = state.pieces.find(p => p.type === PieceType.KING && p.color === PlayerColor.BLACK);
      
      expect(whitePawns.length).toBe(8);
      expect(blackPawns.length).toBe(8);
      expect(whiteKing).toBeDefined();
      expect(blackKing).toBeDefined();
    });
  });

  // Player turn management
  describe('turn management', () => {
    it('should switch turns correctly', () => {
      const gameState = new GameState();
      expect(gameState.getState().currentTurn).toBe(PlayerColor.WHITE);
      
      gameState.switchTurn();
      expect(gameState.getState().currentTurn).toBe(PlayerColor.BLACK);
      
      gameState.switchTurn();
      expect(gameState.getState().currentTurn).toBe(PlayerColor.WHITE);
    });

    it('should verify player turn correctly', () => {
      const gameState = new GameState();
      
      // Initially white's turn
      expect(gameState.isPlayerTurn(PlayerColor.WHITE)).toBe(true);
      expect(gameState.isPlayerTurn(PlayerColor.BLACK)).toBe(false);
      
      gameState.switchTurn();
      
      // Now black's turn
      expect(gameState.isPlayerTurn(PlayerColor.WHITE)).toBe(false);
      expect(gameState.isPlayerTurn(PlayerColor.BLACK)).toBe(true);
    });
  });

  // Battle Points management
  describe('Battle Points management', () => {
    it('should get player BP correctly', () => {
      const gameState = new GameState();
      
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(39);
      expect(gameState.getPlayerBP(PlayerColor.BLACK)).toBe(39);
    });

    it('should add and subtract BP correctly', () => {
      const gameState = new GameState();
      
      // Add BP to white
      gameState.addPlayerBP(PlayerColor.WHITE, 5);
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(44);
      
      // Subtract BP from black
      gameState.addPlayerBP(PlayerColor.BLACK, -10);
      expect(gameState.getPlayerBP(PlayerColor.BLACK)).toBe(29);
    });

    it('should not allow negative BP', () => {
      const gameState = new GameState();
      
      // Try to subtract more BP than available
      gameState.addPlayerBP(PlayerColor.WHITE, -50);
      expect(gameState.getPlayerBP(PlayerColor.WHITE)).toBe(0);
    });

    it('should track pending BP regeneration', () => {
      const gameState = new GameState();
      
      gameState.addPendingBPRegeneration(PlayerColor.WHITE, 3);
      gameState.addPendingBPRegeneration(PlayerColor.BLACK, 2);
      
      const state = gameState.getState();
      expect(state.pendingBPRegeneration.white).toBe(3);
      expect(state.pendingBPRegeneration.black).toBe(2);
    });
  });

  // Game phase and state management
  describe('game phase and state management', () => {
    it('should set game phase correctly', () => {
      const gameState = new GameState();
      
      gameState.setGamePhase(GamePhase.DUEL_ALLOCATION);
      expect(gameState.getState().gamePhase).toBe(GamePhase.DUEL_ALLOCATION);
      
      gameState.setGamePhase(GamePhase.TACTICAL_RETREAT);
      expect(gameState.getState().gamePhase).toBe(GamePhase.TACTICAL_RETREAT);
      
      gameState.setGamePhase(GamePhase.NORMAL_MOVE);
      expect(gameState.getState().gamePhase).toBe(GamePhase.NORMAL_MOVE);
    });

    it('should set game state correctly', () => {
      const gameState = new GameState();
      
      gameState.setGameState(SharedGameState.CHECKMATE);
      expect(gameState.getState().gameState).toBe(SharedGameState.CHECKMATE);
      expect(gameState.isGameOver()).toBe(true);
      
      gameState.setGameState(SharedGameState.STALEMATE);
      expect(gameState.getState().gameState).toBe(SharedGameState.STALEMATE);
      expect(gameState.isGameOver()).toBe(true);
      
      gameState.setGameState(SharedGameState.DRAW);
      expect(gameState.getState().gameState).toBe(SharedGameState.DRAW);
      expect(gameState.isGameOver()).toBe(true);
      
      gameState.setGameState(SharedGameState.ACTIVE);
      expect(gameState.getState().gameState).toBe(SharedGameState.ACTIVE);
      expect(gameState.isGameOver()).toBe(false);
    });
  });

  // Piece management
  describe('piece management', () => {
    it('should find a piece at a position', () => {
      const gameState = new GameState();
      
      // White king at e1
      const whiteKingPos: Position = { x: 4, y: 0 };
      const whiteKing = gameState.findPieceAt(whiteKingPos);
      
      expect(whiteKing).toBeDefined();
      expect(whiteKing?.type).toBe(PieceType.KING);
      expect(whiteKing?.color).toBe(PlayerColor.WHITE);
      
      // No piece at e4
      const emptyPos: Position = { x: 4, y: 3 };
      const noPiece = gameState.findPieceAt(emptyPos);
      
      expect(noPiece).toBeUndefined();
    });

    it('should check if a player is in check', () => {
      // Use a checkmate scenario from ScenarioFactory
      const checkmateGame = ScenarioFactory.createCheckmateScenario();
      
      expect(checkmateGame.isInCheck(PlayerColor.WHITE)).toBe(true);
      expect(checkmateGame.isInCheck(PlayerColor.BLACK)).toBe(false);
    });
  });

  // Session management
  describe('session management', () => {
    it('should assign player sessions correctly', () => {
      const gameState = new GameState();
      const whiteSessionId = 'white-session-id';
      const blackSessionId = 'black-session-id';
      
      gameState.assignPlayerSession(PlayerColor.WHITE, whiteSessionId);
      gameState.assignPlayerSession(PlayerColor.BLACK, blackSessionId);
      
      const state = gameState.getState();
      expect(state.whitePlayerSessionId).toBe(whiteSessionId);
      expect(state.blackPlayerSessionId).toBe(blackSessionId);
    });
  });
}); 