/**
 * Chess notation utilities for Gambit Chess
 * 
 * This module provides utilities for converting between moves and their notation
 * representations, with special handling for Gambit Chess extensions like BP
 * regeneration, duels, and tactical retreats. It also implements information
 * hiding rules based on player perspective.
 */

import { 
  Move, 
  PieceType, 
  Position, 
  Duel, 
  Retreat, 
  PieceColor, 
  MoveOutcome,
  ExtendedMove,
  MoveHistory,
  PGNMoveList,
  PGNHeaders,
  PGNData
} from '../types';
import { OPPONENT_BP_PLACEHOLDER } from '../constants';

/**
 * Represents a parsed move from notation
 */
interface ParsedMove {
  /** The cleaned notation */
  notation: string;
  /** Whether the move is a capture */
  isCapture: boolean;
  /** Whether the move is a check */
  check: boolean;
  /** Whether the move is a checkmate */
  checkmate: boolean;
  /** Castle direction, if the move is a castle */
  castle: 'kingside' | 'queenside' | null;
  /** Duel information, if the move involved a duel */
  duel: { 
    attackerAllocation: number; 
    defenderAllocation: number; 
    outcome: MoveOutcome;
  } | null;
  /** Retreat information, if the move involved a retreat */
  retreat: { 
    to: string; 
    cost: number;
  } | null;
  /** BP regeneration amount */
  bpRegeneration: number;
  /** Color of the player making the move */
  playerColor: PieceColor;
}

/**
 * Converts a chess piece type to its Standard Algebraic Notation (SAN) symbol
 * Pawns are represented by an empty string in SAN
 * 
 * @param pieceType The piece type as a lowercase character ('p', 'n', 'b', 'r', 'q', 'k')
 * @returns The SAN symbol for the piece (empty string for pawns, uppercase letter for other pieces)
 * @throws Error if the piece type is invalid
 */
export function pieceTypeToSAN(pieceType: PieceType): string {
  // Validate input
  if (typeof pieceType !== 'string' || pieceType.length !== 1) {
    throw new Error(`Invalid piece type: ${pieceType}. Must be a single character string.`);
  }
  
  // Convert piece type to SAN symbol
  switch (pieceType) {
    case 'p': return '';
    case 'n': return 'N';
    case 'b': return 'B';
    case 'r': return 'R';
    case 'q': return 'Q';
    case 'k': return 'K';
    default:
      throw new Error(`Invalid piece type: ${pieceType}. Must be one of: p, n, b, r, q, k.`);
  }
}

/**
 * Converts a Standard Algebraic Notation (SAN) symbol to a chess piece type
 * Empty string is treated as a pawn
 * 
 * @param sanSymbol The SAN symbol for the piece (empty string for pawns, uppercase letter for other pieces)
 * @returns The piece type as a lowercase character ('p', 'n', 'b', 'r', 'q', 'k')
 * @throws Error if the SAN symbol is invalid
 */
export function sanToPieceType(sanSymbol: string): PieceType {
  // Validate input
  if (typeof sanSymbol !== 'string') {
    throw new Error(`Invalid SAN symbol: ${sanSymbol}. Must be a string.`);
  }
  
  // Convert empty string to pawn
  if (sanSymbol === '') {
    return 'p';
  }
  
  // Normalize to uppercase for consistent processing
  const normalizedSymbol = sanSymbol.toUpperCase();
  
  // Convert SAN symbol to piece type
  switch (normalizedSymbol) {
    case 'N': return 'n';
    case 'B': return 'b';
    case 'R': return 'r';
    case 'Q': return 'q';
    case 'K': return 'k';
    default:
      throw new Error(`Invalid SAN symbol: ${sanSymbol}. Must be one of: "", N, B, R, Q, K.`);
  }
}

/**
 * Converts a chess move to Standard Algebraic Notation (SAN)
 * Handles special cases like castling, capture, check, and checkmate
 * 
 * @param move The chess move to convert
 * @returns The move in Standard Algebraic Notation
 * @throws Error if the move is invalid
 */
