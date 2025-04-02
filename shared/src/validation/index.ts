/**
 * Validation utilities for Gambit Chess
 * 
 * This module provides validation functions for Data Transfer Objects (DTOs)
 * and other shared data structures.
 */

import { 
  GameStateDTO, 
  MoveDTO, 
  BPAllocationDTO, 
  DuelInitiatedDTO,
  DuelOutcomeDTO,
  RetreatOptionDTO,
  ChatMessageDTO,
  PlayerDTO,
  SpectatorDTO
} from '../dtos';
import { GamePhase, GameResult } from '../types';
import { ChessPieceColor, ChessPosition } from '../chess/types';
import { PIECE_COLOR } from '..';

/**
 * Validates a position string
 * @param position The position to validate
 * @type {Position | string | number[] | null | undefined}
 * @returns True if the position is valid
 */
export function validatePosition(position: ChessPosition | string | number[] | null | undefined): boolean {
  if (!position) return false;
  return ChessPosition.isValidPosition(position);
}

/**
 * Validates a piece color
 * @param color The color to validate
 * @returns True if the color is valid
 */
export function validatePieceColor(color: ChessPieceColor | string | null | undefined): boolean {
  if (!color) return false;
  if (typeof color === 'string') {
    try {
      color = PIECE_COLOR(color);
    } catch {
      return false;
    }
  }
  return color.value === 'white' || color.value === 'black';
}

/**
 * Validates a game phase
 * @param phase The game phase to validate
 * @returns True if the phase is valid
 */
export function validateGamePhase(phase: GamePhase | string | null | undefined): boolean {
  if (!phase) return false;
  return Object.values(GamePhase).includes(phase as GamePhase);
}

/**
 * Validates a game result
 * @param result The game result to validate
 * @returns True if the result is valid
 */
export function validateGameResult(result: GameResult | string | null | undefined): boolean {
  if (!result) return true; // Result is optional
  return Object.values(GameResult).includes(result as GameResult);
}

/**
 * Validates a game ID
 * @param gameId The game ID to validate
 * @returns True if the game ID is valid
 */
export function validateGameId(gameId: string | null | undefined): boolean {
  if (!gameId) return false;
  // Basic validation - adjust based on your ID format
  return typeof gameId === 'string' && gameId.trim().length > 0;
}

/**
 * Validates a sequence number
 * @param sequence The sequence number to validate
 * @returns True if the sequence number is valid
 */
export function validateSequence(sequence: number | null | undefined): boolean {
  if (sequence === null || sequence === undefined) return false;
  return Number.isInteger(sequence) && sequence >= 0;
}

/**
 * Validates a timestamp
 * @param timestamp The timestamp to validate
 * @returns True if the timestamp is valid
 */
export function validateTimestamp(timestamp: number | null | undefined): boolean {
  if (timestamp === null || timestamp === undefined) return false;
  return Number.isInteger(timestamp) && timestamp > 0;
}

/**
 * Validates a BP amount
 * @param amount The BP amount to validate
 * @returns True if the BP amount is valid
 */
export function validateBPAmount(amount: number | null | undefined): boolean {
  if (amount === null || amount === undefined) return false;
  return Number.isInteger(amount) && amount >= 0;
}

/**
 * Validates a time value in milliseconds
 * @param time The time value to validate
 * @returns True if the time value is valid
 */
export function validateTime(time: number | null | undefined): boolean {
  if (time === null || time === undefined) return false;
  return Number.isInteger(time) && time >= 0;
}

/**
 * Validates a player or spectator name
 * @param name The name to validate
 * @returns True if the name is valid
 */
export function validateName(name: string | null | undefined): boolean {
  if (!name) return false;
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 30;
}

/**
 * Validates a chat message
 * @param message The message to validate
 * @returns True if the message is valid
 */
export function validateChatMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return typeof message === 'string' && message.trim().length > 0 && message.length <= 500;
}

