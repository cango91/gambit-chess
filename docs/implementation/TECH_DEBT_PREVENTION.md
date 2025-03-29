# Technical Debt Prevention Plan

## 1. AI Session Handoff Protocol

### 1.1 Session Documentation Requirements
- **Current State Summary**: Document the current state of implementation at the end of each AI session.
- **Decision Log**: Record key decisions and rationales.
- **Pending Tasks**: List incomplete tasks and planned next steps.
- **Context Preservation**: Maintain context between sessions by explicitly documenting assumptions.

### 1.2 Session Structure
```
1. Initialization:
   - Review previous session documentation
   - Load domain boundaries document
   - Identify target components for current session
   
2. Implementation:
   - Follow component ownership matrix
   - Reference function responsibility map
   - Adhere to implementation contracts
   
3. Documentation:
   - Update implementation status
   - Document decisions and rationales
   - Identify potential technical debt
   
4. Handoff:
   - Create session summary
   - Flag any deviations from contracts
   - List next priority tasks
```

### 1.3 Documentation Template
```markdown
## Session Summary

**Date**: YYYY-MM-DD
**Focus**: [Component(s) worked on]
**Status**: [Progress made]

### Implemented Components
- [Component Name]: [Status] - [Brief description]
- ...

### Key Decisions
- [Decision]: [Rationale]
- ...

### Known Limitations
- [Limitation]: [Possible future resolution]
- ...

### Next Priority Tasks
- [Task]: [Expected complexity]
- ...
```

## 2. Component Ownership Matrix

### 2.1 Shared Domain Components

| Component | Purpose | Ownership | Dependencies | Implementation Status |
|-----------|---------|-----------|--------------|------------------------|
| Position | Board coordinate representation | Shared | None | Implemented |
| ChessPiece | Piece type, color, and movement | Shared | Position | Implemented |
| MoveDTO | Data transfer object for moves | Shared | Position | Implemented |
| GameStateDTO | Filtered game state for client | Shared | ChessPiece, Position | Implemented |
| BPAllocationDTO | BP allocation data transfer | Shared | None | Implemented |
| PlayerDTO | Player information model | Shared | None | Implemented |
| ChatMessageDTO | Chat message data transfer | Shared | PlayerDTO | Implemented |
| SpectatorDTO | Spectator information model | Shared | None | Implemented |
| NotationConverter | Chess notation conversion | Shared | Position | Implemented |
| GambitNotation | Extended notation for Gambit Chess | Shared | NotationConverter | Implemented |
| PGNConverter | PGN format with Gambit Chess extensions | Shared | GambitNotation | Implemented | 
| PieceMovementPatterns | Standard chess movements | Shared | None | Implemented |
| KnightRetreatTable | Pre-calculated knight retreat options | Shared | None | Implemented |
| KnightRetreatGenerator | Script to generate retreat table | Shared | None | Implemented |
| TacticalRetreatCalculator | Calculate retreat options for all pieces | Shared | Position | Implemented |
| CheckDetector | Detect check conditions | Shared | ChessPiece, Position, PieceMovementPatterns | Implemented |

### 2.2 Server Domain Components

