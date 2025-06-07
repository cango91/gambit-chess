import * as cron from 'node-cron';
import { DatabaseCleanupService } from '../utils/database-cleanup';

/**
 * Maintenance Service for Gambit Chess Server
 * Handles automated background maintenance tasks including database cleanup
 */
export class MaintenanceService {
  private static cleanupJob: cron.ScheduledTask | null = null;
  private static isRunning = false;

  /**
   * Initialize maintenance services
   * Sets up scheduled tasks for database cleanup
   */
  static initialize(): void {
    console.log('🔧 Initializing maintenance services...');

    // Create scheduled task but don't start it yet
    // This runs at 00:00, 06:00, 12:00, 18:00 every day
    this.cleanupJob = cron.schedule('0 */6 * * *', async () => {
      await this.runScheduledCleanup();
    }, {
      scheduled: false, // Start manually after initialization
      timezone: 'UTC'   // Use UTC for consistency
    } as any); // Type assertion to handle node-cron typing issues

    // Also run cleanup on startup (after 30 seconds delay)
    setTimeout(async () => {
      await this.runStartupCleanup();
      
      // Start the scheduled task after startup cleanup
      if (this.cleanupJob) {
        this.cleanupJob.start();
        console.log('✅ Scheduled maintenance tasks started (every 6 hours)');
      }
    }, 30000); // 30 second delay to let server fully initialize

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Run database cleanup as a scheduled task
   */
  private static async runScheduledCleanup(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Maintenance already running, skipping scheduled cleanup');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n🔧 Running scheduled database maintenance...');
      
      const report = await DatabaseCleanupService.runMaintenance(false); // Live mode
      
      const duration = Date.now() - startTime;
      console.log(`✅ Scheduled maintenance completed in ${duration}ms`);
      console.log(`📊 Results: ${report.staleGamesFixed} games fixed, ${report.redisKeysCleared} keys cleared`);
      
      if (report.errors.length > 0) {
        console.error(`❌ Maintenance completed with ${report.errors.length} errors:`);
        report.errors.forEach(error => console.error(`   - ${error}`));
      }

    } catch (error) {
      console.error('💀 Fatal error during scheduled maintenance:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run database cleanup on server startup
   */
  private static async runStartupCleanup(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Maintenance already running, skipping startup cleanup');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('\n🚀 Running startup database maintenance...');
      
      // Check if we need cleanup by getting stats first
      const stats = await DatabaseCleanupService.getDatabaseStats();
      if (stats && stats.gamesWithMissingData > 0) {
        console.log(`🔍 Found ${stats.gamesWithMissingData} games with missing data, running cleanup...`);
        
        const report = await DatabaseCleanupService.runMaintenance(false); // Live mode
        
        const duration = Date.now() - startTime;
        console.log(`✅ Startup maintenance completed in ${duration}ms`);
        console.log(`📊 Results: ${report.staleGamesFixed} games fixed, ${report.redisKeysCleared} keys cleared`);
        
        if (report.errors.length > 0) {
          console.error(`❌ Startup maintenance completed with ${report.errors.length} errors:`);
          report.errors.forEach(error => console.error(`   - ${error}`));
        }
      } else {
        console.log('✅ Database is clean, no startup maintenance needed');
      }

    } catch (error) {
      console.error('💀 Fatal error during startup maintenance:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run maintenance manually (for admin endpoints)
   */
  static async runManualMaintenance(dryRun: boolean = true): Promise<any> {
    if (this.isRunning) {
      throw new Error('Maintenance is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`\n🔧 Running manual database maintenance (${dryRun ? 'DRY RUN' : 'LIVE'})...`);
      
      const report = await DatabaseCleanupService.runMaintenance(dryRun);
      
      const duration = Date.now() - startTime;
      console.log(`✅ Manual maintenance completed in ${duration}ms`);
      
      return {
        success: true,
        duration,
        report,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('💀 Fatal error during manual maintenance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get maintenance status
   */
  static getStatus(): any {
    return {
      isRunning: this.isRunning,
      scheduledTaskActive: this.cleanupJob ? this.cleanupJob.getStatus() : null,
      nextScheduledRun: this.cleanupJob ? 'Every 6 hours' : null
    };
  }

  /**
   * Shutdown maintenance services gracefully
   */
  static shutdown(): void {
    console.log('🔧 Shutting down maintenance services...');
    
    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob.destroy();
      this.cleanupJob = null;
    }
    
    console.log('✅ Maintenance services shut down');
  }

  /**
   * Force stop any running maintenance (emergency use)
   */
  static forceStop(): void {
    console.log('🛑 Force stopping maintenance...');
    this.isRunning = false;
    this.shutdown();
  }
} 