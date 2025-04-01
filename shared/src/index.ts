/**
 * Gambit Chess Shared Domain
 * 
 * This module provides the shared types, interfaces, and pure utility functions
 * for use by both client and server domains.
 */

import { 
    ChessPosition, 
    ChessPieceColor, 
    ChessPieceType, 
    ChessPiece,
    ChessPositionType,
    ChessPieceColorType,
    ChessPieceTypeType,
    ChessPieceTypeSymbol,
} from './chess/types';

// Re-export essential types and interfaces
export type {
    ChessPositionType,
    ChessPieceColorType,
    ChessPieceTypeType,
    ChessPieceTypeSymbol,
    ChessPosition as PiecePosition,
    ChessPieceColor as PieceColor,
    ChessPieceType as PieceType,
    ChessPiece as Piece,
} from './chess/types';

// Re-export core interfaces
export type {
    IMinimalChessEngine,
    IMinimalEngineState,
    IMoveValidationResult,
    IBPAllocationValidationResult,
    IRetreatOption,
} from './chess/contracts';

export * from './dtos';

// Re-export game types
export * from './types';

// Re-export config types
export * from './config';

// Re-export event types
export * from './events';

// Re-export tactical types
export * from './tactical';

// Re-export validation utilities

// Value object factories
export const POSITION = (value: ChessPositionType) => new ChessPosition(value);
export const PIECE_COLOR = (value: ChessPieceColorType) => new ChessPieceColor(value);
export const PIECE_TYPE = (value: ChessPieceTypeType) => new ChessPieceType(value);
export const PIECE = (value: string) => ChessPiece.fromString(value);

// Re-export minimal engine and core utilities
export {
    MinimalChessEngine,
    isValidPieceMove,
    fenToPieces,
    piecesToFen,
} from './chess';

// Re-export tactical utilities
export {
    calculateTacticalRetreats,
} from './tactical';

export * as NotationUtils from './notation';
export * as ValidationUtils from './validation';

