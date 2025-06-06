import { Server as SocketIOServer } from 'socket.io';
import { GameEvent, GameEventType, BaseGameState } from '@gambit-chess/shared';
import { broadcastGameEvent, broadcastGameUpdate } from '../socket/game.socket';
import LiveGameService from './live-game.service';

/**
 * Service for handling game events and broadcasting them via Socket.IO
 * Bridges the gap between Redis events and real-time WebSocket communication
 */
export class GameEventsService {
  private static io: SocketIOServer | null = null;

  /**
   * Initialize the service with Socket.IO server instance
   */
  static initialize(socketServer: SocketIOServer): void {
    this.io = socketServer;
    console.log('GameEventsService initialized with Socket.IO server');
  }

  /**
   * Process and broadcast a game event
   */
  static async processGameEvent(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    if (!this.io) {
      console.error('GameEventsService not initialized with Socket.IO server');
      return;
    }

    try {
      switch (event.type) {
        case GameEventType.GAME_CREATED:
          await this.handleGameCreated(event);
          break;
        
        case GameEventType.PLAYER_JOINED:
          await this.handlePlayerJoined(event);
          break;
        
        case GameEventType.MOVE_MADE:
          await this.handleMoveMade(event);
          break;
        
        case GameEventType.DUEL_INITIATED:
          await this.handleDuelInitiated(event);
          break;
        
        case GameEventType.DUEL_ALLOCATION_SUBMITTED:
          await this.handleDuelAllocation(event);
          break;
        
        case GameEventType.DUEL_RESOLVED:
          await this.handleDuelResolved(event, finalGameState);
          break;
        
        case GameEventType.TACTICAL_RETREAT_MADE:
          await this.handleTacticalRetreat(event);
          break;
        
        case GameEventType.BATTLE_POINTS_UPDATED:
          await this.handleBattlePointsUpdated(event);
          break;
        
        case GameEventType.GAME_ENDED:
          await this.handleGameEnded(event, finalGameState);
          break;
        
        default:
          console.log(`Unhandled game event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Error processing game event:', error);
    }
  }

  /**
   * Handle game creation events
   */
  private static async handleGameCreated(event: GameEvent): Promise<void> {
    console.log(`Game created: ${event.gameId}`);
    // Could broadcast to a general games lobby if implemented
  }

  /**
   * Handle player joined events
   */
  private static async handlePlayerJoined(event: GameEvent): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state for all players
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    }
  }

  /**
   * Handle move made events
   */
  private static async handleMoveMade(event: GameEvent): Promise<void> {
    console.log('🎯 Processing MOVE_MADE event for game:', event.gameId);
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state for all players
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      console.log('🔄 Broadcasting updated game state. FEN:', gameState.chess.fen());
      console.log('🔄 Current turn:', gameState.chess.turn());
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get updated game state for broadcast');
    }
  }

  /**
   * Handle duel initiated events
   */
  private static async handleDuelInitiated(event: GameEvent): Promise<void> {
    console.log('🥊 Processing DUEL_INITIATED event for game:', event.gameId);
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state for all players - CRITICAL: This broadcasts the duel state
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      console.log('🥊 Broadcasting duel game state. Status:', gameState.gameStatus);
      console.log('🥊 Pending duel:', gameState.pendingDuel ? 'Yes' : 'No');
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get updated game state for duel broadcast');
    }
    
    // Notify players that a duel has started
    this.io!.to(`game:${event.gameId}`).emit('game:duel_started', {
      attacker: event.payload.attacker,
      defender: event.payload.defender,
      piece: event.payload.piece,
    });
  }

  /**
   * Handle duel allocation events (keep secret from opponent)
   */
  private static async handleDuelAllocation(event: GameEvent): Promise<void> {
    // Don't broadcast allocations to prevent cheating
    // Only log for server-side tracking
    console.log(`Duel allocation received for game ${event.gameId}`);
    
    // Could check if both players have allocated and resolve duel here
    // For now, just acknowledge to the allocating player (handled in socket handler)
  }

  /**
   * Handle duel resolved events
   */
  private static async handleDuelResolved(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state after duel resolution
    // Use finalGameState if provided (for completed games) or fetch from Redis
    let gameState = finalGameState;
    if (!gameState) {
      const fetchedState = await LiveGameService.getGameState(event.gameId);
      gameState = fetchedState || undefined;
    }
    
    if (gameState) {
      console.log('🥊 Broadcasting final duel state. Status:', gameState.gameStatus, 'FEN:', gameState.chess.fen());
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get game state for duel resolution broadcast');
    }
    
    // Notify players about duel result
    this.io!.to(`game:${event.gameId}`).emit('game:duel_resolved', {
      winner: event.payload.winner,
      attackerAllocation: event.payload.attackerAllocation,
      defenderAllocation: event.payload.defenderAllocation,
      result: event.payload.result,
    });
  }

  /**
   * Handle tactical retreat events
   */
  private static async handleTacticalRetreat(event: GameEvent): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Update game state after retreat
    const gameState = await LiveGameService.getGameState(event.gameId);
    if (gameState) {
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    }
  }

  /**
   * Handle battle points updated events
   */
  private static async handleBattlePointsUpdated(event: GameEvent): Promise<void> {
    // Only broadcast to the specific player whose BP changed (for privacy)
    const targetPlayerId = event.payload.playerId;
    
    // Find socket for the target player and send private update
    // This is a simplified approach - in production you'd maintain user-socket mappings
    this.io!.to(`game:${event.gameId}`).emit('game:battle_points_updated', {
      playerId: targetPlayerId,
      newAmount: event.payload.newAmount,
      change: event.payload.change,
    });
  }

  /**
   * Handle game ended events
   */
  private static async handleGameEnded(event: GameEvent, finalGameState?: BaseGameState): Promise<void> {
    broadcastGameEvent(this.io!, event.gameId, event);
    
    // Use finalGameState if provided (for completed games) or fetch from Redis
    // This is critical because when games end, they're often archived before this handler runs
    let gameState = finalGameState;
    if (!gameState) {
      const fetchedState = await LiveGameService.getGameState(event.gameId);
      gameState = fetchedState || undefined;
    }
    
    if (gameState) {
      console.log('🏁 Broadcasting final game state on game end. Status:', gameState.gameStatus, 'FEN:', gameState.chess.fen());
      console.log('🏁 Final move history length:', gameState.moveHistory.length);
      console.log('🏁 Final moves:', gameState.moveHistory.map(m => m.san || `${m.from}-${m.to}`));
      broadcastGameUpdate(this.io!, event.gameId, gameState);
    } else {
      console.error('❌ Could not get final game state for game end broadcast');
    }
    
    // Notify about game end
    this.io!.to(`game:${event.gameId}`).emit('game:ended', {
      result: event.payload.result,
      winner: event.payload.winner,
      reason: event.payload.reason,
    });
    
    console.log(`Game ${event.gameId} ended: ${event.payload.result}`);
  }

  /**
   * Get Socket.IO server instance (for external use)
   */
  static getSocketServer(): SocketIOServer | null {
    return this.io;
  }
}

export default GameEventsService; 