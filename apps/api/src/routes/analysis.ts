import { Router, Request, Response } from 'express';
import Joi from 'joi';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth';
import { claudeAI } from '../services/claude-ai';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const runAnalysisSchema = Joi.object({
  documentId: Joi.string().required(),
  constraintIds: Joi.array().items(Joi.string()).min(1).required(),
  includeAIInsights: Joi.boolean().default(false),
});

/**
 * POST /api/analysis/run
 * Run financial analysis on a document
 */
router.post('/run',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { error } = runAnalysisSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const { documentId, constraintIds, includeAIInsights } = req.body;

    // Verify document exists and belongs to user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: req.user!.id,
      },
      include: {
        company: true,
      },
    });

    if (!document) {
      throw createError('Document not found', 404);
    }

    if (document.status !== 'PROCESSED') {
      throw createError('Document must be processed before analysis', 400);
    }

    // Verify constraints exist and belong to user
    const constraints = await prisma.constraint.findMany({
      where: {
        id: { in: constraintIds },
        userId: req.user!.id,
        isActive: true,
      },
    });

    if (constraints.length !== constraintIds.length) {
      throw createError('Some constraints not found or inactive', 404);
    }

    // Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        documentId,
        userId: req.user!.id,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Create constraint associations
    await prisma.analysisConstraint.createMany({
      data: constraintIds.map(constraintId => ({
        analysisId: analysis.id,
        constraintId,
      })),
    });

    // Start analysis process asynchronously
    runAnalysisAsync(analysis.id, document, constraints, includeAIInsights);

    res.status(201).json({
      success: true,
      message: 'Analysis started successfully',
      data: { analysis },
    });
  })
);

/**
 * GET /api/analysis
 * Get user's analyses with filtering and pagination
 */
router.get('/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      documentId,
      status,
      companyId,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId: req.user!.id,
    };

    if (documentId) where.documentId = documentId;
    if (status) where.status = status;
    if (companyId) {
      where.document = { companyId };
    }

    const [analyses, totalCount] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          document: {
            select: {
              id: true,
              fileName: true,
              documentType: true,
              company: {
                select: { name: true, ticker: true },
              },
            },
          },
          _count: {
            select: {
              alerts: true,
              financialMetrics: true,
            },
          },
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    res.json({
      success: true,
      data: analyses,
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
 * GET /api/analysis/:id
 * Get specific analysis details
 */
router.get('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        document: {
          include: {
            company: true,
          },
        },
        financialMetrics: {
          orderBy: { name: 'asc' },
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          include: {
            constraint: {
              select: {
                name: true,
                severity: true,
              },
            },
          },
        },
        analysisConstraints: {
          include: {
            constraint: true,
          },
        },
      },
    });

    if (!analysis) {
      throw createError('Analysis not found', 404);
    }

    // Calculate statistics
    const stats = {
      totalMetrics: analysis.financialMetrics.length,
      totalAlerts: analysis.alerts.length,
      criticalAlerts: analysis.alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: analysis.alerts.filter(a => a.severity === 'warning').length,
      infoAlerts: analysis.alerts.filter(a => a.severity === 'info').length,
      unacknowledgedAlerts: analysis.alerts.filter(a => !a.isAcknowledged).length,
      constraintsEvaluated: analysis.analysisConstraints.length,
    };

    // Parse AI insights if available
    let aiInsights = null;
    if (analysis.aiInsights) {
      try {
        aiInsights = JSON.parse(analysis.aiInsights);
      } catch (error) {
        console.warn('Failed to parse AI insights:', error);
      }
    }

    res.json({
      success: true,
      data: {
        analysis: {
          ...analysis,
          aiInsights,
        },
        stats,
      },
    });
  })
);

/**
 * DELETE /api/analysis/:id
 * Delete an analysis
 */
router.delete('/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!analysis) {
      throw createError('Analysis not found', 404);
    }

    await prisma.analysis.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Analysis deleted successfully',
    });
  })
);

/**
 * GET /api/analysis/:id/report
 * Generate analysis report
 */
