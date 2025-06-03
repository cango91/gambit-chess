import { Color, PieceSymbol, Square, Piece, Chess } from "chess.js";
import { GameConfig } from "../types/config";
import { calculateTacticalRetreats } from './tactical-retreat';
import { DEFAULT_GAME_CONFIG } from "../constants";

/**
 * Represents a direction vector on the chessboard.
 */
export interface Direction {
    dx: number; // Change in file (-1 for left, +1 for right)
    dy: number; // Change in rank (-1 for down, +1 for up)
}

/**
 * Gets the numerical value of a piece based on game config.
 * @param config The game configuration containing piece values.
 * @param pieceSymbol The symbol of the piece (e.g., 'p', 'N').
 * @returns The value of the piece.
 */
export function getPieceValue(pieceSymbol: PieceSymbol, config: GameConfig = DEFAULT_GAME_CONFIG): number {
    return config.pieceValues[pieceSymbol.toLowerCase() as PieceSymbol] ?? 0;
}

/**
 * Gets the opposite color.
 * @param color The color ('w' or 'b').
 * @returns The opposite color.
 */
export function getOppositeColor(color: Color): Color {
    return color === 'w' ? 'b' : 'w';
}

/**
 * Converts a square string (e.g., "e4") to 0-based coordinates { file: 0-7, rank: 0-7 }.
 * @param square The algebraic notation square.
 * @returns Object with file and rank, or null if invalid.
 */
function squareToCoords(square: Square): { file: number; rank: number } | null {
    if (!/^[a-h][1-8]$/.test(square)) return null;
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(square[1], 10) - 1;
    return { file, rank };
}

/**
 * Converts 0-based coordinates { file: 0-7, rank: 0-7 } to a square string (e.g., "e4").
 * @param coords Object with file and rank.
 * @returns The algebraic notation square, or null if invalid.
 */
function coordsToSquare(coords: { file: number; rank: number }): Square | null {
    if (coords.file < 0 || coords.file > 7 || coords.rank < 0 || coords.rank > 7) return null;
    const fileChar = String.fromCharCode('a'.charCodeAt(0) + coords.file);
    const rankChar = (coords.rank + 1).toString();
    return (fileChar + rankChar) as Square;
}

/**
 * Calculates the direction vector from one square to another.
 * Only returns a valid direction if the squares are on the same rank, file, or diagonal.
 * @param from The starting square.
 * @param to The ending square.
 * @returns A Direction object {dx, dy} or null if not aligned.
 */
export function getDirection(from: Square, to: Square): Direction | null {
    const fromCoords = squareToCoords(from);
    const toCoords = squareToCoords(to);

    if (!fromCoords || !toCoords) return null;

    const dx = toCoords.file - fromCoords.file;
    const dy = toCoords.rank - fromCoords.rank;

    const unitDx = Math.sign(dx);
    const unitDy = Math.sign(dy);

    // Check for horizontal, vertical, or diagonal alignment
    if (dx === 0 && dy !== 0) return { dx: 0, dy: unitDy }; // Vertical
    if (dy === 0 && dx !== 0) return { dx: unitDx, dy: 0 }; // Horizontal
    if (Math.abs(dx) === Math.abs(dy) && dx !== 0) return { dx: unitDx, dy: unitDy }; // Diagonal

    return null; // Not aligned
}

/**
 * Casts a ray from a starting square in a given direction until it hits a piece or the edge of the board.
 * Does NOT include the starting square itself.
 * @param board The chess board instance.
 * @param startSquare The square from which to cast the ray.
 * @param direction The direction vector {dx, dy}.
 * @returns The first Piece encountered along with its square, or null if no piece is hit before the edge.
 */
export function castRay(board: Chess, startSquare: Square, direction: Direction): {piece: Piece, square: Square} | null {
    let currentCoords = squareToCoords(startSquare);

    if (!currentCoords || (direction.dx === 0 && direction.dy === 0)) {
        return null;
    }

    while (true) {
        // Move one step in the given direction
        currentCoords.file += direction.dx;
        currentCoords.rank += direction.dy;

        // Check if off board
        if (currentCoords.file < 0 || currentCoords.file > 7 || currentCoords.rank < 0 || currentCoords.rank > 7) {
            return null; // Hit edge of the board
        }

        const currentSquare = coordsToSquare(currentCoords);
        if (!currentSquare) return null; // Should not happen if coords are valid

        const pieceOnSquare = board.get(currentSquare);
        if (pieceOnSquare) {
            return {piece: pieceOnSquare, square: currentSquare}; // Hit a piece
        }
        // Continue if the square is empty
    }
}

