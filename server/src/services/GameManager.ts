import { v4 as uuidv4 } from 'uuid';
import { 
  GamePhase, 
  PieceColor, 
  Position,
  GameEventType,
  PIECE_COLOR,
} from '@gambit-chess/shared';

import { IGameRepository } from '../interfaces/IGameRepository';
import { IPlayerSessionManager } from '../interfaces/IPlayerSessionManager';
import { ISpectatorManager } from '../interfaces/ISpectatorManager';
import { IEventDispatcher } from '../interfaces/IEventDispatcher';
import { GameState } from '../types/GameState';
import { IGameConfig } from '../interfaces/IGameConfig';
import { DEFAULT_GAME_CONFIG } from '../config';
import { GameStateService } from './GameStateService';
import { BPManager } from './BPManager';
import { TacticalDetectorService } from './TacticalDetectorService';
import { TacticalRetreatService } from './TacticalRetreatService';

/**
 * Game state snapshot with additional metadata
 */
interface GameSnapshot {
  gameState: GameState;
  lastUpdated: number;
  players: {
    white: string | null;
    black: string | null;
  };
  spectatorCount: number;
}

/**
 * Main service for managing game lifecycles
 * Orchestrates all game components
 */
export class GameManager {
  // Active game state services
  private games: Map<string, GameStateService> = new Map();
  
  // Game snapshots for quick access
  private gameSnapshots: Map<string, GameSnapshot> = new Map();
  
  // Timers for game cleanup
  private gameCleanupTimers: Map<string, NodeJS.Timeout> = new Map();
  
  /**
   * Creates a new GameManager
   * 
   * @param gameRepository Repository for game state persistence
   * @param playerSessionManager Manager for player sessions
   * @param spectatorManager Manager for spectator sessions
   * @param eventDispatcher Dispatcher for game events
   * @param tacticalDetector Service for detecting tactical advantages
   */
  constructor(
    private gameRepository: IGameRepository,
    private playerSessionManager: IPlayerSessionManager,
    private spectatorManager: ISpectatorManager,
    private eventDispatcher: IEventDispatcher,
    private tacticalDetector: TacticalDetectorService
  ) {}
  
  /**
   * Creates a new game
   * 
   * @param config Game configuration
   * @returns Unique game identifier
   */
  public async createGame(config: Partial<IGameConfig> = {}): Promise<string> {
    // Merge with default config
    const gameConfig: IGameConfig = {
      ...DEFAULT_GAME_CONFIG,
      ...config
    };
    
    // Generate unique game ID
    const gameId = uuidv4();
    
    // Create game components
    const bpManager = new BPManager(gameConfig.initialBpPool, this.tacticalDetector);
    const tacticalRetreatService = new TacticalRetreatService();
    const gameStateService = new GameStateService(
      gameId,
      bpManager,
      tacticalRetreatService,
      gameConfig.initialTimeWhite,
      gameConfig.initialTimeBlack
    );
    
    // Store active game
    this.games.set(gameId, gameStateService);
    
    // Create initial snapshot
    const gameSnapshot: GameSnapshot = {
      gameState: this.createGameState(gameStateService),
      lastUpdated: Date.now(),
      players: {
        white: null,
        black: null
      },
      spectatorCount: 0
    };
    
    this.gameSnapshots.set(gameId, gameSnapshot);
    
    // Persist game state
    await this.gameRepository.saveGame(gameId, gameSnapshot.gameState);
    
    // Emit game created event
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.GAME_CREATED, {
      gameId,
      created: Date.now(),
      config: gameConfig
    });
    
