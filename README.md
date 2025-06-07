# Gambit Chess

An innovative tactical chess variant where capture attempts are resolved through strategic Battle Points allocation duels rather than automatic captures. This creates a unique blend of chess strategy, poker-like bluffing, and resource management mechanics. Originally started being developed for [a Vibe Coding Game Jam(https://x.com/levelsio/status/1901660771505021314) (whose deadline is missed by a long-stretch ☠️ .)

**Current Status**: Mature implementation ready for vertical slice deployment. Practice mode fully functional with comprehensive game engine, real-time WebSocket communication, and polished UI.

## Game Jam Context

Developed for the [Vibe Coding Game Jam](https://x.com/levelsio/status/1901660771505021314) meeting all requirements:
- ✅ Web-accessible without login/signup (anonymous sessions)
- ✅ Mobile web compatible (responsive design)
- ✅ Fast loading with minimal loading screens
- ✅ 80% AI-generated code implementation

## Game Overview

Gambit Chess transforms traditional chess by replacing automatic captures with strategic resource allocation:

### Core Mechanics
1. **Battle Points (BP)**: Each player starts with ~39 BP (total piece values)
2. **Secret Duels**: Capture attempts trigger BP allocation between attacker/defender
3. **Effective BP**: Piece values cap effective allocation (spending more doubles cost)
4. **Duel Resolution**: Higher allocation wins, ties favor defender
5. **Tactical Retreat**: Failed attackers can retreat to original square (free) or alternative squares (BP cost)

### BP Regeneration System
- **Base Regeneration**: 1 BP per turn
- **Tactical Bonuses**: Automatic detection and rewards for:
  - **Pins**: Pinned piece value + bonus if pinned to king
  - **Forks**: Minimum value of forked pieces
  - **Skewers**: Difference between front/back piece values
  - **Discovered Attacks**: Half the attacked piece's value
  - **Checks**: Fixed 2 BP bonus

### Game Modes & Configurations
- **Practice Mode**: Single player controls both sides (current implementation)
- **Multiple Rulesets**: Standard, Beginner, Advanced, and Risky configurations (coming soon)
- **Information Hiding**: Opponent BP pools remain secret (except in practice mode)

## Project Architecture

**Monorepo Structure** with strict domain boundaries:

```
gambit-chess/
├── shared/           # @gambit-chess/shared - Core domain logic
│   ├── types/        # Game state, duel mechanics, configuration types
│   ├── utils/        # Pure utility functions and validators
│   ├── constants/    # Game defaults and piece values
│   └── validators/   # Input validation and game rule enforcement
├── server/           # @gambit-chess/server - Game engine authority
│   ├── services/     # Game engine, BP calculation, tactics detection
│   ├── socket/       # Real-time WebSocket game communication
│   ├── game/         # Tactics detection algorithms and BP calculations
│   ├── routes/       # REST API for game management
│   └── prisma/       # Database schema and migrations
├── client/           # @gambit-chess/client - React/Three.js UI
│   ├── components/   # Game board, UI controls, and modals
│   ├── stores/       # Zustand state management
│   ├── services/     # WebSocket client and API communication
│   └── utils/        # Client-side utilities and helpers
└── docs/             # Generated documentation
```

## Technology Stack

- **Language**: TypeScript throughout (strict type safety)
- **Client**: React 18 + Three.js for 3D chess board rendering
- **Server**: Node.js/Express with Socket.IO for real-time communication
- **Database**: Prisma ORM with SQLite (persistent storage)
- **Session Management**: Redis for temporary game sessions
- **Build System**: Yarn workspaces with Vite (client) and TypeScript (server)
- **Testing**: Jest with comprehensive test coverage

## Quick Start

### Development
```bash
# Install all dependencies
yarn install

# Start development servers (client + server)
yarn dev

# Or start individually:
yarn workspace @gambit-chess/server dev    # Server on :5000
yarn workspace @gambit-chess/client dev    # Client on :3000
```

### Production Build
```bash
# Build all workspaces
yarn build

# Or build individually:
yarn build:shared  # Build shared library first
yarn build:server  # Build server
yarn build:client  # Build client

# Start production server
yarn start
```

### Testing
```bash
# Run all tests
yarn test

# Test individual workspaces
yarn test:shared
yarn test:server
# yarn test:client # client has no tests atm
```

## Key Features

### Real-time Game Engine
- **Server Authority**: Complete game state management and rule enforcement
- **WebSocket Communication**: Instant game state synchronization
- **Information Security**: Server filters sensitive data (hidden BP allocations)
- **Comprehensive Validation**: Move validation, duel resolution, and retreat calculations

### Advanced Game Mechanics
- **Automatic Tactics Detection**: Real-time analysis of pins, forks, skewers, discovered attacks
- **Dynamic BP Calculation**: Formula-based regeneration with detailed transaction logging
- **Flexible Retreat System**: Piece-specific retreat options with distance-based costs
- **Multiple Game Configurations**: Easy ruleset switching for different player skill levels (coming soon)

### Modern UI/UX
- **3D Chess Board**: Three.js-powered interactive chess board
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Instant visual feedback for all game actions
- **Comprehensive Onboarding**: Interactive tutorial and rule explanations

### Developer Experience
- **Type Safety**: Comprehensive TypeScript coverage with strict checking
- **Domain Boundaries**: Clear separation between client, server, and shared logic
- **Comprehensive Testing**: Unit tests for game engine, tactics detection, and UI components
- **Auto-generated Documentation**: TypeDoc API documentation

## Deployment Notes

The application is designed for simple deployment:
- **Single Server**: All services run on one instance
- **Static Assets**: Client builds to static files served by Express
- **Environment Variables**: Minimal configuration required
- **Database**: SQLite for simplicity (easily upgradeable to PostgreSQL)
- **Session Storage**: Redis required for temporarily persisting active games for fast-access.

## Contributing

The codebase follows strict architectural principles:
1. **Server Authority**: All game logic enforced server-side
2. **Type Safety**: Comprehensive TypeScript usage
3. **Domain Separation**: Clear boundaries between workspaces
4. **Information Security**: Careful data filtering to prevent information leakage



## License

MIT