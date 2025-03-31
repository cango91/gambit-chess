import { PIECE_COLOR, PieceColor } from '@gambit-chess/shared';
import { TacticalDetectorService } from './TacticalDetectorService';
import { Board } from '../models/Board';

/**
 * Manages Battle Points (BP) for players
 * Handles BP pools, allocation, and regeneration
 */
export class BPManager {
  // Default initial BP for each player (configurable)
  private static DEFAULT_INITIAL_BP = 39; // Sum of standard piece values (8 pawns + 2 rooks + 2 knights + 2 bishops + 1 queen + 1 king)
  
  // Maximum BP a piece can have (configurable)
  private static MAX_BP_CAPACITY = 10;
  
  // BP pools for both players
  private whiteBpPool: number;
  private blackBpPool: number;
  
  /**
   * Creates a new BP Manager with initial BP pools
   * 
   * @param initialBP Optional custom initial BP value
   * @param tacticalDetector Service for detecting tactical advantages
   */
  constructor(
    initialBP: number = BPManager.DEFAULT_INITIAL_BP,
    private tacticalDetector: TacticalDetectorService
  ) {
    this.whiteBpPool = initialBP;
    this.blackBpPool = initialBP;
  }
  
  /**
   * Gets the BP pool for a player
   * 
   * @param color Player color
   * @returns Current BP pool
   */
  public getBpPool(color: PieceColor): number {
    return color.equals(PIECE_COLOR('white')) ? this.whiteBpPool : this.blackBpPool;
  }
  
  /**
   * Allocates BP for a duel
   * 
   * @param color Player color
   * @param amount Amount of BP to allocate
   * @returns Whether the allocation was successful
   */
  public allocateBP(color: PieceColor, amount: number): boolean {
    if (amount < 0) {
      throw new Error('Cannot allocate negative BP');
    }
    
    // Check if player has enough BP
    const currentBP = this.getBpPool(color);
    if (amount > currentBP) {
      return false;
    }
    
    // Deduct the BP from the player's pool
    if (color.equals(PIECE_COLOR('white'))) {
      this.whiteBpPool -= amount;
    } else {
      this.blackBpPool -= amount;
    }
    
    return true;
  }
  
  /**
   * Regenerates BP based on tactical advantages created
   * 
   * @param color Player color
   * @param currentBoard Current board state
   * @param previousBoard Previous board state before the move
   * @returns Amount of BP regenerated
   */
  public regenerateBP(color: PieceColor, currentBoard: Board, previousBoard: Board): number {
    // Base regeneration after a turn
    let regenAmount = 1;
    
    // Calculate additional regeneration based on new tactical advantages
    regenAmount += this.tacticalDetector.calculateTacticalAdvantages(
      color,
      currentBoard,
      previousBoard
    );
    
    // Apply the regeneration
    if (color.equals(PIECE_COLOR('white'))) {
      this.whiteBpPool += regenAmount;
    } else {
      this.blackBpPool += regenAmount;
    }
    
    return regenAmount;
  }
  
  /**
   * Resets both players' BP pools to the initial value
   * 
   * @param initialBP Optional custom initial BP value
   */
  public resetBpPools(initialBP: number = BPManager.DEFAULT_INITIAL_BP): void {
    this.whiteBpPool = initialBP;
    this.blackBpPool = initialBP;
  }
  
  /**
   * Sets a player's BP pool to a specific value
   * Used for testing or special game modes
   * 
   * @param color Player color
   * @param amount New BP amount
   */
  public setBpPool(color: PieceColor, amount: number): void {
    if (amount < 0) {
      throw new Error('BP pool cannot be negative');
    }
    
    if (color.equals(PIECE_COLOR('white'))) {
      this.whiteBpPool = amount;
    } else {
      this.blackBpPool = amount;
    }
  }
  
  /**
   * Checks if a player has enough BP for an allocation
   * 
   * @param color Player color
   * @param amount Amount to check
   * @returns Whether the player has enough BP
   */
  public hasEnoughBP(color: PieceColor, amount: number): boolean {
    return this.getBpPool(color) >= amount;
  }
} 