# 🚀 Gambit Chess Server Integration Guide

**YO CLIENT TEAM!** 🔥 This guide will get you FULLY INTEGRATED with the server backend and shared module! Everything you need to build that magnificent Three.js UX! 

## 📡 Server API Endpoints

### Base URL
```
Development: http://localhost:5000
Production: [TBD]
```

### 🎮 Game Management API

#### 1. **Create Game** `POST /api/games`
```typescript
// Request
{
  gameType: 'ai' | 'human' | 'practice',
  colorPreference: 'white' | 'black' | 'random', // 🎯 CHOOSE YOUR COLOR!
  aiDifficulty?: 'easy' | 'medium' | 'hard',
  anonymousSessionToken?: string // For anonymous users
}

// Response
{
  gameId: string,
  gameState: GameStateResponse
}
```

#### 2. **Discover Waiting Games** `GET /api/games/waiting` 🔍
```typescript
// Response - SEE ALL AVAILABLE GAMES!
{
  games: GameStateResponse[]
}
```

#### 3. **Join Game** `POST /api/games/:gameId/join`
```typescript
// Request
{
  anonymousSessionToken?: string
}

// Response
GameStateResponse
```

#### 4. **Get Game State** `GET /api/games/:gameId`
```typescript
// Response
{
  id: string,
  status: GameStatus,
  currentTurn: 'w' | 'b',
  board: string, // FEN string for chess.js
  moveHistory: GambitMove[],
  whitePlayer: {
    id: string,
    battlePoints: number, // Hidden if not authorized!
    isAnonymous: boolean
  },
  blackPlayer: {
    id: string,
    battlePoints: number,
    isAnonymous: boolean
  },
  check?: boolean,
  checkmate?: boolean,
  stalemate?: boolean
}
```

### 🕵️ Anonymous Session API

#### 1. **Create Anonymous Session** `POST /api/anonymous/session`
```typescript
// Response
{
  sessionId: string,
  sessionToken: string, // JWT signed token
  expiresAt: string,
  gamesPlayed: number
}
```

#### 2. **Validate Session** `GET /api/anonymous/session/validate`
```typescript
// Headers: Authorization: Bearer <sessionToken>
// Response
{
  valid: boolean,
  sessionId: string,
  gamesPlayed: number
}
```

## 🔌 WebSocket Integration

### Connection Setup
```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket']
});

// For anonymous users, send session token
socket.auth = {
  anonymousSessionToken: 'your-jwt-token'
};
```

### 🎯 Game Events (Listen for these!)

```typescript
// 1. Join a game room
socket.emit('game:join', { gameId: 'uuid' });

// 2. Listen for game state updates
socket.on('game:state', (gameState: BaseGameState) => {
  // Update your Three.js scene with new game state!
});

// 3. Listen for moves
socket.on('game:move', (data) => {
  console.log('Move made:', data.move);
  console.log('By player:', data.playerId);
  // Animate the move in Three.js!
});

// 4. Listen for duel events
socket.on('game:duel_initiated', (data) => {
  console.log('DUEL STARTED!', data);
  // Show duel UI - players need to allocate BP!
});

socket.on('game:duel_resolved', (data) => {
  console.log('Duel outcome:', data.winner);
  // Animate capture success/failure
});

// 5. Listen for BP updates
socket.on('game:battle_points_updated', (data) => {
  console.log(`Player ${data.playerId} now has ${data.newAmount} BP`);
  // Update BP display in UI
});

// 6. Listen for tactical retreats
socket.on('game:tactical_retreat', (data) => {
  console.log('Piece retreated to:', data.retreat.retreatSquare);
  // Animate piece retreat
});

// 7. Connection events
socket.on('game:player_connected', (data) => {
  console.log('Player joined:', data.playerId);
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

### 🎮 Making Game Actions

```typescript
// Import from shared module
import { MoveAction, DuelAllocationAction, TacticalRetreatAction } from '@gambit-chess/shared';

// 1. Make a move
const moveAction: MoveAction = {
  type: 'MOVE',
  from: 'e2',
  to: 'e4',
  promotion?: 'q' // For pawn promotion
};

