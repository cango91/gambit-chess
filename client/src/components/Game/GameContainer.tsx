import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useGameStore } from '../../stores/gameStore';
import { LoadingScreen } from '../UI/LoadingScreen';
import { ChessBoard3D } from '../Board/ChessBoard3D';
import { PlayerPanel } from './PlayerPanel';
import { DuelInterface } from './DuelInterface';
import { TacticalRetreatOverlay } from './TacticalRetreatOverlay';
import { GameEndModal } from './GameEndModal';
import { MoveHistory } from './MoveHistory';
import { BPCalculationDisplay } from '../debug/BPCalculationDisplay';
import * as shared from '@gambit-chess/shared';
const GameWrapper = styled.div`
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1810 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const GameHeader = styled.div`
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GameTitle = styled.h1`
  color: #f0d9b5;
  font-size: 20px;
  margin: 0;
`;

const BackButton = styled.button`
  background: rgba(181, 136, 99, 0.2);
  color: #f0d9b5;
  border: 1px solid rgba(181, 136, 99, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: rgba(181, 136, 99, 0.3);
  }
`;

const GameMain = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  grid-template-rows: auto 1fr;
  gap: 20px;
  padding: 20px;
  overflow: hidden;
  min-height: 0; // Allow flexbox shrinking

  @media (max-width: 1400px) {
    grid-template-columns: 250px 1fr 250px;
    gap: 15px;
    padding: 15px;
  }

  @media (max-width: 1100px) {
    grid-template-columns: 220px 1fr 220px;
    gap: 12px;
    padding: 12px;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    gap: 10px;
    padding: 10px;
  }

  @media (max-width: 600px) {
    padding: 8px;
    gap: 8px;
  }
`;

const LeftPanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
  min-height: 0; // Allow flexbox shrinking

  @media (max-width: 900px) {
    order: 1;
    padding: 12px;
    grid-row: 1;
  }

  @media (max-width: 600px) {
    padding: 10px;
  }
`;

const BoardContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  min-height: 400px;
  aspect-ratio: 1; // Keep square aspect ratio for the board area

  @media (max-width: 900px) {
    order: 3;
    grid-row: 3;
    min-height: 300px;
  }

  @media (max-width: 600px) {
    min-height: 280px;
    border-radius: 8px;
  }
`;

const RightPanel = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0; // Allow flexbox shrinking

  @media (max-width: 900px) {
    order: 4;
    padding: 12px;
    grid-row: 4;
    gap: 12px;
  }

  @media (max-width: 600px) {
    padding: 10px;
    gap: 10px;
  }
`;

const PlayerPanelsRow = styled.div`
  display: none;

  @media (max-width: 900px) {
    display: flex;
    gap: 10px;
    order: 2;
    grid-row: 2;
    
    > div {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 12px;
    }
  }

  @media (max-width: 600px) {
    gap: 8px;
    
    > div {
      padding: 10px;
      border-radius: 6px;
    }
  }
`;

