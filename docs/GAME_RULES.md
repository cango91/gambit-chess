# Gambit Chess - A Non-Deterministic Chess Variant

## Overview

Gambit Chess is a novel take on the classic game of chess, where the outcome of capture attempts is not predetermined. Instead of a simple piece removal, conflicts are resolved through a strategic **Resource Management Duel**. This introduces an element of uncertainty, risk management, and tactical resource allocation to every potential capture.

## Core Mechanic: Resource Management Duel for Captures

When a player attempts to capture an opponent's piece with a valid chess move, instead of the capture occurring automatically, a **Resource Management Duel** is initiated. This duel determines whether the capture is successful.

**How the Duel Works:**

1.  **Resource:** Each player has a pool of **Battle Points**.
2.  **Allocation Phase:** Both the attacking player and the defending player secretly allocate a portion of their current BP to the duel. Each piece has a **BP Capacity** which is the same as their classic chess piece value by default (1 for pawn, 3 for bishop, etc.). The server settings can configure these values. The Maximum BP any piece can have is **10** (server can configure this value); however, allocating BP beyond the piece's capacity doubles the BP cost (i.e. a pawn being attacked by a Queen is guaranteed to be defended if the defending player spends 19BP on it).
3.  **Revelation:** Once both players (or the AI opponent) have made their allocation, the amounts are revealed.
4.  **Resolution:** The piece whose player allocated more BP to the duel wins.
    * **Attacker Wins:** The capture is successful. The defending piece is removed from the board, and the attacking piece moves to its square. The BP spent by both pieces in the duel is deducted from their respective remaining pools.
    * **Tie or Defender Wins:** The capture fails. The defending piece remains in its position, and the attacking piece stays in its original square. The BP spent by both pieces is still deducted.

**Important Considerations for the Duel:**

* **Hidden Information:** The exact amount of BP each piece has is not directly visible to the opponent, adding an element of bluffing and prediction.
* **Strategic Allocation:** Players must strategically decide how much BP to risk on each capture attempt or defense, considering the importance of the targeted piece and their overall BP reserves.
* **BP Depletion:** Once a player's BP reaches 0, they are effectively unable to make any captures on that turn.

## Resource System: Battle Points (BP)

* **Initial BP:** Each player starts with a static BP pool that is equal to the sum of the classic chess piece values on the player's side(8 pawns + 2 rooks + 2 knights + 2 bishops + 1 queen = 39BP, this value can be configured by the server)
* **BP Usage:** BP is spent during the Resource Management Duel, regardless of whether the capture is successful or not.
* **BP Regeneration** BP regenerates during gameplay using the following rules (which may require balancing changes as development continues, therefore all values configurable by server):
   * After a player's turn is completed they regenerate 1 BP.
   * Additionally, add any of the following that holds true:
      * **Pin:** If the move of the player in THIS turn resulted in pinning an opponent piece: Regenerate the pinned piece's classic chess value (if the piece is pinned to the King, regenerate 1 more BP).
      * **Skewer:** If the move of the player in THIS turn resulted in a skewer: Regenerate the difference of the skewered pieces' classical chess values. If 0 regenerate 1 BP.
      * **Fork:** If the move of the player in THIS turn resulted in a forked attack: Regenerate the lower of the forked pieces' classic chess value.
      * **Discovered Attack:** If the move of the player in THIS turn resulted in a discovered attack: Regen attacked piece value/2 rounded up.
      * **Check:** Regen 2 BP.

## Core Mechanic: Tactical Retreat

If an attacker loses the duel, their turn is forfeited and the attacking piece moves back to its original (non-capturing) position. However; the losing attacker can choose to spend BPs to perform a tactical retreat after a failed attack:

### Long-Range Pieces (Bishop, Rook, Queen)
They can reposition to any unoccupied (non-capturing) AND unblocked square ALONG their axis of attack (diagonal for bishop, horizontal/vertical for rook, depending on axis of attack, diagonal/vertical/horizontal for queen depending on axis of attack).

### Knights
Knights can also perform tactical retreats, repositioning to any unoccupied (non-capturing) square along the 3x2 or 2x3 rectangle defined by the 2 possible imaginary L-paths between their original position and the failed attacked square. The retreat path is considered the rectangle defined by the imaginary L shapes that could've been taken by the knight to make the attack, giving the knight a maximum possibility of 4 retreat squares. The BP cost for each square is calculated dynamically: the minimum number of turns it would normally take the knight for moving to that square from its initial (non-capturing) square (this calculation ignores actual board state: as long as a move lands within the board it is considered valid for the purposes of calculating minimum turns).

### BP Costs for Retreats
For all retreating pieces:
- Returning to the original position costs 0 BP
- For any other valid retreat position, the BP cost equals the distance from the original position (measured in squares moved) except for Knights.
- Knights follow a dynamic cost calculation based on their original (0-cost) position and the target retreat square (minimum number of turns it would normally take the knight to move to that square, ignoring occupied squares)

This tactical retreat system adds depth to failed captures, allowing pieces to reposition strategically even when an attack is unsuccessful.

## Gameplay Loop

1.  Players take turns making valid chess moves.
2.  If a move results in a capture attempt, a Resource Management Duel is initiated.
3.  Both players secretly allocate Battle Points for the duel.
4.  The allocations are revealed, and the winner of the duel is determined.
5.  If the attacker wins, the capture occurs. If the defender wins, the capture fails. If attack fails, the attacker may choose to spend BPs for a tactical retreat before forfeiting their turn.
6.  The game continues until a checkmate/stalemate/draw occurs under standard chess rules.