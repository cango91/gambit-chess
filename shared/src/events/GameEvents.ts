import { 
  BPAllocationRequest, 
  CreateGameRequest, 
  CreateGameResult, 
  DuelResult, 
  GameStateDTO, 
  MoveRequest, 
  MoveResult, 
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
 * Legacy event system - will be migrated to the new system above
 */
export enum GameEventType {
  // Client to Server events
  CREATE_GAME = 'game:create',
  JOIN_GAME = 'game:join',
  MAKE_MOVE = 'game:move',
  ALLOCATE_BP = 'game:allocate_bp',
  TACTICAL_RETREAT = 'game:tactical_retreat',
  REQUEST_GAME_HISTORY = 'game:request_history',
  SPECTATE_GAME = 'game:spectate',
  
  // Server to Client events
  GAME_CREATED = 'game:created',
  GAME_JOINED = 'game:joined',
  GAME_STATE_UPDATED = 'game:state_updated',
  MOVE_RESULT = 'game:move_result',
  DUEL_STARTED = 'game:duel_started',
  DUEL_RESULT = 'game:duel_result',
  GAME_ERROR = 'game:error',
  GAME_OVER = 'game:over',
  GAME_HISTORY = 'game:history',
  SPECTATING = 'game:spectating'
}

export interface GameEvent {
  type: GameEventType;
  gameId: string;
}

// Client to Server event interfaces

export interface CreateGameEvent extends GameEvent {
  type: GameEventType.CREATE_GAME;
  data: CreateGameRequest;
}

export interface JoinGameEvent extends GameEvent {
  type: GameEventType.JOIN_GAME;
}

export interface MakeMoveEvent extends GameEvent {
  type: GameEventType.MAKE_MOVE;
  data: MoveRequest;
}

export interface AllocateBPEvent extends GameEvent {
  type: GameEventType.ALLOCATE_BP;
  data: BPAllocationRequest;
}

export interface TacticalRetreatEvent extends GameEvent {
  type: GameEventType.TACTICAL_RETREAT;
  data: TacticalRetreatRequest;
}

export interface RequestGameHistoryLegacyEvent extends GameEvent {
  type: GameEventType.REQUEST_GAME_HISTORY;
}

export interface SpectateGameLegacyEvent extends GameEvent {
  type: GameEventType.SPECTATE_GAME;
}

// Server to Client event interfaces

export interface GameCreatedEvent extends GameEvent {
  type: GameEventType.GAME_CREATED;
  data: CreateGameResult;
}

export interface GameJoinedEvent extends GameEvent {
  type: GameEventType.GAME_JOINED;
  data: {
    success: boolean;
    playerRole: string;
    error?: string;
  };
}

export interface GameStateUpdatedEvent extends GameEvent {
  type: GameEventType.GAME_STATE_UPDATED;
  data: GameStateDTO;
}

export interface MoveResultEvent extends GameEvent {
  type: GameEventType.MOVE_RESULT;
  data: MoveResult;
}

export interface DuelStartedEvent extends GameEvent {
  type: GameEventType.DUEL_STARTED;
  data: {
    attackerPieceId: string;
    defenderPieceId: string;
  };
}

export interface DuelResultEvent extends GameEvent {
  type: GameEventType.DUEL_RESULT;
  data: DuelResult;
}

export interface GameErrorEvent extends GameEvent {
  type: GameEventType.GAME_ERROR;
  data: {
    message: string;
    code: string;
  };
}

export interface GameOverEvent extends GameEvent {
  type: GameEventType.GAME_OVER;
  data: {
    winner: string | null;
    reason: string;
  };
}

export interface GameHistoryEvent extends GameEvent {
  type: GameEventType.GAME_HISTORY;
  data: {
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

export interface SpectatingLegacyEvent extends GameEvent {
  type: GameEventType.SPECTATING;
  data: {
    success: boolean;
    error?: string;
  };
}

export type ClientGameEvent = 
  | CreateGameEvent
  | JoinGameEvent
  | MakeMoveEvent
  | AllocateBPEvent
  | TacticalRetreatEvent
  | RequestGameHistoryLegacyEvent
  | SpectateGameLegacyEvent;

export type ServerGameEvent = 
  | GameCreatedEvent
  | GameJoinedEvent
  | GameStateUpdatedEvent
  | MoveResultEvent
  | DuelStartedEvent
  | DuelResultEvent
  | GameErrorEvent
  | GameOverEvent
  | GameHistoryEvent
  | SpectatingLegacyEvent; 