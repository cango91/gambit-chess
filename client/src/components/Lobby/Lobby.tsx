import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGameStore } from '../../stores/gameStore';
import { apiService, GameListItem } from '../../services/api.service';

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
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
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

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const { createGame, isGameLoading } = useGameStore();
  const [waitingGames, setWaitingGames] = useState<GameListItem[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    loadWaitingGames();
    
    // Refresh waiting games every 10 seconds
    const interval = setInterval(loadWaitingGames, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadWaitingGames = async () => {
    setLoadingGames(true);
    try {
      const { games } = await apiService.getWaitingGames();
      setWaitingGames(games);
    } catch (error) {
      console.error('Failed to load waiting games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

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

  const handleJoinGame = async (gameId: string) => {
    try {
      await apiService.joinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  return (
    <LobbyContainer>
      <Header>
        <Title>🎮 Gambit Chess</Title>
        <Subtitle>
          Tactical chess where captures are resolved through Battle Points duels
        </Subtitle>
      </Header>

      <Content>
        <Section>
          <SectionTitle>🚀 Start New Game</SectionTitle>
          
          <ButtonGrid>
            <GameButton
              onClick={() => handleCreateGame('ai', 'easy')}
              disabled={isGameLoading}
            >
              <ButtonIcon>🤖</ButtonIcon>
              <ButtonText>vs Easy AI</ButtonText>
            </GameButton>
            
            <GameButton
              onClick={() => handleCreateGame('ai', 'medium')}
              disabled={isGameLoading}
            >
              <ButtonIcon>🧠</ButtonIcon>
              <ButtonText>vs Medium AI</ButtonText>
            </GameButton>
            
            <GameButton
              onClick={() => handleCreateGame('ai', 'hard')}
              disabled={isGameLoading}
            >
              <ButtonIcon>💀</ButtonIcon>
              <ButtonText>vs Hard AI</ButtonText>
            </GameButton>
            
            <GameButton
              onClick={() => handleCreateGame('human')}
              disabled={isGameLoading}
            >
              <ButtonIcon>👥</ButtonIcon>
              <ButtonText>vs Human</ButtonText>
            </GameButton>
          </ButtonGrid>
          
          <GameButton
            onClick={() => handleCreateGame('practice')}
            disabled={isGameLoading}
            style={{ width: '100%' }}
          >
            <ButtonIcon>🎯</ButtonIcon>
            <ButtonText>Practice Mode</ButtonText>
          </GameButton>
        </Section>

        <Section>
          <SectionTitle>⚡ Join Waiting Games</SectionTitle>
          
          {loadingGames ? (
            <EmptyState>Loading games...</EmptyState>
          ) : waitingGames.length === 0 ? (
            <EmptyState>
              <p>No games waiting for players</p>
              <p style={{ fontSize: '14px' }}>Create a new game to get started!</p>
            </EmptyState>
          ) : (
            waitingGames.map((game) => (
              <GameCard key={game.id}>
                <GameInfo>
                  <GameTitle>
                    Game vs {game.whitePlayer.id}
                  </GameTitle>
                  <GameDetails>
                    Created {new Date(game.createdAt).toLocaleTimeString()}
                  </GameDetails>
                </GameInfo>
                <JoinButton onClick={() => handleJoinGame(game.id)}>
                  Join as Black
                </JoinButton>
              </GameCard>
            ))
          )}
        </Section>
      </Content>
    </LobbyContainer>
  );
}; 