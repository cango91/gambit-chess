/**
 * Event Type Definitions
 * 
 * This module defines the type structure for all game events
 * following domain boundary rules.
 */

import { EventType } from '../types';
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
 * Base Event Interface
 * 
 * This interface defines the base event structure that all shared events must implement.
 * It ensures type safety and consistency across all event types.
 */
interface BaseEvent {
    /** Event type */
    type: EventType;
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
export interface AuthChallengeEvent extends BaseEvent {
    type: EventType.AUTH_CHALLENGE;
    payload: {
      challenge: string;
      timestamp: number;
    };
  }
  
/**
 * Authentication Response Event
 * This event handles the response to an authentication challenge
 */
  export interface AuthResponseEvent extends BaseEvent {
    type: EventType.AUTH_RESPONSE;
    payload: {
      challenge: string;
      signature: string;
      token: string;
      timestamp: number;
    };
  }
  
/**
 * Authentication Result Event
 * This event handles the result of an authentication challenge
 */
  export interface AuthResultEvent extends BaseEvent {
    type: EventType.AUTH_RESULT;
    payload: {
      success: boolean;
      error?: string;
      playerId?: string;
      gameId?: string;
    };
  }


/**
 * Game Session Joined Event
 * This event handles the joining of a game session
 */
export interface GameSessionJoinedEvent extends BaseEvent {
    type: EventType.SESSION_JOINED;
    payload: {
      gameId: string;
      playerId: string;
      playerColor: string;
      initialState: GameStateDTO;
    };
  }
  
/**
 * State Sync Request Event
 * This event handles the request for a state sync
 */
  export interface StateSyncRequestEvent extends BaseEvent {
    type: EventType.STATE_SYNC_REQUEST;
    payload: {
      lastSequence: number;
      checksum: string;
    };
  }
  
/**
 * State Sync Response Event
 * This event handles the response to a state sync request
 */
  export interface StateSyncResponseEvent extends BaseEvent {
    type: EventType.STATE_SYNC_RESPONSE;
    payload: GameStateDTO & {
      sequence: number;
      checksum: string;
    };
  }
  

  /**
   * Connection Status Event
   * This event handles the status of a connection
   */
  export interface ConnectionStatusEvent extends BaseEvent {
    type: EventType.CONNECTION_STATUS;
    payload: {
      status: 'connected' | 'reconnecting' | 'disconnected';
      playerId: string;
    };
  }

