import {
    GambitMove,
    DiscoveredAttackDTO,
    getOppositeColor,
    SpecialAttackType,
    getPiecesByColor,
    isSlidingPiece,
    getSquaresBetween,
    squareToCoords,
    coordsToSquare
} from "@gambit-chess/shared";
import { Chess } from "chess.js";

/**
 * Detects discovered attacks revealed by the last move. Assumes lastMove is valid and occurred.
 * @param boardState - The board state *after* the move.
 * @param previousBoardState - The board state *before* the move (not used internally, kept for signature consistency).
 * @param lastMove - The last move made.
 * @returns An array containing DiscoveredAttackDTOs if any discovered attacks were revealed, otherwise empty.
 */
export function detectDiscoveredAttacks(boardState: Chess, previousBoardState: Chess, lastMove: GambitMove): DiscoveredAttackDTO[] {
    const attacks: DiscoveredAttackDTO[] = [];
    const lastMoveColor = lastMove.color;
    const oppositeColor = getOppositeColor(lastMoveColor);
    const vacatedSquare = lastMove.from;
    const finalSquare = lastMove.to; // Square where the moving piece landed

    // Get squares and types of opponent pieces
    const opponentPieceInfos = getPiecesByColor(boardState, oppositeColor);

    for (const targetPieceInfo of opponentPieceInfos) {
        const targetSquare = targetPieceInfo.square;
        const targetPiece = boardState.get(targetSquare); // Get the full piece object

        // Ensure the piece exists (should always be true if getPiecesByColor is correct)
        if (!targetPiece) {
            continue;
        }

        // Find pieces of the moving player's color attacking the target square *now*
        const currentAttackers = boardState.attackers(targetSquare, lastMoveColor);

        for (const attackerSquare of currentAttackers) {
            // Skip if the attacker is the piece that just moved
            if (attackerSquare === finalSquare) {
                continue;
            }

            const attackingPiece = boardState.get(attackerSquare);

            // Only sliding pieces can reveal discovered attacks
            if (!attackingPiece || !isSlidingPiece(attackingPiece.type)) {
                continue;
            }

            // Check if the vacated square lies strictly between the attacker and the target
            const squaresBetween = getSquaresBetween(attackerSquare, targetSquare);
            if (squaresBetween.includes(vacatedSquare)) {
                // If the vacated square is between the attacker and target,
                // and the attacker is a sliding piece that didn't just move,
                // we can assume the move revealed the attack.
                // This is a discovered attack!
                attacks.push({
                    type: SpecialAttackType.DISCOVERED_ATTACK,
                    attackedPiece: {
                        type: targetPiece.type,
                        square: targetSquare,
                    },
                    attackedBy: {
                        type: attackingPiece.type,
                        square: attackerSquare,
                    },
                    isCheck: targetPiece.type === 'k', // It's a check if the attacked piece is the king
                });
                // Note: We don't break here to capture multiple discovered attacks
                // potentially revealed by the same move (e.g., queen moves diagonally,
                // revealing both a rook and a bishop attack).
            }else{
                // Special case: En-passant "captured square" reveals a discovered attack
                if(lastMove.isEnPassant()){
                    const coords = squareToCoords(lastMove.to);
                    const opponentVacatedSquare = coordsToSquare(coords.x, lastMove.color === 'w' ? coords.y + 1 : coords.y - 1);
                    if(squaresBetween.includes(opponentVacatedSquare)){
                        attacks.push({
                            type: SpecialAttackType.DISCOVERED_ATTACK,
                            attackedPiece: { type: targetPiece.type, square: targetSquare },
                            attackedBy: { type: attackingPiece.type, square: attackerSquare },
                            isCheck: targetPiece.type === 'k',
                        });
                    }
                }
            }
        }
    }

    return attacks;
} 