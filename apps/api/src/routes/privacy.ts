/**
 * Privacy and GDPR Compliance API Routes
 * Handles data export, deletion requests, and consent management
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requirePermission, Permission, AuthenticatedRequest } from '../middleware/advanced-auth';
import { createError } from '../middleware/error-handler';
import { privacyComplianceService } from '../services/privacy-compliance';
import { auditLogger, AuditEventType } from '../services/audit-logger';
import { validateInput } from '../utils/encryption';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for privacy requests
const privacyRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day per user
  message: 'Too many privacy requests. Please try again tomorrow.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request data export (GDPR Article 15 - Right of Access)
 */
router.post('/export-request', authenticateJWT, privacyRateLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { requestType, options } = req.body;

    // Validate input
    const validation = validateInput(JSON.stringify(req.body));
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid input detected',
        threats: validation.threats
      });
    }

    const validRequestTypes = ['PERSONAL_DATA', 'ACTIVITY_LOG', 'DOCUMENTS', 'ANALYSIS_RESULTS', 'FULL_EXPORT'];
    if (!validRequestTypes.includes(requestType)) {
      return res.status(400).json({
        error: 'Invalid request type'
      });
    }

    const requestId = await privacyComplianceService.requestDataExport(
      req.user!.id,
      requestType,
      options || {}
    );

    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'data_export_request',
      requestId,
      'SUCCESS',
      { requestType, options }
    );

    res.status(202).json({
      success: true,
      requestId,
      message: 'Data export request created. You will be notified when ready.',
      estimatedCompletion: '24-48 hours'
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'data_export_request',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to create data export request', 500);
  }
});

/**
 * Get data export request status
 */
router.get('/export-request/:requestId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;

    const exportRequest = await prisma.dataExportRequest.findFirst({
      where: {
        id: requestId,
        userId: req.user!.id
      }
    });

    if (!exportRequest) {
      return res.status(404).json({
        error: 'Export request not found'
      });
    }

    const response: any = {
      id: exportRequest.id,
      requestType: exportRequest.requestType,
      status: exportRequest.status,
      requestedAt: exportRequest.requestedAt,
      completedAt: exportRequest.completedAt,
      expiresAt: exportRequest.expiresAt
    };

    if (exportRequest.status === 'COMPLETED' && exportRequest.downloadUrl) {
      response.downloadUrl = `/api/privacy/download/${exportRequest.id}`;
    }

    res.json(response);

  } catch (error) {
    throw createError('Failed to get export request status', 500);
  }
});

/**
 * Download exported data
 */
router.get('/download/:requestId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;

    const exportRequest = await prisma.dataExportRequest.findFirst({
      where: {
        id: requestId,
        userId: req.user!.id,
        status: 'COMPLETED'
      }
    });

    if (!exportRequest || !exportRequest.downloadUrl) {
      return res.status(404).json({
        error: 'Export file not found or not ready'
      });
    }

    // Check if request has expired
    if (exportRequest.expiresAt && exportRequest.expiresAt < new Date()) {
      return res.status(410).json({
        error: 'Export file has expired'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_EXPORT,
      req,
      'data_export_download',
      requestId,
      'SUCCESS'
    );

    // Serve the file
    res.download(exportRequest.downloadUrl, `data_export_${requestId}.json`);

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_EXPORT,
      req,
      'data_export_download',
      req.params.requestId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to download export file', 500);
  }
});

/**
 * Request data deletion (GDPR Article 17 - Right to be Forgotten)
 */
router.post('/deletion-request', authenticateJWT, privacyRateLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { deletionType, options } = req.body;

    // Validate input
    const validation = validateInput(JSON.stringify(req.body));
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid input detected',
        threats: validation.threats
      });
    }

    const validDeletionTypes = ['ACCOUNT_DELETION', 'DATA_PURGE', 'DOCUMENT_DELETION', 'ANALYSIS_DELETION', 'PARTIAL_DELETION'];
    if (!validDeletionTypes.includes(deletionType)) {
      return res.status(400).json({
        error: 'Invalid deletion type'
      });
    }

    const requestId = await privacyComplianceService.requestDataDeletion(
      req.user!.id,
      deletionType,
      options || {}
    );

    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'data_deletion_request',
      requestId,
      'SUCCESS',
      { deletionType, options }
    );

    const warningPeriod = deletionType === 'ACCOUNT_DELETION' ? '30 days' : '7 days';

    res.status(202).json({
      success: true,
      requestId,
      message: `Data deletion request created. Deletion will be processed after ${warningPeriod} notice period.`,
      warningPeriod,
      canCancel: true
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'data_deletion_request',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to create data deletion request', 500);
  }
});

/**
 * Get data deletion request status
 */
router.get('/deletion-request/:requestId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;

    const deletionRequest = await prisma.dataDeletionRequest.findFirst({
      where: {
        id: requestId,
        userId: req.user!.id
      }
    });

    if (!deletionRequest) {
      return res.status(404).json({
        error: 'Deletion request not found'
      });
    }

    res.json({
      id: deletionRequest.id,
      requestType: deletionRequest.requestType,
      status: deletionRequest.status,
      requestedAt: deletionRequest.requestedAt,
      scheduledFor: deletionRequest.scheduledFor,
      completedAt: deletionRequest.completedAt,
      canCancel: deletionRequest.status === 'PENDING' && deletionRequest.scheduledFor > new Date()
    });

  } catch (error) {
    throw createError('Failed to get deletion request status', 500);
  }
});

