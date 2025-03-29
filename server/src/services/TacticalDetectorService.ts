import { 
  PieceColor, 
  Position, 
  PieceType, 
  ChessPiece, 
  PIECE_VALUES,
  isKingInCheck,
  positionToCoordinates,
  coordinatesToPosition
} from '@gambit-chess/shared';
import { Board } from '../models/Board';

/**
 * Represents a tactical advantage like a pin, fork, skewer, etc.
 */
interface PositionalAdvantage {
  piecePosition: Position; // Position of the piece creating the advantage
  targetPosition?: Position; // Position of the target piece (for pins, direct defenses)
  targetPositions?: Position[]; // Positions of multiple target pieces (for forks)
  secondaryPosition?: Position; // Secondary position (for skewers)
}

/**
 * Service for detecting tactical advantages that generate BP
 * Analyzes board states to identify new tactical positions
 */
export class TacticalDetectorService {
  // Default BP regeneration for a check (configurable)
  private static DEFAULT_CHECK_BP_REGEN = 2;
  
  /**
   * Calculates BP regeneration based on tactical advantages
   * 
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns Total BP regeneration from all tactical advantages
   */
  public calculateTacticalAdvantages(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): number {
    let totalBpRegen = 0;
    
    // Base regeneration of 1 BP is handled by BPManager
    
    // Check for new pins
    totalBpRegen += this.calculatePinRegeneration(color, board, previousBoard);
    
    // Check for new forks
    totalBpRegen += this.calculateForkRegeneration(color, board, previousBoard);
    
    // Check for new skewers
    totalBpRegen += this.calculateSkewerRegeneration(color, board, previousBoard);
    
    // Check for new direct defenses
    totalBpRegen += this.calculateDirectDefenseRegeneration(color, board, previousBoard);
    
    // Check for new discovered attacks
    totalBpRegen += this.calculateDiscoveredAttackRegeneration(color, board, previousBoard);
    
    // Check for check (only if it's a new check)
    if (this.isNewCheck(color, board, previousBoard)) {
      totalBpRegen += TacticalDetectorService.DEFAULT_CHECK_BP_REGEN;
    }
    
    return totalBpRegen;
  }
  
  /**
   * Calculates BP regeneration from pins
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns BP regeneration from pins
   */
  private calculatePinRegeneration(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): number {
    // Get pins created by the player
    const currentPins = this.detectPins(color, board);
    const previousPins = this.detectPins(color, previousBoard);
    
    // New pins = current pins - previous pins
    const newPins = this.findNewPositionalAdvantages(currentPins, previousPins);
    
    // Calculate value based on the value of pinned pieces
    let bpRegen = 0;
    for (const pin of newPins) {
      if (pin.targetPosition) {
        const pinnedPiece = board.getPiece(pin.targetPosition);
        if (pinnedPiece) {
          bpRegen += Math.ceil(PIECE_VALUES[pinnedPiece.type] / 3);
        }
      }
    }
    
    return bpRegen;
  }
  
  /**
   * Calculates BP regeneration from forks
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns BP regeneration from forks
   */
  private calculateForkRegeneration(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): number {
    // Get forks created by the player
    const currentForks = this.detectForks(color, board);
    const previousForks = this.detectForks(color, previousBoard);
    
    // New forks = current forks - previous forks
    const newForks = this.findNewPositionalAdvantages(currentForks, previousForks);
    
    // Calculate value based on the combined value of forked pieces
    let bpRegen = 0;
    for (const fork of newForks) {
      let totalValue = 0;
      if (fork.targetPositions && fork.targetPositions.length > 0) {
        for (const targetPos of fork.targetPositions) {
          const targetPiece = board.getPiece(targetPos);
          if (targetPiece) {
            totalValue += PIECE_VALUES[targetPiece.type];
          }
        }
        
        // Value depends on number of pieces forked and their combined value
        bpRegen += Math.ceil(totalValue / 3);
      }
    }
    
    return bpRegen;
  }
  
