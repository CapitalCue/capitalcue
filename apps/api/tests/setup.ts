/**
 * Test Setup and Configuration
 * Initializes test environment, database, and shared utilities
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { hashPassword } from '../src/utils/encryption';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://testuser:testpass@localhost:5432/financial_analyzer_test'
    }
  }
});

// Test user data
export const testUsers = {
  investor: {
    id: 'test-investor-1',
    email: 'investor@test.com',
    name: 'Test Investor',
    password: 'TestPassword123!',
    userType: 'INVESTOR' as const
  },
  vc: {
    id: 'test-vc-1',
    email: 'vc@test.com',
    name: 'Test VC',
    password: 'TestPassword123!',
    userType: 'VC' as const
  },
  admin: {
    id: 'test-admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    password: 'TestPassword123!',
    userType: 'INVESTOR' as const // Admin is determined by permissions, not userType
  }
};

// Test company data
export const testCompany = {
  id: 'test-company-1',
  name: 'Test Company Inc',
  ticker: 'TEST',
  sector: 'Technology',
  description: 'A test company for financial analysis'
};

// Test document data
export const testDocument = {
  id: 'test-doc-1',
  fileName: 'Q4_2023_Report.pdf',
  fileType: 'PDF' as const,
  fileSize: 1024576,
  filePath: '/tmp/test-documents/Q4_2023_Report.pdf',
  documentType: 'QUARTERLY_REPORT' as const,
  status: 'PROCESSED' as const
};

// Test constraint data
export const testConstraint = {
  id: 'test-constraint-1',
  name: 'Debt-to-Equity Ratio Test',
  description: 'Test constraint for debt-to-equity ratio',
  metric: 'debt_to_equity_ratio',
  operator: 'GREATER_THAN' as const,
  value: 2.0,
  severity: 'WARNING' as const,
  message: 'Debt-to-equity ratio exceeds threshold',
  isActive: true
};

// Test analysis data
export const testAnalysis = {
  id: 'test-analysis-1',
  status: 'COMPLETED' as const,
  startedAt: new Date(),
  completedAt: new Date(),
  aiInsights: JSON.stringify({
    summary: 'Test analysis results',
    keyFindings: ['Finding 1', 'Finding 2'],
    riskAssessment: {
      riskLevel: 'MEDIUM',
      riskFactors: ['Risk 1', 'Risk 2']
    }
  })
};

/**
 * Generate JWT token for testing
 */
export function generateTestToken(userId: string): string {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

/**
 * Create test user in database
 */
export async function createTestUser(userData: typeof testUsers.investor) {
  const hashedPassword = await hashPassword(userData.password);
  
  return await prisma.user.create({
    data: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      userType: userData.userType,
      privacyPolicyAccepted: true,
      termsAccepted: true
    }
  });
}

/**
 * Create test company in database
 */
export async function createTestCompany(userId: string) {
  return await prisma.company.create({
    data: {
      id: testCompany.id,
      name: testCompany.name,
      ticker: testCompany.ticker,
      sector: testCompany.sector,
      description: testCompany.description,
      userId
    }
  });
}

/**
 * Create test document in database
 */
export async function createTestDocument(userId: string, companyId: string) {
  return await prisma.document.create({
    data: {
      id: testDocument.id,
      fileName: testDocument.fileName,
      fileType: testDocument.fileType,
      fileSize: testDocument.fileSize,
      filePath: testDocument.filePath,
      documentType: testDocument.documentType,
      status: testDocument.status,
      userId,
      companyId,
      uploadedAt: new Date(),
      processedAt: new Date()
    }
  });
}

/**
 * Create test constraint in database
 */
export async function createTestConstraint(userId: string) {
  return await prisma.constraint.create({
    data: {
      id: testConstraint.id,
      name: testConstraint.name,
      description: testConstraint.description,
      metric: testConstraint.metric,
      operator: testConstraint.operator,
      value: testConstraint.value,
      severity: testConstraint.severity,
      message: testConstraint.message,
      isActive: testConstraint.isActive,
      userId
    }
  });
}

/**
 * Create test analysis in database
 */
export async function createTestAnalysis(userId: string, documentId: string) {
  return await prisma.analysis.create({
    data: {
      id: testAnalysis.id,
      status: testAnalysis.status,
      startedAt: testAnalysis.startedAt,
      completedAt: testAnalysis.completedAt,
      aiInsights: testAnalysis.aiInsights,
      userId,
      documentId
    }
  });
}

/**
 * Setup test database with seed data
 */
export async function setupTestDatabase() {
  // Create test users
  const investor = await createTestUser(testUsers.investor);
  const vc = await createTestUser(testUsers.vc);
  const admin = await createTestUser(testUsers.admin);

  // Create test company
  const company = await createTestCompany(investor.id);

  // Create test document
  const document = await createTestDocument(investor.id, company.id);

  // Create test constraint
  const constraint = await createTestConstraint(investor.id);

  // Create test analysis
  const analysis = await createTestAnalysis(investor.id, document.id);

  return {
    users: { investor, vc, admin },
    company,
    document,
    constraint,
    analysis
  };
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase() {
  // Delete in reverse dependency order
  await prisma.analysisConstraint.deleteMany();
  await prisma.financialMetric.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.analysis.deleteMany();
  await prisma.document.deleteMany();
  await prisma.constraint.deleteMany();
  await prisma.company.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Setup test environment
 */
export async function setupTests() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  process.env.AUDIT_LOGGING_ENABLED = 'true';
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

  // Clean and setup test database
  await cleanupTestDatabase();
  return await setupTestDatabase();
}

/**
 * Teardown test environment
 */
export async function teardownTests() {
  await cleanupTestDatabase();
  await prisma.$disconnect();
}

/**
 * Test utilities
 */
export const testHelpers = {
  /**
   * Create authorization header for requests
   */
  authHeader: (userId: string) => ({
    Authorization: `Bearer ${generateTestToken(userId)}`
  }),

  /**
   * Mock file for upload tests
   */
  mockFile: {
    originalname: 'test-document.pdf',
    mimetype: 'application/pdf',
    buffer: Buffer.from('mock pdf content'),
    size: 1024
  },

  /**
   * Wait for async operations
   */
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate random test data
   */
  randomEmail: () => `test${Date.now()}@example.com`,
  randomString: (length: number = 8) => Math.random().toString(36).substring(2, length + 2),
  randomNumber: (min: number = 1, max: number = 100) => Math.floor(Math.random() * (max - min + 1)) + min
};

// Global test configuration
export const testConfig = {
  timeout: 10000, // 10 seconds
  retries: 2,
  baseURL: 'http://localhost:3001/api',
  testDatabaseURL: process.env.TEST_DATABASE_URL || 'postgresql://testuser:testpass@localhost:5432/financial_analyzer_test'
};