export function moveToSAN(move: Move): string {
  // Input validation
  if (!move || typeof move !== 'object') {
    throw new Error('Invalid move: Must be a valid Move object');
  }
  
  if (!move.from || !move.to || !move.piece) {
    throw new Error('Invalid move: Missing required properties (from, to, piece)');
  }

  // Castling notation
  if (move.castle) {
    if (move.castle === 'kingside') {
      return 'O-O' + (move.check ? '+' : '') + (move.checkmate ? '#' : '');
    } else if (move.castle === 'queenside') {
      return 'O-O-O' + (move.check ? '+' : '') + (move.checkmate ? '#' : '');
    }
  }

  // Get SAN piece symbol
  const piece = pieceTypeToSAN(move.piece);
  
  // Start with the piece symbol (empty for pawns)
  let notation = piece;
  
  // For pawn captures, include the file of departure
  if (move.piece === 'p' && move.capture) {
    notation += move.from.charAt(0);
  }

  // Add 'x' for captures
  if (move.capture) {
    notation += 'x';
  }
  
  // Add the destination square
  notation += move.to;
  
  // Add promotion piece if applicable
  if (move.promotion) {
    notation += '=' + pieceTypeToSAN(move.promotion);
  }
  
  // Add check or checkmate symbol
  if (move.checkmate) {
    notation += '#';
  } else if (move.check) {
    notation += '+';
  }
  
  return notation;
}

/**
 * Converts a move to Gambit Chess extended notation, including BP allocations and retreats
 * @param move The move to convert
 * @param duel The duel result (if any)
 * @param retreat The retreat information (if any)
 * @param bpRegeneration The BP regenerated after the move
 * @param shouldIncludeBpRegen Whether to include BP regeneration in the notation (default: true)
 * @returns The move in Gambit Chess extended notation
 */
export function toGambitNotation(
  move: Move,
  duel: Duel | null = null,
  retreat: Retreat | null = null,
  bpRegeneration: number = 0,
  shouldIncludeBpRegen: boolean = true
): string {
  // Input validation
  if (!move || typeof move !== 'object') {
    throw new Error('Invalid move: Must be a valid Move object');
  }
  
  // Generate standard chess notation
  let notation = moveToSAN(move);
  
  // Add duel information if present
  if (duel) {
    // Validate duel object
    if (typeof duel.attackerAllocation !== 'number' || typeof duel.defenderAllocation !== 'number') {
      throw new Error('Invalid duel: Must have numeric allocations');
    }
    
    notation += `[A:${duel.attackerAllocation}/D:${duel.defenderAllocation}]`;
  }
  
  // Add retreat information if present and the duel failed
  if (retreat && duel && duel.outcome === 'failed') {
    // Validate retreat object
    if (!retreat.to || typeof retreat.cost !== 'number') {
      throw new Error('Invalid retreat: Must have destination and cost');
    }
    
    notation += `→${retreat.to}(${retreat.cost})`;
  } else if (retreat && (!duel || duel.outcome !== 'failed')) {
    // Warning: retreat information is only applicable for failed duels
    console.warn('Retreat information provided without a failed duel');
  }
  
  // Add BP regeneration if present and should be included
  if (bpRegeneration > 0 && shouldIncludeBpRegen) {
    notation += `{+${bpRegeneration}}`;
  }
  
  return notation;
}

/**
 * Generates pre-duel notation with appropriate visibility based on viewer perspective
 * @param move The chess move
 * @param attackerAllocation The attacker's BP allocation
 * @param viewerColor The color of the player viewing the notation
 * @param attackerColor The color of the attacking player
 * @returns Formatted pre-duel notation string with visibility rules applied
 */
