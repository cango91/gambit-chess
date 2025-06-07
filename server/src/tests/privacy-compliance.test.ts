import { getGameStateForPlayer, getFilteringSummary } from '../utils/game-state-filter';
import { DEFAULT_GAME_CONFIG, ADVANCED_GAME_CONFIG } from '@gambit-chess/shared';
import { Chess } from 'chess.js';
import { BaseGameState, GameStatus, Player } from '@gambit-chess/shared';

describe('🔐 Privacy Compliance Tests', () => {
  let mockGameState: BaseGameState;
  let whitePlayer: Player;
  let blackPlayer: Player;

  beforeEach(() => {
    whitePlayer = { id: 'white-player-123', color: 'w', battlePoints: 15 };
    blackPlayer = { id: 'black-player-456', color: 'b', battlePoints: 12 };

    mockGameState = {
      id: 'test-game-123',
      chess: new Chess(),
      whitePlayer,
      blackPlayer,
      currentTurn: 'w',
      moveHistory: [],
      pendingDuel: null,
      gameStatus: GameStatus.IN_PROGRESS,
      config: DEFAULT_GAME_CONFIG,
      halfmoveClockManual: 0,
      positionHistory: [],
      bpCalculationReport: {
        playerBP: { white: 15, black: 12 },
        transactions: [],
        calculations: ['Test calculation'],
        hiddenInfo: false
      }
    };
  });

  describe('✅ Information Hiding Configuration Compliance', () => {
    it('should hide opponent battle points when hideBattlePoints=true', () => {
      // Use advanced config which hides battle points
      mockGameState.config = ADVANCED_GAME_CONFIG;
      
      const whitePlayerView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackPlayerView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // White player sees own BP but not opponent's
      expect(whitePlayerView.whitePlayer.battlePoints).toBe(15);
      expect(whitePlayerView.blackPlayer.battlePoints).toBe(-1); // Hidden
      
      // Black player sees own BP but not opponent's  
      expect(blackPlayerView.blackPlayer.battlePoints).toBe(12);
      expect(blackPlayerView.whitePlayer.battlePoints).toBe(-1); // Hidden
    });

    it('should show both battle points when hideBattlePoints=false', () => {
      // Use default config which shows battle points
      mockGameState.config = DEFAULT_GAME_CONFIG;
      
      const whitePlayerView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackPlayerView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // Both players see their own BP
      expect(whitePlayerView.whitePlayer.battlePoints).toBe(15);
      expect(blackPlayerView.blackPlayer.battlePoints).toBe(12);
      
      // Both players see opponent's BP when not hidden
      expect(whitePlayerView.blackPlayer.battlePoints).toBe(12);
      expect(blackPlayerView.whitePlayer.battlePoints).toBe(15);
    });
  });

  describe('🔒 BP Calculation Report Privacy', () => {
    it('should only show BP calculation report to current turn player', () => {
      mockGameState.currentTurn = 'w'; // White's turn
      
      const whitePlayerView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackPlayerView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // White player (current turn) sees the report
      expect(whitePlayerView.bpCalculationReport).toBeDefined();
      expect(whitePlayerView.bpCalculationReport?.calculations).toContain('Test calculation');
      
      // Black player (not current turn) doesn't see the report
      expect(blackPlayerView.bpCalculationReport).toBeUndefined();
    });

    it('should switch report visibility when turn changes', () => {
      mockGameState.currentTurn = 'b'; // Black's turn
      
      const whitePlayerView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackPlayerView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // Black player (current turn) sees the report
      expect(blackPlayerView.bpCalculationReport).toBeDefined();
      
      // White player (not current turn) doesn't see the report
      expect(whitePlayerView.bpCalculationReport).toBeUndefined();
    });
  });

  describe('🥊 Duel Allocation Privacy', () => {
         beforeEach(() => {
       // Create a basic chess move for testing
       const chess = new Chess();
       const move = chess.move('e4'); // This creates a proper Move object
       
       mockGameState.pendingDuel = {
         move: move!,
         attackerColor: 'w',
         defenderColor: 'b',
         attackingPiece: { type: 'p', square: 'e2' as any },
         defendingPiece: { type: 'p', square: 'e7' as any },
         attackerAllocation: 5,
         defenderAllocation: 3
       };
     });

    it('should hide opponent duel allocations', () => {
      const whitePlayerView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackPlayerView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // White player (attacker) sees own allocation but not opponent's
      expect(whitePlayerView.pendingDuel?.attackerAllocation).toBe(5);
      expect(whitePlayerView.pendingDuel?.defenderAllocation).toBeUndefined();
      
      // Black player (defender) sees own allocation but not opponent's
      expect(blackPlayerView.pendingDuel?.defenderAllocation).toBe(3);
      expect(blackPlayerView.pendingDuel?.attackerAllocation).toBeUndefined();
    });
  });

  describe('👀 Spectator Privacy', () => {
    it('should hide all sensitive information from spectators', () => {
      const spectatorView = getGameStateForPlayer(mockGameState, 'spectator-789');
      
      // All battle points hidden
      expect(spectatorView.whitePlayer.battlePoints).toBe(-1);
      expect(spectatorView.blackPlayer.battlePoints).toBe(-1);
      
      // No BP calculation reports
      expect(spectatorView.bpCalculationReport).toBeUndefined();
      
      // No duel allocations if there's a pending duel
      if (spectatorView.pendingDuel) {
        expect(spectatorView.pendingDuel.attackerAllocation).toBeUndefined();
        expect(spectatorView.pendingDuel.defenderAllocation).toBeUndefined();
      }
    });
  });

  describe('📊 Filtering Summary', () => {
    it('should generate accurate filtering summary', () => {
      mockGameState.config = ADVANCED_GAME_CONFIG; // Hides battle points
      
      const filteredState = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const summary = getFilteringSummary(mockGameState, filteredState, whitePlayer.id);
      
      // Should report hidden black player battle points
      expect(summary).toContain('Hidden black player battle points (12 -> -1)');
      
      // Should not report white player's own battle points as hidden
      expect(summary.some(s => s.includes('Hidden white player battle points'))).toBe(false);
    });

    it('should detect multiple filtering actions', () => {
      mockGameState.config = ADVANCED_GAME_CONFIG;
      mockGameState.currentTurn = 'b'; // White player won't see BP report
      
      const filteredState = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const summary = getFilteringSummary(mockGameState, filteredState, whitePlayer.id);
      
      expect(summary).toContain('Hidden black player battle points (12 -> -1)');
      expect(summary).toContain('Hidden BP calculation report');
    });
  });

  describe('🔧 Configuration Validation', () => {
    it('should respect information hiding settings from different configs', () => {
      // Test DEFAULT_GAME_CONFIG (shows information)
      mockGameState.config = DEFAULT_GAME_CONFIG;
      let filteredState = getGameStateForPlayer(mockGameState, whitePlayer.id);
      expect(filteredState.blackPlayer.battlePoints).toBe(12); // Visible
      
      // Test ADVANCED_GAME_CONFIG (hides battle points)
      mockGameState.config = ADVANCED_GAME_CONFIG;
      filteredState = getGameStateForPlayer(mockGameState, whitePlayer.id);
      expect(filteredState.blackPlayer.battlePoints).toBe(-1); // Hidden
    });
  });

  describe('🚨 Critical Privacy Validations', () => {
    it('should never expose opponent BP when configuration requires hiding', () => {
      mockGameState.config = { 
        ...DEFAULT_GAME_CONFIG, 
        informationHiding: { hideBattlePoints: true, hideAllocationHistory: false }
      };
      
      const whiteView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // Neither player should see opponent's BP
      expect(whiteView.blackPlayer.battlePoints).toBe(-1);
      expect(blackView.whitePlayer.battlePoints).toBe(-1);
      
      // But both should see their own
      expect(whiteView.whitePlayer.battlePoints).toBe(15);
      expect(blackView.blackPlayer.battlePoints).toBe(12);
    });

    it('should prevent cross-contamination of player views', () => {
      mockGameState.currentTurn = 'w';
      
      const whiteView = getGameStateForPlayer(mockGameState, whitePlayer.id);
      const blackView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      
      // Ensure views are independent - modifying one doesn't affect the other
      whiteView.whitePlayer.battlePoints = 999;
      
      const freshBlackView = getGameStateForPlayer(mockGameState, blackPlayer.id);
      expect(freshBlackView.whitePlayer.battlePoints).not.toBe(999);
    });
  });
}); 