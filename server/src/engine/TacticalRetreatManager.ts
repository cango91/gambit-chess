import {
  Position,
  PlayerColor,
  PieceDTO,
  GamePhase,
  TacticalRetreatRules,
  GameState as SharedGameState
} from 'gambit-chess-shared';
import { GameState } from './GameState';

/**
 * TacticalRetreatManager service
 * Responsible for managing tactical retreats after failed capture attempts
 */
export class TacticalRetreatManager {
  constructor(private gameState: GameState) {}

  /**
   * Execute a tactical retreat
   * @param to Destination position to retreat to
   * @param playerColor Color of the player making the retreat
   * @returns Object with success flag and error message if applicable
   */
  executeRetreat(
    to: Position,
    playerColor: PlayerColor
  ): {
    success: boolean;
    error?: string;
    bpCost?: number;
  } {
    // Get current game state
    const state = this.gameState.getState();
    
    // Check if game is in tactical retreat phase
    if (state.gamePhase !== GamePhase.TACTICAL_RETREAT) {
      return { success: false, error: 'Not in tactical retreat phase' };
    }
    
    // Ensure there's tactical retreat data
    if (!state.tacticalRetreat) {
      return { success: false, error: 'No tactical retreat in progress' };
    }
    
    // Get retreat data
    const { 
      piece, 
      originalPosition, 
      failedCapturePosition, 
      retreatOptions 
    } = state.tacticalRetreat;
    
    // Check if the piece belongs to the player
    if (piece.color !== playerColor) {
      return { success: false, error: 'Cannot retreat opponent\'s piece' };
    }
    
    // Check if the requested retreat position is valid
    const retreatOption = retreatOptions.find(
      option => option.position.x === to.x && option.position.y === to.y
    );
    
    if (!retreatOption) {
      return { success: false, error: 'Invalid retreat position' };
    }
    
    // Check if player has enough BP for the retreat
    const bpCost = retreatOption.bpCost;
    const playerBP = this.gameState.getPlayerBP(playerColor);
    
    if (bpCost > 0 && playerBP < bpCost) {
      return { 
        success: false, 
        error: `Not enough BP for retreat. Cost: ${bpCost}, Available: ${playerBP}`,
        bpCost
      };
    }
    
    // Execute the retreat
    // Create updated pieces array
    const pieces = [...state.pieces];
    
    // Find the retreating piece
    const pieceIndex = pieces.findIndex(p => p.id === piece.id);
    
    if (pieceIndex === -1) {
      return { success: false, error: 'Retreating piece not found' };
    }
    
    // Update the piece position
    if (this.isSamePosition(to, originalPosition)) {
      // Return to original position (no BP cost)
      pieces[pieceIndex] = {
        ...pieces[pieceIndex],
        position: { ...originalPosition }
      };
    } else {
      // Retreat to a different position (costs BP)
      pieces[pieceIndex] = {
        ...pieces[pieceIndex],
        position: { ...to },
        hasMoved: true
      };
      
      // Deduct BP
      this.gameState.addPlayerBP(playerColor, -bpCost);
    }
    
    // Update the state
    this.updatePieces(pieces);
    
    // Clear the tactical retreat
    this.clearTacticalRetreat();
    
    // Change phase back to normal move
    this.gameState.setGamePhase(GamePhase.NORMAL_MOVE);
    
    // Update the board
    this.gameState.getBoard();
    
    // Switch turn
    this.gameState.switchTurn();
    
    return { 
      success: true,
      bpCost
    };
  }

  /**
   * Check if two positions are the same
   * @param pos1 First position
   * @param pos2 Second position
   * @returns True if the positions are identical
   */
  private isSamePosition(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  /**
   * Helper method to update game state pieces
   * @param pieces Updated pieces array
   */
  private updatePieces(pieces: PieceDTO[]): void {
    this.gameState.updatePieces(pieces);
  }

  /**
   * Helper method to clear tactical retreat
   */
  private clearTacticalRetreat(): void {
    this.gameState.clearTacticalRetreat();
  }
} 