import React, { useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Position } from '@gambit-chess/shared';
import { useMove } from '../../hooks/useMove';

/**
 * @component ChessBoard
 * @description 3D chess board with selectable squares
 * @dependencies Three.js, React Three Fiber
 */
const ChessBoard: React.FC = () => {
  const boardRef = useRef<THREE.Group>(null);
  const { selectPiece, selectedPiece, movePiece, isValidMoveDestination } = useMove();

  // Board dimensions
  const BOARD_SIZE = 8;
  const SQUARE_SIZE = 1;
  const BOARD_WIDTH = BOARD_SIZE * SQUARE_SIZE;
  const BOARD_HEIGHT = 0.1; // Height of the board

  // Generate chess squares (8x8 grid)
  const squares = [];
  for (let x = 0; x < BOARD_SIZE; x++) {
    for (let y = 0; y < BOARD_SIZE; y++) {
      // Alternate colors (white/black)
      const isWhite = (x + y) % 2 === 0;
      const color = isWhite ? '#e0c9a6' : '#7c4c3e';
      
      // Square position
      const posX = x * SQUARE_SIZE - BOARD_WIDTH / 2 + SQUARE_SIZE / 2;
      const posY = 0;
      const posZ = y * SQUARE_SIZE - BOARD_WIDTH / 2 + SQUARE_SIZE / 2;

      // Chess position (for game logic)
      const position: Position = { x, y: BOARD_SIZE - 1 - y };

      // Handle click on square
      const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        
        // If a piece is already selected and the clicked square is a valid move destination
        if (selectedPiece.position && isValidMoveDestination(position)) {
          movePiece(position);
        } else {
          // Otherwise, try to select a piece at this position
          selectPiece(position);
        }
      };

      // Determine if this square is highlighted (for valid moves or selected piece)
      const isSelectedSquare = selectedPiece.position && 
        selectedPiece.position.x === position.x && 
        selectedPiece.position.y === position.y;

      const isValidMoveSquare = selectedPiece.position && 
        isValidMoveDestination(position);

      // Square highlighting colors
      let squareColor = color;
      if (isSelectedSquare) {
        squareColor = '#4a8fe7'; // Blue for selected
      } else if (isValidMoveSquare) {
        squareColor = '#71c17b'; // Green for valid moves
      }

      squares.push(
        <mesh
          key={`square-${x}-${y}`}
          position={[posX, posY, posZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleClick}
          userData={{ position }}
        >
          <planeGeometry args={[SQUARE_SIZE, SQUARE_SIZE]} />
          <meshStandardMaterial color={squareColor} />
        </mesh>
      );
    }
  }

  // Create board frame
  const frameWidth = BOARD_WIDTH + 0.4;
  const frameThickness = 0.2;
  const frameHeight = BOARD_HEIGHT + 0.05;

  return (
    <group ref={boardRef}>
      {/* Board base */}
      <mesh position={[0, -BOARD_HEIGHT / 2, 0]}>
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_WIDTH]} />
        <meshStandardMaterial color="#5c3521" />
      </mesh>

      {/* Chess squares */}
      <group position={[0, 0.001, 0]}>
        {squares}
      </group>

      {/* Board frame */}
      <group>
        {/* Top */}
        <mesh position={[0, 0, -frameWidth / 2 + frameThickness / 2]}>
          <boxGeometry args={[frameWidth, frameHeight, frameThickness]} />
          <meshStandardMaterial color="#3a2213" />
        </mesh>
        {/* Bottom */}
        <mesh position={[0, 0, frameWidth / 2 - frameThickness / 2]}>
          <boxGeometry args={[frameWidth, frameHeight, frameThickness]} />
          <meshStandardMaterial color="#3a2213" />
        </mesh>
        {/* Left */}
        <mesh position={[-frameWidth / 2 + frameThickness / 2, 0, 0]}>
          <boxGeometry args={[frameThickness, frameHeight, frameWidth - frameThickness * 2]} />
          <meshStandardMaterial color="#3a2213" />
        </mesh>
        {/* Right */}
        <mesh position={[frameWidth / 2 - frameThickness / 2, 0, 0]}>
          <boxGeometry args={[frameThickness, frameHeight, frameWidth - frameThickness * 2]} />
          <meshStandardMaterial color="#3a2213" />
        </mesh>
      </group>
    </group>
  );
};

export default ChessBoard; 