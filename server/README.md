# Gambit Chess - Server Implementation

## Overview

The server implementation of Gambit Chess provides the authoritative game state management and real-time communication layer. This guide focuses on how to properly use the shared module (`@gambit-chess/shared`) to implement server-side features.

## Core Principles

1. **Server Authority**: The server is the single source of truth for game state
2. **Type Safety**: Use factory functions and value objects for all domain types
3. **Domain Boundaries**: Never import from client, use shared types only
4. **Information Hiding**: Carefully manage what information is exposed to clients

## Using the Shared Module

### 1. Value Objects and Factory Functions

ALWAYS use CAPITALIZED factory functions to create domain objects:

```typescript
import { POSITION, PIECE_COLOR, PIECE_TYPE } from '@gambit-chess/shared';

// Create value objects using factories (✅ Correct)
const position = POSITION('e4');
const color = PIECE_COLOR('white');
const pieceType = PIECE_TYPE('queen');

// Direct instantiation (❌ Incorrect)
const position = new ChessPosition('e4'); // Don't do this
```

### 2. Chess Engine Implementation

Extend the minimal chess engine for server-side features:

```typescript
import { 
    MinimalChessEngine, 
    IConfigProvider,
    IMinimalEngineState 
} from '@gambit-chess/shared';

class ServerChessEngine extends MinimalChessEngine {
    constructor(config: IConfigProvider) {
        super(config);
    }

    // Implement server-specific features
    public detectCheckmate(): boolean {
        // Server-side checkmate detection logic
    }

    public detectStalemate(): boolean {
        // Server-side stalemate detection logic
    }

    public evaluateDrawConditions(): boolean {
        // Server-side draw condition evaluation
    }
}
```

### 3. Config Provider Implementation

```typescript
import { 
    IConfigProvider, 
    TimeControlConfig 
} from '@gambit-chess/shared';

class ServerConfigProvider implements IConfigProvider {
    private config: Record<string, any>;

    constructor() {
        this.config = {
            timeControl: {
                initial: 600000, // 10 minutes
                increment: 5000  // 5 seconds
            },
            gambitChess: {
                maxBPAllocation: 10,
                bpRegenerationRate: 1
            }
        };
    }

    get timeControl(): TimeControlConfig {
        return this.config.timeControl;
    }

    get gambitChess() {
        return this.config.gambitChess;
    }
}
```

### 4. Data Transfer Objects (DTOs)

Always use DTO converters for client communication:

```typescript
import { 
    GameStateDTO, 
    MoveDTO,
    validateGameStateDTO,
    validateMoveDTO
} from '@gambit-chess/shared';

class GameStateManager {
    // Convert internal state to DTO before sending to client
    public getStateForClient(playerId: string): GameStateDTO {
        const state = this.engine.getState();
        return {
            ...state,
            // Filter hidden information
            bp: this.shouldShowBP(playerId) ? state.bp : undefined,
            // Add visible information
            canClaimDraw: this.canPlayerClaimDraw(playerId)
        };
    }

    // Validate incoming DTOs
    public handleMove(moveDTO: MoveDTO): void {
        if (!validateMoveDTO(moveDTO)) {
            throw new Error('Invalid move data');
        }
        // Process move...
    }
}
```

### 5. Event Handling

Use shared event types for WebSocket communication:

```typescript
import { 
    GameEvent,
    MoveRequestEvent,
    DuelInitiatedEvent
} from '@gambit-chess/shared';

class GameEventHandler {
    public handleEvent(event: GameEvent): void {
        switch (event.type) {
            case 'MOVE_REQUEST':
                this.handleMoveRequest(event as MoveRequestEvent);
                break;
            case 'DUEL_INITIATED':
                this.handleDuelInitiated(event as DuelInitiatedEvent);
                break;
        }
    }
}
```

### 6. Tactical Retreat Handling

```typescript
import { 
    calculateTacticalRetreats,
    RetreatCost
} from '@gambit-chess/shared';

class TacticalRetreatManager {
    public getRetreatOptions(
        piecePos: string, 
        failedTarget: string
    ): RetreatCost[] {
        const pos = POSITION(piecePos);
        const target = POSITION(failedTarget);
        
        return calculateTacticalRetreats(pos, target, this.boardState);
    }
}
```

