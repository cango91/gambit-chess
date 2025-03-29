import { IGameRepository } from '../interfaces/IGameRepository';
import { IPlayerSessionManager } from '../interfaces/IPlayerSessionManager';
import { ISpectatorManager } from '../interfaces/ISpectatorManager';
import { IEventDispatcher } from '../interfaces/IEventDispatcher';

import { InMemoryGameRepository } from '../repositories/InMemoryGameRepository';
import { RedisGameRepository } from '../repositories/RedisGameRepository';
import { PlayerSessionManager } from '../managers/PlayerSessionManager';
import { SpectatorManager } from '../managers/SpectatorManager';
import { NoOpEventDispatcher } from '../dispatchers/NoOpEventDispatcher';

import { TacticalDetectorService } from './TacticalDetectorService';
import { GameManager } from './GameManager';

import { REDIS_OPTIONS } from '../config';

/**
 * Factory for creating service instances
 * Handles dependency injection and configuration
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  
  // Service instances
  private gameRepository: IGameRepository | null = null;
  private playerSessionManager: IPlayerSessionManager | null = null;
  private spectatorManager: ISpectatorManager | null = null;
  private eventDispatcher: IEventDispatcher | null = null;
  private tacticalDetector: TacticalDetectorService | null = null;
  private gameManager: GameManager | null = null;
  
  /**
   * Gets the singleton instance
   */
  public static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }
  
  /**
   * Creates or returns the game repository
   * @param useRedis Whether to use Redis or in-memory storage
   * @returns Game repository instance
   */
  public getGameRepository(useRedis: boolean = true): IGameRepository {
    if (!this.gameRepository) {
      if (useRedis) {
        this.gameRepository = new RedisGameRepository(REDIS_OPTIONS);
      } else {
        this.gameRepository = new InMemoryGameRepository();
      }
    }
    return this.gameRepository;
  }
  
  /**
   * Creates or returns the player session manager
   * @returns Player session manager instance
   */
  public getPlayerSessionManager(): IPlayerSessionManager {
    if (!this.playerSessionManager) {
      this.playerSessionManager = new PlayerSessionManager();
    }
    return this.playerSessionManager;
  }
  
  /**
   * Creates or returns the spectator manager
   * @returns Spectator manager instance
   */
  public getSpectatorManager(): ISpectatorManager {
    if (!this.spectatorManager) {
      this.spectatorManager = new SpectatorManager();
    }
    return this.spectatorManager;
  }
  
  /**
   * Creates or returns the event dispatcher
   * @returns Event dispatcher instance
   */
  public getEventDispatcher(): IEventDispatcher {
    if (!this.eventDispatcher) {
      // TODO: Replace with actual WebSocket dispatcher when implemented
      this.eventDispatcher = new NoOpEventDispatcher();
    }
    return this.eventDispatcher;
  }
  
  /**
   * Creates or returns the tactical detector service
   * @returns Tactical detector service instance
   */
  public getTacticalDetectorService(): TacticalDetectorService {
    if (!this.tacticalDetector) {
      this.tacticalDetector = new TacticalDetectorService();
    }
    return this.tacticalDetector;
  }
  
  /**
   * Creates or returns the game manager
   * @param useRedis Whether to use Redis for game state persistence
   * @returns Game manager instance
   */
  public getGameManager(useRedis: boolean = true): GameManager {
    if (!this.gameManager) {
      this.gameManager = new GameManager(
        this.getGameRepository(useRedis),
        this.getPlayerSessionManager(),
        this.getSpectatorManager(),
        this.getEventDispatcher(),
        this.getTacticalDetectorService()
      );
    }
    return this.gameManager;
  }
  
  /**
   * Resets all service instances
   * Useful for testing or when configuration changes
   */
  public reset(): void {
    this.gameRepository = null;
    this.playerSessionManager = null;
    this.spectatorManager = null;
    this.eventDispatcher = null;
    this.tacticalDetector = null;
    this.gameManager = null;
  }
  
  /**
   * Cleans up resources when shutting down
   */
  public async cleanup(): Promise<void> {
    // Close Redis connections if using Redis
    if (this.gameRepository instanceof RedisGameRepository) {
      await (this.gameRepository as RedisGameRepository).close();
    }
    
    // Reset all instances
    this.reset();
  }
} 