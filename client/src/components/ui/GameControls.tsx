import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { GameEvents, GameState } from '@gambit-chess/shared';
import { gameStateAtom } from '../../store/atoms';
import { useWebSocket } from '../../hooks/useWebSocket';

/**
 * @component GameControls
 * @description Game control buttons for actions like resign, draw, etc.
 * @dependencies Recoil, React Router, WebSocket hook
 */
const GameControls: React.FC = () => {
  const gameState = useRecoilValue(gameStateAtom);
  const navigate = useNavigate();
  const { send } = useWebSocket();

  if (!gameState) {
    return null;
  }

  // Check if game is over
  const isGameOver = gameState.gameState !== GameState.ACTIVE;

  // Handle return to menu
  const handleReturnToMenu = () => {
    navigate('/');
  };

  // TODO: Implement resign functionality
  const handleResign = () => {
    // This would send a resignation event to the server
    console.log('Resign not implemented yet');
  };

  // TODO: Implement draw offer functionality
  const handleOfferDraw = () => {
    // This would send a draw offer event to the server
    console.log('Draw offer not implemented yet');
  };

  // TODO: Implement fullscreen functionality
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // TODO: Implement sound toggle functionality
  const handleToggleSound = () => {
    console.log('Sound toggle not implemented yet');
  };

  return (
    <div className="game-controls">
      {/* Game action buttons */}
      <div className="game-action-buttons">
        {!isGameOver && (
          <>
            <button 
              className="resign-button" 
              onClick={handleResign}
              title="Resign the game"
            >
              Resign
            </button>
            <button 
              className="draw-button" 
              onClick={handleOfferDraw}
              title="Offer a draw"
            >
              Offer Draw
            </button>
          </>
        )}
        <button 
          className="menu-button" 
          onClick={handleReturnToMenu}
          title="Return to main menu"
        >
          {isGameOver ? 'Return to Menu' : 'Exit Game'}
        </button>
      </div>

      {/* UI control buttons */}
      <div className="ui-control-buttons">
        <button 
          className="fullscreen-button" 
          onClick={handleToggleFullscreen}
          title="Toggle fullscreen"
        >
          Fullscreen
        </button>
        <button 
          className="sound-button" 
          onClick={handleToggleSound}
          title="Toggle sound"
        >
          Sound
        </button>
      </div>

      {/* Game ID display for sharing */}
      <div className="game-id">
        <p>Game ID: {gameState.gameId}</p>
        <button 
          className="copy-button"
          onClick={() => {
            navigator.clipboard.writeText(gameState.gameId);
          }}
          title="Copy game ID to clipboard"
        >
          Copy
        </button>
      </div>
    </div>
  );
};

export default GameControls; 