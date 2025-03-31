/**
 * FEN (Forsyth-Edwards Notation) utilities for chess positions
 * 
 * FEN is a standard notation for describing a particular board position of a chess game.
 * The format encodes the piece placement, active color, castling availability,
 * en passant target square, halfmove clock, and fullmove number.
 */

import { PieceColor } from '..';
import { ChessPiece, ChessPieceColor, ChessPieceType, ChessPosition } from './types';
/**
 * Standard starting position in FEN notation
 */
export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Interface for the components of a FEN string
 */
export interface FenComponents {
  /** Piece placement data */
  piecePlacement: string;
  /** Active color ('w' for White, 'b' for Black) */
  activeColor: string;
  /** Castling availability */
  castling: string;
  /** En passant target square in algebraic notation */
  enPassant: string;
  /** Halfmove clock (number of halfmoves since the last pawn move or capture) */
  halfmoveClock: string;
  /** Fullmove number (starts at 1 and is incremented after Black's move) */
  fullmoveNumber: string;
}

/**
 * Converts a FEN string to its component parts
 * @param fen The FEN string to parse
 * @returns An object containing the FEN components
 * @throws Error if the FEN string format is invalid
 */
export function parseFen(fen: string): FenComponents {
  const parts = fen.trim().split(' ');
  
  if (parts.length !== 6) {
    throw new Error(`Invalid FEN: expected 6 parts, got ${parts.length}`);
  }
  
  const [piecePlacement, activeColor, castling, enPassant, halfmoveClock, fullmoveNumber] = parts;
  
  // Validate piece placement (8 ranks separated by slashes)
  const ranks = piecePlacement.split('/');
  if (ranks.length !== 8) {
    throw new Error('Invalid FEN: piece placement should have 8 ranks');
  }
  
  // Validate active color
  if (activeColor !== 'w' && activeColor !== 'b') {
    throw new Error('Invalid FEN: active color should be "w" or "b"');
  }
  
  // Validate castling
  if (!/^(KQ?k?q?|Qk?q?|kq?|q|-)$/.test(castling)) {
    throw new Error('Invalid FEN: invalid castling availability format');
  }
  
  // Validate en passant
  if (enPassant !== '-' && !ChessPosition.isValidPosition(enPassant)) {
    throw new Error('Invalid FEN: invalid en passant target square');
  }
  
  // Validate halfmove clock and fullmove number as integers
  if (!/^\d+$/.test(halfmoveClock) || !/^\d+$/.test(fullmoveNumber)) {
    throw new Error('Invalid FEN: halfmove clock and fullmove number must be integers');
  }
  
  return {
    piecePlacement,
    activeColor,
    castling,
    enPassant,
    halfmoveClock,
    fullmoveNumber
  };
}

/**
 * Converts FEN components to a FEN string
 * @param components The FEN components
 * @returns The FEN string
 */
export function fenComponentsToString(components: FenComponents): string {
  return [
    components.piecePlacement,
    components.activeColor,
    components.castling,
    components.enPassant,
    components.halfmoveClock,
    components.fullmoveNumber
  ].join(' ');
}

/**
 * Maps FEN piece characters to internal piece types and colors
 * @param fenChar FEN character representing a piece
 * @returns Object with piece type and color
 * @throws Error if the FEN character is invalid
 */
export function fenCharToPiece(fenChar: string): { type: ChessPieceType; color: ChessPieceColor } {
  const lowerChar = fenChar.toLowerCase();
  let type: ChessPieceType;
  
  switch (lowerChar) {
    case 'p': type = ChessPieceType.from('p'); break;
    case 'n': type = ChessPieceType.from('n'); break;
    case 'b': type = ChessPieceType.from('b'); break;
    case 'r': type = ChessPieceType.from('r'); break;
    case 'q': type = ChessPieceType.from('q'); break;
    case 'k': type = ChessPieceType.from('k'); break;
    default:
      throw new Error(`Invalid FEN piece character: ${fenChar}`);
  }
  
  const color: ChessPieceColor = fenChar === lowerChar ? ChessPieceColor.from('b') : ChessPieceColor.from('w');
  
  return { type, color };
}

/**
 * Converts a piece type and color to a FEN character
 * @param type The piece type
 * @param color The piece color
 * @returns FEN character representing the piece
 */
