[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / sanToPieceType

# Function: sanToPieceType()

> **sanToPieceType**(`sanSymbol`): [`PieceType`](../type-aliases/PieceType.md)

Defined in: notation/index.ts:92

Converts a Standard Algebraic Notation (SAN) symbol to a chess piece type
Empty string is treated as a pawn

## Parameters

### sanSymbol

`string`

The SAN symbol for the piece (empty string for pawns, uppercase letter for other pieces)

## Returns

[`PieceType`](../type-aliases/PieceType.md)

The piece type as a lowercase character ('p', 'n', 'b', 'r', 'q', 'k')

## Throws

Error if the SAN symbol is invalid
