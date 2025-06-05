import { GambitMove, TacticsDTO } from "@gambit-chess/shared";
import { Chess } from 'chess.js';
import { detectChecks } from "./check-detector";
import { detectDiscoveredAttacks } from "./discovered-attack-detector";
import { detectForks } from "./fork-detector";
import { detectPins } from "./pin-detector";
import { detectSkewers } from "./skewer-detector";
import { clearMemoizedTwoHitRayCasts } from "./utils";

/**
 * Detects tactics from the last move. Must be called with a validated move.
 * @param lastMove - The validated last move (must have valid before and after board fen strings)
 * @returns The detected tactics
 */
export function detectTactics(lastMove: GambitMove): TacticsDTO[] {
    // if retreated to original position, no new tactics can be detected
    if(lastMove.tacticalRetreat && lastMove.tacticalRetreat.retreatSquare === lastMove.from){
        return [];
    }
    const previousBoardState = new Chess(lastMove.before);
    const boardState = new Chess(lastMove.after);

    const tactics: TacticsDTO[] = [
        ...detectChecks(boardState, previousBoardState, lastMove),
        ...detectDiscoveredAttacks(boardState, previousBoardState, lastMove),
        ...detectForks(boardState, previousBoardState, lastMove),
        ...detectPins(boardState, previousBoardState, lastMove),
        ...detectSkewers(boardState, previousBoardState, lastMove),
    ];

    clearMemoizedTwoHitRayCasts();

    return tactics;
}