import React, { useMemo } from 'react';
import { BaseGameState } from '@gambit-chess/shared';
import { FBXChessPiece } from './FBXChessPiece';
import { PieceSymbol, Color } from 'chess.js';
import { useGameStore } from '../../stores/gameStore';

interface ChessPiecesProps {
  gameState: BaseGameState;
  onPieceClick: (square: string) => void;
  onPieceHover: (square: string | null, event?: any) => void;
  hoveredSquare?: string | null;
  selectedSquare?: string | null;
}

// Constants for piece positioning
// Each square is 0.04m (4cm) to fit 0.02m (2cm) diameter piece bases
const SQUARE_SIZE = 0.04;
const BOARD_SIZE = 8;
const BOARD_OFFSET = (BOARD_SIZE - 1) * SQUARE_SIZE / 2;
const PIECE_HEIGHT = 0.002; // Slight lift above the board

// Convert square notation to 3D position
const squareTo3DPosition = (square: string): [number, number, number] => {
  const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
  const rank = parseInt(square[1]) - 1;   // '1' = 0, '2' = 1, etc.
  
  const x = (7 - file) * SQUARE_SIZE - BOARD_OFFSET;  // Flipped X to match board squares
  const z = rank * SQUARE_SIZE - BOARD_OFFSET;
  
  return [x, PIECE_HEIGHT, z];
};

export const ChessPieces: React.FC<ChessPiecesProps> = ({ 
  gameState, 
  onPieceClick, 
  onPieceHover,
  hoveredSquare: propsHoveredSquare,
  selectedSquare: propsSelectedSquare
}) => {
  const { selectedSquare: storeSelectedSquare, isPlayerTurn, pendingMove } = useGameStore();
  
  // Use props for outline effects, store for game logic
  const selectedSquare = propsSelectedSquare ?? storeSelectedSquare;
  const hoveredSquare = propsHoveredSquare;

  // Parse board state from FEN to get piece positions
  const pieces = useMemo(() => {
    const chess = gameState.chess;
    const board = chess.board();
    const piecePositions: { 
      square: string; 
      piece: PieceSymbol; 
      color: Color;
      isPlayable: boolean;
      isSelected: boolean;
      isPending: boolean;
    }[] = [];

    board.forEach((row, rankIndex) => {
      row.forEach((square, fileIndex) => {
        if (square) {
          const squareNotation = String.fromCharCode(97 + fileIndex) + (8 - rankIndex);
          
          // Determine if this piece is playable by the current player
          const isPlayable = gameState.gameType === 'practice' ||
            (square.color === gameState.currentTurn && isPlayerTurn);
          
          const isSelected = selectedSquare === squareNotation;
          
          // Check if this piece is part of a pending move
          const isPending = pendingMove && 
            (pendingMove.from === squareNotation || pendingMove.to === squareNotation);
          
          piecePositions.push({
            square: squareNotation,
            piece: square.type,
            color: square.color,
            isPlayable,
            isSelected,
            isPending: !!isPending
          });
        }
      });
    });

    return piecePositions;
  }, [gameState.chess, selectedSquare, isPlayerTurn, gameState.gameType, gameState.currentTurn, pendingMove]);

  return (
    <group>
      {pieces.map(({ square, piece, color, isPlayable, isSelected, isPending }) => (
        <React.Suspense key={square} fallback={null}>
          <FBXChessPiece
            piece={piece}
            color={color}
            position={squareTo3DPosition(square)}
            onClick={() => onPieceClick(square)}
            onPointerOver={(e) => isPlayable && onPieceHover(square, e)}
            onPointerOut={(e) => onPieceHover(null, e)}
            isPlayable={isPlayable}
            isSelected={isSelected}
            isPending={isPending}
            isHovered={hoveredSquare === square}
          />
        </React.Suspense>
      ))}
    </group>
  );
}; 