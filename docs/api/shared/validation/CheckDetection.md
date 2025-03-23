# CheckDetection Module

File: `validation/CheckDetection.ts`

## JSDoc Documentation

### CheckDetection (ClassDeclaration)

Functions to detect check situations

```typescript
/**
 * Functions to detect check situations
 */
```

### isInCheck (MethodDeclaration)

Check if a player is in check

**Tags:**

- @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in check

```typescript
/**
   * Check if a player is in check
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in check
   */
```

### isCheckmate (MethodDeclaration)

Check if a player is in checkmate

**Tags:**

- @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in checkmate

```typescript
/**
   * Check if a player is in checkmate
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in checkmate
   */
```

### isStalemate (MethodDeclaration)

Check if a player is in stalemate

**Tags:**

- @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in stalemate

```typescript
/**
   * Check if a player is in stalemate
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player is in stalemate
   */
```

### hasLegalMoves (MethodDeclaration)

Check if a player has any legal moves

**Tags:**

- @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player has at least one legal move

```typescript
/**
   * Check if a player has any legal moves
   * @param board The current board state
   * @param playerColor The color of the player to check
   * @returns True if the player has at least one legal move
   */
```

### isPositionUnderAttack (MethodDeclaration)

Check if a position is under attack by any opponent piece

**Tags:**

- @param board The current board state
   * @param position The position to check
   * @param defendingColor The color of the defending player
   * @returns True if the position is under attack

```typescript
/**
   * Check if a position is under attack by any opponent piece
   * @param board The current board state
   * @param position The position to check
   * @param defendingColor The color of the defending player
   * @returns True if the position is under attack
   */
```

### wouldMoveResultInCheck (MethodDeclaration)

Check if a move would result in the moving player being in check

**Tags:**

- @param board The current board state
   * @param from Starting position
   * @param to Destination position
   * @param playerColor The color of the moving player
   * @returns True if the move would result in check

```typescript
/**
   * Check if a move would result in the moving player being in check
   * @param board The current board state
   * @param from Starting position
   * @param to Destination position
   * @param playerColor The color of the moving player
   * @returns True if the move would result in check
   */
```

### canPawnAttack (MethodDeclaration)

Helper function to determine if a pawn can attack a specific position

**Tags:**

- @param pawnPosition Position of the pawn
   * @param targetPosition Position to check
   * @param pawnColor Color of the pawn
   * @returns True if the pawn can attack the target position

```typescript
/**
   * Helper function to determine if a pawn can attack a specific position
   * @param pawnPosition Position of the pawn
   * @param targetPosition Position to check
   * @param pawnColor Color of the pawn
   * @returns True if the pawn can attack the target position
   */
```

### findKingPosition (MethodDeclaration)

Find the position of a king in a board snapshot

**Tags:**

- @param boardSnapshot The board snapshot
   * @param kingColor The color of the king to find
   * @returns Position of the king
   * @throws Error if king is not found

```typescript
/**
   * Find the position of a king in a board snapshot
   * @param boardSnapshot The board snapshot
   * @param kingColor The color of the king to find
   * @returns Position of the king
   * @throws Error if king is not found
   */
```

### isPositionUnderAttackInSnapshot (MethodDeclaration)

Check if a position is under attack in a board snapshot

**Tags:**

- @param boardSnapshot The board snapshot
   * @param position The position to check
   * @param defendingColor The color of the defending player
   * @returns True if the position is under attack

```typescript
/**
   * Check if a position is under attack in a board snapshot
   * @param boardSnapshot The board snapshot
   * @param position The position to check
   * @param defendingColor The color of the defending player
   * @returns True if the position is under attack
   */
```

### isPathClearInSnapshot (MethodDeclaration)

Check if a path is clear in a board snapshot

**Tags:**

- @param boardSnapshot The board snapshot
   * @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear

```typescript
/**
   * Check if a path is clear in a board snapshot
   * @param boardSnapshot The board snapshot
   * @param from Starting position
   * @param to Ending position
   * @returns True if the path is clear
   */
```

