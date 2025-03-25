import React, { useState, useEffect } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { 
  GameEvents, 
  PieceType, 
  DuelRules 
} from '@gambit-chess/shared';
import { gameStateAtom, duelStateAtom } from '../../store/atoms';
import { useWebSocket } from '../../hooks/useWebSocket';

/**
 * @component BPAllocationPanel
 * @description Panel for allocating Battle Points during a duel
 * @dependencies Recoil, WebSocket hook
 */
const BPAllocationPanel: React.FC = () => {
  const gameState = useRecoilValue(gameStateAtom);
  const [duelState, setDuelState] = useRecoilState(duelStateAtom);
  const { send } = useWebSocket();
  
  const [allocatedBP, setAllocatedBP] = useState(0);
  const [cost, setCost] = useState(0);
  const [maxAllocation, setMaxAllocation] = useState(10);
  const [defendingPieceType, setDefendingPieceType] = useState<PieceType | null>(null);
  
  // Initialize based on current duel state
  useEffect(() => {
    if (!gameState || !duelState.defenderPosition) return;
    
    // Find the defending piece
    const defendingPiece = gameState.pieces.find(
      p => p.position.x === duelState.defenderPosition?.x && 
          p.position.y === duelState.defenderPosition?.y
    );
    
    if (defendingPiece) {
      setDefendingPieceType(defendingPiece.type);
      
      // Set max allocation based on player's BP
      const playerMaxBP = Math.min(gameState.playerBP, 10);  // Max allocation is 10
      setMaxAllocation(playerMaxBP);
    }
  }, [gameState, duelState]);
  
  // Calculate BP cost as allocation changes
  useEffect(() => {
    if (!defendingPieceType) return;
    
    const calculatedCost = DuelRules.calculateBPCost(defendingPieceType, allocatedBP);
    setCost(calculatedCost);
  }, [allocatedBP, defendingPieceType]);
  
  // Handle BP allocation change
  const handleAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= maxAllocation) {
      setAllocatedBP(value);
    }
  };
  
  // Handle allocation submission
  const handleSubmit = () => {
    if (!gameState) return;
    
    send(GameEvents.ALLOCATE_BP, {
      gameId: gameState.gameId,
      battlePoints: allocatedBP
    });
    
    // Update local duel state
    setDuelState({
      ...duelState,
      allocatedBP
    });
  };
  
  // Get capacity of the defending piece
  const getPieceCapacity = (): number => {
    if (!defendingPieceType) return 0;
    return DuelRules.getBPCapacity(defendingPieceType);
  };
  
  if (!gameState || !duelState.defenderPosition) {
    return null;
  }
  
  return (
    <div className="bp-allocation-panel">
      <h2>Battle Points Allocation</h2>
      
      <div className="duel-information">
        <p>
          Your piece is attempting to capture an opponent's piece.
          Allocate Battle Points to increase your chances of winning the duel.
        </p>
        
        {defendingPieceType && (
          <div className="piece-info">
            <div className="piece-type">Opponent's Piece: {defendingPieceType}</div>
            <div className="piece-capacity">BP Capacity: {getPieceCapacity()}</div>
            <div className="bp-note">
              <small>
                Allocating BP beyond a piece's capacity costs double BP.
                Maximum allocation is 10 BP.
              </small>
            </div>
          </div>
        )}
      </div>
      
      <div className="allocation-controls">
        <div className="bp-available">
          <span>Your BP: {gameState.playerBP}</span>
        </div>
        
        <div className="allocation-slider">
          <label htmlFor="bp-allocation">Allocate Battle Points: {allocatedBP}</label>
          <input
            type="range"
            id="bp-allocation"
            min="0"
            max={maxAllocation}
            value={allocatedBP}
            onChange={handleAllocationChange}
          />
          <div className="cost-display">
            Cost: {cost} BP
            {cost > allocatedBP && <span className="extra-cost"> (includes doubling cost)</span>}
          </div>
        </div>
        
        <button 
          className="allocate-button"
          onClick={handleSubmit}
          disabled={gameState.playerBP < cost}
        >
          Allocate BP
        </button>
      </div>
    </div>
  );
};

export default BPAllocationPanel; 