  /**
   * Calculates BP regeneration from skewers
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns BP regeneration from skewers
   */
  private calculateSkewerRegeneration(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): number {
    // Get skewers created by the player
    const currentSkewers = this.detectSkewers(color, board);
    const previousSkewers = this.detectSkewers(color, previousBoard);
    
    // New skewers = current skewers - previous skewers
    const newSkewers = this.findNewPositionalAdvantages(currentSkewers, previousSkewers);
    
    // Calculate value based on the value of skewered pieces
    let bpRegen = 0;
    for (const skewer of newSkewers) {
      if (skewer.secondaryPosition) {
        const skeweredPiece = board.getPiece(skewer.secondaryPosition);
        if (skeweredPiece) {
          bpRegen += Math.ceil(PIECE_VALUES[skeweredPiece.type] / 4);
        }
      }
    }
    
    return bpRegen;
  }
  
  /**
   * Calculates BP regeneration from direct defenses
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns BP regeneration from direct defenses
   */
  private calculateDirectDefenseRegeneration(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): number {
    // Get direct defenses created by the player
    const currentDefenses = this.detectDirectDefenses(color, board);
    const previousDefenses = this.detectDirectDefenses(color, previousBoard);
    
    // New defenses = current defenses - previous defenses
    const newDefenses = this.findNewPositionalAdvantages(currentDefenses, previousDefenses);
    
    // Calculate value based on the value of defended pieces
    let bpRegen = 0;
    for (const defense of newDefenses) {
      if (defense.targetPosition) {
        const defendedPiece = board.getPiece(defense.targetPosition);
        if (defendedPiece) {
          bpRegen += Math.ceil(PIECE_VALUES[defendedPiece.type] / 5);
        }
      }
    }
    
    return bpRegen;
  }
  
  /**
   * Calculates BP regeneration from discovered attacks
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns BP regeneration from discovered attacks
   */
  private calculateDiscoveredAttackRegeneration(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): number {
    // Get discovered attacks created by the player
    const currentDiscoveredAttacks = this.detectDiscoveredAttacks(color, board, previousBoard);
    // We need a special case here since we need the comparison of previous state with itself
    // Just pass an empty array as there are no discovered attacks when comparing a board with itself
    const previousDiscoveredAttacks: PositionalAdvantage[] = [];
    
    // New discovered attacks = current discovered attacks - previous discovered attacks
    const newDiscoveredAttacks = this.findNewPositionalAdvantages(currentDiscoveredAttacks, previousDiscoveredAttacks);
    
    // Calculate value based on the value of attacked pieces
    let bpRegen = 0;
    for (const attack of newDiscoveredAttacks) {
      if (attack.targetPosition) {
        const attackedPiece = board.getPiece(attack.targetPosition);
        if (attackedPiece) {
          bpRegen += Math.ceil(PIECE_VALUES[attackedPiece.type] / 2);
        }
      }
    }
    
    return bpRegen;
  }
  
  /**
   * Checks if there is a new check in the current board that wasn't in the previous board
   * @param color Player color checking for check
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns Whether there is a new check
   */
  private isNewCheck(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): boolean {
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check if the opponent's king is in check now
    const isCurrentlyInCheck = board.isInCheck(opponentColor);
    
    // Check if the opponent's king was in check before
    const wasPreviouslyInCheck = previousBoard.isInCheck(opponentColor);
    
    // Only count it as a "new" check if it wasn't in check before
    return isCurrentlyInCheck && !wasPreviouslyInCheck;
  }
  
