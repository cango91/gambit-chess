[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / isValidPawnMove

# Function: isValidPawnMove()

> **isValidPawnMove**(`from`, `to`, `isWhite`, `isCapture`, `isFirstMove`): `boolean`

Defined in: [chess/movement.ts:63](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/movement.ts#L63)

Checks if a move is valid for a pawn

## Parameters

### from

`string`

Starting position

### to

`string`

Destination position

### isWhite

`boolean`

Whether the pawn is white (true) or black (false)

### isCapture

`boolean` = `false`

Whether the move is a capture

### isFirstMove

`boolean` = `false`

Whether this is the pawn's first move (allows double move)

## Returns

`boolean`

True if the move is valid for a pawn
