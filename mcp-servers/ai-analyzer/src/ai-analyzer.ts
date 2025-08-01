// Import Anthropic SDK dynamically to make it optional
let Anthropic: any = null;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (error) {
  console.warn('Anthropic SDK not available - AI features will use mock responses');
}
import { FinancialMetric } from '@financial-analyzer/shared';

export interface AnalysisRequest {
  documentId: string;
  extractedText: string;
  existingMetrics?: FinancialMetric[];
  documentType?: 'quarterly_report' | 'annual_report' | 'financial_statement' | 'other';
  companyName?: string;
  industry?: string;
}

export interface EnrichmentResult {
  enhancedMetrics: FinancialMetric[];
  newMetrics: FinancialMetric[];
  confidence: number;
  insights: string[];
  warnings: string[];
  summary: string;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

export interface ValidationIssue {
  metric: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface InsightRequest {
  metrics: FinancialMetric[];
  companyName?: string;
  industry?: string;
  userType: 'vc' | 'investor';
}

export interface InsightResult {
  insights: Insight[];
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
  summary: string;
  confidence: number;
}

export interface Insight {
  category: 'profitability' | 'liquidity' | 'efficiency' | 'leverage' | 'growth' | 'valuation';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  metrics: string[];
}

export interface RiskFactor {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  likelihood: 'low' | 'medium' | 'high';
  impact: string;
}

export interface Opportunity {
  title: string;
  description: string;
  potential: 'low' | 'medium' | 'high';
  timeframe: 'short' | 'medium' | 'long';
  requirements: string[];
}

export class AIAnalyzer {
  private anthropic: any = null;
  private isConfigured: boolean = false;

  constructor(apiKey?: string) {
    if (apiKey && Anthropic) {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
      this.isConfigured = true;
    }
  }

  /**
   * Enrich and validate extracted financial metrics using Claude
   */
  async enrichMetrics(request: AnalysisRequest): Promise<EnrichmentResult> {
    if (!this.isConfigured) {
      return this.generateMockEnrichment(request);
    }

    try {
      const prompt = this.buildEnrichmentPrompt(request);
      
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseEnrichmentResponse(responseText, request);

    } catch (error) {
      console.error('Error enriching metrics:', error);
      return this.generateMockEnrichment(request);
    }
  }

  /**
   * Generate financial insights from metrics
   */
  async generateInsights(request: InsightRequest): Promise<InsightResult> {
    if (!this.isConfigured) {
      return this.generateMockInsights(request);
    }

    try {
      const prompt = this.buildInsightPrompt(request);
      
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseInsightResponse(responseText, request);

    } catch (error) {
      console.error('Error generating insights:', error);
      return this.generateMockInsights(request);
    }
  }

  /**
   * Validate financial metrics for accuracy and consistency
   */
  async validateMetrics(metrics: FinancialMetric[]): Promise<ValidationResult> {
    if (!this.isConfigured) {
      return this.generateMockValidation(metrics);
    }

    try {
      const prompt = this.buildValidationPrompt(metrics);
      
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      return this.parseValidationResponse(responseText, metrics);

    } catch (error) {
      console.error('Error validating metrics:', error);
      return this.generateMockValidation(metrics);
    }
  }

  /**
   * Build enrichment prompt for Claude
   */
  private buildEnrichmentPrompt(request: AnalysisRequest): string {
    return `
You are a financial analyst AI. Analyze the following financial document text and enhance the extracted metrics.

Document Type: ${request.documentType || 'unknown'}
Company: ${request.companyName || 'unknown'}
Industry: ${request.industry || 'unknown'}

Extracted Text (first 2000 chars):
${request.extractedText.substring(0, 2000)}

Existing Metrics:
${JSON.stringify(request.existingMetrics || [], null, 2)}

Tasks:
1. Validate and enhance the existing metrics with better precision and context
2. Extract any missing key financial metrics from the text
3. Identify potential data quality issues or inconsistencies
4. Provide insights about the financial health based on the metrics

Please respond in the following JSON format:
{
  "enhancedMetrics": [array of improved existing metrics],
  "newMetrics": [array of newly discovered metrics],
  "confidence": number between 0 and 1,
  "insights": [array of key insights],
  "warnings": [array of data quality warnings],
  "summary": "brief summary of financial situation"
}

Focus on accuracy and be conservative with confidence scores for extracted values.
`;
  }

