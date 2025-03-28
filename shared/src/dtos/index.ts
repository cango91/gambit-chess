/**
 * Data Transfer Objects (DTOs) for Gambit Chess
 */

import {
  ChessPiece,
  GamePhase,
  GameResult,
  PieceColor,
  Player,
  Position,
  Spectator,
  ChatMessage
} from '../types';

/**
 * DTO for game state updates sent to clients
 * Note: This is filtered by the server based on player visibility rules
 */
export interface GameStateDTO {
  /** Game unique identifier */
  gameId: string;
  /** Current game phase */
  phase: GamePhase;
  /** Current player's turn */
  turn: PieceColor;
  /** Current board pieces */
  pieces: ChessPiece[];
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
  activeTimer: PieceColor | null;
  /** Sequence number for state reconciliation */
  sequence: number;
  /** Server timestamp */
  timestamp: number;
  /** Players information */
  players: Player[];
  /** Current spectators */
  spectators: Spectator[];
}

/**
 * DTO for move requests from clients
 */
export interface MoveDTO {
  /** Game ID */
  gameId: string;
  /** Starting position */
  from: Position;
  /** Destination position */
  to: Position;
  /** Move sequence number for validation */
  sequence: number;
}

/**
 * DTO for BP allocation during duels
 */
export interface BPAllocationDTO {
  /** Game ID */
  gameId: string;
  /** Amount of BP allocated */
  amount: number;
  /** Sequence number for validation */
  sequence: number;
}

/**
 * DTO for tactical retreat selection
 */
export interface RetreatDTO {
  /** Game ID */
  gameId: string;
  /** Position to retreat to */
  position: Position;
  /** Sequence number for validation */
  sequence: number;
}

/**
 * DTO for duel initiation notification
 */
export interface DuelInitiatedDTO {
  /** Game ID */
  gameId: string;
  /** Position of the attacking piece */
  attackingPiece: Position;
  /** Position of the defending piece */
  defendingPiece: Position;
  /** Position where the capture is attempted */
  position: Position;
}

/**
 * DTO for duel outcome notification
 */
export interface DuelOutcomeDTO {
  /** Game ID */
  gameId: string;
  /** Winner of the duel (attacker or defender) */
  winner: PieceColor;
  /** Result of the duel (success or failed) */
  result: 'success' | 'failed';
  /** BP allocated by attacker */
  attackerAllocation: number;
  /** BP allocated by defender */
  defenderAllocation: number;
}

/**
 * DTO for retreat options notification
 */
export interface RetreatOptionsDTO {
  /** Game ID */
  gameId: string;
  /** Piece position that needs to retreat */
  piece: Position;
  /** Valid positions to retreat to */
  validPositions: Position[];
  /** BP costs for each valid position */
  costs: number[];
}

/**
 * DTO for BP update notification
 */
export interface BPUpdateDTO {
  /** Game ID */
  gameId: string;
  /** Current BP amount */
  currentBP: number;
}

/**
 * DTO for chat message
 */
export interface ChatMessageDTO extends ChatMessage {
  /** Game ID */
  gameId: string;
}

/**
 * DTO for player information
 */
export interface PlayerDTO extends Player {
  /** Game ID */
  gameId: string;
}

/**
 * DTO for spectator information
 */
export interface SpectatorDTO extends Spectator {
  /** Game ID */
  gameId: string;
}

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
 * DTO for game resignation
 */
export interface ResignDTO {
  /** Game ID */
  gameId: string;
  /** Sequence number for validation */
  sequence: number;
}

/**
 * DTO for draw offer
 */
export interface DrawOfferDTO {
  /** Game ID */
  gameId: string;
  /** Sequence number for validation */
  sequence: number;
}

/**
 * DTO for draw response
 */
export interface DrawResponseDTO {
  /** Game ID */
  gameId: string;
  /** Whether the draw was accepted */
  accept: boolean;
  /** Sequence number for validation */
  sequence: number;
}

/**
 * DTO for connection ping
 */
export interface ConnectionPingDTO {
  /** Game ID */
  gameId: string;
  /** Client timestamp for latency calculation */
  timestamp: number;
}

/**
 * DTO for spectator join request
 */
export interface SpectatorJoinDTO {
  /** Game ID */
  gameId: string;
  /** Spectator display name */
  name: string;
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