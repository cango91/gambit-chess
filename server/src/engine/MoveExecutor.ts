import {
  MoveValidator,
  MoveType,
  Position,
  PlayerColor,
  PieceType,
  PieceDTO,
  GamePhase,
  GameState as SharedGameState,
  CheckDetection,
  Piece,
  Board
} from '@gambit-chess/shared';
import { GameState } from './GameState';
import { BPRegenerationService } from './BPRegenerationService';

/**
 * MoveExecutor service
 * Responsible for executing moves on the game state with proper validation
 */
export class MoveExecutor {
  constructor(private gameState: GameState) {}

  /**
   * Validate and execute a move
   * @param from Starting position
   * @param to Destination position
   * @param playerColor Color of the player making the move
   * @param promotionPiece Optional promotion piece type
   * @returns Object with success flag and move details
   */
  executeMove(
    from: Position,
    to: Position,
    playerColor: PlayerColor,
    promotionPiece?: PieceType
  ): {
    success: boolean;
    error?: string;
    moveType?: MoveType;
    capturedPiece?: PieceDTO;
    triggersDuel: boolean;
  } {
    // Get current game state
    const state = this.gameState.getState();
    
    // Check if game is already over
    if (this.gameState.isGameOver()) {
      return { success: false, error: 'Game is already over', triggersDuel: false };
    }
    
    // Check if it's the player's turn
    if (state.currentTurn !== playerColor) {
      return { success: false, error: 'Not your turn', triggersDuel: false };
    }
    
    // Check if game is in the correct phase
    if (state.gamePhase !== GamePhase.NORMAL_MOVE) {
      return { success: false, error: 'Invalid game phase for move', triggersDuel: false };
    }
    
    // Get the moving piece
    const movingPiece = this.gameState.findPieceAt(from);
    if (!movingPiece) {
      return { success: false, error: 'No piece at starting position', triggersDuel: false };
    }
    
    // Check if the piece belongs to the player
    if (movingPiece.color !== playerColor) {
      return { success: false, error: 'Cannot move opponent\'s piece', triggersDuel: false };
    }
    
    // Get the board for validation
    const board = this.gameState.getBoard();
    
    // Validate the move
    let moveType: MoveType;
    try {
      moveType = MoveValidator.validateMove(board, from, to);
    } catch (e) {
      return { 
        success: false, 
        error: e instanceof Error ? e.message : 'Invalid move', 
        triggersDuel: false 
      };
    }
    
    // Check if the move would put the player in check
    if (CheckDetection.wouldMoveResultInCheck(board, from, to, playerColor)) {
      return { success: false, error: 'Move would result in check', triggersDuel: false };
    }
    
    // Check for captured piece
    const targetPiece = this.gameState.findPieceAt(to);
    
    // If there's a capture, initiate a duel instead of completing the move
    if (moveType === MoveType.CAPTURE && targetPiece) {
      // Set up the duel in the game state
      const state = this.gameState.getState();
      
      // Create a pending duel
      this.gameState.setGamePhase(GamePhase.DUEL_ALLOCATION);
      
      // Return success but indicate a duel is triggered
      return {
        success: true,
        moveType,
        capturedPiece: targetPiece,
        triggersDuel: true
      };
    }
    
    // For non-capture moves, execute the move immediately
    this.executeNonCaptureMove(from, to, moveType, promotionPiece);
    
    // Return success
    return {
      success: true,
      moveType,
      triggersDuel: false
    };
  }
  
