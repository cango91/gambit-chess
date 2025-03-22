# board Module

File: `types/board.ts`

## JSDoc Documentation

### getPieces (MethodSignature) in Board

Get all pieces currently on the board

```typescript
/**
   * Get all pieces currently on the board
   */
```

### getPieceAt (MethodSignature) in Board

Get piece at a specific position

**Tags:**

- @param position The position to check
   * @returns The piece at the position or undefined if no piece exists

```typescript
/**
   * Get piece at a specific position
   * @param position The position to check
   * @returns The piece at the position or undefined if no piece exists
   */
```

### isOccupied (MethodSignature) in Board

Check if a position is occupied by any piece

**Tags:**

- @param position The position to check
   * @returns True if the position is occupied

```typescript
/**
   * Check if a position is occupied by any piece
   * @param position The position to check
   * @returns True if the position is occupied
   */
```

### isOccupiedByColor (MethodSignature) in Board

Check if a position is occupied by a piece of the specified color

**Tags:**

- @param position The position to check
   * @param color The color to check for
   * @returns True if the position is occupied by a piece of the specified color

```typescript
/**
   * Check if a position is occupied by a piece of the specified color
   * @param position The position to check
   * @param color The color to check for
   * @returns True if the position is occupied by a piece of the specified color
   */
```

### isPathClear (MethodSignature) in Board

Check if a path between two positions is clear (for straight or diagonal moves)

**Tags:**

- @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear

```typescript
/**
   * Check if a path between two positions is clear (for straight or diagonal moves)
   * @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear
   */
```

### getKingPosition (MethodSignature) in Board

Get the position of the king of the specified color

**Tags:**

- @param color The color of the king
   * @returns The position of the king

```typescript
/**
   * Get the position of the king of the specified color
   * @param color The color of the king
   * @returns The position of the king
   */
```

### snapshot (MethodSignature) in Board

Create a read-only snapshot of the boardThis is useful for simulating moves without modifying the original board

```typescript
/**
   * Create a read-only snapshot of the board
   * This is useful for simulating moves without modifying the original board
   */
```

### Board (InterfaceDeclaration)

Board representation for validation purposes.This is used for move validation only and doesn't contain any state-changing logic.

```typescript
/**
 * Board representation for validation purposes.
 * This is used for move validation only and doesn't contain any state-changing logic.
 */
```

### getPieces (MethodSignature)

Get all pieces currently on the board

```typescript
/**
   * Get all pieces currently on the board
   */
```

### getPieceAt (MethodSignature)

Get piece at a specific position

**Tags:**

- @param position The position to check
   * @returns The piece at the position or undefined if no piece exists

```typescript
/**
   * Get piece at a specific position
   * @param position The position to check
   * @returns The piece at the position or undefined if no piece exists
   */
```

### isOccupied (MethodSignature)

Check if a position is occupied by any piece

**Tags:**

- @param position The position to check
   * @returns True if the position is occupied

```typescript
/**
   * Check if a position is occupied by any piece
   * @param position The position to check
   * @returns True if the position is occupied
   */
```

### isOccupiedByColor (MethodSignature)

Check if a position is occupied by a piece of the specified color

**Tags:**

- @param position The position to check
   * @param color The color to check for
   * @returns True if the position is occupied by a piece of the specified color

```typescript
/**
   * Check if a position is occupied by a piece of the specified color
   * @param position The position to check
   * @param color The color to check for
   * @returns True if the position is occupied by a piece of the specified color
   */
```

### isPathClear (MethodSignature)

Check if a path between two positions is clear (for straight or diagonal moves)

**Tags:**

- @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear

```typescript
/**
   * Check if a path between two positions is clear (for straight or diagonal moves)
   * @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear
   */
```

### getKingPosition (MethodSignature)

Get the position of the king of the specified color

**Tags:**

- @param color The color of the king
   * @returns The position of the king

```typescript
/**
   * Get the position of the king of the specified color
   * @param color The color of the king
   * @returns The position of the king
   */
```

### snapshot (MethodSignature)

Create a read-only snapshot of the boardThis is useful for simulating moves without modifying the original board

```typescript
/**
   * Create a read-only snapshot of the board
   * This is useful for simulating moves without modifying the original board
   */
```

### getPieces (MethodSignature) in BoardSnapshot

Get all pieces in the snapshot

```typescript
/**
   * Get all pieces in the snapshot
   */
```

### getPieceAt (MethodSignature) in BoardSnapshot

Get piece at a specific position in the snapshot

**Tags:**

- @param position The position to check
   * @returns The piece at the position or undefined if no piece exists

```typescript
/**
   * Get piece at a specific position in the snapshot
   * @param position The position to check
   * @returns The piece at the position or undefined if no piece exists
   */
```

### isOccupied (MethodSignature) in BoardSnapshot

Check if a position is occupied in the snapshot

**Tags:**

- @param position The position to check
   * @returns True if the position is occupied

```typescript
/**
   * Check if a position is occupied in the snapshot
   * @param position The position to check
   * @returns True if the position is occupied
   */
```

### withMove (MethodSignature) in BoardSnapshot

Create a new snapshot with a simulated move

**Tags:**

- @param from Starting position
   * @param to Ending position
   * @returns A new snapshot with the move applied

```typescript
/**
   * Create a new snapshot with a simulated move
   * @param from Starting position
   * @param to Ending position
   * @returns A new snapshot with the move applied
   */
```

### BoardSnapshot (InterfaceDeclaration)

Lightweight read-only board snapshot for validation purposesUsed for checking if a move would result in check

```typescript
/**
 * Lightweight read-only board snapshot for validation purposes
 * Used for checking if a move would result in check
 */
```

### getPieces (MethodSignature)

Get all pieces in the snapshot

```typescript
/**
   * Get all pieces in the snapshot
   */
```

### getPieceAt (MethodSignature)

Get piece at a specific position in the snapshot

**Tags:**

- @param position The position to check
   * @returns The piece at the position or undefined if no piece exists

```typescript
/**
   * Get piece at a specific position in the snapshot
   * @param position The position to check
   * @returns The piece at the position or undefined if no piece exists
   */
```

### isOccupied (MethodSignature)

Check if a position is occupied in the snapshot

**Tags:**

- @param position The position to check
   * @returns True if the position is occupied

```typescript
/**
   * Check if a position is occupied in the snapshot
   * @param position The position to check
   * @returns True if the position is occupied
   */
```

### withMove (MethodSignature)

Create a new snapshot with a simulated move

**Tags:**

- @param from Starting position
   * @param to Ending position
   * @returns A new snapshot with the move applied

```typescript
/**
   * Create a new snapshot with a simulated move
   * @param from Starting position
   * @param to Ending position
   * @returns A new snapshot with the move applied
   */
```

### createFromPieces (MethodSignature) in BoardFactory

Create a board from a list of pieces

**Tags:**

- @param pieces The pieces to place on the board
   * @returns A new board instance

```typescript
/**
   * Create a board from a list of pieces
   * @param pieces The pieces to place on the board
   * @returns A new board instance
   */
```

### BoardFactory (InterfaceDeclaration)

Simple factory for creating a board from a list of piecesUsed primarily for testing and validation

```typescript
/**
 * Simple factory for creating a board from a list of pieces
 * Used primarily for testing and validation
 */
```

### createFromPieces (MethodSignature)

Create a board from a list of pieces

**Tags:**

- @param pieces The pieces to place on the board
   * @returns A new board instance

```typescript
/**
   * Create a board from a list of pieces
   * @param pieces The pieces to place on the board
   * @returns A new board instance
   */
```

