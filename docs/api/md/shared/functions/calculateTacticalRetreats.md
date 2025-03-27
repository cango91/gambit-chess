[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / calculateTacticalRetreats

# Function: calculateTacticalRetreats()

> **calculateTacticalRetreats**(`pieceType`, `originalPosition`, `capturePosition`, `boardState`): [`TacticalRetreatOption`](../interfaces/TacticalRetreatOption.md)[]

Defined in: [tactical/retreat.ts:51](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/tactical/retreat.ts#L51)

Calculates all valid tactical retreat options for a given piece and failed capture attempt.

## Parameters

### pieceType

[`PieceType`](../type-aliases/PieceType.md)

Type of piece that failed the capture

### originalPosition

`string`

Original position of the piece before capture attempt

### capturePosition

`string`

Position where capture was attempted

### boardState

`Map`\<`string`, `any`\>

Map of positions to pieceTypes, used to check if spaces are occupied

## Returns

[`TacticalRetreatOption`](../interfaces/TacticalRetreatOption.md)[]

Array of valid retreat options with positions and BP costs
