import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/alerts
 * Get user's alerts with filtering and pagination
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      severity,
      isAcknowledged,
      analysisId,
      constraintId,
      fromDate,
      toDate,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id,
    };

    if (severity) where.severity = severity;
    if (isAcknowledged !== undefined) where.isAcknowledged = isAcknowledged === 'true';
    if (analysisId) where.analysisId = analysisId;
    if (constraintId) where.constraintId = constraintId;
    if (fromDate) where.createdAt = { ...where.createdAt, gte: new Date(fromDate as string) };
    if (toDate) where.createdAt = { ...where.createdAt, lte: new Date(toDate as string) };

    const [alerts, totalCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          constraint: {
            select: {
              name: true,
              metric: true,
            },
          },
          analysis: {
            select: {
              id: true,
              document: {
                select: {
                  fileName: true,
                  company: {
                    select: { name: true, ticker: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  })
);

/**
 * GET /api/alerts/:id
 * Get specific alert details
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const alert = await prisma.alert.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        constraint: true,
        analysis: {
          include: {
            document: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404);
    }

    res.json({
      success: true,
      data: { alert },
    });
  })
);

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/:id/acknowledge',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const alert = await prisma.alert.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404);
    }

    if (alert.isAcknowledged) {
      throw createError('Alert is already acknowledged', 400);
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: { alert: updatedAlert },
    });
  })
);

/**
 * PUT /api/alerts/:id/unacknowledge
 * Unacknowledge an alert
 */
router.put('/:id/unacknowledge',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const alert = await prisma.alert.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404);
    }

    if (!alert.isAcknowledged) {
      throw createError('Alert is not acknowledged', 400);
    }

    const updatedAlert = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        isAcknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null,
      },
    });

    res.json({
      success: true,
      message: 'Alert unacknowledged successfully',
      data: { alert: updatedAlert },
    });
  })
);

/**
 * POST /api/alerts/bulk-acknowledge
 * Acknowledge multiple alerts
 */
router.post('/bulk-acknowledge',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { alertIds } = req.body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      throw createError('alertIds array is required and cannot be empty', 400);
    }

    // Verify all alerts belong to user and are not already acknowledged
    const alerts = await prisma.alert.findMany({
      where: {
        id: { in: alertIds },
        userId: req.user!.id,
        isAcknowledged: false,
      },
    });

    if (alerts.length === 0) {
      throw createError('No valid alerts found to acknowledge', 404);
    }

    const result = await prisma.alert.updateMany({
      where: {
        id: { in: alerts.map(a => a.id) },
        userId: req.user!.id,
        isAcknowledged: false,
      },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: `${result.count} alerts acknowledged successfully`,
      data: {
        acknowledged: result.count,
        requested: alertIds.length,
      },
    });
  })
);

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const alert = await prisma.alert.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404);
    }

    await prisma.alert.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  })
);

/**
 * GET /api/alerts/stats
 * Get alert statistics for the user
 */
