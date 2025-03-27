[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / ExtendedMove

# Interface: ExtendedMove

Defined in: types/moveTypes.ts:13

Extended move information including duel and retreat data

## Properties

### bpRegeneration

> **bpRegeneration**: `number`

Defined in: types/moveTypes.ts:21

Battle Points regenerated after this move

***

### duel

> **duel**: `null` \| [`Duel`](Duel.md)

Defined in: types/moveTypes.ts:17

Duel information if a capture was attempted

***

### move

> **move**: [`Move`](Move.md)

Defined in: types/moveTypes.ts:15

Base move information

***

### playerColor

> **playerColor**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: types/moveTypes.ts:23

Color of the player who made the move

***

### retreat

> **retreat**: `null` \| [`Retreat`](Retreat.md)

Defined in: types/moveTypes.ts:19

Retreat information if a failed capture resulted in a retreat

***

### turnNumber

> **turnNumber**: `number`

Defined in: types/moveTypes.ts:25

Turn number when this move was made
