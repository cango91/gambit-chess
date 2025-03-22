/**
 * Server-specific type definitions for Gambit Chess
 * Imports and extends shared types as needed
 */

import {
  GameState as SharedGameState,
  GamePhase,
  PlayerColor,
  PieceDTO,
  Position,
  MoveType,
  DuelOutcome,
  RetreatOption
} from '@gambit-chess/shared';

/**
 * Extended server game state with additional properties
 * not exposed to clients
 */
export interface ServerGameState {
  gameId: string;
  currentTurn: PlayerColor;
  gamePhase: GamePhase;
  gameState: SharedGameState;
  pieces: PieceDTO[];
  capturedPieces: PieceDTO[];
  whitePlayerBP: number;
  blackPlayerBP: number;
  whitePlayerSessionId?: string;
  blackPlayerSessionId?: string;
  lastMove: {
    from: Position;
    to: Position;
    type: MoveType;
  } | null;
  // Duel-related state
  pendingDuel?: {
    attackerPiece: PieceDTO;
    defenderPiece: PieceDTO;
    from: Position;
    to: Position;
    whiteAllocation?: number;
    blackAllocation?: number;
  };
  // Tactical retreat state
  tacticalRetreat?: {
    piece: PieceDTO;
    originalPosition: Position;
    failedCapturePosition: Position;
    retreatOptions: RetreatOption[];
  };
  createdAt: Date;
  lastActivityAt: Date;
  moveHistory: {
    from: Position;
    to: Position;
    piece: PieceDTO;
    capturedPiece?: PieceDTO;
    type: MoveType;
    promotion?: PieceDTO;
    duelOutcome?: DuelOutcome;
    whiteBPSpent?: number;
    blackBPSpent?: number;
    whitePlayerBP?: number;
    blackPlayerBP?: number;
  }[];
  // BP regeneration for next turn
  pendingBPRegeneration: {
    white: number;
    black: number;
  };
}

/**
 * Game result after completion
 */
export enum GameResult {
  WHITE_WINS = 'white_wins',
  BLACK_WINS = 'black_wins',
  DRAW = 'draw'
}

/**
 * Game options for creation
 */
export interface GameOptions {
  initialBPPool?: number;
  timeControlSeconds?: number;
  againstAI?: boolean;
  aiDifficulty?: string;
}

/**
 * Session information
 */
export interface SessionInfo {
  sessionId: string;
  gameIds: string[];
  lastActivityAt: Date;
} 