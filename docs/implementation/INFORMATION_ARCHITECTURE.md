# Information Architecture Document

## 1. Data Ownership Matrix

| Data Category | Owner | Access Pattern | Persistence |
|---------------|-------|----------------|-------------|
| Game State | Server | Server writes, Clients read filtered view | Temporary (Redis) |
| Board State | Server | Server writes, Clients read | Temporary |
| BP Pools | Server | Server writes, Each client reads **ONLY their own** | Temporary |
| BP Allocations | Server | Client writes (submit), Server processes, Revealed to opponent after duel resolution | Temporary |
| BP Regeneration | Server | Server calculates, Each client sees **ONLY their own** during active games | Temporary |
| Previous Board States | Server | Server only (for de novo tactical detection) | Temporary |
| Move History | Server | Server writes, Clients read | Temporary |
| Game Results | Server | Server writes, Clients read | Persistent (DB) |
| User Authentication | Server | Server validates, Clients request | Persistent |
| Player Information | Server | Server stores, Clients read | Temporary |
| Game Configuration | Server | Server defines, Clients receive | Configuration |
| Chess Timers | Server | Server writes/controls, Clients read | Temporary |
| Knight Retreat Table | Shared | Generated at build time, read-only | Static (encoded) |
| Chat Messages | Server | Clients write, Server broadcasts, Clients read | Temporary |
| Spectator List | Server | Server writes, Clients read | Temporary |
| UI State | Client | Client only | Local only |
| Animation State | Client | Client only | Local only |

## 2. Information Visibility Rules

### 2.1 Fully Visible to Both Players and Spectators
- Current board position (pieces and locations)
- Whose turn it is
- Check status
- Game result when determined
- Move history
- Both players' remaining time
- Opponent's BP allocation after duel resolution (not during allocation phase)
- Knight retreat options (derived from pre-calculated table)
- Chat messages

### 2.2 Visible to Specific Player Only
- **Player's own BP pool** (opponent's BP pool remains hidden)
- Valid moves for the player's pieces
- BP allocation options for the player
- Tactical retreat options after a failed capture
- Connection status
- Own BP regeneration amounts

### 2.3 Hidden Information
- **Opponent's BP pool** (displayed as "?" in UI)
- **Opponent's BP regeneration amounts** (during active games)
- Opponent's BP allocation during a duel (until revealed)
- Opponent's tactical retreat calculation before decision
- Server-side validation details
- De novo tactical advantage calculations

### 2.4 Spectator Visibility
- Spectators see the same information as players with these differences:
  - No BP pool values for either player (shown as "?" for both)
  - No BP regeneration amounts for either player during active games
  - No access to allocation interfaces or retreat selection
  - Can view game history and current board state
  - Can see chat messages from when they joined only

## 3. State Transition Flows

### 3.1 Game Initialization Flow
```
Server: Create game session
Server: Initialize board and BP pools
Server: Notify clients game is ready
Clients: Initialize UI and connect to game
Server: Determine first player
Server: Send initial game state to clients (with opponent BP hidden)
Clients: Render initial board state
```

### 3.2 Move Execution Flow
```
Client: Player selects piece
Client: (Optional) Client highlights valid moves
Client: Player selects destination
Client: Sends move to server
Server: Validates move
Server: If invalid, rejects with reason
Server: If valid non-capture, updates game state
Server: If valid capture attempt, initiates duel
Server: Stores pre-move board state for de novo tactical detection
Server: Notifies clients of state change
Client: Updates display and animates move
```

### 3.3 Duel Resolution Flow
```
Server: Detects capture attempt
Server: Pauses active player's timer
Server: Notifies both clients of duel
Clients: Display BP allocation interface
Clients: Players allocate BP and submit
Server: Receives allocations
Server: Calculates outcome
Server: Updates game state (capture or failed)
Server: Reveals both players' BP allocations to each other
Server: If failed, calculates tactical retreat options for attacker using Knight Retreat Table for knights or standard rules for other pieces
Server: If failed, offers tactical retreat to attacker
Client (Attacker): Selects retreat option
Server: Validates and updates game state
Server: Resumes active player's timer if their turn continues, or starts opponent's timer if turn changes
Server: Notifies both clients of outcome (now including actual BP allocations)
Clients: Animate results and display allocation values
```

### 3.4 BP Regeneration Flow
```
Server: Player completes turn
Server: Compares current board state with pre-move state
Server: Identifies DE NOVO tactical advantages created in this turn ONLY
Server: Calculates BP regeneration based on new tactical positions
Server: Updates player's BP pool
Server: Includes updated BP in state update (only to the player who owns the BP)
Client: Displays updated BP value for the player (opponent's remains as "?")
```

### 3.5 Client-Side Functions

