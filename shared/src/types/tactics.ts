import { PieceSymbol, Square } from "chess.js";

// Special attack types for BP regeneration
export enum SpecialAttackType {
    PIN = 'PIN',
    SKEWER = 'SKEWER',
    FORK = 'FORK',
    DIRECT_DEFENCE = 'DIRECT_DEFENCE',
    DISCOVERED_ATTACK = 'DISCOVERED_ATTACK',
    CHECK = 'CHECK'
  }
  
export interface PinDTO {
    type: SpecialAttackType.PIN;
    pinnedPiece: {
        type: PieceSymbol;
        square: Square;
    };
    pinnedTo: {
        type: PieceSymbol;
        square: Square;
    };
    pinnedBy: {
        type: PieceSymbol;
        square: Square;
    };
}

export interface SkewerDTO {
    type: SpecialAttackType.SKEWER;
    skeweredPiece: {
        type: PieceSymbol;
        square: Square;
    };
    skeweredTo: {
        type: PieceSymbol;
        square: Square;
    };
    skeweredBy: {
        type: PieceSymbol;
        square: Square;
    };
}

export interface ForkDTO{
    type: SpecialAttackType.FORK;
    forkedPieces: {
        type: PieceSymbol;
        square: Square;
    }[];
    forkedBy: {
        type: PieceSymbol;
        square: Square;
    };
}

export interface DirectDefenceDTO {
    type: SpecialAttackType.DIRECT_DEFENCE;
    defendedPiece: {
        type: PieceSymbol;
        square: Square;
    };
    defendingPiece: {
        type: PieceSymbol;
        square: Square;
    };
}

export interface DiscoveredAttackDTO {
    type: SpecialAttackType.DISCOVERED_ATTACK;
    attackedPiece: {
        type: PieceSymbol;
        square: Square;
    };
    attackedBy: {
        type: PieceSymbol;
        square: Square;
    };
    isCheck: boolean;
}

export interface CheckDTO {
    type: SpecialAttackType.CHECK;
    checkingPiece: {
        type: PieceSymbol;
        square: Square;
    };
    isDoubleCheck: boolean;
    secondCheckingPiece?: {
        type: PieceSymbol;
        square: Square;
    };
}

export type TacticsDTO = PinDTO | SkewerDTO | ForkDTO | DirectDefenceDTO | DiscoveredAttackDTO | CheckDTO;