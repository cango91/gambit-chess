/**
 * Position on the chess board
 */
export interface Position {
  x: number; // 0-7 (a-h)
  y: number; // 0-7 (1-8)
}

/**
 * Chess piece interface
 */
export interface Piece {
  type: PieceType;
  color: PlayerColor;
  position: Position;
  hasMoved: boolean;
  battlePoints: number;
  getBPCapacity(): number;
  allocateBattlePoints(amount: number): number;
  resetBattlePoints(): void;
  moveTo(position: Position): void;
  isLongRangePiece(): boolean;
  clone(): Piece;
  toDTO(): PieceDTO;
}

/**
 * Chess piece types
 */
export enum PieceType {
  PAWN = 'pawn',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  ROOK = 'rook',
  QUEEN = 'queen',
  KING = 'king'
}

/**
 * Player colors
 */
export enum PlayerColor {
  WHITE = 'white',
  BLACK = 'black'
}

/**
 * Player role for client views
 */
export enum PlayerRole {
  PLAYER_WHITE = 'player_white',
  PLAYER_BLACK = 'player_black',
  SPECTATOR = 'spectator'
}

// Export board types
export * from './board';

// Export notation types without re-exporting ambiguous names
import * as NotationTypes from './notation';
// Re-export specific types from notation without ambiguity
export { 
  NotationTypes
};

/**
 * Battle Points capacity for each piece type (classic chess values)
 */
export const BP_CAPACITY: Record<PieceType, number> = {
  [PieceType.PAWN]: 1,
  [PieceType.KNIGHT]: 3,
  [PieceType.BISHOP]: 3,
  [PieceType.ROOK]: 5,
  [PieceType.QUEEN]: 9,
  [PieceType.KING]: 0 // King has no BP capacity as it cannot be captured
};

/**
 * Chess piece interface - contains only visible information
 */
export interface PieceDTO {
  id: string; // Unique identifier for the piece
  type: PieceType;
  color: PlayerColor;
  position: Position;
  hasMoved: boolean;
}

/**
 * Types of moves
 */
export enum MoveType {
  NORMAL = 'normal',
  CAPTURE = 'capture',
  CASTLE = 'castle',
  EN_PASSANT = 'en_passant',
  PROMOTION = 'promotion'
}

/**
 * Move request sent from client to server
 */
export interface MoveRequest {
  gameId: string;
  from: Position;
  to: Position;
  promotionPiece?: PieceType;
}

/**
 * Move result returned from server to client
 */
export interface MoveResult {
  success: boolean;
  move?: {
    from: Position;
    to: Position;
    type: MoveType;
    piece: PieceDTO;
    capturedPiece?: PieceDTO;
    promotionPiece?: PieceType;
  };
  error?: string;
  triggersDuel: boolean;
}

/**
 * BP Allocation request sent from client to server
 */
export interface BPAllocationRequest {
  gameId: string;
  amount: number;
}

/**
 * Duel outcome
 */
export enum DuelOutcome {
  ATTACKER_WINS = 'attacker_wins',
  DEFENDER_WINS = 'defender_wins',
  TIE = 'tie'
}

/**
 * Duel result returned from server to client
 */
export interface DuelResult {
  outcome: DuelOutcome;
  attackerColor: PlayerColor;
  defenderColor: PlayerColor;
  attackerPiece: PieceDTO;
  defenderPiece: PieceDTO;
  bpSpent: number; // Only shows the requesting client's BP spent
  tacticalRetreatAvailable: boolean;
  retreatOptions?: RetreatOption[]; // Contains positions and their BP costs
  originalPosition?: Position; // Original position of the attacker before the duel (for tactical retreat)
}

/**
 * Retreat option with position and BP cost
 */
export interface RetreatOption {
  position: Position;
  bpCost: number;
}

/**
 * Tactical retreat request sent from client to server
 */
export interface TacticalRetreatRequest {
  gameId: string;
  to: Position;
  acknowledgedBPCost: number; // The BP cost client acknowledges for the retreat
}

/**
 * Game state
 */
export enum GameState {
  ACTIVE = 'active',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW = 'draw'
}

/**
 * Game phase
 */
export enum GamePhase {
  NORMAL_MOVE = 'normal_move',
  DUEL_ALLOCATION = 'duel_allocation',
  TACTICAL_RETREAT = 'tactical_retreat'
}

/**
 * Client game state DTO - filtered for a specific player
 */
export interface GameStateDTO {
  gameId: string;
  playerRole: PlayerRole;
  currentTurn: PlayerColor;
  gamePhase: GamePhase;
  gameState: GameState;
  pieces: PieceDTO[];
  capturedPieces: PieceDTO[];
  playerBP: number; // Only the client's own BP
  isInCheck: boolean;
  lastMove: {
    from: Position;
    to: Position;
    type: MoveType;
  } | null;
  availableRetreats: RetreatOption[]; // Only populated during tactical retreat phase
  failedCapturePosition?: Position; // Position of the piece that failed to be captured (for tactical retreat)
  originalPosition?: Position; // Original position of the attacker before failed capture (for tactical retreat)
}

/**
 * Game creation request sent from client to server
 */
export interface CreateGameRequest {
  againstAI?: boolean;
  aiDifficulty?: string;
}

/**
 * Game creation result returned from server to client
 */
export interface CreateGameResult {
  gameId: string;
  playerRole: PlayerRole;
  success: boolean;
  error?: string;
} 