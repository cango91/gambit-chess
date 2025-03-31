/**
 * Shared module for Gambit Chess
 * 
 * This module contains shared types, utilities, and constants used by both
 * the client and server components.
 */

import { ChessPiece, ChessPiece_Type, ChessPieceColor, ChessPieceColorType, ChessPieceType, ChessPieceTypeType, ChessPosition, ChessPositionType } from "./chess/types";


export type Position = ChessPosition;
export const POSITION = (value:ChessPositionType) => new ChessPosition(value);
export type PieceColor = ChessPieceColor;
export const PIECE_COLOR = (value: ChessPieceColorType) => new ChessPieceColor(value);
export type PieceType = ChessPieceType;
export const PIECE_TYPE = (value: ChessPieceTypeType) => new ChessPieceType(value);
export type Piece = ChessPiece;
export const PIECE = (value: ChessPiece_Type) => ChessPiece.from(value);

export * from './types'
export * from './chess'
export * from './constants'
export * from './config'
export * from './events'
export * from './dtos'
export * from './validation'
export * from './notation'
export * from './tactical'

