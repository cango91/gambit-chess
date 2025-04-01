/**
 * Event Type Definitions
 * 
 * This module defines the type structure for all game events
 * following domain boundary rules.
 */

import { GameEventType } from '../types';
import type {
    MoveDTO,
    BPAllocationDTO,
    RetreatOptionDTO,
    DuelInitiatedDTO,
    DuelOutcomeDTO,
    GameStateDTO,
    PlayerDTO,
    SpectatorDTO,
    ChatMessageDTO,
} from '../dtos';

/**
 * Base Game Event interface
 * All game events must implement this interface
 */
export interface GameEvent {
    type: GameEventType;
    gameId: string;
    sequence: number;
    timestamp: number;
    payload?: unknown;
}

// Move Events
export interface MoveRequestEvent extends GameEvent {
    type: GameEventType.MOVE_REQUESTED;
    payload: MoveDTO;
}

export interface MoveResultEvent extends GameEvent {
    type: GameEventType.MOVE_RESULT;
    payload: {
        success: boolean;
        error?: string;
        checkDetected?: boolean;
        captureAttempted?: boolean;
    };
}

// Duel Events
export interface DuelInitiatedEvent extends GameEvent {
    type: GameEventType.DUEL_INITIATED;
    payload: DuelInitiatedDTO;
}

export interface DuelAllocationEvent extends GameEvent {
    type: GameEventType.DUEL_ALLOCATE;
    payload: BPAllocationDTO;
}

export interface DuelOutcomeEvent extends GameEvent {
    type: GameEventType.DUEL_OUTCOME;
    payload: DuelOutcomeDTO;
}

// Retreat Events
export interface RetreatOptionsEvent extends GameEvent {
    type: GameEventType.RETREAT_OPTIONS;
    payload: RetreatOptionDTO[];
}

export interface RetreatSelectionEvent extends GameEvent {
    type: GameEventType.RETREAT_SELECTED;
    payload: Partial<RetreatOptionDTO>;
}

// Game Flow Events
export interface GameStateUpdateEvent extends GameEvent {
    type: GameEventType.GAME_STATE_UPDATE;
    payload: GameStateDTO;
}

export interface GameOverEvent extends GameEvent {
    type: GameEventType.GAME_OVER;
    payload: {
        result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
        reason: string;
    };
}

// Player Events
export interface PlayerJoinedEvent extends GameEvent {
    type: GameEventType.PLAYER_JOINED;
    payload: PlayerDTO;
}

export interface PlayerLeftEvent extends GameEvent {
    type: GameEventType.PLAYER_LEFT;
    payload: {
        playerId: string;
    };
}

export interface PlayerReconnectedEvent extends GameEvent {
    type: GameEventType.PLAYER_RECONNECTED;
    payload: {
        playerId: string;
    };
}

// Spectator Events
export interface SpectatorJoinedEvent extends GameEvent {
    type: GameEventType.SPECTATOR_JOINED;
    payload: SpectatorDTO;
}

export interface SpectatorLeftEvent extends GameEvent {
    type: GameEventType.SPECTATOR_LEFT;
    payload: {
        spectatorId: string;
    };
}

// Game Control Events
export interface GameResignEvent extends GameEvent {
    type: GameEventType.GAME_RESIGN;
    payload: PlayerDTO;
}

export interface GameOfferDrawEvent extends GameEvent {
    type: GameEventType.GAME_OFFER_DRAW;
    payload: PlayerDTO;
}

export interface GameRespondDrawEvent extends GameEvent {
    type: GameEventType.GAME_RESPOND_DRAW;
    payload: {
        accept: boolean;
    };
}

// Connection Events
export interface ConnectionPingEvent extends GameEvent {
    type: GameEventType.CONNECTION_PING;
    payload?: {
        timestamp: number;
    };
}

// Chat Events
export interface ChatMessageEvent extends GameEvent {
    type: GameEventType.CHAT_MESSAGE;
    payload: ChatMessageDTO;
}

// Error Events
export interface ErrorEvent extends GameEvent {
    type: GameEventType.ERROR;
    payload: {
        code: string;
        message: string;
    };
} 