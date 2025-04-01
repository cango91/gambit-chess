# State Synchronization Strategy

## 1. State Update Protocol

### 1.1 Core Principles
- **Server Authority**: Server is the single source of truth for game state.
- **Client Representation**: Clients maintain a representation of the visible game state.
- **Unidirectional Flow**: State flows from server to clients, with client inputs as events.
- **Filtered Visibility**: Each client receives only information they should see.
- **Client-Side Validation**: Clients can validate certain game rules (e.g., check detection) using shared utilities for improved UX, but server remains authoritative.
- **Secure Communication**: All state updates and client inputs are securely transmitted and verified.

### 1.2 Update Types
- **Full State Updates**: Complete game state (filtered for visibility).
- **Delta Updates**: Only changed portions of the game state.
- **Event-Based Updates**: Notifications of specific game events.

### 1.3 Update Protocol
- **Initial State**: Full state update when game starts or player connects.
- **Turn Transitions**: Delta updates focusing on board changes and timer updates.
- **Duel Phases**: Event-based updates for duel progression.
- **Critical Updates**: Full state updates after potential desynchronization points.
- **Secure Wrapping**: All updates are wrapped in the SecureMessage protocol.

## 2. Secure Message Protocol

### 2.1 Message Structure
All state updates and client inputs are wrapped in a secure message container:

```typescript
interface SecureMessage<T extends GameEvent = GameEvent> {
  event: T;                // The wrapped game event
  security: {
    token: string;         // Session token
    signature?: string;    // Message signature (required for critical actions)
    timestamp: number;     // Timestamp to prevent replay attacks
    nonce: string;         // Unique nonce for each message
  }
}
```

### 2.2 Message Integrity
- **Authentication**: Messages are tied to player identity via token.
- **Integrity**: Critical game actions are signed to prevent tampering.
- **Freshness**: Timestamps and nonces prevent replay attacks.
- **Validation**: All messages are validated by the receiver before processing.

### 2.3 Secure State Update Flow
```
1. State change occurs on server
2. Server prepares player-specific filtered state
3. Server wraps state in SecureMessage with new sequence number and timestamp
4. Server signs message if required
5. Server transmits secure message to client
6. Client validates message authenticity and integrity
7. Client updates local state
```

## 3. Server-Side State Management

### 3.1 Authoritative Game State

The server maintains the single source of truth for game state using a service-oriented architecture:

```
GameManagerService
├── Current game state (authoritative)
├── Board state history (for tactical advantage detection)
├── Player information and connections
├── BP pools (hidden from opponents)
└── Game phase tracking
```

This state is managed by distinct services with clear responsibilities:

- **GameManagerService**: Coordinates overall game state and other services
- **BoardService**: Manages chess board state and validates moves
- **BPManagerService**: Handles BP allocation, regeneration, and duel resolution
- **TacticalDetectorService**: Identifies tactical advantages for BP regeneration
- **TimerService**: Controls chess timers and enforces time limits

### 3.2 State Transitions

State transitions occur through service method calls rather than internal events:

1. **Client Request**: Client sends a secure request via WebSocket (e.g., move, BP allocation)
2. **WebSocketController**: Validates message security, then routes request to the appropriate service method
3. **Service Processing**: Service validates and processes the request
4. **State Update**: GameManagerService updates the authoritative game state
5. **State Publication**: Updated state is filtered, wrapped in SecureMessage, and published to clients via WebSocket

```
Secure Client Request → Security Validation → Service Method Call → 
State Update → Filtered State → Secure Client Notification
```

For example, a move request follows this flow:
```
Secure move.request → Validate Message → BoardService.validateAndExecuteMove() → 
GameManagerService.updateState() → FilterStateByPlayer() → gameState.update to clients
```

### 3.3 State Persistence

Game state is persisted through a combination of in-memory and Redis storage:

- **Active Game Sessions**: Maintained in memory for performance
- **Backup State**: Periodically saved to Redis for fault tolerance
- **Recovery**: Game state can be reconstructed from Redis if needed
- **Historical Data**: Completed games archived to database

## 4. Player-Specific State Integrity

### 4.1 State Checksums
- **Player-Specific Checksums**: Generate unique checksums for each player's view of the game state
- **Visibility Rules**: Checksums only incorporate information the player should know
- **Verification**: Clients can verify their local state matches server's intended state
- **Reconciliation Triggers**: Mismatched checksums trigger state reconciliation

### 4.2 Checksum Calculation
```typescript
// Server-side calculation of player-specific checksum
function calculatePlayerStateChecksum(gameId: string, playerId: string): string {
  // Get player-filtered state
  const filteredState = getFilteredGameState(gameId, playerId);
  
  // Calculate checksum based on filtered state
  const stateString = JSON.stringify({
    board: filteredState.board,
    phase: filteredState.phase,
    turn: filteredState.turn,
    moveHistory: filteredState.moveHistory,
    playerBP: filteredState.playerBP
  });
  
  return createHash('sha256').update(stateString).digest('hex');
}
```

## 5. Latency Handling

### 5.1 Predictive Updates
- **Client Prediction**: Client predicts outcome of its own actions.
- **Temporary State**: Apply predicted changes to local state temporarily.
- **Visual Feedback**: Show predicted outcomes with visual indicators.
- **Reconciliation**: Reconcile with server state when confirmed.

### 5.2 Optimistic UI
- **Immediate Feedback**: Provide immediate visual feedback for user actions.
- **Pending State**: Display "pending" state for actions awaiting server confirmation.
- **Rollback Mechanism**: Smooth visual transition if server rejects prediction.