router.get('/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { days = 30 } = req.query;
    const daysNum = Math.min(parseInt(days as string), 365);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysNum);

    const [
      totalAlerts,
      criticalAlerts,
      warningAlerts,
      infoAlerts,
      acknowledgedAlerts,
      recentAlerts,
      alertsByDay,
      alertsByConstraint,
    ] = await Promise.all([
      // Total alerts
      prisma.alert.count({
        where: { userId: req.user!.id },
      }),

      // Critical alerts
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          severity: 'critical',
        },
      }),

      // Warning alerts
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          severity: 'warning',
        },
      }),

      // Info alerts
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          severity: 'info',
        },
      }),

      // Acknowledged alerts
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          isAcknowledged: true,
        },
      }),

      // Recent alerts (last 30 days)
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          createdAt: { gte: fromDate },
        },
      }),

      // Alerts by day (last 30 days)
      prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM alerts
        WHERE user_id = ${req.user!.id}
        AND created_at >= ${fromDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `,

      // Alerts by constraint (top 10)
      prisma.alert.groupBy({
        by: ['constraintId'],
        where: {
          userId: req.user!.id,
          createdAt: { gte: fromDate },
        },
        _count: true,
        orderBy: {
          _count: {
            constraintId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Get constraint names for the top constraints
    const constraintIds = alertsByConstraint.map(item => item.constraintId);
    const constraints = await prisma.constraint.findMany({
      where: { id: { in: constraintIds } },
      select: { id: true, name: true },
    });

    const constraintMap = constraints.reduce((acc, constraint) => {
      acc[constraint.id] = constraint.name;
      return acc;
    }, {} as Record<string, string>);

    const stats = {
      totalAlerts,
      alertsBySeverity: {
        critical: criticalAlerts,
        warning: warningAlerts,
        info: infoAlerts,
      },
      acknowledgedAlerts,
      unacknowledgedAlerts: totalAlerts - acknowledgedAlerts,
      recentAlerts: recentAlerts,
      acknowledgedRate: totalAlerts > 0 ? Math.round((acknowledgedAlerts / totalAlerts) * 100) : 0,
      alertsByDay: (alertsByDay as any[]).map(item => ({
        date: item.date,
        count: parseInt(item.count),
      })),
      topConstraints: alertsByConstraint.map(item => ({
        constraintId: item.constraintId,
        constraintName: constraintMap[item.constraintId] || 'Unknown',
        alertCount: item._count,
      })),
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/alerts/summary
 * Get alert summary for dashboard
 */
router.get('/summary',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [
      unacknowledgedCritical,
      unacknowledgedWarning,
      recentAlerts,
      trendsData,
    ] = await Promise.all([
      // Unacknowledged critical alerts
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          severity: 'critical',
          isAcknowledged: false,
        },
      }),

      // Unacknowledged warning alerts
      prisma.alert.count({
        where: {
          userId: req.user!.id,
          severity: 'warning',
          isAcknowledged: false,
        },
      }),

      // Recent alerts (last 24 hours)
      prisma.alert.findMany({
        where: {
          userId: req.user!.id,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          constraint: {
            select: { name: true },
          },
          analysis: {
            select: {
              document: {
                select: {
                  company: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),

      // Trend data (last 7 days)
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          severity,
          COUNT(*) as count
        FROM alerts
        WHERE user_id = ${req.user!.id}
        AND created_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(created_at), severity
        ORDER BY date DESC, severity
      `,
    ]);

    const summary = {
      urgentAlerts: unacknowledgedCritical + unacknowledgedWarning,
      criticalAlerts: unacknowledgedCritical,
      warningAlerts: unacknowledgedWarning,
      recentAlerts: recentAlerts.map(alert => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        constraintName: alert.constraint.name,
        companyName: alert.analysis.document.company.name,
        createdAt: alert.createdAt,
      })),
      trends: trendsData,
    };

    res.json({
      success: true,
      data: summary,
    });
  })
);

/**
 * POST /api/alerts/snooze/:id
 * Snooze an alert for a specified duration
 */
router.post('/snooze/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { duration } = req.body; // duration in minutes
    
    const validationSchema = Joi.object({
      duration: Joi.number().min(15).max(10080).required(), // 15 minutes to 7 days
    });

    const { error } = validationSchema.validate({ duration });
    if (error) {
      throw createError('Duration must be between 15 minutes and 7 days', 400);
    }

    const alert = await prisma.alert.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!alert) {
      throw createError('Alert not found', 404);
    }

    // For now, we'll implement snoozing as a form of acknowledgment with a special note
    // In a full implementation, you might want a separate snooze table
    const snoozedUntil = new Date(Date.now() + duration * 60 * 1000);
    
    const updatedAlert = await prisma.alert.update({
      where: { id: req.params.id },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: req.user!.id,
        // In a full implementation, add snoozeUntil field to schema
      },
    });

    res.json({
      success: true,
      message: `Alert snoozed for ${duration} minutes`,
      data: { 
        alert: updatedAlert,
        snoozedUntil,
      },
    });
  })
);

export default router;