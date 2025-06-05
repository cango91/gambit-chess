import { io, Socket } from 'socket.io-client';
import { BaseGameState, GameEvent } from '@gambit-chess/shared';

export type WebSocketEventHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private sessionToken: string | null = null;
  
  constructor() {
    // Don't connect automatically - wait for authentication
  }

  // Public method to initiate connection after authentication
  connect(sessionToken?: string) {
    if (sessionToken) {
      this.sessionToken = sessionToken;
    }
    
    if (this.socket?.connected) return;
    
    this.connectionStatus = 'connecting';
    this.socket = io(import.meta.env.VITE_SERVER_URL || '', {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000 + (this.reconnectAttempts * 500), // Exponential backoff
      auth: {
        anonymousSessionToken: this.sessionToken
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔗 Connected to Gambit Chess server!');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.emit('connection:status', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('💔 Disconnected from server:', reason);
      this.connectionStatus = 'disconnected';
      this.emit('connection:status', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ WebSocket connection error:', error);
      this.connectionStatus = 'error';
      this.reconnectAttempts++;
      this.emit('connection:status', { status: 'error', error: error.message });
    });

    // Game state events
    this.socket.on('game:state', (gameState: BaseGameState) => {
      // Handle both live chess.js instances and serialized chess objects from server
      const fen = typeof gameState.chess?.fen === 'function' 
        ? gameState.chess.fen() 
        : gameState.chess?.fen || 'No FEN';
      console.log('📨 Received game:state event. FEN:', fen);
      console.log('🔍 DEBUG: Full chess object from server:', JSON.stringify(gameState.chess, null, 2));
      this.emit('game:state', gameState);
    });

    // Handle game state updates from server
    this.socket.on('game:state_updated', (gameState: BaseGameState) => {
      // Handle both live chess.js instances and serialized chess objects from server
      const fen = typeof gameState.chess?.fen === 'function' 
        ? gameState.chess.fen() 
        : gameState.chess?.fen || 'No FEN';
      console.log('📨 Received game:state_updated event. FEN:', fen);
      this.emit('game:state', gameState);
    });

    this.socket.on('game:move', (data: any) => {
      this.emit('game:move', data);
    });

    this.socket.on('game:duel_initiated', (data: any) => {
      this.emit('game:duel_initiated', data);
    });

    this.socket.on('game:duel_resolved', (data: any) => {
      this.emit('game:duel_resolved', data);
    });

    this.socket.on('game:battle_points_updated', (data: any) => {
      this.emit('game:battle_points_updated', data);
    });

    this.socket.on('game:tactical_retreat', (data: any) => {
      this.emit('game:tactical_retreat', data);
    });

    this.socket.on('game:player_connected', (data: any) => {
      this.emit('game:player_connected', data);
    });

    this.socket.on('game:player_disconnected', (data: any) => {
      this.emit('game:player_disconnected', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('🚨 Socket error:', error);
      this.emit('error', error);
    });

    // Ping/pong for connection health
    this.socket.on('pong', (data: any) => {
      this.emit('pong', data);
    });
  }

  // Event emitter pattern
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Authentication
  setAnonymousSession(sessionToken: string): void {
    this.sessionToken = sessionToken;
    // If socket is already connected, disconnect and reconnect with new auth
    if (this.socket?.connected) {
      this.socket.disconnect();
      this.connect();
    }
  }

  // Game actions
  joinGame(gameId: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot join game');
      return;
    }
    this.socket.emit('game:join', { gameId });
  }

  leaveGame(gameId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('game:leave', { gameId });
  }

  makeMove(gameId: string, move: { from: string; to: string; promotion?: string }): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot make move');
      return;
    }
    this.socket.emit('game:move', { gameId, move });
  }

  submitDuelAllocation(gameId: string, allocation: number): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot submit duel allocation');
      return;
    }
    this.socket.emit('game:duel_allocation', { gameId, allocation });
  }

  submitTacticalRetreat(gameId: string, retreatSquare: string): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, cannot submit tactical retreat');
      return;
    }
    this.socket.emit('game:tactical_retreat', { gameId, retreatSquare });
  }

  // Connection management
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Singleton instance
export const wsService = new WebSocketService(); 