# notation Module

File: `types/notation.ts`

## JSDoc Documentation

### id (PropertySignature) in MoveNotation

Unique identifier for the move

```typescript
/**
   * Unique identifier for the move
   */
```

### piece (PropertySignature) in MoveNotation

Piece that was moved

```typescript
/**
   * Piece that was moved
   */
```

### from (PropertySignature) in MoveNotation

Starting position in algebraic notation (e.g., "e2")

```typescript
/**
   * Starting position in algebraic notation (e.g., "e2")
   */
```

### to (PropertySignature) in MoveNotation

Target position in algebraic notation (e.g., "e4")

```typescript
/**
   * Target position in algebraic notation (e.g., "e4")
   */
```

### moveType (PropertySignature) in MoveNotation

Type of move

```typescript
/**
   * Type of move
   */
```

### capturedPiece (PropertySignature) in MoveNotation

Captured piece type (if any)

```typescript
/**
   * Captured piece type (if any)
   */
```

### promotedTo (PropertySignature) in MoveNotation

Piece type after promotion (if applicable)

```typescript
/**
   * Piece type after promotion (if applicable)
   */
```

### isCheck (PropertySignature) in MoveNotation

Whether the move resulted in check

```typescript
/**
   * Whether the move resulted in check
   */
```

### isCheckmate (PropertySignature) in MoveNotation

Whether the move resulted in checkmate

```typescript
/**
   * Whether the move resulted in checkmate
   */
```

### san (PropertySignature) in MoveNotation

Standard algebraic notation (SAN) representatione.g., "Nf3", "exd5", "O-O", "Qxf7#"

```typescript
/**
   * Standard algebraic notation (SAN) representation
   * e.g., "Nf3", "exd5", "O-O", "Qxf7#"
   */
```

### MoveNotation (InterfaceDeclaration)

Represents a move in standard algebraic notation with extensions for Gambit Chess

```typescript
/**
 * Represents a move in standard algebraic notation with extensions for Gambit Chess
 */
```

### id (PropertySignature)

Unique identifier for the move

```typescript
/**
   * Unique identifier for the move
   */
```

### piece (PropertySignature)

Piece that was moved

```typescript
/**
   * Piece that was moved
   */
```

### from (PropertySignature)

Starting position in algebraic notation (e.g., "e2")

```typescript
/**
   * Starting position in algebraic notation (e.g., "e2")
   */
```

### to (PropertySignature)

Target position in algebraic notation (e.g., "e4")

```typescript
/**
   * Target position in algebraic notation (e.g., "e4")
   */
```

### moveType (PropertySignature)

Type of move

```typescript
/**
   * Type of move
   */
```

### capturedPiece (PropertySignature)

Captured piece type (if any)

```typescript
/**
   * Captured piece type (if any)
   */
```

### promotedTo (PropertySignature)

Piece type after promotion (if applicable)

```typescript
/**
   * Piece type after promotion (if applicable)
   */
```

### isCheck (PropertySignature)

Whether the move resulted in check

```typescript
/**
   * Whether the move resulted in check
   */
```

### isCheckmate (PropertySignature)

Whether the move resulted in checkmate

```typescript
/**
   * Whether the move resulted in checkmate
   */
```

### san (PropertySignature)

Standard algebraic notation (SAN) representatione.g., "Nf3", "exd5", "O-O", "Qxf7#"

```typescript
/**
   * Standard algebraic notation (SAN) representation
   * e.g., "Nf3", "exd5", "O-O", "Qxf7#"
   */
```

### id (PropertySignature) in DuelNotation

Unique identifier for the duel

```typescript
/**
   * Unique identifier for the duel
   */
```

### attackerPiece (PropertySignature) in DuelNotation

Attacker's piece type

```typescript
/**
   * Attacker's piece type
   */
```

### defenderPiece (PropertySignature) in DuelNotation

Defender's piece type

