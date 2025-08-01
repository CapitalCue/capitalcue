/**
 * Security Monitoring API Routes
 * Provides endpoints for security dashboard and incident management
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requirePermission, Permission, AuthenticatedRequest } from '../middleware/advanced-auth';
import { createError } from '../middleware/error-handler';
import { securityMonitor } from '../services/security-monitor';
import { auditLogger, AuditEventType } from '../services/audit-logger';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Get security dashboard data (Admin only)
 */
router.get('/dashboard', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { timeframe = '24h' } = req.query;

    const validTimeframes = ['24h', '7d', '30d'];
    if (!validTimeframes.includes(timeframe as string)) {
      return res.status(400).json({
        error: 'Invalid timeframe. Must be 24h, 7d, or 30d'
      });
    }

    const dashboardData = await securityMonitor.getSecurityDashboard(timeframe as '24h' | '7d' | '30d');

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_dashboard',
      undefined,
      'SUCCESS',
      { timeframe }
    );

    res.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_dashboard',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get security dashboard', 500);
  }
});

/**
 * Get security events (Admin only)
 */
router.get('/events', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      severity,
      eventType,
      resolved,
      userId,
      ipAddress,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (severity) where.severity = severity;
    if (eventType) where.eventType = eventType;
    if (resolved !== undefined) where.resolved = resolved === 'true';
    if (userId) where.userId = userId;
    if (ipAddress) where.ipAddress = ipAddress;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.securityEvent.count({ where })
    ]);

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_events',
      undefined,
      'SUCCESS',
      { filters: { severity, eventType, resolved, userId, ipAddress } }
    );

    res.json({
      success: true,
      events,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_events',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get security events', 500);
  }
});

/**
 * Get specific security event details (Admin only)
 */
router.get('/events/:eventId', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Security event not found'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_event',
      eventId,
      'SUCCESS'
    );

    res.json({
      success: true,
      event: {
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null
      }
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_event',
      req.params.eventId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get security event', 500);
  }
});

/**
 * Resolve security event (Admin only)
 */
router.patch('/events/:eventId/resolve', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { eventId } = req.params;
    const { resolution, notes } = req.body;

    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return res.status(404).json({
        error: 'Security event not found'
      });
    }

    const updatedEvent = await prisma.securityEvent.update({
      where: { id: eventId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(event.metadata || '{}'),
          resolution,
          notes,
          resolvedBy: req.user!.id
        })
      }
    });

    await auditLogger.logDataAccess(
      AuditEventType.DATA_UPDATE,
      req,
      'security_event',
      eventId,
      'SUCCESS',
      { resolution, notes }
    );

    res.json({
      success: true,
      message: 'Security event resolved',
      event: updatedEvent
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_UPDATE,
      req,
      'security_event',
      req.params.eventId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to resolve security event', 500);
  }
});

/**
 * Get blocked IP addresses (Admin only)
 */
router.get('/blocked-ips', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    // Get blocked IPs from security monitor
    const blockedIPs = await securityMonitor.getSecurityDashboard('24h');

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'blocked_ips',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      blockedIPs: blockedIPs.blockedIPs,
      count: blockedIPs.blockedIPs.length
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'blocked_ips',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get blocked IPs', 500);
  }
});

/**
 * Block IP address manually (Admin only)
 */
router.post('/block-ip', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { ipAddress, reason } = req.body;

    if (!ipAddress) {
      return res.status(400).json({
        error: 'IP address is required'
      });
    }

    // Log security event for manual IP block
    await securityMonitor.logSecurityEvent({
      type: 'MALICIOUS_REQUEST',
      severity: 'HIGH',
      ipAddress,
      description: `IP manually blocked by admin: ${reason || 'No reason provided'}`,
      metadata: {
        blockedBy: req.user!.id,
        reason,
        manual: true
      },
      timestamp: new Date()
    });

    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'ip_block',
      ipAddress,
      'SUCCESS',
      { reason, manual: true }
    );

    res.json({
      success: true,
      message: 'IP address blocked successfully',
      ipAddress,
      blockedAt: new Date()
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'ip_block',
      req.body.ipAddress,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to block IP address', 500);
  }
});

/**
 * Get quarantined users (Admin only)
 */
