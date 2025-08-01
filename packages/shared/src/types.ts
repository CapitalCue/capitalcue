// Core types for the financial analyzer platform

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'vc' | 'investor';
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  ticker?: string;
  sector: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  companyId: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'excel' | 'csv';
  fileSize: number;
  filePath: string;
  documentType: 'quarterly_report' | 'annual_report' | 'financial_statement' | 'other';
  uploadedAt: Date;
  processedAt?: Date;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
}

export interface FinancialMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  period: string;
  source: string;
  confidence: number;
}

export interface Constraint {
  id: string;
  userId: string;
  name: string;
  description?: string;
  metric: string;
  operator: '<' | '>' | '=' | '<=' | '>=' | '!=';
  value: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConstraintTemplate {
  id: string;
  name: string;
  description: string;
  userType: 'vc' | 'investor' | 'both';
  constraints: Omit<Constraint, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface Analysis {
  id: string;
  documentId: string;
  userId: string;
  constraintIds: string[];
  extractedMetrics: FinancialMetric[];
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface Alert {
  id: string;
  analysisId: string;
  constraintId: string;
  userId: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  actualValue: number;
  expectedValue: number;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// MCP Server Types
export interface MCPRequest {
  method: string;
  params: Record<string, any>;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DocumentParseResult {
  documentId: string;
  extractedText: string;
  tables: any[];
  metrics: FinancialMetric[];
  confidence: number;
}

export interface ConstraintViolation {
  constraintId: string;
  metric: string;
  actualValue: number;
  expectedValue: number;
  operator: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}