  /**
   * Reconnection Event
   * This event handles the reconnection of a player
   */
  export interface ReconnectionEvent extends BaseEvent {
    type: EventType.CONNECTION_RECONNECT;
    payload: {
      playerId: string;
      token: string;
    };
  }

/**
 * Move Events
 * These events handle move requests and results
 */
export interface MoveRequestEvent extends BaseEvent {
    type: EventType.MOVE_REQUEST;
    payload: MoveDTO;
}

/**
 * Move Result Event
 * This event handles move results and initiates duels if applicable
 */
export interface MoveResultEvent extends BaseEvent {
    type: EventType.MOVE_RESULT;
    payload: {
        success: boolean;
        error?: string;
        initiatesDuel?: boolean;
    };
}

/**
 * Duel Initiation Event
 * This event handles the initiation of a duel
 */
export interface DuelInitiatedEvent extends BaseEvent {
    type: EventType.DUEL_INITIATED;
    payload: DuelInitiatedDTO;
}

/**
 * Duel Allocation Event
 * This event handles the allocation of BP to the duel
 */
export interface DuelAllocationEvent extends BaseEvent {
    type: EventType.DUEL_ALLOCATE;
    payload: BPAllocationDTO;
}

/**
 * Duel Outcome Event
 * This event handles the outcome of a duel
 */
export interface DuelOutcomeEvent extends BaseEvent {
    type: EventType.DUEL_OUTCOME;
    payload: DuelOutcomeDTO;
}

/**
 * Retreat Options Event
 * This event handles the options for a retreat
 */
export interface RetreatOptionsEvent extends BaseEvent {
    type: EventType.RETREAT_OPTIONS;
    payload: RetreatOptionDTO[];
}

/**
 * Retreat Selection Event
 * This event handles the selection of a retreat
 */
export interface RetreatSelectionEvent extends BaseEvent {
    type: EventType.RETREAT_SELECT;
    payload: Partial<RetreatOptionDTO>;
}

/**
 * Game State Update Event
 * This event handles the update of the game state
 */
export interface GameStateUpdateEvent extends BaseEvent {
    type: EventType.GAME_STATE_UPDATE;
    payload: GameStateDTO;
}

/**
 * Game Over Event
 * This event handles the end of the game
 */
export interface GameOverEvent extends BaseEvent {
    type: EventType.GAME_OVER;
    payload: {
        result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
        reason: string;
    };
}

/**
 * Player Joined Event
 * This event handles the joining of a player
 */
export interface PlayerJoinedEvent extends BaseEvent {
    type: EventType.PLAYER_JOINED;
    payload: PlayerDTO;
}

/**
 * Player Left Event
 * This event handles the leaving of a player
 */
export interface PlayerLeftEvent extends BaseEvent {
    type: EventType.PLAYER_LEFT;
    payload: {
        playerId: string;
    };
}

/**
 * Player Reconnected Event
 * This event handles the re-connection of a player
 */
export interface PlayerReconnectedEvent extends BaseEvent {
    type: EventType.PLAYER_RECONNECTED;
    payload: {
        playerId: string;
    };
}

/**
 * Spectator Joined Event
 * This event handles the joining of a spectator
 */
export interface SpectatorJoinedEvent extends BaseEvent {
    type: EventType.SPECTATOR_JOINED;
    payload: SpectatorDTO;
}

/**
 * Spectator Left Event
 * This event handles the leaving of a spectator
 */
export interface SpectatorLeftEvent extends BaseEvent {
    type: EventType.SPECTATOR_LEFT;
    payload: {
        spectatorId: string;
    };
}

/**
 * Game Resign Event
 * This event handles the resignation of a player
 */
export interface GameResignEvent extends BaseEvent {
    type: EventType.GAME_RESIGN;
    payload: PlayerDTO;
}

/**
 * Game Offer Draw Event
 * This event handles the offer of a draw
 */
export interface GameOfferDrawEvent extends BaseEvent {
    type: EventType.GAME_OFFER_DRAW;
    payload: PlayerDTO;
}

/**
 * Game Respond Draw Event
 * This event handles the response to a draw offer
 */
export interface GameRespondDrawEvent extends BaseEvent {
    type: EventType.GAME_RESPOND_DRAW;
    payload: {
        accept: boolean;
    };
}

/**
 * Connection Ping Event
 * This event handles the ping of a connection
 */
export interface ConnectionPingEvent extends BaseEvent {
    type: EventType.CONNECTION_PING;
    payload?: {
        timestamp: number;
    };
}

/**
 * Connection Pong Event
 * This event handles the pong of a connection
 */
export interface ConnectionPongEvent extends BaseEvent {
    type: EventType.CONNECTION_PONG;
    payload: {
      timestamp: number;
      echo: number;
    };
  }
/**
 * Chat Message Event
 * This event handles the message of a chat
 */
export interface ChatMessageEvent extends BaseEvent {
    type: EventType.CHAT_MESSAGE;
    payload: ChatMessageDTO;
}

/**
 * Error Event
 * This event handles the error of an event
 */
export interface ErrorEvent extends BaseEvent {
    type: EventType.ERROR;
    payload: {
        code: string;
        message: string;
    };
} 

/**
 * Union type of all shared events
 */
export type Event =
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
  | ConnectionStatusEvent
  | ReconnectionEvent; 