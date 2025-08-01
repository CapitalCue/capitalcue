import { Router, Request, Response } from 'express';
import Joi from 'joi';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const constraintSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).optional(),
  metric: Joi.string().min(1).max(100).required(),
  operator: Joi.string().valid('<', '>', '=', '<=', '>=', '!=').required(),
  value: Joi.number().required(),
  severity: Joi.string().valid('critical', 'warning', 'info').required(),
  message: Joi.string().min(1).max(500).required(),
  isActive: Joi.boolean().default(true),
});

const constraintUpdateSchema = constraintSchema.fork(
  ['name', 'metric', 'operator', 'value', 'severity', 'message'],
  (schema) => schema.optional()
);

/**
 * POST /api/constraints
 * Create a new constraint
 */
router.post('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error } = constraintSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const constraintData = {
      ...req.body,
      userId: req.user!.id,
    };

    // Test constraint validity with constraint engine
    try {
      const engineUrl = process.env.MCP_CONSTRAINT_ENGINE_URL || 'http://localhost:8002';
      await axios.post(`${engineUrl}/api/constraints/validate`, constraintData);
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw createError(`Constraint validation failed: ${error.response.data.error}`, 400);
      }
      console.warn('Constraint engine validation failed, proceeding anyway:', error.message);
    }

    const constraint = await prisma.constraint.create({
      data: constraintData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'constraint',
        resourceId: constraint.id,
        newValues: constraintData,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Constraint created successfully',
      data: { constraint },
    });
  })
);

/**
 * GET /api/constraints
 * Get user's constraints with filtering and pagination
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      isActive,
      severity,
      metric,
      search,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id,
    };

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (severity) where.severity = severity;
    if (metric) where.metric = metric;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [constraints, totalCount] = await Promise.all([
      prisma.constraint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          _count: {
            select: { alerts: true },
          },
        },
      }),
      prisma.constraint.count({ where }),
    ]);

    res.json({
      success: true,
      data: constraints,
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
 * GET /api/constraints/:id
 * Get specific constraint details
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const constraint = await prisma.constraint.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            severity: true,
            message: true,
            actualValue: true,
            expectedValue: true,
            isAcknowledged: true,
            createdAt: true,
            analysis: {
              select: {
                id: true,
                document: {
                  select: {
                    fileName: true,
                    company: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!constraint) {
      throw createError('Constraint not found', 404);
    }

    res.json({
      success: true,
      data: { constraint },
    });
  })
);

/**
 * PUT /api/constraints/:id
 * Update a constraint
 */
router.put('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error } = constraintUpdateSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const constraint = await prisma.constraint.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!constraint) {
      throw createError('Constraint not found', 404);
    }

    const oldValues = { ...constraint };
    const newValues = { ...constraint, ...req.body };

    // Test updated constraint validity
    try {
      const engineUrl = process.env.MCP_CONSTRAINT_ENGINE_URL || 'http://localhost:8002';
      await axios.post(`${engineUrl}/api/constraints/validate`, newValues);
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw createError(`Constraint validation failed: ${error.response.data.error}`, 400);
      }
      console.warn('Constraint engine validation failed, proceeding anyway:', error.message);
    }

    const updatedConstraint = await prisma.constraint.update({
      where: { id: req.params.id },
      data: req.body,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        resource: 'constraint',
        resourceId: updatedConstraint.id,
        oldValues,
        newValues: updatedConstraint,
        userId: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Constraint updated successfully',
      data: { constraint: updatedConstraint },
    });
  })
);

/**
 * DELETE /api/constraints/:id
 * Delete a constraint
 */
router.delete('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const constraint = await prisma.constraint.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!constraint) {
      throw createError('Constraint not found', 404);
    }

    await prisma.constraint.delete({
      where: { id: req.params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        resource: 'constraint',
        resourceId: req.params.id,
        oldValues: constraint,
        userId: req.user!.id,
      },
    });

    res.json({
      success: true,
      message: 'Constraint deleted successfully',
    });
  })
);

/**
 * POST /api/constraints/:id/toggle
 * Toggle constraint active status
 */
