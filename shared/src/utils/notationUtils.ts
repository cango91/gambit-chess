import { 
  DuelOutcome, 
  MoveType, 
  NotationTypes,
  PieceType, 
  PlayerColor, 
  Position
} from '../types';
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
 * Convert a position to algebraic notation (e.g., {x: 0, y: 0} to "a1")
 * @param position The position to convert
 * @returns The position in algebraic notation
 */
export function positionToAlgebraic(position: Position): string {
  const file = String.fromCharCode(97 + position.x);
  const rank = position.y + 1;
  return `${file}${rank}`;
}

/**
 * Convert algebraic notation to a position (e.g., "a1" to {x: 0, y: 0})
 * @param algebraic The algebraic notation
 * @returns The position
 */
export function algebraicToPosition(algebraic: string): Position {
  const file = algebraic.charCodeAt(0) - 97;
  const rank = parseInt(algebraic.substring(1)) - 1;
  return { x: file, y: rank };
}

/**
 * Convert a position to standard notation format
 * @param position The position to convert
 * @returns Position in notation format (e.g., "a1")
 */
export function positionToNotation(position: Position): string {
  return positionToAlgebraic(position);
}

/**
 * Convert notation to a position
 * @param notation The notation string (e.g., "a1")
 * @returns Position object or null if the notation is invalid
 */
export function notationToPosition(notation: string): Position | null {
  // Check if notation is in a valid format
  if (!notation || notation.length !== 2 || 
      !'abcdefgh'.includes(notation[0]) || 
      !'12345678'.includes(notation[1])) {
    return null;
  }
  
  const position = algebraicToPosition(notation);
  
  // Validate position is within bounds
  if (position.x < 0 || position.x > 7 || 
      position.y < 0 || position.y > 7) {
    return null;
  }
  
  return position;
}

/**
 * Create a move notation object
 * @param piece The piece that moved
 * @param from Starting position
 * @param to Destination position
 * @param moveType Type of move
 * @param isCheck Whether the move resulted in check
 * @param isCheckmate Whether the move resulted in checkmate
 * @param capturedPiece Piece that was captured (if any)
 * @param promotedTo Piece type after promotion (if applicable)
 * @returns Move notation object
 */
export function createMoveNotation(
  piece: PieceType,
  from: Position,
  to: Position,
  moveType: MoveType,
  isCheck: boolean = false,
  isCheckmate: boolean = false,
  capturedPiece?: PieceType,
  promotedTo?: PieceType
): NotationTypes.MoveNotation {
  const id = uuidv4();
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
  
  return {
    id,
    piece,
    from: positionToNotation(from),
    to: positionToNotation(to),
    moveType,
    san,
    isCheck,
    isCheckmate,
    capturedPiece,
    promotedTo
  };
}

/**
 * Create a duel notation object
 * @param attackerPiece Attacker piece type
 * @param defenderPiece Defender piece type
 * @param attackerPosition Attacker position
 * @param defenderPosition Defender position
 * @param outcome Duel outcome
 * @returns Duel notation object
 */
export function createDuelNotation(
  attackerPiece: PieceType,
  defenderPiece: PieceType,
  attackerPosition: Position,
  defenderPosition: Position,
  outcome: DuelOutcome
): NotationTypes.DuelNotation {
  const id = uuidv4();
  const attackerNotation = positionToNotation(attackerPosition);
  const defenderNotation = positionToNotation(defenderPosition);
  
  return {
    id,
    attackerPiece,
    defenderPiece,
    attackerPosition: attackerNotation,
    defenderPosition: defenderNotation,
    outcome
  };
}

/**
 * Create a tactical retreat notation object
 * @param piece The piece that retreated
 * @param from Starting position
 * @param to Destination position
 * @param failedCapturePosition Position of the failed capture attempt
 * @returns Tactical retreat notation object
 */
export function createTacticalRetreatNotation(
  piece: PieceType,
  from: Position,
  to: Position,
  failedCapturePosition: Position
): NotationTypes.TacticalRetreatNotation {
  const id = uuidv4();
  
  return {
    id,
    piece,
    from: positionToNotation(from),
    to: positionToNotation(to),
    failedCapturePosition: positionToNotation(failedCapturePosition)
  };
}

/**
 * Create a new game history object
 * @returns Empty game history
 */
export function createGameHistory(): NotationTypes.GameHistory {
  return {
    moves: [],
    toString: function() {
      return this.moves.map(m => m.san).join(' ');
    }
  };
}

/**
 * Add a move to the game history
 * @param history The game history
 * @param move Move to add
 * @returns Updated game history
 */
export function addMoveToHistory(
  history: NotationTypes.GameHistory,
  move: NotationTypes.MoveNotation
): NotationTypes.GameHistory {
  history.moves.push(move);
  return history;
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