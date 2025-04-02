/**
 * Event Validation Utilities
 * 
 * This module provides validation functions for events to ensure
 * they adhere to domain boundaries and information architecture.
 */

import { EventType } from '../types';
import { 
  validateMoveDTO, 
  validateBPAllocationDTO, 
  validateRetreatDTO,
  validateDuelInitiatedDTO,
  validateDuelOutcomeDTO,
  validateRetreatOptionsDTO,
  validateChatMessageDTO,
  validatePlayerDTO,
  validateSpectatorDTO,
  validateGameStateDTO,
  validateGameId,
} from '../validation';

import type {
  MoveRequestEvent,
  MoveResultEvent,
  DuelInitiatedEvent,
  DuelAllocationEvent,
  DuelOutcomeEvent,
  RetreatOptionsEvent,
  RetreatSelectionEvent,
  GameOverEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerReconnectedEvent,
  SpectatorJoinedEvent,
  SpectatorLeftEvent,
  ChatMessageEvent,
  GameStateUpdateEvent,
  ErrorEvent,
  Event,
  GameResignEvent,
  GameOfferDrawEvent,
  GameRespondDrawEvent,
  ConnectionPingEvent,
} from './types';

// Type guards for event validation
function isMoveRequestEvent(event: Event): event is MoveRequestEvent {
    return event.type === EventType.MOVE_REQUEST;
}

function isDuelInitiatedEvent(event: Event): event is DuelInitiatedEvent {
    return event.type === EventType.DUEL_INITIATED;
}

function isGameResignEvent(event: Event): event is GameResignEvent {
    return event.type === EventType.GAME_RESIGN;
}

function isGameOfferDrawEvent(event: Event): event is GameOfferDrawEvent {
    return event.type === EventType.GAME_OFFER_DRAW;
}

function isGameRespondDrawEvent(event: Event): event is GameRespondDrawEvent {
    return event.type === EventType.GAME_RESPOND_DRAW;
}

function isConnectionPingEvent(event: Event): event is ConnectionPingEvent {
    return event.type === EventType.CONNECTION_PING;
}

