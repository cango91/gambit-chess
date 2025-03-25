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

## Performance Considerations

1. Use React.memo for pure components
2. Implement proper cleanup in useEffect
3. Optimize 3D model loading
4. Use proper camera controls
5. Implement proper scene culling
6. Use proper lighting setup
7. Optimize WebSocket message handling

## Testing

1. Unit tests for game logic
2. Integration tests for WebSocket
3. Visual regression tests
4. Performance benchmarks
5. Mobile responsiveness tests

## Contributing

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Create pull request

## License

MIT 