import { prisma } from '../index';
import { RedisService } from '../services/redis.service';

export interface CleanupReport {
  staleGamesFound: number;
  staleGamesFixed: number;
  redisKeysCleared: number;
  errors: string[];
}

/**
 * Database cleanup utilities for Gambit Chess
 * Handles stale games, missing database fields, and orphaned Redis keys
 */
export class DatabaseCleanupService {
  
  /**
   * Fix stale games that are stuck in IN_PROGRESS or WAITING status
   * but have no corresponding Redis session (meaning they were abandoned)
   */
  static async fixStaleGames(dryRun: boolean = true): Promise<CleanupReport> {
    const report: CleanupReport = {
      staleGamesFound: 0,
      staleGamesFixed: 0,
      redisKeysCleared: 0,
      errors: []
    };

    console.log(`🧹 Starting database cleanup (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);

    try {
      // Find games that are not completed but might be stale
      const staleGames = await prisma.game.findMany({
        where: {
          status: {
            in: ['IN_PROGRESS', 'WAITING']
          },
          OR: [
            // Games older than 2 hours
            {
              createdAt: {
                lt: new Date(Date.now() - 2 * 60 * 60 * 1000)
              }
            },
            // Games with missing result data (regardless of age)
            {
              result: null,
              status: 'IN_PROGRESS'
            }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      report.staleGamesFound = staleGames.length;
      console.log(`🔍 Found ${staleGames.length} potentially stale games`);

      for (const game of staleGames) {
        try {
          // Check if game has active Redis session
          const redisKey = `live_game:${game.id}`;
          const hasRedisSession = await RedisService.exists(redisKey);
          
          console.log(`📊 Game ${game.id}: created ${game.createdAt.toISOString()}, Redis session: ${hasRedisSession ? 'YES' : 'NO'}`);

          if (!hasRedisSession) {
            // Game has no active session - mark as abandoned
            if (!dryRun) {
              await prisma.game.update({
                where: { id: game.id },
                data: {
                  status: 'ABANDONED',
                  result: null, // No winner
                  resultReason: 'ABANDONMENT',
                  endedAt: new Date(),
                  finalFEN: null // We don't know the final position
                }
              });
              
              // Clean up any orphaned Redis keys
              const eventKey = `game_events:${game.id}`;
              const eventKeyExists = await RedisService.exists(eventKey);
              if (eventKeyExists) {
                await RedisService.del(eventKey);
                report.redisKeysCleared++;
              }
              
              report.staleGamesFixed++;
              console.log(`✅ Fixed stale game ${game.id} - marked as ABANDONED`);
            } else {
              console.log(`🔍 Would fix stale game ${game.id} - mark as ABANDONED`);
            }
          } else {
            console.log(`⏳ Game ${game.id} has active Redis session - leaving alone`);
          }
          
        } catch (error) {
          const errorMsg = `Error processing game ${game.id}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          report.errors.push(errorMsg);
        }
      }

      // Also fix games that are marked COMPLETED but missing result data
      const completedGamesWithMissingData = await prisma.game.findMany({
        where: {
          status: 'COMPLETED',
          result: null
        }
      });

      console.log(`🔍 Found ${completedGamesWithMissingData.length} completed games with missing result data`);

