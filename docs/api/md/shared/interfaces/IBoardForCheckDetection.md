[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / IBoardForCheckDetection

# Interface: IBoardForCheckDetection

Defined in: chess/checkDetector.ts:35

Minimal interface for a board to be used with check detector functions
This helps avoid circular dependencies with the full BoardSnapshot class

## Methods

### clone()

> **clone**(): `IBoardForCheckDetection`

Defined in: chess/checkDetector.ts:40

#### Returns

`IBoardForCheckDetection`

***

### getKingPosition()

> **getKingPosition**(`color`): `undefined` \| `string`

Defined in: chess/checkDetector.ts:38

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

`undefined` \| `string`

***

### getPiece()

> **getPiece**(`position`): `undefined` \| [`ChessPiece`](ChessPiece.md)

Defined in: chess/checkDetector.ts:36

#### Parameters

##### position

`string`

#### Returns

`undefined` \| [`ChessPiece`](ChessPiece.md)

***

### getPiecesByColor()

> **getPiecesByColor**(`color`): [`ChessPiece`](ChessPiece.md)[]

Defined in: chess/checkDetector.ts:37

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

#### Returns

[`ChessPiece`](ChessPiece.md)[]

***

### makeMove()

> **makeMove**(`from`, `to`): `object`

Defined in: chess/checkDetector.ts:39

#### Parameters

##### from

`string`

##### to

`string`

#### Returns

`object`

##### success

> **success**: `boolean`
