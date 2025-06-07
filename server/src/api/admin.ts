/**
 * Admin API Routes
 * 
 * Protected admin routes for bug report management
 */

import { Router, Response } from 'express';
import { adminLogin, requireAdminAuth, AdminAuthRequest } from '../middleware/admin-auth';
import { PrismaClient } from '../generated/prisma';
import fs from 'fs/promises';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

/**
 * Admin login
 * POST /api/admin/login
 */
router.post('/login', adminLogin);

/**
 * Get all bug reports with filtering and pagination
 * GET /api/admin/bug-reports
 */
router.get('/bug-reports', requireAdminAuth, async (req: AdminAuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      category, 
      severity, 
      viewed, 
      downloaded,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (viewed === 'true') where.viewed = true;
    if (viewed === 'false') where.viewed = false;
    if (downloaded === 'true') where.downloaded = true;
    if (downloaded === 'false') where.downloaded = false;

    // Build order clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';

    const [reports, total] = await Promise.all([
      prisma.bugReport.findMany({
        where,
        orderBy,
        skip: offset,
        take: limitNum,
      }),
      prisma.bugReport.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching bug reports:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get bug report details and mark as viewed
 * GET /api/admin/bug-reports/:id
 */
router.get('/bug-reports/:id', requireAdminAuth, async (req: AdminAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Get report metadata
    const report = await prisma.bugReport.findUnique({
      where: { id }
    });

    if (!report) {
      res.status(404).json({ success: false, error: 'Bug report not found' });
      return;
    }

    // Mark as viewed if not already
    if (!report.viewed) {
      await prisma.bugReport.update({
        where: { id },
        data: { 
          viewed: true, 
          viewedAt: new Date() 
        }
      });
    }

    // Read the actual report file
    let reportData = null;
    try {
      const fileContent = await fs.readFile(report.filePath, 'utf8');
      reportData = JSON.parse(fileContent);
    } catch (fileError) {
      console.error('Error reading report file:', fileError);
      reportData = null;
    }

    res.json({
      success: true,
      data: {
        metadata: { ...report, viewed: true, viewedAt: new Date() },
        reportData
      }
    });

  } catch (error) {
    console.error('Error fetching bug report details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Download bug report file
 * GET /api/admin/bug-reports/:id/download
 */
router.get('/bug-reports/:id/download', requireAdminAuth, async (req: AdminAuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.bugReport.findUnique({
      where: { id }
    });

    if (!report) {
      res.status(404).json({ success: false, error: 'Bug report not found' });
      return;
    }

    // Mark as downloaded
    if (!report.downloaded) {
      await prisma.bugReport.update({
        where: { id },
        data: { 
          downloaded: true, 
          downloadedAt: new Date() 
        }
      });
    }

    // Check if file exists
    try {
      await fs.access(report.filePath);
    } catch {
      res.status(404).json({ success: false, error: 'Report file not found on disk' });
      return;
    }

    // Send file
    const filename = path.basename(report.filePath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.resolve(report.filePath));

  } catch (error) {
    console.error('Error downloading bug report:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Batch download bug reports
 * POST /api/admin/bug-reports/batch-download
 */
router.post('/bug-reports/batch-download', requireAdminAuth, async (req: AdminAuthRequest, res: Response): Promise<void> => {
  try {
    const { reportIds } = req.body;

    if (!Array.isArray(reportIds) || reportIds.length === 0) {
      res.status(400).json({ success: false, error: 'Report IDs array required' });
      return;
    }

    // Get reports
    const reports = await prisma.bugReport.findMany({
      where: { id: { in: reportIds } }
    });

    if (reports.length === 0) {
      res.status(404).json({ success: false, error: 'No reports found' });
      return;
    }

    // Mark all as downloaded
    await prisma.bugReport.updateMany({
      where: { id: { in: reportIds } },
      data: { 
        downloaded: true, 
        downloadedAt: new Date() 
      }
    });

    // Create a zip archive with all files
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Disposition', `attachment; filename="bug-reports-${Date.now()}.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    archive.pipe(res);

    for (const report of reports) {
      try {
        await fs.access(report.filePath);
        const filename = path.basename(report.filePath);
        archive.file(report.filePath, { name: filename });
      } catch (error) {
        console.warn(`File not found for report ${report.id}: ${report.filePath}`);
      }
    }

    await archive.finalize();

  } catch (error) {
    console.error('Error in batch download:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get bug report statistics
 * GET /api/admin/bug-reports/stats
 */
router.get('/bug-reports/stats', requireAdminAuth, async (req: AdminAuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalCount,
      categoryStats,
      severityStats,
      viewedCount,
      downloadedCount,
      recentCount
    ] = await Promise.all([
      prisma.bugReport.count(),
      prisma.bugReport.groupBy({
        by: ['category'],
        _count: { category: true }
      }),
      prisma.bugReport.groupBy({
        by: ['severity'],
        _count: { severity: true }
      }),
      prisma.bugReport.count({ where: { viewed: true } }),
      prisma.bugReport.count({ where: { downloaded: true } }),
      prisma.bugReport.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ]);

    const stats = {
      total: totalCount,
      viewed: viewedCount,
      downloaded: downloadedCount,
      recentWeek: recentCount,
      byCategory: categoryStats.reduce((acc: Record<string, number>, item: { category: string; _count: { category: number } }) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: severityStats.reduce((acc: Record<string, number>, item: { severity: string; _count: { severity: number } }) => {
        acc[item.severity] = item._count.severity;
        return acc;
      }, {} as Record<string, number>)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router; 