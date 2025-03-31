import { IBoard, IChessPiece } from '../contracts';
import { ChessPosition, ChessPieceColor, ChessPieceType, ChessPiece } from '../types';

// Create a minimal mock implementation of the IBoard interface for testing
class MockBoard implements IBoard {
  private pieces: IChessPiece[] = [];
  private turn: number = 1;
  private enPassantTarget: ChessPosition | null = null;

  constructor(pieces: IChessPiece[] = []) {
    this.pieces = [...pieces];
  }

  getPieceAt(position: string | ChessPosition): IChessPiece | undefined {
    const pos = position instanceof ChessPosition ? position : new ChessPosition(position);
    return this.pieces.find(p => p.position && p.position.equals(pos));
  }

  getAllPieces(): IChessPiece[] {
    return [...this.pieces];
  }

  getPiecesByColor(color: string | ChessPieceColor): IChessPiece[] {
    const c = color instanceof ChessPieceColor ? color : new ChessPieceColor(color);
    return this.pieces.filter(p => p.color.equals(c));
  }

  getCapturedPieces(): IChessPiece[] {
    // In this mock, we'll consider pieces without a position as captured
    return this.pieces.filter(p => !p.position);
  }

  getKingPosition(color: string | ChessPieceColor): ChessPosition | undefined {
    const c = color instanceof ChessPieceColor ? color : new ChessPieceColor(color);
    const king = this.pieces.find(p => p.type.value === 'k' && p.color.equals(c));
    return king?.position ?? undefined;
  }

  isValidMove(from: string | ChessPosition, to: string | ChessPosition): boolean {
    // Simple mock implementation - we'll consider any move valid if:
    // 1. There's a piece at 'from'
    // 2. The destination 'to' doesn't have a piece of the same color
    const fromPos = from instanceof ChessPosition ? from : new ChessPosition(from);
    const toPos = to instanceof ChessPosition ? to : new ChessPosition(to);
    
    const piece = this.getPieceAt(fromPos);
    if (!piece) return false;
    
    const targetPiece = this.getPieceAt(toPos);
    if (targetPiece && targetPiece.color.equals(piece.color)) return false;
    
    return true;
  }

  isInCheck(color: string | ChessPieceColor): boolean {
    // Mock implementation - always returns false for simplicity
    return false;
  }

  makeMove(from: string | ChessPosition, to: string | ChessPosition, promotion?: string | ChessPieceType): { 
    success: boolean, 
    captured?: IChessPiece, 
    check?: boolean, 
    checkmate?: boolean
  } {
    if (!this.isValidMove(from, to)) {
      return { success: false };
    }

    const fromPos = from instanceof ChessPosition ? from : new ChessPosition(from);
    const toPos = to instanceof ChessPosition ? to : new ChessPosition(to);
    
    const piece = this.getPieceAt(fromPos)!;
    const capturedPiece = this.getPieceAt(toPos);
    
    // Execute the move
    piece.move(toPos, this.turn);
    
    // If there was a piece at the destination, capture it
    if (capturedPiece) {
      // Use the move method with a null parameter to set position to null
      // This avoids the type error with direct assignment
      capturedPiece.move(null as any, this.turn);
    }

    // Handle promotion
    if (promotion && piece.type.value === 'p') {
      const promotionType = promotion instanceof ChessPieceType ? promotion : new ChessPieceType(promotion);
      piece.promote?.(promotionType);
    }

    this.turn++;
    
    return { 
      success: true, 
      captured: capturedPiece,
      check: false,
      checkmate: false
    };
  }

  clone(): IBoard {
    // Create a deep copy
    const clonedPieces = this.pieces.map(p => 
      new ChessPiece(
        new ChessPieceType(p.type.value),
        new ChessPieceColor(p.color.value),
        p.position ? new ChessPosition(p.position.value) : null,
        p.hasMoved,
        p.lastMoveTurn
      )
    );
    
    const clonedBoard = new MockBoard(clonedPieces);
    clonedBoard.turn = this.turn;
    clonedBoard.enPassantTarget = this.enPassantTarget ? 
      new ChessPosition(this.enPassantTarget.value) : null;
    
    return clonedBoard;
  }

  getCurrentTurn(): number {
    return this.turn;
  }

  getEnPassantTarget(): ChessPosition | null {
    return this.enPassantTarget;
  }

  // Additional helper for testing
  addPiece(piece: IChessPiece): void {
    this.pieces.push(piece);
  }
}

