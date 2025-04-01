/**
 * Data Transfer Objects (DTOs) for Gambit Chess
 */

import {
    PrimitiveChessPieceDTO,
    PrimitiveGameStateDTO,
    PrimitiveMoveDTO,
    PrimitiveRetreatOptionDTO,
    PrimitivePlayerDTO,
    PrimitiveSpectatorDTO,
    PrimitiveChatMessageDTO,
    DuelInfoDTO,
    convertToPrimitivePiece,
    convertFromPrimitivePiece,
    convertToPrimitiveMove,
    convertFromPrimitiveMove,
    convertToPrimitiveRetreatOption,
    convertFromPrimitiveRetreatOption,
    convertToPrimitiveGameState,
    convertFromPrimitiveGameState,
    convertToPrimitivePlayer,
    convertFromPrimitivePlayer,
    convertToPrimitiveSpectator,
    convertFromPrimitiveSpectator,
    convertToPrimitiveChatMessage,
    convertFromPrimitiveChatMessage
} from './primitives';

// Re-export primitive DTOs
export {
    PrimitiveChessPieceDTO as ChessPieceDTO,
    PrimitiveGameStateDTO as GameStateDTO,
    PrimitiveMoveDTO as MoveDTO,
    PrimitiveRetreatOptionDTO as RetreatOptionDTO,
    PrimitivePlayerDTO as PlayerDTO,
    PrimitiveSpectatorDTO as SpectatorDTO,
    PrimitiveChatMessageDTO as ChatMessageDTO,
    DuelInfoDTO
};

// Re-export converters
export {
    convertToPrimitivePiece as toPieceDTO,
    convertFromPrimitivePiece as fromPieceDTO,
    convertToPrimitiveMove as toMoveDTO,
    convertFromPrimitiveMove as fromMoveDTO,
    convertToPrimitiveRetreatOption as toRetreatOptionDTO,
    convertFromPrimitiveRetreatOption as fromRetreatOptionDTO,
    convertToPrimitiveGameState as toGameStateDTO,
    convertFromPrimitiveGameState as fromGameStateDTO,
    convertToPrimitivePlayer as toPlayerDTO,
    convertFromPrimitivePlayer as fromPlayerDTO,
    convertToPrimitiveSpectator as toSpectatorDTO,
    convertFromPrimitiveSpectator as fromSpectatorDTO,
    convertToPrimitiveChatMessage as toChatMessageDTO,
    convertFromPrimitiveChatMessage as fromChatMessageDTO
};

/**
 * DTO for duel initiation notification
 */
export interface DuelInitiatedDTO {
    attackingPiece: string;  // Position as string e.g., 'e4'
    defendingPiece: string;  // Position as string e.g., 'e5'
    position: string;        // Position as string e.g., 'e5'
}

/**
 * DTO for duel outcome notification
 */
export interface DuelOutcomeDTO {
    winner: string;           // 'w'|'b'
    result: string;          // MoveOutcome as string
    attackerAllocation: number;
    defenderAllocation: number;
}

/**
 * DTO for BP update notification
 */
export interface BPAllocationDTO {
    bp: number;
}

/**
 * DTO for error messages
 */
export interface ErrorDTO {
    code: string;
    message: string;
}

/**
 * DTO for draw response
 */
export interface DrawResponseDTO {
    accept: boolean;
}

/**
 * DTO for player name setting
 */
export interface PlayerNameDTO {
    gameId: string;
    name: string;
}