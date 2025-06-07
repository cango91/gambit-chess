/**
 * Bug Reporting Service
 * 
 * Handles server-side bug report processing, storage, analysis, and management.
 * Provides automated classification, duplicate detection, and priority scoring.
 */

import { 
  BugReport, 
  BugReportSubmission, 
  BugReportAnalysis, 
  BugCategory, 
  BugSeverity, 
  BugReportStatus,
  GameContext,
  SystemContext,
  UserContext,
  DebugData
} from '@gambit-chess/shared';
import { randomUUID } from 'crypto';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import LiveGameService from './live-game.service';
import GameEventTrackerService from './game-event-tracker.service';
import fs from 'fs';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export class BugReportingService {
  private static readonly REPORTS_DIR = path.join(process.cwd(), 'data', 'bug-reports');
  private static readonly MAX_REPORTS_IN_MEMORY = 100;
  private static reportsCache = new Map<string, BugReport>();

  /**
   * Initialize bug reporting service
   */
  static async initialize(): Promise<void> {
    // Ensure reports directory exists
    if (!existsSync(this.REPORTS_DIR)) {
      await mkdir(this.REPORTS_DIR, { recursive: true });
    }
    
    console.log('🐛 Bug Reporting Service initialized');
  }

  /**
   * Submit a new bug report
   */
  static async submitBugReport(
    submission: BugReportSubmission,
    systemContext: SystemContext,
    userContext: UserContext,
    debugData: DebugData,
    gameId?: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const reportId = randomUUID();
      const timestamp = Date.now();
      
      // Capture game context if gameId provided
      let gameContext: GameContext | undefined;
      if (gameId) {
        gameContext = await this.captureGameContext(gameId);
      }
      
      // Create bug report
      const bugReport: BugReport = {
        id: reportId,
        timestamp,
        title: submission.title,
        description: submission.description,
        category: submission.category,
        severity: submission.severity,
        gameContext,
        systemContext,
        userContext,
        debugData,
        status: BugReportStatus.SUBMITTED
      };
      
      // Perform automated analysis
      const analysis = await this.performAutomatedAnalysis(bugReport);
      
      // Save to disk and cache
      await this.saveBugReport(bugReport, analysis);
      this.reportsCache.set(reportId, bugReport);
      
      // Log for monitoring
      console.log(`🐛 Bug report submitted: ${reportId} - "${submission.title}" (${submission.category}/${submission.severity})`);
      
      return { success: true, reportId };
      
    } catch (error) {
      console.error('Error submitting bug report:', error);
      return { success: false, error: 'Failed to submit bug report' };
    }
  }
  
  /**
   * Get bug report by ID
   */
  static async getBugReport(reportId: string): Promise<BugReport | null> {
    // Check cache first
    if (this.reportsCache.has(reportId)) {
      return this.reportsCache.get(reportId)!;
    }
    
    // Load from disk
    try {
      const filePath = path.join(this.REPORTS_DIR, `${reportId}.json`);
      const data = await readFile(filePath, 'utf8');
      const report = JSON.parse(data) as BugReport;
      
      // Add to cache
      this.reportsCache.set(reportId, report);
      return report;
      
    } catch (error) {
      console.warn(`Bug report not found: ${reportId}`);
      return null;
    }
  }
  
  /**
   * List bug reports with filtering and pagination
   */
  static async listBugReports(options: {
    category?: BugCategory;
    severity?: BugSeverity;
    status?: BugReportStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ reports: BugReport[]; total: number }> {
    // For now, we'll implement a simple file-based system
    // In production, this would use a proper database
    const allReports = Array.from(this.reportsCache.values());
    
    // Apply filters
    let filteredReports = allReports;
    if (options.category) {
      filteredReports = filteredReports.filter(r => r.category === options.category);
    }
    if (options.severity) {
      filteredReports = filteredReports.filter(r => r.severity === options.severity);
    }
    if (options.status) {
      filteredReports = filteredReports.filter(r => r.status === options.status);
    }
    
    // Sort by timestamp (newest first)
    filteredReports.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply pagination
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const reports = filteredReports.slice(offset, offset + limit);
    
    return { reports, total: filteredReports.length };
  }
  
  /**
   * Update bug report status
   */
  static async updateBugReportStatus(
    reportId: string, 
    status: BugReportStatus, 
    assignedTo?: string,
    resolution?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const report = await this.getBugReport(reportId);
      if (!report) {
        return { success: false, error: 'Bug report not found' };
      }
      
      report.status = status;
      if (assignedTo) report.assignedTo = assignedTo;
      if (resolution) report.resolution = resolution;
      if (status === BugReportStatus.RESOLVED || status === BugReportStatus.CLOSED) {
        report.resolvedAt = Date.now();
      }
      
      await this.saveBugReport(report);
      this.reportsCache.set(reportId, report);
      
      console.log(`🐛 Bug report ${reportId} updated: ${status}`);
      return { success: true };
      
    } catch (error) {
      console.error('Error updating bug report:', error);
      return { success: false, error: 'Failed to update bug report' };
    }
  }
  
  /**
   * Capture comprehensive game context with server-side analysis
   */
  private static async captureGameContext(gameId: string): Promise<GameContext | undefined> {
    try {
      const gameState = await LiveGameService.getGameState(gameId);
      if (!gameState) return undefined;

      // Get comprehensive event history from GameEventTrackerService
      const sessionLog = await GameEventTrackerService.getSessionLogForBugReport(gameId);
      const sessionStats = GameEventTrackerService.getSessionStats(gameId);
      
      // Cancel cleanup to preserve logs for bug analysis
      GameEventTrackerService.cancelCleanup(gameId);

      // Enhanced server-side context capture
      const serverSideAnalysis = {
        // Complete serialized game state
        fullGameStateSerialized: JSON.stringify({
          ...gameState,
          chess: gameState.chess.fen(), // Replace chess instance with FEN
        }, null, 2),
        
        // Server performance metrics
        serverMetrics: {
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          timestamp: Date.now()
        },
        
        // Enhanced BP analysis with comprehensive history
        recentBPAnalysis: sessionLog?.bpCalculationHistory.map((report, index) => ({
          move: gameState.moveHistory[index]?.san || 'unknown',
          detectedTactics: (report.tactics || []).map(t => t.type || 'unknown'),
          bpChange: index === 0 ? 0 : 
            (report.playerBP.white + report.playerBP.black) - 
            (sessionLog.bpCalculationHistory[index - 1]?.playerBP.white || 0) - 
            (sessionLog.bpCalculationHistory[index - 1]?.playerBP.black || 0),
          timestamp: Date.now(), // sessionLog.gameStateSnapshots[index]?.timestamp
          // Include comprehensive data in the move object
          comprehensiveData: {
            turnNumber: index + 1,
            bpBefore: index === 0 ? 
              { white: gameState.config.initialBattlePoints, black: gameState.config.initialBattlePoints } : 
              sessionLog.bpCalculationHistory[index - 1]?.playerBP || { white: 0, black: 0 },
            bpAfter: report.playerBP,
            transactions: report.transactions,
            tactics: report.tactics || [],
            duelDetails: report.duelDetails,
            formula: report.calculations
          }
        })) || [],
        
        // Configuration used
        gameConfiguration: {
          ...gameState.config
        },

        // Event tracking data (separated from configuration)
        _eventTracking: {
          eventHistory: sessionLog?.events || [],
          playerActionHistory: sessionLog?.playerActions || [],
          networkEventHistory: sessionLog?.networkEvents || [],
          gameStateSnapshots: sessionLog?.gameStateSnapshots || [],
          sessionStatistics: sessionStats
        },
        
        // Validation state with embedded tracking
        validationHistory: sessionLog?.events.filter(e => e.category === 'validation') || [],
        
        // Socket room state
        socketRoomInfo: {
          gameRoomId: `game:${gameId}`,
          sessionLogExists: !!sessionLog,
          eventsTracked: sessionLog?.events.length || 0,
          totalPlayerActions: sessionLog?.playerActions.length || 0,
          totalNetworkEvents: sessionLog?.networkEvents.length || 0,
          totalStateSnapshots: sessionLog?.gameStateSnapshots.length || 0
        }
      };
      
      return {
        gameId,
        gameType: gameState.gameType || 'practice',
        gameStatus: gameState.gameStatus,
        currentTurn: gameState.currentTurn,
        moveCount: gameState.moveHistory.length,
        position: gameState.chess.fen(),
        moveHistory: gameState.moveHistory.map(move => ({
          notation: move.san,
          captureAttempt: move.captureAttempt,
          duelResult: move.duelResult
        })),
        whitePlayer: {
          id: gameState.whitePlayer.id,
          battlePoints: gameState.whitePlayer.battlePoints,
          isAI: gameState.whitePlayer.id === 'ai'
        },
        blackPlayer: {
          id: gameState.blackPlayer.id,
          battlePoints: gameState.blackPlayer.battlePoints,
          isAI: gameState.blackPlayer.id === 'ai'
        },
        bpCalculationReport: gameState.bpCalculationReport,
        lastMoveAnalysis: gameState.moveHistory.length > 0 ? {
          detectedTactics: [], // Would extract from BP calculation report if available
          bpRegeneration: gameState.bpCalculationReport?.regenerationDetails?.totalBP || 0,
          formula: gameState.bpCalculationReport ? JSON.stringify(gameState.bpCalculationReport) : undefined
        } : undefined,
        pendingDuel: gameState.pendingDuel ? {
          attackingPiece: `${gameState.pendingDuel.attackingPiece.type}@${gameState.pendingDuel.attackingPiece.square}`,
          defendingPiece: `${gameState.pendingDuel.defendingPiece.type}@${gameState.pendingDuel.defendingPiece.square}`,
          allocations: {
            attacker: gameState.pendingDuel.attackerAllocation,
            defender: gameState.pendingDuel.defenderAllocation
          }
        } : undefined,
        tacticalRetreatState: gameState.availableRetreatOptions ? {
          retreatingPiece: 'unknown', // Would need to track in game state
          availableSquares: gameState.availableRetreatOptions.map(r => r.square)
        } : undefined,
        
        // Server-side analysis (this is the key enhancement!)
        serverAnalysis: serverSideAnalysis
      };
      
    } catch (error) {
      console.warn('Failed to capture game context:', error);
      return undefined;
    }
  }
  
  /**
   * Perform automated analysis on bug report
   */
  private static async performAutomatedAnalysis(report: BugReport): Promise<BugReportAnalysis> {
    const analysis: BugReportAnalysis = {
      reportId: report.id,
      automaticClassification: this.classifyBugReport(report),
      duplicateDetection: await this.detectDuplicates(report),
      priorityScore: this.calculatePriorityScore(report),
      priorityFactors: this.getPriorityFactors(report),
      technicalAnalysis: this.performTechnicalAnalysis(report)
    };
    
    return analysis;
  }
  
  /**
   * Classify bug report automatically
   */
  private static classifyBugReport(report: BugReport): { suggestedCategory: BugCategory; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    let suggestedCategory = report.category;
    let confidence = 0.5;
    
    const keywords = (report.title + ' ' + report.description).toLowerCase();
    
    if (keywords.includes('battle points') || keywords.includes('bp')) {
      suggestedCategory = BugCategory.BP_CALCULATION;
      confidence = 0.8;
      reasoning.push('Contains battle points terminology');
    } else if (keywords.includes('duel') || keywords.includes('capture')) {
      suggestedCategory = BugCategory.DUEL_SYSTEM;
      confidence = 0.8;
      reasoning.push('Contains duel system terminology');
    }
    
    return { suggestedCategory, confidence, reasoning };
  }
  
  /**
   * Detect potential duplicate reports
   */
  private static async detectDuplicates(report: BugReport): Promise<{ isDuplicate: boolean; similarReports: string[]; similarity: number }> {
    return {
      isDuplicate: false,
      similarReports: [],
      similarity: 0
    };
  }
  
  /**
   * Calculate priority score
   */
  private static calculatePriorityScore(report: BugReport): number {
    let score = 0;
    
    switch (report.severity) {
      case BugSeverity.CRITICAL: score += 50; break;
      case BugSeverity.HIGH: score += 30; break;
      case BugSeverity.MEDIUM: score += 15; break;
      case BugSeverity.LOW: score += 5; break;
      case BugSeverity.ENHANCEMENT: score += 2; break;
    }
    
    return score;
  }
  
  /**
   * Get priority factors
   */
  private static getPriorityFactors(report: BugReport): string[] {
    const factors: string[] = [];
    
    if (report.severity === BugSeverity.CRITICAL) factors.push('Critical severity');
    if (report.category === BugCategory.GAMEPLAY) factors.push('Core gameplay affected');
    
    return factors;
  }
  
  /**
   * Perform technical analysis
   */
  private static performTechnicalAnalysis(report: BugReport): { affectedComponents: string[]; potentialCauses: string[]; reproducibilityScore: number } {
    const affectedComponents: string[] = [];
    const potentialCauses: string[] = [];
    
    switch (report.category) {
      case BugCategory.DUEL_SYSTEM:
        affectedComponents.push('DuelSystem', 'BattlePointsManager');
        break;
      case BugCategory.BP_CALCULATION:
        affectedComponents.push('BPCalculator', 'TacticsDetector');
        break;
    }
    
    return { 
      affectedComponents, 
      potentialCauses, 
      reproducibilityScore: 0.5 
    };
  }
  
  /**
   * Save a bug report to file system and database
   */
  static async saveBugReport(report: BugReport, analysis?: BugReportAnalysis): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      // Ensure directory exists
      await this.ensureDirectoryExists();
      
      // Generate filename with timestamp and session ID  
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${report.userContext.sessionId}-${timestamp}.json`;
      const filePath = path.join(this.REPORTS_DIR, filename);
      
      // Write to file system
      const reportData = analysis ? { report, analysis } : { report };
      await writeFile(filePath, JSON.stringify(reportData, null, 2));
      
      // Get file size
      const stats = await fs.promises.stat(filePath);
      
      // Save metadata to database
      const dbRecord = await prisma.bugReport.create({
        data: {
          sessionId: report.userContext.sessionId,
          timestamp: new Date(report.timestamp),
          category: report.category,
          severity: report.severity,
          description: report.description,
          filePath: filePath,
          fileSize: stats.size,
          gameId: report.gameContext?.gameId,
          gameType: report.gameContext?.gameType,
          userAgent: report.systemContext?.userAgent,
        }
      });
      
      console.log(`🐛 Bug report saved: ${filename} (DB ID: ${dbRecord.id})`);
      
      return { success: true, reportId: dbRecord.id };
    } catch (error) {
      console.error('Error saving bug report:', error);
      return { success: false, error: (error as Error).message };
    }
  }
  
  /**
   * Ensure reports directory exists
   */
  private static async ensureDirectoryExists(): Promise<void> {
    if (!existsSync(this.REPORTS_DIR)) {
      await mkdir(this.REPORTS_DIR, { recursive: true });
    }
  }
  
  /**
   * Get bug reporting statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    byCategory: Record<BugCategory, number>;
    bySeverity: Record<BugSeverity, number>;
    byStatus: Record<BugReportStatus, number>;
    recentTrends: Array<{ date: string; count: number }>;
  }> {
    const allReports = Array.from(this.reportsCache.values());
    
    const byCategory = {} as Record<BugCategory, number>;
    const bySeverity = {} as Record<BugSeverity, number>;
    const byStatus = {} as Record<BugReportStatus, number>;
    
    // Initialize counters
    Object.values(BugCategory).forEach(cat => byCategory[cat] = 0);
    Object.values(BugSeverity).forEach(sev => bySeverity[sev] = 0);
    Object.values(BugReportStatus).forEach(stat => byStatus[stat] = 0);
    
    // Count reports
    allReports.forEach(report => {
      byCategory[report.category]++;
      bySeverity[report.severity]++;
      byStatus[report.status]++;
    });
    
    // Calculate recent trends (last 7 days)
    const now = Date.now();
    const recentTrends: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = allReports.filter(report => {
        const reportDate = new Date(report.timestamp).toISOString().split('T')[0];
        return reportDate === dateStr;
      }).length;
      recentTrends.push({ date: dateStr, count });
    }
    
    return {
      total: allReports.length,
      byCategory,
      bySeverity,
      byStatus,
      recentTrends
    };
  }
} 