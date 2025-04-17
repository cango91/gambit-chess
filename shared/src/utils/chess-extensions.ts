import { Chess, Move, PieceSymbol, Square, Color } from 'chess.js';
import { GambitMove, GameStatus } from '../types/game';
import { GameConfig } from '../types/config';
import { DEFAULT_GAME_CONFIG } from '@/constants';
/**
 * Extended Chess.js functionality for Gambit Chess
 */
export class GambitChess extends Chess {
  private moveHistory: GambitMove[] = [];
  private config: GameConfig;

  constructor(fen?: string, config?: GameConfig) {
    super(fen);
    this.config = config || DEFAULT_GAME_CONFIG
  }

  /**
   * Get the position of the king of a given color
   */
  getKingPosition(color: Color): Square {
    const king = this.board().flat().find(piece => piece?.type === 'k' && piece.color === color);
    return king?.square as Square;
  }

  /**
   * Override the move method to handle Gambit Chess rules
   */
  move(move: string | { from: string; to: string; promotion?: string }): GambitMove  {
    const chessMove = super.move(move);

    const gambitMove: GambitMove = {
      ...chessMove,
      isCapture: chessMove.isCapture,
      isPromotion: chessMove.isPromotion,
      isEnPassant: chessMove.isEnPassant,
      isKingsideCastle: chessMove.isKingsideCastle,
      isQueensideCastle: chessMove.isQueensideCastle,
      isBigPawn: chessMove.isBigPawn,
      captureAttempt: !!chessMove.captured
    };

    this.moveHistory.push(gambitMove);
    return gambitMove;
  }

  /**
   * Determine if a move would result in a capture (for duel initiation)
   */
  wouldCapture(from: Square, to: Square): boolean {
    const moves = this.moves({ square: from, verbose: true });
    const move = moves.find(m => m.to === to);
    return move ? !!move.captured : false;
  }

  /**
   * Get the piece at a specific square
   */
  getPieceAt(square: Square): { type: PieceSymbol; color: Color } | null {
    const piece = this.get(square);
    return piece || null;
  }

  /**
   * Get the value of a piece based on its type
   */
  getPieceValue(pieceType: PieceSymbol): number {
    return this.config.pieceValues[pieceType];
  }

  /**
   * Get all valid tactical retreat squares for a piece after a failed capture
   */
  getValidTacticalRetreats(
    originalSquare: Square,
    attemptedCaptureSquare: Square
  ): { square: Square; cost: number }[] {
    const piece = this.getPieceAt(originalSquare);
    
    if (!piece) {
      return [];
    }

    const retreats: { square: Square; cost: number }[] = [];
    
    // Always add the original square with 0 cost
    retreats.push({ square: originalSquare, cost: 0 });

    // Handle different piece types
    switch (piece.type) {
      case 'b': // Bishop
      case 'r': // Rook
      case 'q': // Queen
        return this.getLongRangePieceRetreats(
          piece.type,
          originalSquare,
          attemptedCaptureSquare
        );
      
      case 'n': // Knight
        return this.getKnightRetreats(
          originalSquare,
          attemptedCaptureSquare
        );
      
      default:
        // Other pieces only get the original square
        return retreats;
    }
  }

  /**
   * Get valid retreat squares for long range pieces (bishop, rook, queen)
   */
  private getLongRangePieceRetreats(
    pieceType: PieceSymbol,
    from: Square,
    to: Square
  ): { square: Square; cost: number }[] {
    const retreats: { square: Square; cost: number }[] = [
      { square: from, cost: 0 } // Original position always costs 0
    ];
    
    // Determine the direction of movement
    const fromFile = from.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRank = parseInt(from.charAt(1)) - 1;
    const toFile = to.charCodeAt(0) - 'a'.charCodeAt(0);
    const toRank = parseInt(to.charAt(1)) - 1;
    
    const fileStep = fromFile === toFile ? 0 : (toFile - fromFile) / Math.abs(toFile - fromFile);
    const rankStep = fromRank === toRank ? 0 : (toRank - fromRank) / Math.abs(toRank - fromRank);
    
    // Check if the piece can move in this direction
    const validDirection = (
      (pieceType === 'r' && (fileStep === 0 || rankStep === 0)) || // Rook: horizontal/vertical
      (pieceType === 'b' && fileStep !== 0 && rankStep !== 0) ||   // Bishop: diagonal
      (pieceType === 'q')                                          // Queen: any direction
    );
    
    if (!validDirection) {
      return retreats;
    }
    
    // Explore squares along the attack axis
    let distance = 1;
    let currFile = fromFile + fileStep;
    let currRank = fromRank + rankStep;
    
    while (
      currFile >= 0 && currFile < 8 && 
      currRank >= 0 && currRank < 8
    ) {
      const square = String.fromCharCode('a'.charCodeAt(0) + currFile) + (currRank + 1) as Square;
      
      // Skip the target square (can't retreat there)
      if (square === to) {
        currFile += fileStep;
        currRank += rankStep;
        distance++;
        continue;
      }
      
      // Check if square is empty
      if (!this.get(square)) {
        retreats.push({ square, cost: distance });
      } else {
        // We hit a piece, can't go further
        break;
      }
      
      currFile += fileStep;
      currRank += rankStep;
      distance++;
    }
    
    return retreats;
  }

