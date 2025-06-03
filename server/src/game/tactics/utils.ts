import { castRay, getDirection, getOppositeColor, getPiecesByColor, isSlidingPiece } from "@gambit-chess/shared";
import { RayCastDTO } from "../../types";
import { Color, Chess } from "chess.js";

const memoizedCasts = new Map<string, RayCastDTO[]>();

/**
 * Detects all two-hit ray casts for a given color with memoization.
 * @param board The chess board instance.
 * @param color The color of the pieces which interact with ray casts.
 * @param useCache Whether to use memoization.
 * @returns An array of RayCastDTO objects representing the two-hit ray casts detected.
 */
export function getAllTwoHitRayCasts(board: Chess, color: Color, useCache: boolean = true): RayCastDTO[] {
    const memoKey = `${color}-${board.fen()}`;
    if(useCache && memoizedCasts.has(memoKey)){
        return memoizedCasts.get(memoKey) ?? [];
    }
    const casts : RayCastDTO[] = [];
    const pieces = getPiecesByColor(board, color);
    for(const piece of pieces){
        const attackers = board.attackers(piece.square, getOppositeColor(color));
        for(const attackerSquare of attackers){
            const attacker = board.get(attackerSquare);
            if(!attacker){
                console.warn(`Attacker not found: ${attackerSquare}`);
                continue;
            }
            if(!isSlidingPiece(attacker.type)){
                continue;
            }
            const direction = getDirection(attackerSquare, piece.square);

            if(!direction){
                continue;
            }
            // first hit is the piece that is being attacked
            const firstHit = {
                square: piece.square,
                type: piece.type
            };
            // temporarily remove the original attacked piece
            board.remove(piece.square);
            // cast a ray in the direction of the attacker
            const ray = castRay(board, attackerSquare, direction);
            // if the ray is blocked, there is a pin
            if(ray && ray.piece.color === color){
                const secondHit = {
                    square: ray.square,
                    type: ray.piece.type
                };
                casts.push({
                    attacker: {
                        square: attackerSquare,
                        type: attacker.type
                    },
                    direction,
                    firstHit,
                    secondHit
                });
            }
            // put the attacked piece back
            board.put({type: piece.type, color: color}, piece.square);
        }
    }
    memoizedCasts.set(memoKey, casts);
    return casts;
}

/**
 * Clears the memoized two-hit ray casts.
 */
export function clearMemoizedTwoHitRayCasts(){
    memoizedCasts.clear();
}