router.post('/:id/toggle',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const constraint = await prisma.constraint.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!constraint) {
      throw createError('Constraint not found', 404);
    }

    const updatedConstraint = await prisma.constraint.update({
      where: { id: req.params.id },
      data: { isActive: !constraint.isActive },
    });

    res.json({
      success: true,
      message: `Constraint ${updatedConstraint.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { constraint: updatedConstraint },
    });
  })
);

/**
 * GET /api/constraints/templates
 * Get constraint templates
 */
router.get('/templates',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userType } = req.query;
    const filterUserType = userType || req.user!.userType;

    const templates = await prisma.constraintTemplate.findMany({
      where: {
        OR: [
          { userType: filterUserType },
          { userType: 'BOTH' },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: templates,
    });
  })
);

/**
 * POST /api/constraints/templates/:id/apply
 * Apply a constraint template
 */
router.post('/templates/:id/apply',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const template = await prisma.constraintTemplate.findUnique({
      where: { id: req.params.id },
    });

    if (!template) {
      throw createError('Template not found', 404);
    }

    // Check if user can access this template
    const canAccess = template.isPublic || 
                     template.userType === req.user!.userType || 
                     template.userType === 'BOTH' ||
                     template.createdBy === req.user!.id;

    if (!canAccess) {
      throw createError('Access denied to this template', 403);
    }

    const constraintsData = (template.constraints as any[]).map(constraint => ({
      ...constraint,
      userId: req.user!.id,
    }));

    // Create constraints from template
    const createdConstraints = await prisma.constraint.createMany({
      data: constraintsData,
    });

    res.json({
      success: true,
      message: `Applied template "${template.name}" successfully`,
      data: {
        template,
        constraintsCreated: createdConstraints.count,
      },
    });
  })
);

/**
 * GET /api/constraints/metrics
 * Get available financial metrics for constraints
 */
router.get('/metrics',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get metrics from shared constants
    const { FINANCIAL_METRICS } = require('@financial-analyzer/shared');
    
    // Also get metrics that have been used in analyses for this user
    const usedMetrics = await prisma.financialMetric.findMany({
      where: {
        analysis: {
          userId: req.user!.id,
        },
      },
      select: {
        name: true,
        unit: true,
      },
      distinct: ['name'],
    });

    const allMetrics = Object.entries(FINANCIAL_METRICS).map(([key, value]) => ({
      key,
      name: value,
      category: getMetricCategory(key),
      description: getMetricDescription(key),
    }));

    // Add user-specific metrics
    const userMetrics = usedMetrics
      .filter(m => !FINANCIAL_METRICS[m.name])
      .map(m => ({
        key: m.name,
        name: m.name,
        category: 'custom',
        description: 'Custom metric from your analyses',
        unit: m.unit,
      }));

    res.json({
      success: true,
      data: {
        standardMetrics: allMetrics,
        customMetrics: userMetrics,
      },
    });
  })
);

/**
 * POST /api/constraints/bulk-toggle
 * Toggle multiple constraints active status
 */
router.post('/bulk-toggle',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { constraintIds, isActive } = req.body;

    if (!Array.isArray(constraintIds) || typeof isActive !== 'boolean') {
      throw createError('constraintIds (array) and isActive (boolean) are required', 400);
    }

    // Verify all constraints belong to user
    const constraints = await prisma.constraint.findMany({
      where: {
        id: { in: constraintIds },
        userId: req.user!.id,
      },
    });

    if (constraints.length !== constraintIds.length) {
      throw createError('Some constraints not found or access denied', 404);
    }

    const result = await prisma.constraint.updateMany({
      where: {
        id: { in: constraintIds },
        userId: req.user!.id,
      },
      data: { isActive },
    });

    res.json({
      success: true,
      message: `${result.count} constraints ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { updated: result.count },
    });
  })
);

// Helper functions
function getMetricCategory(metricKey: string): string {
  const categories: Record<string, string> = {
    pe_ratio: 'valuation',
    pb_ratio: 'valuation',
    ps_ratio: 'valuation',
    ev_ebitda: 'valuation',
    market_cap: 'valuation',
    gross_margin: 'profitability',
    operating_margin: 'profitability',
    net_margin: 'profitability',
    roe: 'profitability',
    roa: 'profitability',
    roic: 'profitability',
    revenue_growth_yoy: 'growth',
    revenue_growth_qoq: 'growth',
    earnings_growth_yoy: 'growth',
    earnings_growth_qoq: 'growth',
    current_ratio: 'liquidity',
    quick_ratio: 'liquidity',
    cash_ratio: 'liquidity',
    debt_to_equity: 'leverage',
    debt_to_assets: 'leverage',
    interest_coverage: 'leverage',
    operating_cash_flow: 'cash_flow',
    free_cash_flow: 'cash_flow',
    cash_conversion_cycle: 'cash_flow',
  };
  
  return categories[metricKey] || 'other';
}

function getMetricDescription(metricKey: string): string {
  const descriptions: Record<string, string> = {
    pe_ratio: 'Price-to-Earnings ratio - measures valuation relative to earnings',
    pb_ratio: 'Price-to-Book ratio - compares market value to book value',
    debt_to_equity: 'Debt-to-Equity ratio - measures financial leverage',
    current_ratio: 'Current ratio - measures short-term liquidity',
    revenue_growth_yoy: 'Year-over-year revenue growth rate',
    net_margin: 'Net profit margin - percentage of revenue retained as profit',
    // Add more descriptions as needed
  };
  
  return descriptions[metricKey] || 'Financial metric for analysis';
}

export default router;