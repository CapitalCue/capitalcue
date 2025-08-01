import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ConstraintEngine, ConstraintRule, EvaluationRequest } from '../constraint-engine';
import { createError } from '../middleware/error-handler';

const router = Router();
const constraintEngine = new ConstraintEngine();

// Validation schemas
const constraintSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  metric: Joi.string().required(),
  operator: Joi.string().valid('<', '>', '=', '<=', '>=', '!=').required(),
  value: Joi.number().required(),
  severity: Joi.string().valid('critical', 'warning', 'info').required(),
  message: Joi.string().required(),
  isActive: Joi.boolean().default(true),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
  userId: Joi.string().optional(),
});

const evaluationSchema = Joi.object({
  constraints: Joi.array().items(constraintSchema).required(),
  metrics: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    value: Joi.number().required(),
    unit: Joi.string().required(),
    period: Joi.string().required(),
    source: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).required(),
  })).required(),
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

/**
 * POST /api/constraints/add
 * Add a new constraint
 */
router.post('/add', validateBody(constraintSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const constraint: ConstraintRule = req.body;
    
    // Validate the constraint
    const validation = constraintEngine.validateConstraint(constraint);
    if (!validation.isValid) {
      return next(createError(`Validation failed: ${validation.errors.join(', ')}`, 400));
    }

    constraintEngine.addConstraint(constraint);
    
    res.json({
      success: true,
      message: 'Constraint added successfully',
      data: constraint,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/constraints/:id
 * Update an existing constraint
 */
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const constraintId = req.params.id;
    const updates = req.body;

    const success = constraintEngine.updateConstraint(constraintId, updates);
    
    if (!success) {
      return next(createError('Constraint not found', 404));
    }

    const updatedConstraint = constraintEngine.getConstraint(constraintId);
    
    res.json({
      success: true,
      message: 'Constraint updated successfully',
      data: updatedConstraint,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/constraints/:id
 * Remove a constraint
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const constraintId = req.params.id;
    const success = constraintEngine.removeConstraint(constraintId);
    
    if (!success) {
      return next(createError('Constraint not found', 404));
    }

    res.json({
      success: true,
      message: 'Constraint removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/constraints/:id
 * Get a specific constraint
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const constraintId = req.params.id;
    const constraint = constraintEngine.getConstraint(constraintId);
    
    if (!constraint) {
      return next(createError('Constraint not found', 404));
    }

    res.json({
      success: true,
      data: constraint,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/constraints
 * Get all constraints (with optional filtering)
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { active } = req.query;
    
    let constraints;
    if (active === 'true') {
      constraints = constraintEngine.getActiveConstraints();
    } else if (active === 'false') {
      constraints = constraintEngine.getAllConstraints().filter(c => !c.isActive);
    } else {
      constraints = constraintEngine.getAllConstraints();
    }

    res.json({
      success: true,
      data: constraints,
      count: constraints.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/constraints/evaluate
 * Evaluate metrics against constraints
 */
router.post('/evaluate', validateBody(evaluationSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { constraints, metrics }: EvaluationRequest = req.body;
    
    // Load constraints into engine
    constraintEngine.loadConstraints(constraints);
    
    // Evaluate metrics
    const result = constraintEngine.evaluate(metrics);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/constraints/evaluate-by-ids
 * Evaluate metrics against specific constraint IDs
 */
router.post('/evaluate-by-ids', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { constraintIds, metrics } = req.body;
    
    if (!Array.isArray(constraintIds) || !Array.isArray(metrics)) {
      return next(createError('constraintIds and metrics must be arrays', 400));
    }
    
    const result = constraintEngine.evaluate(metrics, constraintIds);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/constraints/statistics
 * Get constraint engine statistics
 */
router.get('/statistics', (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = constraintEngine.getStatistics();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/constraints/load
 * Load multiple constraints at once
 */
router.post('/load', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { constraints } = req.body;
    
    if (!Array.isArray(constraints)) {
      return next(createError('constraints must be an array', 400));
    }

    // Validate all constraints
    for (const constraint of constraints) {
      const { error } = constraintSchema.validate(constraint);
      if (error) {
        return next(createError(`Invalid constraint: ${error.details[0].message}`, 400));
      }
    }

    constraintEngine.loadConstraints(constraints);
    
    res.json({
      success: true,
      message: `Loaded ${constraints.length} constraints successfully`,
      data: {
        loaded: constraints.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/constraints/clear
 * Clear all constraints
 */
router.delete('/clear', (req: Request, res: Response, next: NextFunction) => {
  try {
    constraintEngine.clearAllConstraints();
    
    res.json({
      success: true,
      message: 'All constraints cleared successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/constraints/validate
 * Validate a constraint without adding it
 */
router.post('/validate', validateBody(constraintSchema), (req: Request, res: Response, next: NextFunction) => {
  try {
    const constraint: ConstraintRule = req.body;
    const validation = constraintEngine.validateConstraint(constraint);
    
    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;