import { GambitMove, DiscoveredAttackDTO, SpecialAttackType } from "@gambit-chess/shared";
import { Chess } from "chess.js";

/**
 * Detects discovered attacks revealed by the last move.
 * @param boardState - The board state *after* the move.
 * @param previousBoardState - The board state *before* the move.
 * @param lastMove - The last move made.
 * @returns An array containing DiscoveredAttackDTOs if any discovered attacks were revealed, otherwise empty.
 */
export function detectDiscoveredAttacks(boardState: Chess, previousBoardState: Chess, lastMove: GambitMove): DiscoveredAttackDTO[] {
    const attacks: DiscoveredAttackDTO[] = [];
    // TODO: Implement discovered attack detection logic
    return attacks;
} 