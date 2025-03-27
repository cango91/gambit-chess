[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / FenComponents

# Interface: FenComponents

Defined in: chess/fen.ts:20

Interface for the components of a FEN string

## Properties

### activeColor

> **activeColor**: `string`

Defined in: chess/fen.ts:24

Active color ('w' for White, 'b' for Black)

***

### castling

> **castling**: `string`

Defined in: chess/fen.ts:26

Castling availability

***

### enPassant

> **enPassant**: `string`

Defined in: chess/fen.ts:28

En passant target square in algebraic notation

***

### fullmoveNumber

> **fullmoveNumber**: `string`

Defined in: chess/fen.ts:32

Fullmove number (starts at 1 and is incremented after Black's move)

***

### halfmoveClock

> **halfmoveClock**: `string`

Defined in: chess/fen.ts:30

Halfmove clock (number of halfmoves since the last pawn move or capture)

***

### piecePlacement

> **piecePlacement**: `string`

Defined in: chess/fen.ts:22

Piece placement data
