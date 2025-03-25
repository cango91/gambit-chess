import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GameEvents, GamePhase, GameState } from '@gambit-chess/shared';

// Import hooks
import { useWebSocket } from '../../hooks/useWebSocket';
import { useGameState } from '../../hooks/useGameState';

// Import 3D components
import ChessBoard from '../3d/ChessBoard';
import ChessPieces from '../3d/ChessPieces';

// Import UI components
import GameControls from './GameControls';
import GameInfo from './GameInfo';
import BPAllocationPanel from './BPAllocationPanel';
import TacticalRetreatPanel from './TacticalRetreatPanel';

/**
 * @component GameContainer
 * @description Main container for the chess game, including 3D board and UI controls
 * @dependencies React Three Fiber, WebSocket hook, Game State hook
 */
const GameContainer: React.FC = () => {
  const { gameId } = useParams();
  const { send } = useWebSocket();
  const { gameState, isLoading, error } = useGameState();

  const [showBPAllocation, setShowBPAllocation] = useState(false);
  const [showTacticalRetreat, setShowTacticalRetreat] = useState(false);

  useEffect(() => {
    // Handle connection and game state
    if (gameId) {
      // Join the game when component mounts
      send(GameEvents.JOIN_GAME, { gameId });
    }

    // Set up phase change handlers
    if (gameState) {
      setShowBPAllocation(gameState.gamePhase === GamePhase.DUEL_ALLOCATION);
      setShowTacticalRetreat(gameState.gamePhase === GamePhase.TACTICAL_RETREAT);
    }
  }, [gameId, send, gameState]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Game info panel (player info, BP, turn indicator) */}
      <GameInfo />
      
      {/* 3D chess board container */}
      <div className="chess-board-container">
        <Canvas camera={{ position: [0, 5, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          
          {/* Chess board */}
          <ChessBoard />
          
          {/* Chess pieces */}
          {gameState && <ChessPieces pieces={gameState.pieces} />}
          
          {/* Camera controls */}
          <OrbitControls 
            enablePan={false}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2 - 0.1}
            minDistance={3}
            maxDistance={10}
          />
        </Canvas>
      </div>
      
      {/* Game controls (resign, offer draw, etc.) */}
      <GameControls />
      
      {/* Conditional UI elements based on game phase */}
      {showBPAllocation && <BPAllocationPanel />}
      {showTacticalRetreat && <TacticalRetreatPanel />}
      
      {/* Game over dialog */}
      {gameState && gameState.gameState !== GameState.ACTIVE && (
        <div className="game-over-dialog">
          <h2>Game Over</h2>
          <p>
            {gameState.gameState === GameState.CHECKMATE ? 'Checkmate!' : 
             gameState.gameState === GameState.STALEMATE ? 'Stalemate!' : 
             gameState.gameState === GameState.DRAW ? 'Draw!' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameContainer; 