router.get('/:id/report',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { format = 'json' } = req.query;

    const analysis = await prisma.analysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        document: {
          include: {
            company: true,
          },
        },
        financialMetrics: true,
        alerts: {
          include: {
            constraint: true,
          },
        },
        analysisConstraints: {
          include: {
            constraint: true,
          },
        },
      },
    });

    if (!analysis) {
      throw createError('Analysis not found', 404);
    }

    const report = {
      analysis: {
        id: analysis.id,
        status: analysis.status,
        startedAt: analysis.startedAt,
        completedAt: analysis.completedAt,
        duration: analysis.completedAt 
          ? Math.round((analysis.completedAt.getTime() - analysis.startedAt.getTime()) / 1000)
          : null,
      },
      document: {
        fileName: analysis.document.fileName,
        documentType: analysis.document.documentType,
        company: analysis.document.company,
      },
      metrics: analysis.financialMetrics.map(m => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        period: m.period,
        confidence: m.confidence,
      })),
      constraints: analysis.analysisConstraints.map(ac => ({
        id: ac.constraint.id,
        name: ac.constraint.name,
        metric: ac.constraint.metric,
        operator: ac.constraint.operator,
        value: ac.constraint.value,
        severity: ac.constraint.severity,
        message: ac.constraint.message,
      })),
      alerts: analysis.alerts.map(alert => ({
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        actualValue: alert.actualValue,
        expectedValue: alert.expectedValue,
        isAcknowledged: alert.isAcknowledged,
        createdAt: alert.createdAt,
        constraint: alert.constraint.name,
      })),
      summary: {
        totalMetrics: analysis.financialMetrics.length,
        totalConstraints: analysis.analysisConstraints.length,
        totalAlerts: analysis.alerts.length,
        criticalAlerts: analysis.alerts.filter(a => a.severity === 'critical').length,
        warningAlerts: analysis.alerts.filter(a => a.severity === 'warning').length,
        infoAlerts: analysis.alerts.filter(a => a.severity === 'info').length,
        complianceRate: analysis.analysisConstraints.length > 0 
          ? Math.round(((analysis.analysisConstraints.length - analysis.alerts.length) / analysis.analysisConstraints.length) * 100)
          : 100,
      },
    };

    if (format === 'csv') {
      // Return CSV format
      const csv = generateCSVReport(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-${analysis.id}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: { report },
      });
    }
  })
);

/**
 * POST /api/analysis/:id/ai-insights
 * Get AI-powered insights for an analysis
 */
router.post('/:id/ai-insights',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        document: {
          include: {
            company: true,
          },
        },
        financialMetrics: true,
        analysisConstraints: {
          include: {
            constraint: true,
          },
        },
      },
    });

    if (!analysis) {
      throw createError('Analysis not found', 404);
    }

    if (analysis.status !== 'COMPLETED') {
      throw createError('Analysis must be completed to generate AI insights', 400);
    }

    // Prepare data for AI analysis
    const financialData = analysis.financialMetrics.map(metric => ({
      [metric.name]: metric.value,
      [`${metric.name}_period`]: metric.period,
      [`${metric.name}_confidence`]: metric.confidence,
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

    const analysisContext = {
      userType: req.user!.userType as 'VC' | 'INVESTOR',
      constraints: analysis.analysisConstraints.map(ac => ({
        name: ac.constraint.name,
        metric: ac.constraint.metric,
        operator: ac.constraint.operator,
        value: ac.constraint.value,
        priority: ac.constraint.severity,
      })),
      documentMetadata: {
        filename: analysis.document.fileName,
        fileType: analysis.document.documentType,
        extractedMetrics: financialData,
      },
    };

    // Get AI insights
    const insights = await claudeAI.analyzeFinancialData([financialData], analysisContext);
    const constraintSuggestions = await claudeAI.suggestConstraints([financialData], analysisContext);
    const predictiveInsights = await claudeAI.generatePredictiveInsights([financialData], analysisContext);

    res.json({
      success: true,
      data: {
        insights,
        constraintSuggestions,
        predictiveInsights,
        serviceStatus: claudeAI.getStatus(),
      },
    });
  })
);

/**
 * POST /api/analysis/document/:documentId/ai-summary
 * Get AI summary and insights for a document
 */
router.post('/document/:documentId/ai-summary',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.documentId,
        userId: req.user!.id,
      },
      include: {
        company: true,
      },
    });

    if (!document) {
      throw createError('Document not found', 404);
    }

    if (document.status !== 'PROCESSED') {
      throw createError('Document must be processed before AI analysis', 400);
    }

    // Get existing constraints for context
    const userConstraints = await prisma.constraint.findMany({
      where: {
        userId: req.user!.id,
        isActive: true,
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const analysisContext = {
      userType: req.user!.userType as 'VC' | 'INVESTOR',
      constraints: userConstraints.map(c => ({
        name: c.name,
        metric: c.metric,
        operator: c.operator,
        value: c.value,
        priority: c.severity,
      })),
      documentMetadata: {
        filename: document.fileName,
        fileType: document.documentType,
        extractedMetrics: document.extractedText ? {} : {},
      },
    };

    // Get AI document summary
    const summary = await claudeAI.summarizeDocument(
      document.extractedText || 'Document text not available',
      analysisContext
    );

    res.json({
      success: true,
      data: {
        summary,
        serviceStatus: claudeAI.getStatus(),
      },
    });
  })
);

