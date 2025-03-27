/**
 * Represents a chess board snapshot at a point in time.
 * 
 * This class provides utilities for validating and making moves according to chess rules.
 * It handles piece movement, position validation, and check detection.
 * 
 * IMPORTANT DOMAIN BOUNDARY:
 * Game progression logic such as checkmate, stalemate, draw detection,
 * and game termination are NOT implemented here. These belong exclusively
 * to the server domain as the authoritative source of truth.
 * 
 * The shared layer (including this class) provides only:
 * - Chess piece movement validation
 * - Board state representation
 * - Check detection for move validation
 * 
 * The server layer is responsible for:
 * - Checkmate detection
 * - Stalemate detection
 * - Draw condition evaluation
 * - Game termination logic
 * - Player turn management
 */

import { ChessPiece, PieceColor, PieceType, Position, IBoard } from '../types';
import { isValidPosition, positionToCoordinates, coordinatesToPosition } from '../utils/position';
import { isValidPieceMove } from './movement';
import { isKingInCheck, IBoardForCheckDetection, wouldMoveResolveCheck, wouldMoveLeaveKingInCheck } from './checkDetector';

/**
 * Represents a non-authoritative snapshot of a chess board state
 */
export class BoardSnapshot implements IBoard, IBoardForCheckDetection {
  private pieces: Map<Position, ChessPiece> = new Map();
  private capturedPieces: ChessPiece[] = [];
  private currentTurn: number = 1;
  private enPassantTarget: Position | null = null;
  
  /**
   * Creates a new board snapshot with optional initial position
   * @param setupBoard Whether to set up the initial position (default: true)
   */
  constructor(setupBoard: boolean = true) {
    if (setupBoard) {
      this.setupInitialPosition();
    }
  }
  
  /**
   * Sets up the standard initial chess position
   */
  private setupInitialPosition(): void {
    // Initialize pawns
    for (let file = 0; file < 8; file++) {
      const fileChar = String.fromCharCode(97 + file); // 'a' to 'h'
      
      // White pawns on rank 2
      this.addPiece('p', 'white', `${fileChar}2`);
      
      // Black pawns on rank 7
      this.addPiece('p', 'black', `${fileChar}7`);
    }
    
    // Initialize white pieces on rank 1
    this.addPiece('r', 'white', 'a1');
    this.addPiece('n', 'white', 'b1');
    this.addPiece('b', 'white', 'c1');
    this.addPiece('q', 'white', 'd1');
    this.addPiece('k', 'white', 'e1');
    this.addPiece('b', 'white', 'f1');
    this.addPiece('n', 'white', 'g1');
    this.addPiece('r', 'white', 'h1');
    
    // Initialize black pieces on rank 8
    this.addPiece('r', 'black', 'a8');
    this.addPiece('n', 'black', 'b8');
    this.addPiece('b', 'black', 'c8');
    this.addPiece('q', 'black', 'd8');
    this.addPiece('k', 'black', 'e8');
    this.addPiece('b', 'black', 'f8');
    this.addPiece('n', 'black', 'g8');
    this.addPiece('r', 'black', 'h8');
  }
  
  /**
   * Adds a piece to the board
   * @param type Piece type
   * @param color Piece color
   * @param position Position on the board
   * @returns The newly created piece
   */
  public addPiece(type: PieceType, color: PieceColor, position: Position): ChessPiece {
    if (!isValidPosition(position)) {
      throw new Error(`Invalid position: ${position}`);
    }
    
    const piece: ChessPiece = { 
      type, 
      color, 
      position,
      hasMoved: false  // Initially, pieces haven't moved
    };
    this.pieces.set(position, piece);
    return piece;
  }
  
  /**
   * Removes a piece from the board
   * @param position Position to remove piece from
   * @returns The removed piece or undefined if no piece at that position
   */
  public removePiece(position: Position): ChessPiece | undefined {
    const piece = this.pieces.get(position);
    if (piece) {
      this.pieces.delete(position);
      this.capturedPieces.push({ ...piece });
    }
    return piece;
  }
  
