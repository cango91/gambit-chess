import { GambitChess, GambitMove, CheckDTO, SpecialAttackType, getOppositeColor } from "@gambit-chess/shared";
import { Color } from "chess.js";

/**
 * Detects checks (including double checks) resulting from the last move.
 * @param boardState - The board state *after* the move.
 * @param previousBoardState - The board state *before* the move.
 * @param lastMove - The last move made.
 * @returns An array containing a CheckDTO if a *new* check occurred, otherwise empty.
 */
export function detectChecks(boardState: GambitChess, previousBoardState: GambitChess, lastMove: GambitMove): CheckDTO[] {
    const opponentColor: Color = getOppositeColor(lastMove.color);

    // Only trigger if the opponent is now in check
    if (!boardState.isCheck()) {
        return [];
    }

    const checks: CheckDTO[] = [];
    const kingPosition = boardState.getKingPosition(opponentColor);
    if (!kingPosition) {
        // Should not happen in a valid game state
        console.error("Could not find opponent's king position.");
        return [];
    }

    // Find pieces of the player who just moved (lastMove.color) that attack the opponent's king
    const attackers = boardState.attackers(kingPosition, lastMove.color);

    if (attackers.length === 0) {
        // This condition should technically be covered by boardState.isCheck(), but added for safety
        console.warn("Board state reports check, but no attackers found.");
        return [];
    }

    // If there is only one attacker, it is a single check
    if (attackers.length === 1) {
        const attackerPiece = boardState.getPieceAt(attackers[0]);
        if (!attackerPiece) { // Should not happen
            console.error(`Attacker piece not found at ${attackers[0]} during check detection.`);
            return [];
        }
        checks.push({
            type: SpecialAttackType.CHECK,
            checkingPiece: {
                type: attackerPiece.type,
                square: attackers[0],
            },
            isDoubleCheck: false,
        });
    }
    // If there are multiple attackers, it is a double check
    else { // attackers.length > 1 implied by isCheck() and previous check
        const attacker1Piece = boardState.getPieceAt(attackers[0]);
        const attacker2Piece = boardState.getPieceAt(attackers[1]);

        if (!attacker1Piece || !attacker2Piece) { // Should not happen
            console.error(`Attacker piece(s) not found at ${attackers[0]} or ${attackers[1]} during double check detection.`);
            return [];
        }

        checks.push({
            type: SpecialAttackType.CHECK,
            checkingPiece: {
                type: attacker1Piece.type,
                square: attackers[0],
            },
            isDoubleCheck: true,
            secondCheckingPiece: {
                type: attacker2Piece.type,
                square: attackers[1],
            },
        });
    }
    return checks;
} 