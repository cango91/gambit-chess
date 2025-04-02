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

import { ChessPiece, ChessPieceColor, ChessPieceColorType, ChessPieceType, ChessPieceTypeType, ChessPosition, ChessPositionType } from './types';
import { isValidPieceMove } from './movement';
import { isKingInCheck, IBoardForCheckDetection, wouldMoveResolveCheck, wouldMoveLeaveKingInCheck } from './checkDetector';
import { IBoard, IChessPiece, IEnPassantData } from './contracts';
import { PIECE_COLOR, PIECE_TYPE, POSITION } from '..';

/**
 * Represents a non-authoritative snapshot of a chess board state
 */
export class Board implements IBoard, IBoardForCheckDetection {
  private pieces: Map<string, ChessPiece> = new Map();
  private capturedPieces: IChessPiece[] = [];
  private _currentMove: number = 1;
  
  /**
   * Creates a new board snapshot with optional initial position
   * @param setupBoard Whether to set up the initial position (default: true)
   */
  constructor(setupBoard: boolean = true) {
    if (setupBoard) {
      this.setupInitialPosition();
      this._currentMove = 1;
    }
  }
  setBoard(board: IBoard): void;
  setBoard(pieces: IChessPiece[], capturedPieces?: IChessPiece[], currentMoveNumber?: number): void;
  setBoard(pieces: unknown,  capturedPieces?: unknown, currentMoveNumber?: unknown): void {
    this.pieces.clear();
    this.capturedPieces = [];
    if(pieces instanceof Board || (pieces as IBoard).getAllPieces) {
      const board = pieces as IBoard;
      for (const piece of board.getAllPieces()) {
        this.addPiece(piece.type, piece.color, piece.position!, piece.lastMoveTurn);
      }
      this.capturedPieces = [...(board as IBoard).getCapturedPieces()];
      this._currentMove = board.currentMove;
    }else if (Array.isArray(pieces)) {
      for (const piece of pieces as IChessPiece[]) {
        this.addPiece(piece.type, piece.color, piece.position!, piece.lastMoveTurn);
      }
      if(capturedPieces && Array.isArray(capturedPieces)) { 
        this.capturedPieces = [...(capturedPieces as IChessPiece[])];
      }
      if(currentMoveNumber && typeof currentMoveNumber === 'number') {
        this._currentMove = currentMoveNumber;
      }else{
        this._currentMove = this.calculateCurrentMove(pieces as IChessPiece[]);
      }
    }else{
      throw new Error('Invalid arguments provided to setBoard');
    }
  }

  /**
   * Calculates the current move number based on the last move turn of the pieces
   * @param pieces The pieces on the board
   * @returns The current move number
   */
  private calculateCurrentMove(pieces: IChessPiece[]): number {
    const lastTurnData = pieces.reduce((acc: {blackMaxTurn: number, whiteMaxTurn: number}, piece) =>{
      if(piece.lastMoveTurn && piece.lastMoveTurn) {
        if(piece.lastMoveTurn >= (piece.color.value === 'w' ? acc.whiteMaxTurn : acc.blackMaxTurn))
        {
          acc[`${piece.color.toString()}MaxTurn` as keyof typeof acc] = piece.lastMoveTurn;
        }
      }
      return acc;
    }, {blackMaxTurn: 0, whiteMaxTurn: 0});
    if(lastTurnData.blackMaxTurn === lastTurnData.whiteMaxTurn) {
      return lastTurnData.blackMaxTurn * 2 + 1;
    }else if(lastTurnData.whiteMaxTurn > lastTurnData.blackMaxTurn) {
      return lastTurnData.whiteMaxTurn * 2;
    }else{
      throw new Error('Invalid board state: black has moved more times than white');
    }
  }

