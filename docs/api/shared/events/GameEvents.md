# GameEvents Module

File: `events/GameEvents.ts`

## JSDoc Documentation

### GameEvents (EnumDeclaration)

WebSocket event names for game communicationPREFERRED: Use this enum instead of the deprecated GameEventType

```typescript
/**
 * WebSocket event names for game communication
 * 
 * PREFERRED: Use this enum instead of the deprecated GameEventType
 */
```

### WSMessage (InterfaceDeclaration)

Base interface for all WebSocket messages

```typescript
/**
 * Base interface for all WebSocket messages
 */
```

### RequestGameHistoryEvent (InterfaceDeclaration)

Interface for game history request events

```typescript
/**
 * Interface for game history request events
 */
```

### GameHistoryUpdateEvent (InterfaceDeclaration)

Interface for game history response events

```typescript
/**
 * Interface for game history response events
 */
```

### SpectateGameEvent (InterfaceDeclaration)

Interface for spectating a game

```typescript
/**
 * Interface for spectating a game
 */
```

### SpectatingEvent (InterfaceDeclaration)

Interface for spectating response

```typescript
/**
 * Interface for spectating response
 */
```

### GameEventType (EnumDeclaration)

**Tags:**

- @deprecated - LEGACY EVENT SYSTEM
 * Migration guide:
 * 1. Use GameEvents enum instead of GameEventType
 * 2. Replace message structure from { type, gameId, data } to { event, gameId, ...data }
 * 3. Use the new type-safe event interfaces instead of the legacy ones
 * 
 * Example:
 * OLD: { type: GameEventType.CREATE_GAME, gameId: "123", data: { ... } }
 * NEW: { event: GameEvents.CREATE_GAME, gameId: "123", ... }
 * 
 * This system will be removed in a future release.

```typescript
/**
 * @deprecated - LEGACY EVENT SYSTEM
 * Migration guide:
 * 1. Use GameEvents enum instead of GameEventType
 * 2. Replace message structure from { type, gameId, data } to { event, gameId, ...data }
 * 3. Use the new type-safe event interfaces instead of the legacy ones
 * 
 * Example:
 * OLD: { type: GameEventType.CREATE_GAME, gameId: "123", data: { ... } }
 * NEW: { event: GameEvents.CREATE_GAME, gameId: "123", ... }
 * 
 * This system will be removed in a future release.
 */
```

### GameEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event interfaces with GameEvents enum instead

```typescript
/**
 * @deprecated - Use the new event interfaces with GameEvents enum instead
 */
```

### CreateGameEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### JoinGameEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### MakeMoveEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### AllocateBPEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### TacticalRetreatEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### RequestGameHistoryLegacyEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### SpectateGameLegacyEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### GameCreatedEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### GameJoinedEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### GameStateUpdatedEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### MoveResultEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### DuelStartedEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### DuelResultEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### GameErrorEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### GameOverEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### GameHistoryEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### SpectatingLegacyEvent (InterfaceDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### ClientGameEvent (TypeAliasDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

### ServerGameEvent (TypeAliasDeclaration)

**Tags:**

- @deprecated - Use the new event system */

```typescript
/** @deprecated - Use the new event system */
```

