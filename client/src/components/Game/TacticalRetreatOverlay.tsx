import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGameStore } from '../../stores/gameStore';
import { getValidTacticalRetreats } from '@gambit-chess/shared';
import { ensureChessInstance } from '../../utils/chess-utils';
import { apiService } from '../../services/api.service';

const RetreatOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 500;
  pointer-events: none;
`;

const RetreatInstructions = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #8b4513, #654321);
  color: #f0d9b5;
  padding: 16px 24px;
  border-radius: 12px;
  border: 2px solid #b8860b;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  z-index: 1000;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  text-align: center;
  min-width: 400px;
`;

const InstructionTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #ffd700;
`;

const InstructionText = styled.p`
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.4;
  color: #f0d9b5;
`;

const RetreatStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(240, 217, 181, 0.2);
  font-size: 13px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatLabel = styled.span`
  color: #b8860b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.span`
  color: #ffd700;
  font-weight: 600;
  font-size: 14px;
`;

const RetreatTooltip = styled.div<{ $x: number; $y: number; $visible: boolean }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  background: linear-gradient(135deg, #2c1810, #3d2817);
  color: #f0d9b5;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid #b58863;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 1100;
  pointer-events: none;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translate(-50%, -100%);
  transition: opacity 0.2s ease;
  backdrop-filter: blur(4px);
  min-width: 120px;
  text-align: center;
`;

const TooltipSquare = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffd700;
  margin-bottom: 4px;
`;

const TooltipCost = styled.div<{ $canAfford: boolean }>`
  font-size: 14px;
  color: ${props => props.$canAfford ? '#4ade80' : '#ef4444'};
  font-weight: 500;
`;

const TooltipCostLabel = styled.div`
  font-size: 11px;
  color: #b58863;
  margin-bottom: 2px;
`;

interface TacticalRetreatOverlayProps {
  onRetreatSquareHover: (square: string | null, x?: number, y?: number) => void;
  onRetreatSquareClick: (square: string) => void;
}

interface RetreatOption {
  square: string;
  cost: number;
  canAfford: boolean;
}

export const TacticalRetreatOverlay: React.FC<TacticalRetreatOverlayProps> = ({
  onRetreatSquareHover,
  onRetreatSquareClick
}) => {
  const { currentGame, session, retreatOptions } = useGameStore();
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // No need to calculate retreat options here - they come from the game store
  // which already calculates them in updateGameState when tactical retreat is active

  const handleSquareHover = (square: string | null, x?: number, y?: number) => {
    setHoveredSquare(square);
    if (square && x !== undefined && y !== undefined) {
      setTooltipPosition({ x, y });
    }
    onRetreatSquareHover(square, x, y);
  };

  const handleSquareClick = (square: string) => {
    const option = retreatOptions.find(opt => opt.square === square);
    if (option && option.canAfford) {
      onRetreatSquareClick(square);
    }
  };

  if (!currentGame || !session) return null;

  const playerId = apiService.getCurrentPlayerId();
  if (!playerId) return null;

  const lastMove = currentGame.moveHistory[currentGame.moveHistory.length - 1];
  if (!lastMove || !lastMove.duelResult || lastMove.duelResult.attackerWon) return null;

  const isWhite = currentGame.whitePlayer.id === playerId;
  const player = isWhite ? currentGame.whitePlayer : currentGame.blackPlayer;
  const attacker = lastMove.color === 'w' ? currentGame.whitePlayer : currentGame.blackPlayer;
  
  // Only show for the attacking player who lost the duel
  if (player.id !== attacker.id) return null;

  const affordableOptions = retreatOptions.filter(opt => opt.canAfford);
  const hoveredOption = retreatOptions.find(opt => opt.square === hoveredSquare);

  return (
    <>
      <RetreatOverlay />
      
      <RetreatInstructions>
        <InstructionTitle>⚔️ Tactical Retreat Required</InstructionTitle>
        <InstructionText>
          Your {lastMove.piece?.toUpperCase()} failed to capture on <strong>{lastMove.to}</strong>.
          <br />
          Choose a retreat square or return to <strong>{lastMove.from}</strong>.
        </InstructionText>
        
        <RetreatStats>
          <StatItem>
            <StatLabel>Available BP</StatLabel>
            <StatValue>{player.battlePoints}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Retreat Options</StatLabel>
            <StatValue>{affordableOptions.length}/{retreatOptions.length}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Free Return</StatLabel>
            <StatValue>{lastMove.from.toUpperCase()}</StatValue>
          </StatItem>
        </RetreatStats>
      </RetreatInstructions>

      {hoveredOption && (
        <RetreatTooltip 
          $x={tooltipPosition.x} 
          $y={tooltipPosition.y} 
          $visible={!!hoveredSquare}
        >
          <TooltipSquare>{hoveredOption.square.toUpperCase()}</TooltipSquare>
          <TooltipCostLabel>
            {hoveredOption.cost === 0 ? 'Free Return' : 'Retreat Cost'}
          </TooltipCostLabel>
          <TooltipCost $canAfford={hoveredOption.canAfford}>
            {hoveredOption.cost === 0 ? 'No Cost' : `${hoveredOption.cost} BP`}
          </TooltipCost>
        </RetreatTooltip>
      )}
    </>
  );
};

// Export handler types for parent component integration
export interface TacticalRetreatHandlers {
  onSquareHover: (square: string | null, x?: number, y?: number) => void;
  onSquareClick: (square: string) => void;
  getRetreatOptions: () => RetreatOption[];
}

export type { RetreatOption }; 