import { useEffect, useRef, useCallback, useState } from 'react';
import { GameEvents } from '@gambit-chess/shared';

// Get WebSocket URL from environment or default to localhost
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3000';

interface EventHandler {
  (data: any): void;
}

interface EventMap {
  [eventName: string]: EventHandler[];
}

/**
 * Custom hook for WebSocket communication with the game server
 */
export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const eventMapRef = useRef<EventMap>({});
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize connection
  const connect = useCallback(() => {
    // Clean up any existing socket
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create new socket
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    // Set up event handlers
    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Clear reconnect timeout if it exists
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
      
      // Try to reconnect after a delay
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, 2000);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle session ID separately
        if (message.event === 'session') {
          setSessionId(message.sessionId);
          return;
        }
        
        // Handle events
        if (message.event && eventMapRef.current[message.event]) {
          eventMapRef.current[message.event].forEach(handler => {
            handler(message);
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, []);

  // Initialize WebSocket connection on mount
  useEffect(() => {
    connect();
    
    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ event: 'ping' }));
      }
    }, 30000);
    
    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  // Send message to server
  const send = useCallback((event: GameEvents, data: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        event,
        ...data,
        ...(sessionId ? { sessionId } : {})
      }));
    } else {
      console.warn('WebSocket not connected. Message not sent:', event, data);
    }
  }, [sessionId]);

  // Subscribe to an event
  const subscribe = useCallback((event: GameEvents | string, handler: EventHandler) => {
    if (!eventMapRef.current[event]) {
      eventMapRef.current[event] = [];
    }
    eventMapRef.current[event].push(handler);
  }, []);

  // Unsubscribe from an event
  const unsubscribe = useCallback((event: GameEvents | string, handler: EventHandler) => {
    if (eventMapRef.current[event]) {
      eventMapRef.current[event] = eventMapRef.current[event].filter(h => h !== handler);
    }
  }, []);

  return { 
    isConnected, 
    sessionId, 
    send, 
    subscribe, 
    unsubscribe, 
    connect 
  };
} 