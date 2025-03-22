
# Gambit Chess Shared Module

## Overview
The Gambit Chess Shared Module provides the core domain logic and types for the Gambit Chess application. This module acts as a bridge between client and server components, ensuring consistent game rules, move validation, and state management across the entire application.

## Features

### Core Chess Logic
- 🎮 Complete chess move validation
- ♟️ Comprehensive piece movement rules
- ⚡ Check and checkmate detection
- 👑 Special moves (castling, en passant, promotion)

### Gambit Chess Mechanics
- ⚔️ Duel system with battle point allocation
- 🛡️ Tactical retreat rules and validation
- 🐴 Knight retreat path calculation
- 🎲 Battle point cost determination

### Utilities
- 📝 Chess notation conversion and parsing
- 🧩 Board position and piece utilities
- 🔄 Game state transformation helpers

## Installation

```bash
cd shared
npm install
```

## Usage

The shared module needs to be built and packaged for use in upstream projects (server and client)
Convenience scripts are provided.

```bash
npm run build
npm run package
```

### Importing in client or server
```typescript
// From client
import { Board, PieceType, MoveValidator } from 'gambit-chess-shared';

// From server
const { Board, PieceType, MoveValidator } = require('gambit-chess-shared');
```

### Examples

#### Creating a board
```typescript
import { BoardImpl, PieceFactoryImpl, PieceType, PlayerColor } from 'gambit-chess-shared';

const pieceFactory = new PieceFactoryImpl();
const board = new BoardImpl([
  pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }),
  pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x: 4, y: 1 }),
  pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 0, y: 7 }),
]);
```

#### Validating moves
```typescript
import { MoveValidator } from 'gambit-chess-shared';

// Returns a MoveType or throws an error if invalid
const moveType = MoveValidator.validateMove(
  board,
  { x: 4, y: 1 }, // from
  { x: 4, y: 3 }  // to
);
```

#### Working with notation
```typescript
import { positionToNotation, notationToPosition } from 'gambit-chess-shared';

// Convert between chess notation and coordinates
const notation = positionToNotation({ x: 4, y: 1 }); // "e2"
const position = notationToPosition("e2"); // { x: 4, y: 1 }
```

#### Duel and Tactical Retreat
```typescript
import { DuelRules, TacticalRetreatRules } from 'gambit-chess-shared';

// Validate battle point allocation
const isValid = DuelRules.validateBPAllocation(piece, allocatedBP);

// Calculate maximum BP capacity for a piece
const maxBP = DuelRules.getMaxBattlePoints(pieceType);

// Calculate tactical retreat BP cost
const cost = TacticalRetreatRules.calculateRetreatBPCost(piece, fromPosition, toPosition);
```

## Architecture

The shared module follows a clean separation of concerns:

- `models/` - Core data structures like Board and Pieces
- `types/` - TypeScript interfaces and enums
- `rules/` - Game rule implementations
- `validation/` - Move and check validation
- `utils/` - Helper functions

## Running Tests

Before running tests you should build the project (this ensures the compressed knight retreat cost table is generated in pre-compile step)

```bash
npm run build
npm run test
```

## Documentation

All components are documented according to JSDoc standards. The module uses a documentation export pattern to ensure up-to-date API documentation:

```typescript
export const __documentation = {
  name: "ModuleName",
  purpose: "Description of module purpose",
  publicAPI: { /* ... */ },
  implementationStatus: "Complete"
};
```

Generate api documentation from code:

```bash
npm run docs
```

---

© Gambit Chess 2025