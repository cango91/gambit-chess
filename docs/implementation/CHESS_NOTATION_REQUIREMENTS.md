# Chess Notation Requirements

## Standard Chess Notation Support

The shared layer must implement standard chess notation functionality:

- **Algebraic Notation (SAN)**: Standard format for recording chess moves
  - Examples: e4, Nf3, O-O (castling), exd5 (pawn capture)
  - Parsing and generation of SAN strings to/from move objects
  
- **Portable Game Notation (PGN)**: Standard format for recording complete chess games
  - Including header information (players, date, etc.)
  - Full game move history in SAN
  - Support for move comments and annotations

## Gambit Chess Extensions

The notation system must be extended to support Gambit Chess-specific mechanics:

### BP Allocation Notation

For recording BP allocations during duels:
- Format: `[A:x/D:y]` where:
  - `A:x` represents Attacker allocating x BP
  - `D:y` represents Defender allocating y BP
  
Example: `exd5[A:5/D:7]` indicates pawn capture attempt on d5 with attacker allocating 5 BP and defender allocating
 7 BP (resulting in failed capture)

### Tactical Retreat Notation

For recording retreats after failed captures:
- Format: `→squareID(cost)` for retreats to a square other than original
- Format: `→origin(0)` for free retreat to original position

Examples:
- `Nxe4[A:3/D:5]→c3(2)` - Knight attempted capture on e4, failed (3 BP vs 5 BP), retreated to c3 at cost of 2 BP
- `Bxh7[A:4/D:4]→f1(0)` - Bishop attempted capture on h7, failed (4 BP vs 4 BP, defender wins tie), returned to original square f1 for free

### BP Regeneration Notation

For recording BP regeneration:
- Format: `{+n}` where n is the amount of BP regenerated
- **Important**: BP regeneration notation must ONLY be included:
  - For the player's own moves in live games
  - In completed game records/replays
  - Never for opponent's moves in active games

Example: `Nf3{+3}` indicates Knight moved to f3 and player regenerated 3 BP from tactical advantages

## Implementation Requirements

- All notation parsing and generation must be implemented in the shared domain
- Functions must be pure with no side effects
- Comprehensive unit tests must verify notation correctness
- Documentation must include examples of all notation formats
- Parser must be robust and handle error cases gracefully

## JSDoc Example

```typescript
/**
 * Converts a move to Gambit Chess extended algebraic notation
 * 
 * @param {Move} move - The move object to convert
 * @param {DuelResult|null} duel - Duel result if this move involved a capture attempt
 * @param {Retreat|null} retreat - Retreat information if a retreat occurred
 * @param {number} bpRegeneration - BP regenerated after the move
 * @returns {string} The move in Gambit Chess extended notation
 * 
 * @example
 * // Returns "e4"
 * toGambitNotation({ from: "e2", to: "e4", piece: "p" }, null, null, 1);
 * 
 * @example
 * // Returns "Nxe5[A:4/D:2]"
 * toGambitNotation(
 *   { from: "c4", to: "e5", piece: "N", capture: "p" },
 *   { attackerAllocation: 4, defenderAllocation: 2, attacker: "white", outcome: "success" },
 *   null,
 *   0
 * );
 * 
 * @example
 * // Returns "Qxf7[A:3/D:5]→d5(2){+3}"
 * toGambitNotation(
 *   { from: "a4", to: "f7", piece: "Q", capture: "p" }, 
 *   { attackerAllocation: 3, defenderAllocation: 5, attacker: "white", outcome: "failed" },
 *   { to: "d5", cost: 2 },
 *   3
 * );
 */
function toGambitNotation(move, duel, retreat, bpRegeneration) {
  // Implementation
}
```