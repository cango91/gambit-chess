import React, { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BaseGameState } from '@gambit-chess/shared';
import { useGameStore } from '../../stores/gameStore';
import { BoardSquares } from './BoardSquares';
import { ChessPieces } from './ChessPieces';

interface ChessBoard3DProps {
  gameState: BaseGameState;
}

export const ChessBoard3D: React.FC<ChessBoard3DProps> = ({ gameState }) => {
  const { selectSquare, selectedSquare, highlightedSquares, pendingMove } = useGameStore();
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);

  const handleSquareClick = useCallback((square: string) => {
    selectSquare(square);
  }, [selectSquare]);

  const handleSquareHover = useCallback((square: string | null) => {
    setHoveredSquare(square);
  }, []);

  return (
    <Canvas
      style={{ width: '100%', height: '100%' }}
      shadows
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      {/* Camera setup - positioned for optimal viewing */}
      <PerspectiveCamera
        makeDefault
        position={[0, 4, 4]}
        fov={35}
        near={0.1}
        far={1000}
      />
      
      {/* Enhanced lighting setup for dramatic chess atmosphere */}
      <ambientLight intensity={0.4} color="#ffeaa7" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <pointLight
        position={[0, 12, 0]}
        intensity={0.6}
        color="#b58863"
        distance={25}
      />
      <pointLight
        position={[-5, 8, 5]}
        intensity={0.3}
        color="#f0d9b5"
        distance={15}
      />

      {/* Board and pieces - much larger scale for better visibility */}
      <group position={[0, 0, 0]} scale={[4.0, 4.0, 4.0]}>
        <BoardSquares
          selectedSquare={selectedSquare}
          highlightedSquares={highlightedSquares}
          hoveredSquare={hoveredSquare}
          pendingMove={pendingMove}
          onSquareClick={handleSquareClick}
          onSquareHover={handleSquareHover}
        />
        
        <ChessPieces
          gameState={gameState}
          onPieceClick={handleSquareClick}
          onPieceHover={handleSquareHover}
        />
      </group>

      {/* Enhanced camera controls for better interaction */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.1} // Prevent going under the board
        minPolarAngle={Math.PI / 8}   // Allow more top-down view
        target={[0, 0, 0]}
        panSpeed={1.0}
        rotateSpeed={1.0}
        zoomSpeed={1.5}
        enableDamping={true}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}; 