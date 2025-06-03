import { createNewGame, BaseGameState, GameStatus, GambitMove, Player } from '@gambit-chess/shared';
import { prisma } from '../index';
import { Chess } from 'chess.js';
import crypto from 'crypto';
import LiveGameService from './live-game.service';

export interface CreateGameOptions {
  whitePlayerId?: string; // User ID for registered users
  blackPlayerId?: string; // User ID for registered users
  anonymousUserId?: string; // Temp ID for anonymous users
  gameType: 'ai' | 'human' | 'practice'; // Game type
  aiDifficulty?: 'easy' | 'medium' | 'hard'; // For AI games
  colorPreference?: 'white' | 'black' | 'random'; // NEW: Player color choice!
}

export interface GameStateResponse {
  id: string;
  status: GameStatus;
  currentTurn: 'w' | 'b';
  board: string; // FEN string
  moveHistory: GambitMove[];
  whitePlayer: {
    id: string;
    battlePoints: number;
    isAnonymous: boolean;
  };
  blackPlayer: {
    id: string;
    battlePoints: number;
    isAnonymous: boolean;
  };
  check?: boolean;
  checkmate?: boolean;
  stalemate?: boolean;
}

/**
 * Game Management Service
 * Handles game creation via LiveGameService and archived game retrieval
 */
export class GameService {
  /**
   * Create a new game (delegates to LiveGameService)
   */
  static async createGame(options: CreateGameOptions): Promise<{ gameId: string; gameState: GameStateResponse }> {
    const result = await LiveGameService.createGame({
      whitePlayerId: options.whitePlayerId,
      blackPlayerId: options.blackPlayerId,
      anonymousUserId: options.anonymousUserId,
      gameType: options.gameType,
      aiDifficulty: options.aiDifficulty,
      colorPreference: options.colorPreference,
    });

    return {
      gameId: result.gameId,
      gameState: this.formatGameState(result.gameState, !!options.anonymousUserId, options.gameType === 'ai'),
    };
  }

