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

### TacticsDetectionResult (InterfaceDeclaration)

Result of tactics detection including which tactics are new vs. pre-existing

```typescript
/**
 * Result of tactics detection including which tactics are new vs. pre-existing
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

Detect tactics in the given board state, distinguishing betweennewly created tactics and pre-existing ones

**Tags:**

- @param playerColor Color of the player who made the move
   * @param beforeBoard Board state before the move
   * @param afterBoard Board state after the move
   * @returns Object containing new tactics and pre-existing tactics

```typescript
/**
   * Detect tactics in the given board state, distinguishing between
   * newly created tactics and pre-existing ones
   * 
   * @param playerColor Color of the player who made the move
   * @param beforeBoard Board state before the move
   * @param afterBoard Board state after the move
   * @returns Object containing new tactics and pre-existing tactics
   */
```

### detectAllTactics (MethodDeclaration)

Detect all tactics currently on the board

**Tags:**

- @param board The board to analyze
   * @param playerColor The player whose tactics to detect
   * @returns Array of detected tactics

```typescript
/**
   * Detect all tactics currently on the board
   * @param board The board to analyze
   * @param playerColor The player whose tactics to detect
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

Check if there's a discovered attack on the board

```typescript
/**
   * Check if there's a discovered attack on the board
   */
```

### isDiscoveredCheck (MethodDeclaration)

Check if a move resulted in a discovered check

```typescript
/**
   * Check if a move resulted in a discovered check
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

## Module Documentation

```json
{
  name: "TacticsDetection",
  purpose: "Detects chess tactics that generate BP bonuses",
  implementationStatus: "Complete",
  moduleType: "Server",
  improvements: [
    "Added temporal tracking to determine new tactics vs. pre-existing ones",
    "Improved detection to avoid double-counting tactics across multiple turns"
  ]
}
```

