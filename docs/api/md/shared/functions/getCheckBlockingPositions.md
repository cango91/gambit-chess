[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / getCheckBlockingPositions

# Function: getCheckBlockingPositions()

> **getCheckBlockingPositions**(`board`, `kingColor`): `string`[]

Defined in: [chess/checkDetector.ts:158](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/checkDetector.ts#L158)

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
