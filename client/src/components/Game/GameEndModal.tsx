import React from 'react';
import styled from 'styled-components';
import * as shared from '@gambit-chess/shared';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #2d1810 0%, #1a1a1a 100%);
  border-radius: 16px;
  padding: 40px;
  min-width: 400px;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 2px solid #b58863;
`;

const GameResult = styled.h2`
  font-size: 28px;
  margin-bottom: 16px;
  color: #f0d9b5;
`;

const ResultEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
`;

const ResultMessage = styled.p`
  font-size: 18px;
  color: #b58863;
  margin-bottom: 32px;
  line-height: 1.5;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #b58863, #8b6f32);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(181, 136, 99, 0.3);
  }
`;

interface GameEndModalProps {
  gameStatus: shared.GameStatus;
  winner?: 'white' | 'black';
  onClose: () => void;
}

export const GameEndModal: React.FC<GameEndModalProps> = ({ 
  gameStatus, 
  winner, 
  onClose 
}) => {
  const getResultData = () => {
    switch (gameStatus) {
      case shared.GameStatus.CHECKMATE:
        return {
          emoji: winner === 'white' ? '👑' : '🏆',
          title: `${winner === 'white' ? 'White' : 'Black'} Wins!`,
          message: `Victory by checkmate! The ${winner} king has been conquered.`
        };
      case shared.GameStatus.STALEMATE:
        return {
          emoji: '🤝',
          title: 'Stalemate',
          message: 'The game ends in a draw. No legal moves available!'
        };
      case shared.GameStatus.DRAW:
        return {
          emoji: '⚖️',
          title: 'Draw',
          message: 'The game ends in a draw by agreement or repetition.'
        };
      case shared.GameStatus.ABANDONED:
        return {
          emoji: '🚪',
          title: 'Game Abandoned',
          message: 'The game has been abandoned by one of the players.'
        };
      default:
        return {
          emoji: '❓',
          title: 'Game Over',
          message: 'The game has ended.'
        };
    }
  };

  const { emoji, title, message } = getResultData();

  return (
    <ModalOverlay>
      <ModalContainer>
        <ResultEmoji>{emoji}</ResultEmoji>
        <GameResult>{title}</GameResult>
        <ResultMessage>{message}</ResultMessage>
        <ActionButton onClick={onClose}>
          Return to Lobby
        </ActionButton>
      </ModalContainer>
    </ModalOverlay>
  );
}; 