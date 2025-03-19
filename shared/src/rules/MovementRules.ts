import { PieceType, PlayerColor, Position } from '../types';
import { isValidPosition } from '../utils';

/**
 * Basic movement rules that can be shared between client and server.
 * These don't include any security-sensitive features like check detection 
 * or full game state validation.
 */
export class MovementRules {
  /**
   * Check if a move follows the basic movement pattern for a piece
   * @param pieceType The type of piece
   * @param pieceColor The color of the piece
   * @param from Starting position
   * @param to Destination position
   * @param hasMoved Whether the piece has moved before
   * @returns True if the move follows the piece's movement pattern
   */
  static isValidBasicMove(
    pieceType: PieceType,
    pieceColor: PlayerColor,
    from: Position,
    to: Position,
    hasMoved: boolean
  ): boolean {
    // Validate board boundaries
    if (!isValidPosition(from) || !isValidPosition(to)) {
      return false;
    }

    // Can't move to the same position
    if (from.x === to.x && from.y === to.y) {
      return false;
    }

    switch (pieceType) {
      case PieceType.PAWN:
        return this.isValidPawnMove(pieceColor, from, to, hasMoved);
      case PieceType.KNIGHT:
        return this.isValidKnightMove(from, to);
      case PieceType.BISHOP:
        return this.isValidBishopMove(from, to);
      case PieceType.ROOK:
        return this.isValidRookMove(from, to);
      case PieceType.QUEEN:
        return this.isValidQueenMove(from, to);
      case PieceType.KING:
        return this.isValidKingMove(from, to, hasMoved);
      default:
        return false;
    }
  }

  /**
   * Check if a pawn move follows the basic movement pattern
   * (Note: This does not check for collisions or captures, only the movement pattern)
   */
  private static isValidPawnMove(
    pieceColor: PlayerColor,
    from: Position,
    to: Position,
    hasMoved: boolean
  ): boolean {
    const direction = pieceColor === PlayerColor.WHITE ? 1 : -1;
    const startingRow = pieceColor === PlayerColor.WHITE ? 1 : 6;
    
    // Forward movement
    if (from.x === to.x) {
      // Single square forward
      if (to.y === from.y + direction) {
        return true;
      }
      
      // Double square forward from starting position
      if (!hasMoved && from.y === startingRow && to.y === from.y + 2 * direction) {
        return true;
      }
    }
    
    // Diagonal movement (potential capture)
    if ((to.x === from.x - 1 || to.x === from.x + 1) && to.y === from.y + direction) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if a knight move follows the basic movement pattern
   */
  private static isValidKnightMove(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // Knight moves in an L-shape: 2 squares in one direction and 1 in the other
    return (dx === 2 && dy === 1) || (dx === 1 && dy === 2);
  }

  /**
   * Check if a bishop move follows the basic movement pattern
   */
  private static isValidBishopMove(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // Bishop moves diagonally
    return dx === dy;
  }

  /**
   * Check if a rook move follows the basic movement pattern
   */
  private static isValidRookMove(from: Position, to: Position): boolean {
    // Rook moves horizontally or vertically
    return from.x === to.x || from.y === to.y;
  }

  /**
   * Check if a queen move follows the basic movement pattern
   */
  private static isValidQueenMove(from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // Queen moves like a rook (horizontally/vertically)
    if (from.x === to.x || from.y === to.y) {
      return true;
    }
    
    // Queen moves like a bishop (diagonally)
    return dx === dy;
  }

  /**
   * Check if a king move follows the basic movement pattern
   */
  private static isValidKingMove(from: Position, to: Position, hasMoved: boolean): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    
    // Regular king move (one square in any direction)
    if (dx <= 1 && dy <= 1) {
      return true;
    }
    
    // Castling (basic pattern only, doesn't check for clear path or check)
    if (!hasMoved && dy === 0 && dx === 2) {
      return true;
    }
    
    return false;
  }

  /**
   * Get the positions between two points (not including the endpoints)
   * Used to check if a path is clear
   * @param from Starting position
   * @param to Ending position
   * @returns Array of positions between from and to
   */
  static getPositionsBetween(from: Position, to: Position): Position[] {
    const positions: Position[] = [];
    
    // Horizontal movement
    if (from.y === to.y) {
      const step = Math.sign(to.x - from.x);
      for (let x = from.x + step; x !== to.x; x += step) {
        positions.push({ x, y: from.y });
      }
    }
    // Vertical movement
    else if (from.x === to.x) {
      const step = Math.sign(to.y - from.y);
      for (let y = from.y + step; y !== to.y; y += step) {
        positions.push({ x: from.x, y });
      }
    }
    // Diagonal movement
    else if (Math.abs(to.x - from.x) === Math.abs(to.y - from.y)) {
      const stepX = Math.sign(to.x - from.x);
      const stepY = Math.sign(to.y - from.y);
      let x = from.x + stepX;
      let y = from.y + stepY;
      
      while (x !== to.x && y !== to.y) {
        positions.push({ x, y });
        x += stepX;
        y += stepY;
      }
    }
    
    return positions;
  }
} 