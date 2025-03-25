import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameEvents } from '@gambit-chess/shared';
import { useWebSocket } from '../../hooks/useWebSocket';

/**
 * @component MainMenu
 * @description Main menu screen for creating or joining games
 * @dependencies React Router, WebSocket hook
 */
const MainMenu: React.FC = () => {
  const [gameIdInput, setGameIdInput] = useState<string>('');
  const [isCreatingGame, setIsCreatingGame] = useState<boolean>(false);
  const [isJoiningGame, setIsJoiningGame] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { send, subscribe, unsubscribe } = useWebSocket();

  // Set up WebSocket event listeners when component mounts
  React.useEffect(() => {
    const gameCreatedHandler = (data: any) => {
      if (data.gameId) {
        navigate(`/game/${data.gameId}`);
      }
    };

    const gameJoinedHandler = (data: any) => {
      if (data.success && data.gameId) {
        navigate(`/game/${data.gameId}`);
      } else if (data.error) {
        setError(data.error);
        setIsJoiningGame(false);
      }
    };

    const errorHandler = (data: any) => {
      setError(data.message || 'An error occurred');
      setIsCreatingGame(false);
      setIsJoiningGame(false);
    };

    // Subscribe to WebSocket events
    subscribe(GameEvents.GAME_CREATED, gameCreatedHandler);
    subscribe(GameEvents.GAME_JOINED, gameJoinedHandler);
    subscribe(GameEvents.ERROR, errorHandler);

    // Cleanup subscriptions when component unmounts
    return () => {
      unsubscribe(GameEvents.GAME_CREATED, gameCreatedHandler);
      unsubscribe(GameEvents.GAME_JOINED, gameJoinedHandler);
      unsubscribe(GameEvents.ERROR, errorHandler);
    };
  }, [navigate, subscribe, unsubscribe]);

  // Create a new game
  const handleCreateGame = (againstAI: boolean = false) => {
    setIsCreatingGame(true);
    setError(null);
    
    send(GameEvents.CREATE_GAME, {
      againstAI,
      aiDifficulty: againstAI ? 'intermediate' : undefined
    });
  };

  // Join an existing game by ID
  const handleJoinGame = () => {
    if (!gameIdInput.trim()) {
      setError('Please enter a game ID');
      return;
    }

    setIsJoiningGame(true);
    setError(null);
    
    send(GameEvents.JOIN_GAME, {
      gameId: gameIdInput.trim()
    });
  };

  return (
    <div className="main-menu">
      <h1>Gambit Chess</h1>
      <div className="menu-options">
        <div className="create-game-section">
          <h2>Create Game</h2>
          <button 
            onClick={() => handleCreateGame(false)} 
            disabled={isCreatingGame || isJoiningGame}
          >
            Create Online Game
          </button>
          <button 
            onClick={() => handleCreateGame(true)} 
            disabled={isCreatingGame || isJoiningGame}
          >
            Play vs AI
          </button>
        </div>

        <div className="join-game-section">
          <h2>Join Game</h2>
          <div className="join-input">
            <input
              type="text"
              value={gameIdInput}
              onChange={(e) => setGameIdInput(e.target.value)}
              placeholder="Enter Game ID"
              disabled={isCreatingGame || isJoiningGame}
            />
            <button 
              onClick={handleJoinGame} 
              disabled={isCreatingGame || isJoiningGame || !gameIdInput.trim()}
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {(isCreatingGame || isJoiningGame) && (
        <div className="loading-indicator">
          <div className="loading-spinner small"></div>
          <span>{isCreatingGame ? 'Creating game...' : 'Joining game...'}</span>
        </div>
      )}
    </div>
  );
};

export default MainMenu; 