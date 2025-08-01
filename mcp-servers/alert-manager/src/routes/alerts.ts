import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AlertManager, AlertGenerationRequest, AlertRule } from '../alert-manager';
import { createError } from '../middleware/error-handler';

const router = Router();

// Validation schemas
const alertGenerationSchema = Joi.object({
  violations: Joi.array().items(Joi.object({
    constraintId: Joi.string().required(),
    metric: Joi.string().required(),
    actualValue: Joi.number().required(),
    expectedValue: Joi.number().required(),
    operator: Joi.string().required(),
    severity: Joi.string().valid('critical', 'warning', 'info').required(),
    message: Joi.string().required(),
  })).required(),
  analysisId: Joi.string().required(),
  userId: Joi.string().required(),
  documentId: Joi.string().optional(),
  companyName: Joi.string().optional(),
});

const alertRuleSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  severity: Joi.string().valid('critical', 'warning', 'info').required(),
  conditions: Joi.array().items(Joi.object({
    type: Joi.string().valid('metric_value', 'violation_count', 'severity_level').required(),
    metric: Joi.string().optional(),
    operator: Joi.string().valid('<', '>', '=', '<=', '>=', '!=').required(),
    value: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  })).required(),
  actions: Joi.array().items(Joi.object({
    type: Joi.string().valid('email', 'webhook', 'sms', 'slack').required(),
    config: Joi.object().required(),
    isEnabled: Joi.boolean().default(true),
  })).required(),
  isActive: Joi.boolean().default(true),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});

// Middleware for validation
const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next(createError(error.details[0].message, 400));
    }
    next();
  };
};

// Get alert manager from app locals
const getAlertManager = (req: Request): AlertManager => {
  return req.app.locals.alertManager as AlertManager;
};

/**
 * POST /api/alerts/generate
 * Generate alerts from constraint violations
 */
router.post('/generate', validateBody(alertGenerationSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const request: AlertGenerationRequest = req.body;
    
    const alerts = alertManager.generateAlerts(request);
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      message: `Generated ${alerts.length} alerts`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts
 * Get alerts with optional filtering
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const { userId, severity, isAcknowledged, analysisId, fromDate, toDate, page = 1, limit = 20 } = req.query;
    
    const filters: any = {};
    if (userId) filters.userId = userId as string;
    if (severity) filters.severity = severity as string;
    if (isAcknowledged !== undefined) filters.isAcknowledged = isAcknowledged === 'true';
    if (analysisId) filters.analysisId = analysisId as string;
    if (fromDate) filters.fromDate = new Date(fromDate as string);
    if (toDate) filters.toDate = new Date(toDate as string);
    
    const allAlerts = alertManager.getAlerts(filters);
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedAlerts = allAlerts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedAlerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allAlerts.length,
        totalPages: Math.ceil(allAlerts.length / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/:id
 * Get a specific alert
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const alertId = req.params.id;
    
    const alert = alertManager.getAlert(alertId);
    
    if (!alert) {
      return next(createError('Alert not found', 404));
    }
    
    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/:id/acknowledge
 * Acknowledge an alert
 */
router.put('/:id/acknowledge', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const alertId = req.params.id;
    const { userId } = req.body;
    
    if (!userId) {
      return next(createError('userId is required', 400));
    }
    
    const success = alertManager.acknowledgeAlert(alertId, userId);
    
    if (!success) {
      return next(createError('Alert not found', 404));
    }
    
    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/bulk-acknowledge
 * Acknowledge multiple alerts
 */
router.put('/bulk-acknowledge', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const { alertIds, userId } = req.body;
    
    if (!alertIds || !Array.isArray(alertIds) || !userId) {
      return next(createError('alertIds (array) and userId are required', 400));
    }
    
    const acknowledgedCount = alertManager.bulkAcknowledgeAlerts(alertIds, userId);
    
    res.json({
      success: true,
      data: {
        requested: alertIds.length,
        acknowledged: acknowledgedCount,
      },
      message: `Acknowledged ${acknowledgedCount} of ${alertIds.length} alerts`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/alerts/:id
 * Delete an alert
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const alertId = req.params.id;
    
    const success = alertManager.deleteAlert(alertId);
    
    if (!success) {
      return next(createError('Alert not found', 404));
    }
    
    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const { userId } = req.query;
    
    const stats = alertManager.getAlertStats(userId as string);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/rules
 * Add a new alert rule
 */
router.post('/rules', validateBody(alertRuleSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const rule: AlertRule = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    alertManager.addAlertRule(rule);
    
    res.json({
      success: true,
      data: rule,
      message: 'Alert rule added successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/rules
 * Get alert rules
 */
router.get('/rules', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const rules = alertManager.getAlertRules();
    
    res.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/templates
 * Get alert templates
 */
router.get('/templates', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    const { userType } = req.query;
    
    const templates = alertManager.getAlertTemplates(userType as 'vc' | 'investor');
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/alerts/clear
 * Clear all alerts (for testing)
 */
router.delete('/clear', (req: Request, res: Response, next: NextFunction) => {
  try {
    const alertManager = getAlertManager(req);
    alertManager.clearAllAlerts();
    
    res.json({
      success: true,
      message: 'All alerts cleared',
    });
  } catch (error) {
    next(error);
  }
});

export default router;