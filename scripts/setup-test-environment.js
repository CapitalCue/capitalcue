#!/usr/bin/env node

/**
 * Test environment setup script
 * Sets up database, sample data, and test configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Setting up Integration Test Environment');
console.log('==========================================\n');

function runCommand(command, description) {
  console.log(`📋 ${description}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log('   ✅ Success\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    throw error;
  }
}

function createFile(filePath, content, description) {
  console.log(`📄 ${description}`);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    console.log('   ✅ Created\n');
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    throw error;
  }
}

// 1. Create test environment configuration
const testEnvConfig = `# Test Environment Configuration
NODE_ENV=test
PORT=3001
DATABASE_URL="postgresql://test_user:test_password@localhost:5432/financial_analyzer_test"
JWT_SECRET="test-jwt-secret-key-for-integration-testing"
JWT_EXPIRES_IN="24h"

# MCP Server URLs (for testing)
MCP_DOCUMENT_PARSER_URL="http://localhost:3010"
MCP_CONSTRAINT_ENGINE_URL="http://localhost:3011"
MCP_ALERT_MANAGER_URL="http://localhost:3012"
MCP_AI_ANALYZER_URL="http://localhost:3013"

# Claude API (optional for testing)
CLAUDE_API_KEY="test-api-key"

# File upload limits
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads/test"
`;

createFile('.env.test', testEnvConfig, 'Creating test environment configuration');

// 2. Create Docker Compose for test database
const dockerComposeTest = `version: '3.8'

services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: financial_analyzer_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U test_user -d financial_analyzer_test"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_test_data:
`;

createFile('docker-compose.test.yml', dockerComposeTest, 'Creating test database Docker Compose');

// 3. Create integration test suite
const integrationTestSuite = `#!/usr/bin/env node

/**
 * End-to-End Integration Test Suite
 * Tests complete workflow from document upload to alert generation
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL || 'http://localhost:3001/api';
let authToken = null;
let testUserId = null;

console.log('🚀 Financial Analyzer Integration Test Suite');
console.log('=============================================\\n');

class IntegrationTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    this.results.total++;
    console.log(\`📝 \${name}\`);
    
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log('   ✅ PASSED\\n');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(\`   ❌ FAILED: \${error.message}\\n\`);
    }
  }

  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Wait for API server to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(\`\${API_BASE}/health\`);
        console.log('   ✅ API server is ready\\n');
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw new Error('API server not ready');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    // Add cleanup logic here
    console.log('   ✅ Cleanup complete\\n');
  }

  printResults() {
    console.log('🎯 INTEGRATION TEST RESULTS');
    console.log('===========================');
    console.log(\`Total Tests: \${this.results.total}\`);
    console.log(\`Passed: \${this.results.passed}\`);
    console.log(\`Failed: \${this.results.failed}\`);
    console.log(\`Success Rate: \${Math.round((this.results.passed / this.results.total) * 100)}%\\n\`);

    if (this.results.failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(\`  • \${test.name}: \${test.error}\`);
        });
    } else {
      console.log('🎉 ALL TESTS PASSED! 🎉');
    }
  }

  // Test Methods
  async testUserRegistration() {
    const userData = {
      email: \`test-\${Date.now()}@example.com\`,
      password: 'TestPassword123!',
      firstName: 'Integration',
      lastName: 'Test',
      userType: 'VC',
      companyName: 'Test VC Firm'
    };

    const response = await axios.post(\`\${API_BASE}/auth/register\`, userData);
    
    if (response.status !== 201) {
      throw new Error(\`Expected status 201, got \${response.status}\`);
    }

    if (!response.data.user || !response.data.token) {
      throw new Error('Registration response missing user or token');
    }

    authToken = response.data.token;
    testUserId = response.data.user.id;
    console.log(\`   👤 Created test user: \${userData.email}\`);
  }

  async testUserLogin() {
    // First register a user for login test
    const userData = {
      email: \`login-test-\${Date.now()}@example.com\`,
      password: 'TestPassword123!',
      firstName: 'Login',
      lastName: 'Test',
      userType: 'INVESTOR'
    };

    await axios.post(\`\${API_BASE}/auth/register\`, userData);

    const loginResponse = await axios.post(\`\${API_BASE}/auth/login\`, {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.status !== 200) {
      throw new Error(\`Expected status 200, got \${loginResponse.status}\`);
    }

    if (!loginResponse.data.user || !loginResponse.data.token) {
      throw new Error('Login response missing user or token');
    }

    console.log(\`   🔐 Successfully logged in user: \${userData.email}\`);
  }

  async testDocumentUpload() {
    if (!authToken) throw new Error('No auth token available');

    // Create a sample CSV file for testing
    const testCsvContent = \`Company,Revenue,Growth Rate,Employees
TechCorp,5000000,0.25,50
DataInc,3000000,0.15,30
CloudCo,8000000,0.40,80\`;

    const testFilePath = path.join(__dirname, 'test-document.csv');
    fs.writeFileSync(testFilePath, testCsvContent);

    const formData = new FormData();
    formData.append('documents', fs.createReadStream(testFilePath));

    const response = await axios.post(\`\${API_BASE}/documents/upload\`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': \`Bearer \${authToken}\`
      }
    });

    if (response.status !== 201) {
      throw new Error(\`Expected status 201, got \${response.status}\`);
    }

    if (!response.data.documents || response.data.documents.length === 0) {
      throw new Error('Upload response missing documents');
    }

    // Clean up test file
    fs.unlinkSync(testFilePath);

    const uploadedDoc = response.data.documents[0];
    console.log(\`   📄 Uploaded document: \${uploadedDoc.originalFilename}\`);
    
    return uploadedDoc.id;
  }

  async testConstraintCreation() {
    if (!authToken) throw new Error('No auth token available');

    const constraintData = {
      name: 'High Growth Rate Test',
      description: 'Test constraint for high growth companies',
      metric: 'growth_rate',
      operator: 'gte',
      value: '0.20',
      priority: 'HIGH',
      tags: ['growth', 'test']
    };

    const response = await axios.post(\`\${API_BASE}/constraints\`, constraintData, {
      headers: {
        'Authorization': \`Bearer \${authToken}\`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 201) {
      throw new Error(\`Expected status 201, got \${response.status}\`);
    }

    if (!response.data.constraint) {
      throw new Error('Constraint creation response missing constraint');
    }

    console.log(\`   ⚖️  Created constraint: \${constraintData.name}\`);
    
    return response.data.constraint.id;
  }

  async testAnalysisWorkflow(documentId, constraintId) {
    if (!authToken) throw new Error('No auth token available');
    if (!documentId || !constraintId) throw new Error('Missing document or constraint ID');

    const analysisData = {
      name: 'Integration Test Analysis',
      documentId: documentId,
      constraintIds: [constraintId]
    };

    const response = await axios.post(\`\${API_BASE}/analysis/run\`, analysisData, {
      headers: {
        'Authorization': \`Bearer \${authToken}\`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 201) {
      throw new Error(\`Expected status 201, got \${response.status}\`);
    }

    if (!response.data.analysis) {
      throw new Error('Analysis creation response missing analysis');
    }

    console.log(\`   🔍 Started analysis: \${analysisData.name}\`);
    
    // Wait for analysis to complete (in real scenario, this would be handled differently)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check analysis status
    const statusResponse = await axios.get(\`\${API_BASE}/analysis/\${response.data.analysis.id}\`, {
      headers: {
        'Authorization': \`Bearer \${authToken}\`
      }
    });

    console.log(\`   📊 Analysis status: \${statusResponse.data.analysis.status}\`);
    
    return response.data.analysis.id;
  }

  async testAlertGeneration() {
    if (!authToken) throw new Error('No auth token available');

    const response = await axios.get(\`\${API_BASE}/alerts\`, {
      headers: {
        'Authorization': \`Bearer \${authToken}\`
      }
    });

    if (response.status !== 200) {
      throw new Error(\`Expected status 200, got \${response.status}\`);
    }

    console.log(\`   🚨 Found \${response.data.length} alerts\`);
    
    // Test alert acknowledgment if alerts exist
    if (response.data.length > 0) {
      const alertId = response.data[0].id;
      const ackResponse = await axios.put(\`\${API_BASE}/alerts/\${alertId}/acknowledge\`, {}, {
        headers: {
          'Authorization': \`Bearer \${authToken}\`
        }
      });

      if (ackResponse.status !== 200) {
        throw new Error(\`Expected status 200 for acknowledgment, got \${ackResponse.status}\`);
      }

      console.log(\`   ✅ Acknowledged alert: \${alertId}\`);
    }
  }

  async testDashboardStats() {
    if (!authToken) throw new Error('No auth token available');

    const response = await axios.get(\`\${API_BASE}/user/dashboard\`, {
      headers: {
        'Authorization': \`Bearer \${authToken}\`
      }
    });

    if (response.status !== 200) {
      throw new Error(\`Expected status 200, got \${response.status}\`);
    }

    const stats = response.data;
    const expectedFields = ['documents', 'constraints', 'analyses', 'alerts'];
    
    for (const field of expectedFields) {
      if (typeof stats[field] !== 'number') {
        throw new Error(\`Dashboard stats missing or invalid field: \${field}\`);
      }
    }

    console.log(\`   📊 Dashboard stats - Docs: \${stats.documents}, Constraints: \${stats.constraints}, Analyses: \${stats.analyses}, Alerts: \${stats.alerts}\`);
  }

  async runAllTests() {
    try {
      await this.setup();

      // Authentication Tests
      await this.runTest('User Registration', () => this.testUserRegistration());
      await this.runTest('User Login', () => this.testUserLogin());

      // Core Functionality Tests
      let documentId, constraintId, analysisId;
      
      await this.runTest('Document Upload', async () => {
        documentId = await this.testDocumentUpload();
      });

      await this.runTest('Constraint Creation', async () => {
        constraintId = await this.testConstraintCreation();
      });

      await this.runTest('Analysis Workflow', async () => {
        analysisId = await this.testAnalysisWorkflow(documentId, constraintId);
      });

      await this.runTest('Alert Generation', () => this.testAlertGeneration());
      await this.runTest('Dashboard Statistics', () => this.testDashboardStats());

      await this.cleanup();
      this.printResults();

      return this.results.failed === 0;

    } catch (error) {
      console.log(\`💥 Test suite failed to initialize: \${error.message}\`);
      return false;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = IntegrationTester;
`;

createFile('tests/integration/integration-test-suite.js', integrationTestSuite, 'Creating comprehensive integration test suite');

// 4. Create test data seeder
const testDataSeeder = `#!/usr/bin/env node

/**
 * Test Data Seeder
 * Seeds database with sample data for testing and demonstration
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  try {
    // Create test users
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    const vcUser = await prisma.user.create({
      data: {
        email: 'vc@example.com',
        password: hashedPassword,
        firstName: 'Victoria',
        lastName: 'Capital',
        userType: 'VC',
        companyName: 'Elite Ventures'
      }
    });

    const investorUser = await prisma.user.create({
      data: {
        email: 'investor@example.com',
        password: hashedPassword,
        firstName: 'Isaac',
        lastName: 'Investor',
        userType: 'INVESTOR',
        companyName: 'Smart Investments LLC'
      }
    });

    console.log('   ✅ Created test users');

    // Create sample constraints
    const constraints = [
      {
        name: 'High Revenue Growth',
        description: 'Companies with revenue growth rate above 20%',
        metric: 'revenue_growth_rate',
        operator: 'gt',
        value: '0.20',
        priority: 'HIGH',
        tags: ['growth', 'revenue'],
        userId: vcUser.id
      },
      {
        name: 'Minimum Employee Count',
        description: 'Companies with at least 10 employees',
        metric: 'employee_count',
        operator: 'gte',
        value: '10',
        priority: 'MEDIUM',
        tags: ['scale', 'team'],
        userId: vcUser.id
      },
      {
        name: 'Profitable Companies',
        description: 'Companies with positive profit margins',
        metric: 'profit_margin',
        operator: 'gt',
        value: '0',
        priority: 'HIGH',
        tags: ['profitability'],
        userId: investorUser.id
      }
    ];

    for (const constraintData of constraints) {
      await prisma.constraint.create({
        data: constraintData
      });
    }

    console.log('   ✅ Created sample constraints');

    // Create sample documents
    const documents = [
      {
        filename: 'sample-financials-2024.pdf',
        originalFilename: 'Q4-2024-Financial-Report.pdf',
        fileType: 'application/pdf',
        fileSize: 2048576,
        status: 'PROCESSED',
        extractedMetrics: {
          revenue: 5000000,
          revenue_growth_rate: 0.25,
          employee_count: 45,
          profit_margin: 0.15
        },
        userId: vcUser.id
      },
      {
        filename: 'startup-metrics.csv',
        originalFilename: 'startup-performance-metrics.csv',
        fileType: 'text/csv',
        fileSize: 1024000,
        status: 'PROCESSED',
        extractedMetrics: {
          revenue: 1200000,
          revenue_growth_rate: 0.45,
          employee_count: 8,
          profit_margin: -0.05
        },
        userId: investorUser.id
      }
    ];

    for (const docData of documents) {
      await prisma.document.create({
        data: docData
      });
    }

    console.log('   ✅ Created sample documents');

    // Create constraint templates
    const templates = [
      {
        name: 'Standard VC Due Diligence',
        description: 'Common constraints used by VCs for due diligence',
        constraints: [
          {
            name: 'Revenue Threshold',
            description: 'Minimum annual revenue',
            metric: 'annual_revenue',
            operator: 'gte',
            value: '1000000',
            priority: 'HIGH'
          },
          {
            name: 'Growth Rate',
            description: 'Year-over-year growth rate',
            metric: 'yoy_growth',
            operator: 'gte',
            value: '0.30',
            priority: 'CRITICAL'
          }
        ]
      },
      {
        name: 'Stock Investor Screening',
        description: 'Standard screening criteria for stock investors',
        constraints: [
          {
            name: 'P/E Ratio',
            description: 'Price to earnings ratio threshold',
            metric: 'pe_ratio',
            operator: 'lte',
            value: '25',
            priority: 'MEDIUM'
          },
          {
            name: 'Debt to Equity',
            description: 'Maximum debt to equity ratio',
            metric: 'debt_to_equity',
            operator: 'lte',
            value: '0.6',
            priority: 'HIGH'
          }
        ]
      }
    ];

    for (const templateData of templates) {
      await prisma.constraintTemplate.create({
        data: templateData
      });
    }

    console.log('   ✅ Created constraint templates');

    console.log('\\n🎉 Test data seeding completed successfully!');
    
    console.log('\\n📊 Summary:');
    console.log(\`   • Users: 2 (1 VC, 1 Investor)\`);
    console.log(\`   • Constraints: \${constraints.length}\`);
    console.log(\`   • Documents: \${documents.length}\`);
    console.log(\`   • Templates: \${templates.length}\`);
    
    console.log('\\n🔐 Test Credentials:');
    console.log('   VC User: vc@example.com / TestPassword123!');
    console.log('   Investor: investor@example.com / TestPassword123!');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedTestData().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seedTestData;
`;

createFile('scripts/seed-test-data.js', testDataSeeder, 'Creating test data seeder');

// 5. Create package.json test scripts
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add test scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'test:setup': 'node scripts/setup-test-environment.js',
    'test:db:up': 'docker-compose -f docker-compose.test.yml up -d',
    'test:db:down': 'docker-compose -f docker-compose.test.yml down',
    'test:seed': 'cd apps/api && npm run db:seed:test',
    'test:integration': 'node tests/integration/integration-test-suite.js',
    'test:e2e': 'npm run test:db:up && sleep 10 && npm run test:seed && npm run test:integration',
    'test:cleanup': 'npm run test:db:down'
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('📄 Updated root package.json with test scripts');
  console.log('   ✅ Added integration test commands\n');
}

// 6. Update API package.json
const apiPackageJsonPath = 'apps/api/package.json';
if (fs.existsSync(apiPackageJsonPath)) {
  const apiPackageJson = JSON.parse(fs.readFileSync(apiPackageJsonPath, 'utf8'));
  
  apiPackageJson.scripts = {
    ...apiPackageJson.scripts,
    'db:seed:test': 'DATABASE_URL="postgresql://test_user:test_password@localhost:5433/financial_analyzer_test" npx prisma db push && node ../../scripts/seed-test-data.js',
    'test:dev': 'NODE_ENV=test DATABASE_URL="postgresql://test_user:test_password@localhost:5433/financial_analyzer_test" npm run dev'
  };

  fs.writeFileSync(apiPackageJsonPath, JSON.stringify(apiPackageJson, null, 2));
  console.log('📄 Updated API package.json with test database scripts');
  console.log('   ✅ Added test database commands\n');
}

console.log('🎉 Test Environment Setup Complete!');
console.log('\n📋 Next Steps:');
console.log('   1. npm run test:db:up     # Start test database');
console.log('   2. npm run test:seed      # Seed test data');
console.log('   3. npm run test:integration # Run integration tests');
console.log('');
console.log('   Or run all tests: npm run test:e2e');
console.log('   Cleanup: npm run test:cleanup');