[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / DuelOutcomeDTO

# Interface: DuelOutcomeDTO

Defined in: dtos/index.ts:108

DTO for duel outcome notification

## Properties

### attackerAllocation

> **attackerAllocation**: `number`

Defined in: dtos/index.ts:116

BP allocated by attacker

***

### defenderAllocation

> **defenderAllocation**: `number`

Defined in: dtos/index.ts:118

BP allocated by defender

***

### gameId

> **gameId**: `string`

Defined in: dtos/index.ts:110

Game ID

***

### result

> **result**: `"success"` \| `"failed"`

Defined in: dtos/index.ts:114

Result of the duel (success or failed)

***

### winner

> **winner**: [`PieceColor`](../type-aliases/PieceColor.md)

Defined in: dtos/index.ts:112

Winner of the duel (attacker or defender)
