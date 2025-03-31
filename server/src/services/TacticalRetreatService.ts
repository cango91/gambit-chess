import { 
  calculateTacticalRetreats, 
  Position, 
  PieceType,
  RetreatCost 
} from '@gambit-chess/shared';
import { Board } from '../models/Board';

/**
 * Service for calculating valid tactical retreat options
 * after failed capture attempts
 */
export class TacticalRetreatService {
  /**
   * Calculates valid tactical retreat options
   * @param board Current board state
   * @param piecePosition Position of the piece to retreat
   * @returns Array of valid retreat options with BP costs
   */
  public calculateRetreatOptions(
    board: Board,
    piecePosition: Position
  ): RetreatCost[] {
    const piece = board.getPiece(piecePosition);
    if (!piece) {
      return [];
    }
    
    // For retreat calculation, we need to know where the piece came from
    const lastCaptureAttempt = board.getLastCaptureAttempt();
    if (!lastCaptureAttempt) {
      return [];
    }
    
    // Create a map of occupied positions for the shared utility
    const occupiedPositions = new Map<Position, boolean>();
    
    // Add all pieces to the occupied positions map
    for (const p of board.getAllPieces()) {
      occupiedPositions.set(p.position!, true);
    }
    
    // Use the shared module utility to calculate retreats
    return calculateTacticalRetreats(
      lastCaptureAttempt.from, // Original position before capture attempt
      lastCaptureAttempt.to,   // Position where capture was attempted
      occupiedPositions
    );
  }
  
  /**
   * Validates if a retreat position is among the valid options
   * @param retreatOptions Available retreat options
   * @param position Position to validate
   * @returns Whether the position is a valid retreat option
   */
  public isValidRetreatPosition(retreatOptions: RetreatCost[], position: Position): boolean {
    return retreatOptions.some(option => option.to === position);
  }
  
  /**
   * Gets the BP cost for a specific retreat position
   * @param retreatOptions Available retreat options
   * @param position Position to check
   * @returns BP cost or undefined if not a valid retreat position
   */
  public getRetreatCost(retreatOptions: RetreatCost[], position: Position): number | undefined {
    const option = retreatOptions.find(option => option.to === position);
    return option?.cost;
  }
} 