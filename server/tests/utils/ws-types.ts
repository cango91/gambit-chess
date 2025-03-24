import WebSocket from 'ws';

/**
 * Type adapter for WebSocket event handlers
 * Converts MessageEvent to WebSocket.Data for backward compatibility
 */
export function createMessageHandler<T>(
  handler: (data: any) => T
): (event: MessageEvent | WebSocket.MessageEvent) => T {
  return (event: MessageEvent | WebSocket.MessageEvent) => {
    // Handle both browser MessageEvent and ws library MessageEvent
    const messageData = 'data' in event ? event.data : event;
    return handler(messageData);
  };
} 