| Function | Responsibility | Domain | Constraints |
|----------|----------------|--------|------------|
| `highlightValidMoves(piece)` | Show valid moves for selected piece | Client | Visual aid only, not authoritative |
| `isInCheck(board, kingColor)` | Check if a king is in check position | Shared | Used for client-side UX and move validation |
| `animateMove(from, to)` | Animate piece movement | Client | Should handle both regular moves and captures |
| `animateDuelResult(result)` | Animate duel outcome | Client | Should show both success and failure cases |
| `updateGameState(newState)` | Update client game state | Client | Must handle partial and full updates |
| `submitBPAllocation(amount)` | Submit player's BP allocation | Client | Must validate against available BP |
| `selectRetreatPosition(position)` | Submit tactical retreat choice | Client | Must validate against available options |
| `reconcileGameState(serverState)` | Reconcile local state with server | Client | Must handle conflicts |
| `updateTimerDisplay(whiteTime, blackTime, activeColor)` | Update chess timer display | Client | Must reflect server-authoritative time |

## 4. Event Catalog

### 4.1 Server-to-Client Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| `gameState.update` | GameStateDTO | Complete game state update that includes all relevant information (board state, game phase, turn, timers, etc.). Information is filtered based on player visibility rules before sending. This is the primary mechanism for communicating state changes to clients. |
| `duel.initiated` | DuelInitiatedDTO | Notification that a duel has started |
| `duel.outcome` | DuelOutcomeDTO | Result of a duel including both players' actual BP allocations |
| `retreat.options` | RetreatOptionsDTO | Available tactical retreat options with associated BP costs |
| `game.check` | {gameId, kingPosition, color} | Notification that a king is in check |
| `game.over` | {gameId, result, reason} | Notification of game completion (checkmate, draw, etc.) |
| `player.joined` | PlayerDTO | Notification that a player joined the game |
| `player.left` | {gameId, playerId} | Notification that a player left the game |
| `player.reconnected` | {gameId, playerId} | Notification that a player reconnected to the game |
| `spectator.joined` | SpectatorDTO | Notification that a spectator joined |
| `spectator.left` | {gameId, spectatorId} | Notification that a spectator left |
| `chat.message` | ChatMessageDTO | Chat message from a player |
| `error` | ErrorDTO | Error notification |
| `move.result` | {success, error?, checkDetected?, captureAttempted?} | Result of a move request |

### 4.2 Client-to-Server Events

| Event Name | Payload | Description |
|------------|---------|-------------|
| `move.request` | MoveDTO | Request to move a piece |
| `duel.allocate` | BPAllocationDTO | BP allocation for current duel |
| `retreat.select` | RetreatDTO | Selected tactical retreat position |
| `chat.message` | ChatMessageDTO | Send a chat message |
| `game.resign` | ResignDTO | Player resigns the game |
| `game.offerDraw` | DrawOfferDTO | Player offers a draw |
| `game.respondDraw` | DrawResponseDTO | Response to draw offer |
| `connection.ping` | ConnectionPingDTO | Connection health check |
| `spectator.join` | SpectatorJoinDTO | Request to join as a spectator |
| `player.setName` | PlayerNameDTO | Set player name |

## 5 Server Architecture

The server implementation follows a service-oriented architecture with clear component responsibilities rather than an internal event-driven approach. This provides cleaner control flow, better testability, and more predictable behavior.

#### Core Components

1. **Game Manager Service**
   - Manages game lifecycle (creation, joining, termination)
   - Tracks active games in memory with Redis backup
   - Coordinates game-related operations across services
   - Filters game state based on player visibility rules
   - Handles player and spectator connections

2. **WebSocket Controller**
   - Manages WebSocket connections and message routing
   - Maps client messages to appropriate service calls
   - Broadcasts filtered game state updates to clients
   - Handles authentication and session management
   - Manages reconnection and disconnection logic

3. **Game Logic Services**
   - **Board Service**: Manages chess board state and move validation
   - **BP Manager**: Handles BP pools, allocation, duel resolution, and regeneration
   - **Tactical Detector**: Identifies tactical advantages for BP regeneration
   - **Timer Service**: Controls chess timers and enforces time limits

4. **Data Services**
   - **Redis Repository**: Temporary state storage and recovery
   - **Database Repository**: Game history and statistics

#### Key Operations

| Operation | Responsibility | Description |
|-----------|----------------|-------------|
| Game State Management | Game Manager | Maintaining and updating authoritative game state |
| State Filtering | Game Manager | Filtering game state based on player visibility rules |
| Board State Tracking | Board Service | Storing board states for tactical advantage detection |
| Tactical Analysis | Tactical Detector | Analyzing board for tactical advantages |
| BP Regeneration | BP Manager | Calculating BP regeneration based on tactical advantages |
| Duel Resolution | BP Manager | Processing BP allocations and determining outcomes |
| Timer Management | Timer Service | Starting, pausing, resuming, and switching player timers |
| Player Management | Game Manager | Handling player connections, disconnections, and reconnections |
| Spectator Management | Game Manager | Managing spectator access and visibility |
| Chat Processing | WebSocket Controller | Filtering and broadcasting chat messages |

This architecture ensures:
- Clear separation of concerns with well-defined responsibilities
- Stateful game session management for performance
- Effective enforcement of security and domain boundaries
- Scalable design for handling multiple concurrent games
- Maintainable codebase with testable components

## 6. Chess Timer System

