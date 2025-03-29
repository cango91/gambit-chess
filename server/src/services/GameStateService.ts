import { 
  GamePhase, 
  PieceColor, 
  GameResult, 
  Position, 
  ChessPiece,
  Move,
  GameStateDTO,
  PieceType,
  isKingInCheck,
  RetreatOptionsDTO
} from '@gambit-chess/shared';
import { Board } from '../models/Board';
import { BPManager } from './BPManager';
import { TacticalRetreatService } from './TacticalRetreatService';

/**
 * Service for managing game state and progression
 */
export class GameStateService {
  private gameId: string;
  private board: Board;
  private bpManager: BPManager;
  private tacticalRetreatService: TacticalRetreatService;
  private currentPhase: GamePhase = GamePhase.NORMAL;
  private gameResult: GameResult | null = null;
  private moveHistory: Move[] = [];
  private playerToMove: PieceColor = 'white';
  private sequenceNumber: number = 0;
  private whiteTimeRemaining: number = 0;
  private blackTimeRemaining: number = 0;
  private activeTimer: PieceColor | null = null;
  
  /**
   * Creates a new game state service
   * 
   * @param gameId Unique game identifier
   * @param bpManager Battle Points manager
   * @param tacticalRetreatService Tactical retreat service
   * @param initialTimeMsWhite Initial time for white in milliseconds
   * @param initialTimeMsBlack Initial time for black in milliseconds
   */
  constructor(
    gameId: string,
    bpManager: BPManager,
    tacticalRetreatService: TacticalRetreatService,
    initialTimeMsWhite: number = 0,
    initialTimeMsBlack: number = 0
  ) {
    this.gameId = gameId;
    this.board = new Board();
    this.bpManager = bpManager;
    this.tacticalRetreatService = tacticalRetreatService;
    
    // Initialize timers if time control is enabled
    this.whiteTimeRemaining = initialTimeMsWhite;
    this.blackTimeRemaining = initialTimeMsBlack;
    
    // Only start timer if time control is enabled
    if (initialTimeMsWhite > 0 && initialTimeMsBlack > 0) {
      this.activeTimer = 'white'; // White goes first
    }
  }
  
  /**
   * Gets the current game state
   * 
   * @returns Current game state
   */
  public getGameState(): {
    gameId: string;
    board: Board;
    currentPhase: GamePhase;
    playerToMove: PieceColor;
    gameResult: GameResult | null;
    moveHistory: Move[];
  } {
    return {
      gameId: this.gameId,
      board: this.board,
      currentPhase: this.currentPhase,
      playerToMove: this.playerToMove,
      gameResult: this.gameResult,
      moveHistory: this.moveHistory
    };
  }
  
  /**
   * Creates a filtered game state DTO for a specific player
   * Filters hidden information according to information architecture rules
   * 
   * @param forPlayer Player to create DTO for (null for spectator view)
   * @returns Filtered game state DTO
   */
  public createGameStateDTO(forPlayer: PieceColor | null = null): GameStateDTO {
    // Increment sequence number for state reconciliation
    this.sequenceNumber++;
    
    // Base game state information visible to all
    const stateDTO: GameStateDTO = {
      gameId: this.gameId,
      phase: this.currentPhase,
      turn: this.playerToMove,
      pieces: this.board.getAllPieces(),
      moveNumber: this.moveHistory.length,
      inCheck: this.isInCheck(),
      whiteTimeRemaining: this.whiteTimeRemaining,
      blackTimeRemaining: this.blackTimeRemaining,
      activeTimer: this.activeTimer,
      sequence: this.sequenceNumber,
      timestamp: Date.now(),
      players: [], // TODO: Implement player tracking
      spectators: [] // TODO: Implement spectator tracking
    };
    
    // Add player-specific information
    if (forPlayer) {
      stateDTO.bp = this.bpManager.getBpPool(forPlayer);
    }
    
    return stateDTO;
  }
  
  /**
   * Creates retreat options DTO for the player
   * 
   * @returns Retreat options DTO or null if no retreat options available
   */
  public createRetreatOptionsDTO(): RetreatOptionsDTO | null {
    if (this.currentPhase !== GamePhase.TACTICAL_RETREAT) {
      return null;
    }
    
    const retreatOptions = this.board.getRetreatOptions();
    const captureAttempt = this.board.getLastCaptureAttempt();
    
    if (!retreatOptions || !captureAttempt) {
      return null;
    }
    
    // Extract position and cost arrays from retreat options
    const validPositions: Position[] = [];
    const costs: number[] = [];
    
    for (const option of retreatOptions) {
      validPositions.push(option.to);
      costs.push(option.cost);
    }
    
    return {
      gameId: this.gameId,
      piece: captureAttempt.from,
      validPositions,
      costs
    };
  }
  
