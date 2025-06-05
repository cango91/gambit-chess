# 🚀 Gambit Chess Client Quick Start

**YO CLIENT TEAM!** Welcome to the most EPIC chess client you'll ever build! 🔥 This quick start will get you from zero to MAGNIFICENT Three.js chess experience in record time!

## 🎯 What You're Building

A stunning 3D web-based chess client for **Gambit Chess** - a chess variant where captures are resolved through Battle Points (BP) duels instead of automatically succeeding. Think **chess meets poker meets strategy RPG**! 

### Core Features You'll Implement:
- 🎮 **Anonymous gameplay** (no login required!)
- 🎨 **Stunning 3D board** with Three.js
- ⚔️ **Duel system** for captures with BP allocation
- 🏃 **Tactical retreats** after failed captures  
- 🤖 **AI opponents** (easy/medium/hard)
- 👥 **Multiplayer matchmaking** 
- 📱 **Mobile-friendly** design
- ⚡ **Real-time** updates via WebSocket

## 📚 Essential Reading Order

1. **THIS FILE** - Quick start overview 
2. **SERVER_INTEGRATION_GUIDE.md** - API endpoints and server communication
3. **SHARED_MODULE_GUIDE.md** - Types, utilities, and shared game logic
4. **WEBSOCKET_EVENTS_GUIDE.md** - Real-time event handling

## 🛠️ Tech Stack

```
Frontend Framework: React (recommended) or vanilla JS
3D Graphics: Three.js + React Three Fiber (optional)
Real-time: Socket.IO client
Type Safety: TypeScript (REQUIRED!)
Shared Logic: @gambit-chess/shared module
State Management: React Context or Zustand
Build Tool: Vite or Create React App
```

## 🚀 Quick Setup Steps

### 1. Project Structure (Suggested)
```
client/
├── src/
│   ├── components/          # React components
│   │   ├── GameBoard/       # 3D chess board
│   │   ├── DuelInterface/   # BP allocation UI
│   │   ├── PlayerInfo/      # BP display, timers
│   │   └── Lobby/          # Game discovery
│   ├── services/           # API & WebSocket services
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper functions
│   ├── types/              # Additional type definitions
│   └── styles/             # CSS/styled-components
├── public/                 # Static assets (chess piece models)
└── package.json
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install react react-dom typescript
npm install @types/react @types/react-dom

# 3D Graphics
npm install three @types/three
npm install @react-three/fiber @react-three/drei

# Real-time Communication  
npm install socket.io-client

# Shared game logic (your local workspace)
npm install @gambit-chess/shared

# Optional: State management
npm install zustand
# OR
npm install @reduxjs/toolkit react-redux

# Optional: Styling
npm install styled-components
npm install @emotion/react @emotion/styled
```

### 3. Core Service Setup

#### WebSocket Service (`src/services/websocket.service.ts`)
```typescript
import { io, Socket } from 'socket.io-client';
import { BaseGameState } from '@gambit-chess/shared';

class WebSocketService {
  private socket: Socket;
  
  constructor() {
    this.socket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket']
    });
    
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    this.socket.on('game:state', this.handleGameState.bind(this));
    this.socket.on('game:move', this.handleMove.bind(this));
    this.socket.on('game:duel_initiated', this.handleDuelInitiated.bind(this));
    // ... more events (see WEBSOCKET_EVENTS_GUIDE.md)
  }
  
  public joinGame(gameId: string) {
    this.socket.emit('game:join', { gameId });
  }
  
  // Event handlers
  private handleGameState(gameState: BaseGameState) { /* */ }
  private handleMove(data: any) { /* */ }
  private handleDuelInitiated(data: any) { /* */ }
}

export const wsService = new WebSocketService();
```

#### API Service (`src/services/api.service.ts`)
```typescript
import { 
  MoveAction, 
  DuelAllocationAction, 
  TacticalRetreatAction 
} from '@gambit-chess/shared';

class ApiService {
  private baseUrl = 'http://localhost:5000/api';
  private sessionToken: string | null = null;
  
  // Anonymous session management
  async createAnonymousSession() {
    const response = await fetch(`${this.baseUrl}/anonymous/session`, {
      method: 'POST'
    });
    const data = await response.json();
    this.sessionToken = data.sessionToken;
    return data;
  }
  
  // Game creation
  async createGame(options: {
    gameType: 'ai' | 'human' | 'practice';
    colorPreference: 'white' | 'black' | 'random';
    aiDifficulty?: 'easy' | 'medium' | 'hard';
  }) {
    return this.post('/games', {
      ...options,
      anonymousSessionToken: this.sessionToken
    });
  }
  
  // Game discovery  
  async getWaitingGames() {
    return this.get('/games/waiting');
  }
  
  // Game actions
  async sendGameAction(gameId: string, action: MoveAction | DuelAllocationAction | TacticalRetreatAction) {
    return this.post(`/games/${gameId}/actions`, {
      action,
      playerId: this.getCurrentPlayerId()
    });
  }
  
  private async get(endpoint: string) { /* */ }
  private async post(endpoint: string, data: any) { /* */ }
  private getCurrentPlayerId() { /* */ }
}

export const apiService = new ApiService();
```

