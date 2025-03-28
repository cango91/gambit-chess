/**
 * Event Validation Utilities
 * 
 * This module provides validation functions for events to ensure
 * they adhere to domain boundaries and information architecture.
 */

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
  validatePosition,
  validatePieceColor,
} from '../validation';

import {
  MoveRequestEvent,
  MoveResultEvent,
  DuelInitiatedEvent,
  DuelAllocationEvent,
  DuelOutcomeEvent,
  RetreatOptionsEvent,
  RetreatSelectionEvent,
  CheckEvent,
  GameOverEvent,
  PlayerJoinedEvent,
  PlayerLeftEvent,
  PlayerReconnectedEvent,
  SpectatorJoinedEvent,
  SpectatorLeftEvent,
  ChatMessageEvent,
  GameStateUpdateEvent,
  ErrorEvent,
  SharedEvent
} from './index';

/**
 * Validates a MoveRequestEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateMoveRequestEvent(event: MoveRequestEvent): boolean {
  return event.type === 'move.request' && validateMoveDTO(event.payload);
}

/**
 * Validates a MoveResultEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateMoveResultEvent(event: MoveResultEvent): boolean {
  if (event.type !== 'move.result') return false;
  
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
  return event.type === 'duel.initiated' && validateDuelInitiatedDTO(event.payload);
}

/**
 * Validates a DuelAllocationEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelAllocationEvent(event: DuelAllocationEvent): boolean {
  return event.type === 'duel.allocate' && validateBPAllocationDTO(event.payload);
}

/**
 * Validates a DuelOutcomeEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateDuelOutcomeEvent(event: DuelOutcomeEvent): boolean {
  return event.type === 'duel.outcome' && validateDuelOutcomeDTO(event.payload);
}

/**
 * Validates a RetreatOptionsEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateRetreatOptionsEvent(event: RetreatOptionsEvent): boolean {
  return event.type === 'retreat.options' && validateRetreatOptionsDTO(event.payload);
}

/**
 * Validates a RetreatSelectionEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateRetreatSelectionEvent(event: RetreatSelectionEvent): boolean {
  return event.type === 'retreat.select' && validateRetreatDTO(event.payload);
}

/**
 * Validates a CheckEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateCheckEvent(event: CheckEvent): boolean {
  if (event.type !== 'game.check') return false;
  
  const { payload } = event;
  return validateGameId(payload.gameId) && 
    validatePosition(payload.kingPosition) &&
    validatePieceColor(payload.color);
}

/**
 * Validates a GameOverEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameOverEvent(event: GameOverEvent): boolean {
  if (event.type !== 'game.over') return false;
  
  const { payload } = event;
  return validateGameId(payload.gameId) && 
    ['white_win', 'black_win', 'draw'].includes(payload.result) &&
    typeof payload.reason === 'string';
}

/**
 * Validates a PlayerJoinedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerJoinedEvent(event: PlayerJoinedEvent): boolean {
  return event.type === 'player.joined' && validatePlayerDTO(event.payload);
}

/**
 * Validates a PlayerLeftEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerLeftEvent(event: PlayerLeftEvent): boolean {
  if (event.type !== 'player.left') return false;
  
  const { payload } = event;
  return validateGameId(payload.gameId) && typeof payload.playerId === 'string';
}

/**
 * Validates a PlayerReconnectedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validatePlayerReconnectedEvent(event: PlayerReconnectedEvent): boolean {
  if (event.type !== 'player.reconnected') return false;
  
  const { payload } = event;
  return validateGameId(payload.gameId) && typeof payload.playerId === 'string';
}

/**
 * Validates a SpectatorJoinedEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateSpectatorJoinedEvent(event: SpectatorJoinedEvent): boolean {
  return event.type === 'spectator.joined' && validateSpectatorDTO(event.payload);
}

/**
 * Validates a SpectatorLeftEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateSpectatorLeftEvent(event: SpectatorLeftEvent): boolean {
  if (event.type !== 'spectator.left') return false;
  
  const { payload } = event;
  return validateGameId(payload.gameId) && typeof payload.spectatorId === 'string';
}

/**
 * Validates a ChatMessageEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateChatMessageEvent(event: ChatMessageEvent): boolean {
  return event.type === 'chat.message' && validateChatMessageDTO(event.payload);
}

/**
 * Validates a GameStateUpdateEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateGameStateUpdateEvent(event: GameStateUpdateEvent): boolean {
  return event.type === 'gameState.update' && validateGameStateDTO(event.payload);
}

/**
 * Validates an ErrorEvent
 * @param event The event to validate
 * @returns True if the event is valid
 */
