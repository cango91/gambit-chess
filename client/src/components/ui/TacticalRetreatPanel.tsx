import React, { useState, useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { GameEvents, Position, RetreatOption } from '@gambit-chess/shared';
import { gameStateAtom, tacticalRetreatStateAtom } from '../../store/atoms';
import { useWebSocket } from '../../hooks/useWebSocket';

/**
 * @component TacticalRetreatPanel
 * @description Panel for selecting a tactical retreat option after a failed capture
 * @dependencies Recoil, WebSocket hook
 */
const TacticalRetreatPanel: React.FC = () => {
  const gameState = useRecoilValue(gameStateAtom);
  const [retreatState, setRetreatState] = useRecoilState(tacticalRetreatStateAtom);
  const { send } = useWebSocket();
  
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  // Initialize from game state
  useEffect(() => {
    if (gameState && gameState.availableRetreats && gameState.availableRetreats.length > 0) {
      setRetreatState({
        piecePosition: gameState.failedCapturePosition || null,
        originalPosition: gameState.originalPosition || null,
        availableRetreats: gameState.availableRetreats,
        selectedRetreat: null
      });
    }
  }, [gameState, setRetreatState]);
  
  // Handle retreat position selection
  const handleSelectPosition = (position: Position) => {
    setSelectedPosition(position);
    setRetreatState({
      ...retreatState,
      selectedRetreat: position
    });
  };
  
  // Handle retreat submission
  const handleSubmitRetreat = () => {
    if (!gameState || !selectedPosition) return;
    
    send(GameEvents.TACTICAL_RETREAT, {
      gameId: gameState.gameId,
      to: selectedPosition
    });
  };
  
  // Handle staying in place
  const handleStayInPlace = () => {
    if (!gameState || !retreatState.piecePosition) return;
    
    send(GameEvents.TACTICAL_RETREAT, {
      gameId: gameState.gameId,
      to: retreatState.piecePosition
    });
  };
  
  // Render a chess board position in text format
  const formatPosition = (pos: Position): string => {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    return `${files[pos.x]}${pos.y + 1}`;
  };
  
  if (!gameState || !retreatState.piecePosition || retreatState.availableRetreats.length === 0) {
    return null;
  }
  
  return (
    <div className="tactical-retreat-panel">
      <h2>Tactical Retreat</h2>
      
      <div className="retreat-information">
        <p>
          Your capture attempt has failed. You can retreat your piece to one of the available positions.
        </p>
        
        {retreatState.originalPosition && (
          <div className="original-position">
            Original Position: {formatPosition(retreatState.originalPosition)}
          </div>
        )}
      </div>
      
      <div className="retreat-options">
        <h3>Select Retreat Position:</h3>
        
        <div className="retreat-positions-list">
          {retreatState.availableRetreats.map((option, index) => (
            <button
              key={`retreat-${index}`}
              className={`retreat-position ${selectedPosition && selectedPosition.x === option.position.x && selectedPosition.y === option.position.y ? 'selected' : ''}`}
              onClick={() => handleSelectPosition(option.position)}
            >
              {formatPosition(option.position)}
            </button>
          ))}
          
          {/* Option to stay in current position */}
          <button
            className={`retreat-position stay-option ${selectedPosition && selectedPosition.x === retreatState.piecePosition.x && selectedPosition.y === retreatState.piecePosition.y ? 'selected' : ''}`}
            onClick={handleStayInPlace}
          >
            Stay at {formatPosition(retreatState.piecePosition)}
          </button>
        </div>
        
        <button
          className="submit-retreat-button"
          onClick={handleSubmitRetreat}
          disabled={!selectedPosition}
        >
          Confirm Retreat
        </button>
      </div>
    </div>
  );
};

export default TacticalRetreatPanel; 