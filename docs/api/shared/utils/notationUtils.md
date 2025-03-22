# notationUtils Module

File: `utils/notationUtils.ts`

## JSDoc Documentation

### PieceWithBP (InterfaceDeclaration)

Chess piece interface with Battle Points

```typescript
/**
 * Chess piece interface with Battle Points
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

- @param algebraic The algebraic notation
 * @returns The position

```typescript
/**
 * Convert algebraic notation to a position (e.g., "a1" to {x: 0, y: 0})
 * @param algebraic The algebraic notation
 * @returns The position
 */
```

### positionToNotation (FunctionDeclaration)

Convert a position to standard notation format

**Tags:**

- @param position The position to convert
 * @returns Position in notation format (e.g., "a1")

```typescript
/**
 * Convert a position to standard notation format
 * @param position The position to convert
 * @returns Position in notation format (e.g., "a1")
 */
```

### notationToPosition (FunctionDeclaration)

Convert notation to a position

**Tags:**

- @param notation The notation string (e.g., "a1")
 * @returns Position object or null if the notation is invalid

```typescript
/**
 * Convert notation to a position
 * @param notation The notation string (e.g., "a1")
 * @returns Position object or null if the notation is invalid
 */
```

### createMoveNotation (FunctionDeclaration)

Create a move notation object

**Tags:**

- @param piece The piece that moved
 * @param from Starting position
 * @param to Destination position
 * @param moveType Type of move
 * @param isCheck Whether the move resulted in check
 * @param isCheckmate Whether the move resulted in checkmate
 * @param capturedPiece Piece that was captured (if any)
 * @param promotedTo Piece type after promotion (if applicable)
 * @returns Move notation object

```typescript
/**
 * Create a move notation object
 * @param piece The piece that moved
 * @param from Starting position
 * @param to Destination position
 * @param moveType Type of move
 * @param isCheck Whether the move resulted in check
 * @param isCheckmate Whether the move resulted in checkmate
 * @param capturedPiece Piece that was captured (if any)
 * @param promotedTo Piece type after promotion (if applicable)
 * @returns Move notation object
 */
```

### createDuelNotation (FunctionDeclaration)

Create a duel notation object

**Tags:**

- @param attackerPiece Attacker piece type
 * @param defenderPiece Defender piece type
 * @param attackerPosition Attacker position
 * @param defenderPosition Defender position
 * @param outcome Duel outcome
 * @returns Duel notation object

```typescript
/**
 * Create a duel notation object
 * @param attackerPiece Attacker piece type
 * @param defenderPiece Defender piece type
 * @param attackerPosition Attacker position
 * @param defenderPosition Defender position
 * @param outcome Duel outcome
 * @returns Duel notation object
 */
```

### createTacticalRetreatNotation (FunctionDeclaration)

Create a tactical retreat notation object

**Tags:**

- @param piece The piece that retreated
 * @param from Starting position
 * @param to Destination position
 * @param failedCapturePosition Position of the failed capture attempt
 * @returns Tactical retreat notation object

```typescript
/**
 * Create a tactical retreat notation object
 * @param piece The piece that retreated
 * @param from Starting position
 * @param to Destination position
 * @param failedCapturePosition Position of the failed capture attempt
 * @returns Tactical retreat notation object
 */
```

### createGameHistory (FunctionDeclaration)

Create a new game history object

**Tags:**

- @returns Empty game history

```typescript
/**
 * Create a new game history object
 * @returns Empty game history
 */
```

### addMoveToHistory (FunctionDeclaration)

Add a move to the game history

**Tags:**

- @param history The game history
 * @param move Move to add
 * @returns Updated game history

```typescript
/**
 * Add a move to the game history
 * @param history The game history
 * @param move Move to add
 * @returns Updated game history
 */
```

### generateSAN (FunctionDeclaration)

Generate standard algebraic notation (SAN) for a chess move

**Tags:**

- @param piece The type of piece moved
 * @param from Starting position
 * @param to Destination position
 * @param moveType Type of move (normal, capture, castle, etc.)
 * @param capturedPiece Type of piece captured (if any)
 * @param isCheck Whether the move results in check
 * @param isCheckmate Whether the move results in checkmate
 * @param promotedTo Piece type after promotion (if applicable)
 * @returns Standard algebraic notation string

```typescript
/**
 * Generate standard algebraic notation (SAN) for a chess move
 * @param piece The type of piece moved
 * @param from Starting position
 * @param to Destination position
 * @param moveType Type of move (normal, capture, castle, etc.)
 * @param capturedPiece Type of piece captured (if any)
 * @param isCheck Whether the move results in check
 * @param isCheckmate Whether the move results in checkmate
 * @param promotedTo Piece type after promotion (if applicable)
 * @returns Standard algebraic notation string
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

