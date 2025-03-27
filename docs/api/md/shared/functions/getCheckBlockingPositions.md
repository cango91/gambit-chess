[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / getCheckBlockingPositions

# Function: getCheckBlockingPositions()

> **getCheckBlockingPositions**(`board`, `kingColor`): `string`[]

Defined in: chess/checkDetector.ts:158

Gets all positions that can block an attack on the king
Only relevant for sliding pieces (bishop, rook, queen)

## Parameters

### board

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

The board to analyze

### kingColor

[`PieceColor`](../type-aliases/PieceColor.md)

The color of the king

## Returns

`string`[]

Array of positions that could block the attack
