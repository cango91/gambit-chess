[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / Move

# Interface: Move

Defined in: [types/index.ts:87](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L87)

Represents a chess move

## Properties

### capture?

> `optional` **capture**: [`PieceType`](../type-aliases/PieceType.md)

Defined in: [types/index.ts:95](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L95)

Captured piece type (if a capture was attempted)

***

### castle?

> `optional` **castle**: `"kingside"` \| `"queenside"`

Defined in: [types/index.ts:99](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L99)

If the move is a castle

***

### check?

> `optional` **check**: `boolean`

Defined in: [types/index.ts:101](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L101)

If the move results in check

***

### checkmate?

> `optional` **checkmate**: `boolean`

Defined in: [types/index.ts:103](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L103)

If the move results in checkmate

***

### enPassant?

> `optional` **enPassant**: `boolean`

Defined in: [types/index.ts:105](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L105)

If the move is an en passant capture

***

### from

> **from**: `string`

Defined in: [types/index.ts:89](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L89)

Starting position

***

### piece

> **piece**: [`PieceType`](../type-aliases/PieceType.md)

Defined in: [types/index.ts:93](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L93)

Moving piece type

***

### promotion?

> `optional` **promotion**: [`PieceType`](../type-aliases/PieceType.md)

Defined in: [types/index.ts:97](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L97)

Promotion piece (if pawn is promoted)

***

### to

> **to**: `string`

Defined in: [types/index.ts:91](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L91)

Destination position

***

### turnNumber?

> `optional` **turnNumber**: `number`

Defined in: [types/index.ts:107](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L107)

Turn number when this move was made
