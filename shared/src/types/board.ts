import { Piece, PieceDTO, PieceType, PlayerColor, Position } from './index';

/**
 * Board representation for validation purposes.
 * This is used for move validation only and doesn't contain any state-changing logic.
 */
export interface Board {
  /**
   * Get all pieces currently on the board
   */
  getPieces(): ReadonlyArray<Piece>;
  
  /**
   * Get piece at a specific position
   * @param position The position to check
   * @returns The piece at the position or undefined if no piece exists
   */
  getPieceAt(position: Position): Piece | undefined;
  
  /**
   * Check if a position is occupied by any piece
   * @param position The position to check
   * @returns True if the position is occupied
   */
  isOccupied(position: Position): boolean;
  
  /**
   * Check if a position is occupied by a piece of the specified color
   * @param position The position to check
   * @param color The color to check for
   * @returns True if the position is occupied by a piece of the specified color
   */
  isOccupiedByColor(position: Position, color: PlayerColor): boolean;
  
  /**
   * Check if a path between two positions is clear (for straight or diagonal moves)
   * @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear
   */
  isPathClear(from: Position, to: Position): boolean;
  
  /**
   * Get the position of the king of the specified color
   * @param color The color of the king
   * @returns The position of the king
   */
  getKingPosition(color: PlayerColor): Position;

  /**
   * Create a read-only snapshot of the board
   * This is useful for simulating moves without modifying the original board
   */
  snapshot(): BoardSnapshot;
}

/**
 * Lightweight read-only board snapshot for validation purposes
 * Used for checking if a move would result in check
 */
export interface BoardSnapshot {
  /**
   * Get all pieces in the snapshot
   */
  getPieces(): ReadonlyArray<Piece>;
  
  /**
   * Get piece at a specific position in the snapshot
   * @param position The position to check
   * @returns The piece at the position or undefined if no piece exists
   */
  getPieceAt(position: Position): Piece | undefined;
  
  /**
   * Check if a position is occupied in the snapshot
   * @param position The position to check
   * @returns True if the position is occupied
   */
  isOccupied(position: Position): boolean;
  
  /**
   * Create a new snapshot with a simulated move
   * @param from Starting position
   * @param to Ending position
   * @returns A new snapshot with the move applied
   */
  withMove(from: Position, to: Position): BoardSnapshot;
}

/**
 * Simple factory for creating a board from a list of pieces
 * Used primarily for testing and validation
 */
export interface BoardFactory {
  /**
   * Create a board from a list of pieces
   * @param pieces The pieces to place on the board
   * @returns A new board instance
   */
  createFromPieces(pieces: PieceDTO[]): Board;
} 