| Component | Purpose | Ownership | Dependencies | Implementation Status |
|-----------|---------|-----------|--------------|------------------------|
| GameState | Complete authoritative game state | Server | All DTOs | Implemented |
| MoveValidator | Validates chess moves | Server | GameState | Implemented |
| BPManager | Manages BP pools and allocation | Server | GameState | Implemented |
| DuelResolver | Resolves BP duels | Server | BPManager | Implemented |
| TacticalRetreatCalculator | Calculates retreat options | Server | GameState | Implemented |
| CheckDetector | Detects check conditions | Server, Shared | GameState, ChessPiece, Position, PieceMovementPatterns | Implemented |
| CheckmateDetector | Detects checkmate conditions | Server | CheckDetector | Implemented |
| TimerController | Manages chess timers | Server | None | Implemented |
| TacticalDetector | Detects tactical advantages | Server | GameState | Implemented |
| BPRegenerator | Calculates BP regeneration | Server | TacticalDetector | Implemented |
| GameManager | Manages game lifecycles | Server | GameState, BPManager, TacticalDetector | Implemented |
| GameStateService | Handles game state transitions | Server | Board, BPManager | Implemented |
| ServiceFactory | Manages service dependencies | Server | All services | Implemented |
| RedisGameRepository | Persists game states in Redis | Server | GameState | Implemented |
| ConfigModule | Centralized configuration | Server | None | Implemented |
| GameSessionManager | Manages game sessions | Server | GameState | Planned |
| WebSocketController | Handles WebSocket communication | Server | None | Planned |
| PlayerAuthenticator | Authenticates players | Server | None | Planned |
| PlayerManager | Manages player information | Server | PlayerDTO | Implemented |
| SpectatorManager | Manages spectator sessions | Server | SpectatorDTO | Implemented |
| ChatManager | Manages chat functionality | Server | ChatMessageDTO | Planned |
| ContentFilter | Filters chat and player names | Server | None | Planned |

### 2.3 Client Domain Components

| Component | Purpose | Ownership | Dependencies | Implementation Status |
|-----------|---------|-----------|--------------|------------------------|
| ChessBoard | Visual representation of board | Client | None | Planned |
| ChessPieceRenderer | Renders chess pieces | Client | ChessBoard | Planned |
| ClientGameState | Client-side game state | Client | GameStateDTO | Planned |
| MoveInputHandler | Handles user move inputs | Client | ChessBoard | Planned |
| BPAllocationUI | UI for BP allocation | Client | None | Planned |
| TacticalRetreatUI | UI for tactical retreat | Client | None | Planned |
| GameAnimator | Handles game animations | Client | ChessBoard | Planned |
| TimerDisplay | Displays chess timers | Client | None | Planned |
| WebSocketClient | Manages WebSocket connection | Client | None | Planned |
| NotificationUI | Displays game notifications | Client | None | Planned |
| GameStateRenderer | Renders game state | Client | ClientGameState | Planned |
| PlayerNameInput | Input for player names | Client | None | Planned |
| ChatUI | Chat interface component | Client | None | Planned |
| ChatMessageList | Displays chat messages | Client | ChatMessageDTO | Planned |
| SpectatorList | Displays current spectators | Client | SpectatorDTO | Planned |
| GameShareUI | UI for sharing game with spectators | Client | None | Planned |

## 3. Function Responsibility Map

### 3.1 Core Game Logic Functions

| Function | Responsibility | Domain | Constraints |
|----------|----------------|--------|------------|
| `validateMove(move, gameState)` | Validate chess move against rules | Server | Must check all chess rules including check |
| `isValidCapture(move, gameState)` | Check if capture attempt is valid | Server | Precursor to duel resolution |
| `calculateBPRegeneration(prevState, newState)` | Calculate BP regeneration | Server | Must compare states to identify de novo tactics |
| `detectCheck(gameState)` | Detect if a king is in check | Server, Shared | Must consider all possible threats |
| `detectCheckmate(gameState)` | Detect if a king is in checkmate | Server | Must exhaustively check all possible moves |
| `detectDraw(gameState)` | Detect draw conditions | Server | Must check stalemate, repetition, insufficient material |
| `resolveDuel(attacker, defender, attackerBP, defenderBP)` | Resolve BP duel | Server | Must handle all outcomes including retreats |
| `calculateRetreatOptions(piece, fromPos, toPos)` | Calculate valid retreat options | Server | Must follow tactical retreat rules |

### 3.2 Client-Side Functions

| Function | Responsibility | Domain | Constraints |
|----------|----------------|--------|------------|
| `highlightValidMoves(piece)` | Show valid moves for selected piece | Client | Visual aid only, not authoritative |
| `animateMove(from, to)` | Animate piece movement | Client | Should handle both regular moves and captures |
| `animateDuelResult(result)` | Animate duel outcome | Client | Should show both success and failure cases |
| `updateGameState(newState)` | Update client game state | Client | Must handle partial and full updates |
| `submitBPAllocation(amount)` | Submit player's BP allocation | Client | Must validate against available BP |
| `selectRetreatPosition(position)` | Submit tactical retreat choice | Client | Must validate against available options |
| `reconcileGameState(serverState)` | Reconcile local state with server | Client | Must handle conflicts |
| `updateTimerDisplay(whiteTime, blackTime, activeColor)` | Update chess timer display | Client | Must reflect server-authoritative time |

