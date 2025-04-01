import { ChessPieceColor, ChessPieceColorType, ChessPieceType, ChessPosition, ChessPositionType } from "./types";
import { GamePhase, GameResult } from "../types";
import { GameStateDTO, ChessPieceDTO } from "../dtos";

/**
 * Represents a chess piece
 */
export interface IChessPiece {
    /** Piece type (p=pawn, n=knight, b=bishop, r=rook, q=queen, k=king) */
    get type(): ChessPieceType;
    /** Piece color */
    get color(): ChessPieceColor;
    /** Current position on the board */
    get position(): ChessPosition | null | undefined;
    /** Whether the piece has moved from its starting position */
    get hasMoved(): boolean;
    /** Turn number when this piece last moved (for en passant and other time-sensitive rules) */
    get lastMoveTurn(): number | undefined;
    set position(position: ChessPositionType);
    move(position: ChessPositionType, turn: number | undefined) : void;
    removeFromBoard(): void;
    promote? : (type: ChessPieceType) => void;
  }

  /**
   * Board interface that defines core functionality for any board representation
   */
  export interface IBoard {
    /** Gets the piece at a specific position */
    getPieceAt(position: ChessPositionType): IChessPiece | undefined;
    
    /** Gets all pieces currently on the board */
    getAllPieces(): IChessPiece[];
    
    /** Gets all pieces of a specific color */
    getPiecesByColor(color: ChessPieceColorType): IChessPiece[];
    
    /** Gets all captured pieces */
    getCapturedPieces(): IChessPiece[];
    
    /** Gets the position of the king for a specific color */
    getKingPosition(color: ChessPieceColorType): ChessPosition | undefined;
    
    /** Checks if a move is valid according to chess rules */
    isValidMove(from: ChessPositionType, to: ChessPositionType): boolean;
    
    /** Checks if the king of a specific color is in check */
    isInCheck(color: ChessPieceColorType): boolean;
    
    /** Makes a move on the board */
    makeMove(from: ChessPositionType, to: ChessPositionType, promotion?: ChessPieceType): { 
      success: boolean, 
      captured?: IChessPiece, 
      check?: boolean, 
      checkmate?: boolean
    };
    
    /** Creates a deep copy of the board */
    clone(): IBoard;
    
    /** Gets the current move/turn number */
    getCurrentTurn(): number;
    
    /** Checks if a pawn can be captured via en passant at the given position */
    getEnPassantTarget(): ChessPosition | null;
  }
  
/**
 * Represents the internal state of the minimal chess engine
 */
export interface IMinimalEngineState {
    phase: GamePhase;
    turn: 'w' | 'b';
    pieces: ChessPieceDTO[];
    moveNumber: number;
    inCheck: boolean;
    bp?: number;
    result?: GameResult;
    whiteTimeRemaining: number;
    blackTimeRemaining: number;
    activeTimer: 'w' | 'b' | null;
    players: {
        id: string;
        name: string;
        color: 'w' | 'b';
    }[];
    spectators: {
        id: string;
        name: string;
    }[];
}

/**
 * Result of a move validation
 */
export interface IMoveValidationResult {
    valid: boolean;
    reason?: string;
    inCheck?: boolean;
    isCheckmate?: boolean;
    isStalemate?: boolean;
    capturedPiece?: ChessPieceDTO;
}

/**
 * Result of a BP allocation validation
 */
export interface IBPAllocationValidationResult {
    valid: boolean;
    reason?: string;
    maxAllowed?: number;
}

/**
 * Represents a tactical retreat option
 */
export interface IRetreatOption {
    to: string;
    cost: number;
}

/**
 * Core interface for the minimal chess engine
 */
export interface IMinimalChessEngine {
    // State Management
    getState(): IMinimalEngineState;
    setState(state: GameStateDTO): void;
    
    // Board Access
    getBoard(): IBoard;
    
    // Core Game Logic
    validateMove(from: string, to: string): IMoveValidationResult;
    validateBPAllocation(amount: number, piecePos: string): IBPAllocationValidationResult;
    validateTacticalRetreat(piecePos: string, failedTarget: string): IRetreatOption[];
    
    // Utility Functions
    getPossibleMoves(position: string): string[];
    isInCheck(color?: 'w' | 'b'): boolean;
    isGameOver(): boolean;
    
    // Time Management
    getRemainingTime(color: 'w' | 'b'): number;
    getActiveTimer(): 'w' | 'b' | null;
}
  