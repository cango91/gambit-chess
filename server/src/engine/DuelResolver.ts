import {
  DuelOutcome,
  PlayerColor,
  DuelRules,
  GamePhase,
  PieceDTO,
  Position,
  TacticalRetreatRules,
  GameState as SharedGameState,
  MoveType,
  Piece,
  RetreatOption,
  CheckDetection,
  MoveValidator,
  Board
} from '@gambit-chess/shared';
import { GameState } from './GameState';

/**
 * DuelResolver service
 * Responsible for resolving duels between pieces
 */
export class DuelResolver {
  constructor(private gameState: GameState) {}

  /**
   * Allocate BP for a player in a duel
   * @param playerColor Color of the player allocating BP
   * @param amount Amount of BP to allocate
   * @returns Object with success flag and error message if applicable
   */
  allocateBP(
    playerColor: PlayerColor,
    amount: number
  ): {
    success: boolean;
    error?: string;
  } {
    // Get current game state
    const state = this.gameState.getState();
    
    // Check if game is in duel allocation phase
    if (state.gamePhase !== GamePhase.DUEL_ALLOCATION) {
      return { success: false, error: 'Not in duel allocation phase' };
    }
    
    // Ensure there's a pending duel
    if (!state.pendingDuel) {
      return { success: false, error: 'No pending duel' };
    }
    
    // Determine if this player is the attacker or defender
    const { attackerPiece, defenderPiece } = state.pendingDuel;
    const isAttacker = attackerPiece.color === playerColor;
    const isDefender = defenderPiece.color === playerColor;
    
    if (!isAttacker && !isDefender) {
      return { success: false, error: 'Not a participant in this duel' };
    }
    
    // Get the piece type and current BP pool
    const pieceType = isAttacker ? attackerPiece.type : defenderPiece.type;
    const currentBP = this.gameState.getPlayerBP(playerColor);
    
    // Validate the allocation
    if (!DuelRules.isValidAllocation(pieceType, amount, currentBP)) {
      return { success: false, error: 'Invalid BP allocation' };
    }
    
    // Calculate the actual BP cost (doubles if exceeding capacity)
    const bpCost = DuelRules.calculateBPCost(pieceType, amount);
    
    // Record the allocation in the pending duel
    if (state.pendingDuel) {
      if (playerColor === PlayerColor.WHITE) {
        state.pendingDuel.whiteAllocation = amount;
      } else {
        state.pendingDuel.blackAllocation = amount;
      }
    }
    
    // Deduct BP from the player's pool
    this.gameState.addPlayerBP(playerColor, -bpCost);
    
    // Check if both players have allocated BP
    if (state.pendingDuel && 
        state.pendingDuel.whiteAllocation !== undefined && 
        state.pendingDuel.blackAllocation !== undefined) {
      // Resolve the duel once both players have allocated
      this.resolveDuel();
    }
    
    return { success: true };
  }

  /**
   * Resolve a duel after both players have allocated BP
   */
  private resolveDuel(): void {
    const state = this.gameState.getState();
    
    if (!state.pendingDuel) {
      throw new Error('No pending duel to resolve');
    }
    
    const { 
      attackerPiece, 
      defenderPiece, 
      whiteAllocation, 
      blackAllocation,
      from,
      to
    } = state.pendingDuel;
    
    if (whiteAllocation === undefined || blackAllocation === undefined) {
      throw new Error('Missing BP allocation');
    }
    
    // Determine attacker and defender allocations
    const attackerAllocation = attackerPiece.color === PlayerColor.WHITE 
      ? whiteAllocation 
      : blackAllocation;
      
    const defenderAllocation = defenderPiece.color === PlayerColor.WHITE
      ? whiteAllocation
      : blackAllocation;
    
    // Determine the outcome
    let outcome: DuelOutcome;
    
    if (attackerAllocation > defenderAllocation) {
      outcome = DuelOutcome.ATTACKER_WINS;
    } else if (defenderAllocation > attackerAllocation) {
      outcome = DuelOutcome.DEFENDER_WINS;
    } else {
      outcome = DuelOutcome.TIE;
    }
    
    // Add the duel outcome to the move history
    const moveHistoryEntry = {
      from,
      to,
      piece: attackerPiece,
      capturedPiece: outcome === DuelOutcome.ATTACKER_WINS ? defenderPiece : undefined,
      type: outcome === DuelOutcome.ATTACKER_WINS ? MoveType.CAPTURE : MoveType.NORMAL,
      duelOutcome: outcome,
      whiteBPSpent: whiteAllocation,
      blackBPSpent: blackAllocation,
      whitePlayerBP: state.whitePlayerBP,
      blackPlayerBP: state.blackPlayerBP
    };
    
    const newMoveHistory = [...state.moveHistory, moveHistoryEntry];
    
    // Handle the outcome
    if (outcome === DuelOutcome.ATTACKER_WINS) {
      this.handleAttackerWins(newMoveHistory);
    } else {
      this.handleDefenderWins();
    }
  }

