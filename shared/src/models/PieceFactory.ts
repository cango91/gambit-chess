import { Piece, PieceDTO, PieceType } from '../types';
import { AbstractPiece } from './AbstractPiece';
import { v4 as uuidv4 } from 'uuid';

/**
 * Factory interface for creating piece instances
 */
export interface PieceFactory {
  /**
   * Create a piece from a DTO
   * @param pieceDTO The piece data transfer object
   * @returns A new piece instance
   */
  createPiece(pieceDTO: PieceDTO): Piece;
  
  /**
   * Create a new piece with a generated ID
   * @param pieceType The type of piece to create
   * @param pieceColor The color of the piece
   * @param position The initial position
   * @param hasMoved Whether the piece has moved
   * @returns A new piece instance
   */
  createNewPiece(pieceType: PieceType, pieceColor: string, position: { x: number, y: number }, hasMoved?: boolean): Piece;
}

/**
 * Concrete implementations of chess pieces
 * These are internal implementations and should not be used directly
 * @internal
 */

/**
 * Pawn implementation
 * @internal
 */
class _PawnPiece extends AbstractPiece {
  clone(): Piece {
    return new _PawnPiece(
      this.id,
      this.type,
      this.color,
      { ...this.position },
      this.hasMoved
    );
  }
}

/**
 * Knight implementation
 * @internal
 */
class _KnightPiece extends AbstractPiece {
  clone(): Piece {
    return new _KnightPiece(
      this.id,
      this.type,
      this.color,
      { ...this.position },
      this.hasMoved
    );
  }
}

/**
 * Bishop implementation
 * @internal
 */
class _BishopPiece extends AbstractPiece {
  clone(): Piece {
    return new _BishopPiece(
      this.id,
      this.type,
      this.color,
      { ...this.position },
      this.hasMoved
    );
  }
}

/**
 * Rook implementation
 * @internal
 */
class _RookPiece extends AbstractPiece {
  clone(): Piece {
    return new _RookPiece(
      this.id,
      this.type,
      this.color,
      { ...this.position },
      this.hasMoved
    );
  }
}

/**
 * Queen implementation
 * @internal
 */
class _QueenPiece extends AbstractPiece {
  clone(): Piece {
    return new _QueenPiece(
      this.id,
      this.type,
      this.color,
      { ...this.position },
      this.hasMoved
    );
  }
}

/**
 * King implementation
 * @internal
 */
class _KingPiece extends AbstractPiece {
  clone(): Piece {
    return new _KingPiece(
      this.id,
      this.type,
      this.color,
      { ...this.position },
      this.hasMoved
    );
  }
}

/**
 * Default implementation of PieceFactory
 */
export class PieceFactoryImpl implements PieceFactory {
  createPiece(pieceDTO: PieceDTO): Piece {
    switch (pieceDTO.type) {
      case PieceType.PAWN:
        return new _PawnPiece(
          pieceDTO.id,
          pieceDTO.type,
          pieceDTO.color,
          pieceDTO.position,
          pieceDTO.hasMoved
        );
      case PieceType.KNIGHT:
        return new _KnightPiece(
          pieceDTO.id,
          pieceDTO.type,
          pieceDTO.color,
          pieceDTO.position,
          pieceDTO.hasMoved
        );
      case PieceType.BISHOP:
        return new _BishopPiece(
          pieceDTO.id,
          pieceDTO.type,
          pieceDTO.color,
          pieceDTO.position,
          pieceDTO.hasMoved
        );
      case PieceType.ROOK:
        return new _RookPiece(
          pieceDTO.id,
          pieceDTO.type,
          pieceDTO.color,
          pieceDTO.position,
          pieceDTO.hasMoved
        );
      case PieceType.QUEEN:
        return new _QueenPiece(
          pieceDTO.id,
          pieceDTO.type,
          pieceDTO.color,
          pieceDTO.position,
          pieceDTO.hasMoved
        );
      case PieceType.KING:
        return new _KingPiece(
          pieceDTO.id,
          pieceDTO.type,
          pieceDTO.color,
          pieceDTO.position,
          pieceDTO.hasMoved
        );
      default:
        throw new Error(`Unknown piece type: ${pieceDTO.type}`);
    }
  }

  createNewPiece(pieceType: PieceType, pieceColor: string, position: { x: number, y: number }, hasMoved: boolean = false): Piece {
    const id = uuidv4();
    const pieceDTO = {
      id,
      type: pieceType,
      color: pieceColor,
      position,
      hasMoved
    };
    return this.createPiece(pieceDTO as PieceDTO);
  }
} 