## Information Visibility Rules

The server MUST enforce these visibility rules:

1. **Hidden Information**
   - Other player's BP pool values
   - Other player's BP regeneration amounts
   - Other player's BP allocation during duel (until revealed)
   - De novo tactical advantage calculations

2. **Visible Information**
   - Current board position
   - Whose turn it is
   - Check status
   - Game result
   - Move history
   - Remaining time for both players
   - Duel outcome after resolution

## Development Guidelines

1. **Type Safety**
   - Use TypeScript strict mode
   - Leverage shared type definitions
   - Use value objects for domain concepts

2. **State Management**
   - Server is authoritative
   - Validate all client input
   - Use shared validation utilities

3. **Testing**
   - Test game logic thoroughly
   - Verify information visibility
   - Validate WebSocket events

4. **Performance**
   - Use pre-calculated tables where available
   - Implement caching strategies
   - Profile critical paths

## Common Pitfalls

1. ❌ **Don't** use string literals for positions, colors, or piece types
   ✅ **Do** use factory functions: `POSITION()`, `PIECE_COLOR()`, `PIECE_TYPE()`

2. ❌ **Don't** expose hidden information in DTOs
   ✅ **Do** filter sensitive data before sending to clients

3. ❌ **Don't** trust client input
   ✅ **Do** validate all incoming DTOs

4. ❌ **Don't** implement game progression logic in shared code
   ✅ **Do** keep it in the server domain

5. ❌ **Don't** use direct class instantiation
   ✅ **Do** use provided factory functions

## Server Implementation Plan

### Architecture Overview

```
/server
├── src/
│   ├── config/             # Server configuration
│   ├── core/               # Core game engine
│   ├── security/           # Authentication & security
│   ├── websocket/          # WebSocket communication
│   ├── api/                # REST API endpoints (optional)
│   ├── services/           # Game services
│   ├── models/             # Server-side models
│   ├── utils/              # Server utilities
│   └── index.ts            # Entry point
└── tests/                  # Server tests
```

### Component Implementation

#### 1. GambitChessEngine

Extends the shared MinimalChessEngine to add server-specific functionality:

```typescript
import { 
    MinimalChessEngine, 
    POSITION, 
    PIECE_TYPE,
    PIECE_COLOR,
    IConfigProvider
} from '@gambit-chess/shared';

class GambitChessEngine extends MinimalChessEngine {
    // Server-side BP tracking
    private playerBPPools: Map<string, number> = new Map();
    private tacticalAdvantages: Map<string, string[]> = new Map();
    private previousBoardState: BoardState;
    
    constructor(config: IConfigProvider) {
        super(config);
        this.initBPPools();
    }
    
    // BP duel resolution - server authoritative
    public resolveBPDuel(
        attackerAllocation: number, 
        defenderAllocation: number
    ): boolean {
        // Return true if attacker wins, false otherwise
        return attackerAllocation > defenderAllocation;
    }
    
    // Track previous board state for de novo tactical advantage detection
    public saveCurrentBoardState(): void {
        this.previousBoardState = this.getBoardState();
    }
    
    // Detect tactical advantages for BP regeneration
    public detectTacticalAdvantages(playerId: string): TacticalAdvantage[] {
        // Compare current state with previous state to identify new advantages
        // Return list of detected advantages (pins, forks, etc.)
    }
}
```

#### 2. SecurityManager

Implements the security layer for session management and message validation:

```typescript
import { 
    SecureMessage,
    GameEvent 
} from '@gambit-chess/shared';

class SecurityManager {
    // Session storage with token, secret, and nonce tracking
    private sessions: Map<string, SessionData> = new Map();
    
    // Generate challenge for new connections
    public generateChallenge(): string {
        // Create cryptographically secure random challenge
    }
    
    // Validate secure message with constant-time operations
    public validateMessage<T extends GameEvent>(message: SecureMessage<T>): boolean {
        const session = this.sessions.get(message.security.token);
        
        if (!session) return false;
        
        // Verify timestamp is recent
        if (!this.isTimestampValid(message.security.timestamp)) return false;
        
        // Verify nonce hasn't been used
        if (session.nonces.has(message.security.nonce)) return false;
        
        // Verify signature using HMAC-SHA256 with constant-time comparison
        return this.verifySignature(message, session.secret);
    }
    
    // Create player-specific secure response
    public createSecureResponse<T extends GameEvent>(
        playerId: string,
        event: T
    ): SecureMessage<T> {
        const session = this.sessions.get(playerId);
        const nonce = this.generateNonce();
        const timestamp = Date.now();
        
        // Sign the message with session secret
        const signature = this.signMessage(event, session.secret, nonce, timestamp);
        
        return {
            event,
            security: {
                token: session.token,
                signature,
                timestamp,
                nonce
            }
        };
    }
}
```