### 4. Core Components Structure

#### Game Container (`src/components/GameContainer.tsx`)
```typescript
import React, { useEffect, useState } from 'react';
import { BaseGameState, GameStatus } from '@gambit-chess/shared';
import { GameBoard } from './GameBoard/GameBoard';
import { DuelInterface } from './DuelInterface/DuelInterface';
import { PlayerInfo } from './PlayerInfo/PlayerInfo';
import { wsService } from '../services/websocket.service';

export const GameContainer: React.FC<{ gameId: string }> = ({ gameId }) => {
  const [gameState, setGameState] = useState<BaseGameState | null>(null);
  
  useEffect(() => {
    // Connect to game room
    wsService.joinGame(gameId);
    
    // Listen for game state updates
    const handleGameState = (state: BaseGameState) => {
      setGameState(state);
    };
    
    wsService.on('game:state', handleGameState);
    
    return () => {
      wsService.off('game:state', handleGameState);
    };
  }, [gameId]);
  
  if (!gameState) {
    return <div>Loading game...</div>;
  }
  
  return (
    <div className="game-container">
      <PlayerInfo player={gameState.whitePlayer} />
      <GameBoard gameState={gameState} />
      <PlayerInfo player={gameState.blackPlayer} />
      
      {gameState.gameStatus === GameStatus.DUEL_IN_PROGRESS && (
        <DuelInterface pendingDuel={gameState.pendingDuel} />
      )}
    </div>
  );
};
```

#### 3D Game Board (`src/components/GameBoard/GameBoard.tsx`)
```typescript
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BaseGameState } from '@gambit-chess/shared';
import { ChessBoard3D } from './ChessBoard3D';

interface GameBoardProps {
  gameState: BaseGameState;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  return (
    <div className="game-board-container">
      <Canvas
        camera={{ position: [0, 8, 8], fov: 50 }}
        style={{ width: '100%', height: '600px' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <ChessBoard3D 
          fen={gameState.chess.fen()}
          onMove={(from, to) => handleMove(from, to)}
          highlightedSquares={getHighlightedSquares(gameState)}
        />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};
```

### 5. Key Hooks to Create

#### Game State Hook (`src/hooks/useGameState.ts`)
```typescript
import { useState, useEffect } from 'react';
import { BaseGameState } from '@gambit-chess/shared';
import { wsService } from '../services/websocket.service';

export const useGameState = (gameId: string) => {
  const [gameState, setGameState] = useState<BaseGameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    wsService.joinGame(gameId);
    
    const handleGameState = (state: BaseGameState) => {
      setGameState(state);
      setLoading(false);
    };
    
    const handleError = (error: any) => {
      setError(error.message);
      setLoading(false);
    };
    
    wsService.on('game:state', handleGameState);
    wsService.on('game:error', handleError);
    
    return () => {
      wsService.off('game:state', handleGameState);
      wsService.off('game:error', handleError);
    };
  }, [gameId]);
  
  return { gameState, loading, error };
};
```

#### Anonymous Session Hook (`src/hooks/useAnonymousSession.ts`)
```typescript
import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

export const useAnonymousSession = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionData = await apiService.createAnonymousSession();
        setSession(sessionData);
      } catch (error) {
        console.error('Failed to create anonymous session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initSession();
  }, []);
  
  return { session, loading };
};
```

## 🎮 Game Flow Implementation

### 1. App Entry Point
```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Lobby } from './components/Lobby/Lobby';
import { GameContainer } from './components/GameContainer';
import { useAnonymousSession } from './hooks/useAnonymousSession';

function App() {
  const { session, loading } = useAnonymousSession();
  
  if (loading) {
    return <div>Initializing Gambit Chess...</div>;
  }
  
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/game/:gameId" element={<GameContainer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

### 2. Lobby Implementation
```typescript
// src/components/Lobby/Lobby.tsx
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api.service';
import { useNavigate } from 'react-router-dom';

