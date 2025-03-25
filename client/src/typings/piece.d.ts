import { Position } from '@gambit-chess/shared';

// Declare module to provide type overrides
declare module '@gambit-chess/shared' {
  // Fix the PieceDTO interface to match the actual usage
  interface PieceDTO {
    id: string;
    type: PieceType;
    color: PlayerColor;
    position: Position; // Non-null position
    hasMoved: boolean;
  }
} 