  /**
   * Build insight generation prompt
   */
  private buildInsightPrompt(request: InsightRequest): string {
    return `
You are a ${request.userType === 'vc' ? 'venture capital' : 'stock investment'} analyst AI. Analyze these financial metrics and provide actionable insights.

Company: ${request.companyName || 'unknown'}
Industry: ${request.industry || 'unknown'}
User Type: ${request.userType}

Financial Metrics:
${JSON.stringify(request.metrics, null, 2)}

Provide analysis tailored for ${request.userType === 'vc' ? 'venture capital investment decisions' : 'stock investment decisions'}.

Please respond in the following JSON format:
{
  "insights": [
    {
      "category": "profitability|liquidity|efficiency|leverage|growth|valuation",
      "title": "insight title",
      "description": "detailed description",
      "importance": "low|medium|high",
      "metrics": ["list of relevant metrics"]
    }
  ],
  "riskFactors": [
    {
      "title": "risk title",
      "description": "risk description",
      "severity": "low|medium|high",
      "likelihood": "low|medium|high",
      "impact": "description of potential impact"
    }
  ],
  "opportunities": [
    {
      "title": "opportunity title", 
      "description": "opportunity description",
      "potential": "low|medium|high",
      "timeframe": "short|medium|long",
      "requirements": ["what needs to happen"]
    }
  ],
  "summary": "executive summary",
  "confidence": number between 0 and 1
}
`;
  }

  /**
   * Build validation prompt
   */
  private buildValidationPrompt(metrics: FinancialMetric[]): string {
    return `
You are a financial data validation AI. Review these financial metrics for accuracy, consistency, and completeness.

Financial Metrics:
${JSON.stringify(metrics, null, 2)}

Check for:
1. Mathematical consistency (e.g., margins should be reasonable percentages)
2. Logical relationships between metrics
3. Outliers or suspicious values
4. Missing key metrics that should be present
5. Units and formatting consistency

Respond in JSON format:
{
  "isValid": boolean,
  "confidence": number between 0 and 1,
  "issues": [
    {
      "metric": "metric name",
      "issue": "description of issue",
      "severity": "low|medium|high",
      "suggestion": "how to fix"
    }
  ],
  "suggestions": ["general improvement suggestions"]
}
`;
  }

  /**
   * Parse enrichment response from Claude
   */
  private parseEnrichmentResponse(response: string, request: AnalysisRequest): EnrichmentResult {
    try {
      const parsed = JSON.parse(response);
      return {
        enhancedMetrics: parsed.enhancedMetrics || [],
        newMetrics: parsed.newMetrics || [],
        confidence: parsed.confidence || 0.7,
        insights: parsed.insights || [],
        warnings: parsed.warnings || [],
        summary: parsed.summary || 'Analysis completed'
      };
    } catch (error) {
      console.error('Error parsing enrichment response:', error);
      return this.generateMockEnrichment(request);
    }
  }

  /**
   * Parse insight response from Claude
   */
  private parseInsightResponse(response: string, request: InsightRequest): InsightResult {
    try {
      const parsed = JSON.parse(response);
      return {
        insights: parsed.insights || [],
        riskFactors: parsed.riskFactors || [],
        opportunities: parsed.opportunities || [],
        summary: parsed.summary || 'Analysis completed',
        confidence: parsed.confidence || 0.7
      };
    } catch (error) {
      console.error('Error parsing insight response:', error);
      return this.generateMockInsights(request);
    }
  }

