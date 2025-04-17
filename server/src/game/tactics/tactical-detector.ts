import { GambitChess, GambitMove, TacticsDTO } from "@gambit-chess/shared";
import { detectChecks } from "./check-detector";
import { detectDirectDefences } from "./direct-defence-detector";
import { detectDiscoveredAttacks } from "./discovered-attack-detector";
import { detectForks } from "./fork-detector";
import { detectPins } from "./pin-detector";
import { detectSkewers } from "./skewer-detector";
import { clearMemoizedTwoHitRayCasts } from "./utils";

/**
 * Detects tactics from the last move. Must be called after the last move has been validated and made.
 * @param boardState - The current board state after the last move
 * @param lastMove - The last move
 * @returns The detected tactics
 */
export function detectTactics(boardState: GambitChess, lastMove: GambitMove): TacticsDTO[] {
    // if retreated to original position, no new tactics can be detected
    if(lastMove.tacticalRetreat && lastMove.tacticalRetreat.retreatSquare === lastMove.from){
        return [];
    }
    const previousBoardState = new GambitChess(boardState.fen(), boardState['config']);
    previousBoardState.undo();

    const tactics: TacticsDTO[] = [
        ...detectChecks(boardState, previousBoardState, lastMove),
        ...detectDirectDefences(boardState, previousBoardState, lastMove),
        ...detectDiscoveredAttacks(boardState, previousBoardState, lastMove),
        ...detectForks(boardState, previousBoardState, lastMove),
        ...detectPins(boardState, previousBoardState, lastMove),
        ...detectSkewers(boardState, previousBoardState, lastMove),
    ];

    clearMemoizedTwoHitRayCasts();

    return tactics;
}