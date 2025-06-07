import React from 'react';
import { Mesh } from 'three';

interface BoardSquaresProps {
  selectedSquare: string | null;
  highlightedSquares: string[];
  hoveredSquare: string | null;
  pendingMove?: { from: string; to: string } | null;
  onSquareClick: (square: string) => void;
  onSquareHover: (square: string | null, event?: any) => void;
}

// Chess board constants
// Each square is 0.04m (4cm) to comfortably fit 0.02m (2cm) diameter piece bases
const SQUARE_SIZE = 0.04;
const BOARD_SIZE = 8;
const BOARD_OFFSET = (BOARD_SIZE - 1) * SQUARE_SIZE / 2;

// Convert file/rank to board position
const getSquarePosition = (file: number, rank: number): [number, number, number] => {
  const x = file * SQUARE_SIZE - BOARD_OFFSET;
  const z = rank * SQUARE_SIZE - BOARD_OFFSET;
  return [x, 0, z];
};

// Convert square notation to file/rank
const squareToFileRank = (square: string): [number, number] => {
  const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
  const rank = parseInt(square[1]) - 1;   // '1' = 0, '2' = 1, etc.
  return [file, rank];
};

// Convert file/rank to square notation
const fileRankToSquare = (file: number, rank: number): string => {
  return String.fromCharCode(97 + file) + (rank + 1);
};

const SquareMesh: React.FC<{
  square: string;
  isLight: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  isHovered: boolean;
  isPending: boolean;
  onSquareClick: (square: string) => void;
  onSquareHover: (square: string | null, event?: any) => void;
}> = ({ 
  square, 
  isLight, 
  isSelected, 
  isHighlighted, 
  isHovered,
  isPending,
  onSquareClick,
  onSquareHover 
}) => {
  const [file, rank] = squareToFileRank(square);
  const position = getSquarePosition(file, rank);

  // Color logic for square highlighting
  const getSquareColor = (): string => {
    if (isSelected) return '#FFD700'; // Gold for selected
    if (isPending) return '#87CEEB'; // Sky blue for pending moves
    if (isHighlighted) return '#90EE90'; // Light green for highlighted
    if (isHovered) return '#ADD8E6'; // Light blue for hovered
    if (isLight) return '#F0D9B5'; // Light wood color
    return '#B58863'; // Dark wood color
  };

  const handleClick = (event: any) => {
    event.stopPropagation();
    onSquareClick(square);
  };

  const handlePointerEnter = (event: any) => {
    onSquareHover(square, event);
  };

  const handlePointerLeave = (event: any) => {
    onSquareHover(null, event);
  };

  return (
    <mesh
      position={position}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      receiveShadow
    >
      <boxGeometry args={[SQUARE_SIZE, 0.002, SQUARE_SIZE]} />
      <meshLambertMaterial 
        color={getSquareColor()} 
        transparent={isSelected || isHighlighted || isHovered}
        opacity={isSelected || isHighlighted || isHovered ? 0.8 : 1}
      />
    </mesh>
  );
};

export const BoardSquares: React.FC<BoardSquaresProps> = ({
  selectedSquare,
  highlightedSquares,
  hoveredSquare,
  pendingMove,
  onSquareClick,
  onSquareHover,
}) => {
  const squares = [];

  // Generate all 64 squares
  for (let rank = 0; rank < BOARD_SIZE; rank++) {
    for (let file = 0; file < BOARD_SIZE; file++) {
      const square = fileRankToSquare(file, rank);
      const isLight = (rank + file) % 2 === 0;
      const isSelected = selectedSquare === square;
      const isHighlighted = highlightedSquares.includes(square);
      const isHovered = hoveredSquare === square;
      const isPending = !!(pendingMove && (pendingMove.from === square || pendingMove.to === square));

      squares.push(
        <SquareMesh
          key={square}
          square={square}
          isLight={isLight}
          isSelected={isSelected}
          isHighlighted={isHighlighted}
          isHovered={isHovered}
          isPending={isPending}
          onSquareClick={onSquareClick}
          onSquareHover={onSquareHover}
        />
      );
    }
  }

  return (
    <group>
      {/* Board base */}
      <mesh position={[0, -0.005, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE * SQUARE_SIZE + 0.01, 0.01, BOARD_SIZE * SQUARE_SIZE + 0.01]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Board border */}
      <mesh position={[0, -0.002, 0]} receiveShadow>
        <boxGeometry args={[BOARD_SIZE * SQUARE_SIZE + 0.02, 0.004, BOARD_SIZE * SQUARE_SIZE + 0.02]} />
        <meshLambertMaterial color="#654321" />
      </mesh>
      
      {/* All squares */}
      {squares}
    </group>
  );
}; 