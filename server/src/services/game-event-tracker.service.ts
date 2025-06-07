/**
 * Game Event Tracker Service
 * 
 * Comprehensive tracking of ALL server-side events for debugging and bug reporting.
 * Maintains detailed event logs with timestamps for each game session.
 * Events are temporarily persisted (game-end + 1hr) for post-game bug reports.
 */

import { 
  GameEvent, 
  BPCalculationReport,
  GameEventType,
  BaseGameState 
} from '@gambit-chess/shared';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export interface ServerEvent {
  id: string;
  gameId: string;
  timestamp: number;
  type: 'incoming' | 'outgoing' | 'internal' | 'bp_calculation' | 'error';
  category: string;
  action: string;
  playerId?: string;
  data: any;
  result?: any;
  error?: string;
  processingTime?: number;
}

export interface GameSessionLog {
  gameId: string;
  startTime: number;
  endTime?: number;
  events: ServerEvent[];
  bpCalculationHistory: BPCalculationReport[];
  playerActions: Array<{
    timestamp: number;
    playerId: string;
    action: string;
    data: any;
    result: 'success' | 'error';
    error?: string;
  }>;
  networkEvents: Array<{
    timestamp: number;
    type: 'websocket' | 'http';
    direction: 'incoming' | 'outgoing';
    endpoint?: string;
    playerId?: string;
    data: any;
    latency?: number;
  }>;
  gameStateSnapshots: Array<{
    timestamp: number;
    trigger: string;
    fen: string;
    turn: string;
    moveCount: number;
    gameStatus: string;
    bpPools: Record<string, number>;
  }>;
}

export class GameEventTrackerService {
  private static readonly LOGS_DIR = path.join(process.cwd(), 'data', 'game-logs');
  private static readonly CLEANUP_DELAY = 60 * 60 * 1000; // 1 hour after game end
  
  // In-memory game session logs
  private static activeSessions = new Map<string, GameSessionLog>();
  
  // Cleanup timers for finished games
  private static cleanupTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Initialize the event tracker
   */
  static async initialize(): Promise<void> {
    if (!existsSync(this.LOGS_DIR)) {
      await mkdir(this.LOGS_DIR, { recursive: true });
    }
    console.log('📊 Game Event Tracker Service initialized');
  }

  /**
   * Start tracking a new game session
   */
  static startGameSession(gameId: string): void {
    const sessionLog: GameSessionLog = {
      gameId,
      startTime: Date.now(),
      events: [],
      bpCalculationHistory: [],
      playerActions: [],
      networkEvents: [],
      gameStateSnapshots: []
    };
    
    this.activeSessions.set(gameId, sessionLog);
    
    this.logEvent(gameId, {
      type: 'internal',
      category: 'session',
      action: 'game_session_started',
      data: { gameId }
    });
    
    console.log(`📊 Started tracking game session: ${gameId}`);
  }

  /**
   * End a game session and schedule cleanup
   */
  static endGameSession(gameId: string): void {
    const session = this.activeSessions.get(gameId);
    if (!session) return;
    
    session.endTime = Date.now();
    
    this.logEvent(gameId, {
      type: 'internal',
      category: 'session',
      action: 'game_session_ended',
      data: { 
        gameId,
        duration: session.endTime - session.startTime,
        totalEvents: session.events.length
      }
    });
    
    // Save to disk
    this.persistSessionLog(gameId);
    
    // Schedule cleanup after delay
    const cleanupTimer = setTimeout(() => {
      this.cleanupSessionLog(gameId);
    }, this.CLEANUP_DELAY);
    
    this.cleanupTimers.set(gameId, cleanupTimer);
    
    console.log(`📊 Ended game session: ${gameId} (cleanup in ${this.CLEANUP_DELAY/1000/60} minutes)`);
  }

