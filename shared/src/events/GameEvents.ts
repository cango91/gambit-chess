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
 * WebSocket event names for client-server communication
 */
export enum GameEventType {
  // Client to Server events
  CREATE_GAME = 'game:create',
  JOIN_GAME = 'game:join',
  MAKE_MOVE = 'game:move',
  ALLOCATE_BP = 'game:allocate_bp',
  TACTICAL_RETREAT = 'game:tactical_retreat',
  
  // Server to Client events
  GAME_CREATED = 'game:created',
  GAME_JOINED = 'game:joined',
  GAME_STATE_UPDATED = 'game:state_updated',
  MOVE_RESULT = 'game:move_result',
  DUEL_STARTED = 'game:duel_started',
  DUEL_RESULT = 'game:duel_result',
  GAME_ERROR = 'game:error',
  GAME_OVER = 'game:over'
}

/**
 * Base interface for all game events
 */
export interface GameEvent {
  type: GameEventType;
  gameId: string;
}

/**
 * Client Events
 */

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

/**
 * Server Events
 */

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

// Union type of all client events
export type ClientGameEvent = 
  | CreateGameEvent
  | JoinGameEvent
  | MakeMoveEvent
  | AllocateBPEvent
  | TacticalRetreatEvent;

// Union type of all server events
export type ServerGameEvent = 
  | GameCreatedEvent
  | GameJoinedEvent
  | GameStateUpdatedEvent
  | MoveResultEvent
  | DuelStartedEvent
  | DuelResultEvent
  | GameErrorEvent
  | GameOverEvent; 