import { castRay, getDirection, getOppositeColor, getPiecesByColor, isSlidingPiece } from "@gambit-chess/shared";
import { RayCastDTO } from "../../types";
import { Color, Chess, Square } from "chess.js";

const memoizedCasts = new Map<string, RayCastDTO[]>();

/**
 * Checks if a piece can legally move in a way that would clear the ray from attacker.
 * @param board The chess board instance
 * @param pieceSquare The square of the piece that might be blocking
 * @param attackerSquare The square of the attacking piece  
 * @param direction The ray direction from attacker
 * @param pieceColor The color of the piece being checked
 * @returns True if the piece can move to clear the ray, false otherwise
 */
function canPieceMoveToClearRay(board: Chess, pieceSquare: string, attackerSquare: string, direction: any, pieceColor: Color): boolean {
    const piece = board.get(pieceSquare as Square);
    if (!piece) return false;

    // Get all legal moves for this piece
    const moves = board.moves({ square: pieceSquare as Square, verbose: true });
    
    console.log(`    🔍 Checking if ${piece.type} on ${pieceSquare} can clear ray from ${attackerSquare}`);
    console.log(`    🔍 Available moves: ${moves.map(m => m.san).join(', ')}`);
    
    // Check if any move would clear the ray from attacker
    for (const move of moves) {
        // Simulate the move
        const moveResult = board.move(move);
        if (moveResult) {
            // After the move, cast a ray from attacker in the same direction
            const newRay = castRay(board, attackerSquare as Square, direction);
            
            // Undo the move
            board.undo();
            
            // CRITICAL FIX: The ray is cleared ONLY if:
            // 1. No piece is hit (ray goes to edge of board), OR
            // 2. A DIFFERENT piece (different color/type) is hit
            // The ray is NOT cleared if the same piece is hit at its new location
            const rayCleared = !newRay || 
                               (newRay.piece.color !== piece.color || newRay.piece.type !== piece.type);
            
            if (rayCleared) {
                console.log(`    🎯 Move ${move.san} WOULD clear ray from ${attackerSquare} - ray target: ${newRay ? `${newRay.square}(${newRay.piece.type})` : 'none'}`);
                return true;
            } else {
                console.log(`    ⚪ Move ${move.san} would NOT clear ray - same piece still blocking at ${newRay?.square}`);
            }
        }
    }
    
    console.log(`    ❌ No legal moves for ${piece.type} on ${pieceSquare} would clear ray from ${attackerSquare}`);
    return false;
}

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
            // Check if this piece can actually move to clear the ray - CRITICAL validation
            const canClearRay = canPieceMoveToClearRay(board, piece.square, attackerSquare, direction, color);
            
            if (!canClearRay) {
                // Skip this candidate - piece cannot meaningfully move to clear the ray
                console.log(`    🚫 Skipping pin candidate: ${piece.type} on ${piece.square} cannot clear ray from ${attackerSquare}`);
                continue;
            }

            // temporarily remove the original attacked piece
            board.remove(piece.square);
            // cast a ray in the direction of the attacker
            const ray = castRay(board, attackerSquare, direction);
            // if the ray is blocked, there is a valid candidate
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