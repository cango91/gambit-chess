/**
 * Core types for Gambit Chess
 */

/**
 * Represents a position on the chess board
 */
export type Position = string; // e.g., "e4", "a1"

/**
 * Represents chess piece colors
 */
export type PieceColor = 'white' | 'black';

/**
 * Represents piece types
 */
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

/**
 * Represents a chess piece
 */
export interface ChessPiece {
  /** Piece type (p=pawn, n=knight, b=bishop, r=rook, q=queen, k=king) */
  type: PieceType;
  /** Piece color */
  color: PieceColor;
  /** Current position on the board */
  position: Position;
  /** Whether the piece has moved from its starting position */
  hasMoved: boolean;
  /** Turn number when this piece last moved (for en passant and other time-sensitive rules) */
  lastMoveTurn?: number;
}

/**
 * Board interface that defines core functionality for any board representation
 */
export interface IBoard {
  /** Gets the piece at a specific position */
  getPiece(position: Position): ChessPiece | undefined;
  
  /** Gets all pieces currently on the board */
  getAllPieces(): ChessPiece[];
  
  /** Gets all pieces of a specific color */
  getPiecesByColor(color: PieceColor): ChessPiece[];
  
  /** Gets all captured pieces */
  getCapturedPieces(): ChessPiece[];
  
  /** Gets the position of the king for a specific color */
  getKingPosition(color: PieceColor): Position | undefined;
  
  /** Checks if a move is valid according to chess rules */
  isValidMove(from: Position, to: Position): boolean;
  
  /** Checks if the king of a specific color is in check */
  isInCheck(color: PieceColor): boolean;
  
  /** Makes a move on the board */
  makeMove(from: Position, to: Position, promotion?: PieceType): { 
    success: boolean, 
    captured?: ChessPiece, 
    check?: boolean, 
    checkmate?: boolean
  };
  
  /** Creates a deep copy of the board */
  clone(): IBoard;
  
  /** Gets the current move/turn number */
  getCurrentTurn(): number;
  
  /** Checks if a pawn can be captured via en passant at the given position */
  getEnPassantTarget(): Position | null;
}

/**
 * Represents the outcome of a move
 */
export type MoveOutcome = 'success' | 'failed';

/**
 * Represents a chess move
 */
export interface Move {
  /** Starting position */
  from: Position;
  /** Destination position */
  to: Position;
  /** Moving piece type */
  piece: PieceType;
  /** Captured piece type (if a capture was attempted) */
  capture?: PieceType;
  /** Promotion piece (if pawn is promoted) */
  promotion?: PieceType;
  /** If the move is a castle */
  castle?: 'kingside' | 'queenside';
  /** If the move results in check */
  check?: boolean;
  /** If the move results in checkmate */
  checkmate?: boolean;
  /** If the move is an en passant capture */
  enPassant?: boolean;
  /** Turn number when this move was made */
  turnNumber?: number;
}

/**
 * Represents a duel between attacking and defending pieces
 */
export interface Duel {
  /** Player who initiated the capture attempt */
  attacker: PieceColor;
  /** BP allocated by the attacker */
  attackerAllocation: number;
  /** BP allocated by the defender */
  defenderAllocation: number;
  /** The outcome of the duel */
  outcome: MoveOutcome;
}

/**
 * Represents a tactical retreat after a failed capture
 */
export interface Retreat {
  /** Position to retreat to */
  to: Position;
  /** BP cost of the retreat */
  cost: number;
}

/**
 * Represents game phase
 */
export enum GamePhase {
  NORMAL = 'normal',
  DUEL_ALLOCATION = 'duel_allocation',
  TACTICAL_RETREAT = 'tactical_retreat',
  GAME_OVER = 'game_over'
}

/**
 * Represents the result of a completed game
 */
export enum GameResult {
  WHITE_WIN = 'white_win',
  BLACK_WIN = 'black_win',
  DRAW = 'draw',
  IN_PROGRESS = 'in_progress'
}

/**
 * Represents player information
 */
export interface Player {
  /** Player unique ID */
  id: string;
  /** Player display name */
  name: string;
  /** Player color */
  color: PieceColor;
}

/**
 * Represents a spectator
 */
export interface Spectator {
  /** Spectator unique ID */
  id: string;
  /** Spectator display name */
  name: string;
}

/**
 * Represents a chat message
 */
export interface ChatMessage {
  /** Sender ID */
  senderId: string;
  /** Sender name */
  senderName: string;
  /** Message content */
  message: string;
  /** Timestamp of the message */
  timestamp: number;
}

// Export types from moveTypes.ts
export * from './moveTypes'; 