#### 3. GameStateManager

Manages the authoritative game state and handles player requests:

```typescript
import { 
    GameStateDTO,
    MoveDTO,
    validateMoveDTO,
    calculateTacticalRetreats
} from '@gambit-chess/shared';

class GameStateManager {
    private engine: GambitChessEngine;
    private bpRegenerationService: BPRegenerationService;
    
    // Generate filtered game state for specific player
    public getStateForPlayer(playerId: string): GameStateDTO {
        const state = this.engine.getState();
        
        // Create player-specific view filtering hidden information
        return {
            board: state.board,
            currentTurn: state.currentTurn,
            playerBP: this.engine.getPlayerBP(playerId),
            // Include only information this player should see
            // Hide opponent's BP and other sensitive data
        };
    }
    
    // Process a move request
    public processMove(playerId: string, moveDTO: MoveDTO): MoveResult {
        // Validate move request
        if (!validateMoveDTO(moveDTO)) {
            throw new Error('Invalid move data');
        }
        
        // Verify it's this player's turn
        if (!this.isPlayerTurn(playerId)) {
            throw new Error('Not your turn');
        }
        
        // Save current board state for tactical advantage detection
        this.engine.saveCurrentBoardState();
        
        // Execute move and get result
        const result = this.engine.executeMove(moveDTO);
        
        // If move resulted in capture attempt, initiate duel
        if (result.captureAttempt) {
            return {
                ...result,
                duelRequired: true
            };
        }
        
        // Complete turn and calculate BP regeneration
        this.completeTurn(playerId);
        
        return result;
    }
    
    // Complete a player's turn, including BP regeneration
    private completeTurn(playerId: string): void {
        // Calculate and apply BP regeneration
        const bpRegen = this.bpRegenerationService.calculateBPRegeneration(playerId);
        this.engine.addPlayerBP(playerId, bpRegen);
        
        // Advance turn
        this.engine.nextTurn();
    }
}
```

#### 4. BPRegenerationService

Specialized service for calculating BP regeneration based on tactical advantages:

```typescript
import { PIECE_VALUE } from '@gambit-chess/shared';

class BPRegenerationService {
    private engine: GambitChessEngine;
    
    // Calculate BP regeneration after a player's turn
    public calculateBPRegeneration(playerId: string): number {
        let bpRegen = 1; // Base regeneration per turn
        
        // Detect tactical advantages (comparing with previous board state)
        const advantages = this.engine.detectTacticalAdvantages(playerId);
        
        // Calculate additional BP for each advantage type
        advantages.forEach(advantage => {
            switch (advantage.type) {
                case 'PIN':
                    const pinnedPieceValue = PIECE_VALUE(advantage.piece);
                    bpRegen += pinnedPieceValue;
                    if (advantage.pinnedTo === 'KING') bpRegen += 1;
                    break;
                    
                case 'FORK':
                    const forkedPieces = advantage.pieces;
                    const lowestValue = Math.min(
                        ...forkedPieces.map(p => PIECE_VALUE(p))
                    );
                    bpRegen += lowestValue;
                    break;
                    
                case 'SKEWER':
                    const frontPieceValue = PIECE_VALUE(advantage.frontPiece);
                    const backPieceValue = PIECE_VALUE(advantage.backPiece);
                    const difference = Math.abs(frontPieceValue - backPieceValue);
                    bpRegen += difference > 0 ? difference : 1;
                    break;
                    
                case 'CHECK':
                    bpRegen += 2;
                    break;
                    
                // Handle other advantage types per game rules
            }
        });
        
        return bpRegen;
    }
}
```

