// Constants for the financial analyzer platform

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
  },
  DOCUMENTS: {
    UPLOAD: '/api/documents/upload',
    LIST: '/api/documents/list',
    GET: '/api/documents',
    DELETE: '/api/documents',
  },
  CONSTRAINTS: {
    CREATE: '/api/constraints',
    LIST: '/api/constraints',
    UPDATE: '/api/constraints',
    DELETE: '/api/constraints',
    TEMPLATES: '/api/constraints/templates',
  },
  ANALYSIS: {
    RUN: '/api/analysis/run',
    GET: '/api/analysis',
    HISTORY: '/api/analysis/history',
  },
  ALERTS: {
    LIST: '/api/alerts',
    ACKNOWLEDGE: '/api/alerts',
  },
} as const;

export const FINANCIAL_METRICS = {
  // Valuation Metrics
  PE_RATIO: 'pe_ratio',
  PB_RATIO: 'pb_ratio',
  PS_RATIO: 'ps_ratio',
  EV_EBITDA: 'ev_ebitda',
  MARKET_CAP: 'market_cap',

  // Profitability Metrics
  GROSS_MARGIN: 'gross_margin',
  OPERATING_MARGIN: 'operating_margin',
  NET_MARGIN: 'net_margin',
  ROE: 'roe',
  ROA: 'roa',
  ROIC: 'roic',

  // Growth Metrics
  REVENUE_GROWTH_YOY: 'revenue_growth_yoy',
  REVENUE_GROWTH_QOQ: 'revenue_growth_qoq',
  EARNINGS_GROWTH_YOY: 'earnings_growth_yoy',
  EARNINGS_GROWTH_QOQ: 'earnings_growth_qoq',

  // Liquidity Metrics
  CURRENT_RATIO: 'current_ratio',
  QUICK_RATIO: 'quick_ratio',
  CASH_RATIO: 'cash_ratio',

  // Leverage Metrics
  DEBT_TO_EQUITY: 'debt_to_equity',
  DEBT_TO_ASSETS: 'debt_to_assets',
  INTEREST_COVERAGE: 'interest_coverage',

  // Cash Flow Metrics
  OPERATING_CASH_FLOW: 'operating_cash_flow',
  FREE_CASH_FLOW: 'free_cash_flow',
  CASH_CONVERSION_CYCLE: 'cash_conversion_cycle',
} as const;

export const CONSTRAINT_OPERATORS = {
  LESS_THAN: '<',
  GREATER_THAN: '>',
  EQUAL: '=',
  LESS_THAN_OR_EQUAL: '<=',
  GREATER_THAN_OR_EQUAL: '>=',
  NOT_EQUAL: '!=',
} as const;

export const ALERT_SEVERITIES = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
} as const;

export const DOCUMENT_TYPES = {
  QUARTERLY_REPORT: 'quarterly_report',
  ANNUAL_REPORT: 'annual_report',
  FINANCIAL_STATEMENT: 'financial_statement',
  OTHER: 'other',
} as const;

export const FILE_TYPES = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv',
} as const;

export const USER_TYPES = {
  VC: 'vc',
  INVESTOR: 'investor',
} as const;

export const STATUS_TYPES = {
  DOCUMENT: {
    UPLOADED: 'uploaded',
    PROCESSING: 'processing',
    PROCESSED: 'processed',
    FAILED: 'failed',
  },
  ANALYSIS: {
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
  },
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
} as const;

export const MCP_SERVERS = {
  DOCUMENT_PARSER: 'document-parser',
  CONSTRAINT_ENGINE: 'constraint-engine',
  ALERT_MANAGER: 'alert-manager',
  AI_ANALYZER: 'ai-analyzer',
} as const;