  /**
   * Parse validation response from Claude
   */
  private parseValidationResponse(response: string, metrics: FinancialMetric[]): ValidationResult {
    try {
      const parsed = JSON.parse(response);
      return {
        isValid: parsed.isValid || true,
        confidence: parsed.confidence || 0.8,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      console.error('Error parsing validation response:', error);
      return this.generateMockValidation(metrics);
    }
  }

  /**
   * Generate mock enrichment when Claude API is not available
   */
  private generateMockEnrichment(request: AnalysisRequest): EnrichmentResult {
    const mockNewMetrics: FinancialMetric[] = [
      {
        id: 'mock-metric-1',
        name: 'estimated_market_cap',
        value: 1000000000,
        unit: 'USD',
        period: 'current',
        source: 'ai_estimation',
        confidence: 0.6
      }
    ];

    return {
      enhancedMetrics: request.existingMetrics || [],
      newMetrics: mockNewMetrics,
      confidence: 0.6,
      insights: [
        'Company shows stable financial performance',
        'Revenue growth appears consistent with industry standards',
        'Debt levels are within acceptable ranges'
      ],
      warnings: [
        'Some metrics extracted with low confidence',
        'Consider manual verification of key figures'
      ],
      summary: 'Financial analysis completed using mock AI (Claude API not configured)'
    };
  }

  /**
   * Generate mock insights when Claude API is not available
   */
  private generateMockInsights(request: InsightRequest): InsightResult {
    const userTypeContext = request.userType === 'vc' ? 'venture capital' : 'stock investment';
    
    return {
      insights: [
        {
          category: 'profitability',
          title: 'Stable Profit Margins',
          description: `The company maintains consistent profit margins suitable for ${userTypeContext} consideration.`,
          importance: 'medium',
          metrics: ['net_margin', 'gross_margin']
        },
        {
          category: 'growth',
          title: 'Revenue Growth Trend',
          description: 'Revenue shows steady growth patterns over recent periods.',
          importance: 'high',
          metrics: ['revenue_growth_yoy', 'revenue_growth_qoq']
        }
      ],
      riskFactors: [
        {
          title: 'Market Volatility',
          description: 'Current market conditions may impact future performance.',
          severity: 'medium',
          likelihood: 'medium',
          impact: 'Potential 10-20% impact on valuations'
        }
      ],
      opportunities: [
        {
          title: 'Market Expansion',
          description: 'Strong financials support potential market expansion.',
          potential: 'medium',
          timeframe: 'medium',
          requirements: ['Additional capital', 'Market research', 'Strategic partnerships']
        }
      ],
      summary: `Mock AI analysis for ${userTypeContext} shows generally positive indicators with moderate risk factors.`,
      confidence: 0.6
    };
  }

  /**
   * Generate mock validation when Claude API is not available
   */
  private generateMockValidation(metrics: FinancialMetric[]): ValidationResult {
    const mockIssues: ValidationIssue[] = [];
    
    // Check for some basic validation issues
    for (const metric of metrics) {
      if (metric.confidence < 0.5) {
        mockIssues.push({
          metric: metric.name,
          issue: 'Low confidence score',
          severity: 'medium',
          suggestion: 'Consider manual verification of this metric'
        });
      }
      
      if (metric.name.includes('margin') && (metric.value > 1 || metric.value < -1)) {
        mockIssues.push({
          metric: metric.name,
          issue: 'Margin value seems outside normal range',
          severity: 'high',
          suggestion: 'Verify if this should be a percentage (0.0-1.0) or decimal value'
        });
      }
    }

    return {
      isValid: mockIssues.filter(i => i.severity === 'high').length === 0,
      confidence: 0.7,
      issues: mockIssues,
      suggestions: [
        'Review low-confidence metrics manually',
        'Ensure consistent units across similar metrics',
        'Consider additional context for outlier values'
      ]
    };
  }

  /**
   * Check if AI analyzer is properly configured
   */
  isAIConfigured(): boolean {
    return this.isConfigured;
  }

  /**
   * Get AI analyzer status
   */
  getStatus(): { configured: boolean; model: string; capabilities: string[] } {
    return {
      configured: this.isConfigured,
      model: this.isConfigured ? 'claude-3-sonnet-20240229' : 'mock',
      capabilities: [
        'metric_enrichment',
        'insight_generation', 
        'data_validation',
        'risk_assessment',
        'opportunity_identification'
      ]
    };
  }
}