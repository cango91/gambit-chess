import { v4 as uuidv4 } from 'uuid';
import {
  BoardImpl,
  PieceFactoryImpl,
  Board,
  GameState as SharedGameState,
  GamePhase,
  PlayerColor,
  PieceDTO,
  Position,
  MoveType,
  PieceType,
  MoveValidator,
  CheckDetection,
  RetreatOption
} from 'gambit-chess-shared';
import { ServerGameState } from '../types';

const DEFAULT_INITIAL_BP = 39; // Sum of classic chess piece values

/**
 * Core GameState class for managing the state of a Gambit Chess game
 * This is the authoritative state that exists only on the server
 */
export class GameState {
  private state: ServerGameState;
  private board: Board;
  private pieceFactory: PieceFactoryImpl;

  /**
   * Create a new game state
   * @param gameId Optional game ID (generated if not provided)
   * @param initialBPPool Initial BP pool for each player (default: 39)
   */
  constructor(gameId?: string, initialBPPool: number = DEFAULT_INITIAL_BP) {
    this.pieceFactory = new PieceFactoryImpl();
    
    // Initialize with empty board
    this.board = new BoardImpl([]);
    
    // Initialize the state
    this.state = {
      gameId: gameId || uuidv4(),
      currentTurn: PlayerColor.WHITE,
      gamePhase: GamePhase.NORMAL_MOVE,
      gameState: SharedGameState.ACTIVE,
      pieces: [],
      capturedPieces: [],
      whitePlayerBP: initialBPPool,
      blackPlayerBP: initialBPPool,
      lastMove: null,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      moveHistory: [],
      pendingBPRegeneration: {
        white: 0,
        black: 0
      }
    };
    
    // Setup initial board
    this.setupInitialBoard();
  }

  /**
   * Get the current game ID
   */
  getGameId(): string {
    return this.state.gameId;
  }

  /**
   * Get the current game state
   */
  getState(): Readonly<ServerGameState> {
    return { ...this.state };
  }

  /**
   * Get the board implementation
   */
  getBoard(): Board {
    return this.board;
  }

  /**
   * Check if the game is over
   */
  isGameOver(): boolean {
    return this.state.gameState === SharedGameState.CHECKMATE ||
           this.state.gameState === SharedGameState.STALEMATE ||
           this.state.gameState === SharedGameState.DRAW;
  }

  /**
   * Check if a player is in check
   * @param color The player color to check
   */
  isInCheck(color: PlayerColor): boolean {
    return CheckDetection.isInCheck(this.board, color);
  }