export const Lobby: React.FC = () => {
  const [waitingGames, setWaitingGames] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadWaitingGames();
  }, []);
  
  const loadWaitingGames = async () => {
    const { games } = await apiService.getWaitingGames();
    setWaitingGames(games);
  };
  
  const createAIGame = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const { gameId } = await apiService.createGame({
      gameType: 'ai',
      colorPreference: 'random', // Let fate decide!
      aiDifficulty: difficulty
    });
    
    navigate(`/game/${gameId}`);
  };
  
  const createHumanGame = async () => {
    const { gameId } = await apiService.createGame({
      gameType: 'human',
      colorPreference: 'white'
    });
    
    navigate(`/game/${gameId}`);
  };
  
  const joinGame = async (gameId: string) => {
    await apiService.joinGame(gameId);
    navigate(`/game/${gameId}`);
  };
  
  return (
    <div className="lobby">
      <h1>🎮 Gambit Chess</h1>
      
      <div className="game-creation">
        <h2>Create New Game</h2>
        <button onClick={() => createAIGame('easy')}>vs Easy AI</button>
        <button onClick={() => createAIGame('medium')}>vs Medium AI</button>
        <button onClick={() => createAIGame('hard')}>vs Hard AI</button>
        <button onClick={createHumanGame}>vs Human</button>
      </div>
      
      <div className="waiting-games">
        <h2>Join Waiting Games</h2>
        {waitingGames.map(game => (
          <div key={game.id} className="game-card">
            <span>Game vs {game.whitePlayer.id}</span>
            <button onClick={() => joinGame(game.id)}>Join as Black</button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎨 Three.js Integration Tips

### Basic 3D Board Setup
```typescript
// src/components/GameBoard/ChessBoard3D.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

export const ChessBoard3D: React.FC<{
  fen: string;
  onMove: (from: string, to: string) => void;
  highlightedSquares: string[];
}> = ({ fen, onMove, highlightedSquares }) => {
  const boardRef = useRef<Mesh>(null);
  
  // Create 8x8 board squares
  const squares = [];
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const isLight = (rank + file) % 2 === 0;
      const square = String.fromCharCode(97 + file) + (rank + 1);
      
      squares.push(
        <mesh
          key={square}
          position={[file - 3.5, 0, rank - 3.5]}
          onClick={() => handleSquareClick(square)}
        >
          <boxGeometry args={[1, 0.1, 1]} />
          <meshStandardMaterial 
            color={isLight ? '#f0d9b5' : '#b58863'} 
          />
        </mesh>
      );
    }
  }
  
  return (
    <group ref={boardRef}>
      {squares}
      {/* Add chess pieces based on FEN */}
      <ChessPieces fen={fen} />
    </group>
  );
};
```

## 🔥 Development Workflow

### 1. Start Development Servers
```bash
# Terminal 1: Start server (if not running)
cd ../server && npm run dev

# Terminal 2: Start client
cd client && npm start
```

### 2. Test with AI Games First
- Create AI games to test basic functionality
- AI responds automatically - great for testing duels!
- No need for multiple browser windows

### 3. Add Human Multiplayer
- Test with multiple browser windows/tabs
- Verify real-time updates work correctly

### 4. Polish & Mobile Optimization
- Add touch controls for mobile
- Responsive design for different screen sizes
- Performance optimization for 3D graphics

## 🎯 MVP Implementation Order

1. **Basic Board Display** - Show 3D chess board with pieces
2. **Move Input** - Click/drag to move pieces  
3. **WebSocket Integration** - Real-time move updates
4. **Duel Interface** - BP allocation UI
5. **Anonymous Sessions** - No-login gameplay
6. **AI Games** - Test against computer
7. **Game Discovery** - Lobby for human games
8. **Polish & Effects** - Animations, sounds, UX

## 📱 Mobile Considerations

```typescript
// Touch-friendly controls
const handleTouchStart = (e: TouchEvent) => {
  // Handle piece selection on mobile
};

const handleTouchMove = (e: TouchEvent) => {
  // Show piece dragging preview
};

const handleTouchEnd = (e: TouchEvent) => {
  // Complete move on touch release
};

// Responsive design
@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
  }
  
  .game-board-container {
    height: 60vh; /* Adjust for mobile screens */
  }
}
```

## 🚀 Performance Tips

1. **Three.js Optimization**:
   - Use `useCallback` for event handlers
   - Implement object pooling for particles
   - Use `useMemo` for expensive calculations

2. **State Management**:
   - Only re-render when necessary
   - Use React.memo for pure components
   - Debounce rapid WebSocket events

3. **Asset Loading**:
   - Preload 3D models for chess pieces
   - Use compressed textures
   - Implement progressive loading

## 🎉 You're Ready!

With this quick start guide, you have EVERYTHING needed to build an incredible Gambit Chess client! The server is feature-complete, the shared module is battle-tested, and the integration patterns are proven.

**Remember**: 
- Check the other guide files for detailed implementations
- Start simple and iterate quickly  
- Test with AI games first
- Focus on that magnificent Three.js UX! 

**NOW GO BUILD SOMETHING AMAZING!** 🚀🎮✨

Questions? Check the other guides or dive into the code! The future of chess gaming is in your hands! 🔥