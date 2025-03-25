import { atom } from 'recoil';
import { GameStateDTO, Position, RetreatOption } from '@gambit-chess/shared';

// Selected piece state
export interface SelectedPieceState {
  position: Position | null;
  availableMoves: Position[];
}

export const selectedPieceState = atom<SelectedPieceState>({
  key: 'selectedPiece',
  default: {
    position: null,
    availableMoves: []
  }
});

// Game state atom
export const gameStateAtom = atom<GameStateDTO | null>({
  key: 'gameState',
  default: null
});

// Game loading state
export const gameLoadingState = atom<boolean>({
  key: 'gameLoading',
  default: true
});

// Game error state
export const gameErrorState = atom<string | null>({
  key: 'gameError',
  default: null
});

// Duel state (for battle points allocation)
export interface DuelState {
  attackerPosition: Position | null;
  defenderPosition: Position | null;
  allocatedBP: number;
}

export const duelStateAtom = atom<DuelState>({
  key: 'duelState',
  default: {
    attackerPosition: null,
    defenderPosition: null,
    allocatedBP: 0
  }
});

// Tactical retreat state
export interface TacticalRetreatState {
  piecePosition: Position | null;
  originalPosition: Position | null;
  availableRetreats: RetreatOption[];
  selectedRetreat: Position | null;
}

export const tacticalRetreatStateAtom = atom<TacticalRetreatState>({
  key: 'tacticalRetreatState',
  default: {
    piecePosition: null,
    originalPosition: null,
    availableRetreats: [],
    selectedRetreat: null
  }
});

// Animation state for pieces
export interface AnimationState {
  movingPiece: {
    from: Position | null;
    to: Position | null;
  };
  capturedPiece: Position | null;
  duelAnimation: boolean;
}

export const animationStateAtom = atom<AnimationState>({
  key: 'animationState',
  default: {
    movingPiece: {
      from: null,
      to: null
    },
    capturedPiece: null,
    duelAnimation: false
  }
}); 