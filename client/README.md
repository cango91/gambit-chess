# Gambit Chess Client

The client-side implementation of the Gambit Chess game, featuring a 3D chessboard and real-time gameplay.

## Architecture

The client follows a modular architecture with clear separation of concerns:

- **Presentation Layer**: React components for UI rendering
- **Game Logic**: Chess game state management and rules
- **Network Layer**: WebSocket communication with the server
- **State Management**: Recoil for global state management

## Key Features

- 3D chessboard with Three.js and React Three Fiber
- Real-time multiplayer via WebSockets
- Battle Points system for piece duels
- Tactical retreats for long-range pieces
- Game state visualization

## Directory Structure

```
client/
├── public/           # Static assets
│   ├── assets/         # 3D models, textures, etc.
│   └── index.html      # HTML template
├── src/              # Source code
│   ├── components/     # React components
│   │   ├── 3d/           # 3D-specific components
│   │   └── ...           # Other UI components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Service modules (API, WebSocket)
│   ├── store/          # State management (Recoil)
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Application entry point
└── webpack.config.js # Webpack configuration
```

## Getting Started

### Prerequisites

- Node.js (v16+)
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
cd client
yarn install
```

3. Build the shared module:
```bash
cd ../shared
yarn build
```

4. Start the development server:
```bash
cd ../client
yarn dev
```

## Bundler Configuration

The client uses Webpack configured to properly handle CommonJS modules from the shared package. This ensures compatibility with the enums and other exports from the shared code.

## 3D Models

The chess pieces are loaded from FBX files located in `public/assets/models/`. Each piece has a white and black variant with a base diameter of 0.02m.

## Communication Protocol

The client communicates with the server using WebSocket events as defined in the shared `GameEvents` enum:

- Create/join game
- Making moves
- Battle point allocation
- Tactical retreats
- Game state updates
- Duel events

## Development Notes

- Always use the shared module for game-related types and constants
- Never import directly from the server module
- Use the WebSocket hook for all server communication
- Follow the component hierarchy for 3D objects 

## Implementation Plan

### 1. Project Structure Setup

1. Create the complete directory structure:
   - `public/assets/models/` - For 3D chess piece models
   - `public/assets/textures/` - For board and piece textures
   - `src/components/3d/` - For Three.js components
   - `src/components/ui/` - For regular React UI components
   - `src/hooks/` - For custom React hooks
   - `src/services/` - For WebSocket and other services
   - `src/store/` - For Recoil state management
   - `src/utils/` - For utility functions
   - `src/types/` - For client-specific type definitions

2. Create essential files:
   - `public/index.html` - HTML template
   - `src/index.tsx` - Entry point
   - `src/App.tsx` - Main component

### 2. Shared Module Integration

Required components from the shared module:

1. **Types and Interfaces**:
   - `Position` - Chess board coordinates
   - `PieceType` - Enum for piece types (pawn, knight, etc.)
   - `PlayerColor` - Enum for player colors (white, black)
   - `PlayerRole` - Enum for player roles (white, black, spectator)
   - `PieceDTO` - Data transfer object for pieces
   - `MoveType` - Types of moves (normal, capture, etc.)
   - `MoveRequest` - Move request to server
   - `MoveResult` - Result from server for move
   - `BPAllocationRequest` - Battle points allocation request
   - `DuelOutcome` - Enum for duel outcomes
   - `DuelResult` - Result of a duel
   - `RetreatOption` - Options for tactical retreat
   - `TacticalRetreatRequest` - Request for tactical retreat
   - `GameState` - Enum for game state (active, check, etc.)
   - `GamePhase` - Enum for game phase (normal, duel, retreat)
   - `GameStateDTO` - Complete game state from server
   - `CreateGameRequest` - Request to create a game
   - `CreateGameResult` - Result from server for game creation

2. **WebSocket Events**:
   - `GameEvents` - Enum for all WebSocket event types
   - `WSMessage` - Base interface for WebSocket messages
   - Various event interfaces (using the new event system, not legacy)

3. **Validation**:
   - `IsValidMove` - Function to validate moves locally
   - `CanPieceMoveToPosition` - Function to check valid piece moves

### 3. Core Services Implementation

1. **WebSocket Service** (`src/services/websocket.ts`):
   - Connection management
   - Message handling
   - Event dispatch system
   - Session management
   - Reconnection logic

2. **Game Service** (`src/services/game.ts`):
   - Game state management
   - Move processing
   - Battle point management
   - Duel handling
   - Tactical retreat processing

3. **Authentication Service** (`src/services/auth.ts`):
   - Session management
   - Player identification

### 4. State Management with Recoil

1. **Atoms**:
   - `gameStateAtom` - Current game state
   - `sessionAtom` - Player session data
   - `uiStateAtom` - UI state (selected piece, highlighted squares, etc.)
   - `notificationAtom` - Game notifications and alerts

2. **Selectors**:
   - `currentPlayerSelector` - Get current player info
   - `availableMovesSelector` - Calculate valid moves for selected piece
   - `gameStatusSelector` - Derive game status from current state

### 5. Custom React Hooks

1. **useWebSocket** - Hook for WebSocket communication
2. **useGameState** - Hook for accessing game state
3. **useMove** - Hook for making moves
4. **useBattlePoints** - Hook for BP allocation and management
5. **useTacticalRetreat** - Hook for handling retreats
6. **usePieceSelection** - Hook for piece selection logic

### 6. 3D Implementation with React Three Fiber

1. **Core 3D Components**:
   - `ChessBoard` - 3D chess board
   - `ChessPiece` - 3D chess piece with animations
   - `Highlighter` - Square highlighting for moves
   - `Scene` - Main 3D scene
   - `Camera` - Camera controls

2. **Animation System**:
   - Piece movement animations
   - Battle animations for duels
   - Tactical retreat animations
   - Victory/defeat animations

3. **Interaction System**:
   - Piece selection
   - Destination selection
   - Drag and drop movement
   - BP allocation interface

### 7. UI Components

1. **Game Interface**:
   - `GameContainer` - Main game container
   - `GameControls` - Game control panel
   - `GameInfo` - Display game information
   - `MoveHistory` - Show move history
   - `PlayerInfo` - Show player information and BP

2. **Battle Points System**:
   - `BPDisplay` - Show current BP
   - `BPAllocationSlider` - Interface for allocating BP
   - `TacticalRetreatSelector` - Interface for selecting retreat options

3. **Menus and Navigation**:
   - `MainMenu` - Game main menu
   - `GameCreation` - Create or join game interface
   - `Settings` - Game settings

### 8. Testing Strategy

1. **Unit Tests**:
   - Test WebSocket message handling
   - Test state management
   - Test game logic

2. **Integration Tests**:
   - Test WebSocket and game service integration
   - Test UI and state management integration

3. **End-to-End Tests**:
   - Test complete game flow

### Implementation Timeline

1. **Phase 1: Foundation** (Week 1)
   - Project structure setup
   - WebSocket service
   - Basic state management
   - Simple 2D board representation

2. **Phase 2: Core Game Logic** (Week 2)
   - Complete game state handling
   - Move validation
   - Battle Points system
   - Tactical retreat system

3. **Phase 3: 3D Implementation** (Week 3)
   - 3D board and pieces
   - Camera controls
   - Animations
   - Interaction system

4. **Phase 4: UI Refinement** (Week 4)
   - Complete UI components
   - Responsive design
   - Visual polish
   - Performance optimization

5. **Phase 5: Testing and Deployment** (Week 5)
   - Unit and integration tests
   - Bug fixes
   - Deployment setup
   - Documentation 