export function validateErrorEvent(event: ErrorEvent): boolean {
  if (event.type !== 'error') return false;
  
  const { payload } = event;
  return typeof payload.code === 'string' && typeof payload.message === 'string';
}

/**
 * Validates a game resign event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateGameResignEvent(event: any): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, sequence } = event.payload;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof sequence === 'number' && sequence >= 0
  );
}

/**
 * Validates a game offer draw event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateGameOfferDrawEvent(event: any): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, sequence } = event.payload;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof sequence === 'number' && sequence >= 0
  );
}

/**
 * Validates a game respond draw event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateGameRespondDrawEvent(event: any): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, accept, sequence } = event.payload;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof accept === 'boolean' &&
    typeof sequence === 'number' && sequence >= 0
  );
}

/**
 * Validates a connection ping event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateConnectionPingEvent(event: any): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, timestamp } = event.payload;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof timestamp === 'number' && timestamp > 0
  );
}

/**
 * Validates a player set name event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validatePlayerSetNameEvent(event: any): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, name } = event.payload;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof name === 'string' && name.length >= 3 && name.length <= 20
  );
}

/**
 * Validates a spectator join event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateSpectatorJoinEvent(event: any): boolean {
  if (!event || !event.payload) return false;
  
  const { gameId, name } = event.payload;
  
  return (
    typeof gameId === 'string' && gameId.length > 0 &&
    typeof name === 'string' && name.length >= 3 && name.length <= 20
  );
}

/**
 * Validates a shared event
 * @param event The event to validate
 * @returns Whether the event is valid
 */
export function validateSharedEvent(event: any): boolean {
  if (!event || !event.type) return false;

  switch (event.type) {
    case 'move.request':
      return validateMoveRequestEvent(event as MoveRequestEvent);
    case 'move.result':
      return validateMoveResultEvent(event as MoveResultEvent);
    case 'duel.initiated':
      return validateDuelInitiatedEvent(event as DuelInitiatedEvent);
    case 'duel.allocate':
      return validateDuelAllocationEvent(event as DuelAllocationEvent);
    case 'duel.outcome':
      return validateDuelOutcomeEvent(event as DuelOutcomeEvent);
    case 'retreat.options':
      return validateRetreatOptionsEvent(event as RetreatOptionsEvent);
    case 'retreat.select':
      return validateRetreatSelectionEvent(event as RetreatSelectionEvent);
    case 'game.check':
      return validateCheckEvent(event as CheckEvent);
    case 'game.over':
      return validateGameOverEvent(event as GameOverEvent);
    case 'player.joined':
      return validatePlayerJoinedEvent(event as PlayerJoinedEvent);
    case 'player.left':
      return validatePlayerLeftEvent(event as PlayerLeftEvent);
    case 'player.reconnected':
      return validatePlayerReconnectedEvent(event as PlayerReconnectedEvent);
    case 'spectator.joined':
      return validateSpectatorJoinedEvent(event as SpectatorJoinedEvent);
    case 'spectator.left':
      return validateSpectatorLeftEvent(event as SpectatorLeftEvent);
    case 'chat.message':
      return validateChatMessageEvent(event as ChatMessageEvent);
    case 'gameState.update':
      return validateGameStateUpdateEvent(event as GameStateUpdateEvent);
    case 'error':
      return validateErrorEvent(event as ErrorEvent);
    case 'game.resign':
      return validateGameResignEvent(event);
    case 'game.offerDraw':
      return validateGameOfferDrawEvent(event);
    case 'game.respondDraw':
      return validateGameRespondDrawEvent(event);
    case 'connection.ping':
      return validateConnectionPingEvent(event);
    case 'player.setName':
      return validatePlayerSetNameEvent(event);
    case 'spectator.join':
      return validateSpectatorJoinEvent(event);
    default:
      return false;
  }
} 