  /**
   * Gets the piece at a specific position
   * @param position Position to check
   * @returns The piece at that position or undefined if empty
   */
  public getPiece(position: Position): ChessPiece | undefined {
    return this.pieces.get(position);
  }
  
  /**
   * Gets all pieces currently on the board
   * @returns Array of all pieces
   */
  public getAllPieces(): ChessPiece[] {
    return Array.from(this.pieces.values());
  }
  
  /**
   * Gets all captured pieces
   * @returns Array of captured pieces
   */
  public getCapturedPieces(): ChessPiece[] {
    return [...this.capturedPieces];
  }
  
  /**
   * Gets all pieces of a specific color
   * @param color The color to filter by
   * @returns Array of pieces of the specified color
   */
  public getPiecesByColor(color: PieceColor): ChessPiece[] {
    return this.getAllPieces().filter(piece => piece.color === color);
  }
  
  /**
   * Gets the position of the king for a specific color
   * @param color King color to find
   * @returns Position of the king or undefined if not found
   */
  public getKingPosition(color: PieceColor): Position | undefined {
    const king = this.getAllPieces().find(piece => piece.type === 'k' && piece.color === color);
    return king?.position;
  }
  
  /**
   * Gets the current turn number
   * @returns The current turn number
   */
  public getCurrentTurn(): number {
    return this.currentTurn;
  }
  
  /**
   * Gets the current en passant target position, if any
   * @returns The en passant target position or null
   */
  public getEnPassantTarget(): Position | null {
    return this.enPassantTarget;
  }
  
