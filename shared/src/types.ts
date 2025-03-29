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


/**
 * Extended move information including duel and retreat data
 */
export interface ExtendedMove {
  /** Base move information */
  move: Move;
  /** Duel information if a capture was attempted */
  duel: Duel | null;
  /** Retreat information if a failed capture resulted in a retreat */
  retreat: Retreat | null;
  /** Battle Points regenerated after this move */
  bpRegeneration: number;
  /** Color of the player who made the move */
  playerColor: PieceColor;
  /** Turn number when this move was made */
  turnNumber: number;
}

/**
 * Array of extended moves representing a game's move history
 */
export type MoveHistory = ExtendedMove[];

/**
 * Array of move strings in algebraic notation
 */
export type PGNMoveList = string[];

/**
 * PGN format header information
 */
export interface PGNHeaders {
  /** Event name */
  Event?: string;
  /** Site where the game was played */
  Site?: string;
  /** Date of the game (YYYY.MM.DD) */
  Date?: string;
  /** Round number */
  Round?: string;
  /** White player name */
  White?: string;
  /** Black player name */
  Black?: string;
  /** Game result (1-0, 0-1, 1/2-1/2, *) */
  Result?: string;
  /** Time control */
  TimeControl?: string;
  /** Any custom headers */
  [key: string]: string | undefined;
}

/**
 * Complete PGN data structure
 */
export interface PGNData {
  /** PGN headers */
  headers: PGNHeaders;
  /** Move list */
  moves: MoveHistory;
} 