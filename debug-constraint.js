#!/usr/bin/env node

const { ConstraintEngine } = require('./mcp-servers/constraint-engine/dist/constraint-engine');

const engine = new ConstraintEngine();

// Add a test constraint: P/E ratio should be less than 20
const testConstraint = {
  id: 'test-1',
  name: 'High P/E Alert',
  metric: 'pe_ratio',
  operator: '<',  // Should be LESS than 20
  value: 20,
  severity: 'warning',
  message: 'P/E ratio should be under 20',
  isActive: true,
  userId: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date()
};

engine.addConstraint(testConstraint);

// Test with P/E ratio of 25 (should violate)
const testMetrics = [
  {
    id: 'metric-1',
    name: 'pe_ratio',
    value: 25,  // This is > 20, so should violate constraint "< 20"
    unit: 'ratio',
    period: 'current',
    source: 'test',
    confidence: 1.0
  }
];

const result = engine.evaluate(testMetrics);

console.log('Constraint:', testConstraint);
console.log('Metric:', testMetrics[0]);
console.log('Result:', result);

if (result.violations.length > 0) {
  console.log('Violation found:', result.violations[0]);
} else {
  console.log('No violations - this might be a bug');
}