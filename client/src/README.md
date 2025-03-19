# Gambit Chess Client Implementation

This directory contains the client-side implementation of Gambit Chess, designed to work with a server-authoritative model.

## Architecture

The client follows a request-based architecture where:

1. The client maintains a local representation of the visible game state
2. All state-changing actions are sent as requests to the server
3. The client updates its state only in response to server updates
4. The client never assumes server validation will pass

## Key Components

- **Game Renderer**: 3D visualization of the chess board using Three.js
- **Game Client**: Manages communication with the server
- **UI Components**: React components for game interface
- **State Management**: Client-side representation of visible game state

## Security Approach

### Request-Based Model

- Client sends action requests to the server (moves, BP allocation, etc.)
- Client does not update state until receiving server confirmation
- Client handles rejections gracefully and reverts to last known state
- Client performs basic validation for UX but never assumes server will agree

### State Management

The client state only contains information the player is allowed to see:

```typescript
interface ClientGameState {
  gameId: string;
  playerRole: PlayerRole; // What role this client has (white, black, spectator)
  currentTurn: PlayerColor; // Whose turn it is
  gamePhase: GamePhase; // What phase the game is in
  pieces: PieceDTO[]; // Pieces on the board - public info
  capturedPieces: PieceDTO[]; // Captured pieces - public info
  playerBP: number; // Only the client's own BP
  isInCheck: boolean; // Whether the client's king is in check
  lastMove: { from: Position, to: Position } | null; // Last move made
  availableRetreats: Position[]; // Retreat positions (only when applicable)
}
```

### UI Considerations

- Display opponent's remaining BP as unknown ("?")
- UI disables invalid actions based on game rules
- Clearly indicate when waiting for server response
- Visually roll back invalid moves

## WebSocket Communication

The client uses the shared event definitions for WebSocket communication:

- Client sends events like `MAKE_MOVE`, `ALLOCATE_BP` as requests
- Client listens for events like `GAME_STATE_UPDATED`, `MOVE_RESULT`
- All events follow the defined protocol in the shared module

## Optimistic Updates

For better UX, the client may implement optimistic updates:

1. User performs an action (e.g., moves a piece)
2. Client immediately shows the action visually
3. Client sends request to server
4. If server rejects, client reverts to previous state

However, the client must always reconcile with the server's view of the game.

## Development Rules

1. Never assume server validation will pass
2. Always wait for server confirmation before finalizing state changes
3. Handle server rejections gracefully
4. Do not assume knowledge of opponent's BP
5. Focus on visual presentation and user experience 