const TurnIndicator = styled.div<{ $isPlayerTurn: boolean }>`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${(props) => props.$isPlayerTurn ? 
    'linear-gradient(135deg, #4ade80, #22c55e)' : 
    'linear-gradient(135deg, #fbbf24, #f59e0b)'
  };
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

export const GameContainer: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [showBPCalculations, setShowBPCalculations] = React.useState(false);
  const {
    currentGame, 
    isGameLoading, 
    gameError,
    isPlayerTurn,
    isDuelActive,
    playerDuelRole,
    isTacticalRetreatActive,
    isPlayerRetreatDecision,
    submitTacticalRetreat
  } = useGameStore();

  useEffect(() => {
    if (gameId) {
      // Only try to join if we don't already have this game loaded
      if (!currentGame || currentGame.id !== gameId) {
        console.log(`🎮 GameContainer: Need to join game ${gameId} (current: ${currentGame?.id || 'none'})`);
        useGameStore.getState().joinGame(gameId).catch((error) => {
          console.error('Failed to join game:', error);
          navigate('/');
        });
      } else {
        console.log(`🎮 GameContainer: Game ${gameId} already loaded, skipping join`);
      }
    }
  }, [gameId, navigate]);

  // Handle navigation away from page
  const handleBack = () => {
    useGameStore.getState().leaveGame();
    navigate('/');
  };

  // Handle tactical retreat square hover for highlighting
  const handleRetreatSquareHover = useCallback((square: string | null, x?: number, y?: number) => {
    // Board highlighting is now handled automatically by the game store
    // This callback can be used for other UI effects like tooltips
    console.log('🏃 Retreat square hover:', square, 'at', x, y);
  }, []);

  // Handle tactical retreat square selection
  const handleRetreatSquareClick = useCallback((square: string) => {
    console.log('🏃 Retreat square selected:', square);
    submitTacticalRetreat(square);
  }, [submitTacticalRetreat]);

  // Show loading screen while game is loading
  if (isGameLoading || !currentGame) {
    return <LoadingScreen message="Loading game..." />;
  }

  // Show error if game failed to load
  if (gameError) {
    return (
      <LoadingScreen 
        message="Failed to load game" 
        subMessage={gameError} 
      />
    );
  }

  const isGameOver = [
    shared.GameStatus.CHECKMATE,
    shared.GameStatus.STALEMATE,
    shared.GameStatus.DRAW,
    shared.GameStatus.ABANDONED
  ].includes(currentGame.gameStatus);

  return (
    <GameWrapper>
      <GameHeader>
        <GameTitle>Gambit Chess</GameTitle>
        <BackButton onClick={handleBack}>
          ← Back to Lobby
        </BackButton>
      </GameHeader>

      <GameMain>
        <LeftPanel>
          <PlayerPanel 
            player={currentGame.whitePlayer}
            isCurrentPlayer={
              isTacticalRetreatActive && isPlayerRetreatDecision
                ? currentGame.moveHistory[currentGame.moveHistory.length - 1]?.color === 'w'
                : currentGame.currentTurn === 'w'
            }
            gameStatus={currentGame.gameStatus}
            gameType={currentGame.gameType}
          />
        </LeftPanel>

        <PlayerPanelsRow>
          <PlayerPanel 
            player={currentGame.whitePlayer}
            isCurrentPlayer={
              isTacticalRetreatActive && isPlayerRetreatDecision
                ? currentGame.moveHistory[currentGame.moveHistory.length - 1]?.color === 'w'
                : currentGame.currentTurn === 'w'
            }
            gameStatus={currentGame.gameStatus}
            gameType={currentGame.gameType}
          />
          <PlayerPanel 
            player={currentGame.blackPlayer}
            isCurrentPlayer={
              isTacticalRetreatActive && isPlayerRetreatDecision
                ? currentGame.moveHistory[currentGame.moveHistory.length - 1]?.color === 'b'
                : currentGame.currentTurn === 'b'
            }
            gameStatus={currentGame.gameStatus}
            gameType={currentGame.gameType}
          />
        </PlayerPanelsRow>

        <BoardContainer>
          <TurnIndicator $isPlayerTurn={isPlayerTurn}>
            {currentGame.gameStatus === shared.GameStatus.WAITING_FOR_PLAYERS 
              ? "Waiting for opponent..."
              : currentGame.gameStatus === shared.GameStatus.TACTICAL_RETREAT_DECISION && isPlayerRetreatDecision
                ? "Choose Tactical Retreat"
                : currentGame.gameStatus === shared.GameStatus.TACTICAL_RETREAT_DECISION && !isPlayerRetreatDecision
                ? "Opponent Choosing Retreat"
                : isPlayerTurn 
                ? "Your Turn" 
                : "Opponent's Turn"
            }
          </TurnIndicator>
          
          <ChessBoard3D 
            gameState={currentGame}
          />
        </BoardContainer>

        <RightPanel>
          <PlayerPanel 
            player={currentGame.blackPlayer}
            isCurrentPlayer={
              isTacticalRetreatActive && isPlayerRetreatDecision
                ? currentGame.moveHistory[currentGame.moveHistory.length - 1]?.color === 'b'
                : currentGame.currentTurn === 'b'
            }
            gameStatus={currentGame.gameStatus}
            gameType={currentGame.gameType}
          />
          
          <MoveHistory moves={currentGame.moveHistory} />
          
          {/* BP Calculation Debug Display */}
          <BPCalculationDisplay 
            isVisible={showBPCalculations}
            onToggle={() => setShowBPCalculations(!showBPCalculations)}
          />
        </RightPanel>
      </GameMain>

      {/* Duel Interface Modal */}
      {isDuelActive && playerDuelRole && (
        <DuelInterface 
          role={playerDuelRole}
          pendingDuel={currentGame.pendingDuel!}
        />
      )}

      {/* Tactical Retreat Overlay */}
      {isTacticalRetreatActive && isPlayerRetreatDecision && (
        <TacticalRetreatOverlay
          onRetreatSquareHover={handleRetreatSquareHover}
          onRetreatSquareClick={handleRetreatSquareClick}
        />
      )}

      {/* Game End Modal */}
      {isGameOver && (
        <GameEndModal 
          gameStatus={currentGame.gameStatus}
          winner={currentGame.currentTurn === 'w' ? 'black' : 'white'}
          onClose={handleBack}
        />
      )}
    </GameWrapper>
  );
}; 