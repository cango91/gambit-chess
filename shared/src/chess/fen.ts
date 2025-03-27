/**
 * FEN (Forsyth-Edwards Notation) utilities for chess positions
 * 
 * FEN is a standard notation for describing a particular board position of a chess game.
 * The format encodes the piece placement, active color, castling availability,
 * en passant target square, halfmove clock, and fullmove number.
 */

import { ChessPiece, PieceColor, PieceType, Position } from '../types';
import { positionToCoordinates, coordinatesToPosition, isValidPosition } from '../utils/position';

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
  if (enPassant !== '-' && !isValidPosition(enPassant)) {
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
export function fenCharToPiece(fenChar: string): { type: PieceType; color: PieceColor } {
  const lowerChar = fenChar.toLowerCase();
  let type: PieceType;
  
  switch (lowerChar) {
    case 'p': type = 'p'; break;
    case 'n': type = 'n'; break;
    case 'b': type = 'b'; break;
    case 'r': type = 'r'; break;
    case 'q': type = 'q'; break;
    case 'k': type = 'k'; break;
    default:
      throw new Error(`Invalid FEN piece character: ${fenChar}`);
  }
  
  const color: PieceColor = fenChar === lowerChar ? 'black' : 'white';
  
  return { type, color };
}

/**
 * Converts a piece type and color to a FEN character
 * @param type The piece type
 * @param color The piece color
 * @returns FEN character representing the piece
 */
export function pieceToFenChar(type: PieceType, color: PieceColor): string {
  const char = type;
  return color === 'white' ? char.toUpperCase() : char;
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
          const position = coordinatesToPosition(fileIndex, 7 - rankIndex);
          
          // Determine if this piece has moved from its starting position
          // This is an estimation based on typical piece starting positions
          let hasMoved = true; // Assume pieces have moved by default in a given position
          
          // Check if the piece is in its standard starting position
          if (
            (type === 'p' && ((color === 'white' && position[1] === '2') || (color === 'black' && position[1] === '7'))) ||
            (type === 'r' && ((color === 'white' && (position === 'a1' || position === 'h1')) || (color === 'black' && (position === 'a8' || position === 'h8')))) ||
            (type === 'n' && ((color === 'white' && (position === 'b1' || position === 'g1')) || (color === 'black' && (position === 'b8' || position === 'g8')))) ||
            (type === 'b' && ((color === 'white' && (position === 'c1' || position === 'f1')) || (color === 'black' && (position === 'c8' || position === 'f8')))) ||
            (type === 'q' && ((color === 'white' && position === 'd1') || (color === 'black' && position === 'd8'))) ||
            (type === 'k' && ((color === 'white' && position === 'e1') || (color === 'black' && position === 'e8')))
          ) {
            hasMoved = false;
          }
          
          pieces.push({ type, color, position, hasMoved });
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
    const [x, y] = positionToCoordinates(piece.position);
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
  enPassantTarget: Position | null;
  halfmoveClock: number;
  fullmoveNumber: number;
} {
  const components = parseFen(fen);
  
  const pieces = fenToPieces(components.piecePlacement);
  
  const activeColor: PieceColor = components.activeColor === 'w' ? 'white' : 'black';
  
  const castling = {
    whiteKingside: components.castling.includes('K'),
    whiteQueenside: components.castling.includes('Q'),
    blackKingside: components.castling.includes('k'),
    blackQueenside: components.castling.includes('q')
  };
  
  // Update the hasMoved flags based on castling rights
  for (const piece of pieces) {
    if (piece.type === 'k') {
      if (piece.color === 'white' && piece.position === 'e1') {
        // If white king is on e1 and white has no castling rights, then it has moved
        piece.hasMoved = !(castling.whiteKingside || castling.whiteQueenside);
      } else if (piece.color === 'black' && piece.position === 'e8') {
        // If black king is on e8 and black has no castling rights, then it has moved
        piece.hasMoved = !(castling.blackKingside || castling.blackQueenside);
      }
    } else if (piece.type === 'r') {
      if (piece.color === 'white') {
        if (piece.position === 'a1') {
          // White queenside rook
          piece.hasMoved = !castling.whiteQueenside;
        } else if (piece.position === 'h1') {
          // White kingside rook
          piece.hasMoved = !castling.whiteKingside;
        }
      } else if (piece.color === 'black') {
        if (piece.position === 'a8') {
          // Black queenside rook
          piece.hasMoved = !castling.blackQueenside;
        } else if (piece.position === 'h8') {
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
    enPassantTarget,
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
  activeColor: PieceColor;
  castling: { 
    whiteKingside: boolean; 
    whiteQueenside: boolean; 
    blackKingside: boolean; 
    blackQueenside: boolean;
  };
  enPassantTarget: Position | null;
  halfmoveClock: number;
  fullmoveNumber: number;
}): string {
  const piecePlacement = piecesToFen(pieces);
  
  const colorChar = activeColor === 'white' ? 'w' : 'b';
  
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