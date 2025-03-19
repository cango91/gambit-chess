import { 
  DuelOutcome, 
  MoveType, 
  PieceType, 
  PlayerColor, 
  Position
} from '../types/index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chess piece interface with Battle Points
 */
export interface PieceWithBP {
  id: string;
  type: PieceType;
  color: PlayerColor;
  position: Position;
  hasMoved: boolean;
  bp?: number;
}

/**
 * Represents a move in standard algebraic notation with extensions for Gambit Chess
 */
export interface MoveNotation {
  /**
   * Unique identifier for the move
   */
  id: string;
  
  /**
   * Move number (e.g., 1 for White's first move, 1.5 for Black's first move)
   * Using half moves where whole numbers are White's moves
   */
  moveNumber: number;
  
  /**
   * Player who made the move
   */
  player: PlayerColor;
  
  /**
   * Piece that was moved
   */
  piece: PieceType;
  
  /**
   * Starting position in algebraic notation (e.g., "e2")
   */
  from: string;
  
  /**
   * Target position in algebraic notation (e.g., "e4")
   */
  to: string;
  
  /**
   * Type of move
   */
  moveType: MoveType;
  
  /**
   * Captured piece type (if any)
   */
  capturedPiece?: PieceType;
  
  /**
   * Piece type after promotion (if applicable)
   */
  promotedTo?: PieceType;
  
  /**
   * Whether the move resulted in check
   */
  isCheck: boolean;
  
  /**
   * Whether the move resulted in checkmate
   */
  isCheckmate: boolean;
  
  /**
   * Related duel (if move triggered a duel)
   */
  duel?: DuelNotation;
  
  /**
   * Related tactical retreat (if a duel resulted in a retreat)
   */
  tacticalRetreat?: TacticalRetreatNotation;
  
  /**
   * Standard algebraic notation (SAN) representation
   * e.g., "Nf3", "exd5", "O-O", "Qxf7#"
   */
  san: string;
  
  /**
   * Extended notation for Gambit Chess (includes BP information)
   */
  extended: string;
}

/**
 * Represents a duel in Gambit Chess notation
 */
export interface DuelNotation {
  /**
   * Unique identifier for the duel
   */
  id: string;
  
  /**
   * Attacker's piece type
   */
  attackerPiece: PieceType;
  
  /**
   * Defender's piece type
   */
  defenderPiece: PieceType;
  
  /**
   * Outcome of the duel
   */
  outcome: DuelOutcome;
  
  /**
   * Standard notation representation of the duel
   * e.g., "R⚔️N:R+" (Rook attacks Knight, Rook wins)
   */
  notation: string;
}

/**
 * Represents a tactical retreat after a failed capture attempt
 */
export interface TacticalRetreatNotation {
  /**
   * Unique identifier for the retreat
   */
  id: string;
  
  /**
   * Retreating piece type
   */
  piece: PieceType;
  
  /**
   * Target position for the retreat in algebraic notation
   */
  to: string;
  
  /**
   * Standard notation representation of the retreat
   * e.g., "B↩️c4" (Bishop retreats to c4)
   */
  notation: string;
}

/**
 * Represents the complete game history
 */
export interface GameHistory {
  /**
   * Array of moves in the game
   */
  moves: MoveNotation[];
  
  /**
   * Get a string representation of the full game history
   */
  toString: () => string;
}

/**
 * Convert a position to algebraic notation
 * @param position Position object (x,y coordinates)
 * @returns String in algebraic notation (e.g., "e4")
 */
export function positionToNotation(position: Position): string {
  const file = String.fromCharCode(97 + position.x); // 'a' = 97 in ASCII
  const rank = position.y + 1; // Chess ranks start at 1
  return `${file}${rank}`;
}

/**
 * Convert algebraic notation to a position
 * @param notation String in algebraic notation (e.g., "e4")
 * @returns Position object
 */
export function notationToPosition(notation: string): Position {
  const file = notation.charCodeAt(0) - 97; // 'a' = 97 in ASCII
  const rank = parseInt(notation.substring(1)) - 1; // Chess ranks start at 1
  return { x: file, y: rank };
}

