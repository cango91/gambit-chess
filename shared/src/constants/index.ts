export * from './knightRetreatData';
export * from './knightRetreatUtils';

/**
 * Board dimensions - this is a fixed constant and should not be changed
 */
export const BOARD_SIZE = 8;

/**
 * Chess piece values (classical) - these are fixed constants and should not be changed
 */
export const PIECE_VALUES = {
  p: 1, // Pawn
  n: 3, // Knight
  b: 3, // Bishop
  r: 5, // Rook
  q: 9, // Queen
  k: 0, // King (no capture value)
};

export const SECURITY_CONSTANTS = {
  MAX_AGE: 1000 * 60 * 60 * 24, // 1 day
  MAX_NONCE_AGE: 1000 * 60 * 10, // 10 minutes
  MAX_REPLAY_AGE: 1000 * 60 * 10, // 10 minutes
};