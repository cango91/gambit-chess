# MoveValidator Module

File: `validation/MoveValidator.ts`

## JSDoc Documentation

### MoveValidationResult (InterfaceDeclaration)

Result of move validation

```typescript
/**
 * Result of move validation
 */
```

### MoveValidator (ClassDeclaration)

Class for validating chess moves with board context

**Tags:**

- @internal */

```typescript
/**
 * Class for validating chess moves with board context
 * @internal
 */
```

### validateMove (MethodDeclaration)

Validates a move on the board

**Tags:**

- @param board The board
   * @param from Starting position
   * @param to Destination position
   * @returns The move type if valid, or throws an error if invalid

```typescript
/**
   * Validates a move on the board
   * @param board The board
   * @param from Starting position
   * @param to Destination position
   * @returns The move type if valid, or throws an error if invalid
   */
```

### isPositionOnBoard (MethodDeclaration)

Checks if a position is on the board

```typescript
/**
   * Checks if a position is on the board
   */
```

### isValidMoveForPiece (MethodDeclaration)

Checks if a move is valid according to piece rules

```typescript
/**
   * Checks if a move is valid according to piece rules
   */
```

### determineMoveType (MethodDeclaration)

Determines the type of move being made

```typescript
/**
   * Determines the type of move being made
   */
```

