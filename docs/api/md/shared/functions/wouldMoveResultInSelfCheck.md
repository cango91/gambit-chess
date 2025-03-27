[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / wouldMoveResultInSelfCheck

# Function: wouldMoveResultInSelfCheck()

> **wouldMoveResultInSelfCheck**(`board`, `from`, `to`): `boolean`

Defined in: [chess/checkDetector.ts:192](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L192)

Checks if a move would put the moving player's king in check
This implementation avoids circular dependencies by simulating the move
without calling isValidMove from the board class

## Parameters

### board

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

The current board state

### from

`string`

The starting position

### to

`string`

The destination position

## Returns

`boolean`

True if the move would result in self-check
