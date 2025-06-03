# Gambit Chess Server

A Node.js/Express server with Redis-based live game state management and WebSocket real-time communication.

## Architecture Overview

### Live Game State Management
- **Redis**: Active games (WAITING/IN_PROGRESS) stored in Redis for fast access
- **PostgreSQL/SQLite**: Completed games (COMPLETED/ABANDONED) archived in database
- **Event-Driven**: Game events flow from Redis → WebSocket broadcast

### Authentication
- **JWT**: Access/refresh token rotation with family-based security
- **Anonymous Support**: Seamless anonymous → registered user migration
- **WebSocket Auth**: Token-based or anonymous UUID authentication

### Real-time Communication
- **WebSocket Only**: Moves handled via Socket.IO events (no REST endpoints)
- **Room-based**: Players join game-specific rooms for targeted broadcasts
- **Event Types**: Move, duel allocation, tactical retreat, chat, etc.

## Key Services

### `LiveGameService`
- Creates/manages active games in Redis
- Handles game state serialization/deserialization
- Auto-archives completed games to database
- 24-hour TTL for abandoned games

### `GameEventsService`
- Bridges Redis events → Socket.IO broadcasts
- Handles event-specific logic (duels, retreats, etc.)
- Maintains information privacy (hidden BP allocations)

### `GameService`
- Unified interface for live (Redis) + archived (DB) games
- Authorization-aware game state retrieval
- Delegates live operations to LiveGameService

## Game Flow

```
1. Client creates game → LiveGameService → Redis + DB stub
2. Players join via WebSocket → Room assignment
3. Moves via WebSocket → LiveGameService → Redis update + Event broadcast
4. Game ends → Archive to DB + Remove from Redis
```

## WebSocket Events

### Client → Server
- `game:join` - Join game room
- `game:move` - Make move
- `game:duel_allocation` - Allocate battle points
- `game:tactical_retreat` - Execute retreat
- `game:chat` - Send message

### Server → Client
- `game:state` - Full game state
- `game:event` - Game event (move, duel, etc.)
- `game:duel_started` - Duel initiated
- `game:duel_resolved` - Duel result
- `error` - Error message

## Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# JWT
ACCESS_TOKEN_SECRET="your-secret"
REFRESH_TOKEN_SECRET="your-secret"
ACCESS_TOKEN_EXPIRATION="15m"
REFRESH_TOKEN_EXPIRATION="7d"

# Server
PORT=5000
CLIENT_URL="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"
```

## Running the Server

```bash
# Install dependencies
yarn install

# Start Redis (required)
redis-server

# Run development server
yarn dev

# Build for production
yarn build
yarn start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/refresh-token` - Refresh tokens
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Current user

### Games (REST for creation/retrieval only)
- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game state
- `GET /api/games` - List user's games
- `POST /api/games/:id/join` - Join existing game

**Note**: Moves are handled exclusively via WebSocket events, not REST APIs.

## Game State Storage

### Redis Keys
```
live_game:{gameId} - Complete game state (TTL: 24h)
game_events:{gameId} - Recent events (TTL: 1h)
```

### Database
```sql
Game {
  status: WAITING | IN_PROGRESS | COMPLETED | ABANDONED
  isLive: boolean  -- true if in Redis, false if archived
}
```

## Security Features

- Server-authoritative game state
- Hidden information (BP pools, allocations)
- Turn validation
- Player authorization checks
- JWT token rotation with blacklisting
- Anonymous user sandboxing

## Next Steps

1. **Move Processing**: Implement full Gambit Chess move validation
2. **Duel System**: Complete BP allocation and resolution logic
3. **AI Integration**: Add AI opponent service
4. **Spectator Mode**: Allow observers in game rooms
5. **Matchmaking**: Queue system for human vs human games