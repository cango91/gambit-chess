/**
 * Chess utilities index
 */

// Core interfaces
export {
    IMinimalChessEngine,
    IMinimalEngineState,
    IMoveValidationResult,
    IBPAllocationValidationResult,
    IRetreatOption,
} from './contracts';

// Minimal engine implementation
export { MinimalChessEngine } from './minimal-engine';

// Essential types and classes
export {
    ChessPosition,
    ChessPieceColor,
    ChessPieceType,
    ChessPiece,
    // Type definitions
    ChessCoordinates,
    ChessPositionType,
    ChessPieceColorType,
    ChessPieceTypeType,
    ChessPieceTypeSymbol,
} from './types';

// Re-export factory functions from root shared index
export {
    PIECE,
    PIECE_COLOR,
    PIECE_TYPE,
    POSITION,
} from '..';

// Pure utility functions
export {
    isValidPieceMove,
    getPieceDirections,
} from './movement';

// FEN utilities for game state serialization
export {
    fenToPieces,
    piecesToFen,
} from './fen';

/**
 * IMPORTANT: This module provides:
 * 1. Minimal chess engine for client-side validation
 * 2. Pure utility functions for chess operations
 * 3. Type definitions and interfaces
 * 4. Value objects for chess domain
 * 5. Factory functions for creating value objects
 * 
 * The server should NOT rely on MinimalChessEngine for authoritative validation.
 * It should implement its own complete validation using the pure utility functions.
 */