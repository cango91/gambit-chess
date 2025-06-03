import { GambitMove, SpecialAttackType, DiscoveredAttackDTO } from '@gambit-chess/shared';
import { detectDiscoveredAttacks } from './discovered-attack-detector';
import { Chess } from 'chess.js';
describe('Discovered Attack Detector', () => {
    let currentBoard: Chess;
    let previousBoard: Chess;
    let lastMove: GambitMove;

    beforeEach(() => {
        // Default setup, clears boards and provides a basic move object
        previousBoard = new Chess();
        currentBoard = new Chess();
        lastMove = {
            color: 'w', // Default to white's move
            from: 'e2',
            to: 'e4',
            piece: 'p',
            flags: 'b', // Assuming a standard pawn push initially
            san: 'e4',
            lan: 'e2e4',
            before: previousBoard.fen(),
            after: currentBoard.fen(),
            isCapture: () => false,
            isPromotion: () => false,
            isEnPassant: () => false,
            isKingsideCastle: () => false,
            isQueensideCastle: () => false,
            isBigPawn: () => true,
        };
    });

    test('should detect a simple discovered attack (Bishop moves, reveals Rook attack)', () => {
        // Setup: White Bishop on d3 moves to c4, revealing Queen on d1 attack on Black Pawn on d7
        previousBoard = new Chess('rnbqkb1r/pppppppp/8/8/8/3B4/PPP1PPPP/RNBQK1NR w KQkq - 0 1'); // Bishop on d3
        currentBoard = new Chess('rnbqkb1r/pppppppp/8/8/2B5/8/PPP1PPPP/RNBQK1NR b KQkq - 0 1');  // Bishop on c4
        lastMove = {
            color: 'w', from: 'd3', to: 'c4', piece: 'b', flags: 'n', san: 'Bc4', lan: 'd3c4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(1);
        const attack = attacks[0];
        expect(attack.type).toBe(SpecialAttackType.DISCOVERED_ATTACK);
        expect(attack.attackedPiece).toEqual({ type: 'p', square: 'd7' });
        expect(attack.attackedBy).toEqual({ type: 'q', square: 'd1' });
        expect(attack.isCheck).toBe(false);
    });

    test('should detect a discovered check (Knight moves, reveals Queen check)', () => {
        // Setup: White Knight on e4 moves to f5, revealing Queen on e2 check on Black King on e8
        previousBoard = new Chess('r1bqkbnr/ppp2ppp/2np4/8/8/3PN3/PPP1QPPP/R1B1KBNR w KQkq - 0 1'); // Knight on e4
        currentBoard = new Chess('r1bqkbnr/ppp2ppp/2np4/5N2/8/3P4/PPP1QPPP/R1B1KBNR b KQkq - 0 1'); // Knight on c5
        lastMove = {
            color: 'w', from: 'e4', to: 'f5', piece: 'n', flags: 'n', san: 'Nf5', lan: 'e4f5',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(1);
        const attack = attacks[0];
        expect(attack.type).toBe(SpecialAttackType.DISCOVERED_ATTACK);
        expect(attack.attackedPiece).toEqual({ type: 'k', square: 'e8' });
        expect(attack.attackedBy).toEqual({ type: 'q', square: 'e2' });
        expect(attack.isCheck).toBe(true);
    });

    test('should detect multiple discovered attacks revealed by one move', () => {
        // Setup: White pawn on e4 moves to e5. Bishop on f3 attacks pawn c6. Rook on a4 attacks Knight on h4.
        previousBoard = new Chess('4k3/8/2p5/8/R3P2n/5B2/8/4K3 w - - 0 1');
        currentBoard = new Chess('4k3/8/2p5/4P3/R6n/5B2/8/4K3 b - - 0 1');
        lastMove = {
            color: 'w', from: 'e4', to: 'e5', piece: 'p', flags: 'n', san: 'e5', lan: 'e4e5',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(2);

        // Sort attacks by attacked piece square for consistent checking
        attacks.sort((a, b) => a.attackedPiece.square.localeCompare(b.attackedPiece.square));

        // Check 1: Bishop f3 attacks pawn c6
        expect(attacks[0].type).toBe(SpecialAttackType.DISCOVERED_ATTACK);
        expect(attacks[0].attackedPiece).toEqual({ type: 'p', square: 'c6' });
        expect(attacks[0].attackedBy).toEqual({ type: 'b', square: 'f3' });
        expect(attacks[0].isCheck).toBe(false);

        // Check 2: Rook a4 attacks Knight d4
        expect(attacks[1].type).toBe(SpecialAttackType.DISCOVERED_ATTACK);
        expect(attacks[1].attackedPiece).toEqual({ type: 'n', square: 'h4' });
        expect(attacks[1].attackedBy).toEqual({ type: 'r', square: 'a4' });
        expect(attacks[1].isCheck).toBe(false);
    });

    test('should not detect discovered attack when no attack is revealed', () => {
        // Standard opening move
        previousBoard = new Chess();
        currentBoard = new Chess('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
        lastMove = {
            color: 'w', from: 'e2', to: 'e4', piece: 'p', flags: 'b', san: 'e4', lan: 'e2e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => true,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(0);
    });

    test('should not detect if attack exists after move, but was not blocked before', () => {
        // Setup: White Rook is attacking Black knight on b8. White moves a pawn.
        previousBoard = new Chess('rnbqkbnr/p1pppppp/8/8/1R6/8/1PPPPPPP/4KBNR w Kkq - 0 1');
        currentBoard = new Chess('rnbqkbnr/p1pppppp/8/8/1R6/2P5/1P1PPPPP/4KBNR b Kkq - 0 1');
        lastMove = {
            color: 'w', from: 'c2', to: 'c3', piece: 'p', flags: 'n', san: 'c3', lan: 'c2c3',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(0); // Attack exists, but wasn't *discovered*
    });

     test('should detect discovered attack revealed by a capture', () => {
        // Setup: White Bishop on a4 is blocked by white Pawn on c6 from attacking king on e8. Pawn captures b7.
        previousBoard = new Chess('rnbqkbnr/ppp1pppp/2P5/8/B2p4/4P3/PP1P1PPP/RNBQK1NR w KQkq - 0 1');
        currentBoard = new Chess('rnbqkbnr/pPp1pppp/8/8/B2p4/4P3/PP1P1PPP/RNBQK1NR b KQkq - 0 1'); 
        lastMove = {
            color: 'w', from: 'c6', to: 'b7', piece: 'p', flags: 'c', san: 'cxb7', lan: 'c6b7',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => true, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(1);
        const attack = attacks[0];
        expect(attack.type).toBe(SpecialAttackType.DISCOVERED_ATTACK);
        expect(attack.attackedPiece).toEqual({ type: 'k', square: 'e8' });
        expect(attack.attackedBy).toEqual({ type: 'b', square: 'a4' });
        expect(attack.isCheck).toBe(true);
    });

    test('should detect discovered attack revealed by en-passant capture', () => {
        // Setup: White Pawn on c5 captures Black Pawn on b5 e.p. Bishop on a4 reveals attack on king on e8.
        previousBoard = new Chess('rnbqkbnr/p1p1pppp/8/1pP5/B7/4P3/PP1P1PPP/RNBQK1NR w KQkq b6 0 1');
        currentBoard = new Chess('rnbqkbnr/p1p1pppp/1P6/8/B7/4P3/PP1P1PPP/RNBQK1NR b KQkq - 0 1');
        lastMove = {
            color: 'w', from: 'c5', to: 'b6', piece: 'p', flags: 'e', san: 'exb6', lan: 'c5b6',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => true, isPromotion: () => false, isEnPassant: () => true, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const attacks = detectDiscoveredAttacks(currentBoard, previousBoard, lastMove);
        expect(attacks).toHaveLength(1);
        const attack = attacks[0];
        expect(attack.type).toBe(SpecialAttackType.DISCOVERED_ATTACK);
        expect(attack.attackedPiece).toEqual({ type: 'k', square: 'e8' });
        expect(attack.attackedBy).toEqual({ type: 'b', square: 'a4' });
        expect(attack.isCheck).toBe(true);
    });

}); 