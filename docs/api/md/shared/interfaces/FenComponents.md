[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / FenComponents

# Interface: FenComponents

Defined in: [chess/fen.ts:20](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L20)

Interface for the components of a FEN string

## Properties

### activeColor

> **activeColor**: `string`

Defined in: [chess/fen.ts:24](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L24)

Active color ('w' for White, 'b' for Black)

***

### castling

> **castling**: `string`

Defined in: [chess/fen.ts:26](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L26)

Castling availability

***

### enPassant

> **enPassant**: `string`

Defined in: [chess/fen.ts:28](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L28)

En passant target square in algebraic notation

***

### fullmoveNumber

> **fullmoveNumber**: `string`

Defined in: [chess/fen.ts:32](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L32)

Fullmove number (starts at 1 and is incremented after Black's move)

***

### halfmoveClock

> **halfmoveClock**: `string`

Defined in: [chess/fen.ts:30](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L30)

Halfmove clock (number of halfmoves since the last pawn move or capture)

***

### piecePlacement

> **piecePlacement**: `string`

Defined in: [chess/fen.ts:22](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L22)

Piece placement data