export function isSlidingPiece(type: PieceSymbol): boolean {
    return type === 'r' || type === 'b' || type === 'q';
}

/**
 * Finds all squares strictly between sq1 and sq2 (exclusive) along a rank, file, or diagonal.
 * Returns an empty array if sq1 and sq2 are not on the same rank, file, or diagonal.
 */
export function getSquaresBetween(sq1: Square, sq2: Square): Square[] {
    const file1 = sq1.charCodeAt(0);
    const rank1 = parseInt(sq1[1], 10);
    const file2 = sq2.charCodeAt(0);
    const rank2 = parseInt(sq2[1], 10);

    const fileDiff = file2 - file1;
    const rankDiff = rank2 - rank1;

    const stepFile = Math.sign(fileDiff);
    const stepRank = Math.sign(rankDiff);

    // Check if they are on the same line
    if (fileDiff !== 0 && rankDiff !== 0 && Math.abs(fileDiff) !== Math.abs(rankDiff)) {
        return []; // Not on the same diagonal
    }
    if (fileDiff === 0 && rankDiff === 0) {
        return []; // Same square
    }
    // Check for knight moves or invalid steps
    if(stepFile === 0 && stepRank === 0 && (fileDiff !== 0 || rankDiff !== 0)) {
         return []; // Should not happen if squares are different
    }
    if (fileDiff !== 0 && rankDiff !== 0 && Math.abs(fileDiff) !== Math.abs(rankDiff)) {
         return []; // Not on rank, file, or diagonal
    }

    const between: Square[] = [];
    let currentFile = file1 + stepFile;
    let currentRank = rank1 + stepRank;

    while (currentFile !== file2 || currentRank !== rank2) {
        if (currentFile < 'a'.charCodeAt(0) || currentFile > 'h'.charCodeAt(0) || currentRank < 1 || currentRank > 8) {
            console.error(`Invalid intermediate square generated between ${sq1} and ${sq2}`);
            return []; // Exit if we somehow go off board
        }
        between.push(String.fromCharCode(currentFile) + currentRank.toString() as Square);
        currentFile += stepFile;
        currentRank += stepRank;
    }

    return between;
}

/**
 * Checks if any pieces exist on the squares between sq1 and sq2.
 * @param board The standard Chess instance.
 */
export function isLineBlocked(board: Chess, sq1: Square, sq2: Square): boolean {
    const between = getSquaresBetween(sq1, sq2);
    return between.some(sq => board.get(sq) !== null);
}

/**
 * Helper to get all pieces of a given color.
 * @param board The standard Chess instance.
 */
export function getPiecesByColor(board: Chess, color: Color): { square: Square; type: PieceSymbol }[] {
    const pieces: { square: Square; type: PieceSymbol }[] = [];
    const currentBoard = board.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const piece = currentBoard[r][f];
            if (piece && piece.color === color) {
                pieces.push({ square: piece.square, type: piece.type });
            }
        }
    }
    return pieces;
}

/**
 * Get the position of the king of a given color from a board state.
 * @param board The standard Chess instance.
 */
export function getKingPosition(board: Chess, color: Color): Square | undefined {
    const king = board.board().flat().find(piece => piece?.type === 'k' && piece.color === color);
    return king?.square;
}

/**
 * Determine if a move from a given board state would result in a capture.
 * @param board The standard Chess instance.
 */
export function wouldCapture(board: Chess, from: Square, to: Square): boolean {
    try {
        // Use standard board.moves()
        const moves = board.moves({ square: from, verbose: true });
        const move = moves.find(m => m.to === to);
        return !!move?.captured;
    } catch (e) {
        // Handle cases where the move generation might fail (e.g., invalid 'from' square)
        return false;
    }
}

/**
 * Get the piece at a specific square from a board state.
 * @param board The standard Chess instance.
 */
export function getPieceAt(board: Chess, square: Square): { type: PieceSymbol; color: Color } | null {
    // Use standard board.get()
    const piece = board.get(square);
    return piece || null;
}