  /**
   * Execute a move that doesn't result in a capture
   * @param from Starting position
   * @param to Destination position
   * @param moveType Type of move
   * @param promotionPiece Promotion piece type (for pawn promotion)
   * @returns Result of the operation
   */
  private executeNonCaptureMove(
    from: Position,
    to: Position,
    moveType: MoveType,
    promotionPiece?: PieceType
  ): {
    success: boolean;
    error?: string;
    moveType: MoveType;
    triggersDuel: boolean;
  } {
    const state = this.gameState.getState();
    const pieces = [...state.pieces];
    
    const pieceIndex = pieces.findIndex(p => 
      p.position.x === from.x && p.position.y === from.y
    );
    
    if (pieceIndex === -1) {
      return { success: false, error: 'Piece not found', moveType, triggersDuel: false };
    }
    
    const movingPiece = pieces[pieceIndex];
    
    // Verify promotion data if this is a promotion move
    if (moveType === MoveType.PROMOTION) {
      // Validate that a promotion piece is provided
      if (!promotionPiece) {
        return { 
          success: false, 
          error: 'Promotion piece type required', 
          moveType, 
          triggersDuel: false 
        };
      }
      
      // Validate promotion piece type (can't promote to king or pawn)
      if (promotionPiece === PieceType.KING || promotionPiece === PieceType.PAWN) {
        return { 
          success: false, 
          error: 'Invalid promotion piece type', 
          moveType, 
          triggersDuel: false 
        };
      }
    }
    
    // Update the piece position and set hasMoved flag
    pieces[pieceIndex] = {
      ...pieces[pieceIndex],
      position: { ...to },
      hasMoved: true
    };
    
    // Handle castling (move the rook as well)
    if (moveType === MoveType.CASTLE) {
      this.handleCastling(from, to, pieces);
    }
    
    // Handle promotion
    let promotedPiece: PieceDTO | undefined;
    if (moveType === MoveType.PROMOTION && promotionPiece) {
      // Create the promoted piece (keeping the same ID and other properties)
      promotedPiece = {
        ...pieces[pieceIndex],
        type: promotionPiece
      };
      
      // Update the piece in the array
      pieces[pieceIndex] = promotedPiece;
    }
    
    // Update game state
    this.updateGameStateAfterMove(pieces, {
      from,
      to,
      type: moveType,
      piece: movingPiece,
      promotion: promotedPiece
    });
    
    return { 
      success: true, 
      moveType, 
      triggersDuel: false 
    };
  }
  
  /**
   * Handle castling move (update rook position)
   * @param from King's starting position
   * @param to King's destination position
   * @param pieces Current pieces array
   */
  private handleCastling(from: Position, to: Position, pieces: PieceDTO[]): void {
    // Determine if it's kingside or queenside castling
    const isKingside = to.x > from.x;
    const rank = from.y;
    
    // Find the rook
    const rookX = isKingside ? 7 : 0;
    const rookToX = isKingside ? to.x - 1 : to.x + 1;
    
    const rookIndex = pieces.findIndex(p => 
      p.type === PieceType.ROOK && 
      p.position.x === rookX && 
      p.position.y === rank
    );
    
    if (rookIndex === -1) {
      throw new Error('Rook not found for castling');
    }
    
    // Move the rook
    pieces[rookIndex] = {
      ...pieces[rookIndex],
      position: { x: rookToX, y: rank },
      hasMoved: true
    };
  }
  
  /**
   * Update the game state after a move is executed
   * @param updatedPieces Updated pieces array
   * @param moveDetails Details of the move
   */
  private updateGameStateAfterMove(
    updatedPieces: PieceDTO[],
    moveDetails: {
      from: Position;
      to: Position;
      type: MoveType;
      piece: PieceDTO;
      capturedPiece?: PieceDTO;
      promotion?: PieceDTO;
    }
  ): void {
    // Update the state with new pieces
    const state = this.gameState.getState();
    
    // Create a copy of the current state
    const newState = { ...state };
    
    // Update pieces
    newState.pieces = updatedPieces;
    
    // Add move to history
    newState.moveHistory = [
      ...newState.moveHistory,
      {
        from: moveDetails.from,
        to: moveDetails.to,
        piece: moveDetails.piece,
        capturedPiece: moveDetails.capturedPiece,
        type: moveDetails.type,
        promotion: moveDetails.promotion,
        whitePlayerBP: newState.whitePlayerBP,
        blackPlayerBP: newState.blackPlayerBP
      }
    ];
    
    // Update last move
    newState.lastMove = {
      from: moveDetails.from,
      to: moveDetails.to,
      type: moveDetails.type
    };
    
    // Switch turn to the other player
    this.gameState.switchTurn();
    
    // Update the board
    this.gameState.getBoard();
    
    // Check if the opponent is in check or checkmate
    const opponentColor = state.currentTurn === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
      
    if (this.gameState.isInCheck(opponentColor)) {
      // Check if it's checkmate
      const isCheckmate = this.isCheckmate(this.gameState.getBoard());
      
      if (isCheckmate) {
        this.gameState.setGameState(SharedGameState.CHECKMATE);
      } else {
        this.gameState.setGameState(SharedGameState.CHECK);
      }
    } else {
      // Check for stalemate
      const isStalemate = this.isStalemate(this.gameState.getBoard());
      
      if (isStalemate) {
        this.gameState.setGameState(SharedGameState.STALEMATE);
      } else {
        this.gameState.setGameState(SharedGameState.ACTIVE);
      }
    }
    
    // Calculate and apply BP regeneration
    this.applyBPRegeneration(moveDetails.piece, moveDetails.type, moveDetails.from, moveDetails.to, state.currentTurn);
  }
  