### 3.3 WebSocket Event Handlers

| Event Handler | Responsibility | Domain | Constraints |
|---------------|----------------|--------|------------|
| `onGameStateUpdate(update)` | Process game state update | Client | Must handle filtered visibility |
| `onDuelInitiated(duelInfo)` | Handle duel initiation | Client | Must prompt for BP allocation |
| `onDuelOutcome(outcome)` | Handle duel resolution | Client | Must animate result and show allocations |
| `onRetreatOptions(options)` | Handle retreat options | Client | Must display available retreat positions |
| `onError(error)` | Handle error from server | Client | Must provide appropriate user feedback |
| `onDisconnect()` | Handle disconnection | Client | Must attempt reconnection |
| `onReconnect()` | Handle successful reconnection | Client | Must request current game state |

## 4. Code Generation Guidelines

### 4.1 General Guidelines
- **Single Responsibility**: Each class/function should have a single responsibility.
- **Domain Separation**: Strictly adhere to domain boundaries.
- **Clear Naming**: Use descriptive, consistent naming conventions.
- **Comprehensive Documentation**: Document all public interfaces.
- **Error Handling**: Implement consistent error handling patterns.
- **Type Safety**: Use TypeScript interfaces for all data structures.
- **Dependency Management**: Never edit package.json dependencies manually. Instead, always generate and use `yarn workspace <workspace> add [-D] <(dev)dependency>` commands to modify dependencies.

### 4.2 AI Session Instructions

```
When implementing [Component], follow these guidelines:
1. Review the domain boundary definition to ensure proper separation
2. Use the component ownership matrix to identify dependencies
3. Implement functions according to the function responsibility map
4. Follow type definitions from shared domain
5. Implement error handling for all edge cases
6. Add JSDoc documentation for all public interfaces
7. Follow test-driven development by defining tests first
8. Never manually edit package.json files - use yarn workspace commands instead:
   - To add a dependency: `yarn workspace <workspace> add <dependency>`
   - To add a dev dependency: `yarn workspace <workspace> add -D <devDependency>`
9. When using the shared workspace, ensure tsconfig.json properly resolves @gambit-chess/shared
```

### 4.3 Code Quality Checks

- **Type Consistency**: Ensure consistent use of types across domains.
- **Interface Adherence**: Verify implementation matches interface contracts.
- **Domain Boundary**: Check for improper cross-domain dependencies.
- **Duplicate Functionality**: Identify and eliminate duplicate implementations.
- **Edge Case Handling**: Verify all edge cases are properly handled.
- **Performance Impact**: Assess potential performance bottlenecks.

## 5. Implementation Contract Format

### 5.1 Component Contract Template

```typescript
/**
 * @component ComponentName
 * @domain [Shared|Server|Client]
 * @responsibility Primary responsibility of this component
 *
 * @dependencies
 * - Dependency1: Purpose of dependency
 * - Dependency2: Purpose of dependency
 *
 * @publicMethods
 * - methodName(param1: Type, param2: Type): ReturnType
 *   Description of method behavior, constraints, and edge cases
 *
 * @emittedEvents (if applicable)
 * - eventName: Description and payload structure
 *
 * @implementation
 * Required implementation details, algorithms, or approaches
 *
 * @buildSteps (if applicable for shared components)
 * Description of any pre-build steps required for this component
 *
 * @edgeCases
 * - Edge case 1: Expected handling
 * - Edge case 2: Expected handling
 */
```

### 5.2 Function Contract Template

