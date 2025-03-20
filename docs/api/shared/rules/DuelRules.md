# DuelRules Module

File: `rules/DuelRules.ts`

## JSDoc Documentation

### DuelRules (ClassDeclaration)

Rules for the Battle Points duel system.
Contains only validation logic that can be shared between client and server.
Actual BP allocation and duel resolution happens on the server.

```typescript
/**
 * Rules for the Battle Points duel system.
 * Contains only validation logic that can be shared between client and server.
 * Actual BP allocation and duel resolution happens on the server.
 */
```

### getBPCapacity (MethodDeclaration)

Calculate the maximum BP a player can allocate for a piece

**Tags:**

- @param pieceType The type of piece
   * @returns Maximum BP capacity for the piece

```typescript
/**
   * Calculate the maximum BP a player can allocate for a piece
   * @param pieceType The type of piece
   * @returns Maximum BP capacity for the piece
   */
```

### calculateBPCost (MethodDeclaration)

Calculate BP cost for allocation

**Tags:**

- @param pieceType The type of piece
   * @param amount Amount of BP being allocated
   * @returns The actual BP cost (doubles if exceeding capacity)

```typescript
/**
   * Calculate BP cost for allocation
   * @param pieceType The type of piece
   * @param amount Amount of BP being allocated
   * @returns The actual BP cost (doubles if exceeding capacity)
   */
```

### isValidAllocation (MethodDeclaration)

Validate BP allocation

**Tags:**

- @param pieceType The type of piece
   * @param amount Amount of BP to allocate
   * @param playerTotalBP Total BP available to the player
   * @returns Whether the allocation is valid

```typescript
/**
   * Validate BP allocation
   * @param pieceType The type of piece
   * @param amount Amount of BP to allocate
   * @param playerTotalBP Total BP available to the player
   * @returns Whether the allocation is valid
   */
```

### canPerformTacticalRetreat (MethodDeclaration)

Check if a piece is eligible for tactical retreat

**Tags:**

- @param pieceType The type of piece
   * @returns Whether the piece can perform tactical retreat

```typescript
/**
   * Check if a piece is eligible for tactical retreat
   * @param pieceType The type of piece
   * @returns Whether the piece can perform tactical retreat
   */
```

