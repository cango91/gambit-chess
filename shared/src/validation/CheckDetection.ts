import { Board, BoardSnapshot, PieceType, PlayerColor, Position } from '../types';
import { MovementRules } from '../rules';
import { getOpponentColor } from '../utils';

/**
 * Functions to detect check situations
 */
export class CheckDetection {
  /**
   * Check if a player is in check
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in check
   */
  static isInCheck(board: Board, playerColor: PlayerColor): boolean {
    try {
      // Get the position of the king
      const kingPosition = board.getKingPosition(playerColor);
      return this.isPositionUnderAttack(board, kingPosition, playerColor);
    } catch (error) {
      // If king is not found, assume no check (for testing purposes)
      return false;
    }
  }

  /**
   * Check if a player is in checkmate
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in checkmate
   */
  static isCheckmate(board: Board, playerColor: PlayerColor): boolean {
    // First check if the player is in check
    if (!this.isInCheck(board, playerColor)) {
      return false;
    }
    
    // Check if any piece can make a move that gets out of check
    return !this.hasLegalMoves(board, playerColor);
  }
  
  /**
   * Check if a player is in stalemate
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in stalemate
   */
  static isStalemate(board: Board, playerColor: PlayerColor): boolean {
    // First check that the player is NOT in check
    if (this.isInCheck(board, playerColor)) {
      return false;
    }
    
    // Then check if the player has no legal moves
    return !this.hasLegalMoves(board, playerColor);
  }
  
