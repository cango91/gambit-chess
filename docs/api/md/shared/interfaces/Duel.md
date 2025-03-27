[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / Duel

# Interface: Duel

Defined in: [types/index.ts:113](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L113)

Represents a duel between attacking and defending pieces

## Properties

### attacker

> **attacker**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: [types/index.ts:115](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L115)

Player who initiated the capture attempt

***

### attackerAllocation

> **attackerAllocation**: `number`

Defined in: [types/index.ts:117](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L117)

BP allocated by the attacker

***

### defenderAllocation

> **defenderAllocation**: `number`

Defined in: [types/index.ts:119](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L119)

BP allocated by the defender

***

### outcome

> **outcome**: [`MoveOutcome`](../type-aliases/MoveOutcome.md)

Defined in: [types/index.ts:121](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L121)

The outcome of the duel