/**
 * GET /api/analysis/ai-status
 * Get Claude AI service status
 */
router.get('/ai-status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = claudeAI.getStatus();
    
    res.json({
      success: true,
      data: status,
    });
  })
);

/**
 * POST /api/analysis/:id/rerun
 * Rerun an analysis with the same constraints
 */
router.post('/:id/rerun',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const originalAnalysis = await prisma.analysis.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        document: {
          include: { company: true },
        },
        analysisConstraints: {
          include: { constraint: true },
        },
      },
    });

    if (!originalAnalysis) {
      throw createError('Analysis not found', 404);
    }

    // Create new analysis
    const newAnalysis = await prisma.analysis.create({
      data: {
        documentId: originalAnalysis.documentId,
        userId: req.user!.id,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Copy constraint associations
    await prisma.analysisConstraint.createMany({
      data: originalAnalysis.analysisConstraints.map(ac => ({
        analysisId: newAnalysis.id,
        constraintId: ac.constraintId,
      })),
    });

    // Start analysis process
    const constraints = originalAnalysis.analysisConstraints.map(ac => ac.constraint);
    runAnalysisAsync(newAnalysis.id, originalAnalysis.document, constraints, false);

    res.json({
      success: true,
      message: 'Analysis rerun started successfully',
      data: { analysis: newAnalysis },
    });
  })
);

/**
 * Async function to run the complete analysis workflow
 */
