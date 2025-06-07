import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BaseGameState } from '@gambit-chess/shared';
import { useGameStore } from '../../stores/gameStore';
import { BoardSquares } from './BoardSquares';
import { ChessPieces } from './ChessPieces';
import { RetreatCostBillboard } from './RetreatCostBillboard';
import * as THREE from 'three';

// Component inside Canvas that handles 3D-to-screen projection
const BillboardProjector: React.FC<{
  positions: Array<{ square: string; cost: number; position: [number, number, number] }>;
  onScreenPositionsUpdate: (positions: Array<{ square: string; cost: number; screenPosition: { x: number; y: number; visible: boolean } }>) => void;
}> = ({ positions, onScreenPositionsUpdate }) => {
  const { camera, size, gl } = useThree();

  // Convert 3D world positions to 2D screen coordinates
  useFrame(() => {
    // Get canvas element and its position
    const canvas = gl.domElement;
    const canvasRect = canvas.getBoundingClientRect();
    
    const screenPositions = positions.map(({ square, cost, position }) => {
      // Apply the same 4x scale that the board uses
      const scaledPosition = new THREE.Vector3(
        position[0] * 4.0,
        position[1] * 4.0, 
        position[2] * 4.0
      );
      
      // Project to screen space
      const vector = scaledPosition.clone();
      vector.project(camera);
      
      // Convert normalized device coordinates to canvas pixels
      const canvasX = (vector.x * 0.5 + 0.5) * size.width;
      const canvasY = (vector.y * -0.5 + 0.5) * size.height;
      
      // Convert canvas coordinates to screen coordinates (accounting for canvas position)
      const screenX = canvasX + canvasRect.left;
      const screenY = canvasY + canvasRect.top;
      
      // Check if position is in front of camera (z < 1)
      const visible = vector.z < 1;
      
      // Debug logging for first few frames
      if ((square === 'f2' || square === 'g2' || square === 'd1') && Math.random() < 0.1) {
        console.log(`🎯 Billboard ${square}:`, {
          originalPos: position,
          scaledPos: [scaledPosition.x, scaledPosition.y, scaledPosition.z],
          projectedNDC: [vector.x, vector.y, vector.z],
          canvasPos: [canvasX, canvasY],
          canvasRect: { left: canvasRect.left, top: canvasRect.top, width: canvasRect.width, height: canvasRect.height },
          screenPos: [screenX, screenY],
          canvasSize: [size.width, size.height],
          visible
        });
      }
      
      return {
        square,
        cost,
        screenPosition: { x: screenX, y: screenY, visible }
      };
    });
    
    onScreenPositionsUpdate(screenPositions);
  });

  return null; // This component doesn't render anything in 3D
};

interface ChessBoard3DProps {
  gameState: BaseGameState;
  onSquareHover?: (square: string | null, x?: number, y?: number) => void;
}

export const ChessBoard3D: React.FC<ChessBoard3DProps> = ({ gameState, onSquareHover }) => {
  const { selectSquare, selectedSquare, highlightedSquares, pendingMove, retreatOptions } = useGameStore();
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [billboardScreenPositions, setBillboardScreenPositions] = useState<Array<{ square: string; cost: number; screenPosition: { x: number; y: number; visible: boolean } }>>([]);

  const handleSquareClick = useCallback((square: string) => {
    selectSquare(square);
  }, [selectSquare]);

  const handleSquareHover = useCallback((square: string | null, event?: any) => {
    setHoveredSquare(square);
    
    // Pass hover information to parent for retreat cost display
    if (onSquareHover) {
      let x = 0, y = 0;
      if (event && event.nativeEvent) {
        x = event.nativeEvent.clientX;
        y = event.nativeEvent.clientY;
      }
      onSquareHover(square, x, y);
    }
  }, [onSquareHover]);

  // Convert square notation to 3D position (matching BoardSquares coordinate system)
  const squareTo3DPosition = useCallback((square: string): [number, number, number] => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
    const rank = parseInt(square[1]) - 1;   // 1=0, 2=1, ..., 8=7
    
    // Use same coordinate system as BoardSquares component
    const SQUARE_SIZE = 0.04;
    const BOARD_SIZE = 8;
    const BOARD_OFFSET = (BOARD_SIZE - 1) * SQUARE_SIZE / 2;
    
    const x = file * SQUARE_SIZE - BOARD_OFFSET;
    const z = rank * SQUARE_SIZE - BOARD_OFFSET;
    const y = 0.0005; // Just barely above board surface - less than 1mm above squares
    
    return [x, y, z];
  }, []);

  // Prepare retreat cost billboards with 3D positions
  const retreatCostBillboards = useMemo(() => {
    if (!retreatOptions) return [];
    
    return retreatOptions.map((option) => ({
      square: option.square,
      cost: option.cost,
      position: squareTo3DPosition(option.square)
    }));
  }, [retreatOptions, squareTo3DPosition]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        shadows
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        {/* Component that projects 3D positions to screen coordinates */}
        <BillboardProjector
          positions={retreatCostBillboards}
          onScreenPositionsUpdate={setBillboardScreenPositions}
        />

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
            hoveredSquare={hoveredSquare}
            selectedSquare={selectedSquare}
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
          screenSpacePanning={false}
        />
      </Canvas>

      {/* HTML Overlay Billboards - render outside Canvas for guaranteed top positioning */}
      {billboardScreenPositions.map((billboard) => (
        <RetreatCostBillboard
          key={billboard.square}
          screenPosition={billboard.screenPosition}
          cost={billboard.cost}
          isVisible={true}
        />
      ))}
    </div>
  );
}; 