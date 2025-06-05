import { GambitMove, SpecialAttackType } from '@gambit-chess/shared';
import { detectPins, exportsForTesting } from './pin-detector';
import { clearMemoizedTwoHitRayCasts } from './utils';
import { Chess } from 'chess.js';

describe('Pin Detector', () => {
    let currentBoard: Chess;
    let previousBoard: Chess;
    let lastMove: GambitMove;

    beforeEach(() => {
        // Default setup, can be overridden in specific tests
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
            isBigPawn: () => false,
        };
        clearMemoizedTwoHitRayCasts();
    });

    test('should detect a new pin created by a move', () => {
        // Setup: White Queen moves to create a pin on Black Knight against Black Queen
        currentBoard = new Chess('4k3/4n3/8/8/8/8/4Q3/4K3 b - - 0 1');
        previousBoard = new Chess('4k3/4n3/8/8/8/8/8/3QK3 w - - 0 1');

        lastMove = {
            color: 'w', from: 'd1', to: 'e2', piece: 'q', flags:'n', san: 'Qe2', lan: 'd1e2',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, 
            isPromotion: () => false, 
            isEnPassant: () => false, 
            isKingsideCastle: () => false, 
            isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const pins = detectPins(currentBoard, previousBoard, lastMove);
        expect(pins).toHaveLength(1);
        const pin = pins[0];
        expect(pin.type).toBe(SpecialAttackType.PIN);
        expect(pin.pinnedPiece).toEqual({ type: 'n', square: 'e7' });
        expect(pin.pinnedTo).toEqual({ type: 'k', square: 'e8' });
        expect(pin.pinnedBy).toEqual({ type: 'q', square: 'e2' });
    });

    test('should detect a pin created by moving a piece that uncovers an attack (discovered pin)', () => {
        // Setup: White Knight moves, uncovering a Rook pin on Black Bishop against Black King
        previousBoard = new Chess('2k5/8/2b5/2N5/8/2R5/8/4K3 w - - 0 1');
        currentBoard = new Chess('2k5/8/2b5/8/4N3/2R5/8/4K3 b - - 0 1');
        lastMove = {
            color: 'w', from: 'c5', to: 'e4', piece: 'n', flags: 'n', san: 'Ne4', lan: 'c5e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const pins = detectPins(currentBoard, previousBoard, lastMove);
        expect(pins).toHaveLength(1);
        const pin = pins[0];
        expect(pin.type).toBe(SpecialAttackType.PIN);
        expect(pin.pinnedPiece).toEqual({ type: 'b', square: 'c6' });
        expect(pin.pinnedTo).toEqual({ type: 'k', square: 'c8' });
        expect(pin.pinnedBy).toEqual({ type: 'r', square: 'c3' });
    });

    test('should not detect a pin if it already existed before the move', () => {
        // Setup: Pin exists, but an unrelated pawn move happens
        previousBoard = new Chess('4k3/5q2/8/3n4/2B5/P7/8/4K3 w - - 0 1');
        currentBoard = new Chess('4k3/5q2/8/3n4/P1B5/8/8/4K3 b - - 0 1');
        lastMove = {
            color: 'w', from: 'a3', to: 'a4', piece: 'p', flags: 'n', san: 'a4', lan: 'a3a4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const existingPins = exportsForTesting.detectAllPins(previousBoard, 'b');
        expect(existingPins).toHaveLength(1);
        expect(existingPins[0].pinnedPiece).toEqual({ type: 'n', square: 'd5' });
        expect(existingPins[0].pinnedTo).toEqual({ type: 'q', square: 'f7' });
        expect(existingPins[0].pinnedBy).toEqual({ type: 'b', square: 'c4' });

        const pins = detectPins(currentBoard, previousBoard, lastMove);
        expect(pins).toHaveLength(0);
    });


    test('should detect a pin if an existing pin is resolved by creating a new pin', () => {
        // Setup: Bishop already pins pawn to knight, by capturing the pawn a new pin is created
        // by pinning the knight to the queen.
        previousBoard = new Chess('4k3/8/B7/1p6/2n5/3q4/8/4K3 w - - 0 1');
        currentBoard = new Chess('4k3/8/8/1B6/2n5/3q4/8/4K3 b - - 0 1');
         lastMove = {
            color: 'w', from: 'a6', to: 'b5', piece: 'b', flags: 'nc', san: 'Bxb5', lan: 'a6b5',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => true, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const existingPins = exportsForTesting.detectAllPins(previousBoard, 'b');
        expect(existingPins).toHaveLength(1);
        expect(existingPins[0].pinnedPiece).toEqual({ type: 'p', square: 'b5' });
        expect(existingPins[0].pinnedTo).toEqual({ type: 'n', square: 'c4' });
        expect(existingPins[0].pinnedBy).toEqual({ type: 'b', square: 'a6' });

        const pins = detectPins(currentBoard, previousBoard, lastMove);
        expect(pins).toHaveLength(1);
        expect(pins[0].pinnedPiece).toEqual({ type: 'n', square: 'c4' });
        expect(pins[0].pinnedTo).toEqual({ type: 'q', square: 'd3' });
        expect(pins[0].pinnedBy).toEqual({ type: 'b', square: 'b5' });
    });

     test('should return empty array when no pins are possible', () => {
        previousBoard = new Chess(); // Start position
        currentBoard = new Chess('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'); // After 1. e4
        lastMove = {
            color: 'w', from: 'e2', to: 'e4', piece: 'p', flags: 'b', san: 'e4', lan: 'e2e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const pins = detectPins(currentBoard, previousBoard, lastMove);
        expect(pins).toHaveLength(0);
    });

}); 