#!/usr/bin/env node

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
console.log('=============================================\n');

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
    console.log(`📝 ${name}`);
    
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log('   ✅ PASSED\n');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`   ❌ FAILED: ${error.message}\n`);
    }
  }

  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Wait for API server to be ready
    let retries = 10;
    while (retries > 0) {
      try {
        await axios.get(`${API_BASE}/health`);
        console.log('   ✅ API server is ready\n');
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
    console.log('   ✅ Cleanup complete\n');
  }

  printResults() {
    console.log('🎯 INTEGRATION TEST RESULTS');
    console.log('===========================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%\n`);

    if (this.results.failed > 0) {
      console.log('❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.error}`);
        });
    } else {
      console.log('🎉 ALL TESTS PASSED! 🎉');
    }
  }

  // Test Methods
  async testUserRegistration() {
    const userData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Integration',
      lastName: 'Test',
      userType: 'VC',
      companyName: 'Test VC Firm'
    };

    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.user || !response.data.token) {
      throw new Error('Registration response missing user or token');
    }

    authToken = response.data.token;
    testUserId = response.data.user.id;
    console.log(`   👤 Created test user: ${userData.email}`);
  }

  async testUserLogin() {
    // First register a user for login test
    const userData = {
      email: `login-test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Login',
      lastName: 'Test',
      userType: 'INVESTOR'
    };

    await axios.post(`${API_BASE}/auth/register`, userData);

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${loginResponse.status}`);
    }

    if (!loginResponse.data.user || !loginResponse.data.token) {
      throw new Error('Login response missing user or token');
    }

    console.log(`   🔐 Successfully logged in user: ${userData.email}`);
  }

  async testDocumentUpload() {
    if (!authToken) throw new Error('No auth token available');

    // Create a sample CSV file for testing
    const testCsvContent = `Company,Revenue,Growth Rate,Employees
TechCorp,5000000,0.25,50
DataInc,3000000,0.15,30
CloudCo,8000000,0.40,80`;

    const testFilePath = path.join(__dirname, 'test-document.csv');
    fs.writeFileSync(testFilePath, testCsvContent);

    const formData = new FormData();
    formData.append('documents', fs.createReadStream(testFilePath));

    const response = await axios.post(`${API_BASE}/documents/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.documents || response.data.documents.length === 0) {
      throw new Error('Upload response missing documents');
    }

    // Clean up test file
    fs.unlinkSync(testFilePath);

    const uploadedDoc = response.data.documents[0];
    console.log(`   📄 Uploaded document: ${uploadedDoc.originalFilename}`);
    
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

    const response = await axios.post(`${API_BASE}/constraints`, constraintData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.constraint) {
      throw new Error('Constraint creation response missing constraint');
    }

    console.log(`   ⚖️  Created constraint: ${constraintData.name}`);
    
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

    const response = await axios.post(`${API_BASE}/analysis/run`, analysisData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.analysis) {
      throw new Error('Analysis creation response missing analysis');
    }

    console.log(`   🔍 Started analysis: ${analysisData.name}`);
    
    // Wait for analysis to complete (in real scenario, this would be handled differently)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check analysis status
    const statusResponse = await axios.get(`${API_BASE}/analysis/${response.data.analysis.id}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log(`   📊 Analysis status: ${statusResponse.data.analysis.status}`);
    
    return response.data.analysis.id;
  }

  async testAlertGeneration() {
    if (!authToken) throw new Error('No auth token available');

    const response = await axios.get(`${API_BASE}/alerts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    console.log(`   🚨 Found ${response.data.length} alerts`);
    
    // Test alert acknowledgment if alerts exist
    if (response.data.length > 0) {
      const alertId = response.data[0].id;
      const ackResponse = await axios.put(`${API_BASE}/alerts/${alertId}/acknowledge`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (ackResponse.status !== 200) {
        throw new Error(`Expected status 200 for acknowledgment, got ${ackResponse.status}`);
      }

      console.log(`   ✅ Acknowledged alert: ${alertId}`);
    }
  }

  async testDashboardStats() {
    if (!authToken) throw new Error('No auth token available');

    const response = await axios.get(`${API_BASE}/user/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const stats = response.data;
    const expectedFields = ['documents', 'constraints', 'analyses', 'alerts'];
    
    for (const field of expectedFields) {
      if (typeof stats[field] !== 'number') {
        throw new Error(`Dashboard stats missing or invalid field: ${field}`);
      }
    }

    console.log(`   📊 Dashboard stats - Docs: ${stats.documents}, Constraints: ${stats.constraints}, Analyses: ${stats.analyses}, Alerts: ${stats.alerts}`);
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
      console.log(`💥 Test suite failed to initialize: ${error.message}`);
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
