[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / IBoardForCheckDetection

# Interface: IBoardForCheckDetection

Defined in: [chess/checkDetector.ts:35](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L35)

Minimal interface for a board to be used with check detector functions
This helps avoid circular dependencies with the full BoardSnapshot class

## Methods

### clone()

> **clone**(): `IBoardForCheckDetection`

Defined in: [chess/checkDetector.ts:40](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L40)

#### Returns

`IBoardForCheckDetection`

***

### getKingPosition()

> **getKingPosition**(`color`): `undefined` \| `string`

Defined in: [chess/checkDetector.ts:38](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L38)

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

`undefined` \| `string`

***

### getPiece()

> **getPiece**(`position`): `undefined` \| [`ChessPiece`](ChessPiece.md)

Defined in: [chess/checkDetector.ts:36](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L36)

#### Parameters

##### position

`string`

#### Returns

`undefined` \| [`ChessPiece`](ChessPiece.md)

***

### getPiecesByColor()

> **getPiecesByColor**(`color`): [`ChessPiece`](ChessPiece.md)[]

Defined in: [chess/checkDetector.ts:37](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L37)

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

[`ChessPiece`](ChessPiece.md)[]

***

### makeMove()

> **makeMove**(`from`, `to`): `object`

Defined in: [chess/checkDetector.ts:39](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/checkDetector.ts#L39)

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`object`

##### success

> **success**: `boolean`
