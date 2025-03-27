[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / toPGN

# Function: toPGN()

> **toPGN**(`moves`, `headers`, `viewerColor`, `gameOver`): `string`

Defined in: [notation/index.ts:498](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/notation/index.ts#L498)

Converts a move history to PGN format

## Parameters

### moves

[`MoveHistory`](../type-aliases/MoveHistory.md)

Array of moves with duel and retreat information

### headers

[`PGNHeaders`](../interfaces/PGNHeaders.md) = `{}`

PGN header information

### viewerColor

The color of the player viewing the PGN, or null for full information

`null` | [`PieceColor`](../type-aliases/PieceColor.md) | `"spectator"`

### gameOver

`boolean` = `false`

Whether the game is over (determines if all information is visible)

## Returns

`string`

PGN string