  /**
   * Get valid retreat squares for a knight
   */
  private getKnightRetreats(
    from: Square,
    to: Square
  ): { square: Square; cost: number }[] {
    const retreats: { square: Square; cost: number }[] = [
      { square: from, cost: 0 } // Original position always costs 0
    ];
    
    const fromFile = from.charCodeAt(0) - 'a'.charCodeAt(0);
    const fromRank = parseInt(from.charAt(1)) - 1;
    const toFile = to.charCodeAt(0) - 'a'.charCodeAt(0);
    const toRank = parseInt(to.charAt(1)) - 1;
    
    // Verify it's a valid knight move
    const fileDiff = Math.abs(toFile - fromFile);
    const rankDiff = Math.abs(toRank - fromRank);
    
    if (!((fileDiff === 1 && rankDiff === 2) || (fileDiff === 2 && rankDiff === 1))) {
      return retreats; // Not a valid knight move
    }
    
    // Calculate the rectangle for retreat options
    const rectangle = this.getKnightMoveRectangle(fromFile, fromRank, toFile, toRank);
    
    // Check all squares in the rectangle
    for (const [file, rank] of rectangle) {
      // Skip the original and target squares
      const square = String.fromCharCode('a'.charCodeAt(0) + file) + (rank + 1) as Square;
      if (square === from || square === to) continue;
      
      // Check if square is empty
      if (!this.get(square)) {
        // Calculate the cost - minimum number of knight moves to reach this square
        const cost = this.calculateKnightMoveCost(fromFile, fromRank, file, rank);
        retreats.push({ square, cost });
      }
    }
    
    return retreats;
  }
  
  /**
   * Calculate the rectangle defined by the knight's possible L-paths
   */
  private getKnightMoveRectangle(
    fromFile: number, 
    fromRank: number, 
    toFile: number, 
    toRank: number
  ): [number, number][] {
    const minFile = Math.min(fromFile, toFile);
    const maxFile = Math.max(fromFile, toFile);
    const minRank = Math.min(fromRank, toRank);
    const maxRank = Math.max(fromRank, toRank);
    
    const rectanglePoints: [number, number][] = [];
    
    // Include all points within the rectangle
    for (let file = minFile; file <= maxFile; file++) {
      for (let rank = minRank; rank <= maxRank; rank++) {
        // Ensure the point is on the board
        if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
          rectanglePoints.push([file, rank]);
        }
      }
    }
    
    return rectanglePoints;
  }
  
  /**
   * Calculate the minimum number of knight moves to reach a target square
   */
  private calculateKnightMoveCost(
    fromFile: number,
    fromRank: number,
    toFile: number,
    toRank: number
  ): number {
    // This is a simplified approach using a chess knight distance formula
    const dx = Math.abs(fromFile - toFile);
    const dy = Math.abs(fromRank - toRank);
    
    if (dx === 0 && dy === 0) return 0;
    
    if (dx + dy === 1) return 3; // Requires minimum 3 moves for adjacent square
    if (dx === 1 && dy === 1) return 2; // Diagonal square requires 2 moves
    if (dx === 2 && dy === 2) return 4; // Double diagonal requires 4 moves
    if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) return 1; // L-shape is 1 move
    
    // General case - approximation of knight distance
    return Math.ceil(Math.max(dx / 2, dy / 2, (dx + dy) / 3));
  }
}