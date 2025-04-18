import { GameConfig, GambitMove, SpecialAttackType, TacticsDTO } from '@gambit-chess/shared';
import { PieceSymbol, Square } from 'chess.js';
import { DEFAULT_GAME_CONFIG } from '@gambit-chess/shared';
import { calculateBPRegen } from './bp-calculator';
import { detectTactics } from '../tactics';

// Use Jest's mocking system
jest.mock('../tactics');
// Get a typed reference to the mocked function
const mockedDetectTactics = detectTactics as jest.MockedFunction<typeof detectTactics>; 

// FEN for standard starting position
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// FEN after 1. e4
const AFTER_E4_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';

// Helper to create a minimal mock move
const createMockMove = (overrides: Partial<GambitMove> = {}): GambitMove => ({
  // Default move: e2e4
  from: overrides.from ?? 'e2',
  to: overrides.to ?? 'e4',
  piece: overrides.piece ?? 'p',
  color: overrides.color ?? 'w',
  flags: overrides.flags ?? '',
  san: overrides.san ?? 'e4',
  lan: overrides.lan ?? 'e2e4',
  before: overrides.before ?? STARTING_FEN, // Default valid FEN
  after: overrides.after ?? AFTER_E4_FEN,   // Default valid FEN
  // Methods returning boolean
  isCapture: () => overrides.isCapture?.() ?? false,
  isPromotion: () => overrides.isPromotion?.() ?? false,
  isEnPassant: () => overrides.isEnPassant?.() ?? false,
  isKingsideCastle: () => overrides.isKingsideCastle?.() ?? false,
  isQueensideCastle: () => overrides.isQueensideCastle?.() ?? false,
  isBigPawn: () => overrides.isBigPawn?.() ?? false,
  // Cast needed because TS struggles with method overrides via spread
  ...(overrides as Partial<GambitMove>),
});

