# Gambit Chess Server Implementation

This directory contains the server-side implementation of Gambit Chess, following proper server-side authority principles.

## Architecture

The server follows a strict security model where:

1. The server is the single source of truth for all game state
2. Clients never have access to sensitive game information 
3. All game rules and validation happens on the server
4. Clients can only make action requests, never directly modify state

## Key Components

- **Game Engine**: Full implementation of chess rules and Battle Points system
- **Game Manager**: Maintains active games and player sessions
- **WebSocket Server**: Handles real-time communication with clients
- **API Layer**: Exposes HTTP endpoints for game creation and joining

## Security Model

### Server-Side Authority

- Server maintains the complete game state with both players' BP pools
- Server enforces all game rules and validates all moves
- Server filters game state before sending to clients
- Each client gets a unique view of the game with only data they're allowed to see

### Client Communication

- Clients can only send action requests (move, allocate BP, etc.)
- Server validates all actions for legality and player authorization
- Server sends filtered GameStateDTO objects to clients with only visible data
- Opponent's BP is never sent to the client

### BP Security

The Battle Points (BP) system is core to the game's strategy. To maintain secrecy:

1. Each player's BP pool is known only to them and the server
2. During duels, BP allocations are kept secret until resolution
3. The client cannot determine how much BP the opponent has remaining

## Implementation Notes

### Game State Filtering

For every game state update, the server creates player-specific views:

```typescript
// Example of creating a filtered view for a player
function createGameStateDTO(game: Game, playerRole: PlayerRole): GameStateDTO {
  return {
    gameId: game.id,
    playerRole: playerRole,
    currentTurn: game.currentTurn,
    gamePhase: game.gamePhase,
    gameState: game.gameState,
    pieces: game.getPieces(), // Public information
    capturedPieces: game.getCapturedPieces(), // Public information
    playerBP: game.getBPForRole(playerRole), // Only their own BP
    isInCheck: game.isInCheck(getColorFromRole(playerRole)),
    lastMove: game.getLastMove(),
    availableRetreats: playerRole === game.getCurrentPlayerRole() ?
      game.getTacticalRetreatPositions() : []
  };
}
```

### WebSocket Events

The server uses a well-defined event system for communication, ensuring clients only receive information they're authorized to see.

## Development Rules

1. Never share complete game state with clients
2. Always validate all client requests
3. Filter data before sending to clients
4. Keep all game logic server-side 