/**
 * Advanced move types for Gambit Chess
 * 
 * This file contains more specific type definitions for moves, move history,
 * and PGN related structures to improve type safety throughout the codebase.
 */

import { Move, Duel, Retreat, PieceColor } from './types';

/**
 * Extended move information including duel and retreat data
 */
export interface ExtendedMove {
  /** Base move information */
  move: Move;
  /** Duel information if a capture was attempted */
  duel: Duel | null;
  /** Retreat information if a failed capture resulted in a retreat */
  retreat: Retreat | null;
  /** Battle Points regenerated after this move */
  bpRegeneration: number;
  /** Color of the player who made the move */
  playerColor: PieceColor;
  /** Turn number when this move was made */
  turnNumber: number;
}

/**
 * Array of extended moves representing a game's move history
 */
export type MoveHistory = ExtendedMove[];

/**
 * Array of move strings in algebraic notation
 */
export type PGNMoveList = string[];

/**
 * PGN format header information
 */
export interface PGNHeaders {
  /** Event name */
  Event?: string;
  /** Site where the game was played */
  Site?: string;
  /** Date of the game (YYYY.MM.DD) */
  Date?: string;
  /** Round number */
  Round?: string;
  /** White player name */
  White?: string;
  /** Black player name */
  Black?: string;
  /** Game result (1-0, 0-1, 1/2-1/2, *) */
  Result?: string;
  /** Time control */
  TimeControl?: string;
  /** Any custom headers */
  [key: string]: string | undefined;
}

/**
 * Complete PGN data structure
 */
export interface PGNData {
  /** PGN headers */
  headers: PGNHeaders;
  /** Move list */
  moves: MoveHistory;
} 