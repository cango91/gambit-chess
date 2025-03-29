/**
 * Enum for game event types
 * Used for consistent event naming across the system
 */
export enum GameEventType {
  // Game state events
  GAME_STATE_UPDATE = 'gameState.update',
  GAME_CREATED = 'game.created',
  GAME_STARTED = 'game.started',
  GAME_OVER = 'game.over',
  GAME_ABANDONED = 'game.abandoned',
  
  // Player events
  PLAYER_JOINED = 'player.joined',
  PLAYER_LEFT = 'player.left',
  PLAYER_RECONNECTED = 'player.reconnected',
  PLAYER_DISCONNECTED = 'player.disconnected',
  
  // Move events
  MOVE_REQUESTED = 'move.requested',
  MOVE_RESULT = 'move.result',
  MOVE_VALIDATED = 'move.validated',
  MOVE_INVALID = 'move.invalid',
  
  // Duel events
  DUEL_INITIATED = 'duel.initiated',
  DUEL_ALLOCATE = 'duel.allocate',
  DUEL_OUTCOME = 'duel.outcome',
  
  // Retreat events
  RETREAT_OPTIONS = 'retreat.options',
  RETREAT_SELECTED = 'retreat.selected',
  
  // Spectator events
  SPECTATOR_JOINED = 'spectator.joined',
  SPECTATOR_LEFT = 'spectator.left',
  
  // Chat events
  CHAT_MESSAGE = 'chat.message',
  
  // System events
  ERROR = 'error',
  CONNECTION_PING = 'connection.ping',
  CONNECTION_PONG = 'connection.pong'
} 