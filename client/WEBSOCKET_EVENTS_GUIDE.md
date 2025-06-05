# ⚡ WebSocket Events Reference Guide

**YO CLIENT TEAM!** 🚀 This is your COMPLETE guide to all WebSocket events for real-time Gambit Chess! Every event, every payload, every integration pattern you need! 

## 🔌 Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

// Initialize connection
const socket: Socket = io('http://localhost:5000', {
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// For anonymous users - set auth token
socket.auth = {
  anonymousSessionToken: 'your-jwt-token'
};

// Connection status handling
socket.on('connect', () => {
  console.log('🔗 Connected to Gambit Chess server!');
  updateConnectionStatus('connected');
});

socket.on('disconnect', (reason) => {
  console.log('💔 Disconnected:', reason);
  updateConnectionStatus('disconnected');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  updateConnectionStatus('error');
});
```

## 🎮 Game Room Events

### 📨 OUTGOING: Join Game Room
```typescript
// Join a specific game for real-time updates
socket.emit('game:join', { gameId: 'uuid-here' });

// You'll receive confirmation and initial state
```

### 📥 INCOMING: Game State Updates
```typescript
socket.on('game:state', (gameState: BaseGameState) => {
  console.log('🎲 Full game state received!');
  
  // Update your entire game display
  updateGameBoard(gameState.chess.fen());
  updatePlayerInfo(gameState.whitePlayer, gameState.blackPlayer);
  updateGameStatus(gameState.gameStatus);
  updateMoveHistory(gameState.moveHistory);
  
  // Handle pending duels
  if (gameState.pendingDuel) {
    handlePendingDuel(gameState.pendingDuel);
  }
  
  // Update current turn indicator
  highlightCurrentPlayer(gameState.currentTurn);
});
```

## ♟️ Move Events

### 📥 INCOMING: Move Made
```typescript
socket.on('game:move', (data) => {
  console.log('🏃 Move made!', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    move: GambitMove,
    newGameState: BaseGameState,
    timestamp: number
  }
  */
  
  // Animate the move in Three.js
  animatePieceMove({
    from: data.move.from,
    to: data.move.to,
    piece: data.move.piece,
    duration: 500,
    onComplete: () => {
      // Update game state after animation
      updateGameState(data.newGameState);
    }
  });
  
  // Play move sound
  playMoveSound(data.move);
  
  // Update move history display
  addMoveToHistory(data.move);
});
```

### 📥 INCOMING: Invalid Move
```typescript
socket.on('game:move_invalid', (data) => {
  console.warn('⚠️ Invalid move attempted:', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    error: string,
    attemptedMove: any
  }
  */
  
  // Show error message to user
  showErrorMessage(data.error);
  
  // Bounce piece back to original position
  bounceBackPiece(data.attemptedMove);
  
  // Re-enable move input
  enableMoveInput();
});

## ⚔️ Duel Events

### 📥 INCOMING: Duel Initiated
```typescript
socket.on('game:duel_initiated', (data) => {
  console.log('⚔️ DUEL STARTED!', data);
  /*
  data = {
    gameId: string,
    attacker: {
      playerId: string,
      piece: string,
      from: Square,
      to: Square
    },
    defender: {
      playerId: string,
      piece: string,
      square: Square
    },
    timestamp: number
  }
  */
  
  // Show dramatic duel start animation
  playDuelStartAnimation(data.attacker, data.defender);
  
  // Check if current player is involved
  const isAttacker = data.attacker.playerId === currentPlayerId;
  const isDefender = data.defender.playerId === currentPlayerId;
  
  if (isAttacker || isDefender) {
    // Show BP allocation interface
    showDuelAllocationUI({
      maxBP: getCurrentPlayerBP(),
      role: isAttacker ? 'attacker' : 'defender',
      onSubmit: (allocation) => {
        submitDuelAllocation(allocation);
      }
    });
  } else {
    // Spectator view
    showSpectatorDuelUI(data);
  }
  
  // Play duel music/sounds
  playDuelMusic();
});
```

### 📥 INCOMING: Duel Allocation Submitted
```typescript
socket.on('game:duel_allocation_submitted', (data) => {
  console.log('📊 Duel allocation submitted:', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    role: 'attacker' | 'defender',
    waitingFor: 'attacker' | 'defender' | null
  }
  */
  
  // Update UI to show waiting state
  if (data.waitingFor) {
    showWaitingForAllocation(data.waitingFor);
  } else {
    showBothAllocationsSubmitted();
  }
  
  // Disable allocation UI if it was your submission
  if (data.playerId === currentPlayerId) {
    disableDuelAllocationUI();
    showSubmittedConfirmation();
  }
});
```

### 📥 INCOMING: Duel Resolved
```typescript
socket.on('game:duel_resolved', (data) => {
  console.log('🏆 Duel resolved!', data);
  /*
  data = {
    gameId: string,
    winner: 'attacker' | 'defender',
    attackerAllocation: number,
    defenderAllocation: number,
    outcome: {
      captureSuccessful: boolean,
      move: GambitMove,
      capturedPiece?: string
    },
    newGameState: BaseGameState
  }
  */
  
  // Reveal BP allocations with animation
  revealDuelAllocations({
    attacker: data.attackerAllocation,
    defender: data.defenderAllocation,
    winner: data.winner
  });
  
  // Animate the outcome
  if (data.outcome.captureSuccessful) {
    animateSuccessfulCapture({
      from: data.outcome.move.from,
      to: data.outcome.move.to,
      capturedPiece: data.outcome.capturedPiece
    });
  } else {
    animateFailedCapture({
      from: data.outcome.move.from,
      to: data.outcome.move.to,
      onComplete: () => {
        // Check if tactical retreat is needed
        if (needsTacticalRetreat(data.newGameState)) {
          showTacticalRetreatOptions(data.newGameState);
        }
      }
    });
  }
  
  // Update game state
  updateGameState(data.newGameState);
  
  // Play outcome sounds
  playDuelOutcomeSound(data.winner);
});
```

## 🏃 Tactical Retreat Events

### 📥 INCOMING: Tactical Retreat Made
```typescript
socket.on('game:tactical_retreat', (data) => {
  console.log('🏃 Tactical retreat!', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    retreat: {
      piece: string,
      from: Square,
      to: Square,
      cost: number
    },
    newGameState: BaseGameState
  }
  */
  
  // Animate the retreat movement
  animateRetreatMove({
    from: data.retreat.from,
    to: data.retreat.to,
    piece: data.retreat.piece,
    duration: 700 // Slightly slower than normal moves
  });
  
  // Show BP cost indicator
  showBPCostIndicator(data.retreat.cost, data.playerId);
  
  // Update game state
  updateGameState(data.newGameState);
  
  // Play retreat sound
  playRetreatSound();
});
```

## 💰 Battle Points Events

### 📥 INCOMING: Battle Points Updated
```typescript
socket.on('game:battle_points_updated', (data) => {
  console.log('💰 BP updated!', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    previousAmount: number,
    newAmount: number,
    change: number, // Can be negative
    reason: 'duel_loss' | 'duel_win' | 'tactical_retreat' | 'regeneration'
  }
  */
  
  // Animate BP change
  animateBPChange({
    playerId: data.playerId,
    from: data.previousAmount,
    to: data.newAmount,
    change: data.change,
    reason: data.reason
  });
  
  // Update BP display
  updateBattlePointsDisplay(data.playerId, data.newAmount);
  
  // Show change indicator
  showBPChangeIndicator(data.change, data.reason);
  
  // Play BP sound
  playBPChangeSound(data.change > 0);
});
```

## 👥 Player Events

### 📥 INCOMING: Player Connected
```typescript
socket.on('game:player_connected', (data) => {
  console.log('👋 Player connected!', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    playerColor: 'w' | 'b',
    isAnonymous: boolean
  }
  */
  
  // Update player status
  updatePlayerStatus(data.playerId, 'connected');
  
  // Show connection notification
  showPlayerNotification(`${data.playerColor === 'w' ? 'White' : 'Black'} player connected!`);
  
  // If game can now start, transition from lobby
  if (isGameReady()) {
    transitionFromLobbyToGame();
  }
});
```

### 📥 INCOMING: Player Disconnected  
```typescript
socket.on('game:player_disconnected', (data) => {
  console.log('👋 Player disconnected!', data);
  /*
  data = {
    gameId: string,
    playerId: string,
    playerColor: 'w' | 'b'
  }
  */
  
  // Update player status
  updatePlayerStatus(data.playerId, 'disconnected');
  
  // Show disconnection warning
  showPlayerNotification(`${data.playerColor === 'w' ? 'White' : 'Black'} player disconnected!`, 'warning');
  
  // Pause game timer if active
  pauseGameTimer();
  
  // Show reconnection waiting UI
  showReconnectionWaitingUI();
});
```

## 🎯 Game Status Events

### 📥 INCOMING: Game Ended
```typescript
socket.on('game:ended', (data) => {
  console.log('🏁 Game ended!', data);
  /*
  data = {
    gameId: string,
    reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'timeout',
    winner?: 'w' | 'b',
    finalGameState: BaseGameState
  }
  */
  
  // Stop all animations and timers
  stopAllAnimations();
  stopGameTimer();
  
  // Show game end screen
  showGameEndScreen({
    reason: data.reason,
    winner: data.winner,
    finalState: data.finalGameState
  });
  
  // Play end game music
  playEndGameMusic(data.reason, data.winner);
  
  // Offer rematch/new game options
  showGameEndOptions();
});
```

## ❌ Error Events

### 📥 INCOMING: Game Error
```typescript
socket.on('game:error', (error) => {
  console.error('🚨 Game error:', error);
  /*
  error = {
    type: 'INVALID_ACTION' | 'GAME_NOT_FOUND' | 'UNAUTHORIZED' | 'SERVER_ERROR',
    message: string,
    details?: any
  }
  */
  
  // Handle different error types
  switch (error.type) {
    case 'INVALID_ACTION':
      showErrorMessage('Invalid move! Please try again.');
      enableMoveInput();
      break;
      
    case 'GAME_NOT_FOUND':
      showErrorMessage('Game not found! Returning to lobby...');
      redirectToLobby();
      break;
      
    case 'UNAUTHORIZED':
      showErrorMessage('You are not authorized for this action.');
      break;
      
    case 'SERVER_ERROR':
      showErrorMessage('Server error occurred. Please refresh.');
      break;
      
    default:
      showErrorMessage('An unexpected error occurred.');
  }
  
  // Log for debugging
  logErrorForDebugging(error);
});
```

## 🚀 Complete Event Handler Setup

```typescript
class GambitChessWebSocketManager {
  private socket: Socket;
  private gameId: string | null = null;
  private currentPlayerId: string;
  
  constructor(serverUrl: string, sessionToken?: string) {
    this.socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket']
    });
    
    if (sessionToken) {
      this.socket.auth = { anonymousSessionToken: sessionToken };
    }
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectionError.bind(this));
    
    // Game state events
    this.socket.on('game:state', this.handleGameState.bind(this));
    
    // Move events
    this.socket.on('game:move', this.handleMove.bind(this));
    this.socket.on('game:move_invalid', this.handleInvalidMove.bind(this));
    
    // Duel events
    this.socket.on('game:duel_initiated', this.handleDuelInitiated.bind(this));
    this.socket.on('game:duel_allocation_submitted', this.handleDuelAllocationSubmitted.bind(this));
    this.socket.on('game:duel_resolved', this.handleDuelResolved.bind(this));
    
    // Tactical retreat events
    this.socket.on('game:tactical_retreat', this.handleTacticalRetreat.bind(this));
    
    // Battle points events
    this.socket.on('game:battle_points_updated', this.handleBattlePointsUpdated.bind(this));
    
    // Player events
    this.socket.on('game:player_connected', this.handlePlayerConnected.bind(this));
    this.socket.on('game:player_disconnected', this.handlePlayerDisconnected.bind(this));
    
    // Game status events
    this.socket.on('game:ended', this.handleGameEnded.bind(this));
    
    // Error events
    this.socket.on('game:error', this.handleGameError.bind(this));
    this.socket.on('error', this.handleSocketError.bind(this));
  }
  
  // Public methods
  public joinGame(gameId: string) {
    this.gameId = gameId;
    this.socket.emit('game:join', { gameId });
  }
  
  public leaveGame() {
    if (this.gameId) {
      this.socket.emit('game:leave', { gameId: this.gameId });
      this.gameId = null;
    }
  }
  
  public disconnect() {
    this.socket.disconnect();
  }
  
  // Event handlers (implement these based on your UI framework)
  private handleConnect() { /* ... */ }
  private handleDisconnect(reason: string) { /* ... */ }
  private handleConnectionError(error: Error) { /* ... */ }
  private handleGameState(gameState: BaseGameState) { /* ... */ }
  private handleMove(data: any) { /* ... */ }
  private handleInvalidMove(data: any) { /* ... */ }
  private handleDuelInitiated(data: any) { /* ... */ }
  private handleDuelAllocationSubmitted(data: any) { /* ... */ }
  private handleDuelResolved(data: any) { /* ... */ }
  private handleTacticalRetreat(data: any) { /* ... */ }
  private handleBattlePointsUpdated(data: any) { /* ... */ }
  private handlePlayerConnected(data: any) { /* ... */ }
  private handlePlayerDisconnected(data: any) { /* ... */ }
  private handleGameEnded(data: any) { /* ... */ }
  private handleGameError(error: any) { /* ... */ }
  private handleSocketError(error: Error) { /* ... */ }
}

// Usage
const wsManager = new GambitChessWebSocketManager('http://localhost:5000', sessionToken);
wsManager.joinGame('your-game-id');
```

## 🎨 Three.js Animation Integration

```typescript
// Animation helpers for WebSocket events
class GameAnimationController {
  
  animatePieceMove(data: { from: string, to: string, piece: string, duration: number }) {
    const piece = this.findPieceAt(data.from);
    const targetPos = this.squareToPosition(data.to);
    
    return new Promise(resolve => {
      new TWEEN.Tween(piece.position)
        .to(targetPos, data.duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onComplete(() => resolve(true))
        .start();
    });
  }
  
  animateDuelStart(attacker: any, defender: any) {
    // Create dramatic visual effects
    const battleAura = this.createBattleAura();
    battleAura.position.copy(this.findPieceAt(defender.square).position);
    this.scene.add(battleAura);
    
    // Camera shake
    this.shakeCameraForDuel();
    
    // Particle effects
    this.createDuelParticles(attacker, defender);
  }
  
  animateBPChange(data: { playerId: string, from: number, to: number, change: number }) {
    // Create floating BP change indicator
    const indicator = this.createBPChangeIndicator(data.change);
    
    // Animate the indicator
    const startY = this.getPlayerBPPosition(data.playerId).y;
    indicator.position.setY(startY);
    
    new TWEEN.Tween(indicator.position)
      .to({ y: startY + 2 }, 1000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onComplete(() => {
        this.scene.remove(indicator);
      })
      .start();
      
    // Update BP counter with animated counting
    this.animateNumberCounter(data.from, data.to, 1000);
  }
}
```

## 🔥 Pro Tips

1. **Always handle reconnection**: Users WILL lose connection, be ready!
2. **Animate EVERYTHING**: Every event should have a visual response
3. **Show loading states**: Users need feedback during waiting periods
4. **Handle errors gracefully**: Don't crash on unexpected events
5. **Use event queuing**: For rapid events, queue animations properly
6. **Implement heartbeat**: Monitor connection health
7. **Cache game state**: Store locally for quick recovery
8. **Sound design**: Audio feedback makes events feel impactful

**YO!** With this WebSocket guide, you're ready to build a BLAZING fast real-time Gambit Chess experience! Every event is covered, every pattern is battle-tested! 🚀⚡

Time to make those pieces DANCE! 🎮✨ 