/**
 * Validates a GameStateDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateGameStateDTO(dto: Partial<GameStateDTO>): boolean {
  if (!dto) return false;
  
  // Required fields
  if (!validateGamePhase(dto.phase)) return false;
  if (!validatePieceColor(dto.turn)) return false;
  if (!Array.isArray(dto.pieces)) return false;
  if (typeof dto.moveNumber !== 'number' || dto.moveNumber < 0) return false;
  if (typeof dto.inCheck !== 'boolean') return false;
  if (!validateTime(dto.whiteTimeRemaining)) return false;
  if (!validateTime(dto.blackTimeRemaining)) return false;
  
  // Optional fields
  if (dto.bp !== undefined && (typeof dto.bp !== 'number' || dto.bp < 0)) return false;
  if (dto.result !== undefined && !validateGameResult(dto.result)) return false;
  if (dto.activeTimer !== null && dto.activeTimer !== undefined && !validatePieceColor(dto.activeTimer)) return false;
  
  // Arrays
  if (!Array.isArray(dto.players)) return false;
  if (!Array.isArray(dto.spectators)) return false;
  
  return true;
}

/**
 * Validates a MoveDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateMoveDTO(dto: Partial<MoveDTO>): boolean {
  if (!dto) return false;
  
  if (!validatePosition(dto.from)) return false;
  if (!validatePosition(dto.to)) return false;
  
  return true;
}

/**
 * Validates a BPAllocationDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateBPAllocationDTO(dto: Partial<BPAllocationDTO>): boolean {
  if (!dto) return false;
  
  if (!validateBPAmount(dto.bp)) return false;
  
  return true;
}

/**
 * Validates a RetreatDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateRetreatDTO(dto: Partial<RetreatOptionDTO>): boolean {
  if (!dto) return false;
  
  if (!validatePosition(dto.to)) return false;
  if (typeof dto.cost !== 'number' || dto.cost < 0) return false;
  
  return true;
}

/**
 * Validates a DuelInitiatedDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateDuelInitiatedDTO(dto: Partial<DuelInitiatedDTO>): boolean {
  if (!dto) return false;
  
  if (!validatePosition(dto.attackingPiece)) return false;
  if (!validatePosition(dto.defendingPiece)) return false;
  
  return true;
}

/**
 * Validates a DuelOutcomeDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateDuelOutcomeDTO(dto: Partial<DuelOutcomeDTO>): boolean {
  if (!dto) return false;
  
  if (dto.outcome !== 'success' && dto.outcome !== 'failed') return false;
  if (!validateBPAmount(dto.attackerAllocation)) return false;
  if (!validateBPAmount(dto.defenderAllocation)) return false;
  
  return true;
}

/**
 * Validates a RetreatOptionsDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateRetreatOptionsDTO(dto: RetreatOptionDTO[]): boolean {
  if (!Array.isArray(dto)) return false;
  
  return dto.every(option => validateRetreatDTO(option));
}

/**
 * Validates a RetreatSelectionDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateRetreatSelectionDTO(dto: Partial<RetreatOptionDTO>): boolean {
  if (!dto) return false;
  
  if (!validatePosition(dto.to)) return false;
  
  return true;
}

/**
 * Validates a ChatMessageDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateChatMessageDTO(dto: Partial<ChatMessageDTO>): boolean {
  if (!dto) return false;
  
  if (!validateName(dto.senderName)) return false;
  if (!validateChatMessage(dto.message)) return false;
  
  return true;
}

/**
 * Validates a PlayerDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validatePlayerDTO(dto: Partial<PlayerDTO>): boolean {
  if (!dto) return false;
  
  if (!dto.id || typeof dto.id !== 'string') return false;
  if (!validateName(dto.name)) return false;
  if (!validatePieceColor(dto.color)) return false;
  
  return true;
}

/**
 * Validates a SpectatorDTO
 * @param dto The DTO to validate
 * @returns True if the DTO is valid
 */
export function validateSpectatorDTO(dto: Partial<SpectatorDTO>): boolean {
  if (!dto) return false;
  
  if (!dto.id || typeof dto.id !== 'string') return false;
  if (!validateName(dto.name)) return false;
  
  return true;
} 