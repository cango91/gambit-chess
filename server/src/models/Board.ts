import { 
  BoardSnapshot,
  ChessPiece, 
  Duel, 
  GamePhase, 
  MoveOutcome, 
  Position, 
  PieceColor, 
  PieceType, 
  Retreat,
  isKingInCheck,
  wouldMoveResultInSelfCheck
} from '@gambit-chess/shared';

/**
 * Board class that uses composition with BoardSnapshot
 * This is the authoritative board representation for the game engine
 */
export class Board {
  private boardSnapshot: BoardSnapshot;
  private currentPhase: GamePhase = GamePhase.NORMAL;
  private activeDuel: Duel | null = null;
  private retreatOptions: Retreat[] | null = null;
  private previousBoardState: Board | null = null;
  private activePlayer: PieceColor = 'white';
  private lastCaptureAttempt: { from: Position, to: Position } | null = null;
  private capturedPieces: ChessPiece[] = [];
  private moveCount: number = 0;
  private halfMoveClock: number = 0; // For 50-move rule
  private positionHistory: Map<string, number> = new Map(); // For threefold repetition

  /**
   * Creates a new Board instance
   * @param setupBoard Whether to set up the initial position (default: true)
   */
  constructor(setupBoard: boolean = true) {
    this.boardSnapshot = new BoardSnapshot(setupBoard);
    
    // Initialize position history with current position
    if (setupBoard) {
      this.updatePositionHistory();
    }
  }

  /**
   * Creates a snapshot of the current board state for client consumption
   * @param viewerColor Optional color of the player viewing the board (for information hiding)
   * @returns A BoardSnapshot instance with appropriate visibility
   */
  public toSnapshot(viewerColor?: PieceColor): BoardSnapshot {
    return this.boardSnapshot.clone();
  }

  /**
   * Gets the current game phase
   */
  public getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Gets the active player's color
   */
  public getActivePlayer(): PieceColor {
    return this.activePlayer;
  }

  /**
   * Sets the active player's color
   */
  public setActivePlayer(color: PieceColor): void {
    this.activePlayer = color;
  }

  /**
   * Switches the active player
   */
  public switchActivePlayer(): void {
    this.activePlayer = this.activePlayer === 'white' ? 'black' : 'white';
  }

  /**
   * Gets the captured pieces
   */
  public getCapturedPieces(): ChessPiece[] {
    return [...this.capturedPieces];
  }

  /**
   * Gets the current turn number
   */
  public getCurrentTurn(): number {
    return this.boardSnapshot.getCurrentTurn();
  }

  /**
   * Gets the piece at a position
   */
  public getPiece(position: Position): ChessPiece | undefined {
    return this.boardSnapshot.getPiece(position);
  }

  /**
   * Gets all pieces on the board
   */
  public getAllPieces(): ChessPiece[] {
    return this.boardSnapshot.getAllPieces();
  }

  /**
   * Gets all pieces of a specific color
   */
  public getPiecesByColor(color: PieceColor): ChessPiece[] {
    return this.boardSnapshot.getPiecesByColor(color);
  }

  /**
   * Gets the position of the king for a specific color
   */
  public getKingPosition(color: PieceColor): Position | undefined {
    return this.boardSnapshot.getKingPosition(color);
  }

  /**
   * Checks if a move is valid according to chess rules
   */
  public isValidMove(from: Position, to: Position): boolean {
    return this.boardSnapshot.isValidMove(from, to);
  }

  /**
   * Gets the current en passant target position, if any
   */
  public getEnPassantTarget(): Position | null {
    return this.boardSnapshot.getEnPassantTarget();
  }

  /**
   * Checks if a king is in check
   */
  public isInCheck(color: PieceColor): boolean {
    return this.boardSnapshot.isInCheck(color);
  }

  /**
   * Adds a piece to the board
   */
  public addPiece(type: PieceType, color: PieceColor, position: Position): ChessPiece {
    return this.boardSnapshot.addPiece(type, color, position);
  }

