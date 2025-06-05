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

// BP Calculation Report
export interface BPCalculationReport {
  playerBP: { white: number; black: number };
  transactions: BPTransaction[];
  calculations: string[];
  hiddenInfo: boolean;
  tactics?: any[];
  duelDetails?: any;
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
  GAME_ENDED = 'GAME_ENDED'
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