export function preDuelNotation(
  move: Move,
  attackerAllocation: number,
  viewerColor: PieceColor,
  attackerColor: PieceColor
): string {
  // Input validation
  if (!move || typeof move !== 'object') {
    throw new Error('Invalid move: Must be a valid Move object');
  }
  
  if (typeof attackerAllocation !== 'number' || attackerAllocation < 0) {
    throw new Error('Invalid attackerAllocation: Must be a non-negative number');
  }
  
  if (viewerColor !== 'white' && viewerColor !== 'black') {
    throw new Error('Invalid viewerColor: Must be "white" or "black"');
  }
  
  if (attackerColor !== 'white' && attackerColor !== 'black') {
    throw new Error('Invalid attackerColor: Must be "white" or "black"');
  }

  // Start with standard SAN
  let notation = moveToSAN(move);

  // Show appropriate allocation based on viewer's perspective
  if (viewerColor === attackerColor) {
    // Viewer is attacker - show their allocation, hide defender's
    notation += `[A:${attackerAllocation}/D:${OPPONENT_BP_PLACEHOLDER}]`;
  } else {
    // Viewer is defender - hide attacker's allocation, show placeholder for their own
    notation += `[A:${OPPONENT_BP_PLACEHOLDER}/D:?]`;
  }

  return notation;
}

/**
 * Generates game history with appropriate visibility based on viewer perspective
 * Implements information hiding rules for BP allocation and regeneration
 * 
 * @param moves Array of moves with all information
 * @param viewerColor The color of the player viewing the history, or 'spectator'
 * @param gameOver Whether the game is over (determines if all information is visible)
 * @returns Filtered move history with appropriate information visibility
 */
export function generateVisibleGameHistory(
  moves: MoveHistory,
  viewerColor: PieceColor | 'spectator',
  gameOver: boolean = false
): MoveHistory {
  // Input validation
  if (!Array.isArray(moves)) {
    throw new Error('Invalid moves: Must be an array');
  }
  
  if (viewerColor !== 'white' && viewerColor !== 'black' && viewerColor !== 'spectator') {
    throw new Error('Invalid viewerColor: Must be "white", "black", or "spectator"');
  }

  // If game is over, show all information
  if (gameOver) {
    return moves.map(move => ({ ...move }));
  }

  return moves.map(moveData => {
    // Clone the move data to avoid modifying the original
    const visibleMoveData: ExtendedMove = {
      ...moveData,
      duel: moveData.duel ? { ...moveData.duel } : null,
    };

    // Apply visibility rules based on viewer perspective
    
    // Rule 1: Players can only see their own BP allocation in duels
    if (visibleMoveData.duel && visibleMoveData.playerColor !== viewerColor && viewerColor !== 'spectator') {
      // This is an opponent's move, hide their BP allocation
      visibleMoveData.duel.attackerAllocation = Number(OPPONENT_BP_PLACEHOLDER);
    }

    // Rule 2: Players can only see their own BP regeneration
    if (visibleMoveData.playerColor !== viewerColor && viewerColor !== 'spectator') {
      visibleMoveData.bpRegeneration = 0;
    }

    // Rule 3: Spectators see no BP information at all
    if (viewerColor === 'spectator') {
      visibleMoveData.bpRegeneration = 0;
      if (visibleMoveData.duel) {
        visibleMoveData.duel.attackerAllocation = Number(OPPONENT_BP_PLACEHOLDER);
        visibleMoveData.duel.defenderAllocation = Number(OPPONENT_BP_PLACEHOLDER);
      }
    }

    return visibleMoveData;
  });
}

/**
 * Parses a PGN string to an array of moves
 * @param pgn The PGN string to parse
 * @returns Array of parsed moves
 */
