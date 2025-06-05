import React from 'react';
import styled from 'styled-components';
import { Player } from '@gambit-chess/shared';
import * as shared from '@gambit-chess/shared';

const PanelContainer = styled.div<{ $isCurrentPlayer: boolean }>`
  background: ${props => props.$isCurrentPlayer 
    ? 'rgba(74, 222, 128, 0.1)' 
    : 'rgba(0, 0, 0, 0.3)'};
  border-radius: 8px;
  border: 1px solid ${props => props.$isCurrentPlayer ? '#4ade80' : 'rgba(255, 255, 255, 0.1)'};
  padding: 12px;
  margin: 8px 0;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$isCurrentPlayer 
      ? 'rgba(74, 222, 128, 0.15)' 
      : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const PlayerName = styled.h3`
  margin: 0 0 8px 0;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
`;

const PracticeLabel = styled.div`
  color: #fbbf24;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const PlayerInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const BattlePoints = styled.div`
  color: #fbbf24;
  font-weight: 600;
  font-size: 0.9rem;
`;

const WinLoss = styled.div`
  color: #9ca3af;
  font-size: 0.85rem;
`;

const StatusArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusIndicator = styled.div<{ $isCurrentPlayer: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: ${props => props.$isCurrentPlayer ? '#4ade80' : '#6b7280'};
`;

const StatusDot = styled.div<{ $isCurrentPlayer: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$isCurrentPlayer ? '#4ade80' : '#6b7280'};
`;

interface PlayerPanelProps {
  player: Player;
  isCurrentPlayer: boolean;
  gameStatus: shared.GameStatus;
  gameType?: 'ai' | 'human' | 'practice';
}

export const PlayerPanel: React.FC<PlayerPanelProps> = ({
  player,
  isCurrentPlayer,
  gameStatus,
  gameType
}) => {
  const getStatusText = () => {
    if (gameStatus === shared.GameStatus.DUEL_IN_PROGRESS) {
      return 'In Duel';
    }
    return isCurrentPlayer ? 'Your Turn' : 'Waiting';
  };

  const getPlayerDisplayName = () => {
    if (gameType === 'practice') {
      return `You (${player.color === 'w' ? 'White' : 'Black'})`;
    }
    return player.id.startsWith('anon_') ? 'Anonymous Player' : player.id;
  };

  return (
    <PanelContainer $isCurrentPlayer={isCurrentPlayer}>
      {gameType === 'practice' && (
        <PracticeLabel>Practice Mode</PracticeLabel>
      )}
      <PlayerName>{getPlayerDisplayName()}</PlayerName>
      <PlayerInfo>
        <BattlePoints>BP: {player.battlePoints}</BattlePoints>
        <WinLoss>W: 0 | L: 0</WinLoss>
      </PlayerInfo>
      <StatusArea>
        <StatusIndicator $isCurrentPlayer={isCurrentPlayer}>
          <StatusDot $isCurrentPlayer={isCurrentPlayer} />
          {getStatusText()}
        </StatusIndicator>
      </StatusArea>
    </PanelContainer>
  );
}; 