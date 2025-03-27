[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / DuelOutcomeDTO

# Interface: DuelOutcomeDTO

Defined in: [dtos/index.ts:108](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L108)

DTO for duel outcome notification

## Properties

### attackerAllocation

> **attackerAllocation**: `number`

Defined in: [dtos/index.ts:116](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L116)

BP allocated by attacker

***

### defenderAllocation

> **defenderAllocation**: `number`

Defined in: [dtos/index.ts:118](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L118)

BP allocated by defender

***

### gameId

> **gameId**: `string`

Defined in: [dtos/index.ts:110](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L110)

Game ID

***

### result

> **result**: `"success"` \| `"failed"`

Defined in: [dtos/index.ts:114](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L114)

Result of the duel (success or failed)

***

### winner

> **winner**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: [dtos/index.ts:112](https://github.com/cango91/gambit-chess/blob/b8ea13e4976c99c29d095eae7bc504b86f9add51/shared/src/dtos/index.ts#L112)

Winner of the duel (attacker or defender)
