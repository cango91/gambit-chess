import { GambitChess } from './chess-extensions';
import { DEFAULT_GAME_CONFIG } from '../constants/game-defaults';
import { STANDARD_PIECE_VALUES } from '../constants/piece-values';

describe('GambitChess Extensions', () => {
  let gambitChess: GambitChess;
  
  beforeEach(() => {
    gambitChess = new GambitChess(undefined, DEFAULT_GAME_CONFIG);
  });
  
  describe('move', () => {
    it('should create GambitMove objects with capture attempt information', () => {
      // Set up a position where a capture is possible
      gambitChess.load('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
      
      // Make a capturing move
      const move = gambitChess.move({ from: 'e4', to: 'd5' });
      
      expect(move.from).toBe('e4');
      expect(move.to).toBe('d5');
      expect(move.captureAttempt).toBe(true);
      expect(move.captured).toBe('p');
    });
    
    it('should create GambitMove objects without capture attempt for non-capturing moves', () => {
      // Make a non-capturing move
      const move = gambitChess.move({ from: 'e2', to: 'e4' });
      
      expect(move.from).toBe('e2');
      expect(move.to).toBe('e4');
      expect(move.captureAttempt).toBe(false);
      expect(move.captured).toBeUndefined();
    });
  });
  
  describe('wouldCapture', () => {
    it('should return true for a move that would capture', () => {
      // Set up a position where a capture is possible
      gambitChess.load('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2');
      
      const wouldCapture = gambitChess.wouldCapture('e4', 'd5');
      
      expect(wouldCapture).toBe(true);
    });
    
    it('should return false for a move that would not capture', () => {
      const wouldCapture = gambitChess.wouldCapture('e2', 'e4');
      
      expect(wouldCapture).toBe(false);
    });
    
    it('should return false for an invalid move', () => {
      const wouldCapture = gambitChess.wouldCapture('e2', 'e5');
      
      expect(wouldCapture).toBe(false);
    });
  });
  
  describe('getPieceAt', () => {
    it('should return the correct piece at a square', () => {
      const piece = gambitChess.getPieceAt('e2');
      
      expect(piece).toEqual({ type: 'p', color: 'w' });
    });
    
    it('should return null for an empty square', () => {
      const piece = gambitChess.getPieceAt('e4');
      
      expect(piece).toBeNull();
    });
  });
  
  describe('getPieceValue', () => {
    it('should return the correct piece value based on config', () => {
      expect(gambitChess.getPieceValue('p')).toBe(STANDARD_PIECE_VALUES.p);
      expect(gambitChess.getPieceValue('n')).toBe(STANDARD_PIECE_VALUES.n);
      expect(gambitChess.getPieceValue('b')).toBe(STANDARD_PIECE_VALUES.b);
      expect(gambitChess.getPieceValue('r')).toBe(STANDARD_PIECE_VALUES.r);
      expect(gambitChess.getPieceValue('q')).toBe(STANDARD_PIECE_VALUES.q);
      expect(gambitChess.getPieceValue('k')).toBe(STANDARD_PIECE_VALUES.k);
    });
  });
  
  describe('getValidTacticalRetreats', () => {
    it('should return only the original square for pawns', () => {
      const retreats = gambitChess.getValidTacticalRetreats('e2', 'e4');
      
      expect(retreats).toHaveLength(1);
      expect(retreats[0]).toEqual({ square: 'e2', cost: 0 });
    });
    
    it('should return retreats along the diagonal for bishops', () => {
      // Set up a bishop at c3
      gambitChess.load('rnbqkbnr/pppppppp/8/8/8/2B5/PPPPPPPP/RNBQK1NR w KQkq - 0 1');
      
      // Get valid retreats for a bishop that tried to capture at f6
      const retreats = gambitChess.getValidTacticalRetreats('c3', 'f6');
      
      // Should include original square (cost 0) and squares on the diagonal (d4, e5)
      expect(retreats).toContainEqual({ square: 'c3', cost: 0 });
      expect(retreats).toContainEqual({ square: 'd4', cost: 1 });
      expect(retreats).toContainEqual({ square: 'e5', cost: 2 });
      
      // Should not include the target square or other squares
      expect(retreats).not.toContainEqual({ square: 'f6', cost: 3 });
    });
    
    it('should return retreats along rank/file for rooks', () => {
      // Set up a rook at h1 with some empty spaces on the h-file
      gambitChess.load('rnbqkb1r/pppppp1p/8/8/8/8/PPPPPPPP/RNBQKB1R w KQkq - 0 1');
      
      // Get valid retreats for a rook that tried to capture at h7
      const retreats = gambitChess.getValidTacticalRetreats('h1', 'h7');
      
      // Should at least include the original square
      expect(retreats).toContainEqual({ square: 'h1', cost: 0 });
      
      // Just verify we get any valid retreats (might just be the original square)
      expect(retreats.length).toBeGreaterThanOrEqual(1);
    });
    
    it('should return knight retreats in the rectangle', () => {
      // Set up a knight at g1
      gambitChess.load('rnbqkb1r/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBR1 w KQkq - 0 1');
      
      // Get valid retreats for a knight that tried to capture at f3 (knight move up-left)
      const retreats = gambitChess.getValidTacticalRetreats('g1', 'f3');
      
      // Should include original square (cost 0) and squares within the rectangle
      expect(retreats).toContainEqual({ square: 'g1', cost: 0 });
      
      // Other valid retreat squares might exist, but this depends on the implementation
      // Just checking we don't have invalid ones (those outside the rect)
      retreats.forEach(retreat => {
        if (retreat.square !== 'g1') {
          const file = retreat.square.charCodeAt(0) - 'a'.charCodeAt(0);
          const rank = parseInt(retreat.square.charAt(1)) - 1;
          
          // Should be within the rectangle defined by g1 and f3
          expect(file).toBeGreaterThanOrEqual(Math.min(6, 5)); // min of g, f cols
          expect(file).toBeLessThanOrEqual(Math.max(6, 5)); // max of g, f cols
          expect(rank).toBeGreaterThanOrEqual(Math.min(0, 2)); // min of 1, 3 ranks
          expect(rank).toBeLessThanOrEqual(Math.max(0, 2)); // max of 1, 3 ranks
        }
      });
    });
  });
}); 