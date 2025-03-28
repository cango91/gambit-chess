import { v4 as uuidv4 } from 'uuid';
import {
  BoardSnapshot,
  GamePhase,
  GameResult,
  PieceColor,
  Position,
  GameStateDTO,
  ChessPiece,
  Player as SharedPlayer,
  TacticalRetreatOption,
  calculateTacticalRetreats
} from '@gambit-chess/shared';
import redisService from './redis';
import env from '../config/env';
import { Game, Player, Spectator, addPlayer, addSpectator, createGame, isGameOver, removeSpectator } from '../models/Game';

/**
 * Game Manager Service
 * 
 * Responsible for managing game sessions, state updates, and enforcing game rules.
 * Acts as the server-authoritative source of truth for game state.
 */
export class GameManager {
  private readonly gamePrefix: string = 'game:';
  private readonly playerPrefix: string = 'player:';
  
  /**
   * Creates a new game session
   * @param timeLimit Time limit in seconds
   * @returns New game object
   */
  async createGame(timeLimit: number = env.CHESS_TIMEOUT): Promise<Game> {
    const game = createGame(timeLimit, env.INITIAL_BP, env.MAX_BP_ALLOCATION);
    
    // Initialize chess board
    const board = new BoardSnapshot(true);
    game.state.boardState = board;
    
    // Store initial board state for tactical advantage detection
    game.boardStates.push(board.clone());
    
    // Save game to Redis
    await this.saveGame(game);
    
    return game;
  }
  
  /**
   * Adds a player to a game
   * @param gameId Game ID
   * @param playerId Player ID
   * @param playerName Player name
   * @returns Player object if successful, null if game full
   */
  async addPlayer(gameId: string, playerId: string, playerName: string): Promise<Player | null> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    
    const player = addPlayer(game, playerId, playerName);
    if (player) {
      // Save player reference to Redis
      await redisService.set(
        `${this.playerPrefix}${playerId}`,
        { gameId, color: player.color },
        env.SESSION_TTL
      );
      
      // Update game in Redis
      await this.saveGame(game);
    }
    
    return player;
  }
  
  /**
   * Adds a spectator to a game
   * @param gameId Game ID
   * @param spectatorId Spectator ID
   * @param spectatorName Spectator name
   * @param socketId Socket ID
   * @returns Spectator object
   */
  async addSpectator(
    gameId: string,
    spectatorId: string,
    spectatorName: string,
    socketId: string
  ): Promise<Spectator> {
    const game = await this.getGame(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    
    const spectator = addSpectator(game, spectatorId, spectatorName, socketId);
    
    // Update game in Redis
    await this.saveGame(game);
    
    return spectator;
  }
  
  /**
   * Removes a spectator from a game
   * @param gameId Game ID
   * @param spectatorId Spectator ID
   * @returns True if successful
   */
  async removeSpectator(gameId: string, spectatorId: string): Promise<boolean> {
    const game = await this.getGame(gameId);
    if (!game) {
      return false;
    }
    
    const removed = removeSpectator(game, spectatorId);
    if (removed) {
      await this.saveGame(game);
    }
    
    return removed;
  }
  
  /**
   * Gets a game by ID
   * @param gameId Game ID
   * @returns Game object or null if not found
   */
  async getGame(gameId: string): Promise<Game | null> {
    return await redisService.get<Game>(`${this.gamePrefix}${gameId}`);
  }
  
  /**
   * Saves a game to Redis
   * @param game Game to save
   */
  async saveGame(game: Game): Promise<void> {
    await redisService.set(`${this.gamePrefix}${game.id}`, game, env.SESSION_TTL);
  }
  
  /**
   * Updates player's socket ID
   * @param gameId Game ID
   * @param playerId Player ID
   * @param socketId New socket ID
   * @returns True if successful
   */
  async updatePlayerSocket(gameId: string, playerId: string, socketId: string): Promise<boolean> {
    const game = await this.getGame(gameId);
    if (!game) {
      return false;
    }
    
    let found = false;
    
    if (game.players.white?.id === playerId) {
      game.players.white.socketId = socketId;
      game.players.white.connected = true;
      found = true;
    } else if (game.players.black?.id === playerId) {
      game.players.black.socketId = socketId;
      game.players.black.connected = true;
      found = true;
    }
    
    if (found) {
      await this.saveGame(game);
    }
    
    return found;
  }
  
  /**
   * Creates a filtered GameStateDTO for a specific player
   * Follows information visibility rules from domain boundaries
   * @param game Game object
   * @param playerId Player ID (can be null for spectators)
   * @returns Filtered game state DTO
   */
  createGameStateDTO(game: Game, playerId: string | null): GameStateDTO {
    // Create base DTO with common information
    const dto: GameStateDTO = {
      gameId: game.id,
      phase: this.determineGamePhase(game),
      turn: game.state.activeColor,
      pieces: game.state.boardState?.getAllPieces() || [],
      moveNumber: game.state.boardState?.getCurrentTurn() || 1,
      inCheck: game.state.inCheck,
      whiteTimeRemaining: game.players.white?.timeRemaining || 0,
      blackTimeRemaining: game.players.black?.timeRemaining || 0,
      activeTimer: game.timerPaused ? null : game.state.activeColor,
      sequence: Date.now(), // Use timestamp as sequence number
      timestamp: Date.now(),
      players: this.getPlayerDTOs(game),
      spectators: game.spectators.map(s => ({
        id: s.id,
        name: s.name,
      })),
    };
    
    // Add game result if game is over
    if (isGameOver(game)) {
      dto.result = game.state.result;
    }
    
    // Add BP info only for the requesting player
    if (playerId) {
      const playerColor = this.getPlayerColor(game, playerId);
      if (playerColor) {
        const player = playerColor === 'white' ? game.players.white : game.players.black;
        if (player) {
          dto.bp = player.bpPool;
        }
      }
    }
    
    return dto;
  }
  
  /**
   * Gets player color based on player ID
   * @param game Game object
   * @param playerId Player ID
   * @returns Player color or null if not found
   */
  private getPlayerColor(game: Game, playerId: string): PieceColor | null {
    if (game.players.white?.id === playerId) {
      return 'white';
    } else if (game.players.black?.id === playerId) {
      return 'black';
    }
    return null;
  }
  
  /**
   * Converts internal players to DTO players
   * @param game Game object
   * @returns Array of player DTOs
   */
  private getPlayerDTOs(game: Game): SharedPlayer[] {
    const players: SharedPlayer[] = [];
    
    if (game.players.white) {
      players.push({
        id: game.players.white.id,
        name: game.players.white.name,
        color: 'white',
      });
    }
    
    if (game.players.black) {
      players.push({
        id: game.players.black.id,
        name: game.players.black.name,
        color: 'black',
      });
    }
    
    return players;
  }
  
  /**
   * Determines the current game phase
   * @param game Game object
   * @returns Game phase
   */
  private determineGamePhase(game: Game): GamePhase {
    if (isGameOver(game)) {
      return GamePhase.GAME_OVER;
    } else if (game.state.duelInProgress) {
      return GamePhase.DUEL_ALLOCATION;
    } else if (game.state.retreatInProgress) {
      return GamePhase.TACTICAL_RETREAT;
    } else {
      return GamePhase.NORMAL;
    }
  }
}

// Export singleton instance
const gameManager = new GameManager();
export default gameManager; 