/**
 * Get the piece symbol for notation
 * @param pieceType The type of piece
 * @returns Symbol representing the piece (e.g., "N" for Knight)
 */
export function getPieceSymbol(pieceType: PieceType): string {
  switch (pieceType) {
    case PieceType.PAWN:
      return '';
    case PieceType.KNIGHT:
      return 'N';
    case PieceType.BISHOP:
      return 'B';
    case PieceType.ROOK:
      return 'R';
    case PieceType.QUEEN:
      return 'Q';
    case PieceType.KING:
      return 'K';
    default:
      return '?';
  }
}

/**
 * Generate standard algebraic notation (SAN) for a chess move
 * @param piece The type of piece moved
 * @param from Starting position
 * @param to Destination position
 * @param moveType Type of move (normal, capture, castle, etc.)
 * @param capturedPiece Type of piece captured (if any)
 * @param isCheck Whether the move results in check
 * @param isCheckmate Whether the move results in checkmate
 * @param promotedTo Piece type after promotion (if applicable)
 * @returns Standard algebraic notation string
 */
export function generateSAN(
  piece: PieceType,
  from: Position,
  to: Position,
  moveType: MoveType,
  capturedPiece?: PieceType,
  isCheck = false,
  isCheckmate = false,
  promotedTo?: PieceType
): string {
  // Handle castling
  if (moveType === MoveType.CASTLE) {
    // Kingside castling
    if (to.x === 6) {
      return 'O-O' + (isCheck ? '+' : '') + (isCheckmate ? '#' : '');
    } 
    // Queenside castling
    else {
      return 'O-O-O' + (isCheck ? '+' : '') + (isCheckmate ? '#' : '');
    }
  }

  const pieceSymbol = getPieceSymbol(piece);
  const toSquare = positionToNotation(to);
  let notation = '';

  // For pawn captures, we include the file of origin
  if (piece === PieceType.PAWN && moveType === MoveType.CAPTURE) {
    notation = positionToNotation(from)[0] + 'x' + toSquare;
  } 
  // For other captures
  else if (moveType === MoveType.CAPTURE) {
    notation = pieceSymbol + 'x' + toSquare;
  } 
  // For normal moves
  else {
    notation = pieceSymbol + toSquare;
  }

  // Add promotion indicator
  if (promotedTo) {
    notation += '=' + getPieceSymbol(promotedTo);
  }

  // Add check or checkmate indicator
  if (isCheckmate) {
    notation += '#';
  } else if (isCheck) {
    notation += '+';
  }

  return notation;
}

/**
 * Generate extended notation specifically for Gambit Chess, including BP information
 * @param san Standard algebraic notation
 * @param duel Duel information (if applicable)
 * @param tacticalRetreat Tactical retreat information (if applicable)
 * @returns Extended notation string
 */
export function generateExtendedNotation(
  san: string,
  duel?: DuelNotation,
  tacticalRetreat?: TacticalRetreatNotation
): string {
  let extended = san;
  
  // Add duel notation if applicable
  if (duel) {
    extended += ` [${duel.notation}]`;
  }
  
  // Add tactical retreat notation if applicable
  if (tacticalRetreat) {
    extended += ` [${tacticalRetreat.notation}]`;
  }
  
  return extended;
}

/**
 * Generate a complete move notation object
 * @param moveNumber Move number in the game
 * @param player Color of the player making the move
 * @param piece Type of piece being moved
 * @param from Starting position
 * @param to Target position
 * @param moveType Type of move
 * @param capturedPiece Type of piece captured (if any)
 * @param isCheck Whether the move resulted in check
 * @param isCheckmate Whether the move resulted in checkmate
 * @param promotedTo Piece type after promotion (if applicable)
 * @param duel Related duel information (if applicable)
 * @param tacticalRetreat Related tactical retreat information (if applicable)
 * @returns Complete MoveNotation object
 */
