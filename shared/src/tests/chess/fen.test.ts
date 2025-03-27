/**
 * Tests for FEN utilities
 */

import {
  INITIAL_FEN,
  parseFen,
  fenComponentsToString,
  fenCharToPiece,
  pieceToFenChar,
  fenToPieces,
  piecesToFen,
  parseFenToGameState,
  gameStateToFen
} from '../../chess/fen';
import { ChessPiece, PieceColor, PieceType } from '../../types';

describe('FEN Utilities', () => {
  describe('parseFen', () => {
    it('should parse a valid FEN string', () => {
      const components = parseFen(INITIAL_FEN);
      expect(components).toEqual({
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmoveClock: '0',
        fullmoveNumber: '1'
      });
    });

    it('should throw an error for invalid FEN formats', () => {
      // Wrong number of parts
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -')).toThrow();
      
      // Invalid piece placement (wrong number of ranks)
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1')).toThrow();
      
      // Invalid active color
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1')).toThrow();
      
      // Invalid castling availability format
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w ZKQkq - 0 1')).toThrow();
      
      // Invalid en passant target
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq z9 0 1')).toThrow();
      
      // Invalid halfmove clock
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1')).toThrow();
      
      // Invalid fullmove number
      expect(() => parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 x')).toThrow();
    });
  });

  describe('fenComponentsToString', () => {
    it('should convert FEN components to a FEN string', () => {
      const components = {
        piecePlacement: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        activeColor: 'w',
        castling: 'KQkq',
        enPassant: '-',
        halfmoveClock: '0',
        fullmoveNumber: '1'
      };
      expect(fenComponentsToString(components)).toBe(INITIAL_FEN);
    });
  });

  describe('fenCharToPiece', () => {
    it('should convert FEN piece characters to piece type and color', () => {
      expect(fenCharToPiece('P')).toEqual({ type: 'p', color: 'white' });
      expect(fenCharToPiece('n')).toEqual({ type: 'n', color: 'black' });
      expect(fenCharToPiece('B')).toEqual({ type: 'b', color: 'white' });
      expect(fenCharToPiece('r')).toEqual({ type: 'r', color: 'black' });
      expect(fenCharToPiece('Q')).toEqual({ type: 'q', color: 'white' });
      expect(fenCharToPiece('k')).toEqual({ type: 'k', color: 'black' });
    });

    it('should throw an error for invalid FEN piece characters', () => {
      expect(() => fenCharToPiece('X')).toThrow();
      expect(() => fenCharToPiece('1')).toThrow();
      expect(() => fenCharToPiece('')).toThrow();
    });
  });

  describe('pieceToFenChar', () => {
    it('should convert piece type and color to FEN piece character', () => {
      expect(pieceToFenChar('p', 'white')).toBe('P');
      expect(pieceToFenChar('n', 'black')).toBe('n');
      expect(pieceToFenChar('b', 'white')).toBe('B');
      expect(pieceToFenChar('r', 'black')).toBe('r');
      expect(pieceToFenChar('q', 'white')).toBe('Q');
      expect(pieceToFenChar('k', 'black')).toBe('k');
    });
  });

  describe('fenToPieces and piecesToFen', () => {
    it('should convert between FEN piece placement and chess pieces array', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
      const pieces = fenToPieces(fen);
      
      // Check total count
      expect(pieces.length).toBe(32);
      
      // Check a few specific pieces
      expect(pieces).toContainEqual({ type: 'r', color: 'black', position: 'a8', hasMoved: false });
      expect(pieces).toContainEqual({ type: 'n', color: 'black', position: 'b8', hasMoved: false });
      expect(pieces).toContainEqual({ type: 'p', color: 'black', position: 'a7', hasMoved: false });
      expect(pieces).toContainEqual({ type: 'p', color: 'white', position: 'a2', hasMoved: false });
      expect(pieces).toContainEqual({ type: 'r', color: 'white', position: 'a1', hasMoved: false });
      
      // Convert back to FEN
      const convertedFen = piecesToFen(pieces);
      expect(convertedFen).toBe(fen);
    });

    it('should handle a complex board position', () => {
      const piecePlacement = 'r1bqk2r/ppp2ppp/2n2n2/2bpp3/4P3/2PP1N2/PP3PPP/RNBQKB1R';
      const pieces = fenToPieces(piecePlacement);
      const convertedFen = piecesToFen(pieces);
      expect(convertedFen).toBe(piecePlacement);
    });

    it('should throw an error for invalid piece placement strings', () => {
      // Invalid rank count
      expect(() => fenToPieces('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP')).toThrow();
      
      // Invalid file count in a rank
      expect(() => fenToPieces('rnbqkbnr/ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')).toThrow();
      
      // Invalid piece character
      expect(() => fenToPieces('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQXBNR')).toThrow();
    });
  });

  describe('parseFenToGameState and gameStateToFen', () => {
    it('should convert between FEN string and game state', () => {
      const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
      const gameState = parseFenToGameState(fen);
      
      // Check basic properties
      expect(gameState.activeColor).toBe('black');
      expect(gameState.castling.whiteKingside).toBe(true);
      expect(gameState.castling.whiteQueenside).toBe(true);
      expect(gameState.castling.blackKingside).toBe(true);
      expect(gameState.castling.blackQueenside).toBe(true);
      expect(gameState.enPassantTarget).toBe('e3');
      expect(gameState.halfmoveClock).toBe(0);
      expect(gameState.fullmoveNumber).toBe(1);
      
      // Check that e2 pawn has moved to e4
      const piecesOnE2 = gameState.pieces.filter(p => p.position === 'e2');
      const piecesOnE4 = gameState.pieces.filter(p => p.position === 'e4');
      expect(piecesOnE2.length).toBe(0);
      expect(piecesOnE4.length).toBe(1);
      expect(piecesOnE4[0]).toEqual({ type: 'p', color: 'white', position: 'e4', hasMoved: true });
      
      // Convert back to FEN and check if it matches
      const convertedFen = gameStateToFen(gameState);
      expect(convertedFen).toBe(fen);
    });

    it('should handle positions with different castling rights', () => {
      const fen = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4';
      const gameState = parseFenToGameState(fen);
      
      expect(gameState.activeColor).toBe('white');
      expect(gameState.castling).toEqual({
        whiteKingside: true,
        whiteQueenside: true,
        blackKingside: true,
        blackQueenside: true
      });
      
      const convertedFen = gameStateToFen(gameState);
      expect(convertedFen).toBe(fen);
      
      // Test with no castling rights
      const fenNocastling = 'rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w - - 4 4';
      const gameStateNocastling = parseFenToGameState(fenNocastling);
      
      expect(gameStateNocastling.castling).toEqual({
        whiteKingside: false,
        whiteQueenside: false,
        blackKingside: false,
        blackQueenside: false
      });
      
      const convertedFenNocastling = gameStateToFen(gameStateNocastling);
      expect(convertedFenNocastling).toBe(fenNocastling);
    });
  });
}); 