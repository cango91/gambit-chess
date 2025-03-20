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

### moveNumber (PropertySignature) in MoveNotation

Move number (e.g., 1 for White's first move, 1.5 for Black's first move)Using half moves where whole numbers are White's moves

```typescript
/**
   * Move number (e.g., 1 for White's first move, 1.5 for Black's first move)
   * Using half moves where whole numbers are White's moves
   */
```

### player (PropertySignature) in MoveNotation

Player who made the move

```typescript
/**
   * Player who made the move
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

### duel (PropertySignature) in MoveNotation

Related duel (if move triggered a duel)

```typescript
/**
   * Related duel (if move triggered a duel)
   */
```

### tacticalRetreat (PropertySignature) in MoveNotation

Related tactical retreat (if a duel resulted in a retreat)

```typescript
/**
   * Related tactical retreat (if a duel resulted in a retreat)
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

### extended (PropertySignature) in MoveNotation

Extended notation for Gambit Chess (includes BP information)

```typescript
/**
   * Extended notation for Gambit Chess (includes BP information)
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

### moveNumber (PropertySignature)

Move number (e.g., 1 for White's first move, 1.5 for Black's first move)Using half moves where whole numbers are White's moves

```typescript
/**
   * Move number (e.g., 1 for White's first move, 1.5 for Black's first move)
   * Using half moves where whole numbers are White's moves
   */
```

### player (PropertySignature)

Player who made the move

```typescript
/**
   * Player who made the move
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

### duel (PropertySignature)

Related duel (if move triggered a duel)

```typescript
/**
   * Related duel (if move triggered a duel)
   */
```

### tacticalRetreat (PropertySignature)

Related tactical retreat (if a duel resulted in a retreat)

```typescript
/**
   * Related tactical retreat (if a duel resulted in a retreat)
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

### extended (PropertySignature)

Extended notation for Gambit Chess (includes BP information)

```typescript
/**
   * Extended notation for Gambit Chess (includes BP information)
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

### outcome (PropertySignature) in DuelNotation

Outcome of the duel

```typescript
/**
   * Outcome of the duel
   */
```

### notation (PropertySignature) in DuelNotation

Standard notation representation of the duele.g., "R⚔️N:R+" (Rook attacks Knight, Rook wins)

```typescript
/**
   * Standard notation representation of the duel
   * e.g., "R⚔️N:R+" (Rook attacks Knight, Rook wins)
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

### outcome (PropertySignature)

Outcome of the duel

```typescript
/**
   * Outcome of the duel
   */
```

### notation (PropertySignature)

Standard notation representation of the duele.g., "R⚔️N:R+" (Rook attacks Knight, Rook wins)

```typescript
/**
   * Standard notation representation of the duel
   * e.g., "R⚔️N:R+" (Rook attacks Knight, Rook wins)
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

### to (PropertySignature) in TacticalRetreatNotation

Target position for the retreat in algebraic notation

```typescript
/**
   * Target position for the retreat in algebraic notation
   */
```

### notation (PropertySignature) in TacticalRetreatNotation

Standard notation representation of the retreate.g., "B↩️c4" (Bishop retreats to c4)

```typescript
/**
   * Standard notation representation of the retreat
   * e.g., "B↩️c4" (Bishop retreats to c4)
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

### to (PropertySignature)

Target position for the retreat in algebraic notation

```typescript
/**
   * Target position for the retreat in algebraic notation
   */
```

### notation (PropertySignature)

Standard notation representation of the retreate.g., "B↩️c4" (Bishop retreats to c4)

```typescript
/**
   * Standard notation representation of the retreat
   * e.g., "B↩️c4" (Bishop retreats to c4)
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

### positionToNotation (FunctionDeclaration)

Convert a position to algebraic notation

**Tags:**

- @param position Position object (x,y coordinates)
 * @returns String in algebraic notation (e.g., "e4")

```typescript
/**
 * Convert a position to algebraic notation
 * @param position Position object (x,y coordinates)
 * @returns String in algebraic notation (e.g., "e4")
 */
```

### notationToPosition (FunctionDeclaration)

Convert algebraic notation to a position

**Tags:**

- @param notation String in algebraic notation (e.g., "e4")
 * @returns Position object

```typescript
/**
 * Convert algebraic notation to a position
 * @param notation String in algebraic notation (e.g., "e4")
 * @returns Position object
 */
```

### getPieceSymbol (FunctionDeclaration)

Get the piece symbol for notation

**Tags:**

- @param pieceType The type of piece
 * @returns Symbol representing the piece (e.g., "N" for Knight)

```typescript
/**
 * Get the piece symbol for notation
 * @param pieceType The type of piece
 * @returns Symbol representing the piece (e.g., "N" for Knight)
 */
```

