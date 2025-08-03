#!/usr/bin/env node
/**
 * AI Analyzer MCP Server
 * Handles AI-powered financial analysis using Claude API
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8004;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for analysis results
let analysisHistory = [];

class AIAnalyzer {
    constructor() {
        this.claudeApiKey = process.env.CLAUDE_API_KEY;
    }

    async analyzeDocument(documentData, analysisType = 'financial') {
        try {
            // For now, provide comprehensive mock analysis
            // In production, this would call Claude API
            const analysis = this.generateMockAnalysis(documentData, analysisType);
            
            // Store in history
            const analysisRecord = {
                id: `analysis_${Date.now()}`,
                document_id: documentData.document_id || 'unknown',
                analysis_type: analysisType,
                timestamp: new Date().toISOString(),
                duration_ms: Math.floor(Math.random() * 3000) + 1000,
                ...analysis
            };
            
            analysisHistory.unshift(analysisRecord);
            
            return analysisRecord;
        } catch (error) {
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    generateMockAnalysis(documentData, analysisType) {
        const analyses = {
            financial: {
                insights: [
                    "Revenue growth of 15% indicates strong market demand and effective sales strategy",
                    "Profit margins have improved by 3.2% compared to previous quarter, showing operational efficiency gains",
                    "Cash flow remains positive at $2.1M, providing adequate working capital cushion",
                    "Debt-to-equity ratio of 0.35 is within industry benchmarks and indicates healthy capital structure",
                    "R&D investment of 12% of revenue demonstrates commitment to innovation and future growth",
                    "Customer acquisition cost has decreased by 18%, indicating improved marketing effectiveness"
                ],
                recommendations: [
                    "Consider expanding into high-growth segments identified in market analysis",
                    "Optimize operational efficiency to further improve profit margins by 2-3%",
                    "Maintain current debt levels while exploring growth financing options",
                    "Increase marketing spend in Q1 to capitalize on improving CAC metrics",
                    "Diversify revenue streams to reduce dependency on primary product line",
                    "Implement cost management program to sustain margin improvements"
                ],
                risks: [
                    "Market concentration risk with 45% revenue from top 3 clients",
                    "Rising material costs may pressure margins in upcoming quarters",
                    "Competitive pressure in core market segments",
                    "Regulatory changes in target markets could impact growth"
                ],
                opportunities: [
                    "Emerging market expansion could add 25-30% revenue growth",
                    "Strategic partnerships with technology providers",
                    "Acquisition opportunities in adjacent markets",
                    "Digital transformation initiatives showing early ROI"
                ],
                overall_score: Math.floor(Math.random() * 30) + 70, // 70-100
                confidence: 0.85 + Math.random() * 0.1 // 0.85-0.95
            },
            risk: {
                insights: [
                    "Credit risk exposure is well-managed with diversified portfolio",
                    "Operational risk indicators within acceptable thresholds",
                    "Market risk properly hedged through derivative instruments",
                    "Liquidity risk minimal with strong cash position"
                ],
                recommendations: [
                    "Enhance risk monitoring systems for early warning indicators",
                    "Diversify supplier base to reduce operational dependencies",
                    "Review and update business continuity plans",
                    "Consider additional insurance coverage for key operations"
                ],
                risk_score: Math.floor(Math.random() * 40) + 20, // 20-60 (lower is better)
                confidence: 0.80 + Math.random() * 0.15
            },
            compliance: {
                insights: [
                    "All regulatory reporting requirements met within deadlines",
                    "Internal controls operating effectively",
                    "Audit findings from previous period successfully remediated",
                    "Data privacy compliance fully implemented"
                ],
                recommendations: [
                    "Prepare for upcoming regulatory changes in Q2",
                    "Enhance documentation for compliance processes",
                    "Implement automated compliance monitoring tools",
                    "Conduct regular compliance training for staff"
                ],
                compliance_score: Math.floor(Math.random() * 20) + 80, // 80-100
                confidence: 0.90 + Math.random() * 0.08
            }
        };

        return analyses[analysisType] || analyses.financial;
    }

    async performSentimentAnalysis(text) {
        // Mock sentiment analysis
        const sentiments = ['positive', 'negative', 'neutral'];
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        
        return {
            sentiment,
            confidence: 0.75 + Math.random() * 0.2,
            score: Math.random() * 2 - 1, // -1 to 1
            keywords: ['revenue', 'growth', 'profit', 'market', 'strategy']
        };
    }

    async compareWithBenchmarks(metrics, industry = 'technology') {
        // Mock benchmark comparison
        const benchmarks = {
            technology: {
                revenue_growth: 22.5,
                profit_margin: 18.2,
                debt_to_equity: 0.28,
                roe: 15.8
            },
            healthcare: {
                revenue_growth: 12.8,
                profit_margin: 14.5,
                debt_to_equity: 0.35,
                roe: 12.3
            },
            finance: {
                revenue_growth: 8.5,
                profit_margin: 25.1,
                debt_to_equity: 2.1,
                roe: 11.8
            }
        };

        const industryBenchmarks = benchmarks[industry] || benchmarks.technology;
        const comparisons = [];

        metrics.forEach(metric => {
            if (industryBenchmarks[metric.name]) {
                const benchmark = industryBenchmarks[metric.name];
                const performance = metric.value > benchmark ? 'above' : 'below';
                const difference = ((metric.value - benchmark) / benchmark * 100).toFixed(1);
                
                comparisons.push({
                    metric: metric.name,
                    company_value: metric.value,
                    industry_benchmark: benchmark,
                    performance,
                    difference_percent: difference
                });
            }
        });

        return {
            industry,
            comparisons,
            overall_performance: comparisons.filter(c => c.performance === 'above').length > comparisons.length / 2 ? 'above_average' : 'below_average'
        };
    }
}

const analyzer = new AIAnalyzer();

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'ai-analyzer-mcp',
        timestamp: new Date().toISOString(),
        claude_api_configured: !!analyzer.claudeApiKey,
        analysis_history_count: analysisHistory.length
    });
});

// Analyze document
app.post('/api/analyze/document', async (req, res) => {
    try {
        const { document_id, analysis_type = 'financial', document_data } = req.body;

        if (!document_id) {
            return res.status(400).json({
                success: false,
                error: 'document_id is required'
            });
        }

        const analysis = await analyzer.analyzeDocument(
            { document_id, ...document_data }, 
            analysis_type
        );

        res.json({
            success: true,
            data: analysis
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Perform sentiment analysis
app.post('/api/analyze/sentiment', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'text is required'
            });
        }

        const sentiment = await analyzer.performSentimentAnalysis(text);

        res.json({
            success: true,
            data: sentiment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Compare with industry benchmarks
app.post('/api/analyze/benchmarks', async (req, res) => {
    try {
        const { metrics, industry = 'technology' } = req.body;

        if (!Array.isArray(metrics)) {
            return res.status(400).json({
                success: false,
                error: 'metrics must be an array'
            });
        }

        const comparison = await analyzer.compareWithBenchmarks(metrics, industry);

        res.json({
            success: true,
            data: comparison
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get analysis history
app.get('/api/analyze/history', (req, res) => {
    const { limit = 20, offset = 0, analysis_type } = req.query;

    let filteredHistory = [...analysisHistory];

    if (analysis_type) {
        filteredHistory = filteredHistory.filter(h => h.analysis_type === analysis_type);
    }

    const paginatedHistory = filteredHistory.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
    );

    res.json({
        success: true,
        data: paginatedHistory,
        pagination: {
            total: filteredHistory.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: filteredHistory.length > parseInt(offset) + parseInt(limit)
        }
    });
});

// Get specific analysis
app.get('/api/analyze/:id', (req, res) => {
    const analysis = analysisHistory.find(a => a.id === req.params.id);
    
    if (!analysis) {
        return res.status(404).json({
            success: false,
            error: 'Analysis not found'
        });
    }

    res.json({
        success: true,
        data: analysis
    });
});

// Batch analysis
app.post('/api/analyze/batch', async (req, res) => {
    try {
        const { documents, analysis_type = 'financial' } = req.body;

        if (!Array.isArray(documents)) {
            return res.status(400).json({
                success: false,
                error: 'documents must be an array'
            });
        }

        const analyses = [];
        for (const doc of documents) {
            const analysis = await analyzer.analyzeDocument(doc, analysis_type);
            analyses.push(analysis);
        }

        res.json({
            success: true,
            data: analyses,
            summary: {
                total_analyzed: analyses.length,
                average_score: analyses.reduce((sum, a) => sum + (a.overall_score || 0), 0) / analyses.length,
                analysis_type
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Clear analysis history (for testing)
app.delete('/api/analyze/history', (req, res) => {
    const count = analysisHistory.length;
    analysisHistory = [];
    res.json({
        success: true,
        message: `Cleared ${count} analysis records`
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🤖 AI Analyzer MCP Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🧠 API docs: http://localhost:${PORT}/api/analyze`);
    if (!analyzer.claudeApiKey) {
        console.log(`⚠️  CLAUDE_API_KEY not configured - using mock analysis`);
    }
});

module.exports = app;