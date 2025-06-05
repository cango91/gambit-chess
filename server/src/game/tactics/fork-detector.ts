import { GambitMove, ForkDTO, SpecialAttackType, getOppositeColor, getPiecesByColor } from "@gambit-chess/shared";
import { Chess, Color, Square } from "chess.js";

/**
 * Detects forks created by the last move.
 * @param boardState - The board state *after* the move.
 * @param previousBoardState - The board state *before* the move.
 * @param lastMove - The last move made.
 * @returns An array containing ForkDTOs if any forks were created, otherwise empty.
 */
export function detectForks(boardState: Chess, previousBoardState: Chess, lastMove: GambitMove): ForkDTO[] {
    const forkedByColor = lastMove.color;
    const existingForks = detectAllForks(previousBoardState, forkedByColor);
    const finalForks = detectAllForks(boardState, forkedByColor);
    return finalForks.filter(fork => !existingForks.some(existingFork => {
        // Check if the forking piece is the same
        if (existingFork.forkedBy.square !== fork.forkedBy.square || existingFork.forkedBy.type !== fork.forkedBy.type) {
            return false;
        }
        // Check if the set of forked pieces is identical
        if (existingFork.forkedPieces.length !== fork.forkedPieces.length) {
            return false; // Different number of pieces forked
        }
        const existingForkedSquares = existingFork.forkedPieces.map(p => p.square).sort();
        const currentForkedSquares = fork.forkedPieces.map(p => p.square).sort();

        return existingForkedSquares.every((sq, index) => sq === currentForkedSquares[index]);
    }));
}

function detectAllForks(board: Chess, forkedByColor: Color): ForkDTO[] {
    const opponentColor = getOppositeColor(forkedByColor);
    const opponentPieces = getPiecesByColor(board, opponentColor);
    const attackerMap = new Map<Square, Square[]>();
    const forks: ForkDTO[] = [];

    for (const piece of opponentPieces) {
        if(!board.isAttacked(piece.square, forkedByColor)) {
            continue;
        }
        board.attackers(piece.square, forkedByColor).forEach(attacker => {
            const existingAttackers = attackerMap.get(attacker) || [];
            attackerMap.set(attacker, [...existingAttackers, piece.square]);
        });
    }

    for (const [attacker, attackedSquares] of attackerMap.entries()) {
        if(attackedSquares.length > 1) {
            forks.push({
                type: SpecialAttackType.FORK,
                forkedPieces: attackedSquares.map(square => ({
                    type: board.get(square)!.type,
                    square
                })),
                forkedBy: {
                    type: board.get(attacker)!.type,
                    square: attacker
                }
            });
        }
    }
    return forks;
}

export let exportsForTesting:any;
if (process.env.NODE_ENV === 'test') {
  exportsForTesting = { detectAllForks };
}