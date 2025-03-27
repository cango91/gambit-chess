[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / isKingInCheck

# Function: isKingInCheck()

> **isKingInCheck**(`board`, `kingColor`): `boolean`

Defined in: [chess/checkDetector.ts:49](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L49)

Detects if a king is in check on the given board

## Parameters

### board

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

The board to analyze

### kingColor

[`PieceColor`](../type-aliases/PieceColor.md)

The color of the king to check

## Returns

`boolean`

True if the king is in check, false otherwise
