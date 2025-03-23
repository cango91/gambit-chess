# GameEngine Module

File: `engine/GameEngine.ts`

## JSDoc Documentation

### GameStateData (InterfaceDeclaration)

Represents the current game state data

```typescript
/**
 * Represents the current game state data
 */
```

### GameEngine (ClassDeclaration)

Class that manages the game state and implements the Gambit Chess rules

```typescript
/**
 * Class that manages the game state and implements the Gambit Chess rules
 */
```

### Unnamed (Constructor)

Create a game engine for a specific game

**Tags:**

- @param gameId The unique game ID
   * @param storage Optional storage implementation (defaults to Redis)

```typescript
/**
   * Create a game engine for a specific game
   * @param gameId The unique game ID
   * @param storage Optional storage implementation (defaults to Redis)
   */
```

### initialize (MethodDeclaration)

Initialize a new game

**Tags:**

- @param options Game initialization options

```typescript
/**
   * Initialize a new game
   * @param options Game initialization options
   */
```

### loadState (MethodDeclaration)

Load game state

```typescript
/**
   * Load game state
   */
```

### saveState (MethodDeclaration)

Save game state

```typescript
/**
   * Save game state
   */
```

### createInitialPieces (MethodDeclaration)

Create the initial chess pieces

```typescript
/**
   * Create the initial chess pieces
   */
```

### processMove (MethodDeclaration)

Process a move request from a player

```typescript
/**
   * Process a move request from a player
   */
```

### processBPAllocation (MethodDeclaration)

Process battle point allocation for a duel

```typescript
/**
   * Process battle point allocation for a duel
   */
```

### resolveDuel (MethodDeclaration)

Resolve a duel after both players have allocated BP

```typescript
/**
   * Resolve a duel after both players have allocated BP
   */
```

### setupTacticalRetreat (MethodDeclaration)

Set up tactical retreat options after a failed capture

```typescript
/**
   * Set up tactical retreat options after a failed capture
   */
```

### processTacticalRetreat (MethodDeclaration)

Process a tactical retreat request

```typescript
/**
   * Process a tactical retreat request
   */
```

### calculateRetreatOptions (MethodDeclaration)

Calculate available tactical retreat options

```typescript
/**
   * Calculate available tactical retreat options
   */
```

### calculateBPRegen (MethodDeclaration)

Calculate BP regeneration based on move and resulting board state

```typescript
/**
   * Calculate BP regeneration based on move and resulting board state
   */
```

### canPerformTacticalRetreat (MethodDeclaration)

Check if a player can perform a tactical retreat

```typescript
/**
   * Check if a player can perform a tactical retreat
   */
```

### updateGameState (MethodDeclaration)

Update the game state (check, checkmate, stalemate)

```typescript
/**
   * Update the game state (check, checkmate, stalemate)
   */
```

### getPlayerRole (MethodDeclaration)

Get player role in the game

```typescript
/**
   * Get player role in the game
   */
```

### createGameStateDTO (MethodDeclaration)

Create a DTO of the game state for a specific player

```typescript
/**
   * Create a DTO of the game state for a specific player
   */
```

