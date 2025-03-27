[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / pieceTypeToSAN

# Function: pieceTypeToSAN()

> **pieceTypeToSAN**(`pieceType`): `string`

Defined in: [notation/index.ts:65](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/notation/index.ts#L65)

Converts a chess piece type to its Standard Algebraic Notation (SAN) symbol
Pawns are represented by an empty string in SAN

## Parameters

### pieceType

[`PieceType`](../type-aliases/PieceType.md)

The piece type as a lowercase character ('p', 'n', 'b', 'r', 'q', 'k')

## Returns

`string`

The SAN symbol for the piece (empty string for pawns, uppercase letter for other pieces)

## Throws

Error if the piece type is invalid
