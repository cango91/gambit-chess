/**
 * Primitive Data Transfer Objects (DTOs) for Gambit Chess
 * These DTOs use only primitive types for efficient serialization
 */

import { IDuelState, IRetreatState } from '../chess/contracts';
import { ChessPiece, ChessPieceColor, ChessPieceType, ChessPosition } from '../chess/types';
import { GamePhase, GameResult, Player, Spectator, ChatMessage } from '../types';

/**
 * DTO for duel initiation notification
 */
export interface DuelInitiatedDTO {
    attackingPiece: string;  // Position as string e.g., 'e4'
    defendingPiece: string;  // Position as string e.g., 'e5'
}

/**
 * DTO for duel outcome notification
 */
export interface DuelOutcomeDTO {
    outcome: string; // MoveOutcome as string
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

/**
 * Primitive representation of a chess piece
 */
export interface PrimitiveChessPieceDTO {
    type: string;      // 'p'|'n'|'b'|'r'|'q'|'k'
    color: string;     // 'w'|'b'
    position: string;  // e.g., 'e4'
    hasMoved: boolean;
    lastMoveTurn?: number;
}

export interface PrimitiveDuelStateDTO {
    attackingPiece?: PrimitiveChessPieceDTO;
    defendingPiece?: PrimitiveChessPieceDTO;
    playerAllocated?: boolean;
    initiatedAt?: number;
}

export interface PrimitiveRetreatStateDTO {
    attacker: PrimitiveChessPieceDTO;
    failedTarget: string;
}

/**
 * Primitive representation of game state
 */
export interface PrimitiveGameStateDTO {
    phase: string;               // GamePhase as string
    turn: string;               // 'w'|'b'
    pieces: PrimitiveChessPieceDTO[];
    moveNumber: number;
    inCheck: boolean;
    bp?: number;
    result?: string;            // GameResult as string
    whiteTimeRemaining: number;
    blackTimeRemaining: number;
    activeTimer: string | null; // 'w'|'b'|null
    players: {                  // Simplified Player type
        id: string;
        name: string;
        color: string;         // 'w'|'b'
    }[];
    spectators: {              // Simplified Spectator type
        id: string;
        name: string;
    }[];
    duel?: PrimitiveDuelStateDTO;         // Active duel information if any
    retreat?: PrimitiveRetreatStateDTO;   // Active retreat information if any
}

/**
 * Primitive representation of a move
 */
export interface PrimitiveMoveDTO {
    from: string;  // e.g., 'e2'
    to: string;    // e.g., 'e4'
}

/**
 * Primitive representation of retreat options
 */
export interface PrimitiveRetreatOptionDTO {
    to: string;    // e.g., 'e4'
    cost: number;
}

/**
 * Primitive representation of a player
 */
export interface PrimitivePlayerDTO {
    id: string;
    name: string;
    color: string;         // 'w'|'b'
}

/**
 * Primitive representation of a spectator
 */
export interface PrimitiveSpectatorDTO {
    id: string;
    name: string;
}

/**
 * Primitive representation of a chat message
 */
export interface PrimitiveChatMessageDTO {
    senderName: string;
    message: string;
    timestamp: number;
}

/**
 * Converters between complex and primitive types
 */

export const convertToPrimitivePiece = (piece: ChessPiece): PrimitiveChessPieceDTO => ({
    type: piece.type.value,
    color: piece.color.value,
    position: piece.position?.value || '',
    hasMoved: piece.hasMoved,
    lastMoveTurn: piece.lastMoveTurn
});

export const convertFromPrimitivePiece = (dto: PrimitiveChessPieceDTO): ChessPiece => {
    return new ChessPiece(
        new ChessPieceType(dto.type),
        new ChessPieceColor(dto.color),
        dto.position ? new ChessPosition(dto.position) : null,
        dto.hasMoved,
        dto.lastMoveTurn
    );
};

export const convertToPrimitiveDuelState = (duel: IDuelState): PrimitiveDuelStateDTO => ({
    attackingPiece: duel.attackingPiece ? convertToPrimitivePiece(duel.attackingPiece as ChessPiece) : undefined,
    defendingPiece: duel.defendingPiece ? convertToPrimitivePiece(duel.defendingPiece as ChessPiece) : undefined,
    playerAllocated: duel.playerAllocated ?? undefined,
    initiatedAt: duel.initiatedAt ?? undefined
});

export const convertFromPrimitiveDuelState = (dto: PrimitiveDuelStateDTO): IDuelState => ({
    attackingPiece: dto.attackingPiece ? convertFromPrimitivePiece(dto.attackingPiece) : undefined,
    defendingPiece: dto.defendingPiece ? convertFromPrimitivePiece(dto.defendingPiece) : undefined,
    playerAllocated: dto.playerAllocated ?? undefined,
    initiatedAt: dto.initiatedAt ?? undefined
});

export const convertToPrimitiveRetreatState = (retreat: IRetreatState): PrimitiveRetreatStateDTO => ({
    attacker: convertToPrimitivePiece(retreat.attacker as ChessPiece),
    failedTarget: retreat.failedTarget.value
});

export const convertFromPrimitiveRetreatState = (dto: PrimitiveRetreatStateDTO): IRetreatState => ({
    attacker: convertFromPrimitivePiece(dto.attacker),
    failedTarget: new ChessPosition(dto.failedTarget)
});
export const convertToPrimitiveMove = (from: ChessPosition, to: ChessPosition): PrimitiveMoveDTO => ({
    from: from.value,
    to: to.value
});

export const convertFromPrimitiveMove = (dto: PrimitiveMoveDTO): { from: ChessPosition; to: ChessPosition } => ({
    from: new ChessPosition(dto.from),
    to: new ChessPosition(dto.to)
});

export const convertToPrimitiveRetreatOption = (option: { to: ChessPosition; cost: number }): PrimitiveRetreatOptionDTO => ({
    to: option.to.value,
    cost: option.cost
});

export const convertFromPrimitiveRetreatOption = (dto: PrimitiveRetreatOptionDTO): { to: ChessPosition; cost: number } => ({
    to: new ChessPosition(dto.to),
    cost: dto.cost
});

// Helper function to convert game state
export const convertToPrimitiveGameState = (state: any): PrimitiveGameStateDTO => ({
    phase: state.phase,
    turn: state.turn.value,
    pieces: state.pieces.map(convertToPrimitivePiece),
    moveNumber: state.moveNumber,
    inCheck: state.inCheck,
    bp: state.bp,
    result: state.result,
    whiteTimeRemaining: state.whiteTimeRemaining,
    blackTimeRemaining: state.blackTimeRemaining,
    activeTimer: state.activeTimer?.value || null,
    players: state.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        color: p.color.value
    })),
    spectators: state.spectators.map((s: any) => ({
        id: s.id,
        name: s.name
    })),
    duel: state.duel
});