describe('calculateBPRegen', () => {
  let config: GameConfig;
  let move: GambitMove;

  beforeEach(() => {
    // Reset mocks before each test
    mockedDetectTactics.mockClear();
    // Reset config and move
    config = JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG));
    move = createMockMove();
    // Default mock implementation (can be overridden in specific tests)
    mockedDetectTactics.mockReturnValue([]);
  });

  it('should return base regeneration when no tactics are detected', () => {
    mockedDetectTactics.mockReturnValue([]); // Explicitly set for clarity
    const expectedRegen = config.regenerationRules.baseTurnRegeneration;
    expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    expect(mockedDetectTactics).toHaveBeenCalledWith(move);
  });

  it('should return 0 regeneration if base regeneration is 0 and no tactics', () => {
    config.regenerationRules.baseTurnRegeneration = 0;
    mockedDetectTactics.mockReturnValue([]);
    expect(calculateBPRegen(move, config)).toBe(0);
  });

  // --- PIN --- //
  describe('Pin Regeneration', () => {
    it('should add regeneration for a standard pin', () => {
      const pinnedPieceType: PieceSymbol = 'n';
      const pinnedPieceValue = config.pieceValues[pinnedPieceType];
      const pinTactic: TacticsDTO = {
        type: SpecialAttackType.PIN,
        pinnedPiece: { type: pinnedPieceType, square: 'd5' },
        pinnedTo: { type: 'q', square: 'f7' },
        pinnedBy: { type: 'r', square: 'b5' },
      };
      mockedDetectTactics.mockReturnValue([pinTactic]);
      const baseRegen = config.regenerationRules.baseTurnRegeneration;
      const expectedRegen = baseRegen + pinnedPieceValue;
      expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should add extra regeneration for a pin to the king', () => {
      const pinnedPieceType: PieceSymbol = 'b';
      const pinnedPieceValue = config.pieceValues[pinnedPieceType];
      const pinTactic: TacticsDTO = {
        type: SpecialAttackType.PIN,
        pinnedPiece: { type: pinnedPieceType, square: 'e7' },
        pinnedTo: { type: 'k', square: 'g8' },
        pinnedBy: { type: 'q', square: 'a3' },
      };
      mockedDetectTactics.mockReturnValue([pinTactic]);
      const baseRegen = config.regenerationRules.baseTurnRegeneration;
      const expectedRegen = baseRegen + pinnedPieceValue + 1;
      expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should add no regeneration for pin if the rule is disabled', () => {
      config.regenerationRules.specialAttackRegeneration[SpecialAttackType.PIN].enabled = false;
      const pinTactic: TacticsDTO = {
        type: SpecialAttackType.PIN,
        pinnedPiece: { type: 'r', square: 'd5' },
        pinnedTo: { type: 'k', square: 'f7' },
        pinnedBy: { type: 'b', square: 'b3' },
      };
      mockedDetectTactics.mockReturnValue([pinTactic]);
      const expectedRegen = config.regenerationRules.baseTurnRegeneration;
      expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });
  });

  // --- SKEWER --- //
  describe('Skewer Regeneration', () => {
     it('should add regeneration for a skewer based on value difference', () => {
        const frontPieceType: PieceSymbol = 'q';
        const backPieceType: PieceSymbol = 'r';
        const frontPieceValue = config.pieceValues[frontPieceType];
        const backPieceValue = config.pieceValues[backPieceType];
        const skewerTactic: TacticsDTO = {
          type: SpecialAttackType.SKEWER,
          skeweredPiece: { type: frontPieceType, square: 'd5' },
          skeweredTo: { type: backPieceType, square: 'f7' },
          skeweredBy: { type: 'b', square: 'a2' },
        };
        mockedDetectTactics.mockReturnValue([skewerTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.max(1, Math.abs(frontPieceValue - backPieceValue));
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should add minimum regeneration (1) for a skewer if value difference is 0', () => {
        const frontPieceType: PieceSymbol = 'r';
        const backPieceType: PieceSymbol = 'r';
        const frontPieceValue = config.pieceValues[frontPieceType];
        const backPieceValue = config.pieceValues[backPieceType];
        const skewerTactic: TacticsDTO = {
          type: SpecialAttackType.SKEWER,
          skeweredPiece: { type: frontPieceType, square: 'd5' },
          skeweredTo: { type: backPieceType, square: 'g5' },
          skeweredBy: { type: 'r', square: 'a5' },
        };
        mockedDetectTactics.mockReturnValue([skewerTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.max(1, Math.abs(frontPieceValue - backPieceValue));
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

     it('should add no regeneration for skewer if the rule is disabled', () => {
      config.regenerationRules.specialAttackRegeneration[SpecialAttackType.SKEWER].enabled = false;
      const skewerTactic: TacticsDTO = {
        type: SpecialAttackType.SKEWER,
        skeweredPiece: { type: 'q', square: 'd5' },
        skeweredTo: { type: 'r', square: 'f7' },
        skeweredBy: { type: 'b', square: 'a2' },
      };
      mockedDetectTactics.mockReturnValue([skewerTactic]);
      const expectedRegen = config.regenerationRules.baseTurnRegeneration;
      expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });
  });

  // --- FORK --- //
  describe('Fork Regeneration', () => {
    it('should add regeneration for a fork based on the lowest value piece', () => {
        const forkedPiece1Type: PieceSymbol = 'r';
        const forkedPiece2Type: PieceSymbol = 'b';
        const forkedPiecesValues = [config.pieceValues[forkedPiece1Type], config.pieceValues[forkedPiece2Type]];
        const forkTactic: TacticsDTO = {
          type: SpecialAttackType.FORK,
          forkedPieces: [
              { type: forkedPiece1Type, square: 'c6' },
              { type: forkedPiece2Type, square: 'f5' },
          ],
          forkedBy: { type: 'n', square: 'e4' },
        };
        mockedDetectTactics.mockReturnValue([forkTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.min(...forkedPiecesValues);
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should correctly calculate fork regeneration with multiple pieces', () => {
        const forkedPiece1Type: PieceSymbol = 'q';
        const forkedPiece2Type: PieceSymbol = 'r';
        const forkTactic: TacticsDTO = {
          type: SpecialAttackType.FORK,
          forkedPieces: [
              { type: forkedPiece1Type, square: 'd7' },
              { type: forkedPiece2Type, square: 'f7' },
          ],
          forkedBy: { type: 'n', square: 'e5' },
        };
        mockedDetectTactics.mockReturnValue([forkTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegenCorrected = baseRegen + Math.min(config.pieceValues[forkedPiece1Type], config.pieceValues[forkedPiece2Type]);
       expect(calculateBPRegen(move, config)).toBe(expectedRegenCorrected);
   });

     it('should add no regeneration for fork if the rule is disabled', () => {
        config.regenerationRules.specialAttackRegeneration[SpecialAttackType.FORK].enabled = false;
        const forkTactic: TacticsDTO = {
          type: SpecialAttackType.FORK,
          forkedPieces: [
              { type: 'r', square: 'c6' },
              { type: 'b', square: 'f5' },
          ],
          forkedBy: { type: 'n', square: 'e4' },
        };
        mockedDetectTactics.mockReturnValue([forkTactic]);
        const expectedRegen = config.regenerationRules.baseTurnRegeneration;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });
  });

  // --- DISCOVERED ATTACK --- //
  describe('Discovered Attack Regeneration', () => {
    it('should add regeneration for a discovered attack (odd value piece)', () => {
        const attackedPieceType: PieceSymbol = 'q';
        const attackedPieceValue = config.pieceValues[attackedPieceType];
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: attackedPieceType, square: 'g7' },
          attackedBy: { type: 'r', square: 'g1' },
          isCheck: false,
        };
        mockedDetectTactics.mockReturnValue([daTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.ceil(attackedPieceValue / 2);
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should add regeneration for a discovered attack (even value piece)', () => {
        config.pieceValues['r'] = 4;
        const attackedPieceValue = config.pieceValues['r'];
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'r', square: 'g7' },
          attackedBy: { type: 'b', square: 'g1' },
          isCheck: false,
        };
        mockedDetectTactics.mockReturnValue([daTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.ceil(attackedPieceValue / 2);
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should use discovered attack formula when isCheck is true (Check tactic is filtered)', () => {
        const attackedPieceValue = config.pieceValues['q'];
        // Mock only the DA tactic because bp-calculator filters out the CHECK part
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'd8' },
          attackedBy: { type: 'r', square: 'd1' },
          isCheck: true,
        };
        mockedDetectTactics.mockReturnValue([daTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.ceil(attackedPieceValue / 2);
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should only use discovered attack formula if CHECK comes from the SAME piece', () => {
        const attackedPieceValue = config.pieceValues['q']; // 9
        const daSourceSquare: Square = 'd1';
        // Mock detector returning BOTH tactics, but check originates from same source as DA
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'd8' },
          attackedBy: { type: 'r', square: daSourceSquare }, // Rook on d1 revealed
          isCheck: true,
        };
         const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'r', square: daSourceSquare }, // Rook on d1 checks
            isDoubleCheck: false,
        };
        mockedDetectTactics.mockReturnValue([daTactic, checkTactic]);

        const baseRegen = config.regenerationRules.baseTurnRegeneration; // 1
        // DA Regen: ceil(9/2) = 5
        // Check Regen: 2 (but should be skipped)
        const expectedRegen = baseRegen + Math.ceil(attackedPieceValue / 2);
        expect(calculateBPRegen(move, config)).toBe(expectedRegen); // Should be 1 + 5 = 6
    });

     it('should add no regeneration for discovered attack if the rule is disabled', () => {
        config.regenerationRules.specialAttackRegeneration[SpecialAttackType.DISCOVERED_ATTACK].enabled = false;
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'g7' },
          attackedBy: { type: 'r', square: 'g1' },
          isCheck: false,
        };
        mockedDetectTactics.mockReturnValue([daTactic]);
        const expectedRegen = config.regenerationRules.baseTurnRegeneration;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });
  });

  // --- CHECK --- //
  describe('Check Regeneration', () => {
    it('should add regeneration for a simple check', () => {
        const checkTactic: TacticsDTO = {
          type: SpecialAttackType.CHECK,
          checkingPiece: { type: 'q', square: 'h5' },
          isDoubleCheck: false,
        };
        mockedDetectTactics.mockReturnValue([checkTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const checkRegen = 2;
        const expectedRegen = baseRegen + checkRegen;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should add same regeneration for a double check (default formula)', () => {
         const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'n', square: 'f6' },
            isDoubleCheck: true,
            secondCheckingPiece: { type: 'r', square: 'g5' },
          };
        mockedDetectTactics.mockReturnValue([checkTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const checkRegen = 2;
        const expectedRegen = baseRegen + checkRegen;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

     it('should add no regeneration for check if the rule is disabled', () => {
        config.regenerationRules.specialAttackRegeneration[SpecialAttackType.CHECK].enabled = false;
         const checkTactic: TacticsDTO = {
          type: SpecialAttackType.CHECK,
          checkingPiece: { type: 'q', square: 'h5' },
          isDoubleCheck: false,
        };
        mockedDetectTactics.mockReturnValue([checkTactic]);
        const expectedRegen = config.regenerationRules.baseTurnRegeneration;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });
  });

  // --- COMBINATIONS and CAP --- //
  describe('Combinations and Cap', () => {
    it('should sum regeneration from multiple different tactics', () => {
        const pinnedPieceType: PieceSymbol = 'n';
        const pinnedPieceValue = config.pieceValues[pinnedPieceType];
        const pinTactic: TacticsDTO = {
          type: SpecialAttackType.PIN,
          pinnedPiece: { type: pinnedPieceType, square: 'd5' },
          pinnedTo: { type: 'q', square: 'f7' },
          pinnedBy: { type: 'r', square: 'b5' },
        };
        const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'r', square: 'b5' },
            isDoubleCheck: false,
        };
        mockedDetectTactics.mockReturnValue([pinTactic, checkTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const pinRegen = pinnedPieceValue;
        const checkRegen = 2;
        const expectedRegen = baseRegen + pinRegen + checkRegen;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

     it('should correctly handle discovered attack + check hierarchy (only DA counts)', () => {
        const attackedPieceValue = config.pieceValues['q'];
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'd8' },
          attackedBy: { type: 'r', square: 'd1' },
          isCheck: true,
        };
        // Even if the detector returned both, calculateBPRegen should filter the check.
        // So we only mock the DA tactic here to test calculateBPRegen's filtering.
        mockedDetectTactics.mockReturnValue([daTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const expectedRegen = baseRegen + Math.ceil(attackedPieceValue / 2);
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should sum regeneration from multiple different NON-CHECK tactics', () => {
        // Example: Pin + Fork
        const pinnedPieceType: PieceSymbol = 'n'; // 3
        const pinnedPieceValue = config.pieceValues[pinnedPieceType];
        const forkedPiece1Type: PieceSymbol = 'r'; // 5
        const forkedPiece2Type: PieceSymbol = 'b'; // 3
        const forkedPiecesValues = [config.pieceValues[forkedPiece1Type], config.pieceValues[forkedPiece2Type]];

        const pinTactic: TacticsDTO = {
            type: SpecialAttackType.PIN,
            pinnedPiece: { type: pinnedPieceType, square: 'd7' },
            pinnedTo: { type: 'k', square: 'd8' },
            pinnedBy: { type: 'r', square: 'd1' },
        };
        const forkTactic: TacticsDTO = {
            type: SpecialAttackType.FORK,
            forkedPieces: [
                { type: forkedPiece1Type, square: 'a8' },
                { type: forkedPiece2Type, square: 'f8' },
            ],
            forkedBy: { type: 'n', square: 'c7' }, // Assume knight moved here
        };
        mockedDetectTactics.mockReturnValue([pinTactic, forkTactic]);

        const baseRegen = config.regenerationRules.baseTurnRegeneration; // 1
        const pinRegen = pinnedPieceValue + 1; // Pinned to king: 3 + 1 = 4
        const forkRegen = Math.min(...forkedPiecesValues); // min(5, 3) = 3
        const expectedRegen = baseRegen + pinRegen + forkRegen; // 1 + 4 + 3 = 8
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });

    it('should sum regeneration for discovered attack and an INDEPENDENT check (Double Check)', () => {
        const attackedPieceValue = config.pieceValues['q']; // 9
        const daSourceSquare: Square = 'd1';
        const checkSourceSquare: Square = 'e5'; // Different piece delivers the second check

        // Mock detector returning BOTH tactics, sources are different
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'd8' },
          attackedBy: { type: 'r', square: daSourceSquare }, // Rook on d1 revealed
          isCheck: true, // This DA includes a check from the Rook
        };
         const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'n', square: checkSourceSquare }, // Knight on e5 ALSO checks
            isDoubleCheck: true, // Signifying a double check occurred
        };
        mockedDetectTactics.mockReturnValue([daTactic, checkTactic]);

        const baseRegen = config.regenerationRules.baseTurnRegeneration; // 1
        // DA Regen: ceil(9/2) = 5 (from the Rook's discovered check)
        const daRegen = Math.ceil(attackedPieceValue / 2);
        // Check Regen: 2 (from the Knight's check, source is different, not skipped)
        const checkRegen = 2;
        const expectedRegen = baseRegen + daRegen + checkRegen;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen); // Should be 1 + 5 + 2 = 8
    });

    // Test for simple DA + simple Check (non-hierarchical) remains valid if sources different
    it('should sum regeneration for a non-checking DA and a separate Check', () => {
        const attackedPieceValue = config.pieceValues['b']; // 3
        const daSourceSquare: Square = 'a1';
        const checkSourceSquare: Square = 'h5';

        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'b', square: 'f6' },
          attackedBy: { type: 'r', square: daSourceSquare },
          isCheck: false, // DA itself is not a check
        };
         const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'q', square: checkSourceSquare },
            isDoubleCheck: false,
        };
        mockedDetectTactics.mockReturnValue([daTactic, checkTactic]);

        const baseRegen = config.regenerationRules.baseTurnRegeneration; // 1
        // DA Regen: ceil(3/2) = 2
        const daRegen = Math.ceil(attackedPieceValue / 2);
        // Check Regen: 2
        const checkRegen = 2;
        const expectedRegen = baseRegen + daRegen + checkRegen;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen); // Should be 1 + 2 + 2 = 5
    });

    it('should apply the turn regeneration cap if defined and total exceeds cap', () => {
        // Using the double check scenario which yields 8 raw regen
        config.regenerationRules.turnRegenCap = 5;
        const attackedPieceValue = config.pieceValues['q']; // 9
        const daSourceSquare: Square = 'd1';
        const checkSourceSquare: Square = 'e5';
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'd8' },
          attackedBy: { type: 'r', square: daSourceSquare },
          isCheck: true,
        };
         const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'n', square: checkSourceSquare },
            isDoubleCheck: true,
        };
        mockedDetectTactics.mockReturnValue([daTactic, checkTactic]);
        const expectedCappedRegen = config.regenerationRules.turnRegenCap;
        expect(calculateBPRegen(move, config)).toBe(expectedCappedRegen); // Expect 5
    });

     it('should not apply the turn regeneration cap if total does not exceed cap', () => {
        // Using the double check scenario which yields 8 raw regen
        config.regenerationRules.turnRegenCap = 10;
        const attackedPieceValue = config.pieceValues['q']; // 9
        const daSourceSquare: Square = 'd1';
        const checkSourceSquare: Square = 'e5';
        const daTactic: TacticsDTO = {
          type: SpecialAttackType.DISCOVERED_ATTACK,
          attackedPiece: { type: 'q', square: 'd8' },
          attackedBy: { type: 'r', square: daSourceSquare },
          isCheck: true,
        };
         const checkTactic: TacticsDTO = {
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'n', square: checkSourceSquare },
            isDoubleCheck: true,
        };
        mockedDetectTactics.mockReturnValue([daTactic, checkTactic]);
        const baseRegen = config.regenerationRules.baseTurnRegeneration;
        const daRegen = Math.ceil(attackedPieceValue / 2);
        const checkRegen = 2;
        const expectedRegen = baseRegen + daRegen + checkRegen; // 1 + 5 + 2 = 8
        expect(calculateBPRegen(move, config)).toBe(expectedRegen); // Expect 8 (less than cap 10)
    });

    it('should return only base regeneration if all tactic rules are disabled', () => {
        Object.values(SpecialAttackType).forEach(type => {
            if (config.regenerationRules.specialAttackRegeneration[type]) {
                 config.regenerationRules.specialAttackRegeneration[type].enabled = false;
            }
        });
        // Provide multiple tactics that would normally generate BP
         const pinTactic: TacticsDTO = {
           type: SpecialAttackType.PIN,
           pinnedPiece: { type: 'n', square: 'd5' },
           pinnedTo: { type: 'q', square: 'f7' },
           pinnedBy: { type: 'r', square: 'b5' }
         };
         const checkTactic: TacticsDTO = {
           type: SpecialAttackType.CHECK,
           checkingPiece: { type: 'r', square: 'b5' },
           isDoubleCheck: false
         };
        mockedDetectTactics.mockReturnValue([pinTactic, checkTactic]);
        const expectedRegen = config.regenerationRules.baseTurnRegeneration;
        expect(calculateBPRegen(move, config)).toBe(expectedRegen);
    });
  });
});
