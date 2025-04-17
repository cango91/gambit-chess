import { GambitChess, GambitMove, SpecialAttackType, ForkDTO } from '@gambit-chess/shared';
import { detectForks, exportsForTesting } from './fork-detector';

describe('Fork Detector', () => {
    let currentBoard: GambitChess;
    let previousBoard: GambitChess;
    let lastMove: GambitMove;

    beforeEach(() => {
        // Default setup, can be overridden in specific tests
        previousBoard = new GambitChess();
        currentBoard = new GambitChess();
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

    test('should detect a new fork created by a Knight move', () => {
        // Setup: White Knight moves to c7, forking Black King and Rook
        previousBoard = new GambitChess('r3kbnr/ppp1pppp/8/3N4/8/8/PPPPPPPP/R3KBNR w KQkq - 0 1');
        currentBoard = new GambitChess('r3kbnr/ppN1pppp/8/8/8/8/PPPPPPPP/R3KBNR b KQkq - 0 1');

        lastMove = {
            color: 'w', from: 'd5', to: 'c7', piece: 'n', flags: 'n', san: 'Nc7+', lan: 'd5c7',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => true, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false, captureAttempt: true,
        };

        const forks = detectForks(currentBoard, previousBoard, lastMove);
        expect(forks).toHaveLength(1);
        const fork = forks[0];
        expect(fork.type).toBe(SpecialAttackType.FORK);
        expect(fork.forkedBy).toEqual({ type: 'n', square: 'c7' });
        expect(fork.forkedPieces).toHaveLength(2);
        // Sort squares for consistent comparison
        const forkedSquares = fork.forkedPieces.map(p => p.square).sort();
        expect(forkedSquares).toEqual(['a8', 'e8']);
        expect(fork.forkedPieces.find(p => p.square === 'a8')?.type).toBe('r');
        expect(fork.forkedPieces.find(p => p.square === 'e8')?.type).toBe('k');
    });

    test('should detect a new fork created by a Bishop move', () => {
        // Setup: Black Bishop moves to e4, forking White Queen on f5 and Rook on d5
        previousBoard = new GambitChess('r3kbnr/ppp1pppp/8/3N1b2/8/8/PPPPPPPP/R1BQKBNR b KQkq - 0 1');
        currentBoard = new GambitChess('r3kbnr/ppp1pppp/8/3N4/4b3/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1');
        lastMove = {
            color: 'b', from: 'f5', to: 'e4', piece: 'b', flags: 'n', san: 'Be4', lan: 'f5e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        const forks = detectForks(currentBoard, previousBoard, lastMove);
        expect(forks).toHaveLength(1);
        const fork = forks[0];
        expect(fork.type).toBe(SpecialAttackType.FORK);
        expect(fork.forkedBy).toEqual({ type: 'b', square: 'e4' });
        expect(fork.forkedPieces).toHaveLength(3);
        const forkedSquares = fork.forkedPieces.map(p => p.square).sort();
        expect(forkedSquares).toEqual(['c2', 'd5', 'g2']);
        expect(fork.forkedPieces.find(p => p.square === 'c2')?.type).toBe('p');
        expect(fork.forkedPieces.find(p => p.square === 'd5')?.type).toBe('n');
        expect(fork.forkedPieces.find(p => p.square === 'g2')?.type).toBe('p');
    });

    test('should detect a discovered fork (Pawn moves uncovering Queen fork) which modifies an existing fork and creates a new fork', () => {
         // Setup: White pawn moves d5->d6 uncovering Queen fork on c5 to pawn on e5, modifying the existing fork
         // by blocking the fork on the black queen on e7. Pawn on d6 also creates a new fork on black queen and knight
         previousBoard = new GambitChess('r3k2r/p1n1qppp/1p6/2QPp3/1P6/P4N2/5PPP/R3R1K1 w kq - 0 1');
         currentBoard = new GambitChess('r3k2r/p1n1qppp/1p1P4/2Q1p3/1P6/P4N2/5PPP/R3R1K1 b kq - 0 1');
         lastMove = {
             color: 'w', from: 'd5', to: 'd6', piece: 'p', flags: 'n', san: 'd6', lan: 'd5d6',
             before: previousBoard.fen(), after: currentBoard.fen(),
             isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
             isBigPawn: () => false,
         };

         // assert pre-existing fork
         const existingForks: ForkDTO[] = exportsForTesting.detectAllForks(previousBoard, 'w');
         expect(existingForks).toHaveLength(1);
         expect(existingForks[0].forkedBy).toEqual({ type: 'q', square: 'c5' });
         expect(existingForks[0].forkedPieces).toHaveLength(3);
         const existingForkedSquares = existingForks[0].forkedPieces.map(p => p.square).sort();
         expect(existingForkedSquares).toEqual(['b6', 'c7', 'e7']);

         // assert new fork
         const newForks = detectForks(currentBoard, previousBoard, lastMove);
         expect(newForks).toHaveLength(2);

         // assert the existing fork is modified and counted as new fork
         const existingFork = newForks.find(f => f.forkedBy.square === 'c5');
         expect(existingFork).toBeDefined();
         expect(existingFork?.forkedBy).toEqual({ type: 'q', square: 'c5' });
         expect(existingFork?.forkedPieces).toHaveLength(3);
         const preExistingForkedSquares = existingFork?.forkedPieces.map(p => p.square).sort();
         expect(preExistingForkedSquares).toEqual(['b6', 'c7', 'e5']);

         // assert new fork
         const newFork = newForks.find(f => f.forkedBy.square === 'd6');
         expect(newFork).toBeDefined();
         expect(newFork?.forkedBy).toEqual({ type: 'p', square: 'd6' });
         expect(newFork?.forkedPieces).toHaveLength(2);
         const newForkedSquares = newFork?.forkedPieces.map(p => p.square).sort();
         expect(newForkedSquares).toEqual(['c7', 'e7']);
    });

    test('should not detect a fork if it already existed before the move', () => {
        // Setup: Knight on c7 already forks bishop and Rook. White castles queenside (not modifying the existing fork)
        previousBoard = new GambitChess('b1k1r1nr/p1N1pppp/1p6/8/8/P7/1PPPPPPP/R3KBNR w KQ - 0 1');
        currentBoard = new GambitChess('b1k1r1nr/p1N1pppp/1p6/8/8/P7/1PPPPPPP/2KR1BNR b - - 0 1');
        lastMove = {
            color: 'w', from: 'e1', to: 'c1', piece: 'k', flags: '', san: 'O-O-O', lan: 'e1c1', // White castles queenside
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => true,
            isBigPawn: () => false,
        };

        // Verify fork exists in previous state using detectAllForks
        const existingForks: ForkDTO[] = exportsForTesting.detectAllForks(previousBoard, 'w'); // White forks black
        expect(existingForks).toHaveLength(1);
        expect(existingForks[0].forkedBy).toEqual({ type: 'n', square: 'c7'});
        const existingForkedSquares = existingForks[0].forkedPieces.map(p => p.square).sort();
        expect(existingForkedSquares).toEqual(['a8', 'e8']);

        // Now check that detectForks returns 0 new forks
        const forks = detectForks(currentBoard, previousBoard, lastMove);
        expect(forks).toHaveLength(0);
    });

    test('should detect a fork if an existing fork is modified (different pieces forked)', () => {
        // Setup: Queen on d5 forks Bishop h5 and pawns b7 and f7. Queen moves to c5, still forking bishop h5
        // and creating new forks on pawns a7, c7, e7 
        previousBoard = new GambitChess('r3kbnr/ppp1pppp/8/3Q3b/8/8/PPPPPPPP/R1B1KBNR w KQkq - 0 1');
        currentBoard = new GambitChess('r3kbnr/ppp1pppp/8/2Q4b/8/8/PPPPPPPP/R1B1KBNR b KQkq - 0 1');

        // Pre-check: Ensure the fork existed
        const existingForks: ForkDTO[] = exportsForTesting.detectAllForks(previousBoard, 'w');
        expect(existingForks).toHaveLength(1);
        expect(existingForks[0].forkedBy).toEqual({ type: 'q', square: 'd5' });
        expect(existingForks[0].forkedPieces.map((p:any) => p.square).sort()).toEqual(['b7', 'f7', 'h5']);

        lastMove = {
            color: 'w', from: 'd5', to: 'c5', piece: 'q', flags: 'n', san: 'Qc5', lan: 'd5c5',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => false,
        };

        // After the move, the Queen no longer forks, so detectForks should be empty
        const forks = detectForks(currentBoard, previousBoard, lastMove);
        expect(forks).toHaveLength(1);
        expect(forks[0].forkedBy).toEqual({ type: 'q', square: 'c5' });
        expect(forks[0].forkedPieces.map((p:any) => p.square).sort()).toEqual(['a7', 'c7', 'e7', 'h5']);
    });

    test('should return empty array when no forks are created', () => {
        previousBoard = new GambitChess(); // Start position
        currentBoard = new GambitChess('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'); // After 1. e4
        lastMove = {
            color: 'w', from: 'e2', to: 'e4', piece: 'p', flags: 'b', san: 'e4', lan: 'e2e4',
            before: previousBoard.fen(), after: currentBoard.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false, isKingsideCastle: () => false, isQueensideCastle: () => false,
            isBigPawn: () => true,
        };

        const forks = detectForks(currentBoard, previousBoard, lastMove);
        expect(forks).toHaveLength(0);
    });
}); 