  /**
   * Updates the game phase
   * 
   * @param phase New game phase
   */
  public updateGamePhase(phase: GamePhase): void {
    this.currentPhase = phase;
  }
  
  /**
   * Processes a move attempt
   * 
   * @param from Starting position
   * @param to Destination position
   * @param playerColor Color of the player making the move
   * @returns Result of the move attempt
   */
  public processMove(
    from: Position,
    to: Position,
    playerColor: PieceColor
  ): {
    success: boolean;
    error?: string;
    isCapture?: boolean;
    capturedPiece?: ChessPiece;
    checkDetected?: boolean;
  } {
    // Check if it's the player's turn
    if (playerColor !== this.playerToMove) {
      return { success: false, error: 'Not your turn' };
    }
    
    // Check if we're in the correct game phase
    if (this.currentPhase !== GamePhase.NORMAL) {
      return { success: false, error: 'Cannot move in current game phase' };
    }
    
    // Check if the move is valid
    if (!this.board.isValidMove(from, to)) {
      return { success: false, error: 'Invalid move' };
    }
    
    // Check if this would be a capture
    const targetPiece = this.board.getPiece(to);
    const isCapture = !!targetPiece;
    
    if (isCapture) {
      // For captures, transition to duel allocation phase
      this.board.transitionToDuel(playerColor, from, to);
      this.currentPhase = GamePhase.DUEL_ALLOCATION;
      
      return { 
        success: true, 
        isCapture: true
      };
    } else {
      // For normal moves, update the board immediately
      
      // Store the current board state for tactical advantage detection
      this.board.storeBoardState();
      
      // Make the move
      const moveResult = this.board.makeMove(from, to);
      
      // Update game state
      if (moveResult.success) {
        // Add to move history
        this.moveHistory.push({
          from,
          to,
          piece: this.board.getPiece(to)?.type || 'p', // Fallback to pawn if type not found
          check: moveResult.check,
          checkmate: false, // Will be updated below if applicable
          turnNumber: this.board.getCurrentTurn()
        });
        
        // Update player to move
        this.switchPlayerToMove();
        
        // Check for game termination conditions
        const opponentColor = playerColor === 'white' ? 'black' : 'white';
        
        // Use the board's checkmate detection
        if (moveResult.check && this.board.isCheckmate(opponentColor)) {
          this.gameResult = playerColor === 'white' ? GameResult.WHITE_WIN : GameResult.BLACK_WIN;
          this.currentPhase = GamePhase.GAME_OVER;
          
          // Update the move history with checkmate flag
          if (this.moveHistory.length > 0) {
            this.moveHistory[this.moveHistory.length - 1].checkmate = true;
          }
        }
        
        // Check for draw conditions
        if (this.board.isStalemate(opponentColor) || 
            this.board.isInsufficientMaterial() || 
            this.board.isFiftyMoveRule() || 
            this.board.isThreefoldRepetition()) {
          this.gameResult = GameResult.DRAW;
          this.currentPhase = GamePhase.GAME_OVER;
        }
        
        // Regenerate BP for the player who made the move
        const previousBoard = this.board.getPreviousBoardState();
        if (previousBoard) {
          this.bpManager.regenerateBP(playerColor, this.board, previousBoard);
        }
      }
      
      return {
        success: moveResult.success,
        checkDetected: moveResult.check,
        error: moveResult.success ? undefined : 'Move could not be executed'
      };
    }
  }
  
  /**
   * Processes a duel allocation
   * 
   * @param playerColor Color of the player making the allocation
   * @param allocation Amount of BP allocated
   * @returns Whether the allocation was successful
   */
  public processDuelAllocation(
    playerColor: PieceColor,
    allocation: number
  ): boolean {
    if (this.currentPhase !== GamePhase.DUEL_ALLOCATION) {
      return false;
    }
    
    // Check if player has enough BP
    if (!this.bpManager.hasEnoughBP(playerColor, allocation)) {
      return false;
    }
    
    // Record the allocation
    this.board.recordDuelAllocation(playerColor, allocation);
    
    // Deduct BP from player's pool
    this.bpManager.allocateBP(playerColor, allocation);
    
    return true;
  }
  
