/**
 * Data Transfer Objects (DTOs) for Gambit Chess
 */

import { RetreatCost } from '@/tactical';
import {
  GamePhase,
  GameResult,
  Player,
  Spectator,
  ChatMessage,
  MoveOutcome,
} from '../types';
import { ChessPieceColor, ChessPosition } from '@/chess/types';
import { IChessPiece } from '@/chess/contracts';

type DuelOutcome = MoveOutcome;

/**
 * DTO for game state updates sent to clients
 * Note: This is filtered by the server based on player visibility rules
 */
export interface GameStateDTO {
  /** Current game phase */
  phase: GamePhase;
  /** Current player's turn */
  turn: ChessPieceColor;
  /** Current board pieces */
  pieces: IChessPiece[];
  /** Current move number */
  moveNumber: number;
  /** Check status */
  inCheck: boolean;
  /** Player's own BP (opponent's BP is hidden) */
  bp?: number;
  /** Game result if game is over */
  result?: GameResult;
  /** Time remaining for white player (in milliseconds) */
  whiteTimeRemaining: number;
  /** Time remaining for black player (in milliseconds) */
  blackTimeRemaining: number;
  /** Current active timer */
  activeTimer: ChessPieceColor | null;
  /** Players information */
  players: Player[];
  /** Current spectators */
  spectators: Spectator[];
}

/**
 * DTO for move requests from clients
 */
export interface MoveDTO {
  /** Starting position */
  from: ChessPosition;
  /** Destination position */
  to: ChessPosition;
}


/**
 * DTO for tactical retreat selection
 */
export interface RetreatSelectionDTO {
  /** Position to retreat to */
  position: ChessPosition;
}

/**
 * DTO for duel initiation notification
 */
export interface DuelInitiatedDTO {
  /** Position of the attacking piece */
  attackingPiece: ChessPosition;
  /** Position of the defending piece */
  defendingPiece: ChessPosition;
  /** Position where the capture is attempted */
  position: ChessPosition;
}

/**
 * DTO for duel outcome notification
 */
export interface DuelOutcomeDTO {
  /** Winner of the duel (attacker or defender) */
  winner: ChessPieceColor;
  /** Result of the duel (success or failed) */
  result: DuelOutcome;
  /** BP allocated by attacker */
  attackerAllocation: number;
  /** BP allocated by defender */
  defenderAllocation: number;
}

/**
 * DTO for retreat options notification
 */
export interface RetreatOptionsDTO {
  /** Retreat options */
  options: RetreatCost[];
}

/**
 * DTO for BP update notification
 */
export interface BPAllocationDTO {
  /** BP allocation requested by the player */
  bp: number;
}

/**
 * DTO for player information
 */
export type PlayerDTO = Player;

/**
 * DTO for spectator information
 */
export type SpectatorDTO = Spectator;

/**
 * DTO for chat message
 */
export type ChatMessageDTO = ChatMessage;

/**
 * DTO for error messages
 */
export interface ErrorDTO {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
}


/**
 * DTO for draw response
 */
export interface DrawResponseDTO {
  /** Whether the draw was accepted */
  accept: boolean;
}

/**
 * DTO for player name setting
 */
export interface PlayerNameDTO {
  /** Game ID */
  gameId: string;
  /** Player display name */
  name: string;
} 