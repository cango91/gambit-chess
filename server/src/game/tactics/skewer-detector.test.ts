import { GambitMove, SpecialAttackType } from '@gambit-chess/shared';
import { detectSkewers, exportsForTesting } from './skewer-detector';
import { clearMemoizedTwoHitRayCasts } from './utils';
import { Chess } from 'chess.js';

describe('Skewer Detector', () => {
    let currentBoard: Chess;
    let previousBoard: Chess;
    let lastMove: GambitMove;

    beforeEach(() => {
        // Default setup
        previousBoard = new Chess();
        currentBoard = new Chess();
        lastMove = {
            color: 'w', from: 'e2', to: 'e4', piece: 'p', flags: 'b', san: 'e4', lan: 'e2e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => true,
        };
        clearMemoizedTwoHitRayCasts();
    });

    test('should detect a new skewer created by a move', () => {
        // Setup: White Rook moves to d4, skewering Black Queen on d6 against Black Rook on d8
        // . . . r k . . .      . . . r k . . . (Black Rook on d8)
        // . . . . . . . .      . . . . . . . .
        // . . . q . . . .  ->  . . . q . . . . (Black Queen skewered on d6)
        // . . . . . . . .      . . . . . . . .
        // . . . . . . . .      . . . . . . . . (White Rook moved to d4)
        // . . . . . . . .      . . . . . . . .
        // R . . . . . . .      . . . R . . . .
        // . . . . K . . .      . . . . K . . .
        previousBoard = new Chess('3rk3/8/3q4/8/8/8/R7/4K3 w - - 0 1');
        currentBoard = new Chess('3rk3/8/3q4/8/3R4/8/8/4K3 b - - 0 1');
        lastMove = {
            color: 'w', from: 'a2', to: 'd4', piece: 'r', flags: 'n', san: 'Rd4', lan: 'a2d4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(1);
        const skewer = skewers[0];
        expect(skewer.type).toBe(SpecialAttackType.SKEWER);
        expect(skewer.skeweredPiece).toEqual({ type: 'q', square: 'd6' });
        expect(skewer.skeweredTo).toEqual({ type: 'r', square: 'd8' });
        expect(skewer.skeweredBy).toEqual({ type: 'r', square: 'd4' });
    });

     test('should detect a skewer created by moving a piece that uncovers an attack (discovered skewer)', () => {
        // Setup: Black king in check moves to reveal a skewer by queen
        previousBoard = new Chess('8/8/8/8/8/8/qk2R2P/4K3 b - - 0 1'); 
        currentBoard = new Chess('8/8/8/8/8/8/q3R2P/1k2K3 w - - 0 1');

         lastMove = {
            color: 'b', from: 'b2', to: 'b1', piece: 'k', flags: 'b', san: 'Kb1', lan: 'b2b1',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => true,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(1);
        const skewer = skewers[0];
        expect(skewer.type).toBe(SpecialAttackType.SKEWER);
        expect(skewer.skeweredPiece).toEqual({ type: 'r', square: 'e2' });
        expect(skewer.skeweredTo).toEqual({ type: 'p', square: 'h2' });
        expect(skewer.skeweredBy).toEqual({ type: 'q', square: 'a2' });
    });


    test('should not detect a skewer if it already existed before the move', () => {
        // Setup: Skewer exists, but an unrelated King move happens
        // . . . r k . . .      . . . r k . . . (Existing skewer)
        // . . . . . . . .      . . . . . . . .
        // . . . q . . . .      . . . q . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . R . . . .  ->  . . . R . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . . K . . .      . . . K . . . . (King moves e1-d1)
        previousBoard = new Chess('3rk3/8/3q4/8/3R4/8/8/4K3 w - - 0 1');
        currentBoard = new Chess('3rk3/8/3q4/8/3R4/8/8/3K4 b - - 1 1');
        lastMove = {
            color: 'w', from: 'e1', to: 'd1', piece: 'k', flags: 'n', san: 'Kd1', lan: 'e1d1',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
        };

        const existingSkewers = exportsForTesting.detectAllSkewers(previousBoard, 'b');
        expect(existingSkewers).toHaveLength(1);
        expect(existingSkewers[0].skeweredPiece).toEqual({ type: 'q', square: 'd6' });
        expect(existingSkewers[0].skeweredTo).toEqual({ type: 'r', square: 'd8' });
        expect(existingSkewers[0].skeweredBy).toEqual({ type: 'r', square: 'd4' });

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(0);
    });

    test('should not detect a skewer if the move resolves the skewer by moving the skewered piece', () => {
        // Setup: Skewered Queen moves off the line
        // . . . r k . . .      . . . r k . . .
        // . . . . . . . .      . . . . . . . .
        // . . . q . . . .  ->  . . . . . . . .
        // . . . . . . . .      . . . . q . . . (Queen moves d6-f4)
        // . . . R . . . .      . . . R . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . . K . . .      . . . . K . . .
        previousBoard = new Chess('3rk3/8/3q4/8/3R4/8/8/4K3 b - - 0 1');
        currentBoard = new Chess('3rk3/8/8/5q2/3R4/8/8/4K3 w - - 1 2');
        lastMove = {
            color: 'b', from: 'd6', to: 'f4', piece: 'q', flags: 'n', san: 'Qf4', lan: 'd6f4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(0);
    });

    test('should not detect a skewer if the move resolves the skewer by moving the skewering piece', () => {
        // Setup: Skewering Rook moves off the line
        // . . . r k . . .      . . . r k . . .
        // . . . . . . . .      . . . . . . . .
        // . . . q . . . .      . . . q . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . R . . . .  ->  . . . . . . . .
        // . . . . . . . .      . . . . . R . . (Rook moves d4-g4)
        // . . . . . . . .      . . . . . . . .
        // . . . . K . . .      . . . . K . . .
        previousBoard = new Chess('3rk3/8/3q4/8/3R4/8/8/4K3 w - - 0 1');
        currentBoard = new Chess('3rk3/8/3q4/8/6R1/8/8/4K3 b - - 1 1');
        lastMove = {
            color: 'w', from: 'd4', to: 'g4', piece: 'r', flags: 'n', san: 'Rg4', lan: 'd4g4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(0);
    });

     test('should not detect a skewer if the move resolves the skewer by blocking the line', () => {
        // Setup: Black Knight moves between skewering Rook and skewered Queen
        // . . . r k . . .      . . . r k . . .
        // . . . . . n . .      . . . . . . . .
        // . . . q . . . .      . . . q . . . .
        // . . . . . . . .  ->  . . . n . . . . (Knight moves f7-d5)
        // . . . R . . . .      . . . R . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . . . . . .      . . . . . . . .
        // . . . . K . . .      . . . . K . . .
        previousBoard = new Chess('3rk3/5n2/3q4/8/3R4/8/8/4K3 b - - 0 1');
        currentBoard = new Chess('3rk3/8/3q4/3n4/3R4/8/8/4K3 w - - 1 2');
        lastMove = {
            color: 'b', from: 'f7', to: 'd5', piece: 'n', flags: 'n', san: 'Nd5', lan: 'f7d5',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(0);
    });

    test('should return empty array when no skewers are possible', () => {
        previousBoard = new Chess(); // Start position
        currentBoard = new Chess('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'); // After 1. e4
        lastMove = {
            color: 'w', from: 'e2', to: 'e4', piece: 'p', flags: 'b', san: 'e4', lan: 'e2e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => true,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(0);
    });

    test('should detect skewer where skewered piece is equal value to skeweredTo piece', () => {
        // Setup: White Rook moves to d4, skewering Black Rook on d6 against Black Rook on d8
        // . . . r k . . .      . . . r k . . . (Black Rook on d8)
        // . . . . . . . .      . . . . . . . .
        // . . . r . . . .  ->  . . . r . . . . (Black Rook skewered on d6)
        // . . . . . . . .      . . . . . . . .
        // . . . . . . . .      . . . R . . . . (White Rook moved to d4)
        // . . . . . . . .      . . . . . . . .
        // R . . . . . . .      . . . . . . . .
        // . . . . K . . .      . . . . K . . .
        previousBoard = new Chess('3rk3/8/3r4/8/8/8/R7/4K3 w - - 0 1');
        currentBoard = new Chess('3rk3/8/3r4/8/3R4/8/8/4K3 b - - 0 1');
        lastMove = {
            color: 'w', from: 'a2', to: 'd4', piece: 'r', flags: 'n', san: 'Rd4', lan: 'a2d4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
        };

        const skewers = detectSkewers(currentBoard, previousBoard, lastMove);
        expect(skewers).toHaveLength(1);
        const skewer = skewers[0];
        expect(skewer.type).toBe(SpecialAttackType.SKEWER);
        expect(skewer.skeweredPiece).toEqual({ type: 'r', square: 'd6' });
        expect(skewer.skeweredTo).toEqual({ type: 'r', square: 'd8' });
        expect(skewer.skeweredBy).toEqual({ type: 'r', square: 'd4' });
    });


}); 