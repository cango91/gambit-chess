import {
  Board,
  BoardFactory,
  BoardImpl,
  BoardFactoryImpl,
  BoardSnapshot,
  CheckDetection,
  DuelOutcome,
  DuelResult,
  GamePhase,
  GameState,
  GameStateDTO,
  MoveResult,
  MoveType,
  MoveValidator,
  Piece,
  PieceDTO,
  PieceFactory,
  PieceFactoryImpl,
  PieceType,
  PlayerColor,
  PlayerRole,
  Position,
  RetreatOption,
  TacticalRetreatRules
} from '@gambit-chess/shared';
import { v4 as uuidv4 } from 'uuid';
import { gameConfig } from '../config/gameConfig';
import { GameStateStorage, defaultGameStateStorage } from '../storage';
import { TacticsDetection } from './TacticsDetection';
import { logger } from '../utils/logger';

/**
 * Represents the current game state data
 */
interface GameStateData {
  // Game metadata
  id: string;
  createdAt: number;
  updatedAt: number;
  
  // Player information
  whiteSessionId: string | null;
  blackSessionId: string | null;
  spectatorSessionIds: string[];
  
  // Game state
  currentTurn: PlayerColor;
  phase: GamePhase;
  gameState: GameState;
  
  // Board state
  pieces: PieceDTO[];
  capturedPieces: PieceDTO[];
  
  // Battle points
  whiteBP: number;
  blackBP: number;
  
  // Last move information
  lastMove: {
    from: Position;
    to: Position;
    type: MoveType;
  } | null;
  
  // Duel state
  activeDuel: {
    attackerPosition: Position;
    defenderPosition: Position;
    originalPosition: Position;
    whiteAllocated: number | null;
    blackAllocated: number | null;
  } | null;
  
  // Tactical retreat state
  tacticalRetreat: {
    piecePosition: Position;
    originalPosition: Position;
    failedCapturePosition: Position;
    availableRetreats: RetreatOption[];
  } | null;
  
  // AI
  againstAI: boolean;
  aiDifficulty?: string;
}

/**
 * Class that manages the game state and implements the Gambit Chess rules
 */
export class GameEngine {
  private gameId: string;
  private gameState: GameStateData | null = null;
  private pieceFactory: PieceFactory;
  private boardFactory: BoardFactory;
  private board: Board | null = null;
  private tacticsDetection: TacticsDetection;
  private gameStateStorage: GameStateStorage;

  /**
   * Create a game engine for a specific game
   * @param gameId The unique game ID
   * @param storage Optional storage implementation (defaults to Redis)
   */
  constructor(gameId: string, storage?: GameStateStorage) {
    this.gameId = gameId;
    this.pieceFactory = new PieceFactoryImpl();
    this.boardFactory = new BoardFactoryImpl(this.pieceFactory);
    this.tacticsDetection = new TacticsDetection();
    this.gameStateStorage = storage || defaultGameStateStorage;
  }

  /**
   * Initialize a new game
   * @param options Game initialization options
   */
  public async initialize(options: {
    againstAI?: boolean;
    aiDifficulty?: string;
    whiteSessionId?: string;
    blackSessionId?: string;
  }): Promise<void> {
    const { 
      againstAI = false,
      aiDifficulty,
      whiteSessionId = null,
      blackSessionId = null
    } = options;
    
    // Create initial pieces
    const pieces = this.createInitialPieces();
    
    // Set up the board with DTOs
    const pieceDTOs = pieces.map(p => p.toDTO());
    this.board = this.boardFactory.createFromPieces(pieceDTOs);
    
    // Initialize game state
    this.gameState = {
      id: this.gameId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      
      whiteSessionId,
      blackSessionId,
      spectatorSessionIds: [],
      
      currentTurn: PlayerColor.WHITE,
      phase: GamePhase.NORMAL_MOVE,
      gameState: GameState.ACTIVE,
      
      pieces: pieceDTOs,
      capturedPieces: [],
      
      whiteBP: gameConfig.INITIAL_BP_POOL,
      blackBP: gameConfig.INITIAL_BP_POOL,
      
      lastMove: null,
      activeDuel: null,
      tacticalRetreat: null,
      
      againstAI,
      aiDifficulty: aiDifficulty
    };

    // Save state
    await this.saveState();
  }

