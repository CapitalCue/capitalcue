/**
 * Claude AI Integration Service
 * Provides intelligent analysis and insights for financial data
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../index';

interface FinancialData {
  revenue?: number;
  revenue_growth_rate?: number;
  profit_margin?: number;
  employee_count?: number;
  pe_ratio?: number;
  debt_to_equity?: number;
  [key: string]: any;
}

interface AnalysisContext {
  userType: 'VC' | 'INVESTOR';
  constraints: Array<{
    name: string;
    metric: string;
    operator: string;
    value: string;
    priority: string;
  }>;
  documentMetadata: {
    filename: string;
    fileType: string;
    extractedMetrics: Record<string, any>;
  };
}

interface AIInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'risk';
  category: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ConstraintSuggestion {
  name: string;
  description: string;
  metric: string;
  operator: string;
  value: string;
  priority: string;
  rationale: string;
  confidence: number;
}

export class ClaudeAIService {
  private anthropic: Anthropic | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey === 'your-anthropic-api-key-here') {
      logger.warn('Claude API key not configured - AI features will use mock responses');
      this.isInitialized = false;
      return;
    }

    try {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
      this.isInitialized = true;
      logger.info('Claude AI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Claude AI service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Analyze financial data and provide intelligent insights
   */
  async analyzeFinancialData(
    data: FinancialData[],
    context: AnalysisContext
  ): Promise<AIInsight[]> {
    if (!this.isInitialized) {
      return this.getMockInsights(data, context);
    }

    try {
      const prompt = this.buildAnalysisPrompt(data, context);
      
      const completion = await this.anthropic!.completions.create({
        model: 'claude-instant-1.2',
        max_tokens_to_sample: 2000,
        temperature: 0.1,
        prompt: `Human: ${prompt}\n\nAssistant:`
      });

      if (completion.completion) {
        return this.parseInsights(completion.completion);
      }

      throw new Error('Unexpected response format from Claude API');

    } catch (error) {
      logger.error('Claude AI analysis failed:', error);
      return this.getMockInsights(data, context);
    }
  }

  /**
   * Generate intelligent constraint suggestions based on data patterns
   */
  async suggestConstraints(
    data: FinancialData[],
    context: AnalysisContext
  ): Promise<ConstraintSuggestion[]> {
    if (!this.isInitialized) {
      return this.getMockConstraintSuggestions(data, context);
    }

    try {
      const prompt = this.buildConstraintSuggestionPrompt(data, context);
      
      const completion = await this.anthropic!.completions.create({
        model: 'claude-instant-1.2',
        max_tokens_to_sample: 1500,
        temperature: 0.2,
        prompt: `Human: ${prompt}\n\nAssistant:`
      });

      if (completion.completion) {
        return this.parseConstraintSuggestions(completion.completion);
      }

      throw new Error('Unexpected response format from Claude API');

    } catch (error) {
      logger.error('Claude AI constraint suggestions failed:', error);
      return this.getMockConstraintSuggestions(data, context);
    }
  }

  /**
   * Generate predictive insights and forecasting
   */
  async generatePredictiveInsights(
    historicalData: FinancialData[],
    context: AnalysisContext
  ): Promise<{
    predictions: Array<{
      metric: string;
      forecast: number;
      confidence: number;
      timeframe: string;
      reasoning: string;
    }>;
    risks: Array<{
      factor: string;
      impact: 'low' | 'medium' | 'high';
      probability: number;
      description: string;
    }>;
    opportunities: Array<{
      area: string;
      potential: 'low' | 'medium' | 'high';
      confidence: number;
      description: string;
    }>;
  }> {
    if (!this.isInitialized) {
      return this.getMockPredictiveInsights(historicalData, context);
    }

    try {
      const prompt = this.buildPredictivePrompt(historicalData, context);
      
      const completion = await this.anthropic!.completions.create({
        model: 'claude-instant-1.2',
        max_tokens_to_sample: 2500,
        temperature: 0.15,
        prompt: `Human: ${prompt}\n\nAssistant:`
      });

      if (completion.completion) {
        return this.parsePredictiveInsights(completion.completion);
      }

      throw new Error('Unexpected response format from Claude API');

    } catch (error) {
      logger.error('Claude AI predictive analysis failed:', error);
      return this.getMockPredictiveInsights(historicalData, context);
    }
  }

  /**
   * Intelligent document summarization and key metrics extraction
   */
  async summarizeDocument(
    extractedText: string,
    context: AnalysisContext
  ): Promise<{
    summary: string;
    keyMetrics: Record<string, number>;
    riskFactors: string[];
    opportunities: string[];
    recommendations: string[];
  }> {
    if (!this.isInitialized) {
      return this.getMockDocumentSummary(extractedText, context);
    }

    try {
      const prompt = this.buildDocumentSummaryPrompt(extractedText, context);
      
      const completion = await this.anthropic!.completions.create({
        model: 'claude-instant-1.2',
        max_tokens_to_sample: 3000,
        temperature: 0.1,
        prompt: `Human: ${prompt}\n\nAssistant:`
      });

      if (completion.completion) {
        return this.parseDocumentSummary(completion.completion);
      }

      throw new Error('Unexpected response format from Claude API');

    } catch (error) {
      logger.error('Claude AI document summary failed:', error);
      return this.getMockDocumentSummary(extractedText, context);
    }
  }

  // Private helper methods for building prompts

  private buildAnalysisPrompt(data: FinancialData[], context: AnalysisContext): string {
    return `As an expert financial analyst, analyze the following financial data for a ${context.userType === 'VC' ? 'venture capital' : 'stock investment'} evaluation.

Data to analyze:
${JSON.stringify(data, null, 2)}

Current constraints being evaluated:
${context.constraints.map(c => `- ${c.name}: ${c.metric} ${c.operator} ${c.value} (Priority: ${c.priority})`).join('\n')}

Please provide insights in the following JSON format:
{
  "insights": [
    {
      "type": "strength|weakness|opportunity|risk",
      "category": "financial|operational|market|strategy",
      "title": "Short descriptive title",
      "description": "Detailed explanation",
      "confidence": 0.8,
      "actionable": true,
      "priority": "low|medium|high|critical"
    }
  ]
}

Focus on actionable insights that would be valuable for ${context.userType === 'VC' ? 'venture capital investment decisions' : 'stock investment analysis'}.`;
  }

  private buildConstraintSuggestionPrompt(data: FinancialData[], context: AnalysisContext): string {
    return `As an expert financial analyst, suggest intelligent constraints for ${context.userType === 'VC' ? 'venture capital due diligence' : 'stock screening'} based on the following data patterns:

Data sample:
${JSON.stringify(data.slice(0, 3), null, 2)}

Existing constraints:
${context.constraints.map(c => `- ${c.name}: ${c.metric} ${c.operator} ${c.value}`).join('\n')}

Please suggest new constraints in JSON format:
{
  "suggestions": [
    {
      "name": "Constraint name",
      "description": "Why this constraint is valuable",
      "metric": "metric_name",
      "operator": "gt|lt|gte|lte|eq|ne",
      "value": "threshold_value",
      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
      "rationale": "Detailed reasoning",
      "confidence": 0.85
    }
  ]
}

Focus on constraints that complement existing ones and address common ${context.userType === 'VC' ? 'startup investment' : 'stock investment'} criteria.`;
  }

  private buildPredictivePrompt(data: FinancialData[], context: AnalysisContext): string {
    return `As an expert financial forecaster, analyze the following historical financial data and provide predictive insights:

Historical data:
${JSON.stringify(data, null, 2)}

Context: ${context.userType === 'VC' ? 'Venture capital investment analysis' : 'Stock investment evaluation'}

Please provide predictions in JSON format:
{
  "predictions": [
    {
      "metric": "revenue",
      "forecast": 5000000,
      "confidence": 0.75,
      "timeframe": "next 12 months",
      "reasoning": "Based on growth trends..."
    }
  ],
  "risks": [
    {
      "factor": "Market volatility",
      "impact": "high",
      "probability": 0.6,
      "description": "Detailed risk description"
    }
  ],
  "opportunities": [
    {
      "area": "Market expansion",
      "potential": "high",
      "confidence": 0.8,
      "description": "Opportunity description"
    }
  ]
}`;
  }

  private buildDocumentSummaryPrompt(text: string, context: AnalysisContext): string {
    return `As an expert financial document analyzer, summarize the following financial document and extract key insights:

Document content (first 2000 characters):
${text.substring(0, 2000)}

Analysis perspective: ${context.userType === 'VC' ? 'Venture capital due diligence' : 'Stock investment research'}

Please provide analysis in JSON format:
{
  "summary": "Executive summary of the document",
  "keyMetrics": {
    "revenue": 5000000,
    "growth_rate": 0.25,
    "profit_margin": 0.15
  },
  "riskFactors": ["Risk factor 1", "Risk factor 2"],
  "opportunities": ["Opportunity 1", "Opportunity 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Extract numerical values when possible and focus on metrics relevant to ${context.userType === 'VC' ? 'startup evaluation' : 'stock analysis'}.`;
  }

  // Parsing methods for Claude responses

  private parseInsights(response: string): AIInsight[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.insights || [];
    } catch (error) {
      logger.error('Failed to parse Claude insights response:', error);
      return [];
    }
  }

  private parseConstraintSuggestions(response: string): ConstraintSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.suggestions || [];
    } catch (error) {
      logger.error('Failed to parse Claude constraint suggestions:', error);
      return [];
    }
  }

  private parsePredictiveInsights(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.error('Failed to parse Claude predictive insights:', error);
      return { predictions: [], risks: [], opportunities: [] };
    }
  }

  private parseDocumentSummary(response: string): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      logger.error('Failed to parse Claude document summary:', error);
      return {
        summary: 'Summary unavailable',
        keyMetrics: {},
        riskFactors: [],
        opportunities: [],
        recommendations: []
      };
    }
  }

  // Mock responses for development/testing

  private getMockInsights(data: FinancialData[], context: AnalysisContext): AIInsight[] {
    const sampleCompany = data[0] || {};
    const insights: AIInsight[] = [];

    // Revenue analysis
    if (sampleCompany.revenue) {
      if (sampleCompany.revenue > 5000000) {
        insights.push({
          type: 'strength',
          category: 'financial',
          title: 'Strong Revenue Base',
          description: `Company demonstrates solid revenue of $${(sampleCompany.revenue / 1000000).toFixed(1)}M, indicating market traction and business viability.`,
          confidence: 0.9,
          actionable: true,
          priority: 'high'
        });
      }
    }

    // Growth rate analysis
    if (sampleCompany.revenue_growth_rate) {
      if (sampleCompany.revenue_growth_rate > 0.3) {
        insights.push({
          type: 'strength',
          category: 'financial',
          title: 'Exceptional Growth Rate',
          description: `${(sampleCompany.revenue_growth_rate * 100).toFixed(1)}% growth rate significantly exceeds industry averages, suggesting strong market demand.`,
          confidence: 0.85,
          actionable: true,
          priority: 'critical'
        });
      } else if (sampleCompany.revenue_growth_rate < 0.1) {
        insights.push({
          type: 'risk',
          category: 'financial',
          title: 'Low Growth Trajectory',
          description: `Growth rate of ${(sampleCompany.revenue_growth_rate * 100).toFixed(1)}% may indicate market saturation or competitive challenges.`,
          confidence: 0.75,
          actionable: true,
          priority: 'medium'
        });
      }
    }

    // Profitability analysis
    if (sampleCompany.profit_margin !== undefined) {
      if (sampleCompany.profit_margin > 0.2) {
        insights.push({
          type: 'strength',
          category: 'operational',
          title: 'Strong Profitability',
          description: `Profit margin of ${(sampleCompany.profit_margin * 100).toFixed(1)}% demonstrates efficient operations and pricing power.`,
          confidence: 0.9,
          actionable: false,
          priority: 'high'
        });
      } else if (sampleCompany.profit_margin < 0) {
        insights.push({
          type: 'weakness',
          category: 'financial',
          title: 'Negative Profitability',
          description: 'Current negative margins require attention to cost structure and revenue optimization strategies.',
          confidence: 0.95,
          actionable: true,
          priority: 'critical'
        });
      }
    }

    return insights;
  }

  private getMockConstraintSuggestions(data: FinancialData[], context: AnalysisContext): ConstraintSuggestion[] {
    const suggestions: ConstraintSuggestion[] = [];

    if (context.userType === 'VC') {
      suggestions.push(
        {
          name: 'Minimum ARR for SaaS',
          description: 'Annual Recurring Revenue threshold for SaaS companies',
          metric: 'arr',
          operator: 'gte',
          value: '1000000',
          priority: 'HIGH',
          rationale: 'ARR of $1M+ indicates product-market fit and scalable revenue model',
          confidence: 0.9
        },
        {
          name: 'Customer Acquisition Cost Efficiency',
          description: 'CAC payback period should be reasonable',
          metric: 'cac_payback_months',
          operator: 'lte',
          value: '18',
          priority: 'MEDIUM',
          rationale: 'Payback periods over 18 months may indicate inefficient marketing spend',
          confidence: 0.8
        }
      );
    } else {
      suggestions.push(
        {
          name: 'Debt-to-Equity Ratio Limit',
          description: 'Maximum acceptable debt-to-equity ratio',
          metric: 'debt_to_equity',
          operator: 'lte',
          value: '0.6',
          priority: 'HIGH',
          rationale: 'Lower debt ratios indicate financial stability and reduced risk',
          confidence: 0.85
        },
        {
          name: 'Return on Equity Minimum',
          description: 'Minimum ROE for profitable companies',
          metric: 'roe',
          operator: 'gte',
          value: '0.15',
          priority: 'MEDIUM',
          rationale: 'ROE above 15% suggests effective management and shareholder value creation',
          confidence: 0.8
        }
      );
    }

    return suggestions;
  }

  private getMockPredictiveInsights(data: FinancialData[], context: AnalysisContext): any {
    const sampleData = data[0] || {};
    
    return {
      predictions: [
        {
          metric: 'revenue',
          forecast: (sampleData.revenue || 5000000) * 1.25,
          confidence: 0.75,
          timeframe: 'next 12 months',
          reasoning: 'Based on current growth trajectory and market conditions'
        },
        {
          metric: 'profit_margin',
          forecast: Math.min((sampleData.profit_margin || 0.1) * 1.1, 0.3),
          confidence: 0.65,
          timeframe: 'next 6 months',
          reasoning: 'Expected operational efficiency improvements'
        }
      ],
      risks: [
        {
          factor: 'Market Competition',
          impact: 'medium',
          probability: 0.6,
          description: 'Increasing competition may pressure margins and growth rates'
        },
        {
          factor: 'Economic Downturn',
          impact: 'high',
          probability: 0.3,
          description: 'Macroeconomic factors could impact customer spending'
        }
      ],
      opportunities: [
        {
          area: 'Market Expansion',
          potential: 'high',
          confidence: 0.8,
          description: 'Strong product-market fit suggests successful geographic expansion'
        },
        {
          area: 'Product Development',
          potential: 'medium',
          confidence: 0.7,
          description: 'Customer feedback indicates demand for additional features'
        }
      ]
    };
  }

  private getMockDocumentSummary(text: string, context: AnalysisContext): any {
    return {
      summary: 'Financial document analysis indicates a growing company with strong fundamentals. The organization shows consistent revenue growth and improving operational metrics.',
      keyMetrics: {
        revenue: 5000000,
        revenue_growth_rate: 0.25,
        profit_margin: 0.15,
        employee_count: 45
      },
      riskFactors: [
        'Dependence on key customers',
        'Market competition intensifying',
        'Scaling operational challenges'
      ],
      opportunities: [
        'International market expansion',
        'Product line diversification',
        'Strategic partnerships'
      ],
      recommendations: [
        'Diversify customer base to reduce concentration risk',
        'Invest in R&D to maintain competitive advantage',
        'Consider strategic acquisitions for market expansion'
      ]
    };
  }

  /**
   * Check if Claude AI service is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status information
   */
  getStatus(): { configured: boolean; message: string } {
    if (this.isInitialized) {
      return {
        configured: true,
        message: 'Claude AI service is configured and ready'
      };
    } else {
      return {
        configured: false,
        message: 'Claude AI service not configured - using mock responses'
      };
    }
  }
}

export const claudeAI = new ClaudeAIService();