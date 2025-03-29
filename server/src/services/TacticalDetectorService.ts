import { 
  PieceColor, 
  Position, 
  PieceType, 
  ChessPiece, 
  PIECE_VALUES,
  isKingInCheck
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
      totalBpRegen += 1;
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
    const currentDiscoveredAttacks = this.detectDiscoveredAttacks(color, board);
    const previousDiscoveredAttacks = this.detectDiscoveredAttacks(color, previousBoard);
    
    // New discovered attacks = current discovered attacks - previous discovered attacks
    const newDiscoveredAttacks = this.findNewPositionalAdvantages(
      currentDiscoveredAttacks, 
      previousDiscoveredAttacks
    );
    
    // Calculate value based on the value of threatened pieces
    let bpRegen = 0;
    for (const attack of newDiscoveredAttacks) {
      if (attack.targetPosition) {
        const targetPiece = board.getPiece(attack.targetPosition);
        if (targetPiece) {
          bpRegen += Math.ceil(PIECE_VALUES[targetPiece.type] / 3);
        }
      }
    }
    
    return bpRegen;
  }
  
  /**
   * Checks if there is a new check (check created by the player's last move)
   * @param color Player color
   * @param board Current board state
   * @param previousBoard Previous board state
   * @returns True if there is a new check
   */
  private isNewCheck(
    color: PieceColor,
    board: Board,
    previousBoard: Board
  ): boolean {
    const opponentColor = color === 'white' ? 'black' : 'white';
    return board.isInCheck(opponentColor) && !previousBoard.isInCheck(opponentColor);
  }
  
  /**
   * Detects pins on the board
   * A pin is when a piece cannot move because it would expose a more valuable piece behind it
   * @param color Player color
   * @param board Current board state
   * @returns Array of pins
   */
  private detectPins(color: PieceColor, board: Board): PositionalAdvantage[] {
    // Implementation placeholder
    // This would detect pins by finding pieces that are between the attacker and a more valuable piece
    return [];
  }
  
  /**
   * Detects forks on the board
   * A fork is when a piece attacks two or more opponent pieces at once
   * @param color Player color
   * @param board Current board state
   * @returns Array of forks
   */
  private detectForks(color: PieceColor, board: Board): PositionalAdvantage[] {
    // Implementation placeholder
    // This would detect forks by finding pieces that attack multiple opponent pieces
    return [];
  }
  
  /**
   * Detects skewers on the board
   * A skewer is when a piece attacks a more valuable piece, forcing it to move and exposing a less valuable piece behind it
   * @param color Player color
   * @param board Current board state
   * @returns Array of skewers
   */
  private detectSkewers(color: PieceColor, board: Board): PositionalAdvantage[] {
    // Implementation placeholder
    // This would detect skewers by finding pieces that attack a valuable piece with a less valuable piece behind it
    return [];
  }
  
  /**
   * Detects direct defenses on the board
   * A direct defense is when a piece defends a friendly piece
   * @param color Player color
   * @param board Current board state
   * @returns Array of direct defenses
   */
  private detectDirectDefenses(color: PieceColor, board: Board): PositionalAdvantage[] {
    // Implementation placeholder
    // This would detect direct defenses by finding pieces that defend friendly pieces
    return [];
  }
  
  /**
   * Detects discovered attacks on the board
   * A discovered attack is when a piece moves away, revealing an attack from another piece behind it
   * @param color Player color
   * @param board Current board state
   * @returns Array of discovered attacks
   */
  private detectDiscoveredAttacks(color: PieceColor, board: Board): PositionalAdvantage[] {
    // Implementation placeholder
    // This would detect discovered attacks by comparing the current board with the previous board
    return [];
  }
  
  /**
   * Finds new positional advantages by comparing current and previous advantages
   * @param currentAdvantages Current positional advantages
   * @param previousAdvantages Previous positional advantages
   * @returns Array of new positional advantages
   */
  private findNewPositionalAdvantages(
    currentAdvantages: PositionalAdvantage[],
    previousAdvantages: PositionalAdvantage[]
  ): PositionalAdvantage[] {
    // This is a simple placeholder implementation
    // In a real implementation, we would need to compare advantages based on some unique identifier
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
   * @returns True if the advantages are equal
   */
  private arePositionalAdvantagesEqual(
    a: PositionalAdvantage,
    b: PositionalAdvantage
  ): boolean {
    // Basic comparison for equality
    if (a.piecePosition !== b.piecePosition) {
      return false;
    }
    
    if (a.targetPosition !== b.targetPosition) {
      return false;
    }
    
    if (a.secondaryPosition !== b.secondaryPosition) {
      return false;
    }
    
    // Compare target positions arrays
    if (a.targetPositions && b.targetPositions) {
      if (a.targetPositions.length !== b.targetPositions.length) {
        return false;
      }
      
      for (let i = 0; i < a.targetPositions.length; i++) {
        if (a.targetPositions[i] !== b.targetPositions[i]) {
          return false;
        }
      }
    } else if (a.targetPositions || b.targetPositions) {
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