  /**
   * Load game state
   */
  public async loadState(): Promise<boolean> {
    const state = await this.gameStateStorage.getGameState(this.gameId);
    if (!state) {
      return false;
    }

    this.gameState = state;
    
    // Recreate board from pieces
    if (this.gameState) {
      this.board = this.boardFactory.createFromPieces(this.gameState.pieces);
    }
    
    return true;
  }

  /**
   * Save game state
   */
  private async saveState(): Promise<void> {
    if (this.gameState) {
      await this.gameStateStorage.saveGameState(this.gameId, this.gameState, gameConfig.GAME_EXPIRY);
    }
  }

  /**
   * Create the initial chess pieces
   */
  private createInitialPieces(): Piece[] {
    const pieces: Piece[] = [];
    
    // Create pawns
    for (let x = 0; x < 8; x++) {
      pieces.push(this.pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.WHITE, { x, y: 1 }));
      pieces.push(this.pieceFactory.createNewPiece(PieceType.PAWN, PlayerColor.BLACK, { x, y: 6 }));
    }
    
    // Create rooks
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 0, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.WHITE, { x: 7, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 0, y: 7 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.ROOK, PlayerColor.BLACK, { x: 7, y: 7 }));
    
    // Create knights
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 1, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.WHITE, { x: 6, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 1, y: 7 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KNIGHT, PlayerColor.BLACK, { x: 6, y: 7 }));
    
    // Create bishops
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.WHITE, { x: 2, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.WHITE, { x: 5, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 2, y: 7 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.BISHOP, PlayerColor.BLACK, { x: 5, y: 7 }));
    
    // Create queens
    pieces.push(this.pieceFactory.createNewPiece(PieceType.QUEEN, PlayerColor.WHITE, { x: 3, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.QUEEN, PlayerColor.BLACK, { x: 3, y: 7 }));
    
    // Create kings
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KING, PlayerColor.WHITE, { x: 4, y: 0 }));
    pieces.push(this.pieceFactory.createNewPiece(PieceType.KING, PlayerColor.BLACK, { x: 4, y: 7 }));
    
    return pieces;
  }

  /**
   * Process a move request from a player
   */
  public async processMove(
    sessionId: string,
    from: Position,
    to: Position,
    promotionPiece?: PieceType
  ): Promise<MoveResult> {
    // Load latest state
    await this.loadState();
    
    if (!this.gameState || !this.board) {
      throw new Error('Game not initialized');
    }
    
    // Check if it's the player's turn
    const playerRole = this.getPlayerRole(sessionId);
    const playerColor = playerRole === PlayerRole.PLAYER_WHITE 
      ? PlayerColor.WHITE 
      : playerRole === PlayerRole.PLAYER_BLACK 
        ? PlayerColor.BLACK 
        : null;
    
    if (!playerColor) {
      return {
        success: false,
        error: 'Not a player in this game',
        triggersDuel: false
      };
    }
    
    if (playerColor !== this.gameState.currentTurn) {
      return {
        success: false,
        error: 'Not your turn',
        triggersDuel: false
      };
    }
    
    // Check if we're in the right phase
    if (this.gameState.phase !== GamePhase.NORMAL_MOVE) {
      return {
        success: false,
        error: `Cannot move in ${this.gameState.phase} phase`,
        triggersDuel: false
      };
    }
    
    try {
      // Validate the move
      const moveType = MoveValidator.validateMove(this.board, from, to, promotionPiece);
      
      // Get the piece that's moving
      const piece = this.board.getPieceAt(from);
      if (!piece) {
        return {
          success: false, 
          error: 'No piece at start position',
          triggersDuel: false
        };
      }
      
      // Check if it's a capture
      const capturedPiece = this.board.getPieceAt(to);
      const isCapture = !!capturedPiece && capturedPiece.color !== piece.color;
      
      if (isCapture) {
        // Save the current state for a duel
        this.gameState.activeDuel = {
          attackerPosition: from,
          defenderPosition: to,
          originalPosition: { ...from },
          whiteAllocated: null,
          blackAllocated: null
        };
        
        this.gameState.phase = GamePhase.DUEL_ALLOCATION;
        await this.saveState();
        
        // Return move result indicating a duel is triggered
        return {
          success: true,
          move: {
            from,
            to,
            type: moveType,
            piece: piece.toDTO(),
            capturedPiece: capturedPiece?.toDTO(),
            promotionPiece
          },
          triggersDuel: true
        };
      } else {
        // Normal move - execute it
        // Clone the board for undo if needed
        const boardSnapshot = this.board.snapshot();
        
        // Update piece position
        piece.moveTo(to);
        
        // Handle promotion
        if (moveType === MoveType.PROMOTION && promotionPiece) {
          // Remove the pawn from pieces
          const pieceIndex = this.gameState.pieces.findIndex(
            p => p.position.x === to.x && p.position.y === to.y
          );
          
          if (pieceIndex !== -1) {
            this.gameState.pieces.splice(pieceIndex, 1);
          }
          
          // Create new promoted piece
          const newPiece = this.pieceFactory.createNewPiece(
            promotionPiece,
            piece.color,
            to
          );
          
          // Add to pieces
          this.gameState.pieces.push(newPiece.toDTO());
        } else {
          // Update piece in state
          const pieceIndex = this.gameState.pieces.findIndex(
            p => p.position.x === from.x && p.position.y === from.y
          );
          
          if (pieceIndex !== -1) {
            this.gameState.pieces[pieceIndex].position = to;
            this.gameState.pieces[pieceIndex].hasMoved = true;
          }
        }
        
        // Calculate BP regeneration
        const bpRegen = this.calculateBPRegen(playerColor, boardSnapshot, this.board);
        
        // Apply BP regeneration
        if (playerColor === PlayerColor.WHITE) {
          this.gameState.whiteBP += bpRegen;
        } else {
          this.gameState.blackBP += bpRegen;
        }
        
        // Update game state
        this.gameState.lastMove = {
          from,
          to,
          type: moveType
        };
        
        // Check for check, checkmate, stalemate
        this.updateGameState();
        
        // Switch turns
        this.gameState.currentTurn = playerColor === PlayerColor.WHITE
          ? PlayerColor.BLACK
          : PlayerColor.WHITE;
        
        // Save state
        await this.saveState();
        
        // Return move result
        return {
          success: true,
          move: {
            from,
            to,
            type: moveType,
            piece: piece.toDTO(),
            promotionPiece
          },
          triggersDuel: false
        };
      }
    } catch (err) {
      logger.error('Move validation error', { error: err, from, to });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid move',
        triggersDuel: false
      };
    }
  }

  /**
   * Process battle point allocation for a duel
   */
  public async processBPAllocation(
    sessionId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    // Load latest state
    await this.loadState();
    
    if (!this.gameState || !this.board) {
      throw new Error('Game not initialized');
    }
    
    // Check if we're in the duel allocation phase
    if (this.gameState.phase !== GamePhase.DUEL_ALLOCATION) {
      return {
        success: false,
        error: 'Not in duel allocation phase'
      };
    }
    
    // Get player color
    const playerRole = this.getPlayerRole(sessionId);
    const playerColor = playerRole === PlayerRole.PLAYER_WHITE 
      ? PlayerColor.WHITE 
      : playerRole === PlayerRole.PLAYER_BLACK 
        ? PlayerColor.BLACK 
        : null;
    
    if (!playerColor) {
      return {
        success: false,
        error: 'Not a player in this game'
      };
    }
    
    if (!this.gameState.activeDuel) {
      return {
        success: false,
        error: 'No active duel'
      };
    }
    
    // Get available BP
    const playerBP = playerColor === PlayerColor.WHITE
      ? this.gameState.whiteBP
      : this.gameState.blackBP;
    
    // Validate BP allocation
    if (amount <= 0) {
      return {
        success: false,
        error: 'BP allocation must be positive'
      };
    }
    
    if (amount > playerBP) {
      return {
        success: false,
        error: 'Not enough BP'
      };
    }
    
    if (amount > gameConfig.MAX_BP_ALLOCATION) {
      return {
        success: false,
        error: `Maximum BP allocation is ${gameConfig.MAX_BP_ALLOCATION}`
      };
    }
    
    // Store allocation
    if (playerColor === PlayerColor.WHITE) {
      this.gameState.activeDuel.whiteAllocated = amount;
      this.gameState.whiteBP -= amount;
    } else {
      this.gameState.activeDuel.blackAllocated = amount;
      this.gameState.blackBP -= amount;
    }
    
    // Check if both players have allocated
    if (
      this.gameState.activeDuel.whiteAllocated !== null &&
      this.gameState.activeDuel.blackAllocated !== null
    ) {
      // Resolve the duel
      await this.resolveDuel();
    } else {
      // Save state
      await this.saveState();
    }
    
    return { success: true };
  }

  /**
   * Resolve a duel after both players have allocated BP
   */
  private async resolveDuel(): Promise<void> {
    if (!this.gameState || !this.board || !this.gameState.activeDuel) {
      throw new Error('Cannot resolve duel - invalid state');
    }
    
    const { attackerPosition, defenderPosition, originalPosition } = this.gameState.activeDuel;
    const whiteAllocated = this.gameState.activeDuel.whiteAllocated || 0;
    const blackAllocated = this.gameState.activeDuel.blackAllocated || 0;
    
    // Determine attacker and defender colors
    const attackerPiece = this.board.getPieceAt(attackerPosition);
    const defenderPiece = this.board.getPieceAt(defenderPosition);
    
    if (!attackerPiece || !defenderPiece) {
      throw new Error('Cannot resolve duel - pieces not found');
    }
    
    const attackerColor = attackerPiece.color;
    const defenderColor = defenderPiece.color;
    
    // Take snapshot of board before the duel for BP regeneration calculation
    const boardSnapshot = this.board.snapshot();
    
    // Determine attacker and defender allocations
    const attackerAllocation = attackerColor === PlayerColor.WHITE
      ? whiteAllocated
      : blackAllocated;
    
    const defenderAllocation = defenderColor === PlayerColor.WHITE
      ? whiteAllocated
      : blackAllocated;
    
    // Determine outcome (defender wins ties)
    let outcome: DuelOutcome;
    if (attackerAllocation > defenderAllocation) {
      outcome = DuelOutcome.ATTACKER_WINS;
    } else if (attackerAllocation < defenderAllocation) {
      outcome = DuelOutcome.DEFENDER_WINS;
    } else {
      outcome = DuelOutcome.TIE; // Ties favor defender
    }
    
    if (outcome === DuelOutcome.ATTACKER_WINS) {
      // Attacker wins - execute capture
      
      // Remove captured piece from board
      const capturedPieceIndex = this.gameState.pieces.findIndex(
        p => p.position.x === defenderPosition.x && p.position.y === defenderPosition.y
      );
      
      if (capturedPieceIndex !== -1) {
        // Add to captured pieces
        this.gameState.capturedPieces.push(this.gameState.pieces[capturedPieceIndex]);
        
        // Remove from active pieces
        this.gameState.pieces.splice(capturedPieceIndex, 1);
      }
      
      // Move attacker to defender's position
      const attackerPieceIndex = this.gameState.pieces.findIndex(
        p => p.position.x === attackerPosition.x && p.position.y === attackerPosition.y
      );
      
      if (attackerPieceIndex !== -1) {
        this.gameState.pieces[attackerPieceIndex].position = { ...defenderPosition };
        this.gameState.pieces[attackerPieceIndex].hasMoved = true;
      }
      
      // Update board
      attackerPiece.moveTo(defenderPosition);
      
      // Update last move
      this.gameState.lastMove = {
        from: originalPosition,
        to: defenderPosition,
        type: MoveType.CAPTURE
      };
      
      // Calculate BP regeneration
      const bpRegen = this.calculateBPRegen(
        attackerColor,
        boardSnapshot,
        this.board
      );
      
      // Apply BP regeneration
      if (attackerColor === PlayerColor.WHITE) {
        this.gameState.whiteBP += bpRegen;
      } else {
        this.gameState.blackBP += bpRegen;
      }
      
      // Check for check, checkmate, stalemate
      this.updateGameState();
      
      // Switch turns
      this.gameState.currentTurn = attackerColor === PlayerColor.WHITE
        ? PlayerColor.BLACK
        : PlayerColor.WHITE;
      
      // Clear duel state
      this.gameState.activeDuel = null;
      this.gameState.phase = GamePhase.NORMAL_MOVE;
    } else {
      // Defender wins or tie - move attacker back to original position
      
      // Move piece back to original position in state
      const attackerPieceIndex = this.gameState.pieces.findIndex(
        p => p.position.x === attackerPosition.x && p.position.y === attackerPosition.y
      );
      
      if (attackerPieceIndex !== -1) {
        this.gameState.pieces[attackerPieceIndex].position = { ...originalPosition };
      }
      
      // Check if tactical retreat is available
      const canRetreat = this.canPerformTacticalRetreat(
        attackerPiece.type,
        attackerPiece.color
      );
      
      if (canRetreat) {
        // Set up tactical retreat
        this.setupTacticalRetreat(
          attackerPiece,
          originalPosition,
          defenderPosition
        );
        
        this.gameState.phase = GamePhase.TACTICAL_RETREAT;
      } else {
        // No tactical retreat - just apply base BP regen
        const bpRegen = gameConfig.BASE_BP_REGEN;
        
        // Apply BP regeneration
        if (attackerColor === PlayerColor.WHITE) {
          this.gameState.whiteBP += bpRegen;
        } else {
          this.gameState.blackBP += bpRegen;
        }
        
        // Switch turns
        this.gameState.currentTurn = attackerColor === PlayerColor.WHITE
          ? PlayerColor.BLACK
          : PlayerColor.WHITE;
        
        // Clear duel state
        this.gameState.activeDuel = null;
        this.gameState.phase = GamePhase.NORMAL_MOVE;
      }
    }
    
    // Save state
    await this.saveState();
  }

  /**
   * Set up tactical retreat options after a failed capture
   */
  private setupTacticalRetreat(
    piece: Piece,
    originalPosition: Position,
    failedCapturePosition: Position
  ): void {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    
    // Calculate retreat options
    const availableRetreats = this.calculateRetreatOptions(
      piece.type,
      originalPosition,
      failedCapturePosition
    );
    
    // Set up tactical retreat state
    this.gameState.tacticalRetreat = {
      piecePosition: originalPosition,
      originalPosition,
      failedCapturePosition,
      availableRetreats
    };
  }

  /**
   * Process a tactical retreat request
   */
  public async processTacticalRetreat(
    sessionId: string,
    to: Position,
    acknowledgedBPCost: number
  ): Promise<{ success: boolean; error?: string }> {
    // Load latest state
    await this.loadState();
    
    if (!this.gameState || !this.board) {
      throw new Error('Game not initialized');
    }
    
    // Check if we're in the tactical retreat phase
    if (this.gameState.phase !== GamePhase.TACTICAL_RETREAT) {
      return {
        success: false,
        error: 'Not in tactical retreat phase'
      };
    }
    
    // Get player color
    const playerRole = this.getPlayerRole(sessionId);
    const playerColor = playerRole === PlayerRole.PLAYER_WHITE 
      ? PlayerColor.WHITE 
      : playerRole === PlayerRole.PLAYER_BLACK 
        ? PlayerColor.BLACK 
        : null;
    
    if (!playerColor) {
      return {
        success: false,
        error: 'Not a player in this game'
      };
    }
    
    // Check if it's the player's turn
    if (playerColor !== this.gameState.currentTurn) {
      return {
        success: false,
        error: 'Not your turn'
      };
    }
    
    if (!this.gameState.tacticalRetreat) {
      return {
        success: false,
        error: 'No active tactical retreat'
      };
    }
    
    const { piecePosition, originalPosition, failedCapturePosition, availableRetreats } = this.gameState.tacticalRetreat;
    
    // Find the piece that's retreating
    const piece = this.board.getPieceAt(piecePosition);
    if (!piece) {
      return {
        success: false,
        error: 'Retreating piece not found'
      };
    }
    
    // Check if the retreat position is valid
    const retreat = availableRetreats.find(
      r => r.position.x === to.x && r.position.y === to.y
    );
    
    if (!retreat) {
      return {
        success: false,
        error: 'Invalid retreat position'
      };
    }
    
    // Verify BP cost
    if (retreat.bpCost !== acknowledgedBPCost) {
      return {
        success: false,
        error: 'BP cost mismatch'
      };
    }
    
    // Check if player has enough BP
    const playerBP = playerColor === PlayerColor.WHITE
      ? this.gameState.whiteBP
      : this.gameState.blackBP;
    
    if (retreat.bpCost > playerBP) {
      return {
        success: false,
        error: 'Not enough BP for retreat'
      };
    }
    
    // Take snapshot of board before the retreat for BP regeneration calculation
    const boardSnapshot = this.board.snapshot();
    
    // Apply BP cost
    if (playerColor === PlayerColor.WHITE) {
      this.gameState.whiteBP -= retreat.bpCost;
    } else {
      this.gameState.blackBP -= retreat.bpCost;
    }
    
    // Update piece position in state
    const pieceIndex = this.gameState.pieces.findIndex(
      p => p.position.x === piecePosition.x && p.position.y === piecePosition.y
    );
    
    if (pieceIndex !== -1) {
      this.gameState.pieces[pieceIndex].position = to;
    }
    
    // Update piece on board
    piece.moveTo(to);
    
    // Update last move
    this.gameState.lastMove = {
      from: originalPosition,
      to,
      type: MoveType.NORMAL // Tactical retreat is considered a normal move
    };
    
    // Calculate BP regeneration
    const bpRegen = this.calculateBPRegen(
      playerColor,
      boardSnapshot,
      this.board
    );
    
    // Apply BP regeneration
    if (playerColor === PlayerColor.WHITE) {
      this.gameState.whiteBP += bpRegen;
    } else {
      this.gameState.blackBP += bpRegen;
    }
    
    // Check for check, checkmate, stalemate
    this.updateGameState();
    
    // Switch turns
    this.gameState.currentTurn = playerColor === PlayerColor.WHITE
      ? PlayerColor.BLACK
      : PlayerColor.WHITE;
    
    // Clear tactical retreat state
    this.gameState.tacticalRetreat = null;
    this.gameState.phase = GamePhase.NORMAL_MOVE;
    
    // Save state
    await this.saveState();
    
    return { success: true };
  }

  /**
   * Calculate available tactical retreat options
   */
  private calculateRetreatOptions(
    pieceType: PieceType,
    originalPosition: Position,
    failedCapturePosition: Position
  ): RetreatOption[] {
    if (!this.board) {
      return [];
    }
    
    const options: RetreatOption[] = [];
    
    // Always add original position (no BP cost)
    options.push({
      position: { ...originalPosition },
      bpCost: 0
    });
    
    // For knight, use pre-computed lookup table
    if (pieceType === PieceType.KNIGHT) {
      const knightOptions = TacticalRetreatRules.getKnightRetreatOptions(
        originalPosition,
        failedCapturePosition
      );
      
      for (const option of knightOptions) {
        // Check if position is valid and not occupied
        if (
          option.position.x >= 0 && option.position.x < 8 &&
          option.position.y >= 0 && option.position.y < 8 &&
          !this.board.isOccupied(option.position)
        ) {
          options.push(option);
        }
      }
      
      return options;
    }
    
    // For long-range pieces (bishop, rook, queen)
    const directions: [number, number][] = [];
    
    // Calculate retreat vector (opposite of attack vector)
    const attackDx = failedCapturePosition.x - originalPosition.x;
    const attackDy = failedCapturePosition.y - originalPosition.y;
    
    // Normalize attack vector
    const dx = attackDx === 0 ? 0 : attackDx > 0 ? 1 : -1;
    const dy = attackDy === 0 ? 0 : attackDy > 0 ? 1 : -1;
    
    // Retreat direction is opposite of attack direction
    const retreatDx = -dx;
    const retreatDy = -dy;
    
    // Add retreating direction
    if (retreatDx !== 0 || retreatDy !== 0) {
      directions.push([retreatDx, retreatDy]);
    }
    
    // For each direction, calculate retreat options
    for (const [dirX, dirY] of directions) {
      let x = originalPosition.x + dirX;
      let y = originalPosition.y + dirY;
      let distance = 1;
      
      while (
        x >= 0 && x < 8 && y >= 0 && y < 8 && // Within board
        !this.board.isOccupied({ x, y }) // Not occupied
      ) {
        // Add as a retreat option
        options.push({
          position: { x, y },
          bpCost: distance
        });
        
        // Move to next position in this direction
        x += dirX;
        y += dirY;
        distance++;
      }
    }
    
    return options;
  }

  /**
   * Calculate BP regeneration based on move and resulting board state
   */
  private calculateBPRegen(
    playerColor: PlayerColor,
    beforeBoard: BoardSnapshot,
    afterBoard: Board
  ): number {
    let bpRegen = gameConfig.BASE_BP_REGEN;
    
    // Check for tactics, only considering newly created ones
    const tacticsResult = this.tacticsDetection.detectTactics(
      playerColor,
      beforeBoard,
      afterBoard
    );
    
    // Add BP for each new tactic (not pre-existing ones)
    for (const tactic of tacticsResult.newTactics) {
      switch (tactic) {
        case 'CHECK':
          bpRegen += gameConfig.TACTICS_BP_REGEN.CHECK;
          break;
        case 'FORK':
          bpRegen += gameConfig.TACTICS_BP_REGEN.FORK;
          break;
        case 'PIN':
          bpRegen += gameConfig.TACTICS_BP_REGEN.PIN;
          break;
        case 'SKEWER':
          bpRegen += gameConfig.TACTICS_BP_REGEN.SKEWER;
          break;
        case 'DISCOVERED_ATTACK':
          bpRegen += gameConfig.TACTICS_BP_REGEN.DISCOVERED_ATTACK;
          break;
        case 'DISCOVERED_CHECK':
          bpRegen += gameConfig.TACTICS_BP_REGEN.DISCOVERED_CHECK;
          break;
      }
    }
    
    return bpRegen;
  }

  /**
   * Check if a player can perform a tactical retreat
   */
  private canPerformTacticalRetreat(pieceType: PieceType, pieceColor: PlayerColor): boolean {
    // Long-range pieces and knights can perform tactical retreat
    return [
      PieceType.BISHOP,
      PieceType.ROOK,
      PieceType.QUEEN,
      PieceType.KNIGHT
    ].includes(pieceType);
  }

  /**
   * Update the game state (check, checkmate, stalemate)
   */
  private updateGameState(): void {
    if (!this.gameState || !this.board) {
      return;
    }
    
    const opponentColor = this.gameState.currentTurn === PlayerColor.WHITE
      ? PlayerColor.BLACK
      : PlayerColor.WHITE;
    
    // Check if opponent is in check
    const isInCheck = CheckDetection.isInCheck(this.board, opponentColor);
    
    if (isInCheck) {
      // Check if it's checkmate
      const isCheckmate = CheckDetection.isCheckmate(this.board, opponentColor);
      
      if (isCheckmate) {
        this.gameState.gameState = GameState.CHECKMATE;
      } else {
        this.gameState.gameState = GameState.CHECK;
      }
    } else {
      // Check for stalemate
      const isStalemate = CheckDetection.isStalemate(this.board, opponentColor);
      
      if (isStalemate) {
        this.gameState.gameState = GameState.STALEMATE;
      } else {
        this.gameState.gameState = GameState.ACTIVE;
      }
      
      // ToDo: Add draw detection
    }
  }

  /**
   * Get player role in the game
   */
  private getPlayerRole(sessionId: string): PlayerRole {
    if (!this.gameState) {
      return PlayerRole.SPECTATOR;
    }
    
    if (this.gameState.whiteSessionId === sessionId) {
      return PlayerRole.PLAYER_WHITE;
    }
    
    if (this.gameState.blackSessionId === sessionId) {
      return PlayerRole.PLAYER_BLACK;
    }
    
    if (this.gameState.spectatorSessionIds.includes(sessionId)) {
      return PlayerRole.SPECTATOR;
    }
    
    return PlayerRole.SPECTATOR;
  }

  /**
   * Create a DTO of the game state for a specific player
   */
  public createGameStateDTO(sessionId: string): GameStateDTO {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    
    const playerRole = this.getPlayerRole(sessionId);
    const playerColor = playerRole === PlayerRole.PLAYER_WHITE
      ? PlayerColor.WHITE
      : playerRole === PlayerRole.PLAYER_BLACK
        ? PlayerColor.BLACK
        : null;
    
    // Get player's BP
    const playerBP = playerRole === PlayerRole.PLAYER_WHITE
      ? this.gameState.whiteBP
      : playerRole === PlayerRole.PLAYER_BLACK
        ? this.gameState.blackBP
        : 0;
    
    // Check if player is in check
    const isInCheck = this.gameState.gameState === GameState.CHECK && 
      playerColor === this.gameState.currentTurn;
    
    // Create DTO
    const dto: GameStateDTO = {
      gameId: this.gameState.id,
      playerRole,
      currentTurn: this.gameState.currentTurn,
      gamePhase: this.gameState.phase,
      gameState: this.gameState.gameState,
      pieces: this.gameState.pieces,
      capturedPieces: this.gameState.capturedPieces,
      playerBP,
      isInCheck,
      lastMove: this.gameState.lastMove,
      availableRetreats: []
    };
    
    // Add tactical retreat options if applicable
    if (
      this.gameState.phase === GamePhase.TACTICAL_RETREAT &&
      this.gameState.tacticalRetreat &&
      playerColor === this.gameState.currentTurn
    ) {
      dto.availableRetreats = this.gameState.tacticalRetreat.availableRetreats;
      dto.failedCapturePosition = this.gameState.tacticalRetreat.failedCapturePosition;
      dto.originalPosition = this.gameState.tacticalRetreat.originalPosition;
    }
    
    return dto;
  }
} 