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
   npm install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` to configure your environment
5. Start the server:
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## ⚙️ Configuration

The server is highly configurable through environment variables:

### Game Parameters

- `INITIAL_BP_POOL`: Starting battle points for each player (default: 39)
- `MAX_BP_ALLOCATION`: Maximum BP allocation for a single piece (default: 10)
- `BASE_BP_REGEN`: Base BP regeneration per turn (default: 1)

See `.env.example` for all available configuration options.

## 🎮 Game Engine

The core game engine implements:

- Chess movement rules (via shared module)
- Battle Points (BP) system
- Resource Management Duel resolution
- Tactical retreat mechanics
- BP regeneration based on chess tactics

## 🔄 WebSocket Protocol

The server communicates with clients via a WebSocket protocol:

### Client -> Server Messages

- `create_game`: Create a new game
- `find_game`: Find a game via matchmaking
- `join_game`: Join an existing game
- `move`: Submit a move
- `bp_allocate`: Allocate BP during a duel
- `tactical_retreat`: Perform a tactical retreat
- `update_session`: Update session identifier

### Server -> Client Messages

- `session`: Initial session assignment
- `game_created`: Game creation confirmation
- `game_found`: Game found via matchmaking
- `game_joined`: Successful game join
- `game_state`: Updated game state
- `error`: Error message

## 📝 API Documentation

The server includes a minimal HTTP API:

- `GET /`: Server info
- `GET /health`: Health check
- `POST /api/games/create`: Create a game (WebSocket preferred)

## 🛡️ Security & Session Management

- Players are identified by session tokens
- Sessions are temporarily stored in Redis with configurable expiry
- No permanent user data is stored
- Server is fully authoritative with client as untrusted input source

## 📚 Implementation Status

- Core Game Engine: 65% complete
- Game State Management: 0% complete
- WebSocket Communication: 0% complete
- Player Session Management: 0% complete
- Matchmaking: 0% complete
- AI Opponent: 0% complete
- HTTP API: 0% complete