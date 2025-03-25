import React from 'react';
import { useRecoilValue } from 'recoil';
import { PlayerColor, PlayerRole, GameState, GamePhase } from '@gambit-chess/shared';
import { gameStateAtom } from '../../store/atoms';

/**
 * @component GameInfo
 * @description Displays game information including players, battle points, and turn indicator
 * @dependencies Recoil
 */
const GameInfo: React.FC = () => {
  const gameState = useRecoilValue(gameStateAtom);

  if (!gameState) {
    return null;
  }

  // Helper function to convert PlayerRole to display name
  const getPlayerName = (role: PlayerRole): string => {
    switch (role) {
      case PlayerRole.PLAYER_WHITE:
        return 'White';
      case PlayerRole.PLAYER_BLACK:
        return 'Black';
      case PlayerRole.SPECTATOR:
        return 'Spectator';
      default:
        return 'Unknown';
    }
  };

  // Helper function to get current player's color
  const getPlayerColor = (role: PlayerRole): PlayerColor | null => {
    switch (role) {
      case PlayerRole.PLAYER_WHITE:
        return PlayerColor.WHITE;
      case PlayerRole.PLAYER_BLACK:
        return PlayerColor.BLACK;
      default:
        return null;
    }
  };

  // Game status message
  const getGameStatus = (): string => {
    switch (gameState.gameState) {
      case GameState.CHECK:
        return 'Check!';
      case GameState.CHECKMATE:
        return 'Checkmate!';
      case GameState.STALEMATE:
        return 'Stalemate!';
      case GameState.DRAW:
        return 'Draw!';
      default:
        return gameState.gamePhase === GamePhase.DUEL_ALLOCATION 
          ? 'Battle Points Allocation' 
          : gameState.gamePhase === GamePhase.TACTICAL_RETREAT
            ? 'Tactical Retreat'
            : `${gameState.currentTurn === PlayerColor.WHITE ? 'White' : 'Black'}'s Turn`;
    }
  };

  // Count captured pieces by type
  const getCapturedPiecesCount = (color: PlayerColor) => {
    return gameState.capturedPieces
      .filter(piece => piece.color === color)
      .reduce((acc, piece) => {
        acc[piece.type] = (acc[piece.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  };

  const whiteCaptured = getCapturedPiecesCount(PlayerColor.WHITE);
  const blackCaptured = getCapturedPiecesCount(PlayerColor.BLACK);

  // Is it player's turn?
  const isPlayerTurn = getPlayerColor(gameState.playerRole) === gameState.currentTurn;

  return (
    <div className="game-info">
      <div className="game-status">
        <h2>{getGameStatus()}</h2>
        {gameState.isInCheck && gameState.gameState === GameState.ACTIVE && (
          <div className="check-indicator">Check!</div>
        )}
      </div>

      <div className="player-info">
        <div className={`player ${gameState.currentTurn === PlayerColor.WHITE ? 'active' : ''}`}>
          <h3>White</h3>
          {gameState.playerRole === PlayerRole.PLAYER_WHITE && <span className="you-indicator">(You)</span>}
          <div className="battle-points">
            {gameState.playerRole === PlayerRole.PLAYER_WHITE ? (
              <span>BP: {gameState.playerBP}</span>
            ) : (
              <span>BP: ???</span>
            )}
          </div>
          <div className="captured-pieces">
            {Object.entries(blackCaptured).map(([type, count]) => (
              <div key={`black-captured-${type}`} className="captured-piece">
                {type} x{count}
              </div>
            ))}
          </div>
        </div>

        <div className={`player ${gameState.currentTurn === PlayerColor.BLACK ? 'active' : ''}`}>
          <h3>Black</h3>
          {gameState.playerRole === PlayerRole.PLAYER_BLACK && <span className="you-indicator">(You)</span>}
          <div className="battle-points">
            {gameState.playerRole === PlayerRole.PLAYER_BLACK ? (
              <span>BP: {gameState.playerBP}</span>
            ) : (
              <span>BP: ???</span>
            )}
          </div>
          <div className="captured-pieces">
            {Object.entries(whiteCaptured).map(([type, count]) => (
              <div key={`white-captured-${type}`} className="captured-piece">
                {type} x{count}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="game-id-display">
        <span>Game ID: {gameState.gameId}</span>
      </div>

      {/* Show turn indicator for player */}
      {isPlayerTurn && gameState.gameState === GameState.ACTIVE && (
        <div className="turn-indicator">
          Your turn!
        </div>
      )}
    </div>
  );
};

export default GameInfo; 