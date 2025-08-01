#!/usr/bin/env node

/**
 * Load Testing Script for CapitalCue
 * 
 * This script performs comprehensive load testing using multiple scenarios
 * to validate system performance under various load conditions.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: process.env.API_URL || 'http://localhost:3001',
  testDuration: 5 * 60 * 1000, // 5 minutes
  rampUpTime: 60 * 1000, // 1 minute
  maxConcurrentUsers: 100,
  testUser: {
    email: 'loadtest@example.com',
    password: 'LoadTest123!'
  }
};

// Test scenarios
const SCENARIOS = {
  authentication: { weight: 20, name: 'Authentication' },
  documents: { weight: 30, name: 'Document Operations' },
  constraints: { weight: 25, name: 'Constraint Management' },
  analysis: { weight: 25, name: 'Analysis Execution' }
};

// Global state
let authToken = null;
let testResults = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  maxResponseTime: 0,
  minResponseTime: Infinity,
  errors: [],
  scenarioResults: {}
};

let activeUsers = 0;
let testStartTime = null;

/**
 * Utility functions
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const randomString = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const logWithTimestamp = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

/**
 * HTTP request wrapper with timing and error handling
 */
const makeRequest = async (method, url, data = null, headers = {}) => {
  const startTime = Date.now();
  testResults.totalRequests++;

  try {
    const config = {
      method,
      url: `${CONFIG.baseUrl}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 30000 // 30 second timeout
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const responseTime = Date.now() - startTime;

    // Update metrics
    testResults.successfulRequests++;
    testResults.averageResponseTime = (testResults.averageResponseTime * (testResults.successfulRequests - 1) + responseTime) / testResults.successfulRequests;
    testResults.maxResponseTime = Math.max(testResults.maxResponseTime, responseTime);
    testResults.minResponseTime = Math.min(testResults.minResponseTime, responseTime);

    return { success: true, data: response.data, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    testResults.failedRequests++;
    
    const errorInfo = {
      url,
      method,
      message: error.message,
      status: error.response?.status || 'TIMEOUT',
      responseTime
    };
    
    testResults.errors.push(errorInfo);
    return { success: false, error: errorInfo, responseTime };
  }
};

/**
 * Authentication scenario
 */
const authenticationScenario = async () => {
  // Login
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: CONFIG.testUser.email,
    password: CONFIG.testUser.password
  });

  if (loginResult.success) {
    authToken = loginResult.data.token;
    
    // Get user profile
    await makeRequest('GET', '/auth/profile', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    // Logout
    await makeRequest('POST', '/auth/logout', null, {
      'Authorization': `Bearer ${authToken}`
    });
  }

  return loginResult.success;
};

/**
 * Document operations scenario
 */
const documentsScenario = async () => {
  if (!authToken) return false;

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // List documents
  const listResult = await makeRequest('GET', '/documents', null, headers);
  if (!listResult.success) return false;

  // Get document templates
  await makeRequest('GET', '/documents/templates', null, headers);

  // Simulate document operations
  await sleep(100); // Brief pause

  return true;
};

/**
 * Constraint management scenario
 */
const constraintsScenario = async () => {
  if (!authToken) return false;

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // List constraints
  const listResult = await makeRequest('GET', '/constraints', null, headers);
  if (!listResult.success) return false;

  // Get constraint templates
  await makeRequest('GET', '/constraints/templates', null, headers);

  // Create a test constraint
  const createResult = await makeRequest('POST', '/constraints', {
    name: `Load Test Constraint ${randomString()}`,
    description: 'Test constraint created during load testing',
    metric: 'current_ratio',
    operator: 'LESS_THAN',
    value: Math.random() * 2,
    severity: ['CRITICAL', 'WARNING', 'INFO'][Math.floor(Math.random() * 3)],
    message: 'Load test constraint message'
  }, headers);

  if (createResult.success) {
    const constraintId = createResult.data.constraint.id;
    
    // Get constraint details
    await makeRequest('GET', `/constraints/${constraintId}`, null, headers);
    
    // Update constraint
    await makeRequest('PUT', `/constraints/${constraintId}`, {
      name: `Updated Load Test Constraint ${randomString()}`,
      value: Math.random() * 2
    }, headers);
    
    // Toggle constraint status
    await makeRequest('POST', `/constraints/${constraintId}/toggle`, null, headers);
    
    // Delete constraint
    await makeRequest('DELETE', `/constraints/${constraintId}`, null, headers);
  }

  return true;
};

/**
 * Analysis execution scenario
 */
const analysisScenario = async () => {
  if (!authToken) return false;

  const headers = { 'Authorization': `Bearer ${authToken}` };

  // List analyses
  await makeRequest('GET', '/analysis', null, headers);

  // Get analysis history
  await makeRequest('GET', '/analysis/history', null, headers);

  // Simulate analysis execution (without actually running it)
  await sleep(200); // Simulate processing time

  return true;
};

/**
 * Run a single user session
 */
const runUserSession = async (userId) => {
  activeUsers++;
  logWithTimestamp(`User ${userId} started (Active users: ${activeUsers})`);

  try {
    // Authenticate first
    const authSuccess = await authenticationScenario();
    if (!authSuccess) {
      logWithTimestamp(`User ${userId} authentication failed`);
      return;
    }

    const sessionEndTime = Date.now() + CONFIG.testDuration;
    let sessionRequests = 0;

    while (Date.now() < sessionEndTime) {
      // Select random scenario based on weights
      const rand = Math.random() * 100;
      let cumulativeWeight = 0;
      let selectedScenario = null;

      for (const [scenario, config] of Object.entries(SCENARIOS)) {
        cumulativeWeight += config.weight;
        if (rand <= cumulativeWeight) {
          selectedScenario = scenario;
          break;
        }
      }

      // Execute selected scenario
      let scenarioSuccess = false;
      switch (selectedScenario) {
        case 'authentication':
          scenarioSuccess = await authenticationScenario();
          break;
        case 'documents':
          scenarioSuccess = await documentsScenario();
          break;
        case 'constraints':
          scenarioSuccess = await constraintsScenario();
          break;
        case 'analysis':
          scenarioSuccess = await analysisScenario();
          break;
      }

      // Update scenario results
      if (!testResults.scenarioResults[selectedScenario]) {
        testResults.scenarioResults[selectedScenario] = {
          total: 0,
          successful: 0,
          failed: 0
        };
      }

      testResults.scenarioResults[selectedScenario].total++;
      if (scenarioSuccess) {
        testResults.scenarioResults[selectedScenario].successful++;
      } else {
        testResults.scenarioResults[selectedScenario].failed++;
      }

      sessionRequests++;

      // Brief pause between scenarios
      await sleep(Math.random() * 2000 + 500); // 0.5-2.5 seconds
    }

    logWithTimestamp(`User ${userId} completed ${sessionRequests} scenarios`);
  } catch (error) {
    logWithTimestamp(`User ${userId} encountered error: ${error.message}`);
  } finally {
    activeUsers--;
  }
};

/**
 * Print progress update
 */
const printProgress = () => {
  const elapsed = Date.now() - testStartTime;
  const progress = Math.min((elapsed / CONFIG.testDuration) * 100, 100);
  const successRate = testResults.totalRequests > 0 ? 
    (testResults.successfulRequests / testResults.totalRequests * 100).toFixed(2) : 0;

  logWithTimestamp(
    `Progress: ${progress.toFixed(1)}% | ` +
    `Active Users: ${activeUsers} | ` +
    `Requests: ${testResults.totalRequests} | ` +
    `Success Rate: ${successRate}% | ` +
    `Avg Response: ${testResults.averageResponseTime.toFixed(2)}ms`
  );
};

/**
 * Generate final report
 */
const generateReport = () => {
  const duration = Date.now() - testStartTime;
  const successRate = testResults.totalRequests > 0 ? 
    (testResults.successfulRequests / testResults.totalRequests * 100).toFixed(2) : 0;
  const requestsPerSecond = (testResults.totalRequests / (duration / 1000)).toFixed(2);

  const report = {
    summary: {
      testDuration: `${(duration / 1000).toFixed(2)} seconds`,
      totalRequests: testResults.totalRequests,
      successfulRequests: testResults.successfulRequests,
      failedRequests: testResults.failedRequests,
      successRate: `${successRate}%`,
      requestsPerSecond: parseFloat(requestsPerSecond),
      averageResponseTime: `${testResults.averageResponseTime.toFixed(2)}ms`,
      maxResponseTime: `${testResults.maxResponseTime}ms`,
      minResponseTime: testResults.minResponseTime === Infinity ? '0ms' : `${testResults.minResponseTime}ms`
    },
    scenarioResults: testResults.scenarioResults,
    errors: testResults.errors.slice(0, 10), // First 10 errors
    errorSummary: {}
  };

  // Summarize errors by type
  testResults.errors.forEach(error => {
    const key = `${error.status} - ${error.url}`;
    if (!report.errorSummary[key]) {
      report.errorSummary[key] = 0;
    }
    report.errorSummary[key]++;
  });

  // Save report to file
  const reportPath = path.join(__dirname, '..', 'reports', `load-test-${Date.now()}.json`);
  const reportsDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print report to console
  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Test Duration: ${report.summary.testDuration}`);
  console.log(`Total Requests: ${report.summary.totalRequests}`);
  console.log(`Successful Requests: ${report.summary.successfulRequests}`);
  console.log(`Failed Requests: ${report.summary.failedRequests}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log(`Requests/Second: ${report.summary.requestsPerSecond}`);
  console.log(`Average Response Time: ${report.summary.averageResponseTime}`);
  console.log(`Max Response Time: ${report.summary.maxResponseTime}`);
  console.log(`Min Response Time: ${report.summary.minResponseTime}`);

  console.log('\nScenario Results:');
  Object.entries(report.scenarioResults).forEach(([scenario, results]) => {
    const scenarioSuccessRate = results.total > 0 ? 
      (results.successful / results.total * 100).toFixed(2) : 0;
    console.log(`  ${SCENARIOS[scenario].name}: ${results.total} total, ${scenarioSuccessRate}% success`);
  });

  if (Object.keys(report.errorSummary).length > 0) {
    console.log('\nTop Errors:');
    Object.entries(report.errorSummary)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([error, count]) => {
        console.log(`  ${error}: ${count} occurrences`);
      });
  }

  console.log(`\nFull report saved to: ${reportPath}`);
  console.log('='.repeat(60));

  return report;
};

/**
 * Main load test execution
 */
const runLoadTest = async () => {
  console.log('CapitalCue - Load Test');
  console.log('='.repeat(60));
  console.log(`Base URL: ${CONFIG.baseUrl}`);
  console.log(`Test Duration: ${CONFIG.testDuration / 1000} seconds`);
  console.log(`Max Concurrent Users: ${CONFIG.maxConcurrentUsers}`);
  console.log(`Ramp-up Time: ${CONFIG.rampUpTime / 1000} seconds`);
  console.log('='.repeat(60));

  testStartTime = Date.now();

  // Progress reporting interval
  const progressInterval = setInterval(printProgress, 10000); // Every 10 seconds

  // Gradually ramp up users
  const userPromises = [];
  const rampUpInterval = CONFIG.rampUpTime / CONFIG.maxConcurrentUsers;

  for (let i = 0; i < CONFIG.maxConcurrentUsers; i++) {
    setTimeout(() => {
      userPromises.push(runUserSession(i + 1));
    }, i * rampUpInterval);
  }

  // Wait for all users to complete
  await Promise.all(userPromises);

  // Final progress update
  clearInterval(progressInterval);
  printProgress();

  // Generate and display final report
  const report = generateReport();

  // Exit with appropriate code
  const successRate = parseFloat(report.summary.successRate.replace('%', ''));
  const avgResponseTime = parseFloat(report.summary.averageResponseTime.replace('ms', ''));

  if (successRate < 95 || avgResponseTime > 1000) {
    console.log('\nLOAD TEST FAILED: Performance targets not met');
    process.exit(1);
  } else {
    console.log('\nLOAD TEST PASSED: All performance targets met');
    process.exit(0);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived interrupt signal. Generating report...');
  generateReport();
  process.exit(0);
});

// Run the load test
if (require.main === module) {
  runLoadTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = { runLoadTest, CONFIG, SCENARIOS };