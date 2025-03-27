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

## 2. State Data Structure

### 2.1 Game State Components
- **Board State**: Current position of all pieces.
- **Game Phase**: Current phase (normal play, duel allocation, tactical retreat).
- **Turn Information**: Current player, move number.
- **Timer State**: Remaining time for each player, active timer.
- **BP Pools**: Current BP pools (filtered by player visibility).
- **Game Status**: Check status, game result if ended.
- **Player Information**: Player names and basic information.
- **Chat Messages**: Recent chat history (filtered based on join time).
- **Spectator List**: Current spectators viewing the game.

### 2.2 Delta Structure
```typescript
interface StateDelta {
  sequence: number;          // Monotonically increasing sequence number
  timestamp: number;         // Server timestamp
  changedFields: {           // Map of changed paths to new values
    [path: string]: any;
  };
  events: GameEvent[];       // Events that caused this delta
}
```

### 2.3 Versioning
- **Sequence Numbers**: Each state update includes a monotonically increasing sequence number.
- **State Version**: Full game state has a version number for reconciliation.
- **Timestamp**: Server timestamp for ordering and conflict resolution.

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