  /**
   * Tracks a position in the position history for threefold repetition detection
   */
  private updatePositionHistory(): void {
    // Create a simple hash of the current position
    const positionHash = this.getPositionHash();
    
    // Update the position count in history
    const count = this.positionHistory.get(positionHash) || 0;
    this.positionHistory.set(positionHash, count + 1);
  }

  /**
   * Generates a simple hash representing the current board position
   * Used for tracking threefold repetition
   */
  private getPositionHash(): string {
    const pieces = this.getAllPieces();
    const piecesStr = pieces.map(p => `${p.type}${p.color}${p.position}`).sort().join('|');
    
    // Include additional state that affects position repetition
    const enPassantTarget = this.getEnPassantTarget() || '-';
    const activePlayer = this.activePlayer;
    
    // Create a combined hash
    return `${piecesStr}|${enPassantTarget}|${activePlayer}`;
  }

  /**
   * Transitions the game to duel phase for a capture attempt
   * @param attacker Color of the attacking player
   * @param from Starting position
   * @param to Target position
   */
  public transitionToDuel(attacker: PieceColor, from: Position, to: Position): void {
    // Save the capture attempt details
    this.lastCaptureAttempt = { from, to };
    
    // Create a new duel with initial values
    this.activeDuel = {
      attacker,
      attackerAllocation: 0,
      defenderAllocation: 0,
      outcome: 'failed' // Default to failed until resolved
    };
    
    // Update the game phase
    this.currentPhase = GamePhase.DUEL_ALLOCATION;
  }

  /**
   * Records a player's BP allocation for the active duel
   * @param color Player's color
   * @param allocation Amount of BP allocated
   */
  public recordDuelAllocation(color: PieceColor, allocation: number): void {
    if (!this.activeDuel) {
      throw new Error('No active duel in progress');
    }
    
    if (color === this.activeDuel.attacker) {
      this.activeDuel.attackerAllocation = allocation;
    } else {
      this.activeDuel.defenderAllocation = allocation;
    }
  }

  /**
   * Resolves the active duel and determines the outcome
   * @returns The outcome of the duel
   */
  public resolveDuel(): MoveOutcome {
    if (!this.activeDuel || !this.lastCaptureAttempt) {
      throw new Error('No active duel in progress');
    }
    
    // Determine the outcome based on BP allocation
    const outcome: MoveOutcome = 
      this.activeDuel.attackerAllocation > this.activeDuel.defenderAllocation 
        ? 'success' 
        : 'failed';
    
    this.activeDuel.outcome = outcome;
    
    // If the capture succeeded, execute the move
    if (outcome === 'success') {
      // Make the move on the board
      this.makeMove(
        this.lastCaptureAttempt.from, 
        this.lastCaptureAttempt.to
      );
      
      // Return to normal phase
      this.currentPhase = GamePhase.NORMAL;
      this.activeDuel = null;
      this.lastCaptureAttempt = null;
    } else {
      // If the capture failed, transition to tactical retreat phase
      this.currentPhase = GamePhase.TACTICAL_RETREAT;
    }
    
    return outcome;
  }

  /**
   * Gets the active duel
   */
  public getActiveDuel(): Duel | null {
    return this.activeDuel;
  }
  
  /**
   * Gets the last capture attempt
   */
  public getLastCaptureAttempt(): { from: Position, to: Position } | null {
    return this.lastCaptureAttempt;
  }

  /**
   * Sets the available tactical retreat options
   * @param options Available retreat options
   */
  public setRetreatOptions(options: Retreat[]): void {
    this.retreatOptions = options;
  }

  /**
   * Gets the available tactical retreat options
   */
  public getRetreatOptions(): Retreat[] | null {
    return this.retreatOptions;
  }

