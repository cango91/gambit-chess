/**
 * Bug Reports API Endpoints
 * 
 * Provides REST API for bug report submission and management
 */

import { Router, Request, Response } from 'express';
import { BugReportingService } from '../services/bug-reporting.service';
import { 
  BugReportSubmission, 
  BugCategory, 
  BugSeverity,
  SystemContext,
  UserContext,
  DebugData
} from '@gambit-chess/shared';

const router = Router();

/**
 * Submit a new bug report
 * POST /api/bug-reports
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      submission, 
      systemContext, 
      userContext, 
      debugData, 
      gameId 
    }: {
      submission: BugReportSubmission;
      systemContext: SystemContext;
      userContext: UserContext;
      debugData: DebugData;
      gameId?: string;
    } = req.body;

    // Validate required fields
    if (!submission || !submission.title || !submission.description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: title and description'
      });
      return;
    }

    if (!systemContext || !userContext || !debugData) {
      res.status(400).json({
        success: false,
        error: 'Missing required context data'
      });
      return;
    }

    // Validate enums
    if (!Object.values(BugCategory).includes(submission.category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid bug category'
      });
      return;
    }

    if (!Object.values(BugSeverity).includes(submission.severity)) {
      res.status(400).json({
        success: false,
        error: 'Invalid bug severity'
      });
      return;
    }

    // Submit bug report
    const result = await BugReportingService.submitBugReport(
      submission,
      systemContext,
      userContext,
      debugData,
      gameId
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        reportId: result.reportId,
        message: 'Bug report submitted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to submit bug report'
      });
    }

  } catch (error) {
    console.error('Error in bug report submission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/bug-reports/health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'bug-reporting',
    timestamp: new Date().toISOString()
  });
});

export default router; 