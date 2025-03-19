import { Piece as PieceInterface, PieceType, PlayerColor, Position, BP_CAPACITY } from '../types';

/**
 * Base Piece class implementing the PieceInterface
 * @class Piece
 */
export class Piece implements PieceInterface {
  type: PieceType;
  color: PlayerColor;
  position: Position;
  hasMoved: boolean;
  battlePoints: number;

  /**
   * Create a new Piece
   * @param type The type of the piece
   * @param color The color of the piece
   * @param position The initial position of the piece
   */
  constructor(
    type: PieceType,
    color: PlayerColor,
    position: Position
  ) {
    this.type = type;
    this.color = color;
    this.position = position;
    this.hasMoved = false;
    this.battlePoints = 0;
  }

  /**
   * Get the maximum Battle Points capacity for this piece
   * @returns The BP capacity based on classic chess piece value
   */
  getBPCapacity(): number {
    return BP_CAPACITY[this.type];
  }

  /**
   * Allocate Battle Points to this piece, respecting capacity limits
   * @param amount The amount of BP to allocate
   * @returns The actual amount of BP consumed (may be double if over capacity)
   */
  allocateBattlePoints(amount: number): number {
    const capacity = this.getBPCapacity();
    let bpConsumed = amount;
    
    // Double the cost if allocating more than capacity
    if (amount > capacity) {
      bpConsumed = amount * 2;
    }

    this.battlePoints = amount;
    return bpConsumed;
  }

  /**
   * Reset the Battle Points allocated to this piece
   */
  resetBattlePoints(): void {
    this.battlePoints = 0;
  }

  /**
   * Move the piece to a new position
   * @param position The new position
   */
  moveTo(position: Position): void {
    this.position = { ...position };
    this.hasMoved = true;
  }

  /**
   * Check if the piece is a long-range piece (bishop, rook, queen)
   * @returns True if the piece is long-range
   */
  isLongRangePiece(): boolean {
    return (
      this.type === PieceType.BISHOP ||
      this.type === PieceType.ROOK ||
      this.type === PieceType.QUEEN
    );
  }

  /**
   * Create a copy of this piece
   * @returns A new piece instance with the same properties
   */
  clone(): Piece {
    const clonedPiece = new Piece(this.type, this.color, { ...this.position });
    clonedPiece.hasMoved = this.hasMoved;
    clonedPiece.battlePoints = this.battlePoints;
    return clonedPiece;
  }
} 