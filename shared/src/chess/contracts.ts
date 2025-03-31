import { ChessPieceColor, ChessPieceColorType, ChessPieceType, ChessPosition, ChessPositionType } from "./types";

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
  