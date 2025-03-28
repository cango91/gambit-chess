[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / ChessPiece

# Interface: ChessPiece

Defined in: [types/index.ts:23](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/index.ts#L23)

Represents a chess piece

## Properties

### color

> **color**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: [types/index.ts:27](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/index.ts#L27)

Piece color

***

### hasMoved

> **hasMoved**: `boolean`

Defined in: [types/index.ts:31](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/index.ts#L31)

Whether the piece has moved from its starting position

***

### lastMoveTurn?

> `optional` **lastMoveTurn**: `number`

Defined in: [types/index.ts:33](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/index.ts#L33)

Turn number when this piece last moved (for en passant and other time-sensitive rules)

***

### position

> **position**: `string`

Defined in: [types/index.ts:29](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/index.ts#L29)

Current position on the board

***

### type

> **type**: [`PieceType`](../type-aliases/PieceType.md)

Defined in: [types/index.ts:25](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/types/index.ts#L25)

Piece type (p=pawn, n=knight, b=bishop, r=rook, q=queen, k=king)