export const convertFromPrimitiveGameState = (dto: PrimitiveGameStateDTO): any => ({
    phase: dto.phase as GamePhase,
    turn: new ChessPieceColor(dto.turn),
    pieces: dto.pieces.map(convertFromPrimitivePiece),
    moveNumber: dto.moveNumber,
    inCheck: dto.inCheck,
    bp: dto.bp,
    result: dto.result as GameResult,
    whiteTimeRemaining: dto.whiteTimeRemaining,
    blackTimeRemaining: dto.blackTimeRemaining,
    activeTimer: dto.activeTimer ? new ChessPieceColor(dto.activeTimer) : null,
    players: dto.players.map(p => ({
        id: p.id,
        name: p.name,
        color: new ChessPieceColor(p.color)
    })),
    spectators: dto.spectators.map(s => ({
        id: s.id,
        name: s.name
    })),
    duel: dto.duel
});

/**
 * Convert complex Player type to primitive DTO
 */
export const convertToPrimitivePlayer = (player: Player): PrimitivePlayerDTO => ({
    id: player.id,
    name: player.name,
    color: player.color?.value ?? ''
});

/**
 * Convert primitive DTO to complex Player type
 */
export const convertFromPrimitivePlayer = (dto: PrimitivePlayerDTO): Player => ({
    id: dto.id,
    name: dto.name,
    color: new ChessPieceColor(dto.color)
});

/**
 * Convert complex Spectator type to primitive DTO
 */
export const convertToPrimitiveSpectator = (spectator: Spectator): PrimitiveSpectatorDTO => ({
    id: spectator.id,
    name: spectator.name
});

/**
 * Convert primitive DTO to complex Spectator type
 */
export const convertFromPrimitiveSpectator = (dto: PrimitiveSpectatorDTO): Spectator => ({
    id: dto.id,
    name: dto.name
});

/**
 * Convert complex ChatMessage type to primitive DTO
 */
export const convertToPrimitiveChatMessage = (message: ChatMessage): PrimitiveChatMessageDTO => ({
    senderName: message.senderName,
    message: message.message,
    timestamp: message.timestamp
});

/**
 * Convert primitive DTO to complex ChatMessage type
 */
export const convertFromPrimitiveChatMessage = (dto: PrimitiveChatMessageDTO): ChatMessage => ({
    senderName: dto.senderName,
    message: dto.message,
    timestamp: dto.timestamp
}); 