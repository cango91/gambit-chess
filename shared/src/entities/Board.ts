import { Piece } from './Piece';
import { PieceType, PlayerColor, Position, GameState } from '../types';

/**
 * Board class representing the chess board
 * @class Board
 */
export class Board {
  private pieces: Piece[];
  private capturedPieces: Piece[];
  private currentState: GameState;
  private lastMove: { from: Position; to: Position } | null;
  
  /**
   * Create a new Board
   * @param setupInitialPosition Whether to set up the initial position (default: true)
   */
  constructor(setupInitialPosition = true) {
    this.pieces = [];
    this.capturedPieces = [];
    this.currentState = GameState.ACTIVE;
    this.lastMove = null;
    
    if (setupInitialPosition) {
      this.setupInitialPosition();
    }
  }
  
  /**
   * Set up the initial chess position
   */
  private setupInitialPosition(): void {
    // Add pawns
    for (let x = 0; x < 8; x++) {
      this.addPiece(new Piece(PieceType.PAWN, PlayerColor.WHITE, { x, y: 1 }));
      this.addPiece(new Piece(PieceType.PAWN, PlayerColor.BLACK, { x, y: 6 }));
    }
    
    // Add rooks
    this.addPiece(new Piece(PieceType.ROOK, PlayerColor.WHITE, { x: 0, y: 0 }));
    this.addPiece(new Piece(PieceType.ROOK, PlayerColor.WHITE, { x: 7, y: 0 }));
    this.addPiece(new Piece(PieceType.ROOK, PlayerColor.BLACK, { x: 0, y: 7 }));
    this.addPiece(new Piece(PieceType.ROOK, PlayerColor.BLACK, { x: 7, y: 7 }));
    
    // Add knights
    this.addPiece(new Piece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 1, y: 0 }));
    this.addPiece(new Piece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 6, y: 0 }));
    this.addPiece(new Piece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 1, y: 7 }));
    this.addPiece(new Piece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 6, y: 7 }));
    
    // Add bishops
    this.addPiece(new Piece(PieceType.BISHOP, PlayerColor.WHITE, { x: 2, y: 0 }));
    this.addPiece(new Piece(PieceType.BISHOP, PlayerColor.WHITE, { x: 5, y: 0 }));
    this.addPiece(new Piece(PieceType.BISHOP, PlayerColor.BLACK, { x: 2, y: 7 }));
    this.addPiece(new Piece(PieceType.BISHOP, PlayerColor.BLACK, { x: 5, y: 7 }));
    
    // Add queens
    this.addPiece(new Piece(PieceType.QUEEN, PlayerColor.WHITE, { x: 3, y: 0 }));
    this.addPiece(new Piece(PieceType.QUEEN, PlayerColor.BLACK, { x: 3, y: 7 }));
    
    // Add kings
    this.addPiece(new Piece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }));
    this.addPiece(new Piece(PieceType.KING, PlayerColor.BLACK, { x: 4, y: 7 }));
  }
  
  /**
   * Add a piece to the board
   * @param piece The piece to add
   */
  addPiece(piece: Piece): void {
    this.pieces.push(piece);
  }
  
  /**
   * Get all pieces on the board
   * @returns Array of pieces
   */
  getPieces(): Piece[] {
    return [...this.pieces];
  }
  
  /**
   * Get pieces of a specific color
   * @param color The color to filter by
   * @returns Array of pieces of the specified color
   */
  getPiecesByColor(color: PlayerColor): Piece[] {
    return this.pieces.filter(piece => piece.color === color);
  }
  
  /**
   * Get the piece at a specific position
   * @param position The position to check
   * @returns The piece at the position or undefined if empty
   */
  getPieceAt(position: Position): Piece | undefined {
    return this.pieces.find(
      piece => piece.position.x === position.x && piece.position.y === position.y
    );
  }
  
  /**
   * Move a piece on the board
   * @param from Starting position
   * @param to Destination position
   * @returns True if the move was successful
   */
  movePiece(from: Position, to: Position): boolean {
    const piece = this.getPieceAt(from);
    
    if (!piece) {
      return false;
    }
    
    // Check if there's a capture
    const capturedPiece = this.getPieceAt(to);
    if (capturedPiece) {
      if (capturedPiece.color === piece.color) {
        return false; // Can't capture own piece
      }
      this.capturePiece(capturedPiece);
    }
    
    // Move the piece
    piece.moveTo(to);
    this.lastMove = { from, to };
    
    return true;
  }
  
  /**
   * Capture a piece and remove it from the board
   * @param piece The piece to capture
   */
  capturePiece(piece: Piece): void {
    const index = this.pieces.findIndex(
      p => p.position.x === piece.position.x && p.position.y === piece.position.y
    );
    
    if (index !== -1) {
      const [capturedPiece] = this.pieces.splice(index, 1);
      this.capturedPieces.push(capturedPiece);
    }
  }
  
  /**
   * Get all captured pieces
   * @returns Array of captured pieces
   */
  getCapturedPieces(): Piece[] {
    return [...this.capturedPieces];
  }
  
  /**
   * Check if a position is within the board boundaries
   * @param position The position to check
   * @returns True if the position is valid
   */
  isValidPosition(position: Position): boolean {
    return (
      position.x >= 0 && position.x < 8 && 
      position.y >= 0 && position.y < 8
    );
  }
  
  /**
   * Get the current game state
   * @returns The current game state
   */
  getGameState(): GameState {
    return this.currentState;
  }
  
  /**
   * Set the game state
   * @param state The new game state
   */
  setGameState(state: GameState): void {
    this.currentState = state;
  }
  
  /**
   * Get king position for a specific color
   * @param color The color of the king to find
   * @returns The position of the king or undefined if not found
   */
  getKingPosition(color: PlayerColor): Position | undefined {
    const king = this.pieces.find(
      piece => piece.type === PieceType.KING && piece.color === color
    );
    return king ? { ...king.position } : undefined;
  }
  
  /**
   * Create a deep copy of the board
   * @returns A new Board instance with the same state
   */
  clone(): Board {
    const clonedBoard = new Board(false); // Don't set up initial position
    
    // Clone pieces
    this.pieces.forEach(piece => {
      clonedBoard.addPiece(piece.clone());
    });
    
    // Clone captured pieces
    this.capturedPieces.forEach(piece => {
      clonedBoard.capturedPieces.push(piece.clone());
    });
    
    // Copy other properties
    clonedBoard.currentState = this.currentState;
    clonedBoard.lastMove = this.lastMove ? { ...this.lastMove } : null;
    
    return clonedBoard;
  }
  
  /**
   * Get the last move made on the board
   * @returns The last move or null if no moves have been made
   */
  getLastMove(): { from: Position; to: Position } | null {
    return this.lastMove ? { ...this.lastMove } : null;
  }
} 