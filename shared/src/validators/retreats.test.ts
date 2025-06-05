import { BaseGameState, GameStatus } from '../types/game';
import { Chess } from 'chess.js';
import { validateTacticalRetreat } from './retreats';
import { DEFAULT_GAME_CONFIG } from '../constants';

describe('Tactical Retreat Validators', () => {
  let mockGameState: BaseGameState;
  const whitePlayerId = 'white-player-123';
  const blackPlayerId = 'black-player-123';
  
  beforeEach(() => {
    // Create a fresh mock game state for each test with a starting position
    const chess = new Chess();
    
    mockGameState = {
      id: 'test-game-123',
      chess,
      whitePlayer: {
        id: whitePlayerId,
        color: 'w',
        battlePoints: 30
      },
      blackPlayer: {
        id: blackPlayerId,
        color: 'b',
        battlePoints: 30
      },
      currentTurn: 'w',
      moveHistory: [],
      pendingDuel: null,
      gameStatus: GameStatus.IN_PROGRESS,
      config: DEFAULT_GAME_CONFIG,
      halfmoveClockManual: 0,
      positionHistory: []
    };
  });
  
  describe('validateTacticalRetreat', () => {
    it('should return invalid if game is not in tactical retreat state', () => {
      const result = validateTacticalRetreat(
        mockGameState,
        whitePlayerId,
        { type: 'TACTICAL_RETREAT', to: 'e2' }
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Game is not in tactical retreat state');
    });
    
    it('should return invalid if player is not the current player', () => {
      mockGameState.gameStatus = GameStatus.TACTICAL_RETREAT_DECISION;
      mockGameState.currentTurn = 'b';
      
      // Add failed capture in history to pass that check
      mockGameState.moveHistory.push({
        from: 'f8',
        to: 'b4',
        captureAttempt: true,
        duelResult: {
          attackerAllocation: 5,
          defenderAllocation: 7,
          attackerWon: false,
          attackerBattlePointsRemaining: 25,
          defenderBattlePointsRemaining: 23
        },
        piece: 'b',
        color: 'b'
      } as any);
      
      const result = validateTacticalRetreat(
        mockGameState,
        whitePlayerId,
        { type: 'TACTICAL_RETREAT', to: 'e2' }
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Only the attacking player can execute a tactical retreat');
    });
    
    it('should return invalid if the target square is invalid', () => {
      // Setup a specific position for testing
      const gambitChess = new Chess();
      
      // Set up a bishop at c3 that tried to capture at f6 but failed
      gambitChess.load('rnbqkbnr/pppppppp/8/8/8/2B5/PPPPPPPP/RNBQK1NR w KQkq - 0 1');
      
      mockGameState.chess = gambitChess as any;
      mockGameState.gameStatus = GameStatus.TACTICAL_RETREAT_DECISION;
      mockGameState.currentTurn = 'w';
      
      // Last move was a failed attempt to capture at f6
      mockGameState.moveHistory.push({
        from: 'c3',
        to: 'f6',
        captureAttempt: true,
        duelResult: {
          attackerAllocation: 5,
          defenderAllocation: 7,
          attackerWon: false,
          attackerBattlePointsRemaining: 25,
          defenderBattlePointsRemaining: 23
        },
        piece: 'b',
        color: 'w'
      } as any);
      
      // Try to retreat to an invalid square (not on the attack axis)
      const result = validateTacticalRetreat(
        mockGameState,
        whitePlayerId,
        { type: 'TACTICAL_RETREAT', to: 'e4' }
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid retreat square');
    });

    it('should return invalid if player has insufficient battle points for retreat', () => {
      // Setup a specific position for testing
      const gambitChess = new Chess();
      
      // Set up a bishop at c3 that tried to capture at f6 but failed
      gambitChess.load('rnbqkbnr/pppppppp/8/8/8/2B5/PPPPPPPP/RNBQK1NR w KQkq - 0 1');
      
      mockGameState.chess = gambitChess as any;
      mockGameState.gameStatus = GameStatus.TACTICAL_RETREAT_DECISION;
      mockGameState.currentTurn = 'w';
      mockGameState.whitePlayer.battlePoints = 1; // Only enough for 1 square
      
      // Last move was a failed attempt to capture at f6
      mockGameState.moveHistory.push({
        from: 'c3',
        to: 'f6',
        captureAttempt: true,
        duelResult: {
          attackerAllocation: 5,
          defenderAllocation: 7,
          attackerWon: false,
          attackerBattlePointsRemaining: 1,
          defenderBattlePointsRemaining: 23
        },
        piece: 'b',
        color: 'w'
      } as any);
      
      // Try to retreat to e5 (which costs 2 BP)
      const result = validateTacticalRetreat(
        mockGameState,
        whitePlayerId,
        { type: 'TACTICAL_RETREAT', to: 'e5' }
      );
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Not enough battle points');
    });
    
    it('should return valid for legitimate retreat', () => {
      // Setup a specific position for testing
      const gambitChess = new Chess();
      
      // Set up a bishop at c3 that tried to capture at f6 but failed
      gambitChess.load('rnbqkbnr/pppppppp/8/8/8/2B5/PPPPPPPP/RNBQK1NR w KQkq - 0 1');
      
      mockGameState.chess = gambitChess as any;
      mockGameState.gameStatus = GameStatus.TACTICAL_RETREAT_DECISION;
      mockGameState.currentTurn = 'w';
      
      // Last move was a failed attempt to capture at f6
      mockGameState.moveHistory.push({
        from: 'c3',
        to: 'f6',
        captureAttempt: true,
        duelResult: {
          attackerAllocation: 5,
          defenderAllocation: 7,
          attackerWon: false,
          attackerBattlePointsRemaining: 25,
          defenderBattlePointsRemaining: 23
        },
        piece: 'b',
        color: 'w'
      } as any);
      
      // Return to original square (costs 0 BP)
      const result = validateTacticalRetreat(
        mockGameState,
        whitePlayerId,
        { type: 'TACTICAL_RETREAT', to: 'c3' }
      );
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
}); 