  /**
   * Get current game state (checks Redis first, then database)
   */
  static async getGameState(gameId: string, requestingUserId?: string): Promise<GameStateResponse | null> {
    // First try to get from Redis (live games)
    const liveGameState = await LiveGameService.getGameState(gameId);
    if (liveGameState) {
      // Check authorization for live game
      const isAuthorized = this.isUserAuthorized(liveGameState, requestingUserId);
      return this.formatGameStateWithAuth(liveGameState, isAuthorized, requestingUserId);
    }

    // If not in Redis, try database (archived games)
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
    });

    if (!game) {
      return null;
    }

    // Check authorization for archived game
    const isAuthorized = !requestingUserId || 
                        game.whitePlayerId === requestingUserId || 
                        game.blackPlayerId === requestingUserId ||
                        game.anonymousUserId === requestingUserId;

    // Reconstruct game state from database
    const chess = new Chess();
    const moves = (game.moveHistory as unknown) as GambitMove[];
    
    // Apply moves to get current position
    for (const move of moves) {
      try {
        chess.move(move.san || `${move.from}${move.to}`);
      } catch (error) {
        console.error('Error applying move:', move, error);
        break;
      }
    }

    const initialConfig = game.initialConfig as any;
    const battlePoints = initialConfig?.initialBattlePoints || 12;

    return {
      id: game.id,
      status: this.convertFromPrismaGameStatus(game.status),
      currentTurn: chess.turn(),
      board: chess.fen(),
      moveHistory: moves,
      whitePlayer: {
        id: game.whitePlayer?.username || 'Anonymous',
        battlePoints: isAuthorized ? battlePoints : 0, // Hide BP for unauthorized users
        isAnonymous: !game.whitePlayerId,
      },
      blackPlayer: {
        id: game.blackPlayer?.username || 'AI',
        battlePoints: isAuthorized ? battlePoints : 0, // Hide BP for unauthorized users
        isAnonymous: !game.blackPlayerId,
      },
      check: chess.inCheck(),
      checkmate: chess.isCheckmate(),
      stalemate: chess.isStalemate(),
    };
  }

  /**
   * Get games for a user (both live and archived)
   */
  static async getUserGames(userId: string, isAnonymous: boolean = false): Promise<GameStateResponse[]> {
    const whereClause = isAnonymous 
      ? { anonymousUserId: userId }
      : {
          OR: [
            { whitePlayerId: userId },
            { blackPlayerId: userId },
          ],
        };

    const games = await prisma.game.findMany({
      where: whereClause,
      include: {
        whitePlayer: true,
        blackPlayer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return Promise.all(games.map(async (game) => {
      const gameState = await this.getGameState(game.id, userId);
      return gameState!; // We know it exists since we just queried it
    }));
  }

  /**
   * Join an existing game (delegates to LiveGameService)
   */
  static async joinGame(gameId: string, playerId: string, isAnonymous: boolean = false): Promise<GameStateResponse | null> {
    const gameState = await LiveGameService.joinGame(gameId, playerId, isAnonymous);
    
    if (!gameState) {
      return null;
    }

    return this.formatGameState(gameState, isAnonymous, false);
  }

  /**
   * Convert Prisma GameStatus to shared GameStatus
   */
  private static convertFromPrismaGameStatus(status: string): GameStatus {
    switch (status) {
      case 'WAITING':
        return GameStatus.WAITING_FOR_PLAYERS;
      case 'IN_PROGRESS':
        return GameStatus.IN_PROGRESS;
      case 'COMPLETED':
        return GameStatus.DRAW; // Could be more specific based on GameResult/Reason
      case 'ABANDONED':
        return GameStatus.ABANDONED;
      default:
        return GameStatus.IN_PROGRESS;
    }
  }

  /**
   * Check if user is authorized to see full game state
   */
  private static isUserAuthorized(gameState: BaseGameState, requestingUserId?: string): boolean {
    return !requestingUserId || 
           gameState.whitePlayer.id === requestingUserId || 
           gameState.blackPlayer.id === requestingUserId;
  }

  /**
   * Format BaseGameState with authorization checks
   */
  private static formatGameStateWithAuth(gameState: BaseGameState, isAuthorized: boolean, requestingUserId?: string): GameStateResponse {
    return {
      id: gameState.id,
      status: gameState.gameStatus,
      currentTurn: gameState.currentTurn,
      board: gameState.chess.fen(),
      moveHistory: gameState.moveHistory,
      whitePlayer: {
        id: gameState.whitePlayer.id === requestingUserId || isAuthorized ? gameState.whitePlayer.id : 'Anonymous',
        battlePoints: isAuthorized ? gameState.whitePlayer.battlePoints : 0,
        isAnonymous: gameState.whitePlayer.id.includes('anonymous') || gameState.whitePlayer.id.includes('practice'),
      },
      blackPlayer: {
        id: gameState.blackPlayer.id === requestingUserId || isAuthorized ? gameState.blackPlayer.id : (gameState.blackPlayer.id === 'ai' ? 'AI' : 'Player'),
        battlePoints: isAuthorized ? gameState.blackPlayer.battlePoints : 0,
        isAnonymous: gameState.blackPlayer.id === 'ai' || gameState.blackPlayer.id.includes('anonymous'),
      },
      check: gameState.chess.inCheck(),
      checkmate: gameState.chess.isCheckmate(),
      stalemate: gameState.chess.isStalemate(),
    };
  }

  /**
   * Format BaseGameState to GameStateResponse
   */
  private static formatGameState(gameState: BaseGameState, whiteIsAnonymous: boolean, blackIsAI: boolean): GameStateResponse {
    return {
      id: gameState.id,
      status: gameState.gameStatus,
      currentTurn: gameState.currentTurn,
      board: gameState.chess.fen(),
      moveHistory: gameState.moveHistory,
      whitePlayer: {
        id: whiteIsAnonymous ? 'Anonymous' : gameState.whitePlayer.id,
        battlePoints: gameState.whitePlayer.battlePoints,
        isAnonymous: whiteIsAnonymous,
      },
      blackPlayer: {
        id: blackIsAI ? 'AI' : gameState.blackPlayer.id,
        battlePoints: gameState.blackPlayer.battlePoints,
        isAnonymous: blackIsAI,
      },
      check: gameState.chess.inCheck(),
      checkmate: gameState.chess.isCheckmate(),
      stalemate: gameState.chess.isStalemate(),
    };
  }

  /**
   * Get all games waiting for players (for game discovery)
   */
  static async getWaitingGames(): Promise<GameStateResponse[]> {
    const waitingGames = await LiveGameService.getWaitingGames();
    
    return waitingGames.map(gameState => {
      // Public view - hide BP and show minimal info for discovery
      return this.formatGameState(gameState, true, gameState.blackPlayer.id === 'ai');
    });
  }
}

export default GameService; 