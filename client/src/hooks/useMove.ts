import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { 
  GameEvents, 
  MoveRequest, 
  PieceDTO,
  PieceType, 
  Position, 
  PlayerColor,
  PlayerRole
} from '@gambit-chess/shared';
import { selectedPieceState, gameStateAtom, animationStateAtom } from '../store/atoms';
import { useWebSocket } from './useWebSocket';

/**
 * Hook for handling chess piece movement
 */
export function useMove() {
  const [selectedPiece, setSelectedPiece] = useRecoilState(selectedPieceState);
  const [animationState, setAnimationState] = useRecoilState(animationStateAtom);
  const gameState = useRecoilValue(gameStateAtom);
  const { send } = useWebSocket();

  /**
   * Select a piece on the board
   * Overloaded to accept either a Position or null to clear selection
   */
  const selectPiece = useCallback((posOrPiece: Position | null) => {
    // If no position is provided, clear selection
    if (!posOrPiece) {
      setSelectedPiece({
        position: null,
        availableMoves: []
      });
      return;
    }
    
    // Get the piece at the position
    const piece = gameState?.pieces.find(
      p => p.position.x === posOrPiece.x && p.position.y === posOrPiece.y
    );
    
    // If no piece at position or it's not the player's turn, clear selection
    if (!piece || !gameState || piece.color !== gameState.currentTurn) {
      setSelectedPiece({
        position: null,
        availableMoves: []
      });
      return;
    }
    
    // Convert PlayerRole to PlayerColor to check if the piece belongs to the player
    const playerColor = getPlayerColorFromRole(gameState.playerRole);
    if (playerColor !== piece.color) {
      setSelectedPiece({
        position: null,
        availableMoves: []
      });
      return;
    }
    
    // Calculate available moves
    // This is a simplified version - in practice, you would use the validation
    // functions from shared to determine valid moves
    const availableMoves: Position[] = [];
    
    // Set the selected piece
    setSelectedPiece({
      position: posOrPiece,
      availableMoves
    });
  }, [gameState, setSelectedPiece]);

  /**
   * Move a piece to a destination
   */
  const movePiece = useCallback((to: Position, promotionPiece?: PieceType) => {
    // If no piece is selected or game state is missing, exit
    if (!selectedPiece.position || !gameState) {
      return;
    }
    
    // Convert PlayerRole to PlayerColor
    const playerColor = getPlayerColorFromRole(gameState.playerRole);
    
    // Check if it's the player's turn
    const isPlayerTurn = gameState.currentTurn === playerColor;
    if (!isPlayerTurn) {
      return;
    }
    
    // Create move request
    const moveRequest: MoveRequest = {
      gameId: gameState.gameId,
      from: selectedPiece.position,
      to,
      promotionPiece
    };
    
    // Start animation
    setAnimationState({
      movingPiece: {
        from: selectedPiece.position,
        to
      },
      capturedPiece: null,
      duelAnimation: false
    });
    
    // Clear selection
    setSelectedPiece({
      position: null,
      availableMoves: []
    });
    
    // Send move request to server
    send(GameEvents.MAKE_MOVE, moveRequest);
  }, [selectedPiece, gameState, setSelectedPiece, setAnimationState, send]);

  /**
   * Check if a specific position is a valid move destination
   */
  const isValidMoveDestination = useCallback((position: Position): boolean => {
    if (!selectedPiece.position) return false;
    
    return selectedPiece.availableMoves.some(
      move => move.x === position.x && move.y === position.y
    );
  }, [selectedPiece]);

  /**
   * Helper function to convert PlayerRole to PlayerColor
   */
  const getPlayerColorFromRole = (role: PlayerRole): PlayerColor | null => {
    if (role === PlayerRole.PLAYER_WHITE) {
      return PlayerColor.WHITE;
    } else if (role === PlayerRole.PLAYER_BLACK) {
      return PlayerColor.BLACK;
    }
    return null; // For spectator
  };

  return {
    selectedPiece,
    selectPiece,
    movePiece,
    isValidMoveDestination,
    animationState
  };
}

// Export a simplified type for external use, hiding the implementation complexity
export type UseMove = ReturnType<typeof useMove>; 