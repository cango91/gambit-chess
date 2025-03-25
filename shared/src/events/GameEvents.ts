import { 
  BPAllocationRequest, 
  CreateGameRequest, 
  CreateGameResult, 
  DuelResult, 
  GameStateDTO, 
  MoveRequest, 
  MoveResult, 
  PlayerColor,
  TacticalRetreatRequest 
} from '../types';

/**
 * WebSocket event names for game communication
 */
export enum GameEvents {
  // Client-to-server events
  CREATE_GAME = 'create_game',
  JOIN_GAME = 'join_game',
  SPECTATE_GAME = 'spectate_game',
  MAKE_MOVE = 'make_move',
  ALLOCATE_BP = 'allocate_bp',
  TACTICAL_RETREAT = 'tactical_retreat',
  REQUEST_GAME_HISTORY = 'request_game_history',
  
  // Standard chess game events
  RESIGN = 'resign',
  OFFER_DRAW = 'offer_draw',
  ACCEPT_DRAW = 'accept_draw',
  REJECT_DRAW = 'reject_draw',
  REQUEST_TAKEBACK = 'request_takeback',
  ACCEPT_TAKEBACK = 'accept_takeback',
  REJECT_TAKEBACK = 'reject_takeback',
  CHAT_MESSAGE = 'chat_message',
  TIME_FLAG = 'time_flag',
  REQUEST_MORE_TIME = 'request_more_time',
  
  // Server-to-client events
  GAME_CREATED = 'game_created',
  GAME_JOINED = 'game_joined',
  SPECTATING = 'spectating',
  GAME_STATE_UPDATED = 'game_state_updated',
  DUEL_STARTED = 'duel_started',
  DUEL_RESOLVED = 'duel_resolved',
  TACTICAL_RETREAT_AVAILABLE = 'tactical_retreat_available',
  GAME_HISTORY_UPDATE = 'game_history_update',
  GAME_OVER = 'game_over',
  DRAW_OFFERED = 'draw_offered',
  TAKEBACK_REQUESTED = 'takeback_requested',
  CHAT_RECEIVED = 'chat_received',
  TIME_UPDATE = 'time_update',
  ERROR = 'error'
}

/**
 * Base interface for all WebSocket messages
 */
export interface WSMessage {
  event: GameEvents;
}

/**
 * Interface for game history request events
 */
export interface RequestGameHistoryEvent extends WSMessage {
  event: GameEvents.REQUEST_GAME_HISTORY;
  gameId: string;
}

/**
 * Interface for game history response events
 */
export interface GameHistoryUpdateEvent extends WSMessage {
  event: GameEvents.GAME_HISTORY_UPDATE;
  gameId: string;
  history: {
    moves: Array<{
      id: string;
      moveNumber: number;
      player: string;
      san: string;
      extended: string;
    }>;
    notationText: string;
  };
}

/**
 * Interface for spectating a game
 */
export interface SpectateGameEvent extends WSMessage {
  event: GameEvents.SPECTATE_GAME;
  gameId: string;
}

/**
 * Interface for spectating response
 */
export interface SpectatingEvent extends WSMessage {
  event: GameEvents.SPECTATING;
  gameId: string;
  success: boolean;
  error?: string;
}

/**
 * Interface for resign event
 */
export interface ResignEvent extends WSMessage {
  event: GameEvents.RESIGN;
  gameId: string;
}

/**
 * Interface for offer draw event
 */
export interface OfferDrawEvent extends WSMessage {
  event: GameEvents.OFFER_DRAW;
  gameId: string;
}

/**
 * Interface for response to draw offer
 */
export interface DrawResponseEvent extends WSMessage {
  event: GameEvents.ACCEPT_DRAW | GameEvents.REJECT_DRAW;
  gameId: string;
}

/**
 * Interface for draw offered notification
 */
export interface DrawOfferedEvent extends WSMessage {
  event: GameEvents.DRAW_OFFERED;
  gameId: string;
  offeredBy: PlayerColor;
}

/**
 * Interface for takeback request
 */
export interface RequestTakebackEvent extends WSMessage {
  event: GameEvents.REQUEST_TAKEBACK;
  gameId: string;
  moveCount?: number; // Optional: number of moves to take back, defaults to 1
}

/**
 * Interface for takeback request notification
 */
export interface TakebackRequestedEvent extends WSMessage {
  event: GameEvents.TAKEBACK_REQUESTED;
  gameId: string;
  requestedBy: PlayerColor;
  moveCount: number;
}

/**
 * Interface for takeback response
 */
export interface TakebackResponseEvent extends WSMessage {
  event: GameEvents.ACCEPT_TAKEBACK | GameEvents.REJECT_TAKEBACK;
  gameId: string;
}

/**
 * Interface for chat messages
 */
export interface ChatMessageEvent extends WSMessage {
  event: GameEvents.CHAT_MESSAGE;
  gameId: string;
  message: string;
}

/**
 * Interface for received chat notification
 */
export interface ChatReceivedEvent extends WSMessage {
  event: GameEvents.CHAT_RECEIVED;
  gameId: string;
  message: string;
  sender: PlayerColor;
  timestamp: number;
}

/**
 * Interface for time flag notification
 */
export interface TimeFlagEvent extends WSMessage {
  event: GameEvents.TIME_FLAG;
  gameId: string;
  player: PlayerColor;
}

/**
 * Interface for requesting more time
 */
export interface RequestMoreTimeEvent extends WSMessage {
  event: GameEvents.REQUEST_MORE_TIME;
  gameId: string;
  requestedSeconds: number;
}

/**
 * Interface for time update notification
 */
export interface TimeUpdateEvent extends WSMessage {
  event: GameEvents.TIME_UPDATE;
  gameId: string;
  whiteTimeMs: number;
  blackTimeMs: number;
}

/**
 * Union type of all valid WebSocket messages
 */
export type WebSocketMessage = 
  | WSMessage 
  | RequestGameHistoryEvent 
  | GameHistoryUpdateEvent 
  | SpectateGameEvent 
  | SpectatingEvent
  | ResignEvent
  | OfferDrawEvent
  | DrawResponseEvent
  | DrawOfferedEvent
  | RequestTakebackEvent
  | TakebackRequestedEvent
  | TakebackResponseEvent
  | ChatMessageEvent
  | ChatReceivedEvent
  | TimeFlagEvent
  | RequestMoreTimeEvent
  | TimeUpdateEvent; 