/**
 * Chess utilities index
 */

// Core interfaces
export {
    IMinimalChessEngine,
    IGameState,
    IMoveValidationResult,
    IBPAllocationValidationResult,
    IRetreatOption,
    IDuelState,
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
