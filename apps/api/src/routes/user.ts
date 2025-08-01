import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
});

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            companies: true,
            documents: true,
            constraints: true,
            analyses: true,
            alerts: true,
          },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error } = updateProfileSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { name, email } = req.body;
    const updates: any = {};

    if (name) updates.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.user!.id },
        },
      });

      if (existingUser) {
        throw createError('Email is already taken', 409);
      }

      updates.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  })
);

/**
 * GET /api/user/dashboard
 * Get user dashboard data
 */
router.get('/dashboard',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Get recent activities
    const [recentDocuments, recentAnalyses, recentAlerts, stats] = await Promise.all([
      // Recent documents
      prisma.document.findMany({
        where: { userId },
        orderBy: { uploadedAt: 'desc' },
        take: 5,
        include: {
          company: {
            select: { name: true, ticker: true },
          },
        },
      }),

      // Recent analyses
      prisma.analysis.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: {
          document: {
            select: { fileName: true },
          },
        },
      }),

      // Recent alerts
      prisma.alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Overall statistics
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          _count: {
            select: {
              companies: true,
              documents: true,
              constraints: true,
              analyses: true,
              alerts: true,
            },
          },
        },
      }),
    ]);

    // Calculate alert statistics
    const alertStats = {
      total: recentAlerts.length,
      critical: recentAlerts.filter(a => a.severity === 'critical').length,
      warning: recentAlerts.filter(a => a.severity === 'warning').length,
      info: recentAlerts.filter(a => a.severity === 'info').length,
      unacknowledged: recentAlerts.filter(a => !a.isAcknowledged).length,
    };

    res.json({
      success: true,
      data: {
        recentDocuments,
        recentAnalyses,
        recentAlerts,
        alertStats,
        overallStats: stats?._count || {},
      },
    });
  })
);

/**
 * GET /api/user/activity
 * Get user activity feed
 */
router.get('/activity',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    // Get audit logs for this user
    const [activities, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count({
        where: { userId },
      }),
    ]);

    res.json({
      success: true,
      data: activities,
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
 * DELETE /api/user/account
 * Delete user account
 */
router.delete('/account',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    // Delete user and all related data (cascade will handle most relationships)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  })
);

export default router;