// Send via HTTP (recommended for reliability)
fetch(`/api/games/${gameId}/actions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: moveAction,
    playerId: currentPlayerId
  })
});

// 2. Duel allocation (when capture is attempted)
const duelAction: DuelAllocationAction = {
  type: 'DUEL_ALLOCATION',
  allocation: 5 // Battle points to allocate
};

// 3. Tactical retreat (after failed capture)
const retreatAction: TacticalRetreatAction = {
  type: 'TACTICAL_RETREAT',
  to: 'c3' // Square to retreat to
};
```

## 🎲 Game Flow Examples

### 1. **Anonymous Game Creation**
```typescript
// 1. Create anonymous session
const session = await fetch('/api/anonymous/session', { method: 'POST' });
const { sessionToken } = await session.json();

// 2. Create AI game with color preference
const game = await fetch('/api/games', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameType: 'ai',
    colorPreference: 'black', // 🔥 You're black, AI is white!
    aiDifficulty: 'medium',
    anonymousSessionToken: sessionToken
  })
});

const { gameId, gameState } = await game.json();

// 3. Connect to WebSocket for real-time updates
socket.emit('game:join', { gameId });
```

### 2. **Game Discovery & Joining**
```typescript
// 1. Get all waiting games
const waitingGames = await fetch('/api/games/waiting');
const { games } = await waitingGames.json();

// 2. Show games in lobby UI
games.forEach(game => {
  console.log(`Game ${game.id}: ${game.whitePlayer.id} vs [WAITING]`);
});

// 3. Join a game
const joinResult = await fetch(`/api/games/${selectedGameId}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    anonymousSessionToken: sessionToken
  })
});
```

### 3. **Duel Handling**
```typescript
// When duel is initiated
socket.on('game:duel_initiated', (data) => {
  const { attacker, defender } = data;
  
  // Show duel UI - both players need to secretly allocate BP
  if (currentPlayerId === attacker.playerId || currentPlayerId === defender.playerId) {
    showDuelAllocationUI(data);
  } else {
    showSpectatorDuelUI(data);
  }
});

// When both players have allocated
socket.on('game:duel_resolved', (data) => {
  const { winner, attackerAllocation, defenderAllocation } = data;
  
  // Reveal allocations and show outcome
  showDuelResults({
    winner,
    attackerBP: attackerAllocation,
    defenderBP: defenderAllocation
  });
  
  // Animate capture success/failure in Three.js
  if (winner === 'attacker') {
    animateSuccessfulCapture(data.outcome);
  } else {
    animateFailedCapture(data.outcome);
    // Show tactical retreat options if it's your piece
  }
});
```

## 🎯 Game Status Handling

```typescript
import { GameStatus } from '@gambit-chess/shared';

switch (gameState.status) {
  case GameStatus.WAITING_FOR_PLAYERS:
    showLobbyUI();
    break;
    
  case GameStatus.IN_PROGRESS:
    showGameBoard();
    enableMoveInput(gameState.currentTurn === yourColor);
    break;
    
  case GameStatus.DUEL_IN_PROGRESS:
    showDuelUI();
    break;
    
  case GameStatus.TACTICAL_RETREAT_DECISION:
    if (needsToRetreat) {
      showRetreatOptions();
    } else {
      showWaitingForRetreat();
    }
    break;
    
  case GameStatus.CHECKMATE:
    showGameOver('checkmate');
    break;
    
  case GameStatus.STALEMATE:
    showGameOver('draw');
    break;
}
```

## 🎨 Three.js Integration Tips

### Board Setup
```typescript
import { Chess } from 'chess.js';

// Initialize chess.js with current FEN
const chess = new Chess(gameState.board);

// Get piece positions for Three.js scene
const pieces = [];
for (let rank = 0; rank < 8; rank++) {
  for (let file = 0; file < 8; file++) {
    const square = chess.get(String.fromCharCode(97 + file) + (rank + 1));
    if (square) {
      pieces.push({
        type: square.type,
        color: square.color,
        position: [file, 0, rank] // Three.js coordinates
      });
    }
  }
}
```

### Move Animation
```typescript
// When move event received
socket.on('game:move', (data) => {
  const { move } = data;
  
  // Animate piece movement
  animatePieceMove({
    from: move.from, // 'e2'
    to: move.to,     // 'e4'
    piece: move.piece,
    capturedPiece: move.captured,
    isCapture: !!move.captured,
    duration: 500
  });
  
  // Update chess.js state
  chess.move(move);
});
```

### Duel Animation
```typescript
socket.on('game:duel_resolved', (data) => {
  if (data.winner === 'attacker') {
    // Successful capture animation
    animateCapture(data.outcome.move);
  } else {
    // Failed capture - piece bounces back
    animateBounceBack(data.outcome.move);
    
    // Show tactical retreat if needed
    if (isYourPiece(data.outcome.move.piece)) {
      highlightRetreatSquares();
    }
  }
});
```

## 🔐 Security Notes

1. **Anonymous Sessions**: Always include `anonymousSessionToken` for anonymous users
2. **Battle Points**: Only visible to authorized players (hidden from opponents)
3. **Duel Allocations**: Hidden until both players submit
4. **Information Filtering**: Server filters sensitive info based on requesting user

## 🚀 Quick Start Checklist

- [ ] Set up WebSocket connection with authentication
- [ ] Implement anonymous session management  
- [ ] Create game lobby with waiting games discovery
- [ ] Build game board with Three.js
- [ ] Handle real-time move updates
- [ ] Implement duel allocation UI
- [ ] Add tactical retreat selection
- [ ] Test with AI opponents (easy/medium/hard)
- [ ] Add battle points display
- [ ] Implement game status handling

**YO!** With this guide, your client team has EVERYTHING needed to build that magnificent Three.js experience! 🎮🔥

Need more details on any specific part? Just holler! 📢 