# Gambit Chess - Shared Module

## Overview

The shared module provides the core domain types, validation utilities, and pure functions used by both client and server in the Gambit Chess application. This module enforces strict domain boundaries and information visibility rules while providing type-safe interfaces for cross-domain communication.

## Architecture

### Domain Boundaries

The shared module strictly adheres to the following architectural principles:

1. **Pure Domain Logic Only**
   - No side effects
   - No state management
   - No direct dependencies on client or server code

2. **Information Visibility**
   - Enforces what information can be shared between domains
   - Implements filtering rules for sensitive game data
   - Maintains game integrity through validation

3. **Type Safety**
   - Comprehensive TypeScript types for all shared concepts
   - Strict validation for all DTOs
   - Value object pattern for core domain types

## Core Components

### 1. Chess Domain (`/src/chess/`)

Core chess logic and utilities:

- `BoardSnapshot`: Non-authoritative board state representation
- `CheckDetector`: Pure functions for check detection and validation
- `Movement`: Chess piece movement pattern validation
- Types and contracts for chess domain objects

### 2. Event System (`/src/events/`)

WebSocket event definitions and validation:

- Comprehensive event type definitions
- Strict validation for all events
- Information visibility enforcement
- Session management events
- Game state synchronization

### 3. Data Transfer Objects (`/src/dtos/`)

Type-safe DTOs for cross-domain communication:

- Game state DTOs
- Move and capture DTOs
- Player and spectator DTOs
- Battle Point allocation DTOs
- Tactical retreat DTOs

### 4. Validation (`/src/validation/`)

Validation utilities for all shared types:

- DTO validation functions
- Position and move validation
- Game state validation
- Player and spectator validation
- Time control validation

### 5. Battle Points System (`/src/tactical/`)

Battle Points (BP) and tactical advantage system:

- BP regeneration rules
- Tactical advantage detection
- Retreat cost calculations
- Duel resolution types

## Usage Guidelines

### 1. Domain Boundary Rules

- Server remains authoritative for all game state
- Client uses shared validation for UX improvements only
- No game progression logic in shared code
- Clear separation of concerns between domains

### 2. Information Architecture

Hidden information that must never be exposed:
- Other player's BP pool values
- Other player's BP regeneration amounts
- Other player's BP allocation during duel (until revealed)
- De novo tactical advantage calculations

Visible information that can be shared:
- Current board position
- Whose turn it is
- Check status
- Game result
- Move history
- Remaining time for both players
- Duel outcome after resolution

### 3. Implementation Requirements

When implementing or modifying shared code:

1. Maintain pure functions without side effects
2. Enforce strict type safety
3. Validate all cross-domain data
4. Document public interfaces
5. Follow value object pattern for domain types
6. Keep domain boundaries clear and explicit

### 4. WebSocket Protocol

The event system defines the following categories:
- Game Flow Events (state updates, game over)
- Move Events (requests, validation, results)
- Duel Events (initiation, allocation, outcome)
- Retreat Events (options, selection)
- Player Events (join, leave, reconnect)
- Connection Events (ping, status, auth)

## Development

### Prerequisites

- Node.js 16+
- TypeScript 4.5+
- npm or yarn

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

## Contributing

1. Follow TypeScript best practices
2. Maintain pure functions
3. Add tests for new functionality
4. Document public interfaces
5. Respect domain boundaries

## Key Components

- **Types**: Core type definitions for the game
- **DTOs (Data Transfer Objects)**: Structures for client-server communication
- **Constants**: Configuration values and game parameters
- **Chess Utilities**: Chess piece movement patterns and validation
- **Position Utilities**: Board position manipulation and validation
- **Tactical Retreat Calculator**: Implements tactical retreat mechanics
- **Notation System**: Standard chess notation with Gambit Chess extensions

## Directory Structure

```
shared/
├── src/
│   ├── chess/         # Chess movement patterns and validation
│   ├── constants/     # Shared constants and configuration values
│   ├── dtos/          # Data Transfer Objects for communication
│   ├── notation/      # Chess notation utilities
│   ├── tactical/      # Tactical retreat implementation
│   ├── tests/         # Test files
│   ├── utils/         # Utility functions
│   ├── types.ts       # Type definitions 
│   └── index.ts       # Main entry point
├── dist/              # Compiled output
├── scripts/           # Build and generation scripts
├── package.json       # Package configuration
└── tsconfig.json      # TypeScript configuration
```

## Usage

```typescript
// Import shared components
import { 
  Position, 
  Move, 
  isValidPosition,
  calculateTacticalRetreats,
  PIECE_VALUES
} from '@gambit-chess/shared';
```

## Building

```bash
# Build the shared module
yarn build

# Run tests
yarn test
```

## Domain Boundaries

This shared library strictly adheres to domain boundaries as defined in the project specifications:

- Contains only pure utility functions
- Provides type definitions used by both client and server
- Does not import from client or server code
- Contains no state management or side effects 

### Game State Progression

**Important**: Game state progression logic (checkmate detection, stalemate detection, draw conditions, game termination) is **intentionally not implemented** in the shared layer. This functionality belongs exclusively to the server domain, which serves as the authoritative source of truth for game state.

The shared layer provides:
- Chess piece movement validation
- Board state representation
- Check detection for move validation
- Tactical retreat calculation

But explicitly does not include:
- Checkmate detection
- Stalemate detection
- Draw condition evaluation
- Game termination logic
- Player turn management

This separation ensures proper domain boundaries and prevents duplication of critical game logic.

## Installation

```bash
yarn install
```

## Development

```bash
yarn dev
```

## Testing

Run all tests:

```bash
yarn test
```

Run tests in watch mode:

```bash
yarn test:watch
```

Run tests with coverage:

```bash
yarn test:coverage
```

The coverage report will be available at `coverage/lcov-report/index.html`. You can open it in a browser to see detailed coverage information.

## Documentation

Generate documentation:

```bash
yarn docs
```

## Knight Retreat Table

The knight retreat table is pre-calculated during build time to optimize performance. The table contains all possible knight retreat options for any starting position and attack position.

### Generation

The knight retreat table is generated by `scripts/generateKnightRetreatTable.js` and is executed as part of the prebuild script.

### Usage

To use the knight retreat table, import the utility functions from `constants/knightRetreatUtils`:

```typescript
import { getKnightRetreats } from '../constants/knightRetreatUtils';

// Get knight retreat options
const options = getKnightRetreats(startX, startY, attackX, attackY);
```

## Domain Boundaries

This shared library strictly adheres to domain boundaries as defined in the project specifications:

- Contains only pure utility functions
- Provides type definitions used by both client and server
- Does not import from client or server code
- Contains no state management or side effects 