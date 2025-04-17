import { Direction } from "@gambit-chess/shared";
import { PieceSymbol, Square } from "chess.js";

export interface RayCastDTO{
    attacker: {
        square: Square;
        type: PieceSymbol;
    };
    direction: Direction;
    firstHit: {
        square: Square;
        type: PieceSymbol;
    };
    secondHit: {
        square: Square;
        type: PieceSymbol;
    };
}