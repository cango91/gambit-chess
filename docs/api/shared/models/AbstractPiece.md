# AbstractPiece Module

File: `models/AbstractPiece.ts`

## JSDoc Documentation

### AbstractPiece (ClassDeclaration)

Abstract base class for all chess piecesImplements common functionality shared across all piece types

```typescript
/**
 * Abstract base class for all chess pieces
 * Implements common functionality shared across all piece types
 */
```

### Unnamed (Constructor)

Create a new chess piece

**Tags:**

- @param id Unique identifier for the piece
   * @param type The type of piece
   * @param color The piece color
   * @param position Initial position
   * @param hasMoved Whether the piece has moved before

```typescript
/**
   * Create a new chess piece
   * @param id Unique identifier for the piece
   * @param type The type of piece
   * @param color The piece color
   * @param position Initial position
   * @param hasMoved Whether the piece has moved before
   */
```

### id (GetAccessor)

Get the unique ID of this piece

```typescript
/**
   * Get the unique ID of this piece
   */
```

### battlePoints (GetAccessor)

Get the current battle points allocated to this piece

```typescript
/**
   * Get the current battle points allocated to this piece
   */
```

### getBPCapacity (MethodDeclaration)

Get the maximum BP capacity for this piece type

**Tags:**

- @returns BP capacity based on piece type

```typescript
/**
   * Get the maximum BP capacity for this piece type
   * @returns BP capacity based on piece type
   */
```

### allocateBattlePoints (MethodDeclaration)

Allocate battle points to this piece for a duel

**Tags:**

- @param amount The amount of BP to allocate
   * @returns The actual amount allocated (may be lower if insufficient BP)

```typescript
/**
   * Allocate battle points to this piece for a duel
   * @param amount The amount of BP to allocate
   * @returns The actual amount allocated (may be lower if insufficient BP)
   */
```

### resetBattlePoints (MethodDeclaration)

Reset battle points to zero

```typescript
/**
   * Reset battle points to zero
   */
```

### moveTo (MethodDeclaration)

Move this piece to a new position

**Tags:**

- @param position The destination position

```typescript
/**
   * Move this piece to a new position
   * @param position The destination position
   */
```

### isLongRangePiece (MethodDeclaration)

Check if this piece is long-range (bishop, rook, queen)

**Tags:**

- @returns True if piece is long-range

```typescript
/**
   * Check if this piece is long-range (bishop, rook, queen)
   * @returns True if piece is long-range
   */
```

### clone (MethodDeclaration)

Create a deep copy of this piece

**Tags:**

- @returns A new piece with the same properties

```typescript
/**
   * Create a deep copy of this piece
   * @returns A new piece with the same properties
   */
```

### toDTO (MethodDeclaration)

Convert to a data transfer object

**Tags:**

- @returns DTO representation of this piece

```typescript
/**
   * Convert to a data transfer object
   * @returns DTO representation of this piece
   */
```