export function parsePGN(pgn: string): ParsedMove[] {
  // Input validation
  if (!pgn || typeof pgn !== 'string') {
    throw new Error('Invalid PGN: Must be a non-empty string');
  }

  // Extract move section (ignore headers)
  const moveSection = pgn.replace(/\[\s*\w+\s+"[^"]*"\s*\]\s*/g, '').trim();
  
  // Remove move numbers, comments, and annotations
  const cleanedMoveSection = moveSection
    .replace(/\d+\.\s*/g, '') // Remove move numbers
    .replace(/\{[^}]*\}/g, '') // Remove comments
    .replace(/\([^)]*\)/g, '') // Remove variations
    .replace(/\$\d+/g, '') // Remove NAGs
    .replace(/;.*$/gm, '') // Remove line comments
    .replace(/!+|\?+|!+\?+|\?+!+/g, '') // Remove evaluation symbols
    .trim();
  
  // Split into individual moves
  const moveStrings = cleanedMoveSection.split(/\s+/);
  
  // Parse each move
  return moveStrings
    .filter(move => move.length > 0) // Skip empty strings
    .map(notation => {
      try {
        // Attempt to handle BP regeneration within standard notation parsing
        // Gambit Chess includes BP regeneration in a specific format {+n}
        // But this might be removed during comment removal, so we need to handle it specially
        const bpRegenMatch = notation.match(/\{\+(\d+)\}/);
        const parsedMove = parseGambitNotation(notation);
        
        if (bpRegenMatch) {
          parsedMove.bpRegeneration = parseInt(bpRegenMatch[1], 10);
        }
        
        return parsedMove;
      } catch (error) {
        console.warn(`Error parsing move notation: ${notation}`, error);
        // Return a minimal valid move to avoid breaking the game
        return {
          notation: notation,
          isCapture: notation.includes('x'),
          check: notation.includes('+'),
          checkmate: notation.includes('#'),
          castle: notation.startsWith('O-O') ? (notation.startsWith('O-O-O') ? 'queenside' : 'kingside') : null,
          duel: null,
          retreat: null,
          bpRegeneration: 0,
          playerColor: 'white'
        };
      }
    });
}

/**
 * Parses Gambit Chess notation into move components
 * @param notation The notation to parse
 * @returns Parsed move components
 */