  /**
   * Detects pieces that are pinned to higher value pieces
   * @param color Player color detecting pins
   * @param board Current board state
   * @returns Array of positional advantages representing pins
   */
  private detectPins(color: PieceColor, board: Board): PositionalAdvantage[] {
    const pins: PositionalAdvantage[] = [];
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = board.getPiecesByColor(opponentColor);
    
    // For each opponent piece that could be pinned
    for (const potentialPinned of opponentPieces) {
      // Skip kings (cannot be pinned)
      if (potentialPinned.type === 'k') continue;
      
      // Sliding pieces that can create pins (queen, rook, bishop)
      const playerPieces = board.getPiecesByColor(color);
      for (const attacker of playerPieces) {
        // Only long-range pieces can pin
        if (!this.isSlidingPiece(attacker)) continue;
        
        const [fromX, fromY] = positionToCoordinates(attacker.position);
        const [pinnedX, pinnedY] = positionToCoordinates(potentialPinned.position);
        
        // Check if attacker and potential pinned piece are aligned
        const isAligned = (attacker.type === 'r' || attacker.type === 'q') && 
          (fromX === pinnedX || fromY === pinnedY) || // Horizontal/vertical
          (attacker.type === 'b' || attacker.type === 'q') && 
          Math.abs(fromX - pinnedX) === Math.abs(fromY - pinnedY); // Diagonal
        
        if (!isAligned) continue;
        
        // Now check if there's a valuable piece (king or higher value) behind the pinned piece
        // Calculate the direction vector from attacker to pinned piece
        const dx = pinnedX > fromX ? 1 : pinnedX < fromX ? -1 : 0;
        const dy = pinnedY > fromY ? 1 : pinnedY < fromY ? -1 : 0;
        
        // Look beyond the pinned piece in the same direction
        let x = pinnedX + dx;
        let y = pinnedY + dy;
        let foundPinnedTo = false;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const pos = coordinatesToPosition(x, y);
          const piece = board.getPiece(pos);
          
          if (piece) {
            // If we find an opponent piece of higher value (or a king)
            if (piece.color === opponentColor && 
                (piece.type === 'k' || PIECE_VALUES[piece.type] > PIECE_VALUES[potentialPinned.type])) {
              // We've found a piece that the potential pinned piece is pinned to
              pins.push({
                piecePosition: attacker.position,
                targetPosition: potentialPinned.position,
                secondaryPosition: pos // The piece being protected by the pin
              });
              foundPinnedTo = true;
            }
            break; // Stop after finding any piece
          }
          
          // Continue in the same direction
          x += dx;
          y += dy;
        }
        
        if (foundPinnedTo) {
          // No need to check other attackers for this piece, it's already pinned
          break;
        }
      }
    }
    
