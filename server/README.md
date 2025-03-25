# Gambit Chess Server

Server component for the Gambit Chess game, providing game state management, WebSocket communication, and matchmaking services.

## 📋 Architecture

The server implements a layered architecture:

```
┌─────────────────────────────────┐
│           API Layer             │
├─────────────────────────────────┤
│         Game Manager            │
├─────────────────────────────────┤
│                                 │
│         Game Engine             │
│                                 │
├─────────────────────────────────┤
│  Redis Service  │  WS Service   │
└─────────────────┴───────────────┘
         ▲                 ▲
         │                 │
         ▼                 ▼
┌─────────────┐    ┌──────────────┐
│   Redis     │    │   Clients    │
└─────────────┘    └──────────────┘
```

- **Game Engine**: Core game logic extending the shared module
- **Game Manager**: Orchestrates game sessions and player interactions
- **Redis Service**: Handles game state persistence and player tracking
- **WebSocket Service**: Manages real-time communication with clients

## 🚀 Getting Started

### Prerequisites

- Node.js (v22 or higher)
- Redis instance (local or remote)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` to configure your environment
5. Start the server:
   ```bash
   # Development
   yarn dev
   
   # Production
   yarn build
   yarn start
   ```

## ⚙️ Configuration

The server is highly configurable through environment variables:

### Game Parameters

- `INITIAL_BP_POOL`: Starting battle points for each player (default: 39)
- `MAX_BP_ALLOCATION`: Maximum BP allocation for a single piece (default: 10)
- `BASE_BP_REGEN`: Base BP regeneration per turn (default: 1)
- `BP_REGEN_CHECK`: BP for putting opponent in check (default: 2)
- `BP_REGEN_FORK`: BP for creating a fork (default: 3)
- `BP_REGEN_PIN`: BP for creating a pin (default: 2)
- `BP_REGEN_SKEWER`: BP for creating a skewer (default: 2)
- `BP_REGEN_DISCOVERED_ATTACK`: BP for creating a discovered attack (default: 2)
- `BP_REGEN_DISCOVERED_CHECK`: BP for creating a discovered check (default: 3)
- `BP_CAPACITY_PAWN/KNIGHT/BISHOP/ROOK/QUEEN`: BP capacities for each piece type
- `GAME_EXPIRY`: Game session expiry time in seconds (default: 86400 - 24 hours)
- `MATCHMAKING_MAX_WAIT_TIME`: Maximum wait time in matchmaking queue (default: 60 seconds)
- `MATCHMAKING_CHECK_INTERVAL`: Matchmaking queue check interval (default: 5000 milliseconds)

See `.env.example` for all available configuration options.

## 🎮 Game Engine

The core game engine implements:

- Chess movement rules (via shared module)
- Battle Points (BP) system
- Resource Management Duel resolution
- Tactical retreat mechanics
- BP regeneration based on chess tactics

### Game Flow

The Gambit Chess game flow follows these steps:

1. **Initial Setup**: Board is set up with standard chess positioning. Each player starts with their initial BP pool.

2. **Player Turn**: Current player selects a piece and a destination.

3. **Move Analysis**:
   - **Non-Capturing Move**: Standard chess rules apply. BP regeneration is calculated:
     - Base BP regen for standard moves
     - Additional BP for tactics (pin, skewer, discovered attack, fork, etc.)
     - Additional BP for putting opponent in check
   
   - **Capturing Move**: Initiates a "duel phase" where:
     - Both players secretly allocate a portion of their BP
     - Higher allocation wins (ties favor defender)

4. **Duel Resolution**:
   - **Attacker Wins**: Defender's piece is captured. BP regeneration is calculated.
   - **Defender Wins**: Attacking piece returns to original position.

5. **Tactical Retreat** (only after failed capture with eligible pieces):
   - **No Retreat**: Only base BP regeneration applies (no tactics bonus since board state unchanged)
   - **Perform Retreat**: Eligible pieces (R, B, Q, N) can retreat according to specific rules:
     - **Long-range pieces (R, Q, B)**: Can move opposite to attack vector, BP cost scales with distance
     - **Knight (N)**: Can reposition within rectangle formed by original position and failed capture position, BP cost based on minimum knight moves

6. **BP Regeneration**: Calculated BP is added to current player's pool

7. **Turn Switch**: Play passes to opponent

This cycle continues until checkmate, stalemate, draw, or time expiration.

## 🔄 WebSocket Protocol

The server communicates with clients via a WebSocket protocol:

### Client -> Server Messages

- `create_game`: Create a new game
- `find_game`: Find a game via matchmaking
- `join_game`: Join an existing game
- `move`: Submit a move
- `bp_allocation`: Allocate BP during a duel
- `tactical_retreat`: Perform a tactical retreat
- `update_session`: Update session identifier
- `ping`: Health check ping

### Server -> Client Messages

- `session`: Initial session assignment
- `session_updated`: Session update confirmation
- `game_created`: Game creation confirmation
- `game_found`: Game found via matchmaking
- `game_joined`: Successful game join
- `game_state`: Updated game state
- `duel_started`: Duel phase initiated
- `duel_result`: Duel resolution result
- `tactical_retreat_available`: Tactical retreat options
- `matchmaking_joined`: Joined matchmaking queue
- `pong`: Response to ping
- `error`: Error message

## 📝 API Documentation

The server includes a minimal HTTP API:

- `GET /health`: Health check with status, version, and active connections

## 🛡️ Security & Session Management

- Players are identified by session tokens
- Sessions are temporarily stored in Redis with configurable expiry
- No permanent user data is stored
- Server is fully authoritative with client as untrusted input source

## 📚 Implementation Status

- ✅ Core Game Engine: 100% complete
- ✅ Game State Management: 100% complete
- ✅ WebSocket Communication: 100% complete
- ✅ Player Session Management: 100% complete
- ✅ Matchmaking: 100% complete
- ✅ Tactics Detection: 100% complete
- ✅ Duel Resolution: 100% complete
- ✅ Tactical Retreat: 100% complete
- ⏳ AI Opponent: 30% complete (basic structure in place)
- ✅ HTTP API: 100% complete (minimal implementation)

## 🛠️ Recent Technical Debt Fixes

### GameEvents Unification
- Clearly marked legacy `GameEventType` and related interfaces as deprecated with `@deprecated` JSDoc
- Added migration guide for transitioning from legacy to new event system
- Ensured backward compatibility while encouraging new code to use the updated system

### WebSocket Service Consolidation
- Eliminated duplicate WebSocket handling code between `server.ts` and `handlers/websocket.ts`
- Centralized all WebSocket management in the `services/websocket.ts` service
- Updated server initialization to use the centralized setup function

### Temporal Tactics Detection
- Fixed BP regeneration implementation to only reward new tactics created on the player's current turn
- Modified `TacticsDetection` to track new vs. pre-existing tactics using before/after board comparison
- Ensured BP regeneration is properly calculated based on actual new tactical achievements

### BoardSnapshot Type Compatibility
- Fixed type compatibility issues between `Board` and `BoardSnapshot` interfaces
- Updated `TacticsDetection` class to properly handle both types with type guards
- Implemented simplified fallback logic for methods when working with `BoardSnapshot`
- Ensured type safety while preserving existing functionality

## Technical Debt

The server codebase has undergone several improvements to reduce technical debt. Key fixes include:

1. **Legacy Enum System**: Deprecated old event types with clear migration paths
2. **WebSocket Code Consolidation**: Eliminated duplicate WebSocket handling code
3. **BP Regeneration Logic**: Fixed battle points calculation to only reward new tactics
4. **Type Compatibility**: Improved type safety between similar interfaces

For detailed documentation on technical debt fixes, see [Technical Debt Fixes](./docs/technical-debt-fixes.md).