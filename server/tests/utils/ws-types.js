"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageHandler = createMessageHandler;
/**
 * Type adapter for WebSocket event handlers
 * Converts MessageEvent to WebSocket.Data for backward compatibility
 */
function createMessageHandler(handler) {
    return (event) => {
        // Handle both browser MessageEvent and ws library MessageEvent
        const messageData = 'data' in event ? event.data : event;
        return handler(messageData);
    };
}
