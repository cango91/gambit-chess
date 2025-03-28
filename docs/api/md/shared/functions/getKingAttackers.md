[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / getKingAttackers

# Function: getKingAttackers()

> **getKingAttackers**(`board`, `kingColor`): [`ChessPiece`](../interfaces/ChessPiece.md)[]

Defined in: [chess/checkDetector.ts:132](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/checkDetector.ts#L132)

Gets all pieces attacking the king

## Parameters

### board

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

The board to analyze

### kingColor

[`PieceColor`](../type-aliases/PieceColor.md)

The color of the king

## Returns

[`ChessPiece`](../interfaces/ChessPiece.md)[]

Array of pieces that are attacking the king
