[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / BoardSnapshot

# Class: BoardSnapshot

Defined in: [chess/board.ts:33](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L33)

Represents a non-authoritative snapshot of a chess board state

## Implements

- [`IBoard`](../interfaces/IBoard.md)
- [`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md)

## Constructors

### Constructor

> **new BoardSnapshot**(`setupBoard`): `BoardSnapshot`

Defined in: [chess/board.ts:43](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L43)

Creates a new board snapshot with optional initial position

#### Parameters

##### setupBoard

`boolean` = `true`

Whether to set up the initial position (default: true)

#### Returns

`BoardSnapshot`

## Methods

### addPiece()

> **addPiece**(`type`, `color`, `position`): [`ChessPiece`](../interfaces/ChessPiece.md)

Defined in: [chess/board.ts:92](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L92)

Adds a piece to the board

#### Parameters

##### type

[`PieceType`](../type-aliases/PieceType.md)

Piece type

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

Piece color

##### position

`string`

Position on the board

#### Returns

[`ChessPiece`](../interfaces/ChessPiece.md)

The newly created piece

***

### clone()

> **clone**(): `BoardSnapshot`

Defined in: [chess/board.ts:503](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L503)

Creates a deep copy of the board

#### Returns

`BoardSnapshot`

A new BoardSnapshot object with the same state

#### Implementation of

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md).[`clone`](../interfaces/IBoardForCheckDetection.md#clone)

***

### getAllPieces()

> **getAllPieces**(): [`ChessPiece`](../interfaces/ChessPiece.md)[]

Defined in: [chess/board.ts:134](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L134)

Gets all pieces currently on the board

#### Returns

[`ChessPiece`](../interfaces/ChessPiece.md)[]

Array of all pieces

#### Implementation of

[`IBoard`](../interfaces/IBoard.md).[`getAllPieces`](../interfaces/IBoard.md#getallpieces)

***

### getCapturedPieces()

> **getCapturedPieces**(): [`ChessPiece`](../interfaces/ChessPiece.md)[]

Defined in: [chess/board.ts:142](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L142)

Gets all captured pieces

#### Returns

[`ChessPiece`](../interfaces/ChessPiece.md)[]

Array of captured pieces

#### Implementation of

[`IBoard`](../interfaces/IBoard.md).[`getCapturedPieces`](../interfaces/IBoard.md#getcapturedpieces)

***

### getCurrentTurn()

> **getCurrentTurn**(): `number`

Defined in: [chess/board.ts:169](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L169)

Gets the current turn number

#### Returns

`number`

The current turn number

#### Implementation of

[`IBoard`](../interfaces/IBoard.md).[`getCurrentTurn`](../interfaces/IBoard.md#getcurrentturn)

***

### getEnPassantTarget()

> **getEnPassantTarget**(): `null` \| `string`

Defined in: [chess/board.ts:177](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L177)

Gets the current en passant target position, if any

#### Returns

`null` \| `string`

The en passant target position or null

#### Implementation of

[`IBoard`](../interfaces/IBoard.md).[`getEnPassantTarget`](../interfaces/IBoard.md#getenpassanttarget)

***

### getKingPosition()

> **getKingPosition**(`color`): `undefined` \| `string`

Defined in: [chess/board.ts:160](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L160)

Gets the position of the king for a specific color

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

King color to find

#### Returns

`undefined` \| `string`

Position of the king or undefined if not found

#### Implementation of

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md).[`getKingPosition`](../interfaces/IBoardForCheckDetection.md#getkingposition)

***

### getPiece()

> **getPiece**(`position`): `undefined` \| [`ChessPiece`](../interfaces/ChessPiece.md)

Defined in: [chess/board.ts:126](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L126)

Gets the piece at a specific position

#### Parameters

##### position

`string`

Position to check

#### Returns

`undefined` \| [`ChessPiece`](../interfaces/ChessPiece.md)

The piece at that position or undefined if empty

#### Implementation of

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md).[`getPiece`](../interfaces/IBoardForCheckDetection.md#getpiece)

***

### getPiecesByColor()

> **getPiecesByColor**(`color`): [`ChessPiece`](../interfaces/ChessPiece.md)[]

Defined in: [chess/board.ts:151](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L151)

Gets all pieces of a specific color

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

The color to filter by

#### Returns

[`ChessPiece`](../interfaces/ChessPiece.md)[]

Array of pieces of the specified color

#### Implementation of

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md).[`getPiecesByColor`](../interfaces/IBoardForCheckDetection.md#getpiecesbycolor)

***

### isInCheck()

> **isInCheck**(`color`): `boolean`

Defined in: [chess/board.ts:378](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L378)

Checks if the king of a specific color is in check

#### Parameters

##### color

[`PieceColor`](../type-aliases/PieceColor.md)

King color to check

#### Returns

`boolean`

True if the king is in check, false otherwise

#### Implementation of

[`IBoard`](../interfaces/IBoard.md).[`isInCheck`](../interfaces/IBoard.md#isincheck)

***

### isValidMove()

> **isValidMove**(`from`, `to`): `boolean`

Defined in: [chess/board.ts:189](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L189)

Checks if a move is valid according to chess rules
This includes checking if the move would leave the player's own king in check.

#### Parameters

##### from

`string`

Starting position

##### to

`string`

Destination position

#### Returns

`boolean`

True if the move is valid, false otherwise

#### Implementation of

[`IBoard`](../interfaces/IBoard.md).[`isValidMove`](../interfaces/IBoard.md#isvalidmove)

***

### makeMove()

> **makeMove**(`from`, `to`, `promotion`?): `object`

Defined in: [chess/board.ts:390](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L390)

Makes a move on the board

#### Parameters

##### from

`string`

Starting position

##### to

`string`

Destination position

##### promotion?

[`PieceType`](../type-aliases/PieceType.md)

Promotion piece type (if pawn promotion)

#### Returns

`object`

Object with move information

##### captured?

> `optional` **captured**: [`ChessPiece`](../interfaces/ChessPiece.md)

##### check?

> `optional` **check**: `boolean`

##### success

> **success**: `boolean`

#### Implementation of

[`IBoardForCheckDetection`](../interfaces/IBoardForCheckDetection.md).[`makeMove`](../interfaces/IBoardForCheckDetection.md#makemove)

***

### removePiece()

> **removePiece**(`position`): `undefined` \| [`ChessPiece`](../interfaces/ChessPiece.md)

Defined in: [chess/board.ts:112](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L112)

Removes a piece from the board

#### Parameters

##### position

`string`

Position to remove piece from

#### Returns

`undefined` \| [`ChessPiece`](../interfaces/ChessPiece.md)

The removed piece or undefined if no piece at that position

***

### toString()

> **toString**(): `string`

Defined in: [chess/board.ts:529](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/chess/board.ts#L529)

Converts the board to a string representation for debugging

#### Returns

`string`

String representation of the board
