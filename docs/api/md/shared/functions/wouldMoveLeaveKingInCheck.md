[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / wouldMoveLeaveKingInCheck

# Function: wouldMoveLeaveKingInCheck()

> **wouldMoveLeaveKingInCheck**(`board`, `from`, `to`): `boolean`

Defined in: chess/checkDetector.ts:267

A simplified version of wouldMoveResultInSelfCheck that doesn't call board.makeMove
This helps avoid circular dependencies in the check detection logic

## Parameters

### board

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

The current board state

### from

`string`

Starting position

### to

`string`

Destination position

## Returns

`boolean`

True if the move would leave the king in check
