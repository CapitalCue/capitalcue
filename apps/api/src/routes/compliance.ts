/**
 * Compliance Reporting API Routes
 * Handles compliance report generation and management
 */

import express from 'express';
import { authenticateJWT, requirePermission, Permission, AuthenticatedRequest } from '../middleware/advanced-auth';
import { createError } from '../middleware/error-handler';
import { complianceReporting } from '../services/compliance-reporting';
import { auditLogger, AuditEventType } from '../services/audit-logger';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for report generation
const reportGenerationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 reports per hour
  message: 'Too many report generation requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Get compliance dashboard (Admin only)
 */
router.get('/dashboard', authenticateJWT, requirePermission(Permission.COMPLIANCE_VIEW), async (req: AuthenticatedRequest, res) => {
  try {
    const dashboardData = await complianceReporting.getComplianceDashboard();

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_dashboard',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_dashboard',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get compliance dashboard', 500);
  }
});

/**
 * Generate GDPR compliance report (Admin only)
 */
router.post('/reports/gdpr', authenticateJWT, requirePermission(Permission.COMPLIANCE_EXPORT), reportGenerationLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        error: 'Period start and end dates are required'
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Period start must be before period end'
      });
    }

    const reportId = await complianceReporting.generateGDPRReport(
      startDate,
      endDate,
      req.user!.id
    );

    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'gdpr_report',
      reportId,
      'SUCCESS',
      { periodStart, periodEnd }
    );

    res.status(202).json({
      success: true,
      reportId,
      message: 'GDPR compliance report generation started',
      estimatedCompletion: '5-10 minutes'
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'gdpr_report',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to generate GDPR report', 500);
  }
});

/**
 * Generate SOX compliance report (Admin only)
 */
router.post('/reports/sox', authenticateJWT, requirePermission(Permission.COMPLIANCE_EXPORT), reportGenerationLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        error: 'Period start and end dates are required'
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Period start must be before period end'
      });
    }

    const reportId = await complianceReporting.generateSOXReport(
      startDate,
      endDate,
      req.user!.id
    );

    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'sox_report',
      reportId,
      'SUCCESS',
      { periodStart, periodEnd }
    );

    res.status(202).json({
      success: true,
      reportId,
      message: 'SOX compliance report generation started',
      estimatedCompletion: '5-10 minutes'
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'sox_report',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to generate SOX report', 500);
  }
});

/**
 * Generate custom compliance report (Admin only)
 */