export function pieceToFenChar(type: ChessPieceType, color: ChessPieceColor): string {
  const char = type.value;
  return color.equals(ChessPieceColor.from('w')) ? char.toUpperCase() : char;
}

/**
 * Converts a FEN piece placement string to an array of chess pieces
 * @param piecePlacement The piece placement part of a FEN string
 * @returns Array of chess pieces
 * @throws Error if the piece placement is invalid
 */
export function fenToPieces(piecePlacement: string): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  const ranks = piecePlacement.split('/');
  
  if (ranks.length !== 8) {
    throw new Error('Invalid piece placement: should have 8 ranks');
  }
  
  // Process each rank (from 8 to 1 in chess notation)
  for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
    const rank = ranks[rankIndex];
    let fileIndex = 0;
    
    for (let i = 0; i < rank.length; i++) {
      const char = rank[i];
      
      // If the character is a digit, it represents empty squares
      if (/\d/.test(char)) {
        fileIndex += parseInt(char, 10);
      } else {
        // Otherwise it's a piece
        try {
          const { type, color } = fenCharToPiece(char);
          const position = ChessPosition.fromCoordinates(fileIndex, 7 - rankIndex);
          
          // Determine if this piece has moved from its starting position
          // This is an estimation based on typical piece starting positions
          let hasMoved = true; // Assume pieces have moved by default in a given position
          
          // Check if the piece is in its standard starting position
          if (
            (type.equals(ChessPieceType.from('p')) && ((color.equals(ChessPieceColor.from('w')) && position.value[1] === '2') || (color.equals(ChessPieceColor.from('b')) && position.value[1] === '7'))) ||
            (type.equals(ChessPieceType.from('r')) && ((color.equals(ChessPieceColor.from('w')) && (position.value === 'a1' || position.value === 'h1')) || (color.equals(ChessPieceColor.from('b')) && (position.value === 'a8' || position.value === 'h8')))) ||
            (type.equals(ChessPieceType.from('n')) && ((color.equals(ChessPieceColor.from('w')) && (position.value === 'b1' || position.value === 'g1')) || (color.equals(ChessPieceColor.from('b')) && (position.value === 'b8' || position.value === 'g8')))) ||
            (type.equals(ChessPieceType.from('b')) && ((color.equals(ChessPieceColor.from('w')) && (position.value === 'c1' || position.value === 'f1')) || (color.equals(ChessPieceColor.from('b')) && (position.value === 'c8' || position.value === 'f8')))) ||
            (type.equals(ChessPieceType.from('q')) && ((color.equals(ChessPieceColor.from('w')) && position.value === 'd1') || (color.equals(ChessPieceColor.from('b')) && position.value === 'd8'))) ||
            (type.equals(ChessPieceType.from('k')) && ((color.equals(ChessPieceColor.from('w')) && position.value === 'e1') || (color.equals(ChessPieceColor.from('b')) && position.value === 'e8')))
          ) {
            hasMoved = false;
          }
          
          pieces.push(new ChessPiece(type, color, position, hasMoved));
          fileIndex++;
        } catch (error: any) {
          throw new Error(`Invalid piece placement: ${error.message}`);
        }
      }
    }
    
    // Verify each rank sums to 8 squares
    if (fileIndex !== 8) {
      throw new Error(`Invalid piece placement: rank ${8 - rankIndex} does not sum to 8 squares`);
    }
  }
  
  return pieces;
}

/**
 * Converts an array of chess pieces to a FEN piece placement string
 * @param pieces Array of chess pieces
 * @returns FEN piece placement string
 */
export function piecesToFen(pieces: ChessPiece[]): string {
  // Create an 8x8 empty board
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Place pieces on the board
  for (const piece of pieces) {
    const [x, y] = piece.position?.toCoordinates() ?? [];
    if (x === undefined || y === undefined) {
      throw new Error('Invalid piece position');
    }
    board[7 - y][x] = pieceToFenChar(piece.type, piece.color);
  }
  
  // Convert board to FEN notation
  return board.map(rank => {
    let rankFen = '';
    let emptyCount = 0;
    
    for (const square of rank) {
      if (square === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rankFen += emptyCount;
          emptyCount = 0;
        }
        rankFen += square;
      }
    }
    
    if (emptyCount > 0) {
      rankFen += emptyCount;
    }
    
    return rankFen;
  }).join('/');
}

