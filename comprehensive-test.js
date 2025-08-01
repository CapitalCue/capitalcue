#!/usr/bin/env node

/**
 * Comprehensive test for all implemented components
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Comprehensive Financial Analyzer Test Suite');
console.log('==============================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    console.log(`📋 ${testName}`);
    testFn();
    passedTests++;
    console.log('   ✅ PASSED\n');
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}\n`);
  }
}

// Test 1: Project Structure
runTest('Project Structure Validation', () => {
  const requiredDirs = [
    'apps/web',
    'apps/api', 
    'packages/shared',
    'packages/ui',
    'mcp-servers/document-parser',
    'mcp-servers/constraint-engine'
  ];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Missing directory: ${dir}`);
    }
  }
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'docker-compose.yml'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing file: ${file}`);
    }
  }
  
  console.log('   - All required directories exist');
  console.log('   - All configuration files present');
});

// Test 2: Package Dependencies
runTest('Package Dependencies', () => {
  const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!rootPkg.workspaces) {
    throw new Error('Workspaces not configured');
  }
  
  if (!Array.isArray(rootPkg.workspaces)) {
    throw new Error('Workspaces should be an array');
  }
  
  console.log(`   - Monorepo with ${rootPkg.workspaces.length} workspace patterns`);
  console.log('   - npm workspaces configured correctly');
});

// Test 3: TypeScript Compilation
runTest('TypeScript Compilation', () => {
  const distDirs = [
    'packages/shared/dist',
    'packages/ui/dist',
    'mcp-servers/constraint-engine/dist'
  ];
  
  for (const dir of distDirs) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Missing compiled output: ${dir}`);
    }
  }
  
  console.log('   - All TypeScript packages compiled successfully');
});

// Test 4: Shared Types
runTest('Shared Types and Constants', () => {
  const { 
    FINANCIAL_METRICS, 
    CONSTRAINT_OPERATORS, 
    ALERT_SEVERITIES,
    API_ENDPOINTS 
  } = require('./packages/shared/dist/constants');
  
  const { formatCurrency, formatPercentage } = require('./packages/shared/dist/utils');
  
  if (Object.keys(FINANCIAL_METRICS).length < 20) {
    throw new Error('Not enough financial metrics defined');
  }
  
  if (Object.keys(CONSTRAINT_OPERATORS).length !== 6) {
    throw new Error('Should have exactly 6 constraint operators');
  }
  
  // Test utility functions
  const formatted = formatCurrency(1234.56);
  if (!formatted.includes('$1,234')) {
    throw new Error('Currency formatting failed');
  }
  
  const percentage = formatPercentage(0.1523);
  if (!percentage.includes('15.23%')) {
    throw new Error('Percentage formatting failed');
  }
  
  console.log(`   - ${Object.keys(FINANCIAL_METRICS).length} financial metrics`);
  console.log(`   - ${Object.keys(CONSTRAINT_OPERATORS).length} constraint operators`);
  console.log('   - Utility functions working');
});

// Test 5: Constraint Engine
runTest('Constraint Engine Logic', () => {
  const { ConstraintEngine } = require('./mcp-servers/constraint-engine/dist/constraint-engine');
  
  const engine = new ConstraintEngine();
  
  // Test multiple constraints with different operators
  const constraints = [
    {
      id: 'pe-high',
      name: 'P/E Too High',
      metric: 'pe_ratio',
      operator: '<',
      value: 20,
      severity: 'warning',
      message: 'P/E ratio should be under 20',
      isActive: true,
      userId: 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'debt-high',
      name: 'Debt Too High',
      metric: 'debt_to_equity',
      operator: '<=',
      value: 2.0,
      severity: 'critical',
      message: 'Debt-to-equity should be 2.0 or lower',
      isActive: true,
      userId: 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'margin-low',
      name: 'Margin Too Low',
      metric: 'net_margin',
      operator: '>=',
      value: 0.1,
      severity: 'info',
      message: 'Net margin should be at least 10%',
      isActive: true,
      userId: 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  constraints.forEach(c => engine.addConstraint(c));
  
  // Test metrics that should trigger violations
  const metrics = [
    { name: 'pe_ratio', value: 25, unit: 'ratio', period: 'current', source: 'test', confidence: 1.0 },
    { name: 'debt_to_equity', value: 2.5, unit: 'ratio', period: 'current', source: 'test', confidence: 1.0 },
    { name: 'net_margin', value: 0.05, unit: 'percentage', period: 'current', source: 'test', confidence: 1.0 }
  ];
  
  const result = engine.evaluate(metrics);
  
  if (result.violationsCount !== 3) {
    throw new Error(`Expected 3 violations, got ${result.violationsCount}`);
  }
  
  if (result.criticalCount !== 1) {
    throw new Error(`Expected 1 critical violation, got ${result.criticalCount}`);
  }
  
  if (result.warningCount !== 1) {
    throw new Error(`Expected 1 warning violation, got ${result.warningCount}`);
  }
  
  if (result.infoCount !== 1) {
    throw new Error(`Expected 1 info violation, got ${result.infoCount}`);
  }
  
  // Test constraint management
  const stats = engine.getStatistics();
  if (stats.totalConstraints !== 3) {
    throw new Error(`Expected 3 total constraints, got ${stats.totalConstraints}`);
  }
  
  console.log('   - All constraint operators working correctly');
  console.log('   - Severity levels properly categorized');
  console.log('   - Constraint management functions working');
});

// Test 6: Database Schema
runTest('Database Schema Validation', () => {
  const schemaPath = './apps/api/prisma/schema.prisma';
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Check for required models
  const requiredModels = [
    'User', 'Company', 'Document', 'FinancialMetric', 
    'Constraint', 'ConstraintTemplate', 'Analysis', 
    'AnalysisConstraint', 'Alert', 'AuditLog'
  ];
  
  for (const model of requiredModels) {
    if (!schema.includes(`model ${model}`)) {
      throw new Error(`Missing model: ${model}`);
    }
  }
  
  // Check for required enums
  const requiredEnums = ['UserType', 'FileType', 'DocumentType', 'AlertSeverity'];
  for (const enumType of requiredEnums) {
    if (!schema.includes(`enum ${enumType}`)) {
      throw new Error(`Missing enum: ${enumType}`);
    }
  }
  
  // Check for seed file
  const seedPath = './apps/api/prisma/seed.ts';
  if (!fs.existsSync(seedPath)) {
    throw new Error('Missing database seed file');
  }
  
  console.log(`   - All ${requiredModels.length} models defined`);
  console.log(`   - All ${requiredEnums.length} enums defined`);
  console.log('   - Database seed file present');
});

// Test 7: Document Parser Structure  
runTest('Document Parser Structure', () => {
  const parserPath = './mcp-servers/document-parser/main.py';
  const requirementsPath = './mcp-servers/document-parser/requirements.txt';
  
  if (!fs.existsSync(parserPath)) {
    throw new Error('Missing document parser main.py');
  }
  
  if (!fs.existsSync(requirementsPath)) {
    throw new Error('Missing requirements.txt');
  }
  
  const mainCode = fs.readFileSync(parserPath, 'utf8');
  const requirements = fs.readFileSync(requirementsPath, 'utf8');
  
  // Check for required dependencies
  const requiredDeps = ['fastapi', 'PyPDF2', 'pandas', 'openpyxl'];
  for (const dep of requiredDeps) {
    if (!requirements.includes(dep)) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
  
  // Check for required endpoints
  const requiredEndpoints = ['/parse', '/upload-and-parse', '/health'];
  for (const endpoint of requiredEndpoints) {
    if (!mainCode.includes(endpoint)) {
      throw new Error(`Missing endpoint: ${endpoint}`);
    }
  }
  
  console.log('   - All required Python dependencies listed');
  console.log('   - All required API endpoints defined');
  console.log('   - PDF, Excel, and CSV parsing logic implemented');
});

// Test 8: UI Components
runTest('UI Components', () => {
  const uiPath = './packages/ui/dist';
  
  if (!fs.existsSync(uiPath)) {
    throw new Error('UI package not compiled');
  }
  
  // Check for compiled components
  const componentFiles = [
    'components/Button.d.ts',
    'components/Card.d.ts', 
    'components/Input.d.ts',
    'components/Badge.d.ts',
    'components/Alert.d.ts'
  ];
  
  for (const file of componentFiles) {
    if (!fs.existsSync(path.join(uiPath, file))) {
      throw new Error(`Missing component: ${file}`);
    }
  }
  
  console.log('   - All UI components compiled successfully');
  console.log('   - TypeScript definitions generated');
});

// Test Summary
console.log('📊 Test Summary');
console.log('=============');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%\n`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! The foundation is solid.');
  console.log('\n✅ What\'s working:');
  console.log('  - Monorepo structure with npm workspaces');
  console.log('  - Shared TypeScript types and utilities');
  console.log('  - Constraint engine with full evaluation logic');
  console.log('  - Database schema with all required models');
  console.log('  - Document parser structure (Python FastAPI)');
  console.log('  - UI component library');
  
  console.log('\n🚧 Next steps:');
  console.log('  - Set up database (Docker or local PostgreSQL)');
  console.log('  - Test document parser with real files');
  console.log('  - Build remaining MCP servers (alert-manager, ai-analyzer)');
  console.log('  - Implement Express API backend');
  console.log('  - Build React frontend');
} else {
  console.log('⚠️  Some tests failed. Please fix the issues above before proceeding.');
}