router.post('/reports/custom', authenticateJWT, requirePermission(Permission.COMPLIANCE_EXPORT), reportGenerationLimit, async (req: AuthenticatedRequest, res) => {
  try {
    const { reportType, frameworks, periodStart, periodEnd, customRequirements } = req.body;

    if (!reportType || !frameworks || !periodStart || !periodEnd) {
      return res.status(400).json({
        error: 'Report type, frameworks, and period dates are required'
      });
    }

    if (!Array.isArray(frameworks)) {
      return res.status(400).json({
        error: 'Frameworks must be an array'
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (startDate >= endDate) {
      return res.status(400).json({
        error: 'Period start must be before period end'
      });
    }

    const reportId = await complianceReporting.generateCustomReport(
      reportType,
      frameworks,
      startDate,
      endDate,
      req.user!.id,
      customRequirements
    );

    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'custom_compliance_report',
      reportId,
      'SUCCESS',
      { reportType, frameworks, periodStart, periodEnd }
    );

    res.status(202).json({
      success: true,
      reportId,
      message: 'Custom compliance report generation started',
      estimatedCompletion: '5-10 minutes'
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_CREATE,
      req,
      'custom_compliance_report',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to generate custom report', 500);
  }
});

/**
 * Get compliance report status
 */
router.get('/reports/:reportId/status', authenticateJWT, requirePermission(Permission.COMPLIANCE_VIEW), async (req: AuthenticatedRequest, res) => {
  try {
    const { reportId } = req.params;

    const reportStatus = await complianceReporting.getReportStatus(reportId);

    if (!reportStatus) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_report_status',
      reportId,
      'SUCCESS'
    );

    res.json({
      success: true,
      report: reportStatus
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_report_status',
      req.params.reportId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get report status', 500);
  }
});

/**
 * Download compliance report
 */
router.get('/reports/:reportId/download', authenticateJWT, requirePermission(Permission.COMPLIANCE_EXPORT), async (req: AuthenticatedRequest, res) => {
  try {
    const { reportId } = req.params;

    const reportStatus = await complianceReporting.getReportStatus(reportId);

    if (!reportStatus) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }

    if (reportStatus.status !== 'COMPLETED') {
      return res.status(400).json({
        error: 'Report is not ready for download',
        status: reportStatus.status
      });
    }

    if (!reportStatus.downloadUrl) {
      return res.status(404).json({
        error: 'Report file not found'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_EXPORT,
      req,
      'compliance_report_download',
      reportId,
      'SUCCESS'
    );

    // Set appropriate headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${reportId}_compliance_report.json"`);

    // Serve the file
    res.download(reportStatus.downloadUrl);

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_EXPORT,
      req,
      'compliance_report_download',
      req.params.reportId,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to download report', 500);
  }
});

/**
 * Get compliance frameworks information
 */
router.get('/frameworks', authenticateJWT, requirePermission(Permission.COMPLIANCE_VIEW), async (req: AuthenticatedRequest, res) => {
  try {
    const frameworks = [
      {
        id: 'gdpr',
        name: 'General Data Protection Regulation',
        description: 'EU regulation on data protection and privacy',
        region: 'EU',
        applicability: 'Organizations processing EU residents\' data',
        keyRequirements: [
          'Lawful basis for processing',
          'Data subject rights',
          'Privacy by design',
          'Breach notification',
          'Data protection officer'
        ],
        penalties: 'Up to €20 million or 4% of global turnover'
      },
      {
        id: 'sox',
        name: 'Sarbanes-Oxley Act',
        description: 'US federal law on corporate accountability',
        region: 'US',
        applicability: 'Publicly traded companies',
        keyRequirements: [
          'Internal controls over financial reporting',
          'Management certification',
          'Auditor independence',
          'Corporate responsibility',
          'Enhanced financial disclosures'
        ],
        penalties: 'Fines and imprisonment for executives'
      },
      {
        id: 'ccpa',
        name: 'California Consumer Privacy Act',
        description: 'California state law on consumer privacy rights',
        region: 'California, US',
        applicability: 'Businesses meeting CCPA thresholds',
        keyRequirements: [
          'Consumer rights to know, delete, opt-out',
          'Non-discrimination provisions',
          'Privacy policy requirements',
          'Service provider agreements'
        ],
        penalties: 'Up to $7,500 per violation'
      },
      {
        id: 'hipaa',
        name: 'Health Insurance Portability and Accountability Act',
        description: 'US law on healthcare information privacy',
        region: 'US',
        applicability: 'Healthcare entities and business associates',
        keyRequirements: [
          'Administrative safeguards',
          'Physical safeguards',
          'Technical safeguards',
          'Business associate agreements'
        ],
        penalties: 'Up to $1.5 million per incident'
      }
    ];

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_frameworks',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      frameworks
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_frameworks',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get compliance frameworks', 500);
  }
});

/**
 * Get compliance requirements checklist
 */
router.get('/checklist/:framework', authenticateJWT, requirePermission(Permission.COMPLIANCE_VIEW), async (req: AuthenticatedRequest, res) => {
  try {
    const { framework } = req.params;

    const checklists: Record<string, any> = {
      gdpr: {
        framework: 'GDPR',
        categories: [
          {
            name: 'Legal Basis and Consent',
            requirements: [
              { id: 'legal-basis', text: 'Identify and document legal basis for all processing activities', status: 'completed' },
              { id: 'consent-mechanism', text: 'Implement clear consent mechanism where applicable', status: 'completed' },
              { id: 'consent-withdrawal', text: 'Provide easy consent withdrawal mechanism', status: 'completed' }
            ]
          },
          {
            name: 'Data Subject Rights',
            requirements: [
              { id: 'access-requests', text: 'Implement data access request handling', status: 'completed' },
              { id: 'deletion-requests', text: 'Implement data deletion request handling', status: 'completed' },
              { id: 'portability', text: 'Provide data portability functionality', status: 'completed' }
            ]
          },
          {
            name: 'Security and Privacy',
            requirements: [
              { id: 'encryption', text: 'Implement encryption for sensitive data', status: 'completed' },
              { id: 'access-controls', text: 'Implement role-based access controls', status: 'completed' },
              { id: 'audit-logging', text: 'Implement comprehensive audit logging', status: 'completed' }
            ]
          }
        ]
      },
      sox: {
        framework: 'SOX',
        categories: [
          {
            name: 'Internal Controls',
            requirements: [
              { id: 'control-documentation', text: 'Document all internal controls', status: 'completed' },
              { id: 'segregation-duties', text: 'Implement segregation of duties', status: 'completed' },
              { id: 'change-management', text: 'Implement change management procedures', status: 'completed' }
            ]
          },
          {
            name: 'Audit and Monitoring',
            requirements: [
              { id: 'audit-trail', text: 'Maintain comprehensive audit trail', status: 'completed' },
              { id: 'management-oversight', text: 'Implement management oversight controls', status: 'completed' },
              { id: 'testing-procedures', text: 'Regular testing of internal controls', status: 'in-progress' }
            ]
          }
        ]
      }
    };

    const checklist = checklists[framework.toLowerCase()];

    if (!checklist) {
      return res.status(404).json({
        error: 'Compliance framework not found'
      });
    }

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_checklist',
      framework,
      'SUCCESS'
    );

    res.json({
      success: true,
      checklist
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_checklist',
      req.params.framework,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get compliance checklist', 500);
  }
});

/**
 * Get compliance training materials
 */
router.get('/training', authenticateJWT, requirePermission(Permission.COMPLIANCE_VIEW), async (req: AuthenticatedRequest, res) => {
  try {
    const trainingMaterials = [
      {
        id: 'gdpr-overview',
        title: 'GDPR Overview and Requirements',
        description: 'Comprehensive overview of GDPR requirements and implementation',
        framework: 'GDPR',
        type: 'document',
        duration: '30 minutes',
        lastUpdated: new Date('2024-01-01'),
        topics: ['Data protection principles', 'Data subject rights', 'Breach notification', 'Privacy by design']
      },
      {
        id: 'sox-controls',
        title: 'SOX Internal Controls Training',
        description: 'Training on SOX internal controls requirements',
        framework: 'SOX',
        type: 'video',
        duration: '45 minutes',
        lastUpdated: new Date('2024-01-15'),
        topics: ['Internal controls framework', 'Management certification', 'Audit requirements']
      },
      {
        id: 'data-privacy-best-practices',
        title: 'Data Privacy Best Practices',
        description: 'Best practices for data privacy and protection',
        framework: 'General',
        type: 'interactive',
        duration: '60 minutes',
        lastUpdated: new Date('2024-02-01'),
        topics: ['Data minimization', 'Security measures', 'Incident response', 'Privacy by design']
      }
    ];

    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_training',
      undefined,
      'SUCCESS'
    );

    res.json({
      success: true,
      trainingMaterials
    });

  } catch (error) {
    await auditLogger.logDataAccess(
      AuditEventType.DATA_READ,
      req,
      'compliance_training',
      undefined,
      'ERROR',
      { error: error.message }
    );

    throw createError('Failed to get training materials', 500);
  }
});

export default router;