import { GameStatus, GameEventType, Player } from './game';
import { Chess } from 'chess.js';
import { createNewGame } from '..';

describe('Game Types', () => {
  describe('Player', () => {
    it('should correctly create a player object', () => {
      const player: Player = {
        id: 'test-player-123',
        color: 'w',
        battlePoints: 39
      };

      expect(player.id).toBe('test-player-123');
      expect(player.color).toBe('w');
      expect(player.battlePoints).toBe(39);
    });
  });

  describe('GameStatus', () => {
    it('should contain all required game statuses', () => {
      expect(GameStatus.WAITING_FOR_PLAYERS).toBeDefined();
      expect(GameStatus.IN_PROGRESS).toBeDefined();
      expect(GameStatus.DUEL_IN_PROGRESS).toBeDefined();
      expect(GameStatus.TACTICAL_RETREAT_DECISION).toBeDefined();
      expect(GameStatus.CHECKMATE).toBeDefined();
      expect(GameStatus.STALEMATE).toBeDefined();
      expect(GameStatus.DRAW).toBeDefined();
      expect(GameStatus.ABANDONED).toBeDefined();
    });
  });

  describe('GameEventType', () => {
    it('should contain all required game event types', () => {
      expect(GameEventType.GAME_CREATED).toBeDefined();
      expect(GameEventType.PLAYER_JOINED).toBeDefined();
      expect(GameEventType.MOVE_MADE).toBeDefined();
      expect(GameEventType.DUEL_INITIATED).toBeDefined();
      expect(GameEventType.DUEL_ALLOCATION_SUBMITTED).toBeDefined();
      expect(GameEventType.DUEL_RESOLVED).toBeDefined();
      expect(GameEventType.TACTICAL_RETREAT_MADE).toBeDefined();
      expect(GameEventType.BATTLE_POINTS_UPDATED).toBeDefined();
      expect(GameEventType.GAME_ENDED).toBeDefined();
    });
  });

  describe('createNewGame', () => {
    it('should create a new game with one player', () => {
      const gameId = 'test-game-123';
      const whitePlayerId = 'white-player-123';
      
      const game = createNewGame(gameId, whitePlayerId);
      
      expect(game.id).toBe(gameId);
      expect(game.whitePlayer.id).toBe(whitePlayerId);
      expect(game.blackPlayer.id).toBe('');
      expect(game.gameStatus).toBe(GameStatus.WAITING_FOR_PLAYERS);
      expect(game.currentTurn).toBe('w');
      expect(game.chess).toBeInstanceOf(Chess);
      expect(game.moveHistory).toEqual([]);
      expect(game.pendingDuel).toBeNull();
    });
    
    it('should create a new game with two players', () => {
      const gameId = 'test-game-123';
      const whitePlayerId = 'white-player-123';
      const blackPlayerId = 'black-player-123';
      
      const game = createNewGame(gameId, whitePlayerId, blackPlayerId);
      
      expect(game.id).toBe(gameId);
      expect(game.whitePlayer.id).toBe(whitePlayerId);
      expect(game.blackPlayer.id).toBe(blackPlayerId);
      expect(game.gameStatus).toBe(GameStatus.IN_PROGRESS);
      expect(game.currentTurn).toBe('w');
      expect(game.chess).toBeInstanceOf(Chess);
      expect(game.moveHistory).toEqual([]);
      expect(game.pendingDuel).toBeNull();
    });
  });
}); 