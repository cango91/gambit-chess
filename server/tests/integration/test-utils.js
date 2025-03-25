"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestServer = createTestServer;
exports.createWebSocketClient = createWebSocketClient;
exports.waitForMessage = waitForMessage;
exports.safeCloseClient = safeCloseClient;
exports.createTestGame = createTestGame;
exports.joinTestGame = joinTestGame;
exports.makeMove = makeMove;
exports.collectMessages = collectMessages;
const ws_1 = __importDefault(require("ws"));
const ws_2 = require("ws");
const express_1 = __importDefault(require("express"));
const uuid_1 = require("uuid");
const websocket_1 = require("../../src/services/websocket");
const routes_1 = require("../../src/api/routes");
const redis_1 = require("../../src/services/redis");
// Track any intervals created so we can clean them up
const intervalIds = [];
// Monkey patch setInterval to track it
const originalSetInterval = global.setInterval;
// @ts-ignore - We're intentionally creating a simplified version for testing
global.setInterval = function (callback, ms, ...args) {
    const intervalId = originalSetInterval(callback, ms, ...args);
    intervalIds.push(intervalId);
    return intervalId;
};
/**
 * Test utility to create a test server with WebSocket and HTTP support
 */
async function createTestServer() {
    // Create express app
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Setup API routes
    (0, routes_1.setupApiRoutes)(app);
    // Create HTTP server
    const server = app.listen(0); // Use random available port
    // Setup WebSocket server
    const wss = new ws_2.Server({ server });
    (0, websocket_1.setupWebSocketHandlers)(wss);
    // Wait for server to start listening
    await new Promise((resolve) => {
        server.once('listening', () => resolve());
    });
    // Get assigned port
    const address = server.address();
    const port = address.port;
    const url = `http://localhost:${port}`;
    // Create cleanup function
    const closeServer = async () => {
        console.log('Cleaning up resources...');
        // Clear all intervals first
        intervalIds.forEach(id => {
            clearInterval(id);
            console.log(`Cleared interval ${id}`);
        });
        // Close all WebSocket connections first
        wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.terminate(); // Force close
            }
        });
        // Close WebSocket server
        await new Promise((resolve, reject) => {
            wss.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        // Close HTTP server
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        try {
            // Disconnect Redis
            await (0, redis_1.disconnectRedis)();
        }
        catch (error) {
            console.error('Error disconnecting Redis:', error);
        }
        console.log('Server closed successfully');
    };
    return { server, wss, port, url, closeServer };
}
/**
 * Create a WebSocket client and connect to server
 */
async function createWebSocketClient(port) {
    console.log(`Creating WebSocket client connecting to port ${port}`);
    // Create a promise that will resolve with the session ID
    const sessionPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout waiting for session ID'));
        }, 10000);
        // Create client
        const client = new ws_1.default(`ws://localhost:${port}`);
        // Set up error handler
        client.on('error', (error) => {
            console.error('WebSocket error:', error);
            clearTimeout(timeoutId);
            reject(error);
        });
        // Set up message handler BEFORE connection opens
        const messageHandler = (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log('Processing message for session ID extraction:', data);
                if (data.type === 'session') {
                    clearTimeout(timeoutId);
                    client.removeListener('message', messageHandler);
                    console.log(`Received session ID: ${data.payload.sessionId}`);
                    resolve({ client, sessionId: data.payload.sessionId });
                }
            }
            catch (err) {
                console.error('Error parsing WebSocket message:', err);
            }
        };
        client.on('message', messageHandler);
        // Handle debug logs for this client
        client.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('Raw WebSocket message received:', message);
            }
            catch (err) {
                console.log('Raw non-JSON message received:', data);
            }
        });
        // Set up open handler
        client.on('open', () => {
            console.log('WebSocket connection opened');
        });
        // Handle close
        client.on('close', (code, reason) => {
            // Removed console.log to avoid "Cannot log after tests are done" errors
        });
    });
    // Wait for the connection and session ID
    const { client, sessionId } = await sessionPromise;
    return { client, sessionId };
}
/**
 * Wait for a specific message type
 */
