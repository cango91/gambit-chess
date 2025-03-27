[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / fenCharToPiece

# Function: fenCharToPiece()

> **fenCharToPiece**(`fenChar`): `object`

Defined in: chess/fen.ts:108

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
