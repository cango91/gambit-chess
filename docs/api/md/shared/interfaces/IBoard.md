[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / IBoard

# Interface: IBoard

Defined in: [types/index.ts:39](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L39)

Board interface that defines core functionality for any board representation

## Methods

### clone()

> **clone**(): `IBoard`

Defined in: [types/index.ts:70](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L70)

Creates a deep copy of the board

#### Returns

`IBoard`

***

### getAllPieces()

> **getAllPieces**(): [`ChessPiece`](ChessPiece.md)[]

Defined in: [types/index.ts:44](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L44)

Gets all pieces currently on the board

#### Returns

[`ChessPiece`](ChessPiece.md)[]

***

### getCapturedPieces()

> **getCapturedPieces**(): [`ChessPiece`](ChessPiece.md)[]

Defined in: [types/index.ts:50](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L50)

Gets all captured pieces

#### Returns

[`ChessPiece`](ChessPiece.md)[]

***

### getCurrentTurn()

> **getCurrentTurn**(): `number`

Defined in: [types/index.ts:73](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L73)

Gets the current move/turn number

#### Returns

`number`

***

### getEnPassantTarget()

> **getEnPassantTarget**(): `null` \| `string`

Defined in: [types/index.ts:76](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L76)

Checks if a pawn can be captured via en passant at the given position

#### Returns

`null` \| `string`

***

### getKingPosition()

> **getKingPosition**(`color`): `undefined` \| `string`

Defined in: [types/index.ts:53](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L53)

Gets the position of the king for a specific color

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

`undefined` \| `string`

***

### getPiece()

> **getPiece**(`position`): `undefined` \| [`ChessPiece`](ChessPiece.md)

Defined in: [types/index.ts:41](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L41)

Gets the piece at a specific position

#### Parameters

##### position

`string`

#### Returns

`undefined` \| [`ChessPiece`](ChessPiece.md)

***

### getPiecesByColor()

> **getPiecesByColor**(`color`): [`ChessPiece`](ChessPiece.md)[]

Defined in: [types/index.ts:47](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L47)

Gets all pieces of a specific color

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

[`ChessPiece`](ChessPiece.md)[]

***

### isInCheck()

> **isInCheck**(`color`): `boolean`

Defined in: [types/index.ts:59](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L59)

Checks if the king of a specific color is in check

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

`boolean`

***

### isValidMove()

> **isValidMove**(`from`, `to`): `boolean`

Defined in: [types/index.ts:56](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L56)

Checks if a move is valid according to chess rules

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`boolean`

***

### makeMove()

> **makeMove**(`from`, `to`, `promotion`?): `object`

Defined in: [types/index.ts:62](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/types/index.ts#L62)

Makes a move on the board

#### Parameters

##### from

`string`

##### to

`string`

##### promotion?

[`PieceType`](../type-aliases/PieceType.md)

#### Returns

`object`

##### captured?

> `optional` **captured**: [`ChessPiece`](ChessPiece.md)

##### check?

> `optional` **check**: `boolean`

##### checkmate?

> `optional` **checkmate**: `boolean`

##### success

> **success**: `boolean`
