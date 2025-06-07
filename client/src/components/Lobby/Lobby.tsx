import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGameStore } from '../../stores/gameStore';

const LobbyContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%);
  color: #ffffff;
  padding: 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(45deg, #b58863, #f0d9b5);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  opacity: 0.8;
  margin-bottom: 20px;
`;

const Content = styled.div`
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  color: #f0d9b5;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;

const GameButton = styled.button`
  background: linear-gradient(135deg, #b58863 0%, #8b6f32 100%);
  color: white;
  border: none;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(181, 136, 99, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ComingSoonOverlay = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(45deg, #fbbf24, #f59e0b);
  color: #1a1a1a;
  font-size: 10px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  transform: rotate(15deg);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const ButtonIcon = styled.span`
  font-size: 20px;
`;

const ButtonText = styled.span`
  font-size: 14px;
`;

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GameInfo = styled.div`
  flex: 1;
`;

const GameTitle = styled.h3`
  font-size: 16px;
  margin-bottom: 4px;
  color: #f0d9b5;
`;

const GameDetails = styled.p`
  font-size: 14px;
  opacity: 0.7;
  margin: 0;
`;

const JoinButton = styled.button`
  background: #4ade80;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #22c55e;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
`;

interface LobbyProps {
  onShowTutorial?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onShowTutorial }) => {
  const navigate = useNavigate();
  const { createGame, isGameLoading } = useGameStore();

  const handleCreateGame = async (
    gameType: 'ai' | 'human' | 'practice',
    aiDifficulty?: 'easy' | 'medium' | 'hard'
  ) => {
    try {
      const gameId = await createGame({
        gameType,
        colorPreference: 'random',
        aiDifficulty
      });
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  return (
    <LobbyContainer>
      <Header>
        <Title>🎮 Gambit Chess</Title>
        <Subtitle>
          Tactical chess where captures are resolved through Battle Points duels
        </Subtitle>
        {onShowTutorial && (
          <GameButton
            onClick={onShowTutorial}
            style={{ 
              marginTop: '16px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: '#1a1a1a'
            }}
          >
            <ButtonIcon>📚</ButtonIcon>
            <ButtonText>Show Tutorial</ButtonText>
          </GameButton>
        )}
      </Header>

      <Content>
        <Section>
          <SectionTitle>🚀 Start New Game</SectionTitle>
          
          <ButtonGrid>
            <GameButton
              onClick={() => {}}
              disabled={true}
            >
              <ComingSoonOverlay>SOON</ComingSoonOverlay>
              <ButtonIcon>🤖</ButtonIcon>
              <ButtonText>vs Easy AI</ButtonText>
            </GameButton>
            
            <GameButton
              onClick={() => {}}
              disabled={true}
            >
              <ComingSoonOverlay>SOON</ComingSoonOverlay>
              <ButtonIcon>🧠</ButtonIcon>
              <ButtonText>vs Medium AI</ButtonText>
            </GameButton>
            
            <GameButton
              onClick={() => {}}
              disabled={true}
            >
              <ComingSoonOverlay>SOON</ComingSoonOverlay>
              <ButtonIcon>💀</ButtonIcon>
              <ButtonText>vs Hard AI</ButtonText>
            </GameButton>
            
            <GameButton
              onClick={() => {}}
              disabled={true}
            >
              <ComingSoonOverlay>SOON</ComingSoonOverlay>
              <ButtonIcon>👥</ButtonIcon>
              <ButtonText>vs Human</ButtonText>
            </GameButton>
          </ButtonGrid>
          
          <GameButton
            onClick={() => handleCreateGame('practice')}
            disabled={isGameLoading}
            style={{ width: '100%', background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', border: '2px solid #16a34a' }}
          >
            <ButtonIcon>🎯</ButtonIcon>
            <ButtonText>Practice Mode - Experience Gambit Chess!</ButtonText>
          </GameButton>
        </Section>

        {/* Hidden for now - will be enabled when multiplayer is ready */}
        {false && (
          <Section>
            <SectionTitle>⚡ Join Waiting Games</SectionTitle>
            
            <EmptyState>
              <p>🚧 Human vs Human Mode Coming Soon!</p>
              <p style={{ fontSize: '14px', opacity: '0.7' }}>For now, enjoy Practice Mode to learn Gambit Chess mechanics!</p>
            </EmptyState>
          </Section>
        )}
      </Content>
    </LobbyContainer>
  );
}; 