  /**
   * Checks if a move is valid according to chess rules
   * This includes checking if the move would leave the player's own king in check.
   * 
   * @param from Starting position
   * @param to Destination position
   * @returns True if the move is valid, false otherwise
   */
  public isValidMove(from: Position, to: Position): boolean {
    if (!isValidPosition(from) || !isValidPosition(to)) {
      return false;
    }
    
    // Get the piece at the starting position
    const piece = this.getPiece(from);
    if (!piece) {
      return false;
    }
    
    // Check if destination is occupied by a piece of the same color
    const destPiece = this.getPiece(to);
    if (destPiece && destPiece.color === piece.color) {
      return false;
    }
    
    // Check for en passant capture
    let isCapture = destPiece !== undefined;
    if (piece.type === 'p' && !destPiece && to === this.enPassantTarget) {
      // This is an en passant capture
      isCapture = true;
    }
    
    // Check for castling
    if (piece.type === 'k' && this.isCastlingMove(from, to)) {
      return this.isValidCastling(from, to);
    }
    
    // Check if the move pattern is valid for this piece type
    const isValid = isValidPieceMove(
      piece.type,
      from,
      to,
      piece.color === 'white',
      isCapture,
      !piece.hasMoved // Pass whether this is the piece's first move (for pawns)
    );
    
    if (!isValid) {
      return false;
    }
    
    // For sliding pieces, check if the path is clear
    if (['b', 'r', 'q'].includes(piece.type)) {
      if (!this.isPathClear(from, to)) {
        return false;
      }
    }
    
    // Finally, check if the move would leave the player's own king in check
    if (wouldMoveLeaveKingInCheck(this, from, to)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Determines if a move is a castling attempt
   * @param from Starting position
   * @param to Destination position
   * @returns True if this is a castling move
   */
  private isCastlingMove(from: Position, to: Position): boolean {
    // King starting positions
    const isWhiteKing = from === 'e1';
    const isBlackKing = from === 'e8';
    
    // If it's not a king on its starting square, it's not castling
    if (!isWhiteKing && !isBlackKing) {
      return false;
    }
    
    // Kingside castling destinations
    if (to === 'g1' || to === 'g8') {
      return true;
    }
    
    // Queenside castling destinations
    if (to === 'c1' || to === 'c8') {
      return true;
    }
    
    return false;
  }
  
  /**
   * Checks if a castling move is valid
   * @param kingFrom King's starting position
   * @param kingTo King's destination position
   * @returns True if castling is valid
   */
  private isValidCastling(kingFrom: Position, kingTo: Position): boolean {
    const king = this.getPiece(kingFrom);
    if (!king || king.type !== 'k' || king.hasMoved) {
      return false;
    }
    
    // Determine if kingside or queenside
    const isKingside = kingTo[0] === 'g';
    const isQueenside = kingTo[0] === 'c';
    
    // Determine rook position based on king color and castling type
    let rookPos: Position;
    if (king.color === 'white') {
      rookPos = isKingside ? 'h1' : 'a1';
    } else {
      rookPos = isKingside ? 'h8' : 'a8';
    }
    
    // Check if rook exists and hasn't moved
    const rook = this.getPiece(rookPos);
    if (!rook || rook.type !== 'r' || rook.hasMoved) {
      return false;
    }
    
    // Check if path between king and rook is clear
    const betweenPositions = isKingside
      ? [kingFrom[0] === 'e' ? 'f' + kingFrom[1] : 'f' + kingTo[1]]
      : [kingFrom[0] === 'e' ? 'd' + kingFrom[1] : 'd' + kingTo[1], 
         kingFrom[0] === 'e' ? 'b' + kingFrom[1] : 'b' + kingTo[1]];
    
    for (const pos of betweenPositions) {
      if (this.getPiece(pos)) {
        return false; // Path is not clear
      }
    }
    
    // Check if king is in check
    if (this.isInCheck(king.color)) {
      return false;
    }
    
    // Check if king passes through check
    const testBoard = this.clone();
    const kingPassesThroughPos = isKingside
      ? kingFrom[0] === 'e' ? 'f' + kingFrom[1] : 'f' + kingTo[1]
      : kingFrom[0] === 'e' ? 'd' + kingFrom[1] : 'd' + kingTo[1];
    
    // Simulate king at intermediate position to check if it would be in check
    const testKing = testBoard.getPiece(kingFrom)!;
    testBoard.pieces.delete(kingFrom);
    testKing.position = kingPassesThroughPos;
    testBoard.pieces.set(kingPassesThroughPos, testKing);
    
    if (testBoard.isInCheck(king.color)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Checks if the path between two positions is clear of pieces
   * @param from Starting position
   * @param to Destination position
   * @returns True if path is clear, false if blocked
   */
  private isPathClear(from: Position, to: Position): boolean {
    const [fromX, fromY] = positionToCoordinates(from);
    const [toX, toY] = positionToCoordinates(to);
    
    // Calculate direction vector
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    
    // Start from position after 'from' and check each square until 'to' (exclusive)
    let x = fromX + dx;
    let y = fromY + dy;
    
    while (x !== toX || y !== toY) {
      const position = coordinatesToPosition(x, y);
      if (this.getPiece(position)) {
        return false; // Path is blocked
      }
      
      x += dx;
      y += dy;
    }
    
    return true;
  }
  
  /**
   * Checks if the king of a specific color is in check
   * @param color King color to check
   * @returns True if the king is in check, false otherwise
   */
  public isInCheck(color: PieceColor): boolean {
    // Delegate to the shared isKingInCheck function
    return isKingInCheck(this, color);
  }
  
  /**
   * Makes a move on the board
   * @param from Starting position
   * @param to Destination position
   * @param promotion Promotion piece type (if pawn promotion)
   * @returns Object with move information
   */
  public makeMove(from: Position, to: Position, promotion?: PieceType): { 
    success: boolean, 
    captured?: ChessPiece, 
    check?: boolean
  } {
    if (!this.isValidMove(from, to)) {
      return { success: false };
    }
    
    const piece = this.getPiece(from)!;
    const destPiece = this.getPiece(to);
    let captured: ChessPiece | undefined = destPiece;
    
    // Reset en passant target from previous move
    const oldEnPassantTarget = this.enPassantTarget;
    this.enPassantTarget = null;
    
    // Handle en passant capture
    if (piece.type === 'p' && to === oldEnPassantTarget) {
      // The captured pawn is not on the destination square but behind it
      const captureY = piece.color === 'white' ? 4 : 3; // Rank 5 for white, rank 4 for black
      const capturePos = coordinatesToPosition(positionToCoordinates(to)[0], captureY);
      captured = this.removePiece(capturePos);
    } else if (destPiece) {
      // Regular capture
      this.removePiece(to);
    }
    
    // Handle castling
    if (piece.type === 'k' && this.isCastlingMove(from, to)) {
      this.executeCastling(from, to);
    } else {
      // Regular move
      this.pieces.delete(from);
      piece.position = to;
      piece.hasMoved = true;
      piece.lastMoveTurn = this.currentTurn;
      this.pieces.set(to, piece);
    }
    
    // Check for pawn double move and set en passant target
    if (piece.type === 'p' && !piece.hasMoved) {
      const [fromX, fromY] = positionToCoordinates(from);
      const [toX, toY] = positionToCoordinates(to);
      
      // If pawn moved two squares
      if (Math.abs(toY - fromY) === 2) {
        // The en passant target is the square behind the pawn
        const enPassantY = (fromY + toY) / 2; // Middle square
        this.enPassantTarget = coordinatesToPosition(toX, enPassantY);
      }
    }
    
    // Handle pawn promotion
    if (piece.type === 'p' && (to[1] === '8' || to[1] === '1')) {
      if (promotion) {
        piece.type = promotion;
      } else {
        // Default promotion to queen
        piece.type = 'q';
      }
    }
    
    // Increment turn counter after the move
    this.currentTurn++;
    
    // Check for check
    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    const check = this.isInCheck(opponentColor);
    
    return {
      success: true,
      captured,
      check
    };
  }
  
  /**
   * Executes a castling move
   * @param kingFrom King's starting position
   * @param kingTo King's destination position
   */
  private executeCastling(kingFrom: Position, kingTo: Position): void {
    const king = this.getPiece(kingFrom)!;
    
    // Determine if kingside or queenside
    const isKingside = kingTo[0] === 'g';
    
    // Move king
    this.pieces.delete(kingFrom);
    king.position = kingTo;
    king.hasMoved = true;
    king.lastMoveTurn = this.currentTurn;
    this.pieces.set(kingTo, king);
    
    // Determine rook positions
    const rank = king.color === 'white' ? '1' : '8';
    const rookFrom = isKingside ? 'h' + rank : 'a' + rank;
    const rookTo = isKingside ? 'f' + rank : 'd' + rank;
    
    // Move rook
    const rook = this.getPiece(rookFrom)!;
    this.pieces.delete(rookFrom);
    rook.position = rookTo;
    rook.hasMoved = true;
    rook.lastMoveTurn = this.currentTurn;
    this.pieces.set(rookTo, rook);
  }
  
  /**
   * Creates a deep copy of the board
   * @returns A new BoardSnapshot object with the same state
   */
  public clone(): BoardSnapshot {
    const clone = new BoardSnapshot(false);
    
    // Copy all pieces
    for (const piece of this.getAllPieces()) {
      const clonedPiece = clone.addPiece(piece.type, piece.color, piece.position);
      clonedPiece.hasMoved = piece.hasMoved;
      if (piece.lastMoveTurn !== undefined) {
        clonedPiece.lastMoveTurn = piece.lastMoveTurn;
      }
    }
    
    // Copy captured pieces
    clone.capturedPieces = [...this.capturedPieces];
    
    // Copy other state
    clone.currentTurn = this.currentTurn;
    clone.enPassantTarget = this.enPassantTarget;
    
    return clone;
  }
  
  /**
   * Converts the board to a string representation for debugging
   * @returns String representation of the board
   */
  public toString(): string {
    let result = '';
    
    for (let y = 7; y >= 0; y--) {
      result += `${y + 1} `;
      
      for (let x = 0; x < 8; x++) {
        const position = coordinatesToPosition(x, y);
        const piece = this.getPiece(position);
        
        if (piece) {
          // Use uppercase for white, lowercase for black
          let symbol = piece.type;
          if (piece.color === 'white') {
            // Convert to uppercase for display only, doesn't change the type
            result += symbol.toUpperCase() + ' ';
          } else {
            result += symbol + ' ';
          }
        } else {
          result += '. ';
        }
      }
      
      result += '\n';
    }
    
    result += '  a b c d e f g h';
    
    return result;
  }
} 