```typescript
/**
 * @function functionName
 * @domain [Shared|Server|Client]
 * @description Detailed description of function purpose
 *
 * @param paramName {Type} Description of parameter
 * @returns {ReturnType} Description of return value
 *
 * @throws {ErrorType} Conditions that cause errors
 *
 * @algorithm
 * Description of algorithm or approach if complex
 *
 * @edgeCases
 * - Edge case 1: Expected handling
 * - Edge case 2: Expected handling
 *
 * @example
 * // Usage example
 * const result = functionName(param1, param2);
 */
```

## 6. Build and Workspace Integration

### 6.1 Shared Workspace Build Process
- **Pre-build Step**: The shared workspace must run a script before building to generate the knight retreat table.
- **Knight Retreat Table Generation**: 
  - Must run as part of the build process
  - Generates a lookup table for all valid knight retreat options from any position
  - Encodes position and cost data efficiently (3 bits for posX, 3 bits for posY, 3 bits for cost)
  - Compresses and stores as base64-encoded data
  - Table should encode for each original knight position and each possible failed capture position:
    - All valid retreat positions (squares within the rectangle formed by original position and failed capture position)
    - Cost for each retreat position (minimum number of standard knight moves required to reach that square from original position)
    - Original position is always included with cost 0
    - Failed capture position is always excluded

### 6.2 Knight Tactical Retreat Rules
- **Return to Original**: Knight can return to its original position at 0 BP cost.
- **Rectangle Principle**: Valid retreat positions are squares within the rectangular area formed by the original position and failed capture position.
- **Exclusions**: 
  - Failed capture square is never a valid retreat option
  - Original position is already covered by the free return rule
- **Cost Calculation**: BP cost equals the minimum number of standard knight moves required to reach that square from the original position.
- **Example**: 
  - Knight at a1 fails capture at b3
  - Rectangle includes a1, a2, a3, b1, b2, b3
  - Valid retreats: a1 (0 BP), a2 (3 BP), a3 (2 BP), b1 (3 BP), b2 (4 BP)
  - b3 is invalid (failed capture position)

### 6.3 Long-Range Piece Tactical Retreat Rules
- **Bishops**: Can retreat along the same diagonal used for the attack.
- **Rooks**: Can retreat along the same rank or file used for the attack.
- **Queens**: Can retreat along whichever axis was used (diagonal, rank, or file).
- **Cost Calculation**: BP cost equals the distance from original position (measured in squares).
- **Limitations**: Cannot retreat through blocked paths or to occupied squares.
- **Implementation**: Should be calculated dynamically at runtime in shared code.

### 6.4 Workspace Integration
- **Shared Module Dependency**: The shared workspace must be built and manually added to upstream package.json.
- **No File References**: Never use the `file:` syntax in package.json references.
- **Path Resolution**: Configure tsconfig.json in upstream packages to correctly resolve the `@gambit-chess/shared` module.
- **Build Order**: Always build shared module first before building dependent workspaces.

## 7. Technical Debt Tracking

### 7.1 Debt Categorization
- **Architectural**: Major structural issues requiring significant refactoring.
- **Implementation**: Sub-optimal implementations that work but need improvement.
- **Duplication**: Redundant code that should be consolidated.
- **Testing**: Missing or inadequate test coverage.
- **Documentation**: Missing, outdated, or unclear documentation.

### 7.2 Debt Tracking Format

```markdown
## Technical Debt Item

**Category**: [Architectural|Implementation|Duplication|Testing|Documentation]
**Component**: Affected component
**Priority**: [High|Medium|Low]
**Estimated Effort**: [Small|Medium|Large]

### Description
Detailed description of the technical debt item

### Impact
Consequences of not addressing this debt

### Resolution Approach
Proposed approach to resolve this debt

### Created
Date when this debt was identified

### Resolved
Date when this debt was resolved (if applicable)
```
### 7.3 Debt Prevention Strategies
- **Regular Review**: Schedule regular technical debt review sessions.
- **Boy Scout Rule**: Leave code cleaner than you found it.
- **Implementation Contracts**: Verify implementations against contracts.
- **Automated Checks**: Implement automated checks for common debt patterns.
- **Documentation Currency**: Keep documentation in sync with implementation.


