/**
 * Event Validation Utilities
 * 
 * This module provides validation functions for events to ensure
 * they adhere to domain boundaries and information architecture.
 */

import { GameEventType } from '..';
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

import {
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
  GameEvent,
  GameResignEvent,
  GameOfferDrawEvent,
  GameRespondDrawEvent,
  ConnectionPingEvent,
} from './index';

/**
 * Validates a MoveRequestEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateMoveRequestEvent(event: MoveRequestEvent): boolean {
  return event.type === GameEventType.MOVE_REQUESTED && validateMoveDTO(event.payload);
}

/**
 * Validates a MoveResultEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateMoveResultEvent(event: MoveResultEvent): boolean {
  if (event.type !== GameEventType.MOVE_RESULT) return false;
  
  const { payload } = event;
  return typeof payload.success === 'boolean' && 
    (payload.error === undefined || typeof payload.error === 'string') &&
    (payload.checkDetected === undefined || typeof payload.checkDetected === 'boolean') &&
    (payload.captureAttempted === undefined || typeof payload.captureAttempted === 'boolean');
}

/**
 * Validates a DuelInitiatedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelInitiatedEvent(event: DuelInitiatedEvent): boolean {
  return event.type === GameEventType.DUEL_INITIATED && validateDuelInitiatedDTO(event.payload);
}

/**
 * Validates a DuelAllocationEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelAllocationEvent(event: DuelAllocationEvent): boolean {
  return event.type === GameEventType.DUEL_ALLOCATE && validateBPAllocationDTO(event.payload);
}

/**
 * Validates a DuelOutcomeEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelOutcomeEvent(event: DuelOutcomeEvent): boolean {
  return event.type === GameEventType.DUEL_OUTCOME && validateDuelOutcomeDTO(event.payload);
}

/**
 * Validates a RetreatOptionsEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateRetreatOptionsEvent(event: RetreatOptionsEvent): boolean {
  return event.type === GameEventType.RETREAT_OPTIONS && validateRetreatOptionsDTO(event.payload);
}

/**
 * Validates a RetreatSelectionEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateRetreatSelectionEvent(event: RetreatSelectionEvent): boolean {
  return event.type === GameEventType.RETREAT_SELECTED && validateRetreatDTO(event.payload);
}
/**
 * Validates a GameOverEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameOverEvent(event: GameOverEvent): boolean {
  if (event.type !== GameEventType.GAME_OVER) return false;
  
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
  return event.type === GameEventType.PLAYER_JOINED && validatePlayerDTO(event.payload);
}

/**
 * Validates a PlayerLeftEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerLeftEvent(event: PlayerLeftEvent): boolean {
  if (event.type !== GameEventType.PLAYER_LEFT) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && typeof payload.playerId === 'string';
}

/**
 * Validates a PlayerReconnectedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerReconnectedEvent(event: PlayerReconnectedEvent): boolean {
  if (event.type !== GameEventType.PLAYER_RECONNECTED) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && typeof payload.playerId === 'string';
}

/**
 * Validates a SpectatorJoinedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateSpectatorJoinedEvent(event: SpectatorJoinedEvent): boolean {
  return event.type === GameEventType.SPECTATOR_JOINED && validateSpectatorDTO(event.payload);
}

/**
 * Validates a SpectatorLeftEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateSpectatorLeftEvent(event: SpectatorLeftEvent): boolean {
  if (event.type !== GameEventType.SPECTATOR_LEFT) return false;
  
  const { payload } = event;
  return validateGameId(event.gameId) && typeof payload.spectatorId === 'string';
}

/**
 * Validates a ChatMessageEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateChatMessageEvent(event: ChatMessageEvent): boolean {
  return event.type === GameEventType.CHAT_MESSAGE && validateChatMessageDTO(event.payload);
}

/**
 * Validates a GameStateUpdateEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameStateUpdateEvent(event: GameStateUpdateEvent): boolean {
  return event.type === GameEventType.GAME_STATE_UPDATE && validateGameStateDTO(event.payload);
}

/**
 * Validates an ErrorEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateErrorEvent(event: ErrorEvent): boolean {
  if (event.type !== GameEventType.ERROR) return false;
  
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
  
  if (event.type !== GameEventType.CONNECTION_PING) return false;
  
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
export function validateGameEvent(event: GameEvent): boolean {
  if (!event || !event.type) return false;

  switch (event.type) {
    case GameEventType.MOVE_REQUESTED:
      return validateMoveRequestEvent(event as MoveRequestEvent);
    case GameEventType.MOVE_RESULT:
      return validateMoveResultEvent(event as MoveResultEvent);
    case GameEventType.DUEL_INITIATED:
      return validateDuelInitiatedEvent(event as DuelInitiatedEvent);
    case GameEventType.DUEL_ALLOCATE:
      return validateDuelAllocationEvent(event as DuelAllocationEvent);
    case GameEventType.DUEL_OUTCOME:
      return validateDuelOutcomeEvent(event as DuelOutcomeEvent);
    case GameEventType.RETREAT_OPTIONS:
      return validateRetreatOptionsEvent(event as RetreatOptionsEvent);
    case GameEventType.RETREAT_SELECTED:
      return validateRetreatSelectionEvent(event as RetreatSelectionEvent);
    case GameEventType.GAME_OVER:
      return validateGameOverEvent(event as GameOverEvent);
    case GameEventType.PLAYER_JOINED:
      return validatePlayerJoinedEvent(event as PlayerJoinedEvent);
    case GameEventType.PLAYER_LEFT:
      return validatePlayerLeftEvent(event as PlayerLeftEvent);
    case GameEventType.PLAYER_RECONNECTED:
      return validatePlayerReconnectedEvent(event as PlayerReconnectedEvent);
    case GameEventType.SPECTATOR_JOINED:
      return validateSpectatorJoinedEvent(event as SpectatorJoinedEvent);
    case GameEventType.SPECTATOR_LEFT:
      return validateSpectatorLeftEvent(event as SpectatorLeftEvent);
    case GameEventType.CHAT_MESSAGE:
      return validateChatMessageEvent(event as ChatMessageEvent);
    case GameEventType.GAME_STATE_UPDATE:
      return validateGameStateUpdateEvent(event as GameStateUpdateEvent);
    case GameEventType.ERROR:
      return validateErrorEvent(event as ErrorEvent);
    case GameEventType.GAME_RESIGN:
      return validateGameResignEvent(event);
    case GameEventType.GAME_OFFER_DRAW:
      return validateGameOfferDrawEvent(event);
    case GameEventType.GAME_RESPOND_DRAW:
      return validateGameRespondDrawEvent(event);
    case GameEventType.CONNECTION_PING:
      return validateConnectionPingEvent(event);
    default:
      return false;
  }
} 