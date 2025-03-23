# TacticalRetreatRules Module

File: `rules/TacticalRetreatRules.ts`

## JSDoc Documentation

### TacticalRetreatRules (ClassDeclaration)

Rules for tactical retreat mechanics.
Contains only validation logic that can be shared between client and server.
Actual retreat resolution happens on the server.

```typescript
/**
 * Rules for tactical retreat mechanics.
 * Contains only validation logic that can be shared between client and server.
 * Actual retreat resolution happens on the server.
 */
```

### getKnightRetreatOptions (MethodDeclaration)

Get all possible knight retreat options

**Tags:**

- @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @returns Array of retreat options with positions and BP costs

```typescript
/**
   * Get all possible knight retreat options
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @returns Array of retreat options with positions and BP costs
   */
```

### calculateRetreatBPCost (MethodDeclaration)

Calculate the base BP cost for a retreat move

**Tags:**

- @param pieceType The type of piece
   * @param originalPosition Original position before attack
   * @param retreatPosition Position to retreat to
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @returns BP cost for the retreat (0 if returning to original position)

```typescript
/**
   * Calculate the base BP cost for a retreat move
   * @param pieceType The type of piece
   * @param originalPosition Original position before attack
   * @param retreatPosition Position to retreat to
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @returns BP cost for the retreat (0 if returning to original position)
   */
```

### isOnRetreatVector (MethodDeclaration)

Determine if retreating to a position is valid based on attack vector

**Tags:**

- @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @returns True if the retreat follows the attack vector and doesn't pass the failed capture

```typescript
/**
   * Determine if retreating to a position is valid based on attack vector
   * @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @returns True if the retreat follows the attack vector and doesn't pass the failed capture
   */
```

### isBeyondFailedCapture (MethodDeclaration)

Check if a retreat position is beyond the failed capture target

**Tags:**

- @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @returns True if the retreat doesn't go beyond the failed capture

```typescript
/**
   * Check if a retreat position is beyond the failed capture target
   * @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @returns True if the retreat doesn't go beyond the failed capture
   */
```

### isValidRetreatMove (MethodDeclaration)

Check if a retreat move is valid based on piece movement rules and retreat vectors

**Tags:**

- @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @param hasMoved Whether the piece has moved before the attack
   * @returns True if the retreat move is valid

```typescript
/**
   * Check if a retreat move is valid based on piece movement rules and retreat vectors
   * @param pieceType The type of piece
   * @param originalPosition Position before attack
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param retreatPosition Position to retreat to
   * @param hasMoved Whether the piece has moved before the attack
   * @returns True if the retreat move is valid
   */
```

### getValidRetreats (MethodDeclaration)

Calculate all valid retreat options for a piece with BP costs

**Tags:**

- @param pieceType The type of piece
   * @param originalPosition Position before attack 
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param hasMoved Whether the piece has moved before (pre-attack)
   * @returns Array of retreat options with positions and BP costs

```typescript
/**
   * Calculate all valid retreat options for a piece with BP costs
   * @param pieceType The type of piece
   * @param originalPosition Position before attack 
   * @param failedCapturePosition Position of the piece that wasn't captured
   * @param hasMoved Whether the piece has moved before (pre-attack)
   * @returns Array of retreat options with positions and BP costs
   */
```

