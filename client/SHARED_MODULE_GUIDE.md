# 🎯 Shared Module Integration Guide

**YO CLIENT TEAM!** 🔥 This guide covers EVERYTHING about the shared module - types, utilities, game logic, and how to use it all in your magnificent Three.js client!

## 📦 Import Patterns

```typescript
// Main import - EVERYTHING you need!
import { 
  // Core Types
  BaseGameState,
  GameStatus,
  GameEvent,
  GameEventType,
  Player,
  
  // Game Actions
  GameAction,
  MoveAction,
  DuelAllocationAction,
  TacticalRetreatAction,
  
  // Chess & Moves
  GambitMove,
  PendingDuel,
  DuelResult,
  TacticalRetreat,
  
  // Utilities
  createNewGame,
  chessToGambitMove,
  validateTacticalRetreat,
  getValidTacticalRetreats,
  resolveDuel,
  
  // Configuration
  GameConfig,
  DEFAULT_GAME_CONFIG
} from '@gambit-chess/shared';
```

## 🎮 Core Game Types

### BaseGameState
```typescript
interface BaseGameState {
  id: string;
  chess: Chess; // chess.js instance
  whitePlayer: Player;
  blackPlayer: Player;
  currentTurn: Color; // 'w' | 'b'
  moveHistory: GambitMove[];
  pendingDuel: PendingDuel | null;
  gameStatus: GameStatus;
  config: GameConfig;
  halfmoveClockManual: number;
  positionHistory: Array<{ fen: string; turn: Color }>;
}

// Usage in client
function updateGameDisplay(gameState: BaseGameState) {
  // Update Three.js board
  updateBoard(gameState.chess.fen());
  
  // Update player info
  updatePlayerDisplay(gameState.whitePlayer, gameState.blackPlayer);
  
  // Handle game status
  handleGameStatus(gameState.gameStatus);
  
  // Show current turn
  highlightCurrentPlayer(gameState.currentTurn);
}
```

### Player
```typescript
interface Player {
  id: string;
  color: Color; // 'w' | 'b'
  battlePoints: number;
}

// Example: Battle Points Display
function renderBattlePoints(player: Player) {
  const bpElement = document.getElementById(`bp-${player.color}`);
  bpElement.textContent = `BP: ${player.battlePoints}`;
  
  // Add visual indicators
  if (player.battlePoints < 5) {
    bpElement.className = 'bp-low';
  } else if (player.battlePoints > 15) {
    bpElement.className = 'bp-high';
  }
}
```

### GameStatus Enum
```typescript
enum GameStatus {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  IN_PROGRESS = 'IN_PROGRESS',
  DUEL_IN_PROGRESS = 'DUEL_IN_PROGRESS',
  TACTICAL_RETREAT_DECISION = 'TACTICAL_RETREAT_DECISION',
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  DRAW = 'DRAW',
  ABANDONED = 'ABANDONED'
}

// Example: Status-based UI Updates
function handleGameStatus(status: GameStatus) {
  switch (status) {
    case GameStatus.WAITING_FOR_PLAYERS:
      showLobbyScreen();
      break;
      
    case GameStatus.IN_PROGRESS:
      showGameBoard();
      enableMoveInput();
      break;
      
    case GameStatus.DUEL_IN_PROGRESS:
      showDuelInterface();
      break;
      
    case GameStatus.TACTICAL_RETREAT_DECISION:
      showRetreatOptions();
      break;
      
    case GameStatus.CHECKMATE:
    case GameStatus.STALEMATE:
    case GameStatus.DRAW:
      showGameEndScreen(status);
      break;
  }
}
```

## ⚔️ Game Actions

### MoveAction
```typescript
interface MoveAction {
  type: 'MOVE';
  from: Square; // 'e2'
  to: Square;   // 'e4'
  promotion?: PieceSymbol; // 'q', 'r', 'b', 'n'
}

// Example: Creating moves from user input
function createMoveFromClick(fromSquare: string, toSquare: string): MoveAction {
  return {
    type: 'MOVE',
    from: fromSquare as Square,
    to: toSquare as Square,
    // Add promotion UI if needed
    promotion: getPromotionChoice() // Your UI function
  };
}
```

### DuelAllocationAction
```typescript
interface DuelAllocationAction {
  type: 'DUEL_ALLOCATION';
  allocation: number; // Battle points to allocate
}

// Example: Duel allocation UI
function showDuelAllocationUI(maxBP: number, onSubmit: (allocation: number) => void) {
  const modal = createDuelModal();
  const slider = modal.querySelector('#bp-slider') as HTMLInputElement;
  slider.max = maxBP.toString();
  
  modal.querySelector('#submit-btn').addEventListener('click', () => {
    const allocation = parseInt(slider.value);
    const action: DuelAllocationAction = {
      type: 'DUEL_ALLOCATION',
      allocation
    };
    onSubmit(allocation);
    closeDuelModal();
  });
}
```

