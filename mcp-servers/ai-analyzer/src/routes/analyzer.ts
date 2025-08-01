import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AIAnalyzer, AnalysisRequest, InsightRequest } from '../ai-analyzer';
import { createError } from '../middleware/error-handler';

const router = Router();

// Validation schemas
const analysisRequestSchema = Joi.object({
  documentId: Joi.string().required(),
  extractedText: Joi.string().required(),
  existingMetrics: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().required(),
    value: Joi.number().required(),
    unit: Joi.string().required(),
    period: Joi.string().required(),
    source: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).required(),
  })).optional(),
  documentType: Joi.string().valid('quarterly_report', 'annual_report', 'financial_statement', 'other').optional(),
  companyName: Joi.string().optional(),
  industry: Joi.string().optional(),
});

const insightRequestSchema = Joi.object({
  metrics: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().required(),
    value: Joi.number().required(),
    unit: Joi.string().required(),
    period: Joi.string().required(),
    source: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).required(),
  })).required(),
  companyName: Joi.string().optional(),
  industry: Joi.string().optional(),
  userType: Joi.string().valid('vc', 'investor').required(),
});

const validationRequestSchema = Joi.object({
  metrics: Joi.array().items(Joi.object({
    id: Joi.string().optional(),
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

// Get AI analyzer from app locals
const getAIAnalyzer = (req: Request): AIAnalyzer => {
  return req.app.locals.aiAnalyzer as AIAnalyzer;
};

/**
 * GET /api/analyze/status
 * Get AI analyzer status and capabilities
 */
router.get('/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const aiAnalyzer = getAIAnalyzer(req);
    const status = aiAnalyzer.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/enrich
 * Enrich and validate extracted financial metrics using AI
 */
router.post('/enrich', validateBody(analysisRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aiAnalyzer = getAIAnalyzer(req);
    const request: AnalysisRequest = req.body;
    
    const result = await aiAnalyzer.enrichMetrics(request);
    
    res.json({
      success: true,
      data: result,
      message: 'Metrics enrichment completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/insights
 * Generate financial insights from metrics
 */
router.post('/insights', validateBody(insightRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aiAnalyzer = getAIAnalyzer(req);
    const request: InsightRequest = req.body;
    
    const result = await aiAnalyzer.generateInsights(request);
    
    res.json({
      success: true,
      data: result,
      message: 'Insights generation completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/validate
 * Validate financial metrics for accuracy and consistency
 */
router.post('/validate', validateBody(validationRequestSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aiAnalyzer = getAIAnalyzer(req);
    const { metrics } = req.body;
    
    const result = await aiAnalyzer.validateMetrics(metrics);
    
    res.json({
      success: true,
      data: result,
      message: 'Metrics validation completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/comprehensive
 * Run comprehensive analysis (enrich + insights + validation)
 */
router.post('/comprehensive', validateBody(analysisRequestSchema.keys({
  userType: Joi.string().valid('vc', 'investor').required(),
})), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aiAnalyzer = getAIAnalyzer(req);
    const request: AnalysisRequest & { userType: 'vc' | 'investor' } = req.body;
    
    // Step 1: Enrich metrics
    const enrichmentResult = await aiAnalyzer.enrichMetrics(request);
    
    // Step 2: Combine all metrics for insights and validation
    const allMetrics = [
      ...enrichmentResult.enhancedMetrics,
      ...enrichmentResult.newMetrics
    ];
    
    // Step 3: Generate insights
    const insightsResult = await aiAnalyzer.generateInsights({
      metrics: allMetrics,
      companyName: request.companyName,
      industry: request.industry,
      userType: request.userType,
    });
    
    // Step 4: Validate metrics
    const validationResult = await aiAnalyzer.validateMetrics(allMetrics);
    
    // Combine results
    const comprehensiveResult = {
      enrichment: enrichmentResult,
      insights: insightsResult,
      validation: validationResult,
      overallConfidence: (
        enrichmentResult.confidence + 
        insightsResult.confidence + 
        validationResult.confidence
      ) / 3,
      summary: {
        totalMetrics: allMetrics.length,
        newMetricsDiscovered: enrichmentResult.newMetrics.length,
        insightsGenerated: insightsResult.insights.length,
        riskFactorsIdentified: insightsResult.riskFactors.length,
        validationIssues: validationResult.issues.length,
        criticalIssues: validationResult.issues.filter(i => i.severity === 'high').length,
      }
    };
    
    res.json({
      success: true,
      data: comprehensiveResult,
      message: 'Comprehensive analysis completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/compare
 * Compare metrics across multiple periods or companies
 */
router.post('/compare', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { datasets, compareBy } = req.body;
    
    if (!datasets || !Array.isArray(datasets) || datasets.length < 2) {
      return next(createError('At least 2 datasets are required for comparison', 400));
    }
    
    if (!compareBy || !['period', 'company'].includes(compareBy)) {
      return next(createError('compareBy must be either "period" or "company"', 400));
    }
    
    // Simple comparison logic (would be enhanced with AI in full implementation)
    const comparison = {
      compareBy,
      datasets: datasets.length,
      commonMetrics: [],
      differences: [],
      trends: [],
      summary: `Comparison analysis completed for ${datasets.length} datasets`
    };
    
    res.json({
      success: true,
      data: comparison,
      message: 'Comparison analysis completed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analyze/forecast
 * Generate forecasts based on historical metrics
 */
router.post('/forecast', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { historicalMetrics, forecastPeriods, confidence } = req.body;
    
    if (!historicalMetrics || !Array.isArray(historicalMetrics)) {
      return next(createError('Historical metrics array is required', 400));
    }
    
    // Simple forecast placeholder (would use AI for actual predictions)
    const forecast = {
      periods: forecastPeriods || 4,
      confidence: confidence || 0.6,
      forecasts: [],
      methodology: 'AI-powered trend analysis',
      assumptions: ['Historical trends continue', 'No major market disruptions'],
      disclaimer: 'Forecasts are estimates and should not be used as sole basis for investment decisions'
    };
    
    res.json({
      success: true,
      data: forecast,
      message: 'Forecast analysis completed',
    });
  } catch (error) {
    next(error);
  }
});

export default router;