  /**
   * Log a server event
   */
  static logEvent(gameId: string, eventData: Omit<ServerEvent, 'id' | 'gameId' | 'timestamp'>): void {
    const session = this.activeSessions.get(gameId);
    if (!session) {
      // Game not being tracked, create minimal session
      this.startGameSession(gameId);
      return this.logEvent(gameId, eventData);
    }
    
    const event: ServerEvent = {
      id: `${gameId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gameId,
      timestamp: Date.now(),
      ...eventData
    };
    
    session.events.push(event);
    
    // Log to console for real-time monitoring
    console.log(`📊 [${gameId}] ${event.category}.${event.action}:`, 
      event.type === 'error' ? `ERROR: ${event.error}` : 'OK');
  }

  /**
   * Log incoming player action
   */
  static logPlayerAction(
    gameId: string, 
    playerId: string, 
    action: string, 
    data: any, 
    result: 'success' | 'error',
    error?: string
  ): void {
    const session = this.activeSessions.get(gameId);
    if (!session) return;
    
    session.playerActions.push({
      timestamp: Date.now(),
      playerId,
      action,
      data,
      result,
      error
    });
    
    this.logEvent(gameId, {
      type: 'incoming',
      category: 'player_action',
      action,
      playerId,
      data,
      result,
      error
    });
  }

  /**
   * Log network event (WebSocket/HTTP)
   */
  static logNetworkEvent(
    gameId: string,
    type: 'websocket' | 'http',
    direction: 'incoming' | 'outgoing',
    data: any,
    playerId?: string,
    endpoint?: string,
    latency?: number
  ): void {
    const session = this.activeSessions.get(gameId);
    if (!session) return;
    
    session.networkEvents.push({
      timestamp: Date.now(),
      type,
      direction,
      endpoint,
      playerId,
      data,
      latency
    });
    
    this.logEvent(gameId, {
      type: direction,
      category: 'network',
      action: `${type}_${direction}`,
      playerId,
      data: { endpoint, latency, dataSize: JSON.stringify(data).length }
    });
  }

  /**
   * Log BP calculation with detailed report
   */
  static logBPCalculation(gameId: string, report: BPCalculationReport, trigger: string): void {
    const session = this.activeSessions.get(gameId);
    if (!session) return;
    
    session.bpCalculationHistory.push(report);
    
    this.logEvent(gameId, {
      type: 'bp_calculation',
      category: 'bp_calculation',
      action: trigger,
      data: {
        totalBP: report.regenerationDetails?.totalBP || 0,
        tactics: report.tactics || [],
        calculationDetails: report.calculations
      }
    });
  }

  /**
   * Log game state snapshot
   */
  static logGameStateSnapshot(gameId: string, gameState: BaseGameState, trigger: string): void {
    const session = this.activeSessions.get(gameId);
    if (!session) return;
    
    session.gameStateSnapshots.push({
      timestamp: Date.now(),
      trigger,
      fen: gameState.chess.fen(),
      turn: gameState.currentTurn,
      moveCount: gameState.moveHistory.length,
      gameStatus: gameState.gameStatus,
      bpPools: {
        white: gameState.whitePlayer.battlePoints,
        black: gameState.blackPlayer.battlePoints
      }
    });
    
    this.logEvent(gameId, {
      type: 'internal',
      category: 'game_state',
      action: `snapshot_${trigger}`,
      data: {
        fen: gameState.chess.fen(),
        moveCount: gameState.moveHistory.length,
        status: gameState.gameStatus
      }
    });
  }

  /**
   * Get session log for bug reporting
   */
  static async getSessionLogForBugReport(gameId: string): Promise<GameSessionLog | null> {
    // Check active sessions first
    const activeSession = this.activeSessions.get(gameId);
    if (activeSession) {
      return { ...activeSession }; // Return copy
    }
    
    // Try to load from disk
    try {
      const filePath = path.join(this.LOGS_DIR, `${gameId}.json`);
      const data = await readFile(filePath, 'utf8');
      return JSON.parse(data) as GameSessionLog;
    } catch (error) {
      console.warn(`Session log not found for game: ${gameId}`);
      return null;
    }
  }

  /**
   * Get session statistics
   */
  static getSessionStats(gameId: string): {
    eventCount: number;
    playerActionCount: number;
    bpCalculationCount: number;
    errorCount: number;
    avgProcessingTime: number;
  } | null {
    const session = this.activeSessions.get(gameId);
    if (!session) return null;
    
    const errorCount = session.events.filter(e => e.type === 'error').length;
    const processingTimes = session.events
      .filter(e => e.processingTime !== undefined)
      .map(e => e.processingTime!);
    
    return {
      eventCount: session.events.length,
      playerActionCount: session.playerActions.length,
      bpCalculationCount: session.bpCalculationHistory.length,
      errorCount,
      avgProcessingTime: processingTimes.length > 0 
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
        : 0
    };
  }

  /**
   * Persist session log to disk
   */
  private static async persistSessionLog(gameId: string): Promise<void> {
    const session = this.activeSessions.get(gameId);
    if (!session) return;
    
    try {
      const filePath = path.join(this.LOGS_DIR, `${gameId}.json`);
      await writeFile(filePath, JSON.stringify(session, null, 2));
      console.log(`📊 Persisted session log: ${gameId}`);
    } catch (error) {
      console.error(`Failed to persist session log for game ${gameId}:`, error);
    }
  }

  /**
   * Cleanup session log after delay
   */
  private static async cleanupSessionLog(gameId: string): Promise<void> {
    try {
      // Remove from memory
      this.activeSessions.delete(gameId);
      
      // Remove from disk
      const filePath = path.join(this.LOGS_DIR, `${gameId}.json`);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
      
      // Clear cleanup timer
      this.cleanupTimers.delete(gameId);
      
      console.log(`📊 Cleaned up session log: ${gameId}`);
    } catch (error) {
      console.error(`Failed to cleanup session log for game ${gameId}:`, error);
    }
  }

  /**
   * Cancel cleanup for a game (if bug report submitted)
   */
  static cancelCleanup(gameId: string): void {
    const timer = this.cleanupTimers.get(gameId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(gameId);
      console.log(`📊 Cancelled cleanup for game ${gameId} (bug report submitted)`);
    }
  }

  /**
   * Get all active session IDs (for monitoring)
   */
  static getActiveSessionIds(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  /**
   * Get BP calculation history for a player with appropriate privacy filtering
   */
  static async getBPCalculationHistory(gameId: string, playerId: string): Promise<BPCalculationReport[]> {
    const session = this.activeSessions.get(gameId);
    if (!session) return [];
    
    // Get current game state to check game type and player mappings
    const LiveGameService = require('../services/live-game.service').LiveGameService;
    const gameState = await LiveGameService.getGameState(gameId);
    if (!gameState) return [];
    
    // For practice mode, return full history since it's single player
    if (gameState.gameType === 'practice') {
      return session.bpCalculationHistory;
    }
    
    // For competitive modes, apply privacy filtering
    // Only show calculations from moves where the requesting player was the current player
    // This prevents information leakage about opponent's tactical advantages
    return session.bpCalculationHistory.filter((report, index) => {
      // Get corresponding game state snapshot to see who was the current player
      const snapshot = session.gameStateSnapshots[index];
      if (!snapshot) return false;
      
      // Check if the requesting player was the current turn player when this calculation was made
      const currentTurnPlayerId = snapshot.turn === 'w' ? 
        gameState.whitePlayer.id : 
        gameState.blackPlayer.id;
        
      return currentTurnPlayerId === playerId;
    });
  }
}

export default GameEventTrackerService; 