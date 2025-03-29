import { IEventDispatcher } from '../interfaces/IEventDispatcher';

/**
 * No-operation event dispatcher for testing
 * Implements IEventDispatcher but does nothing with events
 */
export class NoOpEventDispatcher implements IEventDispatcher {
  /**
   * Dispatches an event to a specific player (no-op)
   * @param playerId Unique player identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  public dispatchToPlayer(playerId: string, eventName: string, data: any): void {
    // No operation
    console.log(`[NoOpDispatcher] Would dispatch ${eventName} to player ${playerId}`);
  }
  
  /**
   * Dispatches an event to all players in a game (no-op)
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  public dispatchToGame(gameId: string, eventName: string, data: any): void {
    // No operation
    console.log(`[NoOpDispatcher] Would dispatch ${eventName} to game ${gameId}`);
  }
  
  /**
   * Dispatches an event to all spectators of a game (no-op)
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  public dispatchToSpectators(gameId: string, eventName: string, data: any): void {
    // No operation
    console.log(`[NoOpDispatcher] Would dispatch ${eventName} to spectators of game ${gameId}`);
  }
  
  /**
   * Dispatches different events to white and black players (no-op)
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param whiteData Data for white player
   * @param blackData Data for black player
   */
  public dispatchToPlayers(gameId: string, eventName: string, whiteData: any, blackData: any): void {
    // No operation
    console.log(`[NoOpDispatcher] Would dispatch ${eventName} to players in game ${gameId}`);
  }
  
  /**
   * Dispatches an event to everyone connected to a game (no-op)
   * @param gameId Unique game identifier
   * @param eventName Name of the event
   * @param data Event data
   */
  public dispatchToAll(gameId: string, eventName: string, data: any): void {
    // No operation
    console.log(`[NoOpDispatcher] Would dispatch ${eventName} to all in game ${gameId}`);
  }
  
  /**
   * Registers a connection for a player (no-op)
   * @param playerId Unique player identifier
   * @param connection Connection object
   */
  public registerConnection(playerId: string, connection: any): void {
    // No operation
    console.log(`[NoOpDispatcher] Would register connection for player ${playerId}`);
  }
  
  /**
   * Unregisters a connection for a player (no-op)
   * @param playerId Unique player identifier
   */
  public unregisterConnection(playerId: string): void {
    // No operation
    console.log(`[NoOpDispatcher] Would unregister connection for player ${playerId}`);
  }
} 