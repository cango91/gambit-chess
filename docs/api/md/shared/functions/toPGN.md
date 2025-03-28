[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / toPGN

# Function: toPGN()

> **toPGN**(`moves`, `headers`, `viewerColor`, `gameOver`): `string`

Defined in: [notation/index.ts:498](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/notation/index.ts#L498)

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
