# Gambit Chess Client

A modern 3D chess client built with React and Three.js for the Gambit Chess game.

## Overview

The client module provides a visually appealing 3D chess experience with real-time gameplay, battle points system, and tactical retreat mechanics. Built using React for UI components and Three.js for 3D rendering.

## Technical Stack

- React 18
- Three.js
- React Three Fiber
- React Three Drei
- Zustand (state management)
- Socket.IO Client
- TypeScript
- Vite

## Project Structure

```
src/
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx        # 3D chess board
│   │   ├── ChessPiece.tsx       # 3D piece component
│   │   ├── GameControls.tsx     # Game control buttons
│   │   ├── BattlePoints.tsx     # BP display and allocation
│   │   ├── GameStatus.tsx       # Game state display
│   │   └── MoveHistory.tsx      # Move history panel
│   ├── modals/
│   │   ├── GameOverModal.tsx    # Game end screen
│   │   ├── DuelModal.tsx        # BP allocation modal
│   │   └── PromotionModal.tsx   # Pawn promotion modal
│   └── ui/
│       ├── Button.tsx           # Reusable button
│       └── Loading.tsx          # Loading indicator
├── contexts/
│   ├── WebSocketContext.tsx     # WebSocket connection
│   ├── GameContext.tsx          # Game state management
│   └── SceneContext.tsx         # Three.js scene management
├── hooks/
│   ├── useGame.ts              # Game logic hooks
│   ├── useWebSocket.ts         # WebSocket hooks
│   └── useScene.ts             # Scene management hooks
├── models/
│   ├── ChessBoard.ts           # Board geometry
│   └── ChessPiece.ts           # Piece geometry
├── utils/
│   ├── coordinates.ts          # Board coordinate conversion
│   ├── animations.ts           # Animation helpers
│   └── validators.ts           # Move validation
└── types/
    └── index.ts                # TypeScript types
```

## Implementation Phases

### Phase 1: Core Setup (20%)
- [x] Project initialization
- [ ] Dependencies setup
- [ ] Basic routing
- [ ] WebSocket connection
- [ ] Type definitions

### Phase 2: 3D Scene (30%)
- [ ] Board geometry
- [ ] Camera setup
- [ ] Piece loading
- [ ] Basic piece placement
- [ ] Piece movement
- [ ] Visual effects

### Phase 3: Game Logic (20%)
- [ ] State management
- [ ] Move validation
- [ ] Event handling
- [ ] Turn management
- [ ] Battle points system
- [ ] Tactical retreat

### Phase 4: UI Components (20%)
- [ ] Game controls
- [ ] Status display
- [ ] Battle points
- [ ] Move history
- [ ] Game over screen
- [ ] Modals

### Phase 5: Polish (10%)
- [ ] Animations
- [ ] Visual effects
- [ ] Sound effects
- [ ] Performance optimization
- [ ] Mobile responsiveness

## Technical Details

### 3D Scene Setup

The chess board is scaled to 1.6m x 1.6m (10x the piece diameter) for better visibility:
- Board size: 1.6m x 1.6m
- Square size: 0.2m x 0.2m
- Piece base diameter: 0.02m (scaled to 0.2m)

### Camera Setup

- Position: (0, 2, 2)
- Target: (0, 0, 0)
- FOV: 75 degrees
- Near: 0.1
- Far: 1000

### Piece Models

All piece models are in FBX format with a base diameter of 0.02m:
- White pieces: king_w.fbx, queen_w.fbx, bishop_w.fbx, rook_w.fbx, knight_w.fbx, pawn_w.fbx
- Black pieces: king_b.fbx, queen_b.fbx, bishop_b.fbx, rook_b.fbx, knight_b.fbx, pawn_b.fbx

### WebSocket Events

The client handles the following events:
- Client to Server:
  - create_game
  - join_game
  - make_move
  - allocate_bp
  - tactical_retreat
  - request_game_history
  - spectate_game

- Server to Client:
  - game_created
  - game_joined
  - game_state_updated
  - duel_started
  - duel_resolved
  - tactical_retreat_available
  - game_history_update
  - game_over
  - error

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Development Guidelines

1. Use TypeScript for all new files
2. Follow React functional component patterns
3. Use hooks for state management and side effects
4. Implement proper error handling
5. Add loading states for async operations
6. Optimize 3D scene performance
7. Test all game mechanics thoroughly

## Game Events

### 1. CREATE_GAME
- **Purpose**: Initiates a new game session with optional AI opponent.
- **Payload Structure**: 
  ```typescript
  {
    againstAI?: boolean;
    aiDifficulty?: string;
  }
  ```
- **Implementation Status**: Fully implemented. The `handleCreateGame` function in `/server/src/handlers/createGame.ts` initializes a new GameEngine instance, registers the session with the game, and sends a confirmation with the gameId and playerRole. If playing against AI, it immediately sends the initial game state.

### 2. JOIN_GAME
- **Purpose**: Allows a second player to join an existing game by ID.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
  }
  ```
- **Implementation Status**: Fully implemented. The `handleJoinGame` function validates the game exists, checks if a player slot is available, assigns the player to the appropriate role (typically black since game creator is white), registers the session with the game, and sends updated game states to both players.

### 3. SPECTATE_GAME
- **Purpose**: Allows users to watch a game without participating.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
  }
  ```
- **Implementation Status**: Basic implementation present. The server acknowledges spectator connections and registers them with the game, but doesn't implement advanced spectator features like chat or delayed move broadcasting.