export function createMoveNotation(
  moveNumber: number,
  player: PlayerColor,
  piece: PieceType,
  from: Position,
  to: Position,
  moveType: MoveType,
  capturedPiece?: PieceType,
  isCheck = false,
  isCheckmate = false,
  promotedTo?: PieceType,
  duel?: DuelNotation,
  tacticalRetreat?: TacticalRetreatNotation
): MoveNotation {
  // Generate standard algebraic notation
  const san = generateSAN(
    piece,
    from,
    to,
    moveType,
    capturedPiece,
    isCheck,
    isCheckmate,
    promotedTo
  );
  
  // Generate extended notation with Gambit Chess specifics
  const extended = generateExtendedNotation(san, duel, tacticalRetreat);
  
  return {
    id: uuidv4(),
    moveNumber,
    player,
    piece,
    from: positionToNotation(from),
    to: positionToNotation(to),
    moveType,
    capturedPiece,
    promotedTo,
    isCheck,
    isCheckmate,
    duel,
    tacticalRetreat,
    san,
    extended
  };
}

/**
 * Create a duel notation object
 * @param attackerPiece Type of attacking piece
 * @param defenderPiece Type of defending piece
 * @param outcome Outcome of the duel
 * @returns DuelNotation object
 */
export function createDuelNotation(
  attackerPiece: PieceType,
  defenderPiece: PieceType,
  outcome: DuelOutcome
): DuelNotation {
  const attackerSymbol = getPieceSymbol(attackerPiece) || 'P'; // Use 'P' for pawns
  const defenderSymbol = getPieceSymbol(defenderPiece) || 'P';
  
  let result: string;
  switch (outcome) {
    case DuelOutcome.ATTACKER_WINS:
      result = `${attackerSymbol}+`;
      break;
    case DuelOutcome.DEFENDER_WINS:
      result = `${defenderSymbol}+`;
      break;
    case DuelOutcome.TIE:
      result = 'Tie';
      break;
    default:
      result = '?';
  }

  // Format: "Q⚔️N:Q+" (Queen attacks Knight, Queen wins)
  const notation = `${attackerSymbol}⚔️${defenderSymbol}:${result}`;
  
  return {
    id: uuidv4(),
    attackerPiece,
    defenderPiece,
    outcome,
    notation
  };
}

/**
 * Create a tactical retreat notation object
 * @param piece Type of retreating piece
 * @param to Target position for the retreat
 * @returns TacticalRetreatNotation object
 */
export function createTacticalRetreatNotation(
  piece: PieceType,
  to: Position
): TacticalRetreatNotation {
  const pieceSymbol = getPieceSymbol(piece) || 'P'; // Use 'P' for pawns
  const toSquare = positionToNotation(to);
  
  // Format: "B↩️c4" (Bishop retreats to c4)
  const notation = `${pieceSymbol}↩️${toSquare}`;
  
  return {
    id: uuidv4(),
    piece,
    to: toSquare,
    notation
  };
}

/**
 * Create a game history object to track moves
 * @returns GameHistory object with methods for managing the history
 */
export function createGameHistory(): {
  moves: MoveNotation[];
  addMove: (move: MoveNotation) => void;
  getMoveByNumber: (moveNumber: number) => MoveNotation | undefined;
  toString: () => string;
} {
  const moves: MoveNotation[] = [];
  
  return {
    moves,
    
    addMove(move: MoveNotation): void {
      moves.push(move);
    },
    
    getMoveByNumber(moveNumber: number): MoveNotation | undefined {
      return moves.find(move => move.moveNumber === moveNumber);
    },
    
    toString(): string {
      const formatted: string[] = [];
      let currentMoveIndex = 1;
      
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        
        // Add move number for white's move
        if (move.player === PlayerColor.WHITE) {
          formatted.push(`${currentMoveIndex}.`);
        }
        
        // Add the extended notation which includes duels and retreats
        formatted.push(move.extended);
        
        // Add a space after white's move, a newline after black's
        if (move.player === PlayerColor.WHITE) {
          formatted.push(' ');
        } else if (move.player === PlayerColor.BLACK) {
          formatted.push('\n');
          currentMoveIndex++;
        }
      }
      
      return formatted.join('');
    }
  };
} 