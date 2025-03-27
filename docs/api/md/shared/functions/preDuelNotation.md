[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / preDuelNotation

# Function: preDuelNotation()

> **preDuelNotation**(`move`, `attackerAllocation`, `viewerColor`, `attackerColor`): `string`

Defined in: [notation/index.ts:242](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/notation/index.ts#L242)

Generates pre-duel notation with appropriate visibility based on viewer perspective

## Parameters

### move

[`Move`](../interfaces/Move.md)

The chess move

### attackerAllocation

`number`

The attacker's BP allocation

### viewerColor

[`PieceColor`](../type-aliases/PieceColor.md)

The color of the player viewing the notation

### attackerColor

[`PieceColor`](../type-aliases/PieceColor.md)

The color of the attacking player

## Returns

`string`

Formatted pre-duel notation string with visibility rules applied