/**
 * Cancel data deletion request
 */
router.delete('/deletion-request/:requestId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { requestId } = req.params;

    const deletionRequest = await prisma.dataDeletionRequest.findFirst({
      where: {
        id: requestId,
        userId: req.user!.id,
        status: 'PENDING'
      }
    });

    if (!deletionRequest) {
      return res.status(404).json({
        error: 'Deletion request not found or cannot be cancelled'
      });
    }

    // Check if still within cancellation period
    if (deletionRequest.scheduledFor <= new Date()) {
      return res.status(400).json({
        error: 'Deletion request can no longer be cancelled'
      });
    }

    await prisma.dataDeletionRequest.delete({
      where: { id: requestId }
    });

    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'data_deletion_cancelled',
      requestId,
      'SUCCESS'
    );

    res.json({
      success: true,
      message: 'Data deletion request cancelled successfully'
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'data_deletion_cancelled',
      req.params.requestId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to cancel deletion request', 500);
  }
});

/**
 * Record user consent
 */
router.post('/consent', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const { consentType, version, granted } = req.body;

    const validConsentTypes = ['privacy_policy', 'terms_of_service', 'marketing', 'data_retention'];
    if (!validConsentTypes.includes(consentType)) {
      return res.status(400).json({
        error: 'Invalid consent type'
      });
    }

    if (typeof granted !== 'boolean') {
      return res.status(400).json({
        error: 'Consent granted must be boolean'
      });
    }

    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
                     req.headers['x-real-ip'] as string ||
                     req.connection.remoteAddress ||
                     'unknown';

    const userAgent = req.get('User-Agent') || 'unknown';

    await privacyComplianceService.recordConsent(
      req.user!.id,
      consentType,
      version || '1.0',
      granted,
      ipAddress,
      userAgent
    );

    await auditLogger.logDataAccess(
      granted ? AuditEventType.PRIVACY_POLICY_ACCEPTED : AuditEventType.GDPR_REQUEST,
      req,
      'consent_record',
      undefined,
      'SUCCESS',
      { consentType, version, granted }
    );

    res.json({
      success: true,
      message: 'Consent recorded successfully',
      consentType,
      granted,
      recordedAt: new Date()
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.GDPR_REQUEST,
      req,
      'consent_record',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to record consent', 500);
  }
});

/**
 * Get user's consent history
 */
router.get('/consent-history', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const consentHistory = await privacyComplianceService.getConsentHistory(req.user!.id);

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'consent_history',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      consentHistory
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'consent_history',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get consent history', 500);
  }
});

/**
 * Get current privacy settings
 */
router.get('/settings', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        privacyPolicyAccepted: true,
        privacyPolicyVersion: true,
        termsAccepted: true,
        termsVersion: true,
        dataRetentionConsent: true,
        marketingConsent: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'privacy_settings',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      privacySettings: user
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'privacy_settings',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get privacy settings', 500);
  }
});

/**
 * Get data processing activities (GDPR Article 30)
 */
router.get('/processing-activities', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    // Get user's data processing activities
    const activities = [
      {
        purpose: 'Financial Analysis',
        legalBasis: 'Legitimate Interest',
        dataCategories: ['Document Content', 'Financial Metrics', 'Analysis Results'],
        retention: '7 years',
        sharing: 'None'
      },
      {
        purpose: 'User Account Management',
        legalBasis: 'Contract Performance',
        dataCategories: ['Name', 'Email', 'Authentication Data'],
        retention: 'Account lifetime + 1 year',
        sharing: 'None'
      },
      {
        purpose: 'System Security and Audit',
        legalBasis: 'Legitimate Interest',
        dataCategories: ['Access Logs', 'IP Addresses', 'Usage Patterns'],
        retention: '3 years',
        sharing: 'Law enforcement if required'
      }
    ];

    if (req.user!.marketingConsent) {
      activities.push({
        purpose: 'Marketing Communications',
        legalBasis: 'Consent',
        dataCategories: ['Email', 'Usage Preferences'],
        retention: 'Until consent withdrawn',
        sharing: 'Marketing service providers'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'processing_activities',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      processingActivities: activities,
      lastUpdated: new Date()
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'processing_activities',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get processing activities', 500);
  }
});

/**
 * Admin endpoint to view all privacy requests (requires admin permission)
 */
router.get('/admin/requests', authenticateJWT, requirePermission(Permission.COMPLIANCE_VIEW), async (req: AuthenticatedRequest, res) => {
  try {
    const { type, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (type === 'export') {
      where.dataExportReq = { some: {} };
    } else if (type === 'deletion') {
      where.dataDeletionReq = { some: {} };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        dataExportReq: {
          where: status ? { status: status as string } : undefined,
          orderBy: { requestedAt: 'desc' }
        },
        dataDeletionReq: {
          where: status ? { status: status as string } : undefined,
          orderBy: { requestedAt: 'desc' }
        }
      },
      skip: offset,
      take: limitNum
    });

    const total = await prisma.user.count({ where });

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'privacy_requests_admin',
      undefined,
      'SUCCESS',
      { type, status, page, limit }
    );

    res.json({
      success: true,
      requests: users,
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
      'privacy_requests_admin',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get privacy requests', 500);
  }
});

export default router;