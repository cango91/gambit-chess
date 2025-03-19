import { PieceDTO, PieceType, PlayerColor } from '../types';

/**
 * Initial board setup for a new game
 * Each piece includes a unique ID to track it throughout the game
 */
export const INITIAL_BOARD_SETUP: PieceDTO[] = [
  // White pawns
  { id: 'wp1', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 0, y: 1 }, hasMoved: false },
  { id: 'wp2', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 1, y: 1 }, hasMoved: false },
  { id: 'wp3', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 2, y: 1 }, hasMoved: false },
  { id: 'wp4', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 3, y: 1 }, hasMoved: false },
  { id: 'wp5', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 4, y: 1 }, hasMoved: false },
  { id: 'wp6', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 5, y: 1 }, hasMoved: false },
  { id: 'wp7', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 6, y: 1 }, hasMoved: false },
  { id: 'wp8', type: PieceType.PAWN, color: PlayerColor.WHITE, position: { x: 7, y: 1 }, hasMoved: false },
  
  // White pieces
  { id: 'wr1', type: PieceType.ROOK, color: PlayerColor.WHITE, position: { x: 0, y: 0 }, hasMoved: false },
  { id: 'wn1', type: PieceType.KNIGHT, color: PlayerColor.WHITE, position: { x: 1, y: 0 }, hasMoved: false },
  { id: 'wb1', type: PieceType.BISHOP, color: PlayerColor.WHITE, position: { x: 2, y: 0 }, hasMoved: false },
  { id: 'wq1', type: PieceType.QUEEN, color: PlayerColor.WHITE, position: { x: 3, y: 0 }, hasMoved: false },
  { id: 'wk1', type: PieceType.KING, color: PlayerColor.WHITE, position: { x: 4, y: 0 }, hasMoved: false },
  { id: 'wb2', type: PieceType.BISHOP, color: PlayerColor.WHITE, position: { x: 5, y: 0 }, hasMoved: false },
  { id: 'wn2', type: PieceType.KNIGHT, color: PlayerColor.WHITE, position: { x: 6, y: 0 }, hasMoved: false },
  { id: 'wr2', type: PieceType.ROOK, color: PlayerColor.WHITE, position: { x: 7, y: 0 }, hasMoved: false },
  
  // Black pawns
  { id: 'bp1', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 0, y: 6 }, hasMoved: false },
  { id: 'bp2', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 1, y: 6 }, hasMoved: false },
  { id: 'bp3', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 2, y: 6 }, hasMoved: false },
  { id: 'bp4', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 3, y: 6 }, hasMoved: false },
  { id: 'bp5', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 4, y: 6 }, hasMoved: false },
  { id: 'bp6', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 5, y: 6 }, hasMoved: false },
  { id: 'bp7', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 6, y: 6 }, hasMoved: false },
  { id: 'bp8', type: PieceType.PAWN, color: PlayerColor.BLACK, position: { x: 7, y: 6 }, hasMoved: false },
  
  // Black pieces
  { id: 'br1', type: PieceType.ROOK, color: PlayerColor.BLACK, position: { x: 0, y: 7 }, hasMoved: false },
  { id: 'bn1', type: PieceType.KNIGHT, color: PlayerColor.BLACK, position: { x: 1, y: 7 }, hasMoved: false },
  { id: 'bb1', type: PieceType.BISHOP, color: PlayerColor.BLACK, position: { x: 2, y: 7 }, hasMoved: false },
  { id: 'bq1', type: PieceType.QUEEN, color: PlayerColor.BLACK, position: { x: 3, y: 7 }, hasMoved: false },
  { id: 'bk1', type: PieceType.KING, color: PlayerColor.BLACK, position: { x: 4, y: 7 }, hasMoved: false },
  { id: 'bb2', type: PieceType.BISHOP, color: PlayerColor.BLACK, position: { x: 5, y: 7 }, hasMoved: false },
  { id: 'bn2', type: PieceType.KNIGHT, color: PlayerColor.BLACK, position: { x: 6, y: 7 }, hasMoved: false },
  { id: 'br2', type: PieceType.ROOK, color: PlayerColor.BLACK, position: { x: 7, y: 7 }, hasMoved: false },
];

/**
 * Initial Battle Points for each player
 */
export const INITIAL_BP = 39; // Sum of classic chess piece values 