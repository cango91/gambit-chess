[**@gambit-chess/shared**](../README.md)

***

[@gambit-chess/shared](../globals.md) / toGambitNotation

# Function: toGambitNotation()

> **toGambitNotation**(`move`, `duel`, `retreat`, `bpRegeneration`, `shouldIncludeBpRegen`): `string`

Defined in: [notation/index.ts:188](https://github.com/cango91/gambit-chess/blob/d79bd73a9b1359341cbe89b368f1eb5b66a60564/shared/src/notation/index.ts#L188)

Converts a move to Gambit Chess extended notation, including BP allocations and retreats

## Parameters

### move

[`Move`](../interfaces/Move.md)

The move to convert

### duel

The duel result (if any)

`null` | [`Duel`](../interfaces/Duel.md)

### retreat

The retreat information (if any)

`null` | [`Retreat`](../interfaces/Retreat.md)

### bpRegeneration

`number` = `0`

The BP regenerated after the move

### shouldIncludeBpRegen

`boolean` = `true`

Whether to include BP regeneration in the notation (default: true)

## Returns

`string`

The move in Gambit Chess extended notation
