[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / wouldMoveLeaveKingInCheck

# Function: wouldMoveLeaveKingInCheck()

> **wouldMoveLeaveKingInCheck**(`board`, `from`, `to`): `boolean`

Defined in: [chess/checkDetector.ts:267](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/checkDetector.ts#L267)

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
