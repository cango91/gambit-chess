[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / GameStateDTO

# Interface: GameStateDTO

Defined in: [dtos/index.ts:20](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L20)

DTO for game state updates sent to clients
Note: This is filtered by the server based on player visibility rules

## Properties

### activeTimer

> **activeTimer**: `null` \| [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: [dtos/index.ts:42](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L42)

Current active timer

***

### blackTimeRemaining

> **blackTimeRemaining**: `number`

Defined in: [dtos/index.ts:40](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L40)

Time remaining for black player (in milliseconds)

***

### bp?

> `optional` **bp**: `number`

Defined in: [dtos/index.ts:34](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L34)

Player's own BP (opponent's BP is hidden)

***

### gameId

> **gameId**: `string`

Defined in: [dtos/index.ts:22](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L22)

Game unique identifier

***

### inCheck

> **inCheck**: `boolean`

Defined in: [dtos/index.ts:32](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L32)

Check status

***

### moveNumber

> **moveNumber**: `number`

Defined in: [dtos/index.ts:30](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L30)

Current move number

***

### phase

> **phase**: [`GamePhase`](../enumerations/GamePhase.md)

Defined in: [dtos/index.ts:24](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L24)

Current game phase

***

### pieces

> **pieces**: [`ChessPiece`](ChessPiece.md)[]

Defined in: [dtos/index.ts:28](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L28)

Current board pieces

***

### players

> **players**: [`Player`](Player.md)[]

Defined in: [dtos/index.ts:48](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L48)

Players information

***

### result?

> `optional` **result**: [`GameResult`](../enumerations/GameResult.md)

Defined in: [dtos/index.ts:36](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L36)

Game result if game is over

***

### sequence

> **sequence**: `number`

Defined in: [dtos/index.ts:44](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L44)

Sequence number for state reconciliation

***

### spectators

> **spectators**: [`Spectator`](Spectator.md)[]

Defined in: [dtos/index.ts:50](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L50)

Current spectators

***

### timestamp

> **timestamp**: `number`

Defined in: [dtos/index.ts:46](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L46)

Server timestamp

***

### turn

> **turn**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: [dtos/index.ts:26](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L26)

Current player's turn

***

### whiteTimeRemaining

> **whiteTimeRemaining**: `number`

Defined in: [dtos/index.ts:38](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L38)

Time remaining for white player (in milliseconds)
