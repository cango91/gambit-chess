/**
 * Shared Event Definitions for Gambit Chess
 * 
 * This module defines event interfaces that can be safely shared between client and server
 * according to domain boundaries and information architecture rules.
 */

import {
  MoveDTO,
  BPAllocationDTO,
  RetreatDTO,
  DuelInitiatedDTO,
  DuelOutcomeDTO,
  RetreatOptionsDTO,
  ChatMessageDTO,
  PlayerDTO,
  SpectatorDTO,
  BPUpdateDTO,
  GameStateDTO,
  ErrorDTO,
  ResignDTO,
  DrawOfferDTO,
  DrawResponseDTO,
  ConnectionPingDTO,
  SpectatorJoinDTO,
  PlayerNameDTO
} from '../dtos';
import { GamePhase, PieceColor, Position } from '../types';

/**
 * Event Categories
 * 
 * Domain-safe events that can be shared between client and server.
 * These events respect information visibility rules and domain boundaries.
 */

/**
 * Move Events
 * These events handle basic move requests and validation
 */
export interface MoveRequestEvent {
  type: 'move.request';
  payload: MoveDTO;
}

export interface MoveResultEvent {
  type: 'move.result';
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
export interface DuelInitiatedEvent {
  type: 'duel.initiated';
  payload: DuelInitiatedDTO;
}

export interface DuelAllocationEvent {
  type: 'duel.allocate';
  payload: BPAllocationDTO;
}

export interface DuelOutcomeEvent {
  type: 'duel.outcome';
  payload: DuelOutcomeDTO;
}

/**
 * Retreat Events
 * These events handle tactical retreat options and selection
 */
export interface RetreatOptionsEvent {
  type: 'retreat.options';
  payload: RetreatOptionsDTO;
}

export interface RetreatSelectionEvent {
  type: 'retreat.select';
  payload: RetreatDTO;
}

/**
 * Game Status Events
 * These events notify about game status changes
 */
export interface CheckEvent {
  type: 'game.check';
  payload: {
    gameId: string;
    kingPosition: Position;
    color: PieceColor;
  };
}

/**
 * Game Over Event
 * Notifies that the game has ended
 */
export interface GameOverEvent {
  type: 'game.over';
  payload: {
    gameId: string;
    result: 'white_win' | 'black_win' | 'draw';
    reason: string;
  };
}

/**
 * Player Events
 * These events handle player connections and state
 */
export interface PlayerJoinedEvent {
  type: 'player.joined';
  payload: PlayerDTO;
}

export interface PlayerLeftEvent {
  type: 'player.left';
  payload: {
    gameId: string;
    playerId: string;
  };
}

export interface PlayerReconnectedEvent {
  type: 'player.reconnected';
  payload: {
    gameId: string;
    playerId: string;
  };
}

/**
 * Spectator Events
 * These events handle spectator connections
 */
export interface SpectatorJoinedEvent {
  type: 'spectator.joined';
  payload: SpectatorDTO;
}

export interface SpectatorLeftEvent {
  type: 'spectator.left';
  payload: {
    gameId: string;
    spectatorId: string;
  };
}

/**
 * Chat Events
 * These events handle chat messages
 */
export interface ChatMessageEvent {
  type: 'chat.message';
  payload: ChatMessageDTO;
}

/**
 * Game State Events
 * These events handle game state updates
 * This is the primary mechanism for the server to communicate state changes to clients
 * The server filters information based on player visibility rules before sending
 */
export interface GameStateUpdateEvent {
  type: 'gameState.update';
  payload: GameStateDTO;
}

/**
 * Error Events
 * These events handle error notifications
 */
export interface ErrorEvent {
  type: 'error';
  payload: ErrorDTO;
}

/**
 * Game Control Events
 * These events handle game flow control
 */
export interface GameResignEvent {
  type: 'game.resign';
  payload: ResignDTO;
}

export interface GameOfferDrawEvent {
  type: 'game.offerDraw';
  payload: DrawOfferDTO;
}

export interface GameRespondDrawEvent {
  type: 'game.respondDraw';
  payload: DrawResponseDTO;
}

/**
 * Connection Events
 * These events handle connection maintenance
 */
export interface ConnectionPingEvent {
  type: 'connection.ping';
  payload: ConnectionPingDTO;
}

/**
 * Player Management Events
 * These events handle player information
 */
export interface PlayerSetNameEvent {
  type: 'player.setName';
  payload: PlayerNameDTO;
}

/**
 * Spectator Management Events
 * These events handle spectator joining
 */
export interface SpectatorJoinEvent {
  type: 'spectator.join';
  payload: SpectatorJoinDTO;
}

/**
 * Union type of all shared events
 */
export type SharedEvent =
  | MoveRequestEvent
  | MoveResultEvent
  | DuelInitiatedEvent
  | DuelAllocationEvent
  | DuelOutcomeEvent
  | RetreatOptionsEvent
  | RetreatSelectionEvent
  | CheckEvent
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
  | PlayerSetNameEvent
  | SpectatorJoinEvent;
  
// Export validation functions
export * from './validation'; 