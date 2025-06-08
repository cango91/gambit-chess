import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useGameStore } from '../../stores/gameStore';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// Styled Components
const CostTooltip = styled.div<{ 
  $x: number; 
  $y: number; 
  $visible: boolean;
  $canAfford: boolean;
}>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: linear-gradient(135deg, 
    ${props => props.$canAfford ? '#2d5016' : '#581c0f'}, 
    ${props => props.$canAfford ? '#3d6b20' : '#7b2513'}
  );
  color: #f0d9b5;
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid ${props => props.$canAfford ? '#4ade80' : '#ef4444'};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  z-index: 1200;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translate(-50%, -120%);
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  min-width: 100px;
  text-align: center;
  animation: ${props => props.$visible ? fadeIn : 'none'} 0.2s ease-out;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${props => props.$canAfford ? '#4ade80' : '#ef4444'};
  }

  @media (max-width: 768px) {
    display: none; /* Hide on mobile - use bubbles instead */
  }
`;

const MobileCostBubble = styled.div<{ 
  $x: number; 
  $y: number; 
  $visible: boolean;
  $canAfford: boolean;
}>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: ${props => props.$canAfford 
    ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.95), rgba(34, 197, 94, 0.95))' 
    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))'
  };
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 50%;
  border: 3px solid ${props => props.$canAfford ? '#ffffff' : '#ffffff'};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  z-index: 1200;
  pointer-events: auto;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translate(-50%, -150%);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 60px;
  min-height: 60px;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  animation: ${props => props.$visible ? pulse : 'none'} 2s infinite;

  @media (max-width: 768px) {
    display: flex; /* Show on mobile */
  }

  /* Tap feedback */
  &:active {
    transform: translate(-50%, -150%) scale(0.95);
  }
`;

const CostValue = styled.div`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 2px;
`;

const CostLabel = styled.div`
  font-size: 11px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FreeBadge = styled.div`
  color: #ffd700;
  font-size: 12px;
  font-weight: 600;
`;

interface RetreatCostDisplayProps {
  hoveredSquare: string | null;
  mousePosition: { x: number; y: number };
  onMobileCostClick?: (square: string) => void;
}

interface RetreatOption {
  square: string;
  cost: number;
  canAfford: boolean;
}

export const RetreatCostDisplay: React.FC<RetreatCostDisplayProps> = ({
  hoveredSquare,
  mousePosition,
  onMobileCostClick
}) => {
  const { retreatOptions, isTacticalRetreatActive, isPlayerRetreatDecision } = useGameStore();
  const [visibleSquares, setVisibleSquares] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Handle mobile visibility - show all retreat costs when in retreat mode
  useEffect(() => {
    if (isTacticalRetreatActive && isPlayerRetreatDecision) {
      // Show all retreat options on mobile after a short delay
      const timer = setTimeout(() => {
        const allSquares = new Set(retreatOptions.map(opt => opt.square));
        setVisibleSquares(allSquares);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // Hide all when not in retreat mode
      setVisibleSquares(new Set());
      // Clear all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    }
  }, [isTacticalRetreatActive, isPlayerRetreatDecision, retreatOptions]);

  // Handle desktop hover visibility
  useEffect(() => {
    if (!isTacticalRetreatActive || !isPlayerRetreatDecision) return;

    if (hoveredSquare) {
      // Show immediately on hover
      setVisibleSquares(prev => new Set([...prev, hoveredSquare]));
      
      // Clear any pending hide timeout for this square
      const timeout = timeoutsRef.current.get(hoveredSquare);
      if (timeout) {
        clearTimeout(timeout);
        timeoutsRef.current.delete(hoveredSquare);
      }
    } else {
      // Hide after delay when hover ends (desktop only)
      visibleSquares.forEach(square => {
        if (!timeoutsRef.current.has(square)) {
          const timeout = setTimeout(() => {
            setVisibleSquares(prev => {
              const newSet = new Set(prev);
              newSet.delete(square);
              return newSet;
            });
            timeoutsRef.current.delete(square);
          }, 200);
          timeoutsRef.current.set(square, timeout);
        }
      });
    }
  }, [hoveredSquare, isTacticalRetreatActive, isPlayerRetreatDecision]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  if (!isTacticalRetreatActive || !isPlayerRetreatDecision || retreatOptions.length === 0) {
    return null;
  }

  // Get board element for positioning calculations
  const boardElement = document.querySelector('canvas')?.parentElement;
  const boardRect = boardElement?.getBoundingClientRect();

  // Function to convert square notation to screen coordinates
  const getSquareScreenPosition = (square: string): { x: number; y: number } => {
    if (!boardRect) return { x: 0, y: 0 };

    const file = square.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const rank = parseInt(square[1]) - 1;   // '1' = 0, '2' = 1, etc.

    // Calculate position within the board (assuming the board takes full container)
    const squareWidth = boardRect.width / 8;
    const squareHeight = boardRect.height / 8;

    // FIXED: Match the flipped X coordinate system - a(0) should be on left
    const x = boardRect.left + ((7 - file) + 0.5) * squareWidth;  // Flipped file mapping
    const y = boardRect.top + (7 - rank + 0.5) * squareHeight; // Flip Y for display coordinates

    return { x, y };
  };

  return (
    <>
      {retreatOptions.map((option: RetreatOption) => {
        const isVisible = visibleSquares.has(option.square);
        const isHovered = hoveredSquare === option.square;
        
        // Use mouse position for hovered square (desktop), calculated position for mobile
        const position = isHovered && mousePosition.x > 0 
          ? mousePosition 
          : getSquareScreenPosition(option.square);

        return (
          <React.Fragment key={option.square}>
            {/* Desktop Tooltip */}
            <CostTooltip
              $x={position.x}
              $y={position.y}
              $visible={isVisible && isHovered}
              $canAfford={option.canAfford}
            >
              {option.cost === 0 ? (
                <FreeBadge>FREE</FreeBadge>
              ) : (
                <>
                  <CostValue>{option.cost} BP</CostValue>
                  <CostLabel>Retreat Cost</CostLabel>
                </>
              )}
            </CostTooltip>

            {/* Mobile Bubble */}
            <MobileCostBubble
              $x={position.x}
              $y={position.y}
              $visible={isVisible}
              $canAfford={option.canAfford}
              onClick={() => onMobileCostClick?.(option.square)}
            >
              {option.cost === 0 ? 'FREE' : `${option.cost}`}
            </MobileCostBubble>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default RetreatCostDisplay; 