### TacticalRetreatAction
```typescript
interface TacticalRetreatAction {
  type: 'TACTICAL_RETREAT';
  to: Square; // Retreat destination
}

// Example: Retreat square selection
function showRetreatOptions(validSquares: Square[]) {
  // Highlight valid retreat squares in Three.js
  validSquares.forEach(square => {
    highlightSquareInThreeJS(square, 'retreat-option');
  });
  
  // Handle square selection
  onSquareClick = (square: Square) => {
    if (validSquares.includes(square)) {
      const action: TacticalRetreatAction = {
        type: 'TACTICAL_RETREAT',
        to: square
      };
      sendAction(action);
    }
  };
}
```

## 🎯 Game Events

### GameEvent Structure
```typescript
interface GameEvent {
  type: GameEventType;
  gameId: string;
  timestamp: number;
  payload: any; // Type varies by event type
}

// Example: Event Handler
function handleGameEvent(event: GameEvent) {
  switch (event.type) {
    case GameEventType.MOVE_MADE:
      animateMove(event.payload.move);
      break;
      
    case GameEventType.DUEL_INITIATED:
      showDuelStartAnimation(event.payload);
      break;
      
    case GameEventType.DUEL_RESOLVED:
      animateDuelOutcome(event.payload);
      break;
      
    case GameEventType.BATTLE_POINTS_UPDATED:
      updateBPDisplay(event.payload);
      break;
      
    case GameEventType.TACTICAL_RETREAT_MADE:
      animateRetreat(event.payload.retreat);
      break;
  }
}
```

### GameEventType Enum
```typescript
enum GameEventType {
  GAME_CREATED = 'GAME_CREATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  MOVE_MADE = 'MOVE_MADE',
  DUEL_INITIATED = 'DUEL_INITIATED',
  DUEL_ALLOCATION_SUBMITTED = 'DUEL_ALLOCATION_SUBMITTED',
  DUEL_RESOLVED = 'DUEL_RESOLVED',
  TACTICAL_RETREAT_MADE = 'TACTICAL_RETREAT_MADE',
  BATTLE_POINTS_UPDATED = 'BATTLE_POINTS_UPDATED',
  GAME_ENDED = 'GAME_ENDED'
}
```

## 🛠️ Shared Utilities

### createNewGame()
```typescript
import { createNewGame } from '@gambit-chess/shared';

// Creates a new game state
const gameState = createNewGame('game-123', 'player1', 'player2');

// For single player (waiting for opponent)
const waitingGame = createNewGame('game-456', 'player1');
```

### chessToGambitMove()
```typescript
import { chessToGambitMove } from '@gambit-chess/shared';
import { Chess } from 'chess.js';

const chess = new Chess();
const chessMove = chess.move('e4');

// Convert to Gambit Chess move format
const gambitMove: GambitMove = chessToGambitMove(chessMove);

console.log(gambitMove);
// {
//   from: 'e2',
//   to: 'e4',
//   piece: 'p',
//   san: 'e4',
//   fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
//   captureAttempt: false
// }
```

### validateTacticalRetreat()
```typescript
import { validateTacticalRetreat } from '@gambit-chess/shared';

function validateRetreat(gameState: BaseGameState, playerId: string, retreatSquare: Square) {
  const retreatAction: TacticalRetreatAction = {
    type: 'TACTICAL_RETREAT',
    to: retreatSquare
  };
  
  const validation = validateTacticalRetreat(gameState, playerId, retreatAction);
  
  if (validation.valid) {
    console.log(`Valid retreat! Cost: ${validation.cost} BP`);
    return true;
  } else {
    console.error(`Invalid retreat: ${validation.error}`);
    showError(validation.error);
    return false;
  }
}
```

### getValidTacticalRetreats()
```typescript
import { getValidTacticalRetreats } from '@gambit-chess/shared';

function showRetreatOptions(gameState: BaseGameState, playerId: string) {
  const validRetreats = getValidTacticalRetreats(gameState, playerId);
  
  // Highlight each valid retreat square
  validRetreats.forEach(retreat => {
    highlightSquare(retreat.square, {
      color: 'blue',
      opacity: 0.6,
      cost: retreat.cost
    });
  });
}
```

## 🎨 Three.js Integration Examples