export function parseGambitNotation(notation: string): ParsedMove {
  // Input validation
  if (!notation || typeof notation !== 'string') {
    throw new Error('Invalid notation: Must be a non-empty string');
  }

  const result: ParsedMove = {
    notation: '',
    isCapture: false,
    check: false,
    checkmate: false,
    castle: null,
    duel: null,
    retreat: null,
    bpRegeneration: 0,
    playerColor: 'white' // Default, will be set by calling code
  };
  
  // Handle castling
  if (notation.startsWith('O-O-O')) {
    result.castle = 'queenside';
    result.notation = 'O-O-O';
  } else if (notation.startsWith('O-O')) {
    result.castle = 'kingside';
    result.notation = 'O-O';
  }
  
  // Extract basic move notation (without duel, retreat, or BP regen)
  if (!result.castle) {
    // Match the core chess move part
    const moveMatch = notation.match(/^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(=[NBRQK])?[+#]?/);
    if (moveMatch) {
      result.notation = moveMatch[0];
      result.isCapture = notation.includes('x');
      result.check = notation.includes('+');
      result.checkmate = notation.includes('#');
    } else {
      throw new Error(`Invalid move notation: ${notation}`);
    }
  }
  
  // Extract duel information - [A:n/D:m]
  const duelMatch = notation.match(/\[A:(\d+|\?)(\/D:(\d+|\?))\]/);
  if (duelMatch) {
    const attackerAlloc = duelMatch[1] === '?' ? -1 : parseInt(duelMatch[1], 10);
    const defenderAlloc = duelMatch[3] === '?' ? -1 : parseInt(duelMatch[3], 10);
    
    // Only create duel object if we have valid allocations
    if (attackerAlloc !== -1 || defenderAlloc !== -1) {
      // Check for retreat symbol as indicator of failed duel
      const hasRetreat = notation.includes('→');
      
      result.duel = {
        attackerAllocation: attackerAlloc,
        defenderAllocation: defenderAlloc,
        outcome: hasRetreat ? 'failed' : 'success'
      };
    }
  }
  
  // Extract retreat information - →a1(n)
  const retreatMatch = notation.match(/→([a-h][1-8])\((\d+)\)/);
  if (retreatMatch) {
    result.retreat = {
      to: retreatMatch[1],
      cost: parseInt(retreatMatch[2], 10)
    };
    
    // Ensure the duel is marked as failed if retreat information exists
    if (result.duel) {
      result.duel.outcome = 'failed';
    }
  }
  
  // Extract BP regeneration - {+n}
  const bpRegenMatch = notation.match(/\{\+(\d+)\}/);
  if (bpRegenMatch) {
    result.bpRegeneration = parseInt(bpRegenMatch[1], 10);
  }
  
  return result;
}

/**
 * Converts a move history to PGN format
 * @param moves Array of moves with duel and retreat information
 * @param headers PGN header information
 * @param viewerColor The color of the player viewing the PGN, or null for full information
 * @param gameOver Whether the game is over (determines if all information is visible)
 * @returns PGN string
 */
export function toPGN(
  moves: MoveHistory,
  headers: PGNHeaders = {},
  viewerColor: PieceColor | 'spectator' | null = null,
  gameOver: boolean = false
): string {
  // Input validation
  if (!Array.isArray(moves)) {
    throw new Error('Invalid moves: Must be an array of move data');
  }
  
  if (headers && typeof headers !== 'object') {
    throw new Error('Invalid headers: Must be an object or undefined');
  }
  
  if (viewerColor !== null && 
      viewerColor !== 'white' && 
      viewerColor !== 'black' && 
      viewerColor !== 'spectator') {
    throw new Error('Invalid viewerColor: Must be "white", "black", "spectator", or null');
  }
  
  let pgn = '';
  
  // Add headers
  const defaultHeaders: PGNHeaders = {
    Event: 'Gambit Chess Game',
    Site: 'Online',
    Date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
    Round: '1',
    White: 'Player 1',
    Black: 'Player 2',
    Result: '*'
  };
  
  // Merge default headers with provided headers
  const mergedHeaders = { ...defaultHeaders, ...headers };
  
  // Add headers to PGN
  Object.entries(mergedHeaders).forEach(([key, value]) => {
    if (value) {
      pgn += `[${key} "${value}"]\n`;
    }
  });
  pgn += '\n';

  // Filter moves based on viewer perspective if needed
  let visibleMoves = moves;
  if (viewerColor) {
    visibleMoves = generateVisibleGameHistory(moves, viewerColor, gameOver);
  }
  
  // Add moves
  for (let i = 0; i < visibleMoves.length; i++) {
    const moveData = visibleMoves[i];
    const moveNumber = Math.floor(i / 2) + 1;
    
    // Add move number for white's moves or first move in PGN
    if (i % 2 === 0) {
      pgn += `${moveNumber}. `;
    }
    
    // Add move notation
    const shouldIncludeBpRegen = viewerColor === null || 
                               gameOver || 
                               moveData.playerColor === viewerColor;
    
    pgn += toGambitMoveString(moveData, shouldIncludeBpRegen) + ' ';
    
    // Add newline every 5 full moves for readability
    if (i % 10 === 9) {
      pgn += '\n';
    }
  }
  
  return pgn.trim();
}

/**
 * Converts a move object to a Gambit Chess notation string
 * @param moveData Extended move data
 * @param shouldIncludeBpRegen Whether to include BP regeneration information
 * @returns Formatted move string
 */
function toGambitMoveString(moveData: ExtendedMove, shouldIncludeBpRegen: boolean = true): string {
  // Input validation
  if (!moveData || typeof moveData !== 'object' || !moveData.move) {
    throw new Error('Invalid moveData: Must be a valid ExtendedMove object with a move property');
  }
  
  return toGambitNotation(
    moveData.move,
    moveData.duel,
    moveData.retreat,
    moveData.bpRegeneration,
    shouldIncludeBpRegen
  );
} 