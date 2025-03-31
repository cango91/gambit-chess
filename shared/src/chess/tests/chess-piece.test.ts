import { ChessPiece, ChessPieceColor, ChessPieceType, ChessPosition } from '../types';

describe('ChessPiece', () => {
  describe('constructor', () => {
    it('should create a valid chess piece', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4'),
        false,
        undefined
      );

      expect(piece.type.value).toBe('p');
      expect(piece.color.value).toBe('w');
      expect(piece.position?.value).toBe('e4');
      expect(piece.hasMoved).toBe(false);
      expect(piece.lastMoveTurn).toBeUndefined();
    });

    it('should create a piece with move history', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4'),
        true,
        5
      );

      expect(piece.hasMoved).toBe(true);
      expect(piece.lastMoveTurn).toBe(5);
    });
  });

  describe('getters and setters', () => {
    it('should get properties correctly', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );

      expect(piece.type).toBeInstanceOf(ChessPieceType);
      expect(piece.color).toBeInstanceOf(ChessPieceColor);
      expect(piece.position).toBeInstanceOf(ChessPosition);
    });

    it('should set position correctly', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );

      piece.position = 'e5';
      expect(piece.position?.value).toBe('e5');

      piece.position = [4, 5]; // e6
      expect(piece.position?.value).toBe('e6');

      piece.position = { x: 4, y: 6 }; // e7
      expect(piece.position?.value).toBe('e7');

      piece.position = new ChessPosition('e8');
      expect(piece.position?.value).toBe('e8');

      piece.position = null;
      expect(piece.position).toBeNull();
    });

    it('should set hasMoved correctly', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );

      expect(piece.hasMoved).toBe(false);
      piece.hasMoved = true;
      expect(piece.hasMoved).toBe(true);
    });

    it('should set lastMoveTurn correctly', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );

      expect(piece.lastMoveTurn).toBeUndefined();
      piece.lastMoveTurn = 10;
      expect(piece.lastMoveTurn).toBe(10);
    });
  });

  describe('move method', () => {
    it('should update position and set hasMoved when moving a piece', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e2')
      );

      piece.move('e4', 1);
      
      expect(piece.position?.value).toBe('e4');
      expect(piece.hasMoved).toBe(true);
      expect(piece.lastMoveTurn).toBe(1);
    });

    it('should update position with various input types', () => {
      const piece = new ChessPiece(
        new ChessPieceType('n'),
        new ChessPieceColor('w'),
        new ChessPosition('g1')
      );

      piece.move('f3', 1);
      expect(piece.position?.value).toBe('f3');

      piece.move([5, 4], 2); // f5
      expect(piece.position?.value).toBe('f5');
    });

    it('should keep lastMoveTurn if not provided', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e2'),
        false,
        5
      );

      piece.move('e4');
      
      expect(piece.position?.value).toBe('e4');
      expect(piece.hasMoved).toBe(true);
      expect(piece.lastMoveTurn).toBe(5);
    });
  });

  describe('promotion', () => {
    it('should promote a black pawn on h1', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('b'),
        new ChessPosition('h1')
      );

      piece.promote(new ChessPieceType('q'));
      expect(piece.type.value).toBe('q');
    });

    it('should promote a white pawn on h8', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('h8')
      );

      piece.promote(new ChessPieceType('n'));
      expect(piece.type.value).toBe('n');
    });

    it('should not promote a pawn in the middle of the board', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );

      piece.promote(new ChessPieceType('q'));
      expect(piece.type.value).toBe('p'); // No promotion
    });

    it('should not promote on the wrong rank', () => {
      // White pawn on last rank but not h-file
      const whitePiece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e1')
      );

      whitePiece.promote(new ChessPieceType('q'));
      expect(whitePiece.type.value).toBe('p'); // No promotion
      
      // Black pawn on last rank but not h-file
      const blackPiece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('b'),
        new ChessPosition('e8')
      );

      blackPiece.promote(new ChessPieceType('q'));
      expect(blackPiece.type.value).toBe('p'); // No promotion
    });

    it('should not promote non-pawn pieces', () => {
      const piece = new ChessPiece(
        new ChessPieceType('r'),
        new ChessPieceColor('w'),
        new ChessPosition('h1')
      );

      piece.promote(new ChessPieceType('q'));
      expect(piece.type.value).toBe('r'); // No promotion
    });

    it('should only promote to valid piece types', () => {
      const piece = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('b'),
        new ChessPosition('h1')
      );

      piece.promote(new ChessPieceType('p')); // Can't promote to pawn
      expect(piece.type.value).toBe('p');

      piece.promote(new ChessPieceType('k')); // Can't promote to king
      expect(piece.type.value).toBe('p');

      piece.promote(new ChessPieceType('q')); // Can promote to queen
      expect(piece.type.value).toBe('q');
    });
  });

  describe('static factory methods', () => {
    it('should create a piece from string notation', () => {
      const piece = ChessPiece.fromString('p w e4');
      
      expect(piece?.type.value).toBe('p');
      expect(piece?.color.value).toBe('w');
      expect(piece?.position?.value).toBe('e4');
    });

    it('should create a piece with move history from string notation', () => {
      const piece = ChessPiece.fromString('p w e4 10');
      
      expect(piece?.type.value).toBe('p');
      expect(piece?.color.value).toBe('w');
      expect(piece?.position?.value).toBe('e4');
      expect(piece?.hasMoved).toBe(true);
      expect(piece?.lastMoveTurn).toBe(10);
    });

    it('should create a piece from compact notation', () => {
      const piece = ChessPiece.fromString('pw@e4');
      
      expect(piece?.type.value).toBe('p');
      expect(piece?.color.value).toBe('w');
      expect(piece?.position?.value).toBe('e4');
    });

    it('should return undefined for invalid string', () => {
      expect(ChessPiece.fromString('')).toBeUndefined();
      expect(ChessPiece.fromString('invalid')).toBeUndefined();
    });

    it('should create a piece using from with various arguments', () => {
      // From ChessPiece
      const original = new ChessPiece(
        new ChessPieceType('p'),
        new ChessPieceColor('w'),
        new ChessPosition('e4')
      );
      const copy = ChessPiece.from(original);
      
      expect(copy?.type.value).toBe('p');
      expect(copy?.color.value).toBe('w');
      expect(copy?.position?.value).toBe('e4');
      
      // From string
      expect(ChessPiece.from('p w e4')?.type.value).toBe('p');
      
      // From type and color
      const noPosition = ChessPiece.from('p', 'w');
      expect(noPosition?.type.value).toBe('p');
      expect(noPosition?.color.value).toBe('w');
      expect(noPosition?.position).toBeNull();
      
      // From type, color, and position
      const withPosition = ChessPiece.from('p', 'w', 'e4');
      expect(withPosition?.type.value).toBe('p');
      expect(withPosition?.color.value).toBe('w');
      expect(withPosition?.position?.value).toBe('e4');
      
      // From type, color, position, and move turn
      const withMove = ChessPiece.from('p', 'w', 'e4', 10);
      expect(withMove?.type.value).toBe('p');
      expect(withMove?.color.value).toBe('w');
      expect(withMove?.position?.value).toBe('e4');
      expect(withMove?.hasMoved).toBe(true);
      expect(withMove?.lastMoveTurn).toBe(10);
    });
  });
}); 