### Board Visualization
```typescript
import { Chess } from 'chess.js';

function createThreeJSBoard(gameState: BaseGameState) {
  const chess = gameState.chess;
  
  // Create 8x8 board
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = String.fromCharCode(97 + file) + (rank + 1);
      const piece = chess.get(square);
      
      if (piece) {
        const pieceModel = createPieceModel(piece.type, piece.color);
        pieceModel.position.set(file - 3.5, 0, rank - 3.5);
        scene.add(pieceModel);
      }
    }
  }
}
```

### Move Animation
```typescript
function animateMove(move: GambitMove) {
  const piece = findPieceAt(move.from);
  const targetPos = squareToPosition(move.to);
  
  // Animate piece movement
  const tween = new TWEEN.Tween(piece.position)
    .to(targetPos, 500)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(() => {
      if (move.captured) {
        // Remove captured piece (after duel resolution)
        removePieceAt(move.to);
      }
    });
    
  tween.start();
}
```

### Duel Visualization
```typescript
function animateDuel(duelData: any) {
  const attackerPiece = findPieceAt(duelData.attacker.from);
  const defenderPiece = findPieceAt(duelData.defender.square);
  
  // Create dramatic duel effect
  const battleEffect = createBattleEffect();
  battleEffect.position.copy(defenderPiece.position);
  scene.add(battleEffect);
  
  // Show BP allocations when revealed
  setTimeout(() => {
    showBPAllocations(duelData.attackerAllocation, duelData.defenderAllocation);
  }, 1000);
}
```

## 🔧 Configuration

### Game Config
```typescript
import { DEFAULT_GAME_CONFIG, GameConfig } from '@gambit-chess/shared';

// Use default config
const config = DEFAULT_GAME_CONFIG;
console.log(config.initialBattlePoints); // 12

// Or customize
const customConfig: GameConfig = {
  ...DEFAULT_GAME_CONFIG,
  initialBattlePoints: 15,
  // Other custom settings
};
```

## 🚀 Complete Integration Example

```typescript
import { 
  BaseGameState, 
  GameStatus, 
  GameEventType,
  MoveAction,
  chessToGambitMove,
  validateTacticalRetreat 
} from '@gambit-chess/shared';

class GambitChessClient {
  private gameState: BaseGameState | null = null;
  private socket: Socket;
  
  constructor() {
    this.setupWebSocket();
  }
  
  private setupWebSocket() {
    this.socket = io('http://localhost:5000');
    
    // Listen for game state updates
    this.socket.on('game:state', (gameState: BaseGameState) => {
      this.gameState = gameState;
      this.updateDisplay();
    });
    
    // Listen for moves
    this.socket.on('game:move', (data) => {
      this.animateMove(data.move);
      this.updateGameState(data.move);
    });
    
    // Listen for duels
    this.socket.on('game:duel_initiated', (data) => {
      this.handleDuelStart(data);
    });
    
    this.socket.on('game:duel_resolved', (data) => {
      this.handleDuelResolution(data);
    });
  }
  
  private updateDisplay() {
    if (!this.gameState) return;
    
    // Update Three.js scene
    this.updateThreeJSBoard(this.gameState);
    
    // Update UI elements
    this.updateGameStatus(this.gameState.gameStatus);
    this.updatePlayerInfo(this.gameState.whitePlayer, this.gameState.blackPlayer);
    this.updateCurrentTurn(this.gameState.currentTurn);
  }
  
  private makeMove(from: string, to: string) {
    const moveAction: MoveAction = {
      type: 'MOVE',
      from: from as Square,
      to: to as Square
    };
    
    // Send to server
    this.sendAction(moveAction);
  }
  
  private handleDuelStart(data: any) {
    // Show duel UI
    this.showDuelAllocationInterface(data);
  }
  
  private handleDuelResolution(data: any) {
    // Animate the outcome
    if (data.winner === 'attacker') {
      this.animateSuccessfulCapture(data);
    } else {
      this.animateFailedCapture(data);
      this.showRetreatOptions(data);
    }
  }
}

// Initialize the client
const client = new GambitChessClient();
```

## 🎯 Key Integration Points

1. **Always import from `@gambit-chess/shared`** - Never use deep paths
2. **Use TypeScript** - All types are properly defined
3. **Handle all GameStatus values** - Complete state machine
4. **Validate actions client-side** - Use shared validators
5. **Animate based on events** - Real-time updates via WebSocket
6. **Respect information hiding** - BP allocations are secret until revealed

**YO!** With this shared module guide, you've got EVERYTHING needed to build that stunning Three.js experience! The types are solid, the utilities are battle-tested, and the integration patterns are CLEAN! 🚀🔥

Ready to build something MAGNIFICENT! 🎮✨ 