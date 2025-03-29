/**
 * Shared constants for Gambit Chess
 */

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

/**
 * Maximum BP capacity per piece - this is a default value that can be overridden by server configuration
 */
export const DEFAULT_MAX_BP_CAPACITY = 10;

/**
 * Default piece BP capacities (same as classical chess piece values)
 * These are default values that can be overridden by server configuration
 */
export const DEFAULT_BP_CAPACITIES = { ...PIECE_VALUES };

/**
 * Default initial BP pool (sum of all piece values for one player)
 * 8 pawns + 2 knights + 2 bishops + 2 rooks + 1 queen = 8*1 + 2*3 + 2*3 + 2*5 + 1*9 = 39
 * This is a default value that can be overridden by server configuration
 */
export const DEFAULT_INITIAL_BP = 39;

/**
 * Base BP regeneration per turn - default value that can be overridden by server configuration
 */
export const DEFAULT_BASE_BP_REGEN = 1;

/**
 * BP regeneration for pin - default implementation that can be overridden by server configuration
 */
export const DEFAULT_PIN_BP_REGEN = (pinnedPieceValue: number) => pinnedPieceValue;

/**
 * Extra BP for pinning king - default value that can be overridden by server configuration
 */
export const DEFAULT_PIN_KING_EXTRA_BP = 1;

/**
 * BP regeneration for skewer - default implementation that can be overridden by server configuration
 */
export const DEFAULT_SKEWER_BP_REGEN = (higherValue: number, lowerValue: number) => {
  const diff = higherValue - lowerValue;
  return diff > 0 ? diff : 1;
};

/**
 * BP regeneration for fork - default implementation that can be overridden by server configuration
 */
export const DEFAULT_FORK_BP_REGEN = (piece1Value: number, piece2Value: number) => 
  Math.min(piece1Value, piece2Value);

/**
 * BP regeneration for direct defense - default implementation that can be overridden by server configuration
 */
export const DEFAULT_DEFENSE_BP_REGEN = (defendedValue: number, defenderValue: number) => {
  const diff = defendedValue - defenderValue;
  return diff > 0 ? diff : 1;
};

/**
 * BP regeneration for discovered attack - default implementation that can be overridden by server configuration
 */
export const DEFAULT_DISCOVERED_ATTACK_BP_REGEN = (attackedPieceValue: number) => 
  Math.ceil(attackedPieceValue / 2);

/**
 * BP regeneration for check - default value that can be overridden by server configuration
 */
export const DEFAULT_CHECK_BP_REGEN = 2;

/**
 * BP allocation display on opponent pieces - this is a display convention, not a configurable option
 * This is what opponent's BP allocation shows as on the UI before duel resolution
 */
export const OPPONENT_BP_PLACEHOLDER = '?';

/**
 * Default game time control in milliseconds - default values that can be overridden by server configuration
 * 10 minutes + 5 seconds increment
 */
export const DEFAULT_TIME_CONTROL = {
  initial: 10 * 60 * 1000, // 10 minutes
  increment: 5 * 1000, // 5 seconds
};

/**
 * Time allowed for BP allocation during duel (milliseconds) - default value that can be overridden by server configuration
 */
export const DEFAULT_DUEL_ALLOCATION_TIME = 30 * 1000; // 30 seconds

/**
 * Time allowed for tactical retreat selection (milliseconds) - default value that can be overridden by server configuration
 */
export const DEFAULT_TACTICAL_RETREAT_TIME = 30 * 1000; // 30 seconds

/**
 * Player reconnection window (milliseconds) - default value that can be overridden by server configuration
 */
export const DEFAULT_RECONNECTION_WINDOW = 30 * 1000; // 30 seconds

/**
 * Maximum chat message length - default value that can be overridden by server configuration
 */
export const DEFAULT_MAX_CHAT_LENGTH = 500; 