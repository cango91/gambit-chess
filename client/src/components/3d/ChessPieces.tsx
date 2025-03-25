import React, { useState, useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';
import { PieceDTO, PieceType, PlayerColor, Position } from '@gambit-chess/shared';
import { useRecoilValue } from 'recoil';
import { animationStateAtom } from '../../store/atoms';
import { useMove } from '../../hooks/useMove';

// Model paths for each piece type
const modelPaths: Record<PieceType, Record<PlayerColor, string>> = {
  [PieceType.PAWN]: {
    [PlayerColor.WHITE]: '/assets/models/pawn_w.fbx',
    [PlayerColor.BLACK]: '/assets/models/pawn_b.fbx'
  },
  [PieceType.KNIGHT]: {
    [PlayerColor.WHITE]: '/assets/models/knight_w.fbx',
    [PlayerColor.BLACK]: '/assets/models/knight_b.fbx'
  },
  [PieceType.BISHOP]: {
    [PlayerColor.WHITE]: '/assets/models/bishop_w.fbx',
    [PlayerColor.BLACK]: '/assets/models/bishop_b.fbx'
  },
  [PieceType.ROOK]: {
    [PlayerColor.WHITE]: '/assets/models/rook_w.fbx',
    [PlayerColor.BLACK]: '/assets/models/rook_b.fbx'
  },
  [PieceType.QUEEN]: {
    [PlayerColor.WHITE]: '/assets/models/queen_w.fbx',
    [PlayerColor.BLACK]: '/assets/models/queen_b.fbx'
  },
  [PieceType.KING]: {
    [PlayerColor.WHITE]: '/assets/models/king_w.fbx',
    [PlayerColor.BLACK]: '/assets/models/king_b.fbx'
  }
};

// Animation settings
const ANIMATION_DURATION = 0.5; // seconds
const HOVER_HEIGHT = 0.5; // Units above the board

interface ChessPiecesProps {
  pieces: PieceDTO[];
}

/**
 * Safely selects a piece position, only if it's a valid position
 */
const createSafePositionSelector = (
  selectPiece: (pos: Position | null) => void
) => {
  return (pos: Position | null) => {
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      // Create a new Position object to avoid type errors
      const safePosition: Position = { x: pos.x, y: pos.y };
      selectPiece(safePosition);
    } else {
      selectPiece(null);
    }
  };
};

/**
 * @component ChessPieces
 * @description Renders 3D chess pieces with animations
 * @dependencies Three.js, React Three Fiber, FBXLoader
 * @props {PieceDTO[]} pieces - Array of piece data to render
 */
const ChessPieces: React.FC<ChessPiecesProps> = ({ pieces }) => {
  // Load all piece models
  const models = useRef<Record<string, THREE.Group>>({});
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  // Animation state
  const animationState = useRecoilValue(animationStateAtom);
  const { selectPiece: originalSelectPiece } = useMove();
  
  // Create a safe version of selectPiece that handles type checking
  const selectPiece = createSafePositionSelector(originalSelectPiece);
  
  // Track animation progress
  const animationProgress = useRef(0);
  const isAnimating = useRef(false);

  // Board dimensions (should match ChessBoard)
  const BOARD_SIZE = 8;
  const SQUARE_SIZE = 1;
  const BOARD_WIDTH = BOARD_SIZE * SQUARE_SIZE;

  // Convert chess position to 3D position
  const getPosition = (pos: Position): [number, number, number] => {
    const x = pos.x * SQUARE_SIZE - BOARD_WIDTH / 2 + SQUARE_SIZE / 2;
    const y = 0.05; // Slight offset from board surface
    const z = (BOARD_SIZE - 1 - pos.y) * SQUARE_SIZE - BOARD_WIDTH / 2 + SQUARE_SIZE / 2;
    return [x, y, z];
  };

  // Load all models
  useEffect(() => {
    const loadModels = async () => {
      const loader = new FBXLoader();
      
      for (const pieceType of Object.values(PieceType)) {
        for (const color of Object.values(PlayerColor)) {
          if (pieceType === PieceType.PAWN || pieceType === PieceType.KNIGHT || 
              pieceType === PieceType.BISHOP || pieceType === PieceType.ROOK || 
              pieceType === PieceType.QUEEN || pieceType === PieceType.KING) {
            
            try {
              const path = modelPaths[pieceType][color];
              const model = await loader.loadAsync(path);
              
              // Scale model appropriately
              model.scale.set(0.01, 0.01, 0.01);
              
              // Store model reference
              const key = `${pieceType}_${color}`;
              models.current[key] = model.clone();
            } catch (error) {
              console.error(`Failed to load model: ${pieceType}_${color}`, error);
            }
          }
        }
      }
      
      setModelsLoaded(true);
    };
    
    loadModels();
  }, []);

  // Animation logic
  useFrame((_, delta) => {
    if (!isAnimating.current) return;
    
    animationProgress.current += delta / ANIMATION_DURATION;
    
    if (animationProgress.current >= 1) {
      animationProgress.current = 1;
      isAnimating.current = false;
    }
  });

  // Handle piece animation when animationState changes
  useEffect(() => {
    if (animationState.movingPiece.from && animationState.movingPiece.to) {
      animationProgress.current = 0;
      isAnimating.current = true;
    }
  }, [animationState]);

  // Don't render until models are loaded
  if (!modelsLoaded) {
    return null;
  }

  return (
    <>
      {pieces.map((piece) => {
        const key = `${piece.type}_${piece.color}`;
        const model = models.current[key];
        
        if (!model) {
          return null;
        }
        
        // Calculate position (animated if necessary)
        let position: [number, number, number];
        
        const isAnimatedPiece = animationState.movingPiece.from && 
          animationState.movingPiece.from.x === piece.position.x && 
          animationState.movingPiece.from.y === piece.position.y;
        
        if (isAnimatedPiece && animationState.movingPiece.to) {
          // Animated position
          const [fromX, fromY, fromZ] = getPosition(animationState.movingPiece.from!);
          const [toX, toY, toZ] = getPosition(animationState.movingPiece.to!);
          
          // Apply easing
          const t = animationProgress.current;
          const easedT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          
          // Interpolate position with arc
          const x = fromX + (toX - fromX) * easedT;
          const z = fromZ + (toZ - fromZ) * easedT;
          
          // Add arc for y (height)
          const arcHeight = HOVER_HEIGHT * Math.sin(Math.PI * easedT);
          const y = fromY + arcHeight;
          
          position = [x, y, z];
        } else {
          // Static position
          position = getPosition(piece.position);
        }
        
        // Handle piece click
        const handleClick = (event: React.MouseEvent) => {
          event.stopPropagation();
          selectPiece(piece.position);
        };

        // Clone and render the model
        return (
          <primitive
            key={`piece-${piece.position.x}-${piece.position.y}`}
            object={model.clone()}
            position={position}
            onClick={handleClick}
            userData={{ piece }}
          />
        );
      })}
    </>
  );
};

export default ChessPieces; 