  /**
   * Executes a tactical retreat
   * @param to Position to retreat to
   */
  public executeRetreat(to: Position): void {
    if (!this.lastCaptureAttempt || !this.retreatOptions) {
      throw new Error('No active retreat options available');
    }
    
    // Validate that the requested retreat position is among the available options
    const isValidOption = this.retreatOptions.some(option => option.to === to);
    if (!isValidOption) {
      throw new Error('Invalid retreat position');
    }
    
    // Execute the retreat (move the piece to the retreat position)
    const { from } = this.lastCaptureAttempt;
    const piece = this.getPiece(from);
    
    if (!piece) {
      throw new Error('No piece found at the retreat origin position');
    }
    
    // Move the piece to the retreat position
    this.removePiece(from);
    piece.position = to;
    this.addPiece(piece.type, piece.color, to);
    
    // Clean up and return to normal phase
    this.currentPhase = GamePhase.NORMAL;
    this.activeDuel = null;
    this.lastCaptureAttempt = null;
    this.retreatOptions = null;
    
    // Update position history for threefold repetition
    this.updatePositionHistory();
  }

  /**
   * Makes a move on the board with additional tracking
   * @param from Starting position
   * @param to Destination position
   * @param promotion Optional promotion piece type
   * @returns Move result with success flag and additional info
   */
  public makeMove(
    from: Position, 
    to: Position, 
    promotion?: PieceType
  ): { 
    success: boolean, 
    captured?: ChessPiece, 
    check?: boolean 
  } {
    // Get the moving piece and potential captured piece
    const movingPiece = this.getPiece(from);
    const capturedPiece = this.getPiece(to);
    
    // Make the move using the snapshot
    const result = this.boardSnapshot.makeMove(from, to, promotion);
    
    if (result.success) {
      // Increment move counters
      this.moveCount++;
      
      // Handle halfmove clock for 50-move rule
      // Reset on capture or pawn move, increment otherwise
      if (capturedPiece || (movingPiece && movingPiece.type === 'p')) {
        this.halfMoveClock = 0;
      } else {
        this.halfMoveClock++;
      }
      
      // Track captured piece
      if (capturedPiece) {
        this.capturedPieces.push({...capturedPiece}); // Clone to avoid reference issues
      }
      
      // Update position history for threefold repetition
      this.updatePositionHistory();
    }
    
    return result;
  }

  /**
   * Removes a piece from the board
   * @param position Position of the piece to remove
   * @returns The removed piece or undefined if no piece at the position
   */
  public removePiece(position: Position): ChessPiece | undefined {
    return this.boardSnapshot.removePiece(position);
  }