  /**
   * Check if a player is in checkmate
   * @param board The board to check
   * @returns True if the current player is in checkmate
   */
  private isCheckmate(board: Board): boolean {
    const state = this.gameState.getState();
    const currentPlayer = state.currentTurn;
    
    // If the player is not in check, they can't be in checkmate
    if (!CheckDetection.isInCheck(board, currentPlayer)) {
      return false;
    }
    
    // Check if any move can get the player out of check
    return this.hasNoLegalMoves(board, currentPlayer);
  }
  
  /**
   * Check if a player is in stalemate
   * @param board The board to check
   * @returns True if the current player is in stalemate
   */
  private isStalemate(board: Board): boolean {
    const state = this.gameState.getState();
    const currentPlayer = state.currentTurn;
    
    // If the player is in check, it's not stalemate
    if (CheckDetection.isInCheck(board, currentPlayer)) {
      return false;
    }
    
    // Check if any move is legal
    return this.hasNoLegalMoves(board, currentPlayer);
  }
  
  /**
   * Check if a player has no legal moves
   * @param board The board to check
   * @param player The player to check
   * @returns True if the player has no legal moves
   */
  private hasNoLegalMoves(board: Board, player: PlayerColor): boolean {
    const pieces = board.getPieces().filter((p: Piece) => p.color === player);
    
    // Check if any piece has a legal move
    for (const piece of pieces) {
      // Get all potential destinations for this piece
      const potentialMoves = this.getPotentialMoves(board, piece);
      
      // Try each move to see if it avoids check
      for (const to of potentialMoves) {
        try {
          // Check if this move would result in check
          const wouldBeInCheck = CheckDetection.wouldMoveResultInCheck(
            board, piece.position, to, player
          );
          
          if (!wouldBeInCheck) {
            // Found a legal move
            return false;
          }
        } catch (e) {
          // If move validation failed, continue to next move
          continue;
        }
      }
    }
    
    // No legal moves found
    return true;
  }
  
  /**
   * Get all potential moves for a piece
   * @param board The board
   * @param piece The piece to check
   * @returns Array of potential destination positions
   */
  private getPotentialMoves(board: Board, piece: Piece): Position[] {
    const positions: Position[] = [];
    
    // Check all squares on the board
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const to = { x, y };
        
        // Skip squares occupied by pieces of the same color
        const destPiece = board.getPieceAt(to);
        if (destPiece && destPiece.color === piece.color) {
          continue;
        }
        
        try {
          // Try to validate the move
          MoveValidator.validateMove(board, piece.position, to);
          
          // If we got here, the move is valid according to piece movement rules
          positions.push(to);
        } catch (e) {
          // Invalid move, ignore
          continue;
        }
      }
    }
    
    return positions;
  }
  
  /**
   * Calculate and apply BP regeneration after a move
   * @param piece The piece that moved
   * @param moveType The type of move
   * @param from Starting position
   * @param to Destination position
   * @param playerColor Color of the player whose turn it is
   */
  private applyBPRegeneration(
    piece: PieceDTO,
    moveType: MoveType,
    from: Position,
    to: Position,
    playerColor: PlayerColor
  ): void {
    // Create BP regeneration service to calculate regeneration
    const bpRegenerationService = new BPRegenerationService(this.gameState);
    
    // Calculate regeneration amount
    const regeneration = bpRegenerationService.calculateRegeneration(
      from,
      to,
      moveType,
      piece
    );
    
    // Add regeneration to the player's pending BP regeneration
    this.gameState.addPendingBPRegeneration(playerColor, regeneration);
  }
} 