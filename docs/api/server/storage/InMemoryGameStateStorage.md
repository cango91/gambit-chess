# InMemoryGameStateStorage Module

File: `storage/InMemoryGameStateStorage.ts`

## JSDoc Documentation

### InMemoryGameStateStorage (ClassDeclaration)

In-memory implementation of GameStateStorage for testing purposes

```typescript
/**
 * In-memory implementation of GameStateStorage for testing purposes
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

### checkExpiry (MethodDeclaration)

Check if a game state has expired and delete it if necessary

**Tags:**

- @param gameId The unique game identifier

```typescript
/**
   * Check if a game state has expired and delete it if necessary
   * @param gameId The unique game identifier
   */
```

### clear (MethodDeclaration)

Clear all game states (for testing)

```typescript
/**
   * Clear all game states (for testing)
   */
```

### size (MethodDeclaration)

Get the number of stored game states (for testing)

```typescript
/**
   * Get the number of stored game states (for testing)
   */
```