### 6.1 Timer Operation
- Each player has their own chess timer (standard chess clock rules)
- Only one player's timer runs at any given time
- Timer switches when a player completes their turn
- Timer pauses during duel allocation phases for both players
- Timer pauses during tactical retreat selection for the attacker
- Timer resumes for the active player after duel/retreat resolution
- If a player's time expires, they lose the game
- Standard time controls can be configured (e.g., 5+3, 10+5, etc.)

### 6.2 Timer State Transitions
```
Game Start → White's Timer Starts
White Moves → White's Timer Stops → Black's Timer Starts
Capture Attempt → Active Player's Timer Pauses → Duel Resolution
After Duel → (If turn changes) Switch Timer → (If same player's turn) Resume Timer
Player Timeout → Game Ends with Timeout Loss
```

## 7. Tactical Retreat System

### 7.1 General Tactical Retreat Rules
- All pieces that lose a duel can retreat
- Returning to the original position always costs 0 BP
- Different piece types have different retreat rules and cost calculations

### 7.2 Long-Range Piece Retreat Rules (Bishop, Rook, Queen)
- Can retreat along their axis of attack only:
  - Bishop: Along the diagonal used for the attack
  - Rook: Along the rank or file used for the attack
  - Queen: Along whichever axis was used (diagonal, rank, or file)
- BP cost equals the distance from original position (measured in squares)
- Cannot retreat through other pieces (blocked paths)
- Cannot retreat to a square occupied by another piece

### 7.3 Knight Retreat Rule Definition
- A knight that loses a duel (failed capture) has specific retreat options:
  - Return to original position at 0 BP cost (always available)
  - Move to any square within the rectangular area formed by original position and failed capture position, except:
    - Cannot move to the failed capture square
    - Original position is already covered by the free return rule
  - BP cost equals the minimum number of standard knight moves required to reach that square from original position

### 7.4 Knight Retreat Example
```
Knight at a1 attempts to capture at b3 but fails:
- Rectangle formed is a1-b3, containing: a1, a2, a3, b1, b2, b3
- Valid retreat options:
  - a1: 0 BP (original position - always free)
  - a2: 3 BP (requires min. 3 knight moves from a1)
  - a3: 2 BP (requires min. 2 knight moves from a1)
  - b1: 3 BP (requires min. 3 knight moves from a1)
  - b2: 4 BP (requires min. 4 knight moves from a1)
  - b3: Invalid (failed capture position)
```

### 7.5 Implementation Approach
```
1. Knight Retreats:
   - Pre-compute all possible knight positions and capture attempts at build time
   - For each scenario, calculate valid retreat squares and their costs
   - Store in an efficient encoded format
   - At runtime, server looks up retreat options from the table

2. Long-Range Piece Retreats:
   - Calculate dynamically at runtime in shared code
   - Generate all positions along the attack axis
   - Filter invalid positions (occupied, off-board)
   - Calculate cost based on distance from original position
   - Both client and server use the same shared calculation
```

## 8. De Novo Tactical Detection

### 8.1 De Novo Definition
A tactical advantage is considered "de novo" (newly created) only if:
- It did not exist in the board state at the beginning of the player's turn
- It was directly created by the player's move in the current turn
- Pre-existing tactical advantages that are maintained but not newly created do not qualify

### 8.2 De Novo Implementation Approach
```
1. Store board state at beginning of player's turn
2. After move is completed, analyze new board state
3. Compare tactical advantages before and after the move
4. Identify only the new advantages that didn't exist before
5. Apply BP regeneration only for these new (de novo) advantages
```

## 9. Data Flow Diagrams

### 9.1 Main Game Loop
```
Player Input → Client Validation → Server Validation → 
Game State Update → State Distribution (with visibility filters) → Client Rendering
```

### 9.2. Duel System
```
Capture Attempt → Timer Pause → Duel Initiation → BP Allocation Collection →
Outcome Determination → Reveal BP Allocations → State Update → 
(If Failed) Knight Retreat Table Lookup → (Optional) Tactical Retreat → 
Final State Update → Timer Resume/Switch → Client Animation (with BP allocation values shown)
```

### 9.3 BP Regeneration
```
Store Pre-move Board State → Execute Move → Compare Board States →
Identify De Novo Tactical Advantages Only → BP Value Calculation →
Pool Update → Filtered Client Notification (only to BP owner)
```
## 10. Social System
### 10.1 Player Identification
- Players provide a display name at the start of a game
- Names must be 3-20 characters and follow content guidelines
- Names are visible to opponent and spectators
- No persistent accounts or authentication required
- Session-based identity is maintained for the duration of the game

### 10.2 Chat System
- In-game chat allows communication between players
- Chat is visible to both players and all spectators
- Messages are filtered for inappropriate content
- Chat history is available from the moment a player/spectator joins
- Previous chat history is not available to new spectators
- Chat is ephemeral and not persisted after game completion

### 10.3 Spectator Mode
- Spectators can join ongoing games via shareable link
- Spectators see the same board state as players
- Spectators cannot see either player's BP pool (shown as "?")
- Spectators cannot see BP regeneration amounts during active play
- Spectator count is visible to both players
- Spectator join/leave events are announced in chat
- Spectator mode has a configurable delay (0-60 seconds) to prevent cheating