### 5.3 Performance Optimizations
- **Throttling**: Throttle update frequency for non-critical state changes.
- **Batching**: Batch multiple state changes into single updates.
- **Compression**: Compress state data for network efficiency.
- **Prioritization**: Prioritize critical updates during network congestion.

## 6. Disconnection Handling

### 6.1 Detection
- **Heartbeat**: Regular client-server heartbeat to detect disconnections.
- **WebSocket Events**: Monitor WebSocket connection status.
- **Timeout Detection**: Server-side timeout for inactive connections.

### 6.2 Reconnection Strategy
- **Session Persistence**: Maintain game state during short disconnections.
- **Reconnection Window**: Allow reconnection within a defined time window (e.g., 30 seconds).
- **Authentication Preservation**: Maintain authentication tokens for reconnection.
- **Challenge-Response**: Use challenge-response to verify reconnecting clients.
- **State Restoration**: Provide full state update on reconnection.
- **Game Continuation**: Resume game from last valid state if within reconnection window.

### 6.3 Game Interruption Handling
- **Auto-Pause**: Automatically pause the game on disconnection.
- **Notification**: Notify opponent of disconnection.
- **Timeout Policy**: Define when a disconnection results in game forfeit.
- **Fair Resolution**: Implement policies for fair resolution of interrupted games.

## 7. State Reconciliation

### 7.1 Conflict Detection
- **Version Comparison**: Compare client and server state versions.
- **Checksum Validation**: Validate state integrity using player-specific checksums.
- **Difference Detection**: Identify specific differences between client and server states.

### 7.2 Reconciliation Process
```
1. Client detects potential state inconsistency
2. Client requests state verification from server
3. Server sends version, timestamp, and player-specific checksum of current state
4. Client compares with local state:
   - If match: No action needed
   - If mismatch: Request full state update
5. Server sends filtered full state in a secure message
6. Client validates message security
7. Client replaces local state completely
```

### 7.3 Visual Smoothing
- **Transition Animation**: Animate transition to reconciled state when differences are minor.
- **Highlight Changes**: Briefly highlight reconciled elements that changed.
- **Notification**: Inform user when significant reconciliation occurs.

## 8. Synchronization Challenges and Solutions

### 8.1 BP Allocation Security
- **Challenge**: BP allocations must be secure and tamper-proof.
- **Solution**: 
  - Use secure message protocol with signatures for all BP allocations
  - Process allocations in constant time to prevent timing attacks
  - Never transmit opponent's BP values
- **Verification**: Server verifies allocations against player's available BP.

### 8.2 Fast-Moving Game States
- **Challenge**: Multiple state changes may occur rapidly during complex sequences.
- **Solution**: Implement state buffering to ensure all changes are applied in correct order.
- **Sequence Tracking**: Use sequence numbers to maintain order of updates.

### 8.3 Timer Synchronization
- **Challenge**: Client and server clocks may drift.
- **Solution**: Server is authoritative for time; client displays server-reported time remaining.
- **Update Frequency**: Send frequent timer updates during critical phases.

## 9. Spectator and Chat Synchronization

### 9.1 Spectator State Management
- **Join Process**: Spectators receive full (filtered) game state on join.
- **Visibility Filtering**: Spectators receive special visibility rules (no BP pools visible).
- **Delayed Broadcasting**: Implement optional delay for spectator updates to prevent cheating.
- **Limit Information**: Spectators receive only board state and public information.
- **Tracking**: Track spectator sessions separately from player sessions.
- **Secure Access**: Spectator access is authenticated and secured with the same protocols as players.

### 9.2 Chat Synchronization
- **Message Broadcasting**: Server broadcasts messages to all connected clients (players and spectators).
- **Join Time Filtering**: New spectators only receive messages from the time they joined.
- **Message Ordering**: Ensure consistent message ordering using timestamps.
- **Content Filtering**: Filter messages server-side before broadcasting.
- **Rate Limiting**: Implement rate limiting to prevent message flooding.
- **Secure Transmission**: Chat messages are wrapped in secure message protocol.

### 9.3 Player Information Synchronization
- **Name Updates**: Propagate player name changes to all clients.
- **Join Announcements**: Announce spectator joins/leaves to all participants.
- **Consistency Checking**: Ensure player information is consistent across all clients.
- **Minimal Data**: Share only necessary player information (name, status).
- **Privacy Considerations**: Never share sensitive or tracking information about players.

## 10. Implementation Components

### 10.1 Server-Side Implementation
- **WebSocketController**: Handles WebSocket connections, security validation, and message routing
- **AuthenticationService**: Manages challenges, tokens, and signature verification
- **GameManager**: Central component managing game state and coordinating services
- **StateManager**: Calculates player-specific filtered states
- **Delta Calculator**: Computes state changes between updates
- **Visibility Filter**: Filters state based on player visibility rules
- **Broadcast Manager**: Manages sending secure updates to connected clients

### 10.2 Client-Side Implementation
- **WebSocketService**: Manages secure WebSocket connection to server
- **AuthenticationManager**: Handles challenge-response and token management
- **StateStore**: Maintains current visible game state
- **SecureMessageHandler**: Processes incoming secure messages
- **Reconciliation Manager**: Handles state reconciliation
- **Prediction Manager**: Manages optimistic updates and rollbacks
- **SignatureGenerator**: Creates signatures for outgoing messages

### 10.3 Secure WebSocket Protocol
- **Connection Management**: Establish, maintain, and reconnect WebSocket connections.
- **Challenge-Response**: Authenticate connection with challenge-response.
- **Secure Message Structure**: Wrap all communication in SecureMessage format.
- **Error Handling**: Handle WebSocket errors and timeouts securely.
- **Reconnection Flow**: Define protocol for handling secure reconnection.