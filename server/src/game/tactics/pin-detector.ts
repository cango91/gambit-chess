import {
    GambitChess,
    PinDTO,
    getOppositeColor,
    getPieceValue,
    SpecialAttackType,
    GambitMove,
} from "@gambit-chess/shared";
import { Square, Color, PieceSymbol, Piece } from "chess.js";
import { getAllTwoHitRayCasts } from "./utils";
import { RayCastDTO } from "../../types";

/**
 * Detects all pins on the board for a given color.
 * @param board The chess board instance.
 * @param pinnedColor The color of the pieces that might be pinned.
 * @returns An array of PinDTO objects representing the pins detected.
 */
function detectAllPins(board: GambitChess, pinnedColor: Color): PinDTO[] {
    return getAllTwoHitRayCasts(board, pinnedColor).filter(cast => {
        return getPieceValue(cast.secondHit.type) > getPieceValue(cast.firstHit.type);
    }).map(cast => {
        return {
            type: SpecialAttackType.PIN,
            pinnedPiece: {
                type: cast.firstHit.type,
                square: cast.firstHit.square
            },
            pinnedTo: {
                type: cast.secondHit.type,
                square: cast.secondHit.square
            },
            pinnedBy: {
                type: cast.attacker.type,
                square: cast.attacker.square
            }
        };
    });
}
/**
 * Detects all pins on the board for a given color that occured after the last move.
 * @param currentBoard The current board state.
 * @param previousBoard The previous board state.
 * @param lastMove The last move made.
 * @returns An array of PinDTO objects representing the pins detected.
 */
export function detectPins(currentBoard: GambitChess, previousBoard: GambitChess, lastMove: GambitMove): PinDTO[] {
    const existingPins = detectAllPins(previousBoard, getOppositeColor(lastMove.color));
    const finalPins = detectAllPins(currentBoard, getOppositeColor(lastMove.color));
    return finalPins.filter(pin => !existingPins.some(existingPin => existingPin.pinnedPiece.square === pin.pinnedPiece.square && existingPin.pinnedTo.square === pin.pinnedTo.square && existingPin.pinnedBy.square === pin.pinnedBy.square));
}

export let exportsForTesting:any;
if (process.env.NODE_ENV === 'test') {
  exportsForTesting = { detectAllPins };
}