#### 5. WebSocketController

Manages real-time communication with proper security filtering:

```typescript
import { 
    GameEvent,
    MoveRequestEvent,
    BPAllocationEvent 
} from '@gambit-chess/shared';

class WebSocketController {
    private connections: Map<string, WebSocket> = new Map();
    private security: SecurityManager;
    private gameStateManager: GameStateManager;
    
    // Process incoming WebSocket messages
    public handleMessage(clientId: string, rawMessage: string): void {
        try {
            const message = JSON.parse(rawMessage);
            
            // Validate as SecureMessage
            if (!this.security.validateMessage(message)) {
                this.sendError(clientId, 'Invalid message security');
                return;
            }
            
            // Route based on event type
            switch (message.event.type) {
                case 'MOVE_REQUEST':
                    this.handleMoveRequest(clientId, message.event);
                    break;
                    
                case 'BP_ALLOCATION':
                    this.handleBPAllocation(clientId, message.event);
                    break;
                    
                case 'TACTICAL_RETREAT':
                    this.handleTacticalRetreat(clientId, message.event);
                    break;
                    
                // Handle other event types
            }
        } catch (error) {
            this.sendError(clientId, 'Invalid message format');
        }
    }
    
    // Send game state update to specific player with proper filtering
    public sendGameStateUpdate(playerId: string, gameId: string): void {
        // Get player-specific filtered game state
        const gameState = this.gameStateManager.getStateForPlayer(playerId);
        
        // Create secure message with proper signing
        const secureMessage = this.security.createSecureResponse(
            playerId,
            { 
                type: 'GAME_STATE_UPDATE',
                gameId,
                state: gameState
            }
        );
        
        // Send to client
        this.sendToClient(playerId, JSON.stringify(secureMessage));
    }
}
```

### Implementation Phases

1. **Core Engine Development (Phase 1)**
   - Extend MinimalChessEngine with server-specific features
   - Implement BP pool management
   - Build move validation and execution
   - Implement game state management

2. **Security Implementation (Phase 2)**
   - Design and implement SecureMessage protocol
   - Build session management system
   - Create challenge-response authentication
   - Implement constant-time operations for sensitive functions

3. **WebSocket Infrastructure (Phase 3)**
   - Setup WebSocket server with proper security
   - Implement message routing and event handlers
   - Build player connection management
   - Design spectator mode with proper filtering

4. **Game Mechanics Implementation (Phase 4)**
   - Implement duel system for captures
   - Build tactical retreat mechanics
   - Create BP allocation validation
   - Implement game result detection (checkmate, stalemate)

5. **Tactical System Implementation (Phase 5)**
   - Implement tactical advantage detection
   - Build BP regeneration system
   - Create board state comparison for de novo advantages
   - Optimize algorithms for performance

6. **Testing and Optimization (Phase 6)**
   - Create comprehensive test suite
   - Performance testing and optimization
   - Security auditing
   - Client-server integration testing

### Testing Strategy

1. **Unit Testing**
   - Test individual components in isolation
   - Mock dependencies for controlled testing
   - Verify security functions work as expected
   - Test BP allocation and regeneration logic

2. **Integration Testing**
   - Test component interactions
   - Verify WebSocket communication
   - Test game progression scenarios
   - Validate duel and tactical retreat flows

3. **Security Testing**
   - Verify information hiding works correctly
   - Test against timing attacks
   - Validate signature generation and verification
   - Test nonce and timestamp validation

4. **Performance Testing**
   - Measure request handling latency
   - Test with multiple concurrent games
   - Verify BP calculations perform efficiently
   - Test tactical advantage detection performance

### Deployment Considerations

1. **Environment Setup**
   - Node.js with TypeScript
   - Redis for temporary state storage
   - SQLite for persistent storage
   - WebSocket server configuration

2. **Scaling Strategy**
   - Horizontal scaling for game servers
   - Session persistence across server instances
   - Load balancing for WebSocket connections
   - Caching of frequently accessed data

3. **Monitoring and Logging**
   - Implement structured logging
   - Track game state transitions
   - Monitor security events and failures
   - Performance metrics collection