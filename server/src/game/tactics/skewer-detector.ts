import { GambitChess, GambitMove, getOppositeColor, getPieceValue, SkewerDTO, SpecialAttackType } from "@gambit-chess/shared";
import { Color } from "chess.js";
import { getAllTwoHitRayCasts } from "./utils";

/**
 * Detects all skewers on the board for a given color.
 * @param board The chess board instance.
 * @param color The color of the pieces which interact with skewers.
 * @returns An array of SkewerDTO objects representing the skewers detected.
 */
function detectAllSkewers(board: GambitChess, color: Color): SkewerDTO[] {
    return getAllTwoHitRayCasts(board, color).filter(cast => {
        return getPieceValue(cast.firstHit.type) >= getPieceValue(cast.secondHit.type);
    }).map(cast => {
        return {
            type: SpecialAttackType.SKEWER,
            skeweredPiece: {
                type: cast.firstHit.type,
                square: cast.firstHit.square
            },
            skeweredTo: {
                type: cast.secondHit.type,
                square: cast.secondHit.square
            },
            skeweredBy: {
                type: cast.attacker.type,
                square: cast.attacker.square
            }
        };
    });
}
/**
 * Detects all skewers on the board for a given color that occured after the last move.
 * @param currentBoard The current board state.
 * @param previousBoard The previous board state.
 * @param lastMove The last move made.
 * @returns An array of SkewerDTO objects representing the skewers detected.
 */
export function detectSkewers(currentBoard: GambitChess, previousBoard: GambitChess, lastMove: GambitMove): SkewerDTO[] {
    const existingSkewers = detectAllSkewers(previousBoard, getOppositeColor(lastMove.color));
    const finalSkewers = detectAllSkewers(currentBoard, getOppositeColor(lastMove.color));
    return finalSkewers.filter(skewer => !existingSkewers.some(existingSkewer => existingSkewer.skeweredPiece.square === skewer.skeweredPiece.square && existingSkewer.skeweredTo.square === skewer.skeweredTo.square && existingSkewer.skeweredBy.square === skewer.skeweredBy.square));
}

export let exportsForTesting:any;
if (process.env.NODE_ENV === 'test') {
  exportsForTesting = { detectAllSkewers };
}