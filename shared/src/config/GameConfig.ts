import { PieceType } from '../types';

/**
 * Game configuration interface
 * Contains game settings that can be adjusted for balancing
 */
export interface GameConfig {
  /**
   * Battle Points configuration
   */
  battlePoints: {
    /**
     * Initial BP pool for each player
     */
    initialBP: number;
    
    /**
     * BP capacity for each piece type
     */
    pieceCapacity: Record<PieceType, number>;
    
    /**
     * Maximum BP that can be allocated to a single piece
     */
    maxAllocation: number;
    
    /**
     * BP regeneration configuration
     */
    regeneration: {
      /**
       * Base BP regeneration per turn
       */
      baseTurnRegen: number;
      
      /**
       * BP regeneration for checking the opponent
       */
      checkRegen: number;
      
      /**
       * BP regeneration for pinning an opponent piece
       * Value is multiplied by the pinned piece's capacity
       */
      pinMultiplier: number;
      
      /**
       * Additional BP for pinning to the king
       */
      pinToKingBonus: number;
      
      /**
       * BP regeneration for creating a fork
       */
      forkRegen: number;
      
      /**
       * BP regeneration for creating a skewer
       */
      skewerRegen: number;
      
      /**
       * BP regeneration for defending a piece
       */
      defenseRegen: number;
      
      /**
       * BP regeneration for discovered attack
       * Value is multiplied by the attacked piece's capacity
       */
      discoveredAttackMultiplier: number;
    };
  };
  
  /**
   * Tactical retreat configuration
   */
  tacticalRetreat: {
    /**
     * Base BP cost for tactical retreats
     */
    baseCost: number;
    
    /**
     * BP cost multiplier per square distance
     */
    distanceMultiplier: number;
    
    /**
     * Knight retreat BP cost configuration
     */
    knightRetreatCosts: {
      /**
       * Cost for one-move retreat
       */
      oneMove: number;
      
      /**
       * Cost for two-move retreat
       */
      twoMove: number;
      
      /**
       * Cost for three-move retreat
       */
      threeMove: number;
    };
  };
  
  /**
   * Time control configuration
   */
  timeControl?: {
    /**
     * Initial time in seconds
     */
    initialTime: number;
    
    /**
     * Increment per move in seconds
     */
    increment: number;
    
    /**
     * Maximum time for BP allocation in seconds
     */
    duelAllocationTime: number;
    
    /**
     * Maximum time for tactical retreat decision in seconds
     */
    tacticalRetreatTime: number;
  };
}

/**
 * Default game configuration
 * Used if server doesn't provide custom settings
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  battlePoints: {
    initialBP: 39,
    pieceCapacity: {
      [PieceType.PAWN]: 1,
      [PieceType.KNIGHT]: 3,
      [PieceType.BISHOP]: 3,
      [PieceType.ROOK]: 5,
      [PieceType.QUEEN]: 9,
      [PieceType.KING]: 0
    },
    maxAllocation: 10,
    regeneration: {
      baseTurnRegen: 1,
      checkRegen: 2,
      pinMultiplier: 1,
      pinToKingBonus: 1,
      forkRegen: 1,
      skewerRegen: 1,
      defenseRegen: 1,
      discoveredAttackMultiplier: 0.5
    }
  },
  tacticalRetreat: {
    baseCost: 0,
    distanceMultiplier: 1,
    knightRetreatCosts: {
      oneMove: 1,
      twoMove: 2,
      threeMove: 3
    }
  },
  timeControl: {
    initialTime: 600,
    increment: 5,
    duelAllocationTime: 30,
    tacticalRetreatTime: 30
  }
}; 