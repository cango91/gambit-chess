
# Gambit Chess

A tactical chess variant developed for the [Vibe Coding Game Jam](https://x.com/levelsio/status/1901660771505021314) where captures are resolved through strategic Battle Points allocation duels instead of automatically succeeding. This creates a unique blend of chess strategy, poker-like bluffing, and resource management.

## Game Jam Context

This project is being developed as part of the [Vibe Coding Game Jam](https://x.com/levelsio/status/1901660771505021314) with the following requirements:
- Web-accessible without login/signup
- Mobile web compatible
- Fast loading with no loading screens
- 80% AI-generated code

## Game Overview

In Gambit Chess, traditional chess rules apply with one key difference - when a player attempts to capture an opponent's piece:

1. Both players secretly allocate Battle Points (BP) from their pool
2. The player who allocates more BP wins the duel
3. If the attacker wins, the capture succeeds
4. If the defender wins, the attacker can perform a tactical retreat with different options based on piece type

Each piece has a BP capacity (similar to classic chess values), and players must strategically manage their BP throughout the game. BP regenerates based on tactical advantages like pins, forks, skewers, and checks.

## Project Structure

```
gambit-chess/
├── client/           # React-based web client
├── server/           # Node.js/Express server
├── shared/           # Shared types and utilities
└── docs/             # Project documentation
    ├── GAME_RULES.md # Detailed rules explanation
    ├── JAM_RULES.md  # Game jam requirements
    ├── api/          # API documentation
    └── implementation/ # Architecture documentation
```

## Quick Start

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Technology Stack

- **Language**: TypeScript throughout
- **Client**: React with responsive UI for desktop and mobile
- **Server**: Node.js, Express with WebSocket support
- **Real-time Communication**: WebSockets for game state updates
- **Temporary Storage**: Redis for game sessions
- **Persistent Storage**: SQLite for game results

## Architecture

Gambit Chess follows a clean domain-boundaries architecture:

- **Server Authority**: Server is the single source of truth for game state
- **Client Rendering**: Client handles rendering and user input
- **Shared Domain**: Contains pure utility functions and type definitions
- **Information Visibility**: Server carefully filters information to prevent leaking hidden data (like opponent's BP)

Game state synchronization happens through WebSockets with the server enforcing all game rules and the client providing responsive UI feedback.

## Unique Game Mechanics

- **Resource Management Duel**: Strategic BP allocation for captures
- **BP Regeneration**: BP regenerates based on tactical advantages
- **Tactical Retreat**: Failed attackers can reposition their piece
- **Knight Retreat Options**: Special retreat options for knights
- **Hidden Information**: Opponent's BP pool remains hidden

## Development

Each workspace can be built and tested independently:

```bash
# Build shared library
yarn build:shared

# Build server
yarn build:server

# Build client
yarn build:client

# Run tests
yarn test
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- `GAME_RULES.md` - Detailed explanation of game mechanics
- `JAM_RULES.md` - Game jam requirements
- `implementation/` - Technical architecture and implementation guidelines
- `api/` - Generated API documentation

Generate API documentation:

```bash
yarn docs
```

## Contributing

Contributions are welcome! Please read through the architecture documentation in `docs/implementation/` to understand the project's structure and domain boundaries.

## License

MIT