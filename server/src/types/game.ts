import { BaseGameState } from "@gambit-chess/shared";

export interface GameState extends BaseGameState {
    bpPools: {
        white: number;
        black: number;
    };
}