    return pins;
  }
  
  // Helper function to check if a piece is a sliding piece (queen, rook, bishop)
  private isSlidingPiece(piece: ChessPiece): boolean {
    return piece.type === 'q' || piece.type === 'r' || piece.type === 'b';
  }
  
  /**
   * Detects forks on the board
   * A fork is when a piece attacks two or more enemy pieces simultaneously
   * @param color Player color
   * @param board Current board state
   * @returns Array of forks
   */
  private detectForks(color: PieceColor, board: Board): PositionalAdvantage[] {
    const forks: PositionalAdvantage[] = [];
    const attackingPieces = board.getPiecesByColor(color);
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check each of the player's pieces for potential forks
    for (const attacker of attackingPieces) {
      // Find all positions this piece attacks
      const attackedPositions = this.getAttackedPositions(attacker, board);
      
      // Find which of these positions have opponent pieces
      const attackedPieces: Position[] = [];
      const attackedValues: PieceType[] = [];
      
      for (const position of attackedPositions) {
        const piece = board.getPiece(position);
        if (piece && piece.color === opponentColor) {
          attackedPieces.push(position);
          attackedValues.push(piece.type);
        }
      }
      
      // If the piece attacks two or more opponent pieces, it's a fork
      if (attackedPieces.length >= 2) {
        // Calculate total value of forked pieces
        let totalValue = 0;
        for (const pieceType of attackedValues) {
          totalValue += PIECE_VALUES[pieceType];
        }
        
        // Only consider it a fork if the total value is significant
        // or if a king is involved (check)
        if (totalValue >= 6 || attackedValues.includes('k')) {
          forks.push({
            piecePosition: attacker.position,
            targetPositions: attackedPieces
          });
        }
      }
    }
    
    return forks;
  }
  
  /**
   * Gets all positions that a piece attacks
   * @param piece Attacking piece
   * @param board Current board state
   * @returns Array of attacked positions
   */
  private getAttackedPositions(piece: ChessPiece, board: Board): Position[] {
    const attacked: Position[] = [];
    const [pieceX, pieceY] = positionToCoordinates(piece.position);
    
    // Knight movements
    if (piece.type === 'n') {
      const knightMoves = [
        [1, 2], [2, 1], [2, -1], [1, -2],
        [-1, -2], [-2, -1], [-2, 1], [-1, 2]
      ];
      
      for (const [dx, dy] of knightMoves) {
        const x = pieceX + dx;
        const y = pieceY + dy;
        
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const pos = coordinatesToPosition(x, y);
          const targetPiece = board.getPiece(pos);
          
          // Knight can attack any square it can move to
          if (!targetPiece || targetPiece.color !== piece.color) {
            attacked.push(pos);
          }
        }
      }
    }
    
    // Pawn attacks
    else if (piece.type === 'p') {
      const direction = piece.color === 'white' ? 1 : -1;
      
      // Diagonal captures
      for (const dx of [-1, 1]) {
        const x = pieceX + dx;
        const y = pieceY + direction;
        
        if (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const pos = coordinatesToPosition(x, y);
          attacked.push(pos);
        }
      }
    }
    
    // King attacks
    else if (piece.type === 'k') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          
          const x = pieceX + dx;
          const y = pieceY + dy;
          
          if (x >= 0 && x < 8 && y >= 0 && y < 8) {
            const pos = coordinatesToPosition(x, y);
            const targetPiece = board.getPiece(pos);
            
            if (!targetPiece || targetPiece.color !== piece.color) {
              attacked.push(pos);
            }
          }
        }
      }
    }
    
    // Sliding pieces (queen, rook, bishop)
    else {
      const directions: [number, number][] = [];
      
      // Rook and Queen can move horizontally and vertically
      if (piece.type === 'r' || piece.type === 'q') {
        directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      }
      
      // Bishop and Queen can move diagonally
      if (piece.type === 'b' || piece.type === 'q') {
        directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      }
      
      // Check each direction
      for (const [dx, dy] of directions) {
        let x = pieceX + dx;
        let y = pieceY + dy;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const pos = coordinatesToPosition(x, y);
          const targetPiece = board.getPiece(pos);
          
          if (targetPiece) {
            // If enemy piece, we can attack it
            if (targetPiece.color !== piece.color) {
              attacked.push(pos);
            }
            // Stop after hitting any piece
            break;
          } else {
            // Empty square, we can move here
            attacked.push(pos);
          }
          
          x += dx;
          y += dy;
        }
      }
    }
    
    return attacked;
  }
  
  /**
   * Detects skewers on the board
   * A skewer is when a sliding piece attacks a high-value piece that is forced to move,
   * revealing a second piece behind it on the same line of attack
   * @param color Player color
   * @param board Current board state
   * @returns Array of skewers
   */
  private detectSkewers(color: PieceColor, board: Board): PositionalAdvantage[] {
    const skewers: PositionalAdvantage[] = [];
    const attackingPieces = board.getPiecesByColor(color);
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Only sliding pieces can create skewers
    for (const attacker of attackingPieces) {
      if (!this.isSlidingPiece(attacker)) continue;
      
      const [fromX, fromY] = positionToCoordinates(attacker.position);
      
      // Check in all directions this piece can move
      const directions: [number, number][] = [];
      
      // Rook and Queen can move horizontally and vertically
      if (attacker.type === 'r' || attacker.type === 'q') {
        directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      }
      
      // Bishop and Queen can move diagonally
      if (attacker.type === 'b' || attacker.type === 'q') {
        directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
      }
      
      // Check each direction
      for (const [dx, dy] of directions) {
        let x = fromX + dx;
        let y = fromY + dy;
        let firstPiece: ChessPiece | null = null;
        let firstPiecePos: Position | null = null;
        
        while (x >= 0 && x < 8 && y >= 0 && y < 8) {
          const pos = coordinatesToPosition(x, y);
          const piece = board.getPiece(pos);
          
          if (piece) {
            if (!firstPiece) {
              // Found the first piece, must be opponent's
              if (piece.color === opponentColor) {
                firstPiece = piece;
                firstPiecePos = pos;
              } else {
                // Our piece blocks the line, no skewer possible
                break;
              }
            } else {
              // Found the second piece, must be opponent's and lower value
              if (piece.color === opponentColor && 
                  PIECE_VALUES[firstPiece.type] >= PIECE_VALUES[piece.type]) {
                // Valid skewer: first piece is of higher value and forced to move
                skewers.push({
                  piecePosition: attacker.position,
                  targetPosition: firstPiecePos!,
                  secondaryPosition: pos
                });
              }
              // Stop after finding the second piece
              break;
            }
          }
          
          x += dx;
          y += dy;
        }
      }
    }
    
    return skewers;
  }
  
  /**
   * Detects direct defenses on the board
   * A direct defense is when a piece moves to directly defend another piece that is under attack
   * @param color Player color
   * @param board Current board state
   * @returns Array of direct defenses
   */
  private detectDirectDefenses(color: PieceColor, board: Board): PositionalAdvantage[] {
    const defenses: PositionalAdvantage[] = [];
    const playerPieces = board.getPiecesByColor(color);
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // Check each player piece to see if it's under attack
    for (const defendedPiece of playerPieces) {
      // Skip low-value pieces
      if (defendedPiece.type === 'p') continue;
      
      // Check if the piece is under attack
      let isUnderAttack = false;
      let attackingPositions: Position[] = [];
      
      // Get all opponent pieces
      const opponentPieces = board.getPiecesByColor(opponentColor);
      for (const attacker of opponentPieces) {
        const attackedPositions = this.getAttackedPositions(attacker, board);
        if (attackedPositions.includes(defendedPiece.position)) {
          isUnderAttack = true;
          attackingPositions.push(attacker.position);
        }
      }
      
      // If the piece is under attack, check if any of our pieces are defending it
      if (isUnderAttack) {
        for (const defender of playerPieces) {
          // Skip the piece itself
          if (defender.position === defendedPiece.position) continue;
          
          // Check if this piece defends the attacked piece
          const attackedPositions = this.getAttackedPositions(defender, board);
          
          // Direct defense - can capture attacking piece
          for (const attackerPos of attackingPositions) {
            if (attackedPositions.includes(attackerPos)) {
              defenses.push({
                piecePosition: defender.position,
                targetPosition: defendedPiece.position,
                secondaryPosition: attackerPos
              });
              break;
            }
          }
          
          // Alternate form of defense - can block the attack
          // (This would require knowing the attack path, which is complex to calculate)
        }
      }
    }
    
    return defenses;
  }
  
  /**
   * Detects discovered attacks on the board
   * A discovered attack is when a piece moves out of the way, revealing an attack from another piece
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns Array of discovered attacks
   */
  private detectDiscoveredAttacks(color: PieceColor, board: Board, previousBoard: Board): PositionalAdvantage[] {
    const discoveredAttacks: PositionalAdvantage[] = [];
    const slidingPieces = board.getPiecesByColor(color).filter(piece => this.isSlidingPiece(piece));
    const opponentColor = color === 'white' ? 'black' : 'white';
    
    // For each sliding piece, check if it has any attacks now that it didn't have before
    for (const attacker of slidingPieces) {
      // Get current attacks from this piece
      const currentAttacks = this.getAttackedPositions(attacker, board)
        .filter(pos => {
          const piece = board.getPiece(pos);
          return piece && piece.color === opponentColor;
        });
      
      // Find the same piece in the previous board state
      const previousAttacker = previousBoard.getPiecesByColor(color)
        .find(p => p.type === attacker.type && p.position === attacker.position);
      
      // If the piece didn't exist in the previous board state, skip it
      if (!previousAttacker) continue;
      
      // Get previous attacks from this piece
      const previousAttacks = this.getAttackedPositions(previousAttacker, previousBoard)
        .filter(pos => {
          const piece = previousBoard.getPiece(pos);
          return piece && piece.color === opponentColor;
        });
      
      // Find new attacks that weren't possible before
      for (const attackPos of currentAttacks) {
        if (!previousAttacks.includes(attackPos)) {
          // This is a new attack that wasn't possible before
          // Check if there was a piece blocking the line of sight before
          const [fromX, fromY] = positionToCoordinates(attacker.position);
          const [toX, toY] = positionToCoordinates(attackPos);
          
          // Calculate direction vector
          const dx = toX > fromX ? 1 : toX < fromX ? -1 : 0;
          const dy = toY > fromY ? 1 : toY < fromY ? -1 : 0;
          
          // Iterate along the attack line in the previous board
          let x = fromX + dx;
          let y = fromY + dy;
          let discoveredPiecePos: Position | null = null;
          
          while (x !== toX || y !== toY) {
            const pos = coordinatesToPosition(x, y);
            const oldPiece = previousBoard.getPiece(pos);
            const newPiece = board.getPiece(pos);
            
            // If there was a piece here before but not now, it might be a discovered attack
            if (oldPiece && !newPiece) {
              discoveredPiecePos = pos;
              break;
            }
            
            x += dx;
            y += dy;
          }
          
          // If we found a piece that moved away, this is a discovered attack
          if (discoveredPiecePos) {
            discoveredAttacks.push({
              piecePosition: attacker.position,
              targetPosition: attackPos,
              secondaryPosition: discoveredPiecePos // The position where the piece moved from
            });
          }
        }
      }
    }
    
    return discoveredAttacks;
  }
  
  /**
   * Finds positional advantages that exist in the current state but not in the previous state
   * @param currentAdvantages Current positional advantages
   * @param previousAdvantages Previous positional advantages
   * @returns New positional advantages
   */
  private findNewPositionalAdvantages(
    currentAdvantages: PositionalAdvantage[],
    previousAdvantages: PositionalAdvantage[]
  ): PositionalAdvantage[] {
    return currentAdvantages.filter(current => 
      !previousAdvantages.some(previous => 
        this.arePositionalAdvantagesEqual(current, previous)
      )
    );
  }
  
  /**
   * Checks if two positional advantages are equal
   * @param a First positional advantage
   * @param b Second positional advantage
   * @returns Whether the advantages are equal
   */
  private arePositionalAdvantagesEqual(
    a: PositionalAdvantage,
    b: PositionalAdvantage
  ): boolean {
    // Check piece positions
    if (a.piecePosition !== b.piecePosition) {
      return false;
    }
    
    // Check target positions
    if (a.targetPosition && b.targetPosition) {
      if (a.targetPosition !== b.targetPosition) {
        return false;
      }
    } else if ((a.targetPosition && !b.targetPosition) || (!a.targetPosition && b.targetPosition)) {
      return false;
    }
    
    // Check target positions arrays
    if (a.targetPositions && b.targetPositions) {
      if (a.targetPositions.length !== b.targetPositions.length) {
        return false;
      }
      
      // Check if all positions in a are also in b
      for (const pos of a.targetPositions) {
        if (!b.targetPositions.includes(pos)) {
          return false;
        }
      }
    } else if ((a.targetPositions && !b.targetPositions) || (!a.targetPositions && b.targetPositions)) {
      return false;
    }
    
    // Check secondary positions
    if (a.secondaryPosition && b.secondaryPosition) {
      if (a.secondaryPosition !== b.secondaryPosition) {
        return false;
      }
    } else if ((a.secondaryPosition && !b.secondaryPosition) || (!a.secondaryPosition && b.secondaryPosition)) {
      return false;
    }
    
    return true;
  }
}

/**
 * Data structure for a pin (piece pinned to a more valuable piece)
 */
interface PinData {
  pinner: ChessPiece;
  pinnedPiece: ChessPiece;
  pinnedTo: ChessPiece;
}

/**
 * Data structure for a fork (piece attacking multiple opponent pieces)
 */
interface ForkData {
  forker: ChessPiece;
  forkedPieces: ChessPiece[];
}

/**
 * Data structure for a skewer (attacking a piece to reveal another behind it)
 */
interface SkewerData {
  attacker: ChessPiece;
  frontPiece: ChessPiece;
  backPiece: ChessPiece;
}

/**
 * Data structure for a direct defense
 */
interface DefenseData {
  defender: ChessPiece;
  defended: ChessPiece;
}

/**
 * Data structure for a discovered attack
 */
interface DiscoveredAttackData {
  moved: ChessPiece;
  attacker: ChessPiece;
  attacked: ChessPiece;
} 
