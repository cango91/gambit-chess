import { PieceSymbol } from 'chess.js';

// Standard chess piece values for use in BP calculations
export const STANDARD_PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1, // pawn
  n: 3, // knight
  b: 3, // bishop
  r: 5, // rook
  q: 9, // queen
  k: 10 // king, value doesn't matter since king cannot be captured: used for pin/skewer detection
};

// Calculate the total value of all pieces for a side
export const TOTAL_STARTING_PIECES_VALUE = (
  8 * STANDARD_PIECE_VALUES.p + // 8 pawns
  2 * STANDARD_PIECE_VALUES.n + // 2 knights
  2 * STANDARD_PIECE_VALUES.b + // 2 bishops
  2 * STANDARD_PIECE_VALUES.r + // 2 rooks
  1 * STANDARD_PIECE_VALUES.q   // 1 queen
); // 39 BP

// Kings have a special case for BP capacity calculations
export const KING_BP_CAPACITY = 10;