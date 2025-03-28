[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / isKingInCheck

# Function: isKingInCheck()

> **isKingInCheck**(`board`, `kingColor`): `boolean`

Defined in: [chess/checkDetector.ts:49](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/checkDetector.ts#L49)

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
