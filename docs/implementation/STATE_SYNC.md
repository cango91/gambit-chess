# State Synchronization Strategy

## 1. State Update Protocol

### 1.1 Core Principles
- **Server Authority**: Server is the single source of truth for game state.
- **Client Representation**: Clients maintain a representation of the visible game state.
- **Unidirectional Flow**: State flows from server to clients, with client inputs as events.
- **Filtered Visibility**: Each client receives only information they should see.
- **Client-Side Validation**: Clients can validate certain game rules (e.g., check detection) using shared utilities for improved UX, but server remains authoritative.

### 1.2 Update Types
- **Full State Updates**: Complete game state (filtered for visibility).
- **Delta Updates**: Only changed portions of the game state.
- **Event-Based Updates**: Notifications of specific game events.

### 1.3 Update Protocol
- **Initial State**: Full state update when game starts or player connects.
- **Turn Transitions**: Delta updates focusing on board changes and timer updates.
- **Duel Phases**: Event-based updates for duel progression.
- **Critical Updates**: Full state updates after potential desynchronization points.

## 2. Server-Side State Management

### 2.1 Authoritative Game State

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

### 2.2 State Transitions

State transitions occur through service method calls rather than internal events:

1. **Client Request**: Client sends a request via WebSocket (e.g., move, BP allocation)
2. **WebSocket Controller**: Routes request to the appropriate service method
3. **Service Processing**: Service validates and processes the request
4. **State Update**: GameManagerService updates the authoritative game state
5. **State Publication**: Updated state is filtered and published to clients via WebSocket

```
Client Request → WebSocketController → Service Method Call → 
State Update → Filtered State → Client Notification
```

For example, a move request follows this flow:
```
move.request → WebSocketController → BoardService.validateAndExecuteMove() → 
GameManagerService.updateState() → FilterStateByPlayer() → gameState.update to clients
```

### 2.3 State Persistence

Game state is persisted through a combination of in-memory and Redis storage:

- **Active Game Sessions**: Maintained in memory for performance
- **Backup State**: Periodically saved to Redis for fault tolerance
- **Recovery**: Game state can be reconstructed from Redis if needed
- **Historical Data**: Completed games archived to database

## 3. Latency Handling

### 3.1 Predictive Updates
- **Client Prediction**: Client predicts outcome of its own actions.
- **Temporary State**: Apply predicted changes to local state temporarily.
- **Visual Feedback**: Show predicted outcomes with visual indicators.
- **Reconciliation**: Reconcile with server state when confirmed.

### 3.2 Optimistic UI
- **Immediate Feedback**: Provide immediate visual feedback for user actions.
- **Pending State**: Display "pending" state for actions awaiting server confirmation.
- **Rollback Mechanism**: Smooth visual transition if server rejects prediction.

### 3.3 Performance Optimizations
- **Throttling**: Throttle update frequency for non-critical state changes.
- **Batching**: Batch multiple state changes into single updates.
- **Compression**: Compress state data for network efficiency.
- **Prioritization**: Prioritize critical updates during network congestion.

## 4. Disconnection Handling

### 4.1 Detection
- **Heartbeat**: Regular client-server heartbeat to detect disconnections.
- **WebSocket Events**: Monitor WebSocket connection status.
- **Timeout Detection**: Server-side timeout for inactive connections.

### 4.2 Reconnection Strategy
- **Session Persistence**: Maintain game state during short disconnections.
- **Reconnection Window**: Allow reconnection within a defined time window (e.g., 30 seconds).
- **State Restoration**: Provide full state update on reconnection.
- **Game Continuation**: Resume game from last valid state if within reconnection window.

### 4.3 Game Interruption Handling
- **Auto-Pause**: Automatically pause the game on disconnection.
- **Notification**: Notify opponent of disconnection.
- **Timeout Policy**: Define when a disconnection results in game forfeit.
- **Fair Resolution**: Implement policies for fair resolution of interrupted games.

## 5. State Reconciliation

### 5.1 Conflict Detection
- **Version Comparison**: Compare client and server state versions.
- **Checksum Validation**: Validate state integrity using checksums.
- **Difference Detection**: Identify specific differences between client and server states.

### 5.2 Reconciliation Process
```
1. Client detects potential state inconsistency
2. Client requests state verification from server
3. Server sends version, timestamp, and checksum of current state
4. Client compares with local state:
   - If match: No action needed
   - If mismatch: Request full state update
5. Server sends filtered full state
6. Client replaces local state completely
```

### 5.3 Visual Smoothing
- **Transition Animation**: Animate transition to reconciled state when differences are minor.
- **Highlight Changes**: Briefly highlight reconciled elements that changed.
- **Notification**: Inform user when significant reconciliation occurs.

## 6. Synchronization Challenges and Solutions

### 6.1 BP Allocation Synchronization
- **Challenge**: Both players must submit BP allocations independently.
- **Solution**: Implement commitment scheme where allocations are submitted as hashes first, then revealed.
- **Timeout Handling**: Define behavior if a player doesn't submit allocation within time limit.

### 6.2 Fast-Moving Game States
- **Challenge**: Multiple state changes may occur rapidly during complex sequences.
- **Solution**: Implement state buffering to ensure all changes are applied in correct order.
- **Sequence Tracking**: Use sequence numbers to maintain order of updates.

### 6.3 Timer Synchronization
- **Challenge**: Client and server clocks may drift.
- **Solution**: Server is authoritative for time; client displays server-reported time remaining.
- **Update Frequency**: Send frequent timer updates during critical phases.

## 8. Spectator and Chat Synchronization

### 8.1 Spectator State Management
- **Join Process**: Spectators receive full (filtered) game state on join.
- **Visibility Filtering**: Spectators receive special visibility rules (no BP pools visible).
- **Delayed Broadcasting**: Implement optional delay for spectator updates to prevent cheating.
- **Limit Information**: Spectators receive only board state and public information.
- **Tracking**: Track spectator sessions separately from player sessions.

### 8.2 Chat Synchronization
- **Message Broadcasting**: Server broadcasts messages to all connected clients (players and spectators).
- **Join Time Filtering**: New spectators only receive messages from the time they joined.
- **Message Ordering**: Ensure consistent message ordering using timestamps.
- **Content Filtering**: Filter messages server-side before broadcasting.
- **Rate Limiting**: Implement rate limiting to prevent message flooding.

### 8.3 Player Information Synchronization
- **Name Updates**: Propagate player name changes to all clients.
- **Join Announcements**: Announce spectator joins/leaves to all participants.
- **Consistency Checking**: Ensure player information is consistent across all clients.
- **Minimal Data**: Share only necessary player information (name, status).
- **Privacy Considerations**: Never share sensitive or tracking information about players.

### 9.1 Server-Side Implementation
- **State Manager**: Central component managing game state.
- **Delta Calculator**: Computes state changes between updates.
- **Visibility Filter**: Filters state based on player visibility rules.
- **Broadcast Manager**: Manages sending updates to connected clients.

### 9.2 Client-Side Implementation
- **State Store**: Maintains current visible game state.
- **Update Processor**: Processes incoming state updates.
- **Reconciliation Manager**: Handles state reconciliation.
- **Prediction Manager**: Manages optimistic updates and rollbacks.

### 9.3 WebSocket Protocol
- **Connection Management**: Establish, maintain, and reconnect WebSocket connections.
- **Message Structure**: Define message format for state updates and events.
- **Error Handling**: Handle WebSocket errors and timeouts.
- **Reconnection Flow**: Define protocol for handling reconnection.