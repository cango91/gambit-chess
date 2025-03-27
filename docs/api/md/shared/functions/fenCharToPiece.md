[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / fenCharToPiece

# Function: fenCharToPiece()

> **fenCharToPiece**(`fenChar`): `object`

Defined in: [chess/fen.ts:108](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/fen.ts#L108)

Maps FEN piece characters to internal piece types and colors

## Parameters

### fenChar

`string`

FEN character representing a piece

## Returns

`object`

Object with piece type and color

### color

> **color**: [`PieceColor`](../type-aliases/PieceColor.md)

### type

> **type**: [`PieceType`](../type-aliases/PieceType.md)

## Throws

Error if the FEN character is invalid
