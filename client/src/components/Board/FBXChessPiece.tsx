import React, { useMemo } from 'react';
import { useFBX } from '@react-three/drei';
import { PieceSymbol, Color } from 'chess.js';
import * as THREE from 'three';

interface FBXChessPieceProps {
  piece: PieceSymbol;
  color: Color;
  position: [number, number, number];
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isPlayable?: boolean;
  isPending?: boolean;
}

const PIECE_MODEL_MAP: Record<PieceSymbol, Record<Color, string>> = {
  'p': {
    'w': '/assets/models/pawn_w.fbx',
    'b': '/assets/models/pawn_b.fbx',
  },
  'r': {
    'w': '/assets/models/rook_w.fbx',
    'b': '/assets/models/rook_b.fbx',
  },
  'n': {
    'w': '/assets/models/knight_w.fbx',
    'b': '/assets/models/knight_b.fbx',
  },
  'b': {
    'w': '/assets/models/bishop_w.fbx',
    'b': '/assets/models/bishop_b.fbx',
  },
  'q': {
    'w': '/assets/models/queen_w.fbx',
    'b': '/assets/models/queen_b.fbx',
  },
  'k': {
    'w': '/assets/models/king_w.fbx',
    'b': '/assets/models/king_b.fbx',
  },
};

export const FBXChessPiece: React.FC<FBXChessPieceProps> = ({
  piece,
  color,
  position,
  onClick,
  onPointerOver,
  onPointerOut,
  isSelected = false,
  isHighlighted = false,
  isPlayable = false,
  isPending = false,
}) => {
  // Get the model path for this piece
  const modelPath = PIECE_MODEL_MAP[piece][color];
  
  // Load the FBX model
  const fbx = useFBX(modelPath);
  
  // Clone and configure the model
  const model = useMemo(() => {
    const clonedModel = fbx.clone();
    
    // First, reset all transformations
    clonedModel.position.set(0, 0, 0);
    clonedModel.rotation.set(0, 0, 0);
    clonedModel.scale.set(1, 1, 1);
    
    // Calculate the bounding box to understand model size
    const box = new THREE.Box3().setFromObject(clonedModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Scale based on the largest dimension to fit in our square size (0.04m = 4cm)
    // We want pieces to be about 0.02m (2cm) in diameter, so scale accordingly
    const targetSize = 0.02;
    const maxDimension = Math.max(size.x, size.z); // Use X and Z for diameter
    let scale = targetSize / maxDimension;
    
    // Special scaling for knights to make them less stubby
    if (piece === 'n') {
      scale *= 1.2; // Make knights 20% larger
    }
    
    clonedModel.scale.set(scale, scale, scale);
    
    // Recalculate after scaling
    box.setFromObject(clonedModel);
    const newCenter = box.getCenter(new THREE.Vector3());
    
    // Center the piece on X and Z axes, keep on board surface for Y
    clonedModel.position.set(-newCenter.x, -box.min.y, -newCenter.z);
    
    // Configure materials
    clonedModel.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Apply color-based material modifications
        if (child.material) {
          // Clone material to avoid affecting other instances
          child.material = child.material.clone();
          
          if (color === 'w') {
            child.material.color.setHex(0xf5f5dc); // Beige/cream for white pieces
          } else {
            child.material.color.setHex(0x2c1810); // Dark brown for black pieces
          }
          
          // Add selection/highlight effects
          if (isSelected) {
            child.material.emissive.setHex(0x006600); // Bright green glow for selected
            child.material.emissiveIntensity = 0.3;
          } else if (isHighlighted) {
            child.material.emissive.setHex(0x444400); // Yellow glow for highlighted
            child.material.emissiveIntensity = 0.2;
          } else if (isPending) {
            child.material.emissive.setHex(0x002244); // Blue tint for pending moves
            child.material.emissiveIntensity = 0.15;
            child.material.opacity = 0.7; // Make pending moves semi-transparent
            child.material.transparent = true;
          } else if (isPlayable) {
            child.material.emissive.setHex(0x001100); // Subtle green tint for playable pieces
            child.material.emissiveIntensity = 0.1;
          } else {
            child.material.emissive.setHex(0x000000); // No glow
            child.material.emissiveIntensity = 0;
            child.material.opacity = 1.0; // Ensure full opacity for non-pending pieces
            child.material.transparent = false;
          }
          
          // Improve material properties
          child.material.metalness = 0.1;
          child.material.roughness = 0.7;
        }
      }
    });
    
    return clonedModel;
  }, [fbx, color, isSelected, isHighlighted, isPlayable, isPending]);

  return (
    <group position={position}>
      <primitive
        object={model}
        onClick={(e: any) => { 
          e.stopPropagation(); 
          if (onClick) onClick(); 
        }}
        onPointerOver={(e: any) => { 
          e.stopPropagation(); 
          if (onPointerOver) onPointerOver(); 
        }}
        onPointerOut={(e: any) => { 
          e.stopPropagation(); 
          if (onPointerOut) onPointerOut(); 
        }}
      />
    </group>
  );
}; 