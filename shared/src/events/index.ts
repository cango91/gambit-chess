/**
 * Shared Event Definitions for Gambit Chess
 * 
 * This module defines event interfaces that can be safely shared between client and server
 * according to domain boundaries and information architecture rules.
 */

import {
  MoveDTO,
  RetreatSelectionDTO,
  DuelInitiatedDTO,
  DuelOutcomeDTO,
  RetreatOptionsDTO,
  ChatMessageDTO,
  PlayerDTO,
  SpectatorDTO,
  GameStateDTO,
  ErrorDTO,
  DrawResponseDTO,
  BPAllocationDTO,
} from '../dtos';
import { GameEventType } from '../types';

/**
 * Event Categories
 * 
 * Domain-safe events that can be shared between client and server.
 * These events respect information visibility rules and domain boundaries.
 */

/**
 * Base Event Interface
 * 
 * This interface defines the base event structure that all shared events must implement.
 * It ensures type safety and consistency across all event types.
 */
interface BaseGameEvent {
  /** Event type */
  type: GameEventType;
  /** Event payload */
  payload?: any | undefined;
  /** Game unique identifier (for identification and state reconciliation) */
  gameId: string;
  /** Event sequence number (for validation and state reconciliation) */
  sequence: number;
  /** Timestamp of the event (for ordering and state reconciliation) */
  timestamp: number;
}

/**
 * Authentication Events
 * These events handle secure authentication without login requirements
 */
export interface AuthChallengeEvent extends BaseGameEvent {
  type: GameEventType.AUTH_CHALLENGE;
  payload: {
    challenge: string;
    timestamp: number;
  };
}

export interface AuthResponseEvent extends BaseGameEvent {
  type: GameEventType.AUTH_RESPONSE;
  payload: {
    challenge: string;
    signature: string;
    token: string;
    timestamp: number;
  };
}

export interface AuthResultEvent extends BaseGameEvent {
  type: GameEventType.AUTH_RESULT;
  payload: {
    success: boolean;
    error?: string;
    playerId?: string;
    gameId?: string;
  };
}

/**
 * Session Events
 * These events handle game session management
 */
export interface GameSessionJoinedEvent extends BaseGameEvent {
  type: GameEventType.SESSION_JOINED;
  payload: {
    gameId: string;
    playerId: string;
    playerColor: string;
    initialState: GameStateDTO;
  };
}

export interface StateSyncRequestEvent extends BaseGameEvent {
  type: GameEventType.STATE_SYNC_REQUEST;
  payload: {
    lastSequence: number;
    checksum: string;
  };
}

export interface StateSyncResponseEvent extends BaseGameEvent {
  type: GameEventType.STATE_SYNC_RESPONSE;
  payload: GameStateDTO & {
    sequence: number;
    checksum: string;
  };
}

/**
 * BP Commitment Scheme Events
 * These events implement a secure commitment scheme for BP allocation
 */
export interface BPCommitmentEvent extends BaseGameEvent {
  type: GameEventType.DUEL_COMMITMENT;
  payload: {
    commitment: string;
  };
}

export interface BPRevealEvent extends BaseGameEvent {
  type: GameEventType.DUEL_REVEAL;
  payload: {
    allocation: number;
    nonce: string;
  };
}

/**
 * Connection Status Events
 * These events handle connection state management
 */
export interface ConnectionStatusEvent extends BaseGameEvent {
  type: GameEventType.CONNECTION_STATUS;
  payload: {
    status: 'connected' | 'reconnecting' | 'disconnected';
    playerId: string;
  };
}

export interface ReconnectionEvent extends BaseGameEvent {
  type: GameEventType.CONNECTION_RECONNECT;
  payload: {
    playerId: string;
    token: string;
  };
}

/**
 * Move Events
 * These events handle basic move requests and validation
 */
export interface MoveRequestEvent extends BaseGameEvent {
  type: GameEventType.MOVE_REQUESTED;
  payload: MoveDTO;
}

export interface MoveResultEvent extends BaseGameEvent {
  type: GameEventType.MOVE_RESULT;
  payload: {
    success: boolean;
    error?: string;
    checkDetected?: boolean;
    captureAttempted?: boolean;
  };
}

/**
 * Duel Events
 * These events handle duel initiation and allocation
 * Note: Actual BP values are filtered by the server before sending to clients
 */
export interface DuelInitiatedEvent extends BaseGameEvent {
  type: GameEventType.DUEL_INITIATED;
  payload: DuelInitiatedDTO;
}

export interface DuelAllocationEvent extends BaseGameEvent {
  type: GameEventType.DUEL_ALLOCATE;
  payload: BPAllocationDTO;
}

