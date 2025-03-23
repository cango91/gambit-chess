# websocket Module

File: `services/websocket.ts`

## JSDoc Documentation

### setupWebSocketHandlers (FunctionDeclaration)

Set up WebSocket server and message handlers

```typescript
/**
 * Set up WebSocket server and message handlers
 */
```

### initializeConnection (FunctionDeclaration)

Initialize a new WebSocket connection with a session ID

**Tags:**

- @param ws The WebSocket connection
 * @returns The session ID

```typescript
/**
 * Initialize a new WebSocket connection with a session ID
 * @param ws The WebSocket connection
 * @returns The session ID
 */
```

### handleConnectionClosed (FunctionDeclaration)

Handle a WebSocket connection closing

**Tags:**

- @param ws The WebSocket connection that closed

```typescript
/**
 * Handle a WebSocket connection closing
 * @param ws The WebSocket connection that closed
 */
```

### registerSessionWithGame (FunctionDeclaration)

Register a session with a game for security validation

**Tags:**

- @param gameId The game ID
 * @param sessionId The session ID to register

```typescript
/**
 * Register a session with a game for security validation
 * @param gameId The game ID
 * @param sessionId The session ID to register
 */
```

### validateSessionForGameAction (FunctionDeclaration)

Validate that a session is authorized to perform actions on a gameThis combines WebSocket connection validation with game session validation

**Tags:**

- @param ws The WebSocket connection
 * @param claimedSessionId The session ID claimed in the message
 * @param gameId The game ID being acted upon
 * @returns True if the session is valid for this game action

```typescript
/**
 * Validate that a session is authorized to perform actions on a game
 * This combines WebSocket connection validation with game session validation
 * @param ws The WebSocket connection
 * @param claimedSessionId The session ID claimed in the message
 * @param gameId The game ID being acted upon
 * @returns True if the session is valid for this game action
 */
```

### getSessionsForGame (FunctionDeclaration)

Get all sessions registered with a game

**Tags:**

- @param gameId The game ID
 * @returns Set of session IDs

```typescript
/**
 * Get all sessions registered with a game
 * @param gameId The game ID
 * @returns Set of session IDs
 */
```

### findConnectionBySessionId (FunctionDeclaration)

Find a WebSocket connection by session ID

**Tags:**

- @param sessionId The session ID to look for
 * @returns The WebSocket connection if found, undefined otherwise

```typescript
/**
 * Find a WebSocket connection by session ID
 * @param sessionId The session ID to look for
 * @returns The WebSocket connection if found, undefined otherwise
 */
```

### getSessionId (FunctionDeclaration)

Get the session ID for a WebSocket connection

**Tags:**

- @param ws The WebSocket connection
 * @returns The session ID if found, undefined otherwise

```typescript
/**
 * Get the session ID for a WebSocket connection
 * @param ws The WebSocket connection
 * @returns The session ID if found, undefined otherwise
 */
```

### sendMessage (FunctionDeclaration)

Send a message to a client

**Tags:**

- @param ws The WebSocket connection
 * @param type The message type
 * @param payload The message payload

```typescript
/**
 * Send a message to a client
 * @param ws The WebSocket connection
 * @param type The message type
 * @param payload The message payload
 */
```

### sendError (FunctionDeclaration)

Send an error message to a client

**Tags:**

- @param ws The WebSocket connection
 * @param message The error message

```typescript
/**
 * Send an error message to a client
 * @param ws The WebSocket connection
 * @param message The error message
 */
```

### broadcastMessage (FunctionDeclaration)

Broadcast a message to all connected clients

**Tags:**

- @param type The message type
 * @param payload The message payload
 * @param excludeSessionId Optional session ID to exclude from the broadcast

```typescript
/**
 * Broadcast a message to all connected clients
 * @param type The message type
 * @param payload The message payload
 * @param excludeSessionId Optional session ID to exclude from the broadcast
 */
```

### getActiveConnectionCount (FunctionDeclaration)

Get the number of active connections

**Tags:**

- @returns The number of active connections

```typescript
/**
 * Get the number of active connections
 * @returns The number of active connections
 */
```

### getActiveSessions (FunctionDeclaration)

Get all active session IDs

**Tags:**

- @returns Array of active session IDs

```typescript
/**
 * Get all active session IDs
 * @returns Array of active session IDs
 */
```

### closeConnection (FunctionDeclaration)

Close a specific connection

**Tags:**

- @param sessionId The session ID to disconnect
 * @param code The WebSocket close code
 * @param reason The reason for closing
 * @returns True if the connection was found and closed

```typescript
/**
 * Close a specific connection
 * @param sessionId The session ID to disconnect
 * @param code The WebSocket close code
 * @param reason The reason for closing
 * @returns True if the connection was found and closed
 */
```