/**
 * Parses a complete FEN string and returns the pieces and game state
 * @param fen The FEN string to parse
 * @returns Object containing the pieces and game state information
 */
export function parseFenToGameState(fen: string): {
  pieces: ChessPiece[];
  activeColor: PieceColor;
  castling: { 
    whiteKingside: boolean; 
    whiteQueenside: boolean; 
    blackKingside: boolean; 
    blackQueenside: boolean;
  };
  enPassantTarget: ChessPosition | null;
  halfmoveClock: number;
  fullmoveNumber: number;
} {
  const components = parseFen(fen);
  
  const pieces = fenToPieces(components.piecePlacement);
  
  const activeColor: ChessPieceColor = components.activeColor === 'w' ? ChessPieceColor.from('w') : ChessPieceColor.from('b');
  
  const castling = {
    whiteKingside: components.castling.includes('K'),
    whiteQueenside: components.castling.includes('Q'),
    blackKingside: components.castling.includes('k'),
    blackQueenside: components.castling.includes('q')
  };
  
  // Update the hasMoved flags based on castling rights
  for (const piece of pieces) {
    if (piece.type.equals(ChessPieceType.from('k'))) {
      if (piece.color.equals(ChessPieceColor.from('w')) && piece.position?.value === 'e1') {
        // If white king is on e1 and white has no castling rights, then it has moved
        piece.hasMoved = !(castling.whiteKingside || castling.whiteQueenside);
      } else if (piece.color.equals(ChessPieceColor.from('b')) && piece.position?.value === 'e8') {
        // If black king is on e8 and black has no castling rights, then it has moved
        piece.hasMoved = !(castling.blackKingside || castling.blackQueenside);
      }
    } else if (piece.type.equals(ChessPieceType.from('r'))) {
      if (piece.color.equals(ChessPieceColor.from('w'))) {
        if (piece.position?.value === 'a1') {
          // White queenside rook
          piece.hasMoved = !castling.whiteQueenside;
        } else if (piece.position?.value === 'h1') {
          // White kingside rook
          piece.hasMoved = !castling.whiteKingside;
        }
      } else if (piece.color.equals(ChessPieceColor.from('b'))) {
        if (piece.position?.value === 'a8') {
          // Black queenside rook
          piece.hasMoved = !castling.blackQueenside;
        } else if (piece.position?.value === 'h8') {
          // Black kingside rook
          piece.hasMoved = !castling.blackKingside;
        }
      }
    }
  }
  
  const enPassantTarget = components.enPassant === '-' ? null : components.enPassant;
  
  const halfmoveClock = parseInt(components.halfmoveClock, 10);
  const fullmoveNumber = parseInt(components.fullmoveNumber, 10);
  
  return {
    pieces,
    activeColor,
    castling,
    enPassantTarget: enPassantTarget ? ChessPosition.from(enPassantTarget) : null,
    halfmoveClock,
    fullmoveNumber
  };
}

/**
 * Creates a FEN string from game state information
 * @param state The game state
 * @returns FEN string representing the game state
 */
export function gameStateToFen({
  pieces,
  activeColor,
  castling,
  enPassantTarget,
  halfmoveClock,
  fullmoveNumber
}: {
  pieces: ChessPiece[];
  activeColor: ChessPieceColor;
  castling: { 
    whiteKingside: boolean; 
    whiteQueenside: boolean; 
    blackKingside: boolean; 
    blackQueenside: boolean;
  };
  enPassantTarget: ChessPosition | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}): string {
  const piecePlacement = piecesToFen(pieces);
  
  const colorChar = activeColor.equals(ChessPieceColor.from('w')) ? 'w' : 'b';
  
  let castlingString = '';
  if (castling.whiteKingside) castlingString += 'K';
  if (castling.whiteQueenside) castlingString += 'Q';
  if (castling.blackKingside) castlingString += 'k';
  if (castling.blackQueenside) castlingString += 'q';
  if (castlingString === '') castlingString = '-';
  
  const enPassant = enPassantTarget || '-';
  
  return [
    piecePlacement,
    colorChar,
    castlingString,
    enPassant,
    halfmoveClock.toString(),
    fullmoveNumber.toString()
  ].join(' ');
} 