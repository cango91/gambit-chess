# RedisGameStateStorage Module

File: `storage/RedisGameStateStorage.ts`

## JSDoc Documentation

### RedisGameStateStorage (ClassDeclaration)

Redis implementation of the GameStateStorage interface

```typescript
/**
 * Redis implementation of the GameStateStorage interface
 */
```

### getGameState (MethodDeclaration)

Get a game state by ID

**Tags:**

- @param gameId The unique game identifier
   * @returns The game state or null if not found

```typescript
/**
   * Get a game state by ID
   * @param gameId The unique game identifier
   * @returns The game state or null if not found
   */
```

### saveGameState (MethodDeclaration)

Save a game state

**Tags:**

- @param gameId The unique game identifier
   * @param gameState The game state to save
   * @param expirySeconds Optional expiry time in seconds

```typescript
/**
   * Save a game state
   * @param gameId The unique game identifier
   * @param gameState The game state to save
   * @param expirySeconds Optional expiry time in seconds
   */
```

### deleteGameState (MethodDeclaration)

Delete a game state

**Tags:**

- @param gameId The unique game identifier

```typescript
/**
   * Delete a game state
   * @param gameId The unique game identifier
   */
```

