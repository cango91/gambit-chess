/**
 * Interface for dispatching events to players and spectators
 * Abstracts the underlying communication mechanism
 */
export interface IEventDispatcher {
  /**
   * Dispatches an event to a specific player
   * @param playerId Unique player identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  dispatchToPlayer(playerId: string, eventName: string, data: any): void;
  
  /**
   * Dispatches an event to all players in a game
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  dispatchToGame(gameId: string, eventName: string, data: any): void;
  
  /**
   * Dispatches an event to all spectators of a game
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  dispatchToSpectators(gameId: string, eventName: string, data: any): void;
  
  /**
   * Dispatches different events to white and black players
   * Useful for sending player-specific views of game state
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param whiteData Data for white player
   * @param blackData Data for black player
   */
  dispatchToPlayers(gameId: string, eventName: string, whiteData: any, blackData: any): void;
  
  /**
   * Dispatches an event to everyone connected to a game (players and spectators)
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  dispatchToAll(gameId: string, eventName: string, data: any): void;
  
  /**
   * Registers a connection for a player
   * @param playerId Unique player identifier
   * @param connection Connection object (WebSocket, Socket.IO, etc.)
   */
  registerConnection(playerId: string, connection: any): void;
  
  /**
   * Unregisters a connection for a player
   * @param playerId Unique player identifier
   */
  unregisterConnection(playerId: string): void;
} 