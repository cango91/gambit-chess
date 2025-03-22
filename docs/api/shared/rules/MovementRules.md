# MovementRules Module

File: `rules/MovementRules.ts`

## JSDoc Documentation

### MovementRules (ClassDeclaration)

Basic movement rules that can be shared between client and server.
These don't include any security-sensitive features like check detection 
or full game state validation.

```typescript
/**
 * Basic movement rules that can be shared between client and server.
 * These don't include any security-sensitive features like check detection 
 * or full game state validation.
 */
```

### isValidBasicMove (MethodDeclaration)

Check if a move follows the basic movement pattern for a piece

**Tags:**

- @param pieceType The type of piece
   * @param pieceColor The color of the piece
   * @param from Starting position
   * @param to Destination position
   * @param hasMoved Whether the piece has moved before
   * @param hasTargetPiece Whether there is a piece at the destination (for pawn diagonal moves)
   * @returns True if the move follows the piece's movement pattern

```typescript
/**
   * Check if a move follows the basic movement pattern for a piece
   * @param pieceType The type of piece
   * @param pieceColor The color of the piece
   * @param from Starting position
   * @param to Destination position
   * @param hasMoved Whether the piece has moved before
   * @param hasTargetPiece Whether there is a piece at the destination (for pawn diagonal moves)
   * @returns True if the move follows the piece's movement pattern
   */
```

### isValidPawnMove (MethodDeclaration)

Check if a pawn move follows the basic movement pattern
Includes validation for capture patterns requiring presence of a target piece

**Tags:**

- @param pieceColor The color of the piece
   * @param from Starting position
   * @param to Destination position
   * @param hasMoved Whether the piece has moved before
   * @param hasTargetPiece Whether there is a piece at the destination (for diagonal captures)
   * @returns True if the move follows the pawn's movement pattern

```typescript
/**
   * Check if a pawn move follows the basic movement pattern
   * Includes validation for capture patterns requiring presence of a target piece
   * @param pieceColor The color of the piece
   * @param from Starting position
   * @param to Destination position
   * @param hasMoved Whether the piece has moved before
   * @param hasTargetPiece Whether there is a piece at the destination (for diagonal captures)
   * @returns True if the move follows the pawn's movement pattern
   */
```

### isValidKnightMove (MethodDeclaration)

Check if a knight move follows the basic movement pattern

```typescript
/**
   * Check if a knight move follows the basic movement pattern
   */
```

### isValidBishopMove (MethodDeclaration)

Check if a bishop move follows the basic movement pattern

```typescript
/**
   * Check if a bishop move follows the basic movement pattern
   */
```

### isValidRookMove (MethodDeclaration)

Check if a rook move follows the basic movement pattern

```typescript
/**
   * Check if a rook move follows the basic movement pattern
   */
```

### isValidQueenMove (MethodDeclaration)

Check if a queen move follows the basic movement pattern

```typescript
/**
   * Check if a queen move follows the basic movement pattern
   */
```

### isValidKingMove (MethodDeclaration)

Check if a king move follows the basic movement pattern

```typescript
/**
   * Check if a king move follows the basic movement pattern
   */
```

### getPositionsBetween (MethodDeclaration)

Get the positions between two points (not including the endpoints)
Used to check if a path is clear

**Tags:**

- @param from Starting position
   * @param to Ending position
   * @returns Array of positions between from and to

```typescript
/**
   * Get the positions between two points (not including the endpoints)
   * Used to check if a path is clear
   * @param from Starting position
   * @param to Ending position
   * @returns Array of positions between from and to
   */
```

