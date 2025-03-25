import { useEffect } from 'react';
import { useRecoilState, useResetRecoilState } from 'recoil';
import { GameEvents, GamePhase, GameState, GameStateDTO } from '@gambit-chess/shared';
import { gameStateAtom, gameLoadingState, gameErrorState, 
         duelStateAtom, tacticalRetreatStateAtom, animationStateAtom } from '../store/atoms';
import { useWebSocket } from './useWebSocket';

/**
 * Hook for managing game state
 * Handles WebSocket events to update game state
 */
export function useGameState() {
  const [gameState, setGameState] = useRecoilState(gameStateAtom);
  const [isLoading, setIsLoading] = useRecoilState(gameLoadingState);
  const [error, setError] = useRecoilState(gameErrorState);
  const [duelState, setDuelState] = useRecoilState(duelStateAtom);
  const [tacticalRetreatState, setTacticalRetreatState] = useRecoilState(tacticalRetreatStateAtom);
  const [animationState, setAnimationState] = useRecoilState(animationStateAtom);
  
  // Reset functions for atoms
  const resetGameState = useResetRecoilState(gameStateAtom);
  const resetDuelState = useResetRecoilState(duelStateAtom);
  const resetTacticalRetreatState = useResetRecoilState(tacticalRetreatStateAtom);
  const resetAnimationState = useResetRecoilState(animationStateAtom);
  
  const { subscribe, unsubscribe } = useWebSocket();

  // Set up WebSocket event handlers
  useEffect(() => {
    // Handler for game state updates
    const handleGameStateUpdate = (data: GameStateDTO) => {
      setGameState(data);
      setIsLoading(false);
    };

    // Handler for duel started event
    const handleDuelStarted = (data: any) => {
      setDuelState({
        attackerPosition: data.attackerPosition,
        defenderPosition: data.defenderPosition,
        allocatedBP: 0
      });
      setAnimationState(prev => ({
        ...prev,
        duelAnimation: true
      }));
    };

    // Handler for duel resolved event
    const handleDuelResolved = (data: any) => {
      setDuelState({
        attackerPosition: null,
        defenderPosition: null,
        allocatedBP: 0
      });
      setAnimationState(prev => ({
        ...prev,
        duelAnimation: false
      }));
    };

    // Handler for tactical retreat available event
    const handleTacticalRetreatAvailable = (data: any) => {
      setTacticalRetreatState({
        piecePosition: data.piecePosition,
        originalPosition: data.originalPosition,
        availableRetreats: data.availableRetreats,
        selectedRetreat: null
      });
    };

    // Handler for game over event
    const handleGameOver = (data: any) => {
      // Update final game state
      if (data.finalState) {
        setGameState(data.finalState);
      }
    };

    // Handler for error events
    const handleError = (data: any) => {
      setError(data.message || 'An unknown error occurred');
      setIsLoading(false);
    };

    // Subscribe to events
    subscribe(GameEvents.GAME_STATE_UPDATED, handleGameStateUpdate);
    subscribe(GameEvents.DUEL_STARTED, handleDuelStarted);
    subscribe(GameEvents.DUEL_RESOLVED, handleDuelResolved);
    subscribe(GameEvents.TACTICAL_RETREAT_AVAILABLE, handleTacticalRetreatAvailable);
    subscribe(GameEvents.GAME_OVER, handleGameOver);
    subscribe(GameEvents.ERROR, handleError);

    // Cleanup function
    return () => {
      unsubscribe(GameEvents.GAME_STATE_UPDATED, handleGameStateUpdate);
      unsubscribe(GameEvents.DUEL_STARTED, handleDuelStarted);
      unsubscribe(GameEvents.DUEL_RESOLVED, handleDuelResolved);
      unsubscribe(GameEvents.TACTICAL_RETREAT_AVAILABLE, handleTacticalRetreatAvailable);
      unsubscribe(GameEvents.GAME_OVER, handleGameOver);
      unsubscribe(GameEvents.ERROR, handleError);
    };
  }, [subscribe, unsubscribe, setGameState, setIsLoading, setError, setDuelState, setTacticalRetreatState, setAnimationState]);

  // Function to reset all game state
  const resetAllGameState = () => {
    resetGameState();
    resetDuelState();
    resetTacticalRetreatState();
    resetAnimationState();
    setIsLoading(true);
    setError(null);
  };

  return {
    gameState,
    isLoading,
    error,
    duelState,
    tacticalRetreatState,
    animationState,
    resetAllGameState
  };
} 