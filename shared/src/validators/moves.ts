import { Chess, Square, PieceSymbol } from 'chess.js';
import { BaseGameState, MoveAction, GameStatus } from '../types/game';
import { z } from 'zod';

/**
 * Zod schema for validating move input
 */
export const moveActionSchema = z.object({
  type: z.literal('MOVE'),
  from: z.string().length(2),
  to: z.string().length(2),
  promotion: z.enum(['n', 'b', 'r', 'q'] as [PieceSymbol, ...PieceSymbol[]]).optional()
});

/**
 * Validate if a move is legal in the current game state
 */
export function validateMove(
  gameState: BaseGameState,
  moveAction: MoveAction
): { valid: boolean; error?: string } {
  // Check if the game is in a state where moves are allowed
  if (gameState.gameStatus !== GameStatus.IN_PROGRESS) {
    return { 
      valid: false, 
      error: `Game is not in progress. Current status: ${gameState.gameStatus}`
    };
  }
  
  // Check if it's the player's turn
  const playerColor = moveAction.from.charAt(0) === 'w' ? 'w' : 'b';
  if (gameState.currentTurn !== playerColor) {
    return { 
      valid: false, 
      error: `Not ${playerColor}'s turn`
    };
  }
  
  // Get the piece at the 'from' square
  const piece = gameState.chess.get(moveAction.from as Square);
  if (!piece) {
    return { 
      valid: false, 
      error: `No piece at ${moveAction.from}`
    };
  }
  
  // Check if the piece belongs to the current player
  if (piece.color !== gameState.currentTurn) {
    return { 
      valid: false, 
      error: `Piece at ${moveAction.from} does not belong to ${gameState.currentTurn}`
    };
  }
  
  // Check if the move is valid according to chess rules
  const moves = gameState.chess.moves({ 
    square: moveAction.from as Square,
    verbose: true 
  });
  
  const isValidMove = moves.some(move => move.to === moveAction.to);
  if (!isValidMove) {
    return { 
      valid: false, 
      error: `Invalid move from ${moveAction.from} to ${moveAction.to}`
    };
  }
  
  // If it's a pawn promotion, check if promotion piece is provided
  const isPawnPromotion = piece.type === 'p' && 
    (moveAction.to.charAt(1) === '8' || moveAction.to.charAt(1) === '1');
  
  if (isPawnPromotion && !moveAction.promotion) {
    return { 
      valid: false, 
      error: 'Promotion piece must be specified for pawn promotion'
    };
  }
  
  return { valid: true };
}

/**
 * Check if a move would result in a capture (for duel initiation)
 */
export function wouldResultInCapture(
  chess: Chess,
  from: Square,
  to: Square
): boolean {
  const targetPiece = chess.get(to);
  return !!targetPiece; // If there's a piece at the target square, it would be a capture
}

/**
 * Check if a move would put the opponent in check
 */
export function wouldResultInCheck(
  chess: Chess,
  from: Square,
  to: Square
): boolean {
  // Clone the chess instance to test the move
  const tempChess = new Chess(chess.fen());
  
  // Try to make the move
  try {
    tempChess.move({ from, to });
    // If successful, check if the opponent is in check
    return tempChess.inCheck();
  } catch (e) {
    // If the move is invalid, it can't result in check
    return false;
  }
}

/**
 * Check if a move would result in checkmate
 */
export function wouldResultInCheckmate(
  chess: Chess,
  from: Square,
  to: Square
): boolean {
  // Clone the chess instance to test the move
  const tempChess = new Chess(chess.fen());
  
  // Try to make the move
  try {
    tempChess.move({ from, to });
    // If successful, check if the opponent is in checkmate
    return tempChess.isCheckmate();
  } catch (e) {
    // If the move is invalid, it can't result in checkmate
    return false;
  }
}