async function waitForMessage(client, messageType, timeoutMs = 10000 // Increased from 5000
) {
    return new Promise((resolve, reject) => {
        // Store messages that don't match our type to help with debugging
        const otherMessages = [];
        const messageHandler = (message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log(`Test received message: ${data.type}`);
                if (data.type === messageType) {
                    clearTimeout(timeoutId);
                    client.removeListener('message', messageHandler);
                    resolve(data);
                }
                else {
                    // Store other messages for debugging
                    otherMessages.push(data.type);
                }
            }
            catch (err) {
                console.error('Error parsing message:', err);
            }
        };
        client.on('message', messageHandler);
        const timeoutId = setTimeout(() => {
            client.removeListener('message', messageHandler);
            console.log(`Timeout waiting for ${messageType}. Other messages received:`, otherMessages);
            reject(new Error(`Timeout waiting for message type: ${messageType}`));
        }, timeoutMs);
        // Ensure the timeout is cleared if the promise is otherwise rejected
        const originalReject = reject;
        reject = (reason) => {
            clearTimeout(timeoutId);
            client.removeListener('message', messageHandler);
            originalReject(reason);
        };
    });
}
/**
 * Safely close a WebSocket client with logging and proper error handling
 */
function safeCloseClient(client) {
    return new Promise((resolve) => {
        if (!client) {
            resolve();
            return;
        }
        if (client.readyState === ws_1.default.CLOSED ||
            client.readyState === ws_1.default.CLOSING) {
            resolve();
            return;
        }
        // Function to handle cleanup
        const cleanup = () => {
            // Remove all listeners to prevent memory leaks
            client.removeAllListeners();
            resolve();
        };
        try {
            // Listen for close event
            client.once('close', cleanup);
            // Set a timeout in case connection doesn't close cleanly
            const timeoutId = setTimeout(() => {
                console.log('WebSocket close timed out, forcing cleanup');
                client.removeListener('close', cleanup);
                cleanup();
            }, 2000);
            // Ensure timeout is cleared if connection closes normally
            client.once('close', () => {
                clearTimeout(timeoutId);
            });
            // Close the connection
            client.close();
        }
        catch (err) {
            console.error('Error closing WebSocket client:', err);
            cleanup();
        }
    });
}
/**
 * Create a test game
 */
async function createTestGame(client, options = {}) {
    const gameId = `test-game-${(0, uuid_1.v4)()}`;
    // Send create game message
    client.send(JSON.stringify({
        type: 'create_game',
        payload: {
            gameId,
            ...options
        }
    }));
    // Wait for game created confirmation
    await new Promise((resolve) => {
        const messageHandler = (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'game_created' && data.payload.gameId === gameId) {
                client.removeListener('message', messageHandler);
                resolve();
            }
        };
        client.on('message', messageHandler);
    });
    return { gameId };
}
/**
 * Join an existing game
 */
async function joinTestGame(client, gameId) {
    // Send join game message
    client.send(JSON.stringify({
        type: 'join_game',
        payload: {
            gameId
        }
    }));
    // Wait for game joined confirmation
    await new Promise((resolve) => {
        const messageHandler = (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === 'game_joined' && data.payload.gameId === gameId) {
                client.removeListener('message', messageHandler);
                resolve();
            }
        };
        client.on('message', messageHandler);
    });
}
/**
 * Utility to make a move in a game
 */
async function makeMove(client, gameId, from, to) {
    // Send move message
    client.send(JSON.stringify({
        type: 'move',
        payload: {
            gameId,
            from,
            to
        }
    }));
    // Wait for move confirmation
    return new Promise((resolve) => {
        const messageHandler = (message) => {
            const data = JSON.parse(message.toString());
            if ((data.type === 'move_result' || data.type === 'error') &&
                data.payload.gameId === gameId) {
                client.removeListener('message', messageHandler);
                resolve(data);
            }
        };
        client.on('message', messageHandler);
    });
}
/**
 * Collect all WebSocket messages for a period
 */
async function collectMessages(client, timeoutMs = 500) {
    const messages = [];
    // Setup message collector
    const messageHandler = (message) => {
        try {
            const data = JSON.parse(message.toString());
            messages.push(data);
        }
        catch (err) {
            // Ignore non-JSON messages
        }
    };
    client.on('message', messageHandler);
    // Wait for specified timeout
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
    // Clean up listener
    client.removeListener('message', messageHandler);
    return messages;
}