  /**
   * Gets all legal moves for a specific color
   * @param color Player color
   * @returns Array of legal moves as from-to pairs
   */
  public getLegalMoves(color: PieceColor): { from: Position, to: Position }[] {
    const legalMoves: { from: Position, to: Position }[] = [];
    const pieces = this.getPiecesByColor(color);
    
    // For each piece, check all possible destination squares
    for (const piece of pieces) {
      const { position } = piece;
      
      // Iterate through all 64 squares as potential destinations
      for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
        for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
          const file = String.fromCharCode(97 + fileIdx); // 'a' to 'h'
          const rank = String(rankIdx + 1); // '1' to '8'
          const destination = `${file}${rank}` as Position;
          
          // Check if the move is valid according to chess rules
          if (this.isValidMove(position, destination)) {
            // Check if the move would leave the king in check
            if (!wouldMoveResultInSelfCheck(this.boardSnapshot, position, destination)) {
              legalMoves.push({ from: position, to: destination });
            }
          }
        }
      }
    }
    
    return legalMoves;
  }

  /**
   * Checks if a king is in checkmate
   * @param color Color of the king to check
   * @returns Whether the king is in checkmate
   */
  public isCheckmate(color: PieceColor): boolean {
    // Check if the king is in check
    if (!isKingInCheck(this.boardSnapshot, color)) {
      return false;
    }
    
    // If any legal move exists, it's not checkmate
    return this.getLegalMoves(color).length === 0;
  }

  /**
   * Checks if the position is a stalemate
   * @param color Color to check for stalemate
   * @returns Whether the position is a stalemate
   */
  public isStalemate(color: PieceColor): boolean {
    // Not stalemate if the king is in check
    if (isKingInCheck(this.boardSnapshot, color)) {
      return false;
    }
    
    // Stalemate if no legal moves and not in check
    return this.getLegalMoves(color).length === 0;
  }

  /**
   * Checks if the position is a draw by insufficient material
   * @returns Whether the position is a draw by insufficient material
   */
  public isInsufficientMaterial(): boolean {
    const pieces = this.getAllPieces();
    
    // King vs King
    if (pieces.length === 2) {
      return true;
    }
    
    // King and bishop vs King or King and knight vs King
    if (pieces.length === 3) {
      const hasBishop = pieces.some(p => p.type === 'b');
      const hasKnight = pieces.some(p => p.type === 'n');
      return hasBishop || hasKnight;
    }
    
    // King and bishop vs King and bishop (same colored bishops)
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'b');
      if (bishops.length === 2 && 
          pieces.filter(p => p.type === 'k').length === 2) {
        // Check if bishops are on same colored squares
        const [b1x, b1y] = [bishops[0].position.charCodeAt(0) - 97, Number(bishops[0].position[1]) - 1];
        const [b2x, b2y] = [bishops[1].position.charCodeAt(0) - 97, Number(bishops[1].position[1]) - 1];
        
        // Bishop square colors: (x + y) % 2
        return (b1x + b1y) % 2 === (b2x + b2y) % 2;
      }
    }
    
    return false;
  }

  /**
   * Checks if the position is a draw by the 50-move rule
   * @returns Whether the position is a draw by the 50-move rule
   */
  public isFiftyMoveRule(): boolean {
    return this.halfMoveClock >= 100; // 50 moves = 100 half-moves
  }

  /**
   * Checks if the position is a draw by threefold repetition
   * @returns Whether the position is a draw by threefold repetition
   */
  public isThreefoldRepetition(): boolean {
    const positionHash = this.getPositionHash();
    const count = this.positionHistory.get(positionHash) || 0;
    return count >= 3;
  }

  /**
   * Stores the current board state before making a move
   * This is used to detect de novo tactical advantages
   */
  public storeBoardState(): void {
    this.previousBoardState = this.clone();
  }

  /**
   * Gets the previous board state
   */
  public getPreviousBoardState(): Board | null {
    return this.previousBoardState;
  }

  /**
   * Creates a deep copy of the board
   * @returns A new Board instance with the same state
   */
  public clone(): Board {
    const clonedBoard = new Board(false);
    
    // Copy the board snapshot
    clonedBoard.boardSnapshot = this.boardSnapshot.clone();
    
    // Copy captured pieces
    clonedBoard.capturedPieces = [...this.capturedPieces.map(p => ({...p}))];
    
    // Copy game state
    clonedBoard.currentPhase = this.currentPhase;
    clonedBoard.activePlayer = this.activePlayer;
    clonedBoard.moveCount = this.moveCount;
    clonedBoard.halfMoveClock = this.halfMoveClock;
    
    // Copy position history
    clonedBoard.positionHistory = new Map(this.positionHistory);
    
    // Copy duel state
    if (this.activeDuel) {
      clonedBoard.activeDuel = {...this.activeDuel};
    }
    
    // Copy last capture attempt
    if (this.lastCaptureAttempt) {
      clonedBoard.lastCaptureAttempt = {...this.lastCaptureAttempt};
    }
    
    // Copy retreat options
    if (this.retreatOptions) {
      clonedBoard.retreatOptions = [...this.retreatOptions];
    }
    
    return clonedBoard;
  }
} 