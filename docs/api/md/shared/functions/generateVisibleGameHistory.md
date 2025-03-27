[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / generateVisibleGameHistory

# Function: generateVisibleGameHistory()

> **generateVisibleGameHistory**(`moves`, `viewerColor`, `gameOver`): [`MoveHistory`](../type-aliases/MoveHistory.md)

Defined in: [notation/index.ts:289](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/notation/index.ts#L289)

Generates game history with appropriate visibility based on viewer perspective
Implements information hiding rules for BP allocation and regeneration

## Parameters

### moves

[`MoveHistory`](../type-aliases/MoveHistory.md)

Array of moves with all information

### viewerColor

The color of the player viewing the history, or 'spectator'

[`PieceColor`](../type-aliases/PieceColor.md) | `"spectator"`

### gameOver

`boolean` = `false`

Whether the game is over (determines if all information is visible)

## Returns

[`MoveHistory`](../type-aliases/MoveHistory.md)

Filtered move history with appropriate information visibility