  /**
   * Checks if a piece could potentially be en passant captured, ignoring whether there are 
   * pawns available to perform the en passant capture.
   * @param piece The piece to check
   * @returns True if the piece could be en passant captured, false otherwise
   */
  private canPieceBeEnPassantCaptured(piece: IChessPiece): boolean {
    if(piece.type.value === 'p'  // only pawns can be en passant captured
      && piece.hasMoved  // must have moved at least once
      && piece.position  // must be on the board
      && piece.position.y === (this.playerToMove === 'w' ? 4 : 3) // must be on the correct rank
      && piece.lastMoveTurn === (this.playerToMove === 'w' ? this._currentMove - 1 : this._currentMove) // must have moved in the previous move
      && piece.firstMoveTurn === piece.lastMoveTurn)  // last move must be the first move (coupled with correct rank, this means the piece must have moved two squares forward)
      {
      return true;
    }
    return false;
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
  public addPiece(type: ChessPieceTypeType, color: ChessPieceColorType, position: ChessPositionType, lastMoveTurn: number | undefined = undefined): ChessPiece {
    const typ = PIECE_TYPE(type);  
    const col = PIECE_COLOR(color);
    const pos = POSITION(position);
    const piece = new ChessPiece(typ, col, pos, lastMoveTurn !== undefined, lastMoveTurn);
    this.pieces.set(pos.value, piece);
    return piece;
  }
  
  /**
   * Removes a piece from the board
   * @param position Position to remove piece from
   * @returns The removed piece or undefined if no piece at that position
   */
  public removePiece(position: ChessPositionType): ChessPiece | undefined {
    const piece = this.getPieceAt(position);
    if (piece) {
      this.pieces.delete(piece.position!.value);
      piece.removeFromBoard();
      this.capturedPieces.push(piece);
    }
    return piece;
  }
  
  /**
   * Gets the piece at a specific position
   * @param position Position to check
   * @returns The piece at that position or undefined if empty
   */
  public getPieceAt(position: ChessPositionType): ChessPiece | undefined {
    const pos = POSITION(position);
    return this.pieces.get(pos.value) ?? undefined;
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
  public getCapturedPieces(): IChessPiece[] {
    return [...this.capturedPieces];
  }
  
  /**
   * Gets all pieces of a specific color
   * @param color The color to filter by
   * @returns Array of pieces of the specified color
   */
  public getPiecesByColor(color: ChessPieceColorType): ChessPiece[] {
    const playerColor = PIECE_COLOR(color);
    return this.getAllPieces().filter(piece => piece.color.equals(playerColor));
  }
  
  /**
   * Gets the position of the king for a specific color
   * @param color King color to find
   * @returns Position of the king or undefined if not found
   */
  public getKingPosition(color: ChessPieceColorType): ChessPosition | undefined {
    const playerColor = PIECE_COLOR(color);
    const kingType = PIECE_TYPE('k');
    const king = this.getAllPieces().find(piece => piece.type.equals(kingType) && piece.color.equals(playerColor));
    return king?.position ?? undefined;
  }
  
  /**
   * Gets the current turn number
   * @returns The current turn number
   */
  get currentTurn(): number {
    return Math.ceil(this._currentMove / 2);
  }

  /**
   * Gets the current move number
   * @returns The current move number
   */
  get currentMove(): number {
    return this._currentMove;
  }

  get playerToMove(): 'w' | 'b' {
    return this._currentMove % 2 === 0 ? 'b' : 'w';
  }

  /**
   * Calculate if en passant capture is possible and if so, the target position
   */
  get enPassantData(): IEnPassantData {
    const lastMovedPiece = this.getLastMovedPiece();
    if(lastMovedPiece && this.canPieceBeEnPassantCaptured(lastMovedPiece)) {
      const possible = [
        POSITION([lastMovedPiece.position!.x + 1, lastMovedPiece.position!.y]),
        POSITION([lastMovedPiece.position!.x - 1, lastMovedPiece.position!.y])
      ].map(pos=> this.getPieceAt(pos)).filter(piece => piece && piece.type.value === 'p' && piece.color.value === this.playerToMove).length > 0;
      const target = possible ? this.playerToMove === 'w' ? POSITION([lastMovedPiece.position!.x, lastMovedPiece.position!.y +1]) : POSITION([lastMovedPiece.position!.x, lastMovedPiece.position!.y -1]) : null;
      return {
        possible,
        target
      }
    }
    return { possible: false, target: null };
  }

  
  /**
   * Checks if a move is valid according to chess rules
   * This includes checking if the move would leave the player's own king in check.
   * 
   * @param from Starting position
   * @param to Destination position
   * @returns True if the move is valid, false otherwise
   */
  public isValidMove(from: ChessPositionType, to: ChessPositionType): boolean {
    const fromPos = POSITION(from);
    const toPos = POSITION(to);
    
    // Get the piece at the starting position
    const piece = this.getPieceAt(fromPos);
    if (!piece) {
      return false;
    }
    
    // Check if destination is occupied by a piece of the same color
    const destPiece = this.getPieceAt(toPos);
    if (destPiece && destPiece.color === piece.color) {
      return false;
    }
    
    let isCapture = destPiece !== undefined;
    // Check for en passant capture
    if(this.enPassantData.possible && this.enPassantData.target === toPos) {
      isCapture = true;
    }
    
    // Check for castling
    if (piece.type.value === 'k' && this.isCastlingMove(fromPos, toPos)) {
      return this.isValidCastling(fromPos, toPos);
    }
    
    // Check if the move pattern is valid for this piece type
    const isValid = isValidPieceMove(
      piece.type,
      fromPos,
      toPos,
      piece.color.value === 'white',
      isCapture,
      !piece.hasMoved // Pass whether this is the piece's first move (for pawns)
    );
    
    if (!isValid) {
      return false;
    }
    
    // For sliding pieces, check if the path is clear
    if (['b', 'r', 'q'].includes(piece.type.value)) {
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
   * Gets the last moved piece on the board, or that of the specified color
   * @param ofColor The color of the piece to get the last moved piece of
   * @returns The last moved piece of the specified color
   */
  private getLastMovedPiece(ofColor?: ChessPieceColorType): IChessPiece | undefined {
    const pieces = this.getPiecesByColor(ofColor ?? this.playerToMove === 'w' ? 'black' : 'white');
    return pieces.sort((a, b) => a.lastMoveTurn! - b.lastMoveTurn!)[0];
  }
  
  /**
   * Determines if a move is a castling attempt
   * @param from Starting position
   * @param to Destination position
   * @returns True if this is a castling move
   */
  private isCastlingMove(from: ChessPositionType, to: ChessPositionType): boolean {
    const fromPos = POSITION(from);
    const toPos = POSITION(to);
    // King starting positions
    const isWhiteKing = fromPos.value === 'e1';
    const isBlackKing = fromPos.value === 'e8';
    
    // If it's not a king on its starting square, it's not castling
    if (!isWhiteKing && !isBlackKing) {
      return false;
    }
    
    // Kingside castling destinations
    if (toPos.value === 'g1' || toPos.value === 'g8') {
      return true;
    }
    
    // Queenside castling destinations
    if (toPos.value === 'c1' || toPos.value === 'c8') {
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
  private isValidCastling(kingFrom: ChessPosition, kingTo: ChessPosition): boolean {
    const king = this.getPieceAt(kingFrom);
    if (!king || king.type.value !== 'k' || king.hasMoved) {
      return false;
    }
    
    // Determine if kingside or queenside
    const isKingside = kingTo.value[0] === 'g';
    
    // Determine rook position based on king color and castling type
    let rookPos: ChessPosition;
    if (king.color.equals(PIECE_COLOR('white'))) {
      rookPos = isKingside ? POSITION('h1') : POSITION('a1');
    } else {
      rookPos = isKingside ? POSITION('h8') : POSITION('a8');
    }
    
    // Check if rook exists and hasn't moved
    const rook = this.getPieceAt(rookPos);
    if (!rook || rook.type.value !== 'r' || rook.hasMoved) {
      return false;
    }
    // Check if king is in check
    if (this.isInCheck(king.color)) {
      return false;
    }

    // Check if path between king and rook is clear and if so, simulate the move and check if the king is in check
    const betweenPositions = isKingside
      ? [kingFrom.value[0] === 'e' ? 'f' + kingFrom.value[1] : 'f' + kingTo.value[1]]
      : [kingFrom.value[0] === 'e' ? 'd' + kingFrom.value[1] : 'd' + kingTo.value[1], 
         kingFrom.value[0] === 'e' ? 'b' + kingFrom.value[1] : 'b' + kingTo.value[1]];
    for (const pos of betweenPositions) {
      if (this.getPieceAt(pos)) {
        return false; // Path is not clear
      }
      const testBoard = this.clone();
      testBoard.removePiece(kingFrom);
      testBoard.addPiece(king.type, king.color, POSITION(pos));
      if (testBoard.isInCheck(king.color)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Checks if the path between two positions is clear of pieces
   * @param from Starting position
   * @param to Destination position
   * @returns True if path is clear, false if blocked
   */
  private isPathClear(from: ChessPositionType, to: ChessPositionType): boolean {
    const fromPos = POSITION(from);
    const toPos = POSITION(to);
    const [fromX, fromY] = fromPos.toCoordinates() ?? new Error(`Invalid from position: ${from}`);
    const [toX, toY] = toPos.toCoordinates();
    
    // Calculate direction vector
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    
    // Start from position after 'from' and check each square until 'to' (exclusive)
    let x = fromX + dx;
    let y = fromY + dy;
    
    while (x !== toX || y !== toY) {
      if (this.getPieceAt([x,y])) {
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
  public isInCheck(color: ChessPieceColor): boolean {
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
  public makeMove(from: ChessPositionType, to: ChessPositionType, promotion?: ChessPieceTypeType): { 
    success: boolean, 
    captured?: ChessPiece, 
    check?: boolean
  } {
    if (!this.isValidMove(from, to)) {
      return { success: false };
    }

    const fromPos = POSITION(from);
    const toPos = POSITION(to);
    
    const piece = this.getPieceAt(fromPos)!;
    const destPiece = this.getPieceAt(toPos);
    let captured: ChessPiece | undefined = destPiece;
    
    // Handle en passant capture
    if (piece.type.value === 'p' && toPos === this.enPassantData.target) {
      // The captured pawn is not on the destination square but behind it
      const captureY = piece.color.equals(PIECE_COLOR('white')) ? 4 : 3; // Rank 5 for white, rank 4 for black
      const capturePos = POSITION([toPos.toCoordinates()[0], captureY]);
      captured = this.removePiece(capturePos);
    } else if (destPiece) {
      // Regular capture
      this.removePiece(toPos.value);
    }
    
    // Handle castling
    if (piece.type.value === 'k' && this.isCastlingMove(fromPos, toPos)) {
      this.executeCastling(fromPos, toPos);
    } else {
      // Regular move
      this.pieces.delete(fromPos.value);
      piece.move(toPos, this.currentTurn);
      this.pieces.set(toPos.value, piece);
    }

    // move the piece to the new position
    piece.move(toPos, this.currentTurn);
    
    // Handle pawn promotion
    if (piece.type.value === 'p' && (toPos.value[1] === '8' || toPos.value[1] === '1')) {
      if (promotion) {
        piece.promote(ChessPieceType.from(promotion));
      } else {
        // Default promotion to queen
        piece.promote(ChessPieceType.from('q'));
      }

    }

    // Update the board
    this.pieces.set(toPos.value, piece);
    this.pieces.delete(fromPos.value);
    
    // Increment turn counter after the move
    this._currentMove++;
    
    // Check for check
    const opponentColor = piece.color.equals(ChessPieceColor.from('white')) ? ChessPieceColor.from('black') : ChessPieceColor.from('white');
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
  private executeCastling(kingFrom: ChessPosition, kingTo: ChessPosition): void {
    const king = this.getPieceAt(kingFrom)!;
    const kingToPos = POSITION(kingTo);
    const kingFromPos = POSITION(kingFrom);
    // Determine if kingside or queenside
    const isKingside = kingToPos.value[0] === 'g';
    
    // Move king
    king.move(kingToPos, this.currentTurn);
    this.pieces.delete(kingFromPos.value);
    this.pieces.set(kingToPos.value, king);
    
    // Determine rook positions
    const rank = king.color.equals(ChessPieceColor.from('white')) ? '1' : '8';
    const rookFrom = isKingside ? 'h' + rank : 'a' + rank;
    const rookTo = isKingside ? 'f' + rank : 'd' + rank;
    const rookFromPos = POSITION(rookFrom) ?? new Error(`Invalid rookFrom position: ${rookFrom}`);
    const rookToPos = POSITION(rookTo) ?? new Error(`Invalid rookTo position: ${rookTo}`);
    
    // Move rook
    const rook = this.getPieceAt(rookFromPos)!;
    this.pieces.delete(rookFromPos.value);
    rook.move(rookToPos, this.currentTurn);
    this.pieces.set(rookToPos.value, rook);
  }
  
  /**
   * Creates a deep copy of the board
   * @returns A new BoardSnapshot object with the same state
   */
  public clone(): Board {
    const clone = new Board(false);
    
    // Copy all pieces
    for (const piece of this.getAllPieces()) {
      clone.addPiece(piece.type, piece.color, piece.position!, piece.lastMoveTurn);

    }
    
    // Copy captured pieces
    clone.capturedPieces = [...this.capturedPieces];
    
    // Copy other state
    clone._currentMove = this._currentMove;
    
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

        const piece = this.getPieceAt([x,y]);
        
        if (piece) {
          // Use uppercase for white, lowercase for black
          let symbol = piece.type;
          if (piece.color.equals(ChessPieceColor.from('white'))) {
            // Convert to uppercase for display only, doesn't change the type
            result += symbol.toString().toUpperCase() + ' ';
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