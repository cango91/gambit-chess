import { BP_CAPACITY, Piece, PieceType, PlayerColor, Position } from '../types';
import { isLongRangePiece as checkIfLongRangePiece } from '../utils';

/**
 * Abstract base class for all chess pieces
 * Implements common functionality shared across all piece types
 */
export abstract class AbstractPiece implements Piece {
  protected _id: string;
  protected _battlePoints: number = 0;

  /**
   * Create a new chess piece
   * @param id Unique identifier for the piece
   * @param type The type of piece
   * @param color The piece color
   * @param position Initial position
   * @param hasMoved Whether the piece has moved before
   */
  constructor(
    id: string,
    public readonly type: PieceType,
    public readonly color: PlayerColor,
    public position: Position,
    public hasMoved: boolean = false
  ) {
    this._id = id;
  }

  /**
   * Get the unique ID of this piece
   */
  get id(): string {
    return this._id;
  }

  /**
   * Get the current battle points allocated to this piece
   */
  get battlePoints(): number {
    return this._battlePoints;
  }

  /**
   * Get the maximum BP capacity for this piece type
   * @returns BP capacity based on piece type
   */
  getBPCapacity(): number {
    return BP_CAPACITY[this.type];
  }

  /**
   * Allocate battle points to this piece for a duel
   * @param amount The amount of BP to allocate
   * @returns The actual amount allocated (may be lower if insufficient BP)
   */
  allocateBattlePoints(amount: number): number {
    if (amount < 0) {
      return 0;
    }
    
    this._battlePoints = amount;
    return amount;
  }

  /**
   * Reset battle points to zero
   */
  resetBattlePoints(): void {
    this._battlePoints = 0;
  }

  /**
   * Move this piece to a new position
   * @param position The destination position
   */
  moveTo(position: Position): void {
    this.position = { ...position };
    this.hasMoved = true;
  }

  /**
   * Check if this piece is long-range (bishop, rook, queen)
   * @returns True if piece is long-range
   */
  isLongRangePiece(): boolean {
    return checkIfLongRangePiece(this.type);
  }

  /**
   * Create a deep copy of this piece
   * @returns A new piece with the same properties
   */
  abstract clone(): Piece;

  /**
   * Convert to a data transfer object
   * @returns DTO representation of this piece
   */
  toDTO() {
    return {
      id: this.id,
      type: this.type,
      color: this.color,
      position: { ...this.position },
      hasMoved: this.hasMoved
    };
  }
} 