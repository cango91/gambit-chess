[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / wouldMoveResolveCheck

# Function: wouldMoveResolveCheck()

> **wouldMoveResolveCheck**(`board`, `kingColor`, `from`, `to`): `boolean`

Defined in: chess/checkDetector.ts:394

Checks if a move would get a king out of check

## Parameters

### board

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

The current board state

### kingColor

[`PieceColor`](../type-aliases/PieceColor.md)

The color of the king in check

### from

`string`

The starting position

### to

`string`

The destination position

## Returns

`boolean`

True if the move would get the king out of check
