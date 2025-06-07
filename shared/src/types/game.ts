import { Chess, Square, Color, PieceSymbol, Move } from 'chess.js';
import { GameConfig } from './config';

// Player representation
export interface Player {
  id: string;
  color: Color;
  battlePoints: number;
}

// Extended Move type that includes duel information
export interface GambitMove extends Move {
  captureAttempt?: boolean;
  duelResult?: DuelResult;
  tacticalRetreat?: TacticalRetreat;
}

// Duel Result
export interface DuelResult {
  attackerAllocation: number;
  defenderAllocation: number;
  attackerWon: boolean;
  attackerBattlePointsRemaining: number;
  defenderBattlePointsRemaining: number;
}

// Tactical Retreat
export interface TacticalRetreat {
  originalSquare: Square;
  failedCaptureSquare: Square; 
  retreatSquare: Square;
  battlePointsCost: number;
}

// BP Calculation Transaction
export interface BPTransaction {
  type: 'duel_cost' | 'retreat_cost' | 'regeneration' | 'initial';
  player: 'white' | 'black';
  amount: number;
  details: string;
  formula?: string;
}

// Detailed tactic regeneration breakdown for transparency and debugging
export interface TacticRegenerationDetail {
  type: string; // SpecialAttackType as string for serialization
  detectedTactic: any; // TacticsDTO - keeping as any for now to avoid circular imports
  configFormula: string; // Original formula from config: "pinnedPieceValue + (isPinnedToKing ? 1 : 0)"
  substitutedFormula: string; // With values substituted: "(3) + (false ? 1 : 0)"
  evaluatedFormula: string; // After evaluation: "3 + 0"
  result: number; // Final BP value: 3
  breakdown: string[]; // Human-readable explanation of the tactic
}

// Complete BP regeneration calculation result
export interface BPRegenerationResult {
  totalBP: number;
  baseRegeneration: number;
  tacticRegeneration: number;
  appliedCap?: number;
  formula: string; // Complete formula: "1 + pin(3) + check(2) = 6 BP"
  tacticDetails: TacticRegenerationDetail[];
  calculations: string[]; // Step-by-step calculation log
}

// BP Calculation Report
export interface BPCalculationReport {
  playerBP: { white: number; black: number };
  transactions: BPTransaction[];
  calculations: string[];
  hiddenInfo: boolean;
  tactics?: any[];
  duelDetails?: any;
  // Add the detailed regeneration result if available
  regenerationDetails?: BPRegenerationResult;
  // Add move information for client display consistency
  moveInfo?: {
    moveNumber: number; // Half-turn number (0, 1, 2, 3...)
    notation: string; // SAN notation like "exd5" or "Nf6"
    color: 'w' | 'b'; // Which player moved
    captureAttempt?: boolean; // Whether this was a capture attempt
    duelOutcome?: 'won' | 'lost' | 'none'; // Result of any duel
    retreatInfo?: { from: string; to: string; cost: number }; // Tactical retreat details
  };
}

// Game State
export interface BaseGameState {
  id: string;
  chess: Chess;
  whitePlayer: Player;
  blackPlayer: Player;
  currentTurn: Color;
  moveHistory: GambitMove[];
  pendingDuel: PendingDuel | null;
  gameStatus: GameStatus;
  config: GameConfig;
  gameType?: 'ai' | 'human' | 'practice'; // Optional for backward compatibility
  halfmoveClockManual: number;
  positionHistory: Array<{ fen: string; turn: Color }>;
  availableRetreatOptions?: Array<{ square: Square; cost: number }>; // Server-calculated retreat options
  bpCalculationReport?: BPCalculationReport; // Optional detailed BP calculation report for debug/transparency
}

// Pending Duel
export interface PendingDuel {
  move: Move;
  attackerColor: Color;
  defenderColor: Color;
  attackingPiece: {
    type: PieceSymbol;
    square: Square;
  };
  defendingPiece: {
    type: PieceSymbol;
    square: Square;
  };
  attackerAllocation?: number;
  defenderAllocation?: number;
}

// Game Status
export enum GameStatus {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  IN_PROGRESS = 'IN_PROGRESS',
  DUEL_IN_PROGRESS = 'DUEL_IN_PROGRESS',
  TACTICAL_RETREAT_DECISION = 'TACTICAL_RETREAT_DECISION',
  CHECKMATE = 'CHECKMATE',
  STALEMATE = 'STALEMATE',
  DRAW = 'DRAW',
  ABANDONED = 'ABANDONED'
}

// Game Events
export enum GameEventType {
  GAME_CREATED = 'GAME_CREATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  MOVE_MADE = 'MOVE_MADE',
  DUEL_INITIATED = 'DUEL_INITIATED',
  DUEL_ALLOCATION_SUBMITTED = 'DUEL_ALLOCATION_SUBMITTED',
  DUEL_RESOLVED = 'DUEL_RESOLVED',
  TACTICAL_RETREAT_MADE = 'TACTICAL_RETREAT_MADE',
  BATTLE_POINTS_UPDATED = 'BATTLE_POINTS_UPDATED',
  GAME_ENDED = 'GAME_ENDED',
  BP_HISTORY_REQUESTED = 'BP_HISTORY_REQUESTED'
}

export interface GameEvent {
  type: GameEventType;
  gameId: string;
  timestamp: number;
  payload: any;
}

// Actions
export type MoveAction = {
  type: 'MOVE';
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
};

export type DuelAllocationAction = {
  type: 'DUEL_ALLOCATION';
  allocation: number;
};

export type TacticalRetreatAction = {
  type: 'TACTICAL_RETREAT';
  to: Square;
};

export type GameAction = MoveAction | DuelAllocationAction | TacticalRetreatAction;