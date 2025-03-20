# pieceUtils Module

File: `utils/pieceUtils.ts`

## JSDoc Documentation

### isLongRangePiece (FunctionDeclaration)

Check if a piece is a long-range piece (bishop, rook, queen)

**Tags:**

- @param pieceType The type of the piece
 * @returns True if the piece is long-range

```typescript
/**
 * Check if a piece is a long-range piece (bishop, rook, queen)
 * @param pieceType The type of the piece
 * @returns True if the piece is long-range
 */
```

### getBPCapacity (FunctionDeclaration)

Get the BP capacity for a piece type

**Tags:**

- @param pieceType The type of the piece
 * @returns The BP capacity

```typescript
/**
 * Get the BP capacity for a piece type
 * @param pieceType The type of the piece
 * @returns The BP capacity
 */
```

### isValidPosition (FunctionDeclaration)

Check if a position is within the board boundaries

**Tags:**

- @param position The position to check
 * @returns True if the position is valid

```typescript
/**
 * Check if a position is within the board boundaries
 * @param position The position to check
 * @returns True if the position is valid
 */
```

### getOpponentColor (FunctionDeclaration)

Get the opponent color

**Tags:**

- @param color The player color
 * @returns The opponent color

```typescript
/**
 * Get the opponent color
 * @param color The player color
 * @returns The opponent color
 */
```

### positionToAlgebraic (FunctionDeclaration)

Convert a position to algebraic notation (e.g., {x: 0, y: 0} to "a1")

**Tags:**

- @param position The position to convert
 * @returns The position in algebraic notation

```typescript
/**
 * Convert a position to algebraic notation (e.g., {x: 0, y: 0} to "a1")
 * @param position The position to convert
 * @returns The position in algebraic notation
 */
```

### algebraicToPosition (FunctionDeclaration)

Convert algebraic notation to a position (e.g., "a1" to {x: 0, y: 0})

**Tags:**

- @param algebraic The position in algebraic notation
 * @returns The position object

```typescript
/**
 * Convert algebraic notation to a position (e.g., "a1" to {x: 0, y: 0})
 * @param algebraic The position in algebraic notation
 * @returns The position object
 */
```

### isDarkSquare (FunctionDeclaration)

Check if a position is a dark square

**Tags:**

- @param position The position to check
 * @returns True if the position is a dark square

```typescript
/**
 * Check if a position is a dark square
 * @param position The position to check
 * @returns True if the position is a dark square
 */
```

