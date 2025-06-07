import React, { useMemo, useState, useEffect } from 'react';
import { useFBX } from '@react-three/drei';
import { PieceSymbol, Color } from 'chess.js';
import * as THREE from 'three';

interface FBXChessPieceProps {
  piece: PieceSymbol;
  color: Color;
  position: [number, number, number];
  onClick?: () => void;
  onPointerOver?: (event?: any) => void;
  onPointerOut?: (event?: any) => void;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isPlayable?: boolean;
  isPending?: boolean;
  isHovered?: boolean;
}

// Convert piece symbol to FBX filename
const getPieceFileName = (piece: PieceSymbol, color: Color): string => {
  const pieceNames: Record<PieceSymbol, string> = {
    p: 'pawn',
    r: 'rook', 
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
  };
  
  const colorSuffix = color === 'w' ? 'w' : 'b';
  return `/assets/models/${pieceNames[piece]}_${colorSuffix}.fbx`;
};

// Utility function to clone geometry properly
const cloneGeometry = (geometry: THREE.BufferGeometry): THREE.BufferGeometry => {
  const cloned = geometry.clone();
  
  // Ensure proper disposal
  if (geometry.index) {
    cloned.setIndex(geometry.index.clone());
  }
  
  // Clone all attributes
  Object.keys(geometry.attributes).forEach(key => {
    cloned.setAttribute(key, geometry.attributes[key].clone());
  });
  
  return cloned;
};

export const FBXChessPiece: React.FC<FBXChessPieceProps> = ({
  piece,
  color,
  position,
  onClick,
  onPointerOver,
  onPointerOut,
  isSelected,
  isHighlighted,
  isPlayable,
  isPending,
  isHovered
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load FBX model
  const fbx = useFBX(getPieceFileName(piece, color));

  // Base model with material setup
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
          
          // Clean material setup
          if (isPending) {
            child.material.opacity = 0.7; // Make pending moves semi-transparent
            child.material.transparent = true;
          } else {
            child.material.opacity = 1.0; // Ensure full opacity for non-pending pieces
            child.material.transparent = false;
          }
          
          // Reset emissive for clean effects
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0;
          
          // Improve material properties
          child.material.metalness = 0.1;
          child.material.roughness = 0.7;
        }
      }
    });
    
    return clonedModel;
  }, [fbx, color, piece, isPending, isMobile]);

  // Create outline using back-face scaling technique
  const outlineGroup = useMemo(() => {
    const shouldShowOutline = isSelected || (isHovered && isPlayable && !isMobile);
    
    if (!shouldShowOutline) return null;

    const group = new THREE.Group();
    const outlineColor = isSelected ? 0x87CEEB : 0x4A90E2; // Light blue for selected, darker blue for hovered
    
    // Create outline model from original FBX with same transformations but scaled up
    const outlineModel = fbx.clone();
    
    // Reset transformations
    outlineModel.position.set(0, 0, 0);
    outlineModel.rotation.set(0, 0, 0);
    outlineModel.scale.set(1, 1, 1);
    
    // Calculate the same scaling as main model
    const box = new THREE.Box3().setFromObject(outlineModel);
    const size = box.getSize(new THREE.Vector3());
    const targetSize = 0.02;
    const maxDimension = Math.max(size.x, size.z);
    let scale = targetSize / maxDimension;
    
    if (piece === 'n') {
      scale *= 1.2; // Same knight scaling
    }
    
    // Apply slightly larger scale for outline effect (5% bigger)
    const outlineScale = scale * 1.05;
    outlineModel.scale.set(outlineScale, outlineScale, outlineScale);
    
    // Recalculate positioning after outline scaling
    box.setFromObject(outlineModel);
    const newCenter = box.getCenter(new THREE.Vector3());
    outlineModel.position.set(-newCenter.x, -box.min.y, -newCenter.z);
    
    // Apply outline materials
    outlineModel.traverse((child: any) => {
      if (child.isMesh) {
        child.material = new THREE.MeshBasicMaterial({
          color: outlineColor,
          side: THREE.BackSide,
          transparent: true,
          opacity: 0.8
        });
      }
    });
    
    group.add(outlineModel);
    return group;
  }, [fbx, piece, isSelected, isHovered, isPlayable, isMobile]);

  return (
    <group position={position}>
      {/* Outline group (renders behind main piece) */}
      {outlineGroup && <primitive object={outlineGroup} />}
      
      {/* Main piece */}
      <primitive
        object={model}
        onClick={(e: any) => { 
          e.stopPropagation(); 
          if (onClick) onClick(); 
        }}
        onPointerOver={(e: any) => { 
          e.stopPropagation(); 
          if (onPointerOver) onPointerOver(e); 
        }}
        onPointerOut={(e: any) => { 
          e.stopPropagation(); 
          if (onPointerOut) onPointerOut(e); 
        }}
      />
    </group>
  );
}; 