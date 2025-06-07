import { Chess, Move } from 'chess.js';
import { BaseGameState, GameAction, MoveAction } from '@gambit-chess/shared';
import { PieceSymbol } from 'chess.js';

/**
 * Simple AI Service for Gambit Chess
 * Provides basic AI opponents with different difficulty levels
 */
export class AIService {
  
  /**
   * Generate an AI move based on difficulty level
   */
  static generateAIMove(gameState: BaseGameState, difficulty: 'easy' | 'medium' | 'hard' = 'easy'): GameAction | null {
    switch (difficulty) {
      case 'easy':
        return this.generateRandomMove(gameState);
      case 'medium':
        return this.generateSmartMove(gameState);
      case 'hard':
        return this.generateAdvancedMove(gameState);
      default:
        return this.generateRandomMove(gameState);
    }
  }
  
  /**
   * Easy AI: Random legal moves
   */
  private static generateRandomMove(gameState: BaseGameState): MoveAction | null {
    const possibleMoves = gameState.chess.moves({ verbose: true });
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    
    return {
      type: 'MOVE',
      from: randomMove.from,
      to: randomMove.to,
      promotion: randomMove.promotion
    };
  }
  
  /**
   * Medium AI: Prefers captures and checks
   */
  private static generateSmartMove(gameState: BaseGameState): MoveAction | null {
    const possibleMoves = gameState.chess.moves({ verbose: true });
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    // Prioritize captures
    const captures = possibleMoves.filter(move => move.captured);
    if (captures.length > 0) {
      const randomCapture = captures[Math.floor(Math.random() * captures.length)];
      return {
        type: 'MOVE',
        from: randomCapture.from,
        to: randomCapture.to,
        promotion: randomCapture.promotion
      };
    }
    
    // Then prioritize checks
    const checks = possibleMoves.filter(move => {
      const chessCopy = new Chess(gameState.chess.fen());
      chessCopy.move(move);
      return chessCopy.inCheck();
    });
    
    if (checks.length > 0) {
      const randomCheck = checks[Math.floor(Math.random() * checks.length)];
      return {
        type: 'MOVE',
        from: randomCheck.from,
        to: randomCheck.to,
        promotion: randomCheck.promotion
      };
    }
    
    // Default to random move
    return this.generateRandomMove(gameState);
  }
  
  /**
   * Hard AI: Basic position evaluation + tactics
   */
  private static generateAdvancedMove(gameState: BaseGameState): MoveAction | null {
    const possibleMoves = gameState.chess.moves({ verbose: true });
    
    if (possibleMoves.length === 0) {
      return null;
    }
    
    let bestMove = possibleMoves[0];
    let bestScore = -Infinity;
    
    for (const move of possibleMoves) {
      const score = this.evaluateMove(gameState, move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return {
      type: 'MOVE',
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion
    };
  }
  
  /**
   * Simple move evaluation function
   */
  private static evaluateMove(gameState: BaseGameState, move: Move): number {
    let score = 0;
    
    // Use piece values from game configuration instead of hardcoded values
    const pieceValues = gameState.config.pieceValues;
    
    // Bonus for captures
    if (move.captured) {
      score += pieceValues[move.captured.toLowerCase() as PieceSymbol] * 10;
    }
    
    // Bonus for checks
    const chessCopy = new Chess(gameState.chess.fen());
    chessCopy.move(move);
    if (chessCopy.inCheck()) {
      score += 5;
    }
    
    // Bonus for castling
    if (move.flags.includes('k') || move.flags.includes('q')) {
      score += 3;
    }
    
    // Bonus for center control
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    if (centerSquares.includes(move.to)) {
      score += 2;
    }
    
    // Penalty for moving into attacks
    if (chessCopy.isAttacked(move.to, chessCopy.turn() === 'w' ? 'b' : 'w')) {
      score -= 3;
    }
    
    return score + Math.random() * 0.5; // Add small randomness
  }
  
  /**
   * Generate AI duel allocation based on piece values and battle points
   */
  static generateAIDuelAllocation(
    gameState: BaseGameState,
    availableBP: number,
    isAttacker: boolean,
    difficulty: 'easy' | 'medium' | 'hard' = 'easy'
  ): number {
    switch (difficulty) {
      case 'easy':
        // Random allocation between 0 and available BP
        return Math.floor(Math.random() * (availableBP + 1));
      
      case 'medium':
        // Allocate based on piece value with some randomness
        const moderateAllocation = Math.min(
          Math.floor(availableBP * (0.3 + Math.random() * 0.4)),
          availableBP
        );
        return moderateAllocation;
      
      case 'hard':
        // Smart allocation based on position and piece values
        if (isAttacker) {
          // As attacker, be more aggressive if we have an advantage
          const aggressiveAllocation = Math.min(
            Math.floor(availableBP * (0.5 + Math.random() * 0.3)),
            availableBP
          );
          return aggressiveAllocation;
        } else {
          // As defender, be more conservative
          const conservativeAllocation = Math.min(
            Math.floor(availableBP * (0.2 + Math.random() * 0.4)),
            availableBP
          );
          return conservativeAllocation;
        }
      
      default:
        return Math.floor(Math.random() * (availableBP + 1));
    }
  }
}

export default AIService; 