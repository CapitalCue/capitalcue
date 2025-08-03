import { Document, Constraint, ConstraintTemplate, EvaluationResult, User } from '@/types';

export const constraintTemplates: ConstraintTemplate[] = [
  {
    name: "Revenue Growth",
    metric: "revenue_growth",
    operator: ">",
    value: 20,
    severity: "critical",
    message: "Revenue should grow more than 20% year-over-year"
  },
  {
    name: "Debt-to-Equity Ratio",
    metric: "debt_to_equity",
    operator: "<",
    value: 0.5,
    severity: "warning",
    message: "Debt-to-equity ratio should be less than 0.5"
  },
  {
    name: "Profit Margin",
    metric: "profit_margin",
    operator: ">",
    value: 10,
    severity: "critical",
    message: "Profit margin should exceed 10%"
  },
  {
    name: "Cash Runway",
    metric: "cash_runway_months",
    operator: ">",
    value: 18,
    severity: "critical",
    message: "Company should have more than 18 months cash runway"
  },
  {
    name: "Current Ratio",
    metric: "current_ratio",
    operator: ">",
    value: 1.5,
    severity: "warning",
    message: "Current ratio should be above 1.5 for liquidity"
  }
];

export const sampleDocuments: Document[] = [
  {
    id: "1",
    filename: "TechCorp_Q4_2023.pdf",
    type: "quarterly_report",
    uploadedAt: new Date("2024-01-15"),
    status: "completed",
    extractedData: {
      revenue: 5200000,
      profit: 780000,
      expenses: 4420000,
      assets: 12500000,
      liabilities: 3200000,
      equity: 9300000,
      period: "Q4 2023",
      currency: "USD"
    }
  },
  {
    id: "2",
    filename: "StartupX_Q3_2023.xlsx",
    type: "quarterly_report",
    uploadedAt: new Date("2024-01-10"),
    status: "completed",
    extractedData: {
      revenue: 1200000,
      profit: -150000,
      expenses: 1350000,
      assets: 2800000,
      liabilities: 1200000,
      equity: 1600000,
      period: "Q3 2023",
      currency: "USD"
    }
  },
  {
    id: "3",
    filename: "GrowthCo_Annual_2023.pdf",
    type: "annual_report",
    uploadedAt: new Date("2024-01-08"),
    status: "processing"
  },
  {
    id: "4",
    filename: "FinanceInc_Q2_2023.csv",
    type: "financial_statement",
    uploadedAt: new Date("2024-01-05"),
    status: "failed"
  }
];

export const sampleConstraints: Constraint[] = [
  {
    id: "1",
    name: "Revenue Growth Target",
    metric: "revenue_growth",
    operator: ">",
    value: 20,
    severity: "critical",
    message: "Revenue growth must exceed 20% YoY for investment consideration",
    isActive: true
  },
  {
    id: "2",
    name: "Debt Control",
    metric: "debt_to_equity",
    operator: "<",
    value: 0.5,
    severity: "warning",
    message: "Debt-to-equity ratio should remain below 0.5",
    isActive: true
  },
  {
    id: "3",
    name: "Profitability Check",
    metric: "profit_margin",
    operator: ">",
    value: 10,
    severity: "critical",
    message: "Profit margin must be above 10% for sustainable growth",
    isActive: true
  },
  {
    id: "4",
    name: "Cash Runway",
    metric: "cash_runway_months",
    operator: ">",
    value: 18,
    severity: "critical",
    message: "Minimum 18 months cash runway required",
    isActive: true
  }
];

export const sampleEvaluation: EvaluationResult = {
  violations: [
    {
      constraintId: "2",
      metric: "debt_to_equity",
      actualValue: 0.65,
      expectedValue: 0.5,
      operator: "<",
      severity: "warning",
      message: "Debt-to-equity ratio (0.65) exceeds maximum threshold (0.5)"
    },
    {
      constraintId: "4",
      metric: "cash_runway_months",
      actualValue: 12,
      expectedValue: 18,
      operator: ">",
      severity: "critical",
      message: "Cash runway (12 months) is below minimum requirement (18 months)"
    }
  ],
  totalConstraints: 4,
  violationsCount: 2,
  criticalCount: 1,
  warningCount: 1,
  passedConstraints: 2,
  overallStatus: "warning"
};

export const sampleUser: User = {
  id: "1",
  email: "john.doe@capitalvc.com",
  firstName: "John",
  lastName: "Doe",
  userType: "VC",
  companyName: "Capital Ventures"
};