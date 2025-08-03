export interface Document {
  id: string;
  filename: string;
  type: 'quarterly_report' | 'financial_statement' | 'annual_report';
  uploadedAt: Date;
  status: 'processing' | 'completed' | 'failed';
  extractedData?: FinancialData;
}

export interface FinancialData {
  revenue: number;
  profit: number;
  expenses: number;
  assets: number;
  liabilities: number;
  equity: number;
  period: string;
  currency: string;
}

export interface Constraint {
  id: string;
  name: string;
  metric: string;
  operator: '<' | '>' | '=' | '<=' | '>=' | '!=';
  value: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  isActive: boolean;
}

export interface EvaluationResult {
  violations: ConstraintViolation[];
  totalConstraints: number;
  violationsCount: number;
  criticalCount: number;
  warningCount: number;
  passedConstraints: number;
  overallStatus: 'pass' | 'warning' | 'fail';
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

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'VC' | 'INVESTOR';
  companyName?: string;
}

export interface ConstraintTemplate {
  name: string;
  metric: string;
  operator: '<' | '>' | '=' | '<=' | '>=' | '!=';
  value: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
}