  /**
   * Setup the initial board with standard chess pieces
   */
  private setupInitialBoard(): void {
    const pieces: PieceDTO[] = [];
    
    // Add pawns
    for (let x = 0; x < 8; x++) {
      pieces.push(this.pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x, y: 1 }).toDTO());
      pieces.push(this.pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x, y: 6 }).toDTO());
    }
    
    // Add rooks
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 0, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 7, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 0, y: 7 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 7, y: 7 }).toDTO());
    
    // Add knights
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 1, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 6, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 1, y: 7 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 6, y: 7 }).toDTO());
    
    // Add bishops
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.WHITE, { x: 2, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.WHITE, { x: 5, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 2, y: 7 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 5, y: 7 }).toDTO());
    
    // Add queens
    pieces.push(this.pieceFactory.createNewPiece(PieceType.QUEEN, PlayerColor.WHITE, { x: 3, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.QUEEN, PlayerColor.BLACK, { x: 3, y: 7 }).toDTO());
    
    // Add kings
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }).toDTO());
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KING, PlayerColor.BLACK, { x: 4, y: 7 }).toDTO());
    
    // Update state and board
    this.state.pieces = pieces;
    this.updateBoard();
  }

  /**
   * Update the board with the current pieces from state
   */
  private updateBoard(): void {
    const fullPieces = this.state.pieces.map(pieceDTO => 
      this.pieceFactory.createPiece(pieceDTO)
    );
    this.board = new BoardImpl(fullPieces);
  }
  
  /**
   * Add a session ID for a player
   * @param color Player color
   * @param sessionId Session ID to assign
   */
  assignPlayerSession(color: PlayerColor, sessionId: string): void {
    if (color === PlayerColor.WHITE) {
      this.state.whitePlayerSessionId = sessionId;
    } else {
      this.state.blackPlayerSessionId = sessionId;
    }
    this.state.lastActivityAt = new Date();
  }

  /**
   * Update the game phase
   * @param phase New game phase
   */
  setGamePhase(phase: GamePhase): void {
    this.state.gamePhase = phase;
    this.state.lastActivityAt = new Date();
  }

  /**
   * Update the game state (active, check, checkmate, etc.)
   * @param gameState New game state
   */
  setGameState(gameState: SharedGameState): void {
    this.state.gameState = gameState;
    this.state.lastActivityAt = new Date();
  }

  /**
   * Update BP for a player
   * @param color Player color
   * @param amount New BP amount
   */
  setPlayerBP(color: PlayerColor, amount: number): void {
    if (color === PlayerColor.WHITE) {
      this.state.whitePlayerBP = amount;
    } else {
      this.state.blackPlayerBP = amount;
    }
  }

  /**
   * Get BP for a player
   * @param color Player color
   * @returns Current BP amount
   */
  getPlayerBP(color: PlayerColor): number {
    return color === PlayerColor.WHITE
      ? this.state.whitePlayerBP
      : this.state.blackPlayerBP;
  }

  /**
   * Add BP to a player's pool
   * @param color Player color
   * @param amount Amount to add (can be negative)
   * @returns New BP amount
   */
  addPlayerBP(color: PlayerColor, amount: number): number {
    const currentBP = this.getPlayerBP(color);
    const newBP = Math.max(0, currentBP + amount);
    this.setPlayerBP(color, newBP);
    return newBP;
  }

  /**
   * Switch to the next player's turn
   */
  switchTurn(): void {
    this.state.currentTurn = this.state.currentTurn === PlayerColor.WHITE 
      ? PlayerColor.BLACK 
      : PlayerColor.WHITE;
      
    // Apply any pending BP regeneration
    const color = this.state.currentTurn;
    const regen = color === PlayerColor.WHITE 
      ? this.state.pendingBPRegeneration.white 
      : this.state.pendingBPRegeneration.black;
      
    if (regen > 0) {
      this.addPlayerBP(color, regen);
      
      // Reset pending regeneration
      if (color === PlayerColor.WHITE) {
        this.state.pendingBPRegeneration.white = 0;
      } else {
        this.state.pendingBPRegeneration.black = 0;
      }
    }
  }

  /**
   * Record BP regeneration for the next turn
   * @param color Player color
   * @param amount Amount to regenerate
   */
  addPendingBPRegeneration(color: PlayerColor, amount: number): void {
    if (color === PlayerColor.WHITE) {
      this.state.pendingBPRegeneration.white += amount;
    } else {
      this.state.pendingBPRegeneration.black += amount;
    }
  }

  /**
   * Find a piece by position
   * @param position Position to check
   * @returns Piece DTO if found, undefined otherwise
   */
  findPieceAt(position: Position): PieceDTO | undefined {
    return this.state.pieces.find(piece => 
      piece.position.x === position.x && piece.position.y === position.y
    );
  }

  /**
   * Check if it's currently a player's turn
   * @param color Player color to check
   * @returns True if it's the player's turn
   */
  isPlayerTurn(color: PlayerColor): boolean {
    return this.state.currentTurn === color;
  }

  /**
   * Update the pieces in the game state
   * @param updatedPieces New pieces array
   */
  updatePieces(updatedPieces: PieceDTO[]): void {
    this.state.pieces = [...updatedPieces];
    this.updateBoard();
  }
  
  /**
   * Clear any pending duel state
   */
  clearPendingDuel(): void {
    this.state.pendingDuel = undefined;
  }
  
  /**
   * Setup tactical retreat state
   * @param retreatingPiece The piece that needs to retreat
   * @param from Original position before attack
   * @param to Position of the failed capture attempt
   * @param retreatOptions Available retreat options with BP costs
   */
  setupTacticalRetreat(
    retreatingPiece: PieceDTO,
    from: Position,
    to: Position,
    retreatOptions: RetreatOption[]
  ): void {
    this.state.tacticalRetreat = {
      piece: retreatingPiece,
      originalPosition: { ...from },
      failedCapturePosition: { ...to },
      retreatOptions: [...retreatOptions]
    };
  }
  
  /**
   * Clear tactical retreat state
   */
  clearTacticalRetreat(): void {
    this.state.tacticalRetreat = undefined;
  }
  
  /**
   * Get the current tactical retreat options
   * @returns Current tactical retreat state
   */
  getTacticalRetreatOptions(): {
    piece: PieceDTO;
    originalPosition: Position;
    failedCapturePosition: Position;
    retreatOptions: RetreatOption[];
  } | undefined {
    return this.state.tacticalRetreat;
  }

  /**
   * Set the board state from a list of pieces
   * Useful for testing and loading scenarios
   * @param pieces Array of piece DTOs to place on the board
   * @param clearHistory Whether to clear move history (default: true)
   * @returns The updated board
   */
  setBoardState(pieces: PieceDTO[], clearHistory: boolean = true): Board {
    // Update the pieces in the state
    this.state.pieces = [...pieces];
    
    // Clear history if requested
    if (clearHistory) {
      this.state.moveHistory = [];
      this.state.lastMove = null;
    }
    
    // Update the board
    this.updateBoard();
    
    return this.board;
  }
  
  /**
   * Load a game state from a saved state object
   * @param savedState The saved state to load
   * @param validateState Whether to validate the state before loading (default: true)
   * @returns The loaded game state
   * @throws Error if the state is invalid and validation is enabled
   */
  loadGameState(savedState: Partial<ServerGameState>, validateState: boolean = true): ServerGameState {
    if (validateState) {
      this.validateGameState(savedState);
    }
    
    // Create a new state by merging the saved state with default values
    const defaultState = {
      gameId: savedState.gameId || uuidv4(),
      createdAt: savedState.createdAt || new Date(),
      lastActivityAt: new Date(),
      currentTurn: savedState.currentTurn || PlayerColor.WHITE,
      gamePhase: savedState.gamePhase || GamePhase.NORMAL_MOVE,
      gameState: savedState.gameState || SharedGameState.ACTIVE,
      pieces: savedState.pieces || [],
      capturedPieces: savedState.capturedPieces || [],
      whitePlayerBP: savedState.whitePlayerBP || DEFAULT_INITIAL_BP,
      blackPlayerBP: savedState.blackPlayerBP || DEFAULT_INITIAL_BP,
      whitePlayerSessionId: savedState.whitePlayerSessionId,
      blackPlayerSessionId: savedState.blackPlayerSessionId,
      lastMove: savedState.lastMove || null,
      moveHistory: savedState.moveHistory || [],
      pendingDuel: savedState.pendingDuel,
      tacticalRetreat: savedState.tacticalRetreat,
      pendingBPRegeneration: savedState.pendingBPRegeneration || { white: 0, black: 0 }
    };
    
    // Update the state
    this.state = defaultState as ServerGameState;
    
    // Update the board
    this.updateBoard();
    
    return this.state;
  }
  
  /**
   * Get a serializable snapshot of the current game state
   * Useful for saving games or creating test scenarios
   * @returns Deep copy of the current state
   */
  getSerializableState(): ServerGameState {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  /**
   * Validate a game state to ensure it's valid
   * @param state The state to validate
   * @throws Error if the state is invalid
   * @private
   */
  private validateGameState(state: Partial<ServerGameState>): void {
    // Basic validation
    if (state.pieces && !Array.isArray(state.pieces)) {
      throw new Error('Invalid state: pieces must be an array');
    }
    
    if (state.capturedPieces && !Array.isArray(state.capturedPieces)) {
      throw new Error('Invalid state: capturedPieces must be an array');
    }
    
    if (state.moveHistory && !Array.isArray(state.moveHistory)) {
      throw new Error('Invalid state: moveHistory must be an array');
    }
    
    // Validate player BP values
    if (state.whitePlayerBP !== undefined && (typeof state.whitePlayerBP !== 'number' || state.whitePlayerBP < 0)) {
      throw new Error('Invalid state: whitePlayerBP must be a non-negative number');
    }
    
    if (state.blackPlayerBP !== undefined && (typeof state.blackPlayerBP !== 'number' || state.blackPlayerBP < 0)) {
      throw new Error('Invalid state: blackPlayerBP must be a non-negative number');
    }
    
    // Validate pieces
    if (state.pieces) {
      // Check for duplicate piece positions
      const positions = new Set<string>();
      state.pieces.forEach(piece => {
        const posKey = `${piece.position.x},${piece.position.y}`;
        if (positions.has(posKey)) {
          throw new Error(`Invalid state: multiple pieces at position ${posKey}`);
        }
        positions.add(posKey);
        
        // Validate piece position is within bounds
        if (piece.position.x < 0 || piece.position.x > 7 || piece.position.y < 0 || piece.position.y > 7) {
          throw new Error(`Invalid state: piece position out of bounds: ${posKey}`);
        }
      });
      
      // Ensure there is exactly one king of each color
      const whiteKings = state.pieces.filter(p => p.type === PieceType.KING && p.color === PlayerColor.WHITE);
      const blackKings = state.pieces.filter(p => p.type === PieceType.KING && p.color === PlayerColor.BLACK);
      
      if (whiteKings.length !== 1) {
        throw new Error(`Invalid state: there must be exactly one white king (found ${whiteKings.length})`);
      }
      
      if (blackKings.length !== 1) {
        throw new Error(`Invalid state: there must be exactly one black king (found ${blackKings.length})`);
      }
    }
  }
} 