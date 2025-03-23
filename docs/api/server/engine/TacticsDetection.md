# TacticsDetection Module

File: `engine/TacticsDetection.ts`

## JSDoc Documentation

### ChessTactic (TypeAliasDeclaration)

Available chess tactics that can generate BP

```typescript
/**
 * Available chess tactics that can generate BP
 */
```

### TacticsDetection (ClassDeclaration)

Class responsible for detecting chess tactics that generate BP bonuses

```typescript
/**
 * Class responsible for detecting chess tactics that generate BP bonuses
 */
```

### detectTactics (MethodDeclaration)

Detect tactics in the given board state

**Tags:**

- @param playerColor Color of the player who made the move
   * @param beforeBoard Board state before the move
   * @param afterBoard Board state after the move
   * @returns Array of detected tactics

```typescript
/**
   * Detect tactics in the given board state
   * @param playerColor Color of the player who made the move
   * @param beforeBoard Board state before the move
   * @param afterBoard Board state after the move
   * @returns Array of detected tactics
   */
```

### hasFork (MethodDeclaration)

Check if there's a fork on the boardA fork is when a single piece attacks multiple enemy pieces simultaneously

```typescript
/**
   * Check if there's a fork on the board
   * A fork is when a single piece attacks multiple enemy pieces simultaneously
   */
```

### hasPin (MethodDeclaration)

Check if there's a pin on the boardA pin is when a piece cannot move because it would expose a more valuable piece behind it

```typescript
/**
   * Check if there's a pin on the board
   * A pin is when a piece cannot move because it would expose a more valuable piece behind it
   */
```

### hasSkewer (MethodDeclaration)

Check if there's a skewer on the boardA skewer is similar to a pin, but the more valuable piece is in front

```typescript
/**
   * Check if there's a skewer on the board
   * A skewer is similar to a pin, but the more valuable piece is in front
   */
```

### hasDiscoveredAttack (MethodDeclaration)

Check if there's a discovered attackA discovered attack occurs when a piece moves to reveal an attack by another piece

```typescript
/**
   * Check if there's a discovered attack
   * A discovered attack occurs when a piece moves to reveal an attack by another piece
   */
```

### wasDirect (MethodDeclaration)

Check if the check was direct (made by the moved piece) or discovered

```typescript
/**
   * Check if the check was direct (made by the moved piece) or discovered
   */
```

### canMoveInDirection (MethodDeclaration)

Check if a piece can move in a given direction

```typescript
/**
   * Check if a piece can move in a given direction
   */
```

### getPieceDirections (MethodDeclaration)

Get the directions a piece can move in

```typescript
/**
   * Get the directions a piece can move in
   */
```

### canCapture (MethodDeclaration)

Check if a piece at position 'from' can capture a piece at position 'to'

```typescript
/**
   * Check if a piece at position 'from' can capture a piece at position 'to'
   */
```

