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
    PrimitiveDuelStateDTO,
    DuelInitiatedDTO,
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
    convertFromPrimitiveChatMessage,
    PlayerNameDTO,
    DrawResponseDTO,
    ErrorDTO,
    BPAllocationDTO,
    DuelOutcomeDTO,
    convertToPrimitiveDuelState,
    convertFromPrimitiveDuelState,
    convertFromPrimitiveRetreatState,
    convertToPrimitiveRetreatState,
    PrimitiveRetreatStateDTO
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
    PrimitiveDuelStateDTO as DuelStateDTO,
    PrimitiveRetreatStateDTO as RetreatStateDTO,
    DuelInitiatedDTO,
    DuelOutcomeDTO,
    BPAllocationDTO,
    ErrorDTO,
    DrawResponseDTO,
    PlayerNameDTO,  
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
    convertFromPrimitiveChatMessage as fromChatMessageDTO,
    convertToPrimitiveDuelState as toDuelStateDTO,
    convertFromPrimitiveDuelState as fromDuelStateDTO,
    convertToPrimitiveRetreatState as toRetreatStateDTO,
    convertFromPrimitiveRetreatState as fromRetreatStateDTO
};