      for (const game of completedGamesWithMissingData) {
        try {
          if (!dryRun) {
            // We can't determine the actual result, so mark as unknown draw
            await prisma.game.update({
              where: { id: game.id },
              data: {
                result: 'DRAW',
                resultReason: 'AGREEMENT', // Best guess for completed games
                finalFEN: null // We don't have the final position
              }
            });
            
            report.staleGamesFixed++;
            console.log(`✅ Fixed completed game ${game.id} - set result to DRAW`);
          } else {
            console.log(`🔍 Would fix completed game ${game.id} - set result to DRAW`);
          }
        } catch (error) {
          const errorMsg = `Error fixing completed game ${game.id}: ${error}`;
          console.error(`❌ ${errorMsg}`);
          report.errors.push(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Fatal error during cleanup: ${error}`;
      console.error(`💀 ${errorMsg}`);
      report.errors.push(errorMsg);
    }

    console.log(`\n📋 Cleanup Report:`);
    console.log(`   Stale games found: ${report.staleGamesFound}`);
    console.log(`   Games fixed: ${report.staleGamesFixed}`);
    console.log(`   Redis keys cleared: ${report.redisKeysCleared}`);
    console.log(`   Errors: ${report.errors.length}`);
    
    if (report.errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      report.errors.forEach(error => console.log(`   - ${error}`));
    }

    return report;
  }

  /**
   * Clean up orphaned Redis keys that have no corresponding database game
   */
  static async cleanupOrphanedRedisKeys(dryRun: boolean = true): Promise<number> {
    console.log(`🧹 Cleaning up orphaned Redis keys (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);
    
    let keysCleared = 0;
    
    try {
      const redis = await RedisService.getRedisClient();
      const gameKeys = await redis.keys('live_game:*');
      const eventKeys = await redis.keys('game_events:*');
      
      console.log(`🔍 Found ${gameKeys.length} game keys and ${eventKeys.length} event keys in Redis`);
      
      // Check each game key
      for (const key of gameKeys) {
        const gameId = key.replace('live_game:', '');
        const dbGame = await prisma.game.findUnique({
          where: { id: gameId }
        });
        
        if (!dbGame) {
          if (!dryRun) {
            await RedisService.del(key);
            keysCleared++;
            console.log(`🗑️ Removed orphaned Redis key: ${key}`);
          } else {
            console.log(`🔍 Would remove orphaned Redis key: ${key}`);
          }
        }
      }
      
      // Check each event key
      for (const key of eventKeys) {
        const gameId = key.replace('game_events:', '');
        const dbGame = await prisma.game.findUnique({
          where: { id: gameId }
        });
        
        if (!dbGame) {
          if (!dryRun) {
            await RedisService.del(key);
            keysCleared++;
            console.log(`🗑️ Removed orphaned event key: ${key}`);
          } else {
            console.log(`🔍 Would remove orphaned event key: ${key}`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error cleaning up Redis keys:', error);
    }
    
    console.log(`📋 Redis cleanup complete. Keys ${dryRun ? 'would be' : ''} cleared: ${keysCleared}`);
    return keysCleared;
  }

  /**
   * Get detailed statistics about the database state
   */
  static async getDatabaseStats(): Promise<any> {
    try {
      const stats = await prisma.game.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const resultStats = await prisma.game.groupBy({
        by: ['result'],
        _count: {
          result: true
        }
      });

      const reasonStats = await prisma.game.groupBy({
        by: ['resultReason'],
        _count: {
          resultReason: true
        }
      });

      // Count games with missing data
      const missingResultData = await prisma.game.count({
        where: {
          AND: [
            { status: { in: ['COMPLETED', 'ABANDONED'] } },
            { OR: [{ result: null }, { resultReason: null }] }
          ]
        }
      });

      const totalGames = await prisma.game.count();

      return {
        totalGames,
        statusBreakdown: stats,
        resultBreakdown: resultStats,
        reasonBreakdown: reasonStats,
        gamesWithMissingData: missingResultData
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  /**
   * Run complete maintenance - fix stale games and clean Redis
   */
  static async runMaintenance(dryRun: boolean = true): Promise<CleanupReport> {
    console.log(`🔧 Running complete database maintenance (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);
    
    // Get initial stats
    console.log('\n📊 Initial database state:');
    const initialStats = await this.getDatabaseStats();
    if (initialStats) {
      console.log(JSON.stringify(initialStats, null, 2));
    }

    // Fix stale games
    const report = await this.fixStaleGames(dryRun);
    
    // Clean Redis keys
    const redisKeysCleared = await this.cleanupOrphanedRedisKeys(dryRun);
    report.redisKeysCleared += redisKeysCleared;

    // Get final stats
    if (!dryRun) {
      console.log('\n📊 Final database state:');
      const finalStats = await this.getDatabaseStats();
      if (finalStats) {
        console.log(JSON.stringify(finalStats, null, 2));
      }
    }

    console.log('\n✅ Maintenance complete!');
    return report;
  }
} 