async function runAnalysisAsync(
  analysisId: string,
  document: any,
  constraints: any[],
  includeAIInsights: boolean
) {
  try {
    console.log('Starting analysis:', analysisId);

    // Step 1: Get existing financial metrics for this document
    const existingMetrics = await prisma.financialMetric.findMany({
      where: {
        analysis: {
          documentId: document.id,
          status: 'COMPLETED',
        },
      },
      orderBy: { id: 'desc' },
      take: 100, // Get latest metrics
    });

    if (existingMetrics.length === 0) {
      throw new Error('No financial metrics found for this document. Please process the document first.');
    }

    // Step 2: Enhanced AI analysis if requested
    let enhancedMetrics = existingMetrics;
    let aiInsights = null;
    
    if (includeAIInsights) {
      try {
        // Prepare data for Claude AI analysis
        const financialData = existingMetrics.map(metric => ({
          [metric.name]: metric.value,
          [`${metric.name}_period`]: metric.period,
          [`${metric.name}_confidence`]: metric.confidence,
        })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

        const analysisContext = {
          userType: 'VC' as 'VC' | 'INVESTOR', // Default, should be passed from request
          constraints: constraints.map(c => ({
            name: c.name,
            metric: c.metric,
            operator: c.operator,
            value: c.value,
            priority: c.severity,
          })),
          documentMetadata: {
            filename: document.fileName,
            fileType: document.documentType,
            extractedMetrics: financialData,
          },
        };

        // Get AI insights from Claude
        const [insights, constraintSuggestions, predictiveInsights] = await Promise.all([
          claudeAI.analyzeFinancialData([financialData], analysisContext),
          claudeAI.suggestConstraints([financialData], analysisContext),
          claudeAI.generatePredictiveInsights([financialData], analysisContext),
        ]);

        aiInsights = {
          insights,
          constraintSuggestions,
          predictiveInsights,
          generatedAt: new Date(),
        };

        console.log('AI insights generated successfully:', aiInsights.insights.length);

        // Try MCP AI Analyzer as fallback/enhancement
        try {
          const aiAnalyzerUrl = process.env.MCP_AI_ANALYZER_URL || 'http://localhost:8004';
          const aiResponse = await axios.post(`${aiAnalyzerUrl}/api/analyze/enrich`, {
            documentId: document.id,
            extractedText: document.extractedText || '',
            existingMetrics: existingMetrics.map(m => ({
              name: m.name,
              value: m.value,
              unit: m.unit,
              period: m.period,
              source: m.source,
              confidence: m.confidence,
            })),
            documentType: document.documentType.toLowerCase(),
            companyName: document.company.name,
            industry: document.company.sector,
          });

          if (aiResponse.data.success) {
            const { enhancedMetrics: enhanced, newMetrics } = aiResponse.data.data;
            
            // Store new metrics if any
            if (newMetrics.length > 0) {
              await prisma.financialMetric.createMany({
                data: newMetrics.map((metric: any) => ({
                  name: metric.name,
                  value: metric.value,
                  unit: metric.unit,
                  period: metric.period,
                  source: metric.source,
                  confidence: metric.confidence,
                  analysisId,
                })),
              });
            }

            // Use enhanced metrics for constraint evaluation
            enhancedMetrics = [...enhanced, ...newMetrics];
          }
        } catch (mcpError) {
          console.warn('MCP AI analyzer enhancement failed:', mcpError);
        }

      } catch (aiError) {
        console.warn('Claude AI analysis failed, proceeding with existing metrics:', aiError);
      }
    }

    // Step 3: Evaluate constraints
    const constraintEngineUrl = process.env.MCP_CONSTRAINT_ENGINE_URL || 'http://localhost:8002';
    const evaluationResponse = await axios.post(`${constraintEngineUrl}/api/constraints/evaluate`, {
      constraints: constraints.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        metric: c.metric,
        operator: c.operator,
        value: c.value,
        severity: c.severity,
        message: c.message,
        isActive: c.isActive,
        userId: c.userId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      metrics: enhancedMetrics.map(m => ({
        name: m.name,
        value: m.value,
        unit: m.unit,
        period: m.period,
        source: m.source,
        confidence: m.confidence,
      })),
    });

    if (!evaluationResponse.data.success) {
      throw new Error('Constraint evaluation failed');
    }

    const { violations } = evaluationResponse.data.data;

    // Step 4: Generate alerts if there are violations
    if (violations.length > 0) {
      const alertManagerUrl = process.env.MCP_ALERT_MANAGER_URL || 'http://localhost:8003';
      const alertResponse = await axios.post(`${alertManagerUrl}/api/alerts/generate`, {
        violations,
        analysisId,
        userId: document.userId,
        documentId: document.id,
        companyName: document.company.name,
      });

      if (alertResponse.data.success) {
        const alerts = alertResponse.data.data;
        
        // Store alerts in database
        await prisma.alert.createMany({
          data: alerts.map((alert: any) => ({
            id: alert.id,
            severity: alert.severity,
            message: alert.message,
            actualValue: alert.actualValue,
            expectedValue: alert.expectedValue,
            isAcknowledged: false,
            createdAt: new Date(),
            analysisId,
            constraintId: alert.constraintId,
            userId: document.userId,
          })),
        });
      }
    }

    // Step 5: Store AI insights if generated
    if (aiInsights) {
      try {
        await prisma.analysis.update({
          where: { id: analysisId },
          data: {
            aiInsights: JSON.stringify(aiInsights),
          },
        });
      } catch (error) {
        console.warn('Failed to store AI insights:', error);
      }
    }

    // Step 6: Update analysis status to completed
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    console.log('Analysis completed successfully:', analysisId);

  } catch (error) {
    console.error('Analysis failed:', error);
    
    // Update analysis status to failed
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * Generate CSV report from analysis data
 */
function generateCSVReport(report: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Financial Analysis Report');
  lines.push(`Company: ${report.document.company.name}`);
  lines.push(`Document: ${report.document.fileName}`);
  lines.push(`Analysis Date: ${report.analysis.startedAt}`);
  lines.push('');
  
  // Summary
  lines.push('SUMMARY');
  lines.push(`Total Metrics: ${report.summary.totalMetrics}`);
  lines.push(`Total Constraints: ${report.summary.totalConstraints}`);
  lines.push(`Total Alerts: ${report.summary.totalAlerts}`);
  lines.push(`Compliance Rate: ${report.summary.complianceRate}%`);
  lines.push('');
  
  // Metrics
  lines.push('FINANCIAL METRICS');
  lines.push('Name,Value,Unit,Period,Confidence');
  report.metrics.forEach((metric: any) => {
    lines.push(`${metric.name},${metric.value},${metric.unit},${metric.period},${metric.confidence}`);
  });
  lines.push('');
  
  // Alerts
  lines.push('ALERTS');
  lines.push('Severity,Message,Actual Value,Expected Value,Constraint,Status');
  report.alerts.forEach((alert: any) => {
    lines.push(`${alert.severity},${alert.message},${alert.actualValue},${alert.expectedValue},${alert.constraint},${alert.isAcknowledged ? 'Acknowledged' : 'Open'}`);
  });
  
  return lines.join('\n');
}

export default router;