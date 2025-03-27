[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / parseFenToGameState

# Function: parseFenToGameState()

> **parseFenToGameState**(`fen`): `object`

Defined in: chess/fen.ts:248

Parses a complete FEN string and returns the pieces and game state

## Parameters

### fen

`string`

The FEN string to parse

## Returns

`object`

Object containing the pieces and game state information

### activeColor

> **activeColor**: [`PieceColor`](../type-aliases/PieceColor.md)

### castling

> **castling**: `object`

#### castling.blackKingside

> **blackKingside**: `boolean`

#### castling.blackQueenside

> **blackQueenside**: `boolean`

#### castling.whiteKingside

> **whiteKingside**: `boolean`

#### castling.whiteQueenside

> **whiteQueenside**: `boolean`

### enPassantTarget

> **enPassantTarget**: `null` \| `string`

### fullmoveNumber

> **fullmoveNumber**: `number`

### halfmoveClock

> **halfmoveClock**: `number`

### pieces

> **pieces**: [`ChessPiece`](../interfaces/ChessPiece.md)[]
