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
 * Union type of all valid WebSocket messages
 */
export type WebSocketMessage = WSMessage | RequestGameHistoryEvent | GameHistoryUpdateEvent | SpectateGameEvent | SpectatingEvent; 