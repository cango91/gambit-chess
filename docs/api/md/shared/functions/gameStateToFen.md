[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / gameStateToFen

# Function: gameStateToFen()

> **gameStateToFen**(`state`): `string`

Defined in: [chess/fen.ts:325](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/chess/fen.ts#L325)

Creates a FEN string from game state information

## Parameters

### state

The game state

#### activeColor

[`PieceColor`](../type-aliases/PieceColor.md)

#### castling

\{ `blackKingside`: `boolean`; `blackQueenside`: `boolean`; `whiteKingside`: `boolean`; `whiteQueenside`: `boolean`; \}

#### castling.blackKingside

`boolean`

#### castling.blackQueenside

`boolean`

#### castling.whiteKingside

`boolean`

#### castling.whiteQueenside

`boolean`

#### enPassantTarget

`null` \| `string`

#### fullmoveNumber

`number`

#### halfmoveClock

`number`

#### pieces

[`ChessPiece`](../interfaces/ChessPiece.md)[]

## Returns

`string`

FEN string representing the game state
