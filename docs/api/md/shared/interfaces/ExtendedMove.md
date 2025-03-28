[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / ExtendedMove

# Interface: ExtendedMove

Defined in: [types/moveTypes.ts:13](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L13)

Extended move information including duel and retreat data

## Properties

### bpRegeneration

> **bpRegeneration**: `number`

Defined in: [types/moveTypes.ts:21](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L21)

Battle Points regenerated after this move

***

### duel

> **duel**: `null` \| [`Duel`](Duel.md)

Defined in: [types/moveTypes.ts:17](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L17)

Duel information if a capture was attempted

***

### move

> **move**: [`Move`](Move.md)

Defined in: [types/moveTypes.ts:15](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L15)

Base move information

***

### playerColor

> **playerColor**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: [types/moveTypes.ts:23](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L23)

Color of the player who made the move

***

### retreat

> **retreat**: `null` \| [`Retreat`](Retreat.md)

Defined in: [types/moveTypes.ts:19](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L19)

Retreat information if a failed capture resulted in a retreat

***

### turnNumber

> **turnNumber**: `number`

Defined in: [types/moveTypes.ts:25](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/moveTypes.ts#L25)

Turn number when this move was made