  /**
   * Resolves the current duel after both players have allocated BP
   * 
   * @returns Outcome of the duel
   */
  public resolveDuel(): {
    success: boolean;
    attackerWon: boolean;
    attackerAllocation: number;
    defenderAllocation: number;
  } {
    if (this.currentPhase !== GamePhase.DUEL_ALLOCATION) {
      return { 
        success: false, 
        attackerWon: false,
        attackerAllocation: 0,
        defenderAllocation: 0
      };
    }
    
    // Store board state before duel resolution for tactical detection
    this.board.storeBoardState();
    
    // Resolve the duel
    const outcome = this.board.resolveDuel();
    const duel = this.board.getActiveDuel();
    
    if (!duel) {
      return { 
        success: false, 
        attackerWon: false,
        attackerAllocation: 0,
        defenderAllocation: 0
      };
    }
    
    // Check if the game phase changed to tactical retreat
    if (this.board.getCurrentPhase() === GamePhase.TACTICAL_RETREAT) {
      this.currentPhase = GamePhase.TACTICAL_RETREAT;
      
      // Calculate retreat options for the attacker
      const captureAttempt = this.board.getLastCaptureAttempt();
      if (captureAttempt) {
        const { from, to } = captureAttempt;
        const piece = this.board.getPiece(from);
        
        if (piece) {
          const retreatOptions = this.tacticalRetreatService.calculateRetreatOptions(
            this.board,
            from
          );
          
          // Set retreat options on the board
          this.board.setRetreatOptions(retreatOptions);
        }
      }
    } else if (outcome === 'success') {
      // If attacker won, switch player to move
      this.switchPlayerToMove();
      
      // Regenerate BP for the attacker
      const previousBoard = this.board.getPreviousBoardState();
      if (previousBoard && duel.attacker) {
        this.bpManager.regenerateBP(duel.attacker, this.board, previousBoard);
      }
      
      // Update phase back to normal
      this.currentPhase = GamePhase.NORMAL;
      
      // Check for check or checkmate
      if (this.isInCheck()) {
        const opponentColor = duel.attacker === 'white' ? 'black' : 'white';
        // TODO: Implement checkmate detection
      }
    }
    
    return {
      success: true,
      attackerWon: outcome === 'success',
      attackerAllocation: duel.attackerAllocation,
      defenderAllocation: duel.defenderAllocation
    };
  }
  
  /**
   * Processes a tactical retreat selection
   * 
   * @param position Position to retreat to
   * @param playerColor Color of the player selecting the retreat
   * @returns Whether the retreat was successful
   */
  public processRetreat(
    playerColor: PieceColor,
    position: Position
  ): boolean {
    // Check game phase
    if (this.currentPhase !== GamePhase.TACTICAL_RETREAT) {
      return false;
    }
    
    // Check if it's the player's turn
    if (playerColor !== this.playerToMove) {
      return false;
    }
    
    // Get retreat options
    const retreatOptions = this.board.getRetreatOptions();
    if (!retreatOptions) {
      return false;
    }
    
    // Validate retreat position
    if (!this.tacticalRetreatService.isValidRetreatPosition(retreatOptions, position)) {
      return false;
    }
    
    // Get the BP cost for this retreat
    const cost = this.tacticalRetreatService.getRetreatCost(retreatOptions, position);
    if (cost === undefined) {
      return false;
    }
    
    // Check if player has enough BP for this retreat
    if (!this.bpManager.hasEnoughBP(playerColor, cost)) {
      return false;
    }
    
    // Deduct BP for the retreat
    this.bpManager.allocateBP(playerColor, cost);
    
    // Execute the retreat
    this.board.executeRetreat(position);
    
    // Switch player to move
    this.switchPlayerToMove();
    
    // Update game phase back to normal
    this.currentPhase = GamePhase.NORMAL;
    
    return true;
  }
  
  /**
   * Processes a tactical retreat with extended return information
   * @param playerColor Color of the player selecting the retreat
   * @param retreatPosition Position to retreat to
   * @returns Result including BP cost of the retreat
   */
  public processRetreatWithDetails(
    playerColor: PieceColor,
    retreatPosition: Position
  ): { success: boolean; cost?: number } {
    // Get retreat options
    const retreatOptions = this.board.getRetreatOptions();
    if (!retreatOptions) {
      return { success: false };
    }
    
    // Validate retreat position
    if (!this.tacticalRetreatService.isValidRetreatPosition(retreatOptions, retreatPosition)) {
      return { success: false };
    }
    
    // Get the BP cost for this retreat
    const cost = this.tacticalRetreatService.getRetreatCost(retreatOptions, retreatPosition);
    if (cost === undefined) {
      return { success: false };
    }
    
    // Execute the retreat using the existing method
    const success = this.processRetreat(playerColor, retreatPosition);
    
    return { success, cost };
  }
  