describe('IBoard Interface', () => {
  let board: IBoard;
  let whitePawn: IChessPiece;
  let whiteKing: IChessPiece;
  let blackPawn: IChessPiece;
  let blackKing: IChessPiece;

  beforeEach(() => {
    // Set up a board with some test pieces
    board = new MockBoard();
    
    whitePawn = new ChessPiece(
      new ChessPieceType('p'),
      new ChessPieceColor('w'),
      new ChessPosition('e2')
    );
    
    whiteKing = new ChessPiece(
      new ChessPieceType('k'),
      new ChessPieceColor('w'),
      new ChessPosition('e1')
    );
    
    blackPawn = new ChessPiece(
      new ChessPieceType('p'),
      new ChessPieceColor('b'),
      new ChessPosition('e7')
    );
    
    blackKing = new ChessPiece(
      new ChessPieceType('k'),
      new ChessPieceColor('b'),
      new ChessPosition('e8')
    );
    
    (board as MockBoard).addPiece(whitePawn);
    (board as MockBoard).addPiece(whiteKing);
    (board as MockBoard).addPiece(blackPawn);
    (board as MockBoard).addPiece(blackKing);
  });

  describe('piece retrieval methods', () => {
    it('should retrieve a piece at a specific position', () => {
      const piece = board.getPieceAt('e2');
      expect(piece).toBe(whitePawn);
      
      const notFound = board.getPieceAt('a3');
      expect(notFound).toBeUndefined();
    });

    it('should retrieve all pieces on the board', () => {
      const pieces = board.getAllPieces();
      expect(pieces.length).toBe(4);
      expect(pieces).toContain(whitePawn);
      expect(pieces).toContain(whiteKing);
      expect(pieces).toContain(blackPawn);
      expect(pieces).toContain(blackKing);
    });

    it('should retrieve pieces by color', () => {
      const whitePieces = board.getPiecesByColor('w');
      expect(whitePieces.length).toBe(2);
      expect(whitePieces).toContain(whitePawn);
      expect(whitePieces).toContain(whiteKing);
      
      const blackPieces = board.getPiecesByColor(new ChessPieceColor('b'));
      expect(blackPieces.length).toBe(2);
      expect(blackPieces).toContain(blackPawn);
      expect(blackPieces).toContain(blackKing);
    });

    it('should retrieve the king position for a color', () => {
      const whiteKingPos = board.getKingPosition('w');
      expect(whiteKingPos?.value).toBe('e1');
      
      const blackKingPos = board.getKingPosition('b');
      expect(blackKingPos?.value).toBe('e8');
    });
  });

  describe('move validation', () => {
    it('should validate legal moves', () => {
      // Moving to an empty square
      expect(board.isValidMove('e2', 'e4')).toBe(true);
      
      // Moving to a square with an opponent's piece (capture)
      const blackPawnAtE4 = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('b'),
        new ChessPosition('e4')
      );
      (board as MockBoard).addPiece(blackPawnAtE4);
      
      expect(board.isValidMove('e2', 'e4')).toBe(true);
    });

    it('should invalidate illegal moves', () => {
      // Moving from an empty square
      expect(board.isValidMove('a3', 'a4')).toBe(false);
      
      // Moving to a square with a friendly piece
      const whitePawnAtE4 = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );
      (board as MockBoard).addPiece(whitePawnAtE4);
      
      expect(board.isValidMove('e2', 'e4')).toBe(false);
    });
  });

  describe('making moves', () => {
    it('should make a valid move', () => {
      const result = board.makeMove('e2', 'e4');
      
      expect(result.success).toBe(true);
      expect(whitePawn.position?.value).toBe('e4');
      expect(whitePawn.hasMoved).toBe(true);
      expect(whitePawn.lastMoveTurn).toBe(1);
    });

    it('should handle capture moves', () => {
      // Place a black piece at e4
      const blackPawnAtE4 = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('b'),
        new ChessPosition('e4')
      );
      (board as MockBoard).addPiece(blackPawnAtE4);
      
      const result = board.makeMove('e2', 'e4');
      
      expect(result.success).toBe(true);
      expect(result.captured).toBe(blackPawnAtE4);
      expect(whitePawn.position?.value).toBe('e4');
      expect(blackPawnAtE4.position).toBeNull();
    });

    it('should handle pawn promotion', () => {
      // Move white pawn to promotion square
      whitePawn.position = 'b7'; // Using h8 for white promotion to match implementation
      
      const result = board.makeMove('b7', 'b8', new ChessPieceType('q'));
      
      expect(result.success).toBe(true);
      expect(whitePawn.position?.value).toBe('b8');
      expect(whitePawn.type.value).toBe('q');
    });

    it('should fail for invalid moves', () => {
      // Try to move from an empty square
      const result = board.makeMove('a3', 'a4');
      
      expect(result.success).toBe(false);
    });
  });

  describe('board state', () => {
    it('should return the current turn', () => {
      expect(board.getCurrentTurn()).toBe(1);
      
      // Make a move and verify turn increment
      board.makeMove('e2', 'e4');
      expect(board.getCurrentTurn()).toBe(2);
    });

    it('should create a deep copy when cloned', () => {
      const cloned = board.clone();
      
      // Verify pieces are the same but different instances
      const originalPieces = board.getAllPieces();
      const clonedPieces = cloned.getAllPieces();
      
      expect(clonedPieces.length).toBe(originalPieces.length);
      
      // Make a move on the original board and verify the clone is not affected
      board.makeMove('e2', 'e4');
      
      const originalE2Piece = board.getPieceAt('e2');
      const originalE4Piece = board.getPieceAt('e4');
      const clonedE2Piece = cloned.getPieceAt('e2');
      
      expect(originalE2Piece).toBeUndefined();
      expect(originalE4Piece).toBe(whitePawn);
      expect(clonedE2Piece).not.toBeUndefined();
      expect(clonedE2Piece?.type.value).toBe('p');
      expect(clonedE2Piece?.color.value).toBe('w');
    });
  });
}); 