router.get('/quarantined-users', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const dashboardData = await securityMonitor.getSecurityDashboard('24h');

    const quarantinedUserIds = dashboardData.quarantinedUsers;
    
    // Get user details for quarantined users
    const users = await prisma.user.findMany({
      where: {
        id: { in: quarantinedUserIds }
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'quarantined_users',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      quarantinedUsers: users,
      count: users.length
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'quarantined_users',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get quarantined users', 500);
  }
});

/**
 * Quarantine user manually (Admin only)
 */
router.post('/quarantine-user', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Log security event for manual user quarantine
    await securityMonitor.logSecurityEvent({
      type: 'ACCOUNT_TAKEOVER',
      severity: 'HIGH',
      userId,
      description: `User manually quarantined by admin: ${reason || 'No reason provided'}`,
      metadata: {
        quarantinedBy: req.user!.id,
        reason,
        manual: true
      },
      timestamp: new Date()
    });

    await auditLogger.logDataAccess(
      AuditEventType.DATA_UPDATE,
      req,
      'user_quarantine',
      userId,
      'SUCCESS',
      { reason, manual: true }
    );

    res.json({
      success: true,
      message: 'User quarantined successfully',
      userId,
      userEmail: user.email,
      quarantinedAt: new Date()
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_UPDATE,
      req,
      'user_quarantine',
      req.body.userId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to quarantine user', 500);
  }
});

/**
 * Get security statistics summary (Admin only)
 */
router.get('/stats', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { timeframe = '7d' } = req.query;

    const validTimeframes = ['24h', '7d', '30d'];
    if (!validTimeframes.includes(timeframe as string)) {
      return res.status(400).json({
        error: 'Invalid timeframe. Must be 24h, 7d, or 30d'
      });
    }

    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [
      totalEvents,
      criticalEvents,
      resolvedEvents,
      authenticationFailures,
      dataExfilAttempts,
      suspiciousActivities
    ] = await Promise.all([
      prisma.securityEvent.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: startDate },
          severity: 'CRITICAL'
        }
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: startDate },
          resolved: true
        }
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: startDate },
          eventType: 'AUTHENTICATION_FAILURE'
        }
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: startDate },
          eventType: 'DATA_EXFILTRATION'
        }
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: startDate },
          eventType: 'SUSPICIOUS_ACTIVITY'
        }
      })
    ]);

    const stats = {
      timeframe,
      totalEvents,
      criticalEvents,
      resolvedEvents,
      unresolvedEvents: totalEvents - resolvedEvents,
      resolutionRate: totalEvents > 0 ? (resolvedEvents / totalEvents * 100).toFixed(1) : '0',
      eventsByType: {
        authenticationFailures: authenticFailures,
        dataExfiltrationAttempts: dataExfilAttempts,
        suspiciousActivities: suspiciousActivities
      },
      threatLevel: this.calculateThreatLevel(criticalEvents, totalEvents)
    };

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_stats',
      undefined,
      'SUCCESS',
      { timeframe }
    );

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'security_stats',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get security statistics', 500);
  }
});

/**
 * Test security monitoring (Admin only - for testing purposes)
 */
router.post('/test-alert', authenticateJWT, requirePermission(Permission.ADMIN_SYSTEM), async (req: AuthenticatedRequest, res) => {
  try {
    const { eventType, severity = 'MEDIUM', description } = req.body;

    const validEventTypes = [
      'AUTHENTICATION_FAILURE', 'AUTHORIZATION_FAILURE', 'SUSPICIOUS_ACTIVITY',
      'DATA_BREACH_ATTEMPT', 'RATE_LIMIT_EXCEEDED', 'MALICIOUS_REQUEST',
      'PRIVILEGE_ESCALATION', 'ACCOUNT_TAKEOVER', 'DATA_EXFILTRATION'
    ];

    if (!validEventTypes.includes(eventType)) {
      return res.status(400).json({
        error: 'Invalid event type'
      });
    }

    await securityMonitor.logSecurityEvent({
      type: eventType,
      severity,
      userId: req.user!.id,
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 'test',
      userAgent: req.get('User-Agent') || 'test',
      resource: 'test-endpoint',
      description: description || `Test security event: ${eventType}`,
      metadata: {
        test: true,
        triggeredBy: req.user!.id
      },
      timestamp: new Date()
    });

    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'security_test',
      undefined,
      'SUCCESS',
      { eventType, severity, description }
    );

    res.json({
      success: true,
      message: 'Test security event created',
      eventType,
      severity,
      timestamp: new Date()
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'security_test',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to create test security event', 500);
  }
});

/**
 * Helper method to calculate threat level
 */
function calculateThreatLevel(criticalEvents: number, totalEvents: number): string {
  if (criticalEvents > 10) return 'CRITICAL';
  if (criticalEvents > 5 || totalEvents > 100) return 'HIGH';
  if (criticalEvents > 0 || totalEvents > 50) return 'MEDIUM';
  return 'LOW';
}

export default router;