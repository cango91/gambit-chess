# GameStateStorage Module

File: `storage/GameStateStorage.ts`

## JSDoc Documentation

### getGameState (MethodSignature) in GameStateStorage

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

### saveGameState (MethodSignature) in GameStateStorage

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

### deleteGameState (MethodSignature) in GameStateStorage

Delete a game state

**Tags:**

- @param gameId The unique game identifier

```typescript
/**
   * Delete a game state
   * @param gameId The unique game identifier
   */
```

### GameStateStorage (InterfaceDeclaration)

Interface for game state persistenceThis abstraction allows decoupling the game engine from specific storage implementations

```typescript
/**
 * Interface for game state persistence
 * This abstraction allows decoupling the game engine from specific storage implementations
 */
```

### getGameState (MethodSignature)

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

### saveGameState (MethodSignature)

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

### deleteGameState (MethodSignature)

Delete a game state

**Tags:**

- @param gameId The unique game identifier

```typescript
/**
   * Delete a game state
   * @param gameId The unique game identifier
   */
```