export interface DuelOutcomeEvent extends BaseGameEvent {
  type: GameEventType.DUEL_OUTCOME;
  payload: DuelOutcomeDTO;
}

/**
 * Retreat Events
 * These events handle tactical retreat options and selection
 */
export interface RetreatOptionsEvent extends BaseGameEvent {
  type: GameEventType.RETREAT_OPTIONS;
  payload: RetreatOptionsDTO;
}

export interface RetreatSelectionEvent extends BaseGameEvent {
  type: GameEventType.RETREAT_SELECTED;
  payload: RetreatSelectionDTO;
}

/**
 * Game Status Events
 * These events notify about game status changes
 */
/**
 * Game Over Event
 * Notifies that the game has ended
 */
export interface GameOverEvent extends BaseGameEvent {
  type: GameEventType.GAME_OVER;
  payload: {
    result: 'white_win' | 'black_win' | 'draw';
    reason: string;
  };
}

/**
 * Player Events
 * These events handle player connections and state
 */
export interface PlayerJoinedEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_JOINED;
  payload: PlayerDTO;
}

export interface PlayerLeftEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_LEFT;
  payload: {
    playerId: string;
  };
}

export interface PlayerReconnectedEvent extends BaseGameEvent {
  type: GameEventType.PLAYER_RECONNECTED;
  payload: {
    playerId: string;
  };
}

/**
 * Spectator Events
 * These events handle spectator connections
 */
export interface SpectatorJoinedEvent extends BaseGameEvent {
  type: GameEventType.SPECTATOR_JOINED;
  payload: SpectatorDTO;
}

export interface SpectatorLeftEvent extends BaseGameEvent {
  type: GameEventType.SPECTATOR_LEFT;
  payload: {
    spectatorId: string;
  };
}

/**
 * Chat Events
 * These events handle chat messages
 */
export interface ChatMessageEvent extends BaseGameEvent {
  type: GameEventType.CHAT_MESSAGE;
  payload: ChatMessageDTO;
}

/**
 * Game State Events
 * These events handle game state updates
 * This is the primary mechanism for the server to communicate state changes to clients
 * The server filters information based on player visibility rules before sending
 */
export interface GameStateUpdateEvent extends BaseGameEvent {
  type: GameEventType.GAME_STATE_UPDATE;
  payload: GameStateDTO;
}

/**
 * Error Events
 * These events handle error notifications
 */
export interface ErrorEvent extends BaseGameEvent {
  type: GameEventType.ERROR;
  payload: ErrorDTO;
}

/**
 * Game Control Events
 * These events handle game flow control
 */
export interface GameResignEvent extends BaseGameEvent {
  type: GameEventType.GAME_RESIGN;
  payload: PlayerDTO;
}

export interface GameOfferDrawEvent extends BaseGameEvent {
  type: GameEventType.GAME_OFFER_DRAW;
  payload: PlayerDTO;
}

export interface GameRespondDrawEvent extends BaseGameEvent {
  type: GameEventType.GAME_RESPOND_DRAW;
  payload: DrawResponseDTO;
}

/**
 * Connection Events
 * These events handle connection maintenance
 */
export interface ConnectionPingEvent extends BaseGameEvent {
  type: GameEventType.CONNECTION_PING;
  payload?: {
    timestamp: number;
  };
}

export interface ConnectionPongEvent extends BaseGameEvent {
  type: GameEventType.CONNECTION_PONG;
  payload: {
    timestamp: number;
    echo: number;
  };
}

/**
 * Union type of all shared events
 */
export type GameEvent =
  | MoveRequestEvent
  | MoveResultEvent
  | DuelInitiatedEvent
  | DuelAllocationEvent
  | DuelOutcomeEvent
  | RetreatOptionsEvent
  | RetreatSelectionEvent
  | GameOverEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | PlayerReconnectedEvent
  | SpectatorJoinedEvent
  | SpectatorLeftEvent
  | ChatMessageEvent
  | GameStateUpdateEvent
  | ErrorEvent
  | GameResignEvent
  | GameOfferDrawEvent
  | GameRespondDrawEvent
  | ConnectionPingEvent
  | ConnectionPongEvent
  | AuthChallengeEvent
  | AuthResponseEvent
  | AuthResultEvent
  | GameSessionJoinedEvent
  | StateSyncRequestEvent
  | StateSyncResponseEvent
  | BPCommitmentEvent
  | BPRevealEvent
  | ConnectionStatusEvent
  | ReconnectionEvent;
  
// Export validation functions
export * from './validation'; 