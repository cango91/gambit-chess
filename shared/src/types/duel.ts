import { PieceSymbol, Square } from 'chess.js';

// Duel stage
export enum DuelStage {
  NOT_STARTED = 'NOT_STARTED',
  ALLOCATION = 'ALLOCATION',
  RESOLUTION = 'RESOLUTION',
  COMPLETED = 'COMPLETED'
}

// Battle point allocations
export interface BattlePointAllocation {
  playerId: string;
  amount: number;
}

// Piece battle capacity
export interface PieceBattleCapacity {
  type: PieceSymbol;
  baseCapacity: number; // Same as piece value by default
  maxCapacity: number;  // Maximum BP the piece can effectively use
}

// Duel context
export interface DuelContext {
  attackingPiece: {
    type: PieceSymbol;
    square: Square;
    playerId: string;
    playerBattlePoints: number;
  };
  defendingPiece: {
    type: PieceSymbol;
    square: Square;
    playerId: string;
    playerBattlePoints: number;
  };
}

// Duel outcome
export interface DuelOutcome {
  attackerAllocation: number;
  defenderAllocation: number;
  attackerWon: boolean;
  attackerRemainingBP: number;
  defenderRemainingBP: number;
}