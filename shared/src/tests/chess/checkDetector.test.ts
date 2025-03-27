/**
 * Tests for Check Detection functionality
 */

import { 
    BoardSnapshot,
    isKingInCheck, 
    getKingAttackers, 
    getCheckBlockingPositions,
    wouldMoveResultInSelfCheck,
    wouldMoveResolveCheck
} from '../../chess';
import { ChessPiece, PieceColor } from '../../types';

describe('Check Detection', () => {
    describe('isKingInCheck', () => {
        it('should detect check from a rook', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('r', 'black', 'e8');
            
            // King should be in check with nothing in between
            expect(isKingInCheck(board, 'white')).toBe(true);
            
            // Add blocking piece
            board.addPiece('p', 'white', 'e4');
            
            // King should no longer be in check
            expect(isKingInCheck(board, 'white')).toBe(false);
        });
        
        it('should detect check from a bishop', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('b', 'black', 'h4');
            
            // King should be in check with nothing in between
            expect(isKingInCheck(board, 'white')).toBe(true);
            
            // Add blocking piece
            board.addPiece('n', 'white', 'f2');
            
            // King should no longer be in check
            expect(isKingInCheck(board, 'white')).toBe(false);
        });
        
        it('should detect check from a knight', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('n', 'black', 'f3');
            
            // King should be in check (knight cannot be blocked)
            expect(isKingInCheck(board, 'white')).toBe(true);
            
            // Add piece that doesn't block knight
            board.addPiece('p', 'white', 'e2');
            
            // King should still be in check
            expect(isKingInCheck(board, 'white')).toBe(true);
            
            // Remove knight
            board.removePiece('f3');
            
            // King should no longer be in check
            expect(isKingInCheck(board, 'white')).toBe(false);
        });
        
        it('should detect check from a pawn', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('p', 'black', 'd2');
            
            // King should be in check from pawn diagonal attack
            expect(isKingInCheck(board, 'white')).toBe(true);
            
            // Move pawn to non-checking position
            board.removePiece('d2');
            board.addPiece('p', 'black', 'e2');
            
            // Pawn doesn't attack backward
            expect(isKingInCheck(board, 'white')).toBe(false);
        });
    });
    
    describe('getKingAttackers', () => {
        it('should identify all pieces attacking the king', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('r', 'black', 'e8');
            board.addPiece('b', 'black', 'h4');
            board.addPiece('q', 'black', 'a5');
            
            // Three pieces attacking (rook, bishop, and queen is also attacking diagonally)
            const attackers = getKingAttackers(board, 'white');
            expect(attackers.length).toBe(3);
            
            // Verify attacker types
            const attackerTypes = attackers.map(piece => piece.type);
            expect(attackerTypes).toContain('r');
            expect(attackerTypes).toContain('b');
            expect(attackerTypes).toContain('q');
            
            // Add blocking piece for rook
            board.addPiece('p', 'white', 'e4');
            
            // Now only bishop and queen are attacking
            const newAttackers = getKingAttackers(board, 'white');
            expect(newAttackers.length).toBe(2);
            expect(newAttackers.map(p => p.type).sort()).toEqual(['b', 'q']);
        });
    });
    
    describe('getCheckBlockingPositions', () => {
        it('should identify positions that can block check from sliding pieces', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('r', 'black', 'e8');
            
            // Positions between king and rook can block
            const blockingPositions = getCheckBlockingPositions(board, 'white');
            expect(blockingPositions.length).toBe(6);
            expect(blockingPositions).toContain('e2');
            expect(blockingPositions).toContain('e3');
            expect(blockingPositions).toContain('e4');
            expect(blockingPositions).toContain('e5');
            expect(blockingPositions).toContain('e6');
            expect(blockingPositions).toContain('e7');
            
            // Cannot block checks from knights
            board.removePiece('e8');
            board.addPiece('n', 'black', 'f3');
            
            const knightBlockingPositions = getCheckBlockingPositions(board, 'white');
            expect(knightBlockingPositions.length).toBe(0);
        });
        
        it('should return empty array when king is not in check', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            
            // No check, no blocking positions
            const blockingPositions = getCheckBlockingPositions(board, 'white');
            expect(blockingPositions.length).toBe(0);
        });
        
        it('should return empty array when king is in double check', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('r', 'black', 'e8');
            board.addPiece('b', 'black', 'h4');
            
            // Double check cannot be blocked
            const blockingPositions = getCheckBlockingPositions(board, 'white');
            expect(blockingPositions.length).toBe(0);
        });
    });
    
    describe('wouldMoveResultInSelfCheck', () => {
        it('should detect moves that would result in self check', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('r', 'white', 'd1');
            board.addPiece('r', 'black', 'e8');
            
            // Moving the rook would expose the king to check
            expect(wouldMoveResultInSelfCheck(board, 'd1', 'd8')).toBe(true);
            
            // Moving the king out of the file would avoid check
            expect(wouldMoveResultInSelfCheck(board, 'e1', 'd2')).toBe(false);
        });
    });
    
    describe('wouldMoveResolveCheck', () => {
        it('should identify moves that would resolve check', () => {
            const board = new BoardSnapshot(false);
            
            // Set up pieces
            board.addPiece('k', 'white', 'e1');
            board.addPiece('r', 'black', 'e8');
            board.addPiece('n', 'white', 'c2');
            
            // Moving the king out of the file would resolve check
            expect(wouldMoveResolveCheck(board, 'white', 'e1', 'd1')).toBe(true);
            
            // Moving the knight to e3 blocks the check
            expect(board.isValidMove('c2', 'e3')).toBe(true);
            expect(wouldMoveResolveCheck(board, 'white', 'c2', 'e3')).toBe(true);
            
            // Moving the knight to e2 blocks the check if it's a valid move
            expect(board.isValidMove('c2', 'e2')).toBe(false); // Knight can't move like this
            // Since it's an invalid move, it can't resolve check
            expect(wouldMoveResolveCheck(board, 'white', 'c2', 'e2')).toBe(false);
        });
    });
}); 