# GameConfig Module

File: `config/GameConfig.ts`

## JSDoc Documentation

### battlePoints (PropertySignature) in GameConfig

Battle Points configuration

```typescript
/**
   * Battle Points configuration
   */
```

### tacticalRetreat (PropertySignature) in GameConfig

Tactical retreat configuration

```typescript
/**
   * Tactical retreat configuration
   */
```

### timeControl (PropertySignature) in GameConfig

Time control configuration

```typescript
/**
   * Time control configuration
   */
```

### GameConfig (InterfaceDeclaration)

Game configuration interfaceContains game settings that can be adjusted for balancing

```typescript
/**
 * Game configuration interface
 * Contains game settings that can be adjusted for balancing
 */
```

### battlePoints (PropertySignature)

Battle Points configuration

```typescript
/**
   * Battle Points configuration
   */
```

### initialBP (PropertySignature)

Initial BP pool for each player

```typescript
/**
     * Initial BP pool for each player
     */
```

### pieceCapacity (PropertySignature)

BP capacity for each piece type

```typescript
/**
     * BP capacity for each piece type
     */
```

### maxAllocation (PropertySignature)

Maximum BP that can be allocated to a single piece

```typescript
/**
     * Maximum BP that can be allocated to a single piece
     */
```

### regeneration (PropertySignature)

BP regeneration configuration

```typescript
/**
     * BP regeneration configuration
     */
```

### baseTurnRegen (PropertySignature)

Base BP regeneration per turn

```typescript
/**
       * Base BP regeneration per turn
       */
```

### checkRegen (PropertySignature)

BP regeneration for checking the opponent

```typescript
/**
       * BP regeneration for checking the opponent
       */
```

### pinMultiplier (PropertySignature)

BP regeneration for pinning an opponent pieceValue is multiplied by the pinned piece's capacity

```typescript
/**
       * BP regeneration for pinning an opponent piece
       * Value is multiplied by the pinned piece's capacity
       */
```

### pinToKingBonus (PropertySignature)

Additional BP for pinning to the king

```typescript
/**
       * Additional BP for pinning to the king
       */
```

### forkRegen (PropertySignature)

BP regeneration for creating a fork

```typescript
/**
       * BP regeneration for creating a fork
       */
```

### skewerRegen (PropertySignature)

BP regeneration for creating a skewer

```typescript
/**
       * BP regeneration for creating a skewer
       */
```

### defenseRegen (PropertySignature)

BP regeneration for defending a piece

```typescript
/**
       * BP regeneration for defending a piece
       */
```

### discoveredAttackMultiplier (PropertySignature)

BP regeneration for discovered attackValue is multiplied by the attacked piece's capacity

```typescript
/**
       * BP regeneration for discovered attack
       * Value is multiplied by the attacked piece's capacity
       */
```

### tacticalRetreat (PropertySignature)

Tactical retreat configuration

```typescript
/**
   * Tactical retreat configuration
   */
```

### baseCost (PropertySignature)

Base BP cost for tactical retreats

```typescript
/**
     * Base BP cost for tactical retreats
     */
```

### distanceMultiplier (PropertySignature)

BP cost multiplier per square distance

```typescript
/**
     * BP cost multiplier per square distance
     */
```

### knightRetreatCosts (PropertySignature)

Knight retreat BP cost configuration

```typescript
/**
     * Knight retreat BP cost configuration
     */
```

### oneMove (PropertySignature)

Cost for one-move retreat

```typescript
/**
       * Cost for one-move retreat
       */
```

### twoMove (PropertySignature)

Cost for two-move retreat

```typescript
/**
       * Cost for two-move retreat
       */
```

### threeMove (PropertySignature)

Cost for three-move retreat

```typescript
/**
       * Cost for three-move retreat
       */
```

### timeControl (PropertySignature)

Time control configuration

```typescript
/**
   * Time control configuration
   */
```

### initialTime (PropertySignature)

Initial time in seconds

```typescript
/**
     * Initial time in seconds
     */
```

### increment (PropertySignature)

Increment per move in seconds

```typescript
/**
     * Increment per move in seconds
     */
```

### duelAllocationTime (PropertySignature)

Maximum time for BP allocation in seconds

```typescript
/**
     * Maximum time for BP allocation in seconds
     */
```

### tacticalRetreatTime (PropertySignature)

Maximum time for tactical retreat decision in seconds

```typescript
/**
     * Maximum time for tactical retreat decision in seconds
     */
```

### DEFAULT_GAME_CONFIG (FirstStatement)

Default game configurationUsed if server doesn't provide custom settings

```typescript
/**
 * Default game configuration
 * Used if server doesn't provide custom settings
 */
```

