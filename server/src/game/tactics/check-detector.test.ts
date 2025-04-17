import { GambitChess, GambitMove, CheckDTO, SpecialAttackType } from "@gambit-chess/shared";
import { detectChecks } from "./check-detector";
import { Color, PieceSymbol, Square, Move } from "chess.js";

describe("detectChecks", () => {
    let board: GambitChess;
    let previousBoard: GambitChess;

    beforeEach(() => {
        // Use GambitChess for consistency
        board = new GambitChess();
        previousBoard = new GambitChess();
    });

    test("should return empty array when no check occurs", () => {
        previousBoard.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        board.load("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"); // State after e4
        const move: GambitMove = {
            from: 'e2', to: 'e4', piece: 'p', color: 'w', flags: '', san: 'e4', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false,
            isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => true,
            captureAttempt: false
        };
        const checks = detectChecks(board, previousBoard, move);
        expect(checks).toEqual([]);
    });

    test("should detect a simple check (Fool's Mate Check)", () => {
        // Set up Fool's Mate scenario where Qh4+ is check
        previousBoard.load("rnbqkbnr/ppppp1pp/8/5p2/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"); // State before white plays g4 (allowing Qh4+)
        board.load('rnbqkbnr/ppppp1pp/8/5p1Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 2'); // State after Qh4+

        const move: GambitMove = {
            from: 'd1', to: 'h5', piece: 'q', color: 'w', flags: '', san: 'Qh5+', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false,
            isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
            captureAttempt: false
        };
        const checks = detectChecks(board, previousBoard, move);
        expect(board.isCheck()).toBe(true);
        expect(checks).toHaveLength(1);
        expect(checks[0]).toEqual<CheckDTO>({
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'q', square: 'h5' },
            isDoubleCheck: false,
        });
    });

     test("should detect a check by discovery", () => {
        // White moves Bishop e4->d3, discovering check from Queen e2
        previousBoard.load("rnbqkbnr/ppp2ppp/8/8/4B3/8/PPP1QPPP/RNB1K1NR w KQkq - 0 3");
        board.load("rnbqkbnr/ppp2ppp/8/8/8/3B4/PPP1QPPP/RNB1K1NR b KQkq - 0 3"); // State after Bd3+
        const move: GambitMove = {
            from: 'e4', to: 'd3', piece: 'b', color: 'w', flags: '', san: 'Bd3+', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false,
            isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
            captureAttempt: false
        };

        const checks = detectChecks(board, previousBoard, move);

        expect(board.isCheck()).toBe(true);
        expect(checks).toHaveLength(1);
        expect(checks[0]).toEqual<CheckDTO>({
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'q', square: 'e2' }, // Queen is the checking piece
            isDoubleCheck: false,
        });
    });

     test("should detect a double check", () => {
        // White moves Bishop e4->c6, discovering check from Queen e2 + bishop on c6
        previousBoard.load("rnbqkbnr/ppp2ppp/8/8/4B3/8/PPP1QPPP/RNB1K1NR w KQkq - 0 3");
        board.load("rnbqkbnr/ppp2ppp/2B5/8/8/8/PPP1QPPP/RNB1K1NR b KQkq - 0 3"); // State after Bc6#
        const move: GambitMove = {
            from: 'e4', to: 'c6', piece: 'b', color: 'w', flags: '', san: 'Bc6#', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false,
            isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
            captureAttempt: false
        };

        const checks = detectChecks(board, previousBoard, move);

        expect(board.isCheck()).toBe(true);
        expect(checks).toHaveLength(1);
        expect(checks[0].isDoubleCheck).toBe(true);
        const checkingPieces = [
            { type: 'q', square: 'e2' },
            { type: 'b', square: 'c6' },
        ];
        expect(checkingPieces).toContainEqual(checks[0].checkingPiece);
        expect(checkingPieces).toContainEqual(checks[0].secondCheckingPiece);
    });


    test("should detect check after castling (Queenside)", () => {
        // White castles queenside O-O-O, Rook moves to d1, checking black King on d8
        previousBoard.load("rnbk1bnr/ppp1pppp/8/8/8/8/PPN1PPPP/R3KBNR w KQ - 0 1");
        board.load("rnbk1bnr/ppp1pppp/8/8/8/8/PPN1PPPP/2KR1BNR b - - 0 1"); // State after O-O-O

        const move: GambitMove = {
            from: 'e1', to: 'c1', piece: 'k', color: 'w', flags: '', san: 'O-O-O', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => false, isPromotion: () => false, isEnPassant: () => false,
            isKingsideCastle: () => false, isQueensideCastle: () => true, isBigPawn: () => false,
            captureAttempt: false
        }
        const checks = detectChecks(board, previousBoard, move);

        expect(board.isCheck()).toBe(true);
        expect(checks).toHaveLength(1);
        expect(checks[0]).toEqual<CheckDTO>({
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'r', square: 'd1' },
            isDoubleCheck: false,
        });
    });

    test("should detect check after en passant capture", () => {
        // White pawn d5 captures black c5 pawn en passant on c6, revealing check from Queen on d1.
        previousBoard.load("rnbk1bnr/pp2pppp/8/2pP4/8/8/PPP1PPPP/RNBQKBNR w KQ c6 0 3")
        board.load("rnbk1bnr/pp2pppp/2P5/8/8/8/PPP1PPPP/RNBQKBNR b KQ - 0 3"); // State after dxc6 e.p.

        const move: GambitMove = {
            from: 'd5', to: 'c6', piece: 'p', color: 'w', flags: '', san: 'e.p.', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => true, isPromotion: () => false, isEnPassant: () => true,
            isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
            captureAttempt: true
        }


        const checks = detectChecks(board, previousBoard, move);

        expect(board.isCheck()).toBe(true);
        expect(checks).toHaveLength(1);
        expect(checks[0]).toEqual<CheckDTO>({
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'q', square: 'd1' }, // Queen checks after pawn moves
            isDoubleCheck: false,
        });
    });

    test("should detect check after pawn promotion", () => {
        // White pawn on g7 promotes to Queen on g8, checking Black King on e8.
        previousBoard.load("4k3/6P1/8/8/8/8/8/4K3 w - - 0 1");
        board.load("4k1Q1/8/8/8/8/8/8/4K3 b - - 0 1"); // State after g8=Q+
        const move: GambitMove = {
            from: 'g7', to: 'g8', piece: 'p', color: 'w', flags: '', san: 'g8=Q+', lan: '', before: previousBoard.fen(), after: board.fen(),
            isCapture: () => false, isPromotion: () => true, isEnPassant: () => false,
            isKingsideCastle: () => false, isQueensideCastle: () => false, isBigPawn: () => false,
            captureAttempt: false
        }

        const checks = detectChecks(board, previousBoard, move);

        expect(board.isCheck()).toBe(true);
        expect(checks).toHaveLength(1);
        expect(checks[0]).toEqual<CheckDTO>({
            type: SpecialAttackType.CHECK,
            checkingPiece: { type: 'q', square: 'g8' },
            isDoubleCheck: false,
        });
    });

}); 