# matchmaking Module

File: `services/redis/matchmaking.ts`

## JSDoc Documentation

### addToQueue (FunctionDeclaration)

Add a player to the matchmaking queue

**Tags:**

- @param sessionId The player's session ID
 * @returns true if successfully added

```typescript
/**
 * Add a player to the matchmaking queue
 * @param sessionId The player's session ID
 * @returns true if successfully added
 */
```

### removeFromQueue (FunctionDeclaration)

Remove a player from the matchmaking queue

**Tags:**

- @param sessionId The player's session ID
 * @returns true if successfully removed

```typescript
/**
 * Remove a player from the matchmaking queue
 * @param sessionId The player's session ID
 * @returns true if successfully removed
 */
```

### findMatch (FunctionDeclaration)

Find a potential match for a player

**Tags:**

- @param sessionId The player's session ID
 * @returns The session ID of the matched player, or null if no match found

```typescript
/**
 * Find a potential match for a player
 * @param sessionId The player's session ID
 * @returns The session ID of the matched player, or null if no match found
 */
```

### isInQueue (FunctionDeclaration)

Check if a player is still in the matchmaking queue

**Tags:**

- @param sessionId The player's session ID
 * @returns true if player is in queue

```typescript
/**
 * Check if a player is still in the matchmaking queue
 * @param sessionId The player's session ID
 * @returns true if player is in queue
 */
```

### markInactive (FunctionDeclaration)

Mark a player as no longer active in the queue without removing themUsed when a player disconnects but we want to keep their place temporarily

**Tags:**

- @param sessionId The player's session ID

```typescript
/**
 * Mark a player as no longer active in the queue without removing them
 * Used when a player disconnects but we want to keep their place temporarily
 * @param sessionId The player's session ID
 */
```

### getQueueLength (FunctionDeclaration)

Get the total number of players in the matchmaking queue

**Tags:**

- @returns The number of players in queue

```typescript
/**
 * Get the total number of players in the matchmaking queue
 * @returns The number of players in queue
 */
```

### getPositionInQueue (FunctionDeclaration)

Get the position of a player in the matchmaking queue

**Tags:**

- @param sessionId The player's session ID
 * @returns The 0-based position in queue, or -1 if not found

```typescript
/**
 * Get the position of a player in the matchmaking queue
 * @param sessionId The player's session ID
 * @returns The 0-based position in queue, or -1 if not found
 */
```

### getWaitTime (FunctionDeclaration)

Get the wait time of a player in seconds

**Tags:**

- @param sessionId The player's session ID
 * @returns The wait time in seconds, or -1 if not found

```typescript
/**
 * Get the wait time of a player in seconds
 * @param sessionId The player's session ID
 * @returns The wait time in seconds, or -1 if not found
 */
```