### 4. MAKE_MOVE
- **Purpose**: Process a chess piece movement.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    from: Position; // {x: number, y: number}
    to: Position;   // {x: number, y: number}
    promotionPiece?: PieceType; // Optional for pawn promotion
  }
  ```
- **Implementation Status**: Fully implemented. The `handleMove` function validates the move, processes it through the GameEngine, and handles multiple potential outcomes: regular move, capture initiation (triggering a duel), game state updates, and opponent notifications. All game rule validation for standard chess and Gambit-specific rules are enforced.

### 5. ALLOCATE_BP
- **Purpose**: Allocate Battle Points during a duel/capture attempt.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    amount: number; // BP amount to allocate
  }
  ```
- **Implementation Status**: Fully implemented. The `handleBPAllocation` function processes BP allocation, validates against the player's available BP, manages the doubled cost when exceeding piece capacity, tracks both players' allocations, determines duel outcomes, and notifies players accordingly. Includes opponent notification without revealing allocation values.

### 6. TACTICAL_RETREAT
- **Purpose**: Execute a tactical retreat after a failed capture attempt.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    from: Position; // {x: number, y: number}
    to: Position;   // {x: number, y: number}
  }
  ```
- **Implementation Status**: Fully implemented. Validates the retreat is allowed only for eligible pieces (R, B, Q, N), calculates and deducts the appropriate BP cost based on piece type and distance/complexity of retreat, updates game state, and notifies both players.

### 7. REQUEST_GAME_HISTORY
- **Purpose**: Retrieve the history of moves for a game.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
  }
  ```
- **Implementation Status**: Implemented with standard features. The server retrieves and sends the move history both in structured format (move objects with move number, player, SAN notation, etc.) and as formatted notation text. No filtering/pagination implemented for very long games.

### 8. GAME_CREATED (Server->Client)
- **Purpose**: Confirmation that a game was created successfully.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    success: boolean;
    playerRole: PlayerRole; // "white" typically
  }
  ```
- **Implementation Status**: Fully implemented. Sent as response to CREATE_GAME requests with generated game ID and player role assignment.

### 9. GAME_JOINED (Server->Client)
- **Purpose**: Confirmation that a player joined a game.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    success: boolean;
    playerRole: string; // "black" typically for second player
    error?: string;
  }
  ```
- **Implementation Status**: Fully implemented. Sent to both the joining player and the game creator to notify of successful join.

### 10. SPECTATING (Server->Client)
- **Purpose**: Confirmation that a user is now spectating a game.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    success: boolean;
    error?: string;
  }
  ```
- **Implementation Status**: Basic implementation. Confirms spectator status but doesn't include advanced spectator-specific features.

### 11. GAME_STATE_UPDATED (Server->Client)
- **Purpose**: Provides the current state of the game after changes.
- **Payload Structure**: Complex `GameStateDTO` with board state, pieces, turn info, game phase, player BP pools, and more.
- **Implementation Status**: Fully implemented. Generated by the GameEngine's `createGameStateDTO` method. The DTO is customized for each player to hide opponent's BP information and provide appropriate perspective.

### 12. DUEL_STARTED (Server->Client)
- **Purpose**: Notifies that a capture attempt has initiated a duel.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    from: Position;
    to: Position;
    piece: PieceType; // Attacking piece
  }
  ```
- **Implementation Status**: Fully implemented. Sent to both players when a capture attempt is made to prompt them for BP allocation. Sets game phase to "duel_allocation".

### 13. DUEL_RESOLVED (Server->Client)
- **Purpose**: Provides the outcome of a completed duel.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    attackerWon: boolean;
    attackerAllocation: number;
    defenderAllocation: number;
    retreatAvailable: boolean;
  }
  ```
- **Implementation Status**: Fully implemented. Reveals both players' allocations, announces the winner, and indicates if a tactical retreat is available to the attacker if they lost.

### 14. TACTICAL_RETREAT_AVAILABLE (Server->Client)
- **Purpose**: Notifies the attacker after a failed capture that a retreat is possible.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    from: Position; // Original position before capture attempt
    validDestinations: Position[]; // Possible retreat positions
    bpCost: { [notationPosition: string]: number }; // BP cost for each possible destination
  }
  ```
- **Implementation Status**: Fully implemented. Calculates valid retreat positions and associated BP costs for each position based on piece type and game rules.

### 15. GAME_HISTORY_UPDATE (Server->Client)
- **Purpose**: Provides the move history for the game.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    history: {
      moves: Array<{
        id: string;
        moveNumber: number;
        player: string;
        san: string; // Standard algebraic notation
        extended: string; // Extended notation with BP info
      }>;
      notationText: string; // Formatted text of entire game
    }
  }
  ```
- **Implementation Status**: Implemented with standard features. Provides both structured and text representation of the game history.

### 16. GAME_OVER (Server->Client)
- **Purpose**: Notifies that the game has ended.
- **Payload Structure**: 
  ```typescript
  {
    gameId: string;
    winner: string | null; // SessionId of winner or null for draw
    reason: string; // E.g., "checkmate", "stalemate", "time"
  }
  ```
- **Implementation Status**: Fully implemented. Sent when the game concludes for any reason, with appropriate metadata about the outcome.

### 17. ERROR (Server->Client)
- **Purpose**: Notifies of error conditions.
- **Payload Structure**: 
  ```typescript
  {
    message: string;
    code?: string;
    details?: string;
  }
  ```
- **Implementation Status**: Fully implemented throughout all handlers. Used for validation failures, game state errors, and various error conditions with descriptive messages.