    return gameId;
  }
  
  /**
   * Adds a player to a game
   * 
   * @param gameId Unique game identifier
   * @param playerId Unique player identifier
   * @param preferredColor Player's preferred color (optional)
   * @returns Assigned color or null if failed
   */
  public async addPlayerToGame(
    gameId: string,
    playerId: string,
    preferredColor?: PieceColor
  ): Promise<PieceColor | null> {
    // Verify game exists
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }
    
    // Get game snapshot
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) {
      return null;
    }
    
    // Determine which color to assign
    let assignedColor: PieceColor | null = null;
    
    if (preferredColor) {
      // Check if preferred color is available
      if (preferredColor.equals(PIECE_COLOR('white')) && snapshot.players.white === null) {
        assignedColor = PIECE_COLOR('white');
      } else if (preferredColor.equals(PIECE_COLOR('black')) && snapshot.players.black === null) {
        assignedColor = PIECE_COLOR('black');
      }
    }
    
    // If no preference or preferred color not available, assign any available color
    if (!assignedColor) {
      if (snapshot.players.white === null) {
        assignedColor = PIECE_COLOR('white');
      } else if (snapshot.players.black === null) {
        assignedColor = PIECE_COLOR('black');
      }
    }
    
    // If no color could be assigned, game is full
    if (!assignedColor) {
      return null;
    }
    
    // Assign player to game
    if (!this.playerSessionManager.assignPlayerToGame(playerId, gameId, assignedColor)) {
      return null;
    }
    
    // Update game snapshot
    snapshot.players[`${assignedColor.toString()}` as keyof typeof snapshot.players] = playerId;
    snapshot.lastUpdated = Date.now();
    
    // Update game metadata
    await this.gameRepository.updateGameMetadata(gameId, {
      [`player_${assignedColor}`]: playerId
    });
    
    // Send player joined event
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.PLAYER_JOINED, {
      gameId,
      playerId,
      color: assignedColor,
      playerInfo: this.playerSessionManager.getPlayerSession(playerId)
    });
    
    // Check if game should start (both players joined)
    if (snapshot.players.white !== null && snapshot.players.black !== null) {
      await this.startGame(gameId);
    }
    
    return assignedColor;
  }
  
  /**
   * Starts a game
   * 
   * @param gameId Unique game identifier
   * @returns Success indicator
   */
  private async startGame(gameId: string): Promise<boolean> {
    const game = this.games.get(gameId);
    if (!game) {
      return false;
    }
    
    // Get game snapshot
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot || !snapshot.players.white || !snapshot.players.black) {
      return false;
    }
    
    // Start game
    game.startGame();
    
    // Update snapshot
    snapshot.gameState = this.createGameState(game);
    snapshot.lastUpdated = Date.now();
    
    // Persist updated state
    await this.gameRepository.saveGame(gameId, snapshot.gameState);
    
    // Send game started event with filtered game states for each player
    const whiteState = game.createGameStateDTO(PIECE_COLOR('white'));
    const blackState = game.createGameStateDTO(PIECE_COLOR('black'));
    
    this.eventDispatcher.dispatchToPlayers(
      gameId,
      GameEventType.GAME_STARTED,
      { gameId, state: whiteState },
      { gameId, state: blackState }
    );
    
    // Send spectator view
    const spectatorState = game.createGameStateDTO(null);
    this.eventDispatcher.dispatchToSpectators(gameId, GameEventType.GAME_STARTED, {
      gameId,
      state: spectatorState
    });
    
    return true;
  }
  
  /**
   * Processes a move in a game
   * 
   * @param gameId Unique game identifier
   * @param playerId Unique player identifier
   * @param from Starting position
   * @param to Destination position
   * @returns Move result
   */
  public async processMove(
    gameId: string,
    playerId: string,
    from: Position,
    to: Position
  ): Promise<{
    success: boolean;
    error?: string;
    isCapture?: boolean;
    capturedPiece?: any;
    checkDetected?: boolean;
  }> {
    // Verify game exists
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }
    
    // Verify player is in the game
    const playerColor = this.getPlayerColor(gameId, playerId);
    if (!playerColor) {
      return { success: false, error: 'Player not in game' };
    }
    
    // Process the move through game state service
    const moveResult = game.processMove(from, to, playerColor);
    
    // If successful, update game state
    if (moveResult.success) {
      // Update snapshot
      const snapshot = this.gameSnapshots.get(gameId)!;
      snapshot.gameState = this.createGameState(game);
      snapshot.lastUpdated = Date.now();
      
      // Save game state
      await this.gameRepository.saveGame(gameId, snapshot.gameState);
      
      // Send state updates to players with appropriate filtering
      this.sendGameStateUpdates(gameId, game);
    }
    
    // Notify players of move result
    this.eventDispatcher.dispatchToGame(gameId, GameEventType.MOVE_RESULT, {
      gameId,
      result: moveResult,
      from,
      to,
      playerColor
    });
    
    return moveResult;
  }
  
  /**
   * Processes a BP allocation for a duel
   * 
   * @param gameId Unique game identifier
   * @param playerId Unique player identifier
   * @param bpAmount Amount of BP to allocate
   * @returns Success indicator
   */
  public async processBpAllocation(
    gameId: string,
    playerId: string,
    bpAmount: number
  ): Promise<boolean> {
    // Verify game exists
    const game = this.games.get(gameId);
    if (!game) {
      return false;
    }
    
    // Verify player is in the game
    const playerColor = this.getPlayerColor(gameId, playerId);
    if (!playerColor) {
      return false;
    }
    
    // Process allocation
    const result = game.processBpAllocation(playerColor, bpAmount);
    
    // If allocation completed the duel, update game state
    if (result.duelComplete) {
      // Update snapshot
      const snapshot = this.gameSnapshots.get(gameId)!;
      snapshot.gameState = this.createGameState(game);
      snapshot.lastUpdated = Date.now();
      
      // Save game state
      await this.gameRepository.saveGame(gameId, snapshot.gameState);
      
      // Send duel outcome to players
      this.eventDispatcher.dispatchToAll(gameId, GameEventType.DUEL_OUTCOME, {
        gameId,
        outcome: result.outcome
      });
      
      // Send updated game states
      this.sendGameStateUpdates(gameId, game);
      
      // Check for tactical retreat options
      if (game.getCurrentPhase() === GamePhase.TACTICAL_RETREAT) {
        const retreatOptions = game.createRetreatOptionsDTO();
        if (retreatOptions) {
          // Get the player who needs to retreat
          const attackerColor = result.outcome!.attacker;
          const attackerId = this.getPlayerId(gameId, attackerColor);
          
          if (attackerId) {
            this.eventDispatcher.dispatchToPlayer(attackerId, GameEventType.RETREAT_OPTIONS, retreatOptions);
          }
        }
      }
    }
    
    return result.success;
  }
  
  /**
   * Processes a tactical retreat selection
   * 
   * @param gameId Unique game identifier
   * @param playerId Unique player identifier
   * @param retreatPosition Position to retreat to
   * @returns Success indicator
   */
  public async processRetreatSelection(
    gameId: string,
    playerId: string,
    retreatPosition: Position
  ): Promise<boolean> {
    // Verify game exists
    const game = this.games.get(gameId);
    if (!game) {
      return false;
    }
    
    // Verify player is in the game
    const playerColor = this.getPlayerColor(gameId, playerId);
    if (!playerColor) {
      return false;
    }
    
    // Process retreat
    const result = game.processRetreatWithDetails(playerColor, retreatPosition);
    
    if (result.success) {
      // Update snapshot
      const snapshot = this.gameSnapshots.get(gameId)!;
      snapshot.gameState = this.createGameState(game);
      snapshot.lastUpdated = Date.now();
      
      // Save game state
      await this.gameRepository.saveGame(gameId, snapshot.gameState);
      
      // Send retreat confirmed event
      this.eventDispatcher.dispatchToAll(gameId, GameEventType.RETREAT_SELECTED, {
        gameId,
        playerColor,
        position: retreatPosition,
        cost: result.cost
      });
      
      // Send updated game states
      this.sendGameStateUpdates(gameId, game);
    }
    
    return result.success;
  }
  
  /**
   * Adds a spectator to a game
   * 
   * @param gameId Unique game identifier
   * @param spectatorId Unique spectator identifier
   * @returns Success indicator
   */
  public async addSpectator(gameId: string, spectatorId: string): Promise<boolean> {
    // Verify game exists
    const game = this.games.get(gameId);
    if (!game) {
      return false;
    }
    
    // Add spectator
    if (!this.spectatorManager.addSpectator(spectatorId, gameId)) {
      return false;
    }
    
    // Update spectator count in snapshot
    const snapshot = this.gameSnapshots.get(gameId)!;
    snapshot.spectatorCount = this.spectatorManager.getSpectators(gameId).length;
    
    // Send spectator joined event
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.SPECTATOR_JOINED, {
      gameId,
      spectatorId,
      totalSpectators: snapshot.spectatorCount
    });
    
    // Send current game state to spectator
    const spectatorState = game.createGameStateDTO(null);
    this.eventDispatcher.dispatchToPlayer(spectatorId, GameEventType.GAME_STATE_UPDATE, {
      gameId,
      state: spectatorState
    });
    
    return true;
  }
  
  /**
   * Removes a spectator from a game
   * 
   * @param spectatorId Unique spectator identifier
   * @returns Success indicator
   */
  public async removeSpectator(spectatorId: string): Promise<boolean> {
    // Get the game the spectator is watching
    const gameId = this.spectatorManager.getSpectatedGame(spectatorId);
    if (!gameId) {
      return false;
    }
    
    // Verify game exists
    if (!this.games.has(gameId)) {
      return false;
    }
    
    // Remove spectator
    if (!this.spectatorManager.removeSpectator(spectatorId)) {
      return false;
    }
    
    // Update spectator count in snapshot
    const snapshot = this.gameSnapshots.get(gameId)!;
    snapshot.spectatorCount = this.spectatorManager.getSpectators(gameId).length;
    
    // Send spectator left event
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.SPECTATOR_LEFT, {
      gameId,
      spectatorId,
      totalSpectators: snapshot.spectatorCount
    });
    
    return true;
  }
  
  /**
   * Handles player disconnection
   * 
   * @param playerId Unique player identifier
   */
  public async handlePlayerDisconnected(playerId: string): Promise<void> {
    // Get the game the player is in
    const gameId = this.playerSessionManager.getPlayerGame(playerId);
    if (!gameId) {
      return;
    }
    
    // Mark player as disconnected
    this.playerSessionManager.setPlayerDisconnected(playerId);
    
    // Notify other players
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.PLAYER_DISCONNECTED, {
      gameId,
      playerId
    });
    
    // Set a timer to handle game abandonment if player doesn't reconnect
    const game = this.games.get(gameId);
    if (game) {
      const config = DEFAULT_GAME_CONFIG; // TODO: Get actual game config
      const reconnectionTimer = setTimeout(() => {
        this.handleGameAbandoned(gameId, playerId);
      }, config.reconnectionWindow);
      
      this.gameCleanupTimers.set(`${gameId}:${playerId}`, reconnectionTimer);
    }
  }
  
  /**
   * Handles player reconnection
   * 
   * @param playerId Unique player identifier
   * @returns Success indicator
   */
  public async handlePlayerReconnected(playerId: string): Promise<boolean> {
    // Get the game the player is in
    const gameId = this.playerSessionManager.getPlayerGame(playerId);
    if (!gameId) {
      return false;
    }
    
    // Clear any pending abandonment timers
    const timerKey = `${gameId}:${playerId}`;
    if (this.gameCleanupTimers.has(timerKey)) {
      clearTimeout(this.gameCleanupTimers.get(timerKey)!);
      this.gameCleanupTimers.delete(timerKey);
    }
    
    // Mark player as connected
    this.playerSessionManager.setPlayerConnected(playerId);
    
    // Get player color
    const playerColor = this.getPlayerColor(gameId, playerId);
    if (!playerColor) {
      return false;
    }
    
    // Get game
    const game = this.games.get(gameId);
    if (!game) {
      return false;
    }
    
    // Send current game state to player
    const gameState = game.createGameStateDTO(playerColor);
    this.eventDispatcher.dispatchToPlayer(playerId, GameEventType.GAME_STATE_UPDATE, {
      gameId,
      state: gameState
    });
    
    // Notify other players of reconnection
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.PLAYER_RECONNECTED, {
      gameId,
      playerId
    });
    
    return true;
  }
  
  /**
   * Handles game abandonment due to player disconnection
   * 
   * @param gameId Unique game identifier
   * @param disconnectedPlayerId Player who disconnected
   */
  private async handleGameAbandoned(gameId: string, disconnectedPlayerId: string): Promise<void> {
    // Get game
    const game = this.games.get(gameId);
    if (!game) {
      return;
    }
    
    // Get player color
    const playerColor = this.getPlayerColor(gameId, disconnectedPlayerId);
    if (!playerColor) {
      return;
    }
    
    // Get opponent
    const opponentColor = playerColor.equals(PIECE_COLOR('white')) ? PIECE_COLOR('black') : PIECE_COLOR('white');
    const opponentId = this.getPlayerId(gameId, opponentColor);
    
    // End the game with the opponent as winner
    game.endGame({
      result: 'abandoned',
      winner: opponentColor,
      reason: 'Opponent disconnected'
    });
    
    // Update snapshot
    const snapshot = this.gameSnapshots.get(gameId)!;
    snapshot.gameState = this.createGameState(game);
    snapshot.lastUpdated = Date.now();
    
    // Save game state
    await this.gameRepository.saveGame(gameId, snapshot.gameState);
    
    // Notify all players and spectators
    this.eventDispatcher.dispatchToAll(gameId, GameEventType.GAME_ABANDONED, {
      gameId,
      disconnectedPlayer: {
        id: disconnectedPlayerId,
        color: playerColor
      },
      winner: opponentColor
    });
    
    // Send final game states
    this.sendGameStateUpdates(gameId, game);
    
    // Clean up game resources after a delay
    setTimeout(() => {
      this.cleanupGame(gameId);
    }, 24 * 60 * 60 * 1000); // Clean up after 24 hours
  }
  
  /**
   * Cleans up game resources
   * 
   * @param gameId Unique game identifier
   */
  private async cleanupGame(gameId: string): Promise<void> {
    // Remove game
    this.games.delete(gameId);
    this.gameSnapshots.delete(gameId);
    
    // Clean up any remaining timers
    for (const [key, timer] of this.gameCleanupTimers.entries()) {
      if (key.startsWith(`${gameId}:`)) {
        clearTimeout(timer);
        this.gameCleanupTimers.delete(key);
      }
    }
    
    // Note: Game state remains in repository for historical purposes
  }
  
  /**
   * Gets all active games
   * 
   * @returns Array of game snapshots
   */
  public getActiveGames(): GameSnapshot[] {
    return Array.from(this.gameSnapshots.values());
  }
  
  /**
   * Gets a game by ID
   * 
   * @param gameId Unique game identifier
   * @returns Game snapshot or null if not found
   */
  public getGame(gameId: string): GameSnapshot | null {
    return this.gameSnapshots.get(gameId) || null;
  }
  
  /**
   * Creates a full game state from a game state service
   * 
   * @param game Game state service
   * @returns Complete game state
   */
  private createGameState(game: GameStateService): GameState {
    const state = game.getGameState();
    
    return {
      gameId: state.gameId,
      board: state.board,
      currentPhase: state.currentPhase,
      playerToMove: state.playerToMove,
      gameResult: state.gameResult,
      moveHistory: state.moveHistory,
      createdAt: this.gameSnapshots.get(state.gameId)?.gameState.createdAt || Date.now(),
      updatedAt: Date.now(),
      whiteTimeRemaining: 0, // TODO: Get actual time
      blackTimeRemaining: 0, // TODO: Get actual time
      activeTimer: null, // TODO: Get actual timer
      sequenceNumber: 0, // TODO: Get actual sequence
      whiteBpPool: 0, // TODO: Get actual BP
      blackBpPool: 0, // TODO: Get actual BP
      metadata: {
        // Add any custom metadata
      }
    };
  }
  
  /**
   * Sends game state updates to all players and spectators
   * 
   * @param gameId Unique game identifier
   * @param game Game state service
   */
  private sendGameStateUpdates(gameId: string, game: GameStateService): void {
    // Create filtered game states for each player
    const whiteState = game.createGameStateDTO(PIECE_COLOR('white'));
    const blackState = game.createGameStateDTO(PIECE_COLOR('black'));
    const spectatorState = game.createGameStateDTO(null);
    
    // Get player IDs
    const whiteId = this.getPlayerId(gameId, PIECE_COLOR('white'));
    const blackId = this.getPlayerId(gameId, PIECE_COLOR('black'));
    
    // Send to white player
    if (whiteId && this.playerSessionManager.isPlayerConnected(whiteId)) {
      this.eventDispatcher.dispatchToPlayer(whiteId, GameEventType.GAME_STATE_UPDATE, {
        gameId,
        state: whiteState
      });
    }
    
    // Send to black player
    if (blackId && this.playerSessionManager.isPlayerConnected(blackId)) {
      this.eventDispatcher.dispatchToPlayer(blackId, GameEventType.GAME_STATE_UPDATE, {
        gameId,
        state: blackState
      });
    }
    
    // Send to spectators
    this.eventDispatcher.dispatchToSpectators(gameId, GameEventType.GAME_STATE_UPDATE, {
      gameId,
      state: spectatorState
    });
  }
  
  /**
   * Gets a player's color in a game
   * 
   * @param gameId Unique game identifier
   * @param playerId Unique player identifier
   * @returns Player color or null if not in game
   */
  private getPlayerColor(gameId: string, playerId: string): PieceColor | null {
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) {
      return null;
    }
    
    if (snapshot.players.white === playerId) {
      return PIECE_COLOR('white');
    } else if (snapshot.players.black === playerId) {
      return PIECE_COLOR('black');
    }
    
    return null;
  }
  
  /**
   * Gets the player ID for a specific color in a game
   * 
   * @param gameId Unique game identifier
   * @param color Player color
   * @returns Player ID or null if not found
   */
  private getPlayerId(gameId: string, color: PieceColor): string | null {
    const snapshot = this.gameSnapshots.get(gameId);
    if (!snapshot) {
      return null;
    }
    
    return snapshot.players[`${color.toString()}` as keyof typeof snapshot.players];
  }
} 