/**
 * Validates a MoveRequestEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateMoveRequestEvent(event: MoveRequestEvent): boolean {
  return event.type === EventType.MOVE_REQUEST && validateMoveDTO(event.payload);
}

/**
 * Validates a MoveResultEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateMoveResultEvent(event: MoveResultEvent): boolean {
  if (event.type !== EventType.MOVE_RESULT) return false;
  
  const { payload } = event;
  return typeof payload.success === 'boolean' && 
    (payload.error === undefined || typeof payload.error === 'string') &&
    (payload.initiatesDuel === undefined || typeof payload.initiatesDuel === 'boolean');
}

/**
 * Validates a DuelInitiatedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelInitiatedEvent(event: DuelInitiatedEvent): boolean {
  return event.type === EventType.DUEL_INITIATED && validateDuelInitiatedDTO(event.payload);
}

/**
 * Validates a DuelAllocationEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelAllocationEvent(event: DuelAllocationEvent): boolean {
  return event.type === EventType.DUEL_ALLOCATE && validateBPAllocationDTO(event.payload);
}

/**
 * Validates a DuelOutcomeEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelOutcomeEvent(event: DuelOutcomeEvent): boolean {
  return event.type === EventType.DUEL_OUTCOME && validateDuelOutcomeDTO(event.payload);
}

/**
 * Validates a RetreatOptionsEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateRetreatOptionsEvent(event: RetreatOptionsEvent): boolean {
  return event.type === EventType.RETREAT_OPTIONS && validateRetreatOptionsDTO(event.payload);
}

/**
 * Validates a RetreatSelectionEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateRetreatSelectionEvent(event: RetreatSelectionEvent): boolean {
  return event.type === EventType.RETREAT_SELECT && validateRetreatDTO(event.payload);
}
/**
 * Validates a GameOverEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameOverEvent(event: GameOverEvent): boolean {
  if (event.type !== EventType.GAME_OVER) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && 
    ['white_win', 'black_win', 'draw'].includes(payload.result) &&
    typeof payload.reason === 'string';
}

/**
 * Validates a PlayerJoinedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerJoinedEvent(event: PlayerJoinedEvent): boolean {
  return event.type === EventType.PLAYER_JOINED && validatePlayerDTO(event.payload);
}

/**
 * Validates a PlayerLeftEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerLeftEvent(event: PlayerLeftEvent): boolean {
  if (event.type !== EventType.PLAYER_LEFT) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && typeof payload.playerId === 'string';
}

/**
 * Validates a PlayerReconnectedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerReconnectedEvent(event: PlayerReconnectedEvent): boolean {
  if (event.type !== EventType.PLAYER_RECONNECTED) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && typeof payload.playerId === 'string';
}

/**
 * Validates a SpectatorJoinedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateSpectatorJoinedEvent(event: SpectatorJoinedEvent): boolean {
  return event.type === EventType.SPECTATOR_JOINED && validateSpectatorDTO(event.payload);
}

/**
 * Validates a SpectatorLeftEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateSpectatorLeftEvent(event: SpectatorLeftEvent): boolean {
  if (event.type !== EventType.SPECTATOR_LEFT) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && typeof payload.spectatorId === 'string';
}

/**
 * Validates a ChatMessageEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateChatMessageEvent(event: ChatMessageEvent): boolean {
  return event.type === EventType.CHAT_MESSAGE && validateChatMessageDTO(event.payload);
}

/**
 * Validates a GameStateUpdateEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameStateUpdateEvent(event: GameStateUpdateEvent): boolean {
  return event.type === EventType.GAME_STATE_UPDATE && validateGameStateDTO(event.payload);
}

/**
 * Validates an ErrorEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateErrorEvent(event: ErrorEvent): boolean {
  if (event.type !== EventType.ERROR) return false;
  
  const { payload } = event;
  return typeof payload.code === 'string' && typeof payload.message === 'string';
}

/**
 * Validates a game resign event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateGameResignEvent(event: GameResignEvent): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, sequence, payload } = event;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof sequence === 'number' && sequence >= 0 &&
    validatePlayerDTO(payload)
  );
}

/**
 * Validates a game offer draw event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateGameOfferDrawEvent(event: GameOfferDrawEvent): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, sequence, payload } = event;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof sequence === 'number' && sequence >= 0 &&
    validatePlayerDTO(payload)
  );
}

/**
 * Validates a game respond draw event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateGameRespondDrawEvent(event: GameRespondDrawEvent): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, sequence, payload } = event;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof payload.accept === 'boolean' &&
    typeof sequence === 'number' && sequence >= 0
  );
}

/**
 * Validates a connection ping event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateConnectionPingEvent(event: ConnectionPingEvent): boolean {
  if (!event) return false;
  
  if (event.type !== EventType.CONNECTION_PING) return false;
  
  // Payload is optional in ConnectionPingEvent
  if (event.payload) {
    return typeof event.payload.timestamp === 'number';
  }
  
  return true;
}

/**
 * Validates a GameEvent
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateEvent(event: Event): boolean {
  if (!event || !event.type) return false;

  switch (event.type) {
    case EventType.MOVE_REQUEST:
      return isMoveRequestEvent(event) && validateMoveRequestEvent(event);
    case EventType.MOVE_RESULT:
      return validateMoveResultEvent(event as MoveResultEvent);
    case EventType.DUEL_INITIATED:
      return isDuelInitiatedEvent(event) && validateDuelInitiatedEvent(event);
    case EventType.DUEL_ALLOCATE:
      return validateDuelAllocationEvent(event as DuelAllocationEvent);
    case EventType.DUEL_OUTCOME:
      return validateDuelOutcomeEvent(event as DuelOutcomeEvent);
    case EventType.RETREAT_OPTIONS:
      return validateRetreatOptionsEvent(event as RetreatOptionsEvent);
    case EventType.RETREAT_SELECT:
      return validateRetreatSelectionEvent(event as RetreatSelectionEvent);
    case EventType.GAME_OVER:
      return validateGameOverEvent(event as GameOverEvent);
    case EventType.PLAYER_JOINED:
      return validatePlayerJoinedEvent(event as PlayerJoinedEvent);
    case EventType.PLAYER_LEFT:
      return validatePlayerLeftEvent(event as PlayerLeftEvent);
    case EventType.PLAYER_RECONNECTED:
      return validatePlayerReconnectedEvent(event as PlayerReconnectedEvent);
    case EventType.SPECTATOR_JOINED:
      return validateSpectatorJoinedEvent(event as SpectatorJoinedEvent);
    case EventType.SPECTATOR_LEFT:
      return validateSpectatorLeftEvent(event as SpectatorLeftEvent);
    case EventType.CHAT_MESSAGE:
      return validateChatMessageEvent(event as ChatMessageEvent);
    case EventType.GAME_STATE_UPDATE:
      return validateGameStateUpdateEvent(event as GameStateUpdateEvent);
    case EventType.ERROR:
      return validateErrorEvent(event as ErrorEvent);
    case EventType.GAME_RESIGN:
      return isGameResignEvent(event) && validateGameResignEvent(event);
    case EventType.GAME_OFFER_DRAW:
      return isGameOfferDrawEvent(event) && validateGameOfferDrawEvent(event);
    case EventType.GAME_RESPOND_DRAW:
      return isGameRespondDrawEvent(event) && validateGameRespondDrawEvent(event);
    case EventType.CONNECTION_PING:
      return isConnectionPingEvent(event) && validateConnectionPingEvent(event);
    default:
      return false;
  }
} 