  /**
   * Checks if a player's king is in check
   * @param color Optional player color (defaults to current player)
   * @returns Whether the king is in check
   */
  public isInCheck(color?: PieceColor): boolean {
    const colorToCheck = color || this.playerToMove;
    return this.board.isInCheck(colorToCheck);
  }
  
  /**
   * Switches the player to move
   */
  private switchPlayerToMove(): void {
    this.playerToMove = this.playerToMove === 'white' ? 'black' : 'white';
    this.board.setActivePlayer(this.playerToMove);
    
    // Switch active timer
    if (this.activeTimer !== null) {
      this.activeTimer = this.playerToMove;
    }
  }

  /**
   * Gets the current board
   */
  public getBoard(): Board {
    return this.board;
  }

  /**
   * Gets the BP manager
   */
  public getBPManager(): BPManager {
    return this.bpManager;
  }

  /**
   * Gets the game result
   */
  public getGameResult(): GameResult | null {
    return this.gameResult;
  }

  /**
   * Gets the move history
   */
  public getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }

  /**
   * Updates player time remaining and checks for timeout
   * @param color Player color
   * @param elapsedMs Time elapsed in milliseconds
   * @returns Whether the time was updated successfully
   */
  public updateTime(color: PieceColor, elapsedMs: number): boolean {
    // Check if we're using time control
    if (this.activeTimer === null) {
      return false;
    }
    
    // Check if it's this player's turn
    if (this.activeTimer !== color) {
      return false;
    }
    
    // Update time remaining
    if (color === 'white') {
      this.whiteTimeRemaining = Math.max(0, this.whiteTimeRemaining - elapsedMs);
      
      // Check for timeout
      if (this.whiteTimeRemaining === 0) {
        this.gameResult = GameResult.BLACK_WIN;
        this.currentPhase = GamePhase.GAME_OVER;
      }
    } else {
      this.blackTimeRemaining = Math.max(0, this.blackTimeRemaining - elapsedMs);
      
      // Check for timeout
      if (this.blackTimeRemaining === 0) {
        this.gameResult = GameResult.WHITE_WIN;
        this.currentPhase = GamePhase.GAME_OVER;
      }
    }
    
    return true;
  }

  /**
   * Starts a game
   * Initializes timers and game state
   * @returns Success indicator
   */
  public startGame(): boolean {
    // Ensure we can only start from initial state
    if (this.currentPhase !== GamePhase.NORMAL || this.moveHistory.length > 0) {
      return false;
    }
    
    // Start timer for white if time control is enabled
    if (this.whiteTimeRemaining > 0 && this.blackTimeRemaining > 0) {
      this.activeTimer = 'white';
    }
    
    return true;
  }

  /**
   * Gets the current phase of the game
   * @returns Current game phase
   */
  public getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Processes BP allocation for a duel
   * @param playerColor Color of the player allocating BP
   * @param bpAmount Amount of BP to allocate
   * @returns Result including whether the duel is complete
   */
  public processBpAllocation(
    playerColor: PieceColor,
    bpAmount: number
  ): { success: boolean; duelComplete: boolean; outcome?: any } {
    // Process the allocation
    const success = this.processDuelAllocation(playerColor, bpAmount);
    
    if (!success) {
      return { success: false, duelComplete: false };
    }
    
    // Check if both players have allocated
    const duel = this.board.getActiveDuel();
    if (!duel) {
      return { success: true, duelComplete: false };
    }
    
    const bothAllocated = 
      duel.attackerAllocation > 0 && 
      duel.defenderAllocation > 0;
    
    if (bothAllocated) {
      // Resolve the duel
      const duelResult = this.resolveDuel();
      return {
        success: true,
        duelComplete: true,
        outcome: duel
      };
    }
    
    return { success: true, duelComplete: false };
  }

  /**
   * Ends the game with a specific result
   * @param result Game result details
   * @returns Success indicator
   */
  public endGame(result: { result: string; winner?: PieceColor; reason?: string }): boolean {
    // Only end the game if it's not already over
    if (this.currentPhase === GamePhase.GAME_OVER) {
      return false;
    }
    
    // Set game phase to over
    this.currentPhase = GamePhase.GAME_OVER;
    
    // Set game result based on the winner
    if (result.winner === 'white') {
      this.gameResult = GameResult.WHITE_WIN;
    } else if (result.winner === 'black') {
      this.gameResult = GameResult.BLACK_WIN;
    } else {
      this.gameResult = GameResult.DRAW;
    }
    
    // Stop timers
    this.activeTimer = null;
    
    return true;
  }
} 