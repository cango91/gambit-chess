import {
    PinDTO,
    getOppositeColor,
    getPieceValue,
    SpecialAttackType,
    GambitMove,
} from "@gambit-chess/shared";
import { Color, Chess, Square} from "chess.js";
import { getAllTwoHitRayCasts } from "./utils";


/**
 * Detects all pins on the board for a given color.
 * @param board The chess board instance.
 * @param pinnedColor The color of the pieces that might be pinned.
 * @returns An array of PinDTO objects representing the pins detected.
 */
function detectAllPins(board: Chess, pinnedColor: Color): PinDTO[] {
    const allCasts = getAllTwoHitRayCasts(board, pinnedColor);
    
    console.log(`🔍 PIN DETECTION DEBUG: Found ${allCasts.length} two-hit ray casts for ${pinnedColor}:`);
    allCasts.forEach((cast, i) => {
        console.log(`  Cast ${i}: ${cast.attacker.square}(${cast.attacker.type}) → ${cast.firstHit.square}(${cast.firstHit.type}) → ${cast.secondHit.square}(${cast.secondHit.type})`);
    });
    
    const validPins = allCasts.filter(cast => {
        const firstValue = getPieceValue(cast.firstHit.type);
        const secondValue = getPieceValue(cast.secondHit.type);
        
        // Check if this is a valid pin (second piece more valuable than first)
        if (secondValue <= firstValue) {
            console.log(`  🔍 Cast ${cast.attacker.square}→${cast.firstHit.square}→${cast.secondHit.square}: SKIPPED - not valuable enough (${secondValue} <= ${firstValue})`);
            return false;
        }
        
        // Note: Ray clearing validation is now handled in getAllTwoHitRayCasts
        
        console.log(`  🔍 Cast ${cast.attacker.square}→${cast.firstHit.square}→${cast.secondHit.square}: VALID PIN - first blocks protection of second`);
        return true;
    });
    
    console.log(`🔍 PIN DETECTION DEBUG: ${validPins.length} valid pins found`);
    
    return validPins.map(cast => {
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
export function detectPins(currentBoard: Chess, previousBoard: Chess, lastMove: GambitMove): PinDTO[] {
    const existingPins = detectAllPins(previousBoard, getOppositeColor(lastMove.color));
    const finalPins = detectAllPins(currentBoard, getOppositeColor(lastMove.color));
    
    console.log(`🔍 PIN DEBUG: Checking pins for ${getOppositeColor(lastMove.color)} after move ${lastMove.san || `${lastMove.from}-${lastMove.to}`}`);
    console.log(`🔍 PIN DEBUG: Board FEN: ${currentBoard.fen()}`);
    console.log(`🔍 PIN DEBUG: Found ${finalPins.length} total pins:`, finalPins);
    console.log(`🔍 PIN DEBUG: Existing pins: ${existingPins.length}`, existingPins);
    
    const newPins = finalPins.filter(pin => !existingPins.some(existingPin => 
        existingPin.pinnedPiece.square === pin.pinnedPiece.square && 
        existingPin.pinnedTo.square === pin.pinnedTo.square && 
        existingPin.pinnedBy.square === pin.pinnedBy.square
    ));
    
    console.log(`🔍 PIN DEBUG: Detected ${newPins.length} NEW pins:`, newPins);
    
    return newPins;
}

export let exportsForTesting:any;
if (process.env.NODE_ENV === 'test') {
  exportsForTesting = { detectAllPins };
}