```typescript
/**
   * Defender's piece type
   */
```

### attackerPosition (PropertySignature) in DuelNotation

Attacker's position in algebraic notation

```typescript
/**
   * Attacker's position in algebraic notation
   */
```

### defenderPosition (PropertySignature) in DuelNotation

Defender's position in algebraic notation

```typescript
/**
   * Defender's position in algebraic notation
   */
```

### outcome (PropertySignature) in DuelNotation

Outcome of the duel

```typescript
/**
   * Outcome of the duel
   */
```

### DuelNotation (InterfaceDeclaration)

Represents a duel in Gambit Chess notation

```typescript
/**
 * Represents a duel in Gambit Chess notation
 */
```

### id (PropertySignature)

Unique identifier for the duel

```typescript
/**
   * Unique identifier for the duel
   */
```

### attackerPiece (PropertySignature)

Attacker's piece type

```typescript
/**
   * Attacker's piece type
   */
```

### defenderPiece (PropertySignature)

Defender's piece type

```typescript
/**
   * Defender's piece type
   */
```

### attackerPosition (PropertySignature)

Attacker's position in algebraic notation

```typescript
/**
   * Attacker's position in algebraic notation
   */
```

### defenderPosition (PropertySignature)

Defender's position in algebraic notation

```typescript
/**
   * Defender's position in algebraic notation
   */
```

### outcome (PropertySignature)

Outcome of the duel

```typescript
/**
   * Outcome of the duel
   */
```

### id (PropertySignature) in TacticalRetreatNotation

Unique identifier for the retreat

```typescript
/**
   * Unique identifier for the retreat
   */
```

### piece (PropertySignature) in TacticalRetreatNotation

Retreating piece type

```typescript
/**
   * Retreating piece type
   */
```

### from (PropertySignature) in TacticalRetreatNotation

Original position before the retreat in algebraic notation

```typescript
/**
   * Original position before the retreat in algebraic notation
   */
```

### to (PropertySignature) in TacticalRetreatNotation

Target position for the retreat in algebraic notation

```typescript
/**
   * Target position for the retreat in algebraic notation
   */
```

### failedCapturePosition (PropertySignature) in TacticalRetreatNotation

Position of the failed capture attempt in algebraic notation

```typescript
/**
   * Position of the failed capture attempt in algebraic notation
   */
```

### TacticalRetreatNotation (InterfaceDeclaration)

Represents a tactical retreat after a failed capture attempt

```typescript
/**
 * Represents a tactical retreat after a failed capture attempt
 */
```

### id (PropertySignature)

Unique identifier for the retreat

```typescript
/**
   * Unique identifier for the retreat
   */
```

### piece (PropertySignature)

Retreating piece type

```typescript
/**
   * Retreating piece type
   */
```

### from (PropertySignature)

Original position before the retreat in algebraic notation

```typescript
/**
   * Original position before the retreat in algebraic notation
   */
```

### to (PropertySignature)

Target position for the retreat in algebraic notation

```typescript
/**
   * Target position for the retreat in algebraic notation
   */
```

### failedCapturePosition (PropertySignature)

Position of the failed capture attempt in algebraic notation

```typescript
/**
   * Position of the failed capture attempt in algebraic notation
   */
```

### moves (PropertySignature) in GameHistory

Array of moves in the game

```typescript
/**
   * Array of moves in the game
   */
```

### toString (PropertySignature) in GameHistory

Get a string representation of the full game history

```typescript
/**
   * Get a string representation of the full game history
   */
```

### GameHistory (InterfaceDeclaration)

Represents the complete game history

```typescript
/**
 * Represents the complete game history
 */
```

### moves (PropertySignature)

Array of moves in the game

```typescript
/**
   * Array of moves in the game
   */
```

### toString (PropertySignature)

Get a string representation of the full game history

```typescript
/**
   * Get a string representation of the full game history
   */
```