  /**
   * Handle the case where the attacker wins the duel
   * @param newMoveHistory Updated move history to apply
   */
  private handleAttackerWins(newMoveHistory: any[]): void {
    const state = this.gameState.getState();
    
    if (!state.pendingDuel) {
      throw new Error('No pending duel');
    }
    
    const { attackerPiece, defenderPiece, from, to } = state.pendingDuel;
    
    // Create updated pieces array
    const newPieces = [...state.pieces];
    
    // Find the attacker and defender indices
    const attackerIndex = newPieces.findIndex(p => p.id === attackerPiece.id);
    const defenderIndex = newPieces.findIndex(p => p.id === defenderPiece.id);
    
    if (attackerIndex === -1 || defenderIndex === -1) {
      throw new Error('Piece not found');
    }
    
    // Add the defender to captured pieces
    const newCapturedPieces = [...state.capturedPieces, defenderPiece];
    
    // Update the attacker position
    newPieces[attackerIndex] = {
      ...newPieces[attackerIndex],
      position: { ...to },
      hasMoved: true
    };
    
    // Remove the defender
    newPieces.splice(defenderIndex, 1);
    
    // Update the state through methods instead of direct assignment
    this.updateGameState(newPieces, newCapturedPieces, {
      from,
      to,
      type: MoveType.CAPTURE
    }, newMoveHistory);
    
    // Clear the pending duel
    this.clearPendingDuel();
    
    // Change phase back to normal move
    this.gameState.setGamePhase(GamePhase.NORMAL_MOVE);
    
    // Update the board
    this.gameState.getBoard();
    
    // Switch turn
    this.gameState.switchTurn();
    
    // Check if the opponent is in check or checkmate
    const opponentColor = attackerPiece.color === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
      
    if (this.gameState.isInCheck(opponentColor)) {
      // Check if it's checkmate
      if (this.isCheckmate(this.gameState.getBoard())) {
        this.gameState.setGameState(SharedGameState.CHECKMATE);
      } else {
        this.gameState.setGameState(SharedGameState.CHECK);
      }
    } else {
      // Check for stalemate
      if (this.isStalemate(this.gameState.getBoard())) {
        this.gameState.setGameState(SharedGameState.STALEMATE);
      } else {
        this.gameState.setGameState(SharedGameState.ACTIVE);
      }
    }
  }

  /**
   * Handle the case where the defender wins the duel or it's a tie
   * (which counts as defender win)
   */
  private handleDefenderWins(): void {
    const state = this.gameState.getState();
    
    if (!state.pendingDuel) {
      throw new Error('No pending duel');
    }
    
    const { attackerPiece, defenderPiece, from, to } = state.pendingDuel;
    
    // Check if tactical retreat is available
    const canRetreat = DuelRules.canPerformTacticalRetreat(attackerPiece.type);
    
    if (canRetreat) {
      // Set up tactical retreat
      const retreatOptions = TacticalRetreatRules.getValidRetreats(
        attackerPiece.type,
        from,
        to,
        attackerPiece.hasMoved
      );
      
      // Change phase to tactical retreat
      this.gameState.setGamePhase(GamePhase.TACTICAL_RETREAT);
      
      // Store retreat options in state using a helper method
      this.setupTacticalRetreat(attackerPiece, from, to, retreatOptions);
    } else {
      // No retreat available, return piece to original position
      const newPieces = [...state.pieces];
      const attackerIndex = newPieces.findIndex(p => p.id === attackerPiece.id);
      
      if (attackerIndex === -1) {
        throw new Error('Attacker piece not found');
      }
      
      // Update the attacker position back to original
      newPieces[attackerIndex] = {
        ...newPieces[attackerIndex],
        position: { ...from }
      };
      
      // Update the state through a helper method
      this.updatePieces(newPieces);
      
      // Clear the pending duel
      this.clearPendingDuel();
      
      // Change phase back to normal move
      this.gameState.setGamePhase(GamePhase.NORMAL_MOVE);
      
      // Update the board
      this.gameState.getBoard();
      
      // Switch turn
      this.gameState.switchTurn();
    }
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
   * Helper method to update game state pieces
   * @param pieces Updated pieces array
   */
  private updatePieces(pieces: PieceDTO[]): void {
    // TODO: Implement a method in GameState to update pieces
    // For now, this is a placeholder
  }

  /**
   * Helper method to clear pending duel
   */
  private clearPendingDuel(): void {
    // TODO: Implement a method in GameState to clear pending duel
    // For now, this is a placeholder
  }

  /**
   * Helper method to setup tactical retreat
   */
  private setupTacticalRetreat(
    piece: PieceDTO, 
    originalPosition: Position, 
    failedCapturePosition: Position, 
    retreatOptions: { position: Position; bpCost: number; }[]
  ): void {
    this.gameState.setupTacticalRetreat(piece, originalPosition, failedCapturePosition, retreatOptions);
  }

  /**
   * Helper method to update full game state
   */
  private updateGameState(
    pieces: PieceDTO[],
    capturedPieces: PieceDTO[],
    lastMove: {
      from: Position;
      to: Position;
      type: MoveType;
    },
    moveHistory: any[]
  ): void {
    // Update the pieces
    this.gameState.updatePieces(pieces);
    
    // Check for checkmate or stalemate
    if (this.isCheckmate(this.gameState.getBoard())) {
      this.gameState.setGameState(SharedGameState.CHECKMATE);
    } else if (this.isStalemate(this.gameState.getBoard())) {
      this.gameState.setGameState(SharedGameState.STALEMATE);
    }
  }

  /**
   * Update game state after duel resolution
   * @param updatedPieces Updated pieces array after duel
   */
  private updateGameStateAfterDuel(updatedPieces: PieceDTO[]): void {
    // Update pieces in the game state
    this.gameState.updatePieces(updatedPieces);
    
    // Clear pending duel
    this.gameState.clearPendingDuel();
    
    // Check for checkmate or stalemate
    if (this.isCheckmate(this.gameState.getBoard())) {
      this.gameState.setGameState(SharedGameState.CHECKMATE);
    } else if (this.isStalemate(this.gameState.getBoard())) {
      this.gameState.setGameState(SharedGameState.STALEMATE);
    }
  }
} 