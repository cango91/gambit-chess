import { Board, BoardFactory, BoardSnapshot, Piece, PieceDTO, PieceType, PlayerColor, Position } from '../types';
import { isValidPosition } from '../utils';

/**
 * Implementation of a BoardSnapshot for validation purposes
 * @internal This class is used internally by BoardImpl
 */
class _BoardSnapshotImpl implements BoardSnapshot {
  private pieces: Piece[];

  constructor(pieces: Piece[]) {
    // Create deep copies of all pieces to ensure immutability
    this.pieces = pieces.map(piece => piece.clone());
  }

  getPieces(): ReadonlyArray<Piece> {
    return this.pieces;
  }

  getPieceAt(position: Position): Piece | undefined {
    return this.pieces.find(
      piece => piece.position.x === position.x && piece.position.y === position.y
    );
  }

  isOccupied(position: Position): boolean {
    return this.getPieceAt(position) !== undefined;
  }

  withMove(from: Position, to: Position): BoardSnapshot {
    const newPieces = this.pieces.map(piece => piece.clone());
    
    // Find the piece to move
    const pieceIndex = newPieces.findIndex(
      piece => piece.position.x === from.x && piece.position.y === from.y
    );
    
    if (pieceIndex === -1) {
      return new _BoardSnapshotImpl(newPieces);
    }
    
    // Remove any piece at the destination
    const capturedPieceIndex = newPieces.findIndex(
      piece => piece.position.x === to.x && piece.position.y === to.y
    );
    
    if (capturedPieceIndex !== -1) {
      newPieces.splice(capturedPieceIndex, 1);
    }
    
    // Move the piece
    newPieces[pieceIndex].moveTo(to);
    
    return new _BoardSnapshotImpl(newPieces);
  }
}

/**
 * Implementation of the Board interface for validation purposes
 * This is a lightweight representation that doesn't modify game state
 */
export class BoardImpl implements Board {
  private pieces: Piece[] = [];

  constructor(pieces: Piece[]) {
    this.pieces = pieces;
  }

  getPieces(): ReadonlyArray<Piece> {
    return this.pieces;
  }

  getPieceAt(position: Position): Piece | undefined {
    return this.pieces.find(
      piece => piece.position.x === position.x && piece.position.y === position.y
    );
  }

  isOccupied(position: Position): boolean {
    return this.getPieceAt(position) !== undefined;
  }

  isOccupiedByColor(position: Position, color: PlayerColor): boolean {
    const piece = this.getPieceAt(position);
    return piece !== undefined && piece.color === color;
  }

  isPathClear(from: Position, to: Position): boolean {
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
      if (this.isOccupied({ x, y })) {
        return false;
      }
      x += stepX;
      y += stepY;
    }
    
    return true;
  }

  getKingPosition(color: PlayerColor): Position {
    const king = this.pieces.find(
      piece => piece.type === PieceType.KING && piece.color === color
    );
    
    if (!king) {
      throw new Error(`No ${color} king found on the board`);
    }
    
    return { ...king.position };
  }

  snapshot(): BoardSnapshot {
    return new _BoardSnapshotImpl(this.pieces);
  }
}

/**
 * Factory for creating board instances from pieces
 */
export class BoardFactoryImpl implements BoardFactory {
  private pieceFactory: any; // PieceFactory - using any to avoid circular dependencies

  constructor(pieceFactory: any) {
    this.pieceFactory = pieceFactory;
  }

  createFromPieces(pieceDTOs: PieceDTO[]): Board {
    const pieces = pieceDTOs.map(pieceDTO => this.pieceFactory.createPiece(pieceDTO));
    return new BoardImpl(pieces);
  }
} 