  /**
   * Check if a player has any legal moves
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player has at least one legal move
   */
  private static hasLegalMoves(board: Board, playerColor: PlayerColor): boolean {
    const pieces = board.getPieces().filter(piece => piece.color === playerColor);
    
    // For each piece, try all possible moves
    for (const piece of pieces) {
      // Try every square on the board as a potential destination
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
          const to = { x, y };
          
          // Skip the current position
          if (piece.position.x === x && piece.position.y === y) {
            continue;
          }
          
          // Skip positions with friendly pieces
          const pieceAtDest = board.getPieceAt(to);
          if (pieceAtDest && pieceAtDest.color === playerColor) {
            continue;
          }
          
          // Check if basic move is valid
          if (!MovementRules.isValidBasicMove(
            piece.type,
            piece.color,
            piece.position,
            to,
            piece.hasMoved,
            !!pieceAtDest
          )) {
            continue;
          }
          
          // For long-range pieces, check if path is clear
          if (piece.isLongRangePiece() && !board.isPathClear(piece.position, to)) {
            continue;
          }
          
          // Check if move would leave player in check
          if (!this.wouldMoveResultInCheck(board, piece.position, to, playerColor)) {
            return true; // Found at least one legal move
          }
        }
      }
    }
    
    return false; // No legal moves found
  }

  /**
   * Check if a position is under attack by any opponent piece
   * @param board The current board state
   * @param position The position to check
   * @param defendingColor The color of the defending player
   * @returns True if the position is under attack
   */
  static isPositionUnderAttack(board: Board, position: Position, defendingColor: PlayerColor): boolean {
    const attackingColor = getOpponentColor(defendingColor);
    const pieces = board.getPieces();
    
    // Check if any opponent piece can attack the position
    for (const piece of pieces) {
      if (piece.color !== attackingColor) continue;
      
      // Special case for pawns since their attack pattern is different from movement
      if (piece.type === PieceType.PAWN) {
        if (this.canPawnAttack(piece.position, position, attackingColor)) {
          return true;
        }
      } 
      // For all other pieces, use the movement rules
      else if (MovementRules.isValidBasicMove(
        piece.type,
        piece.color,
        piece.position,
        position,
        piece.hasMoved,
        true // We assume there's a piece to capture at the target position
      )) {
        // Also check if the path is clear for sliding pieces
        if (piece.type === PieceType.BISHOP || 
            piece.type === PieceType.ROOK || 
            piece.type === PieceType.QUEEN) {
          if (board.isPathClear(piece.position, position)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a move would result in the moving player being in check
   * @param board The current board state
   * @param from Starting position
   * @param to Destination position
   * @param playerColor The color of the moving player
   * @returns True if the move would result in check
   */
  static wouldMoveResultInCheck(board: Board, from: Position, to: Position, playerColor: PlayerColor): boolean {
    try {
      // Create a snapshot with the move applied
      const afterMoveBoard = board.snapshot().withMove(from, to);
      
      // Check if the player would be in check after the move
      const kingPosition = this.findKingPosition(afterMoveBoard, playerColor);
      return this.isPositionUnderAttackInSnapshot(afterMoveBoard, kingPosition, playerColor);
    } catch (error) {
      // If king is not found, assume no check (for testing purposes)
      return false;
    }
  }

  /**
   * Helper function to determine if a pawn can attack a specific position
   * @param pawnPosition Position of the pawn
   * @param targetPosition Position to check
   * @param pawnColor Color of the pawn
   * @returns True if the pawn can attack the target position
   */
  private static canPawnAttack(pawnPosition: Position, targetPosition: Position, pawnColor: PlayerColor): boolean {
    const dx = targetPosition.x - pawnPosition.x;
    const dy = targetPosition.y - pawnPosition.y;
    
    // Pawns can only attack diagonally forward
    if (Math.abs(dx) !== 1) {
      return false;
    }
    
    // White pawns move up (increasing y)
    if (pawnColor === PlayerColor.WHITE) {
      return dy === 1;
    } 
    // Black pawns move down (decreasing y)
    else {
      return dy === -1;
    }
  }

  /**
   * Find the position of a king in a board snapshot
   * @param boardSnapshot The board snapshot
   * @param kingColor The color of the king to find
   * @returns Position of the king
   * @throws Error if king is not found
   */
  private static findKingPosition(boardSnapshot: BoardSnapshot, kingColor: PlayerColor): Position {
    const pieces = boardSnapshot.getPieces();
    const king = pieces.find(
      piece => piece.type === PieceType.KING && piece.color === kingColor
    );
    
    if (!king) {
      throw new Error(`No ${kingColor} king found on the board`);
    }
    
    return king.position;
  }

  /**
   * Check if a position is under attack in a board snapshot
   * @param boardSnapshot The board snapshot
   * @param position The position to check
   * @param defendingColor The color of the defending player
   * @returns True if the position is under attack
   */
  private static isPositionUnderAttackInSnapshot(
    boardSnapshot: BoardSnapshot, 
    position: Position, 
    defendingColor: PlayerColor
  ): boolean {
    const attackingColor = getOpponentColor(defendingColor);
    const pieces = boardSnapshot.getPieces();
    
    // Check if any opponent piece can attack the position
    for (const piece of pieces) {
      if (piece.color !== attackingColor) continue;
      
      // Special case for pawns
      if (piece.type === PieceType.PAWN) {
        if (this.canPawnAttack(piece.position, position, attackingColor)) {
          return true;
        }
      } 
      // For other pieces, use movement rules
      else if (MovementRules.isValidBasicMove(
        piece.type,
        piece.color,
        piece.position,
        position,
        piece.hasMoved,
        true
      )) {
        // For long-range pieces, check if path is clear
        if (piece.isLongRangePiece()) {
          // Simple path clearance check for snapshot
          if (this.isPathClearInSnapshot(boardSnapshot, piece.position, position)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a path is clear in a board snapshot
   * @param boardSnapshot The board snapshot
   * @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear
   */
  private static isPathClearInSnapshot(
    boardSnapshot: BoardSnapshot, 
    from: Position, 
    to: Position
  ): boolean {
    // Check if the movement is along a straight line or diagonal
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Not a straight or diagonal line
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
      return false;
    }
    
    // Determine step direction
    const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    
    // Check all squares along the path except the starting and ending positions
    let x = from.x + stepX;
    let y = from.y + stepY;
    
    while (x !== to.x || y !== to.y) {
      if (boardSnapshot.isOccupied({ x, y })) {
        return false;
      }
      x += stepX;
      y += stepY;
    }
    
    return true;
  }
} 