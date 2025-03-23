import { 
  Board, 
  BoardSnapshot, 
  CheckDetection, 
  Piece, 
  PieceType, 
  PlayerColor, 
  Position 
} from '@gambit-chess/shared';

/**
 * Available chess tactics that can generate BP
 */
export type ChessTactic = 
  | 'CHECK'
  | 'FORK'
  | 'PIN'
  | 'SKEWER'
  | 'DISCOVERED_ATTACK'
  | 'DISCOVERED_CHECK';

/**
 * Class responsible for detecting chess tactics that generate BP bonuses
 */
export class TacticsDetection {
  /**
   * Detect tactics in the given board state
   * @param playerColor Color of the player who made the move
   * @param beforeBoard Board state before the move
   * @param afterBoard Board state after the move
   * @returns Array of detected tactics
   */
  public detectTactics(
    playerColor: PlayerColor,
    beforeBoard: BoardSnapshot,
    afterBoard: Board
  ): ChessTactic[] {
    const tactics: ChessTactic[] = [];
    const opponentColor = playerColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
    
    // Check if opponent is in check
    const isCheck = CheckDetection.isInCheck(afterBoard, opponentColor);
    if (isCheck) {
      tactics.push('CHECK');
    }
    
    // Detect fork - a piece attacking multiple enemy pieces simultaneously
    if (this.hasFork(afterBoard, playerColor)) {
      tactics.push('FORK');
    }
    
    // Detect pin - enemy piece cannot move without exposing a more valuable piece
    if (this.hasPin(afterBoard, playerColor, opponentColor)) {
      tactics.push('PIN');
    }
    
    // Detect skewer - forcing a piece to move, exposing a less valuable piece behind it
    if (this.hasSkewer(afterBoard, playerColor, opponentColor)) {
      tactics.push('SKEWER');
    }
    
    // Detect discovered attack - moving a piece to reveal an attack by another piece
    const hasDiscoveredAttack = this.hasDiscoveredAttack(
      beforeBoard,
      afterBoard,
      playerColor,
      opponentColor
    );
    
    if (hasDiscoveredAttack) {
      tactics.push('DISCOVERED_ATTACK');
      
      // Check if it's a discovered check (special case of discovered attack)
      if (isCheck && !this.wasDirect(beforeBoard, afterBoard, opponentColor)) {
        tactics.push('DISCOVERED_CHECK');
      }
    }
    
    return tactics;
  }
  
  /**
   * Check if there's a fork on the board
   * A fork is when a single piece attacks multiple enemy pieces simultaneously
   */
  private hasFork(board: Board, playerColor: PlayerColor): boolean {
    const pieces = board.getPieces();
    const playerPieces = pieces.filter(p => p.color === playerColor);
    const opponentPieces = pieces.filter(p => p.color !== playerColor);
    
    // Check each player piece to see if it attacks multiple opponent pieces
    for (const piece of playerPieces) {
      let attackedPieces = 0;
      
      for (const opponentPiece of opponentPieces) {
        // Skip opponent's king for fork detection (would be check)
        if (opponentPiece.type === PieceType.KING) continue;
        
        // Check if the player piece can attack this opponent piece
        if (this.canCapture(board, piece.position, opponentPiece.position)) {
          attackedPieces++;
        }
        
        // If this piece attacks at least 2 opponent pieces, it's a fork
        if (attackedPieces >= 2) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if there's a pin on the board
   * A pin is when a piece cannot move because it would expose a more valuable piece behind it
   */
  private hasPin(board: Board, playerColor: PlayerColor, opponentColor: PlayerColor): boolean {
    const pieces = board.getPieces();
    const playerPieces = pieces.filter(p => p.color === playerColor);
    const opponentPieces = pieces.filter(p => p.color === opponentColor);
    const opponentKing = opponentPieces.find(p => p.type === PieceType.KING);
    
    if (!opponentKing) return false;
    
    // Only long-range pieces can pin
    const longRangePieces = playerPieces.filter(p => [
      PieceType.BISHOP,
      PieceType.ROOK,
      PieceType.QUEEN
    ].includes(p.type));
    
    // Check each long-range piece
    for (const pinningPiece of longRangePieces) {
      // Get direction from pinning piece to king
      const dx = Math.sign(opponentKing.position.x - pinningPiece.position.x);
      const dy = Math.sign(opponentKing.position.y - pinningPiece.position.y);
      
      // Check if the pinning piece can attack in this direction
      if (!this.canMoveInDirection(pinningPiece.type, dx, dy)) {
        continue;
      }
      
      // Check pieces between pinning piece and king
      let x = pinningPiece.position.x + dx;
      let y = pinningPiece.position.y + dy;
      let piecesBetween = 0;
      let pinnedPiece: Piece | null = null;
      
      while (x !== opponentKing.position.x || y !== opponentKing.position.y) {
        if (x < 0 || x > 7 || y < 0 || y > 7) break;
        
        const piece = board.getPieceAt({ x, y });
        if (piece) {
          piecesBetween++;
          pinnedPiece = piece;
          
          // If more than one piece is between, there's no pin
          if (piecesBetween > 1) break;
          
          // If the piece is not an opponent piece, there's no pin
          if (piece.color !== opponentColor) break;
        }
        
        x += dx;
        y += dy;
      }
      
      // If there's exactly one opponent piece between, it's pinned
      if (piecesBetween === 1 && pinnedPiece && pinnedPiece.color === opponentColor) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if there's a skewer on the board
   * A skewer is similar to a pin, but the more valuable piece is in front
   */
  private hasSkewer(board: Board, playerColor: PlayerColor, opponentColor: PlayerColor): boolean {
    const pieces = board.getPieces();
    const playerPieces = pieces.filter(p => p.color === playerColor);
    const opponentPieces = pieces.filter(p => p.color === opponentColor);
    
    // Only long-range pieces can skewer
    const longRangePieces = playerPieces.filter(p => [
      PieceType.BISHOP,
      PieceType.ROOK,
      PieceType.QUEEN
    ].includes(p.type));
    
    // Map of piece types to values for comparison
    const pieceValues = {
      [PieceType.PAWN]: 1,
      [PieceType.KNIGHT]: 3,
      [PieceType.BISHOP]: 3,
      [PieceType.ROOK]: 5,
      [PieceType.QUEEN]: 9,
      [PieceType.KING]: 100 // King is most valuable
    };
    
    // Check each long-range piece
    for (const skeweringPiece of longRangePieces) {
      // For each direction the piece can move
      const directions = this.getPieceDirections(skeweringPiece.type);
      
      for (const [dx, dy] of directions) {
        let x = skeweringPiece.position.x + dx;
        let y = skeweringPiece.position.y + dy;
        let firstPiece: Piece | null = null;
        let secondPiece: Piece | null = null;
        
        // Look for two pieces in this direction
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const piece = board.getPieceAt({ x, y });
          
          if (piece) {
            if (!firstPiece) {
              // Found first piece
              firstPiece = piece;
              
              // Must be opponent's piece
              if (piece.color !== opponentColor) break;
            } else {
              // Found second piece
              secondPiece = piece;
              
              // Must be opponent's piece
              if (piece.color !== opponentColor) break;
              
              // Check if first piece is more valuable than second
              if (pieceValues[firstPiece.type] > pieceValues[secondPiece.type]) {
                return true;
              }
              
              break;
            }
          }
          
          x += dx;
          y += dy;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check if there's a discovered attack
   * A discovered attack occurs when a piece moves to reveal an attack by another piece
   */
  private hasDiscoveredAttack(
    beforeBoard: BoardSnapshot,
    afterBoard: Board,
    playerColor: PlayerColor,
    opponentColor: PlayerColor
  ): boolean {
    const beforePieces = beforeBoard.getPieces();
    const afterPieces = afterBoard.getPieces();
    
    // Find the piece that moved
    let movedPiece: Piece | null = null;
    let fromPosition: Position | null = null;
    
    for (const beforePiece of beforePieces) {
      if (beforePiece.color !== playerColor) continue;
      
      // Check if this piece moved
      const afterPiece = afterPieces.find(p => 
        p.type === beforePiece.type && 
        p.color === beforePiece.color &&
        (p.position.x !== beforePiece.position.x || p.position.y !== beforePiece.position.y)
      );
      
      if (afterPiece) {
        movedPiece = afterPiece;
        fromPosition = beforePiece.position;
        break;
      }
    }
    
    if (!movedPiece || !fromPosition) return false;
    
    // Find long-range pieces that could have been blocked by the moved piece
    const playerLongRangePieces = afterPieces.filter(p => 
      p.color === playerColor && 
      [PieceType.BISHOP, PieceType.ROOK, PieceType.QUEEN].includes(p.type) &&
      p !== movedPiece
    );
    
    for (const longRangePiece of playerLongRangePieces) {
      // Check if the moved piece was in line with this long-range piece
      const dx = fromPosition.x - longRangePiece.position.x;
      const dy = fromPosition.y - longRangePiece.position.y;
      
      // Normalize direction
      const dirX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
      const dirY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
      
      // Make sure the long-range piece can move in this direction
      if (!this.canMoveInDirection(longRangePiece.type, dirX, dirY)) {
        continue;
      }
      
      // Check if the moved piece was blocking an attack
      // Look beyond where the moved piece was for enemy pieces
      let x = fromPosition.x + dirX;
      let y = fromPosition.y + dirY;
      
      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const piece = afterBoard.getPieceAt({ x, y });
        
        if (piece) {
          // If an opponent piece is found, we have a discovered attack
          if (piece.color === opponentColor) {
            return true;
          }
          
          break;
        }
        
        x += dirX;
        y += dirY;
      }
    }
    
    return false;
  }
  
  /**
   * Check if the check was direct (made by the moved piece) or discovered
   */
  private wasDirect(
    beforeBoard: BoardSnapshot,
    afterBoard: Board,
    opponentColor: PlayerColor
  ): boolean {
    // Find moved piece and king
    const beforePieces = beforeBoard.getPieces();
    const afterPieces = afterBoard.getPieces();
    const opponentKing = afterPieces.find(p => p.type === PieceType.KING && p.color === opponentColor);
    
    if (!opponentKing) return false;
    
    // Find the piece that moved
    for (const beforePiece of beforePieces) {
      if (beforePiece.color === opponentColor) continue;
      
      // Check if this piece moved
      const afterPiece = afterPieces.find(p => 
        p.type === beforePiece.type && 
        p.color === beforePiece.color &&
        (p.position.x !== beforePiece.position.x || p.position.y !== beforePiece.position.y)
      );
      
      if (afterPiece) {
        // Check if this piece is attacking the king
        return this.canCapture(afterBoard, afterPiece.position, opponentKing.position);
      }
    }
    
    return false;
  }
  
  /**
   * Check if a piece can move in a given direction
   */
  private canMoveInDirection(pieceType: PieceType, dx: number, dy: number): boolean {
    switch (pieceType) {
      case PieceType.BISHOP:
        return Math.abs(dx) === Math.abs(dy) && dx !== 0; // Diagonal
      case PieceType.ROOK:
        return (dx === 0 && dy !== 0) || (dx !== 0 && dy === 0); // Straight
      case PieceType.QUEEN:
        return (dx === 0 && dy !== 0) || (dx !== 0 && dy === 0) || (Math.abs(dx) === Math.abs(dy) && dx !== 0); // Straight or diagonal
      default:
        return false;
    }
  }
  
  /**
   * Get the directions a piece can move in
   */
  private getPieceDirections(pieceType: PieceType): [number, number][] {
    switch (pieceType) {
      case PieceType.BISHOP:
        return [[1, 1], [1, -1], [-1, 1], [-1, -1]]; // Diagonals
      case PieceType.ROOK:
        return [[0, 1], [1, 0], [0, -1], [-1, 0]]; // Straight
      case PieceType.QUEEN:
        return [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]; // All directions
      default:
        return [];
    }
  }
  
  /**
   * Check if a piece at position 'from' can capture a piece at position 'to'
   */
  private canCapture(board: Board, from: Position, to: Position): boolean {
    const piece = board.getPieceAt(from);
    const target = board.getPieceAt(to);
    
    if (!piece || !target || piece.color === target.color) {
      return false;
    }
    
    try {
      // Use move validation from shared module
      // This will throw if the move is invalid
      const moveType = require('@gambit-chess/shared').MoveValidator.validateMove(board, from, to);
      return true;
    } catch (err) {
      return false;
    }
  }
} 