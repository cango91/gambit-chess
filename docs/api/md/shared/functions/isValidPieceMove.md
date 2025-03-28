[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / isValidPieceMove

# Function: isValidPieceMove()

> **isValidPieceMove**(`pieceType`, `from`, `to`, `isWhitePiece`, `isCapture`, `isFirstMove`): `boolean`

Defined in: [chess/movement.ts:214](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/movement.ts#L214)

Checks if a move is valid for a given piece type

## Parameters

### pieceType

[`PieceType`](../type-aliases/PieceType.md)

The type of chess piece

### from

`string`

Starting position

### to

`string`

Destination position

### isWhitePiece

`boolean` = `true`

Whether the piece is white (relevant for pawns)

### isCapture

`boolean` = `false`

Whether the move is a capture (relevant for pawns)

### isFirstMove

`boolean` = `false`

Whether this is the piece's first move (relevant for pawns)

## Returns

`boolean`

True if the move is valid for the piece type
