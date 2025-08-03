#!/usr/bin/env node
/**
 * Constraint Engine MCP Server
 * Handles financial constraint validation and evaluation
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for constraints
let constraints = [];
let evaluationHistory = [];

// Constraint validation engine
class ConstraintEngine {
    static evaluateMetrics(metrics, constraintRules) {
        const violations = [];
        let criticalCount = 0;
        let warningCount = 0;

        constraintRules.forEach(constraint => {
            if (!constraint.isActive) return;

            const metric = metrics.find(m => m.name === constraint.metric);
            if (!metric) return;

            const passes = this.evaluateConstraint(metric.value, constraint);
            
            if (!passes) {
                const violation = {
                    constraint_id: constraint.id,
                    constraint_name: constraint.name,
                    metric_name: constraint.metric,
                    expected: `${constraint.operator} ${constraint.value}`,
                    actual: metric.value,
                    severity: constraint.severity,
                    message: constraint.message
                };

                violations.push(violation);

                if (constraint.severity === 'critical') {
                    criticalCount++;
                } else if (constraint.severity === 'warning') {
                    warningCount++;
                }
            }
        });

        return {
            violations,
            totalConstraints: constraintRules.filter(c => c.isActive).length,
            violationsCount: violations.length,
            criticalCount,
            warningCount,
            passedConstraints: constraintRules.filter(c => c.isActive).length - violations.length,
            overallStatus: criticalCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass'
        };
    }

    static evaluateConstraint(value, constraint) {
        switch (constraint.operator) {
            case '>': return value > constraint.value;
            case '<': return value < constraint.value;
            case '>=': return value >= constraint.value;
            case '<=': return value <= constraint.value;
            case '=': return Math.abs(value - constraint.value) < 0.01;
            case '!=': return Math.abs(value - constraint.value) >= 0.01;
            default: return false;
        }
    }
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'constraint-engine-mcp',
        timestamp: new Date().toISOString(),
        constraints_count: constraints.length
    });
});

// Get all constraints
app.get('/api/constraints', (req, res) => {
    const { active } = req.query;
    
    let filteredConstraints = constraints;
    
    if (active === 'true') {
        filteredConstraints = constraints.filter(c => c.isActive);
    } else if (active === 'false') {
        filteredConstraints = constraints.filter(c => !c.isActive);
    }

    res.json({
        success: true,
        data: filteredConstraints,
        count: filteredConstraints.length
    });
});

// Get specific constraint
app.get('/api/constraints/:id', (req, res) => {
    const constraint = constraints.find(c => c.id === req.params.id);
    
    if (!constraint) {
        return res.status(404).json({
            success: false,
            error: 'Constraint not found'
        });
    }

    res.json({
        success: true,
        data: constraint
    });
});

// Add new constraint
app.post('/api/constraints', (req, res) => {
    try {
        const constraint = {
            id: req.body.id || `constraint_${Date.now()}`,
            name: req.body.name,
            description: req.body.description || '',
            metric: req.body.metric,
            operator: req.body.operator,
            value: parseFloat(req.body.value),
            severity: req.body.severity || 'warning',
            message: req.body.message,
            isActive: req.body.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!constraint.name || !constraint.metric || !constraint.operator || isNaN(constraint.value)) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, metric, operator, value'
            });
        }

        // Validate operator
        const validOperators = ['<', '>', '=', '<=', '>=', '!='];
        if (!validOperators.includes(constraint.operator)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid operator. Must be one of: <, >, =, <=, >=, !='
            });
        }

        // Validate severity
        const validSeverities = ['critical', 'warning', 'info'];
        if (!validSeverities.includes(constraint.severity)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid severity. Must be one of: critical, warning, info'
            });
        }

        constraints.push(constraint);

        res.status(201).json({
            success: true,
            message: 'Constraint created successfully',
            data: constraint
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update constraint
app.put('/api/constraints/:id', (req, res) => {
    const constraintIndex = constraints.findIndex(c => c.id === req.params.id);
    
    if (constraintIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Constraint not found'
        });
    }

    const updatedConstraint = {
        ...constraints[constraintIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };

    constraints[constraintIndex] = updatedConstraint;

    res.json({
        success: true,
        message: 'Constraint updated successfully',
        data: updatedConstraint
    });
});

// Delete constraint
app.delete('/api/constraints/:id', (req, res) => {
    const constraintIndex = constraints.findIndex(c => c.id === req.params.id);
    
    if (constraintIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Constraint not found'
        });
    }

    constraints.splice(constraintIndex, 1);

    res.json({
        success: true,
        message: 'Constraint deleted successfully'
    });
});

// Evaluate constraints against metrics
app.post('/api/constraints/evaluate', (req, res) => {
    try {
        const { metrics, constraint_ids } = req.body;

        if (!Array.isArray(metrics)) {
            return res.status(400).json({
                success: false,
                error: 'Metrics must be an array'
            });
        }

        // Use specified constraints or all active constraints
        let constraintsToEvaluate = constraints.filter(c => c.isActive);
        
        if (constraint_ids && Array.isArray(constraint_ids)) {
            constraintsToEvaluate = constraints.filter(c => 
                constraint_ids.includes(c.id) && c.isActive
            );
        }

        const evaluation = ConstraintEngine.evaluateMetrics(metrics, constraintsToEvaluate);

        // Store evaluation history
        const evaluationRecord = {
            id: `eval_${Date.now()}`,
            timestamp: new Date().toISOString(),
            metrics,
            constraints_evaluated: constraintsToEvaluate.length,
            result: evaluation
        };
        evaluationHistory.push(evaluationRecord);

        res.json({
            success: true,
            data: evaluation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get evaluation history
app.get('/api/constraints/evaluations', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const recentEvaluations = evaluationHistory
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);

    res.json({
        success: true,
        data: recentEvaluations,
        count: recentEvaluations.length,
        total: evaluationHistory.length
    });
});

// Clear all constraints (for testing)
app.delete('/api/constraints', (req, res) => {
    constraints = [];
    res.json({
        success: true,
        message: 'All constraints cleared'
    });
});

// Add some sample constraints for testing
app.post('/api/constraints/seed', (req, res) => {
    const sampleConstraints = [
        {
            id: 'revenue_growth',
            name: 'Revenue Growth Rate',
            description: 'Minimum revenue growth requirement',
            metric: 'revenue_growth',
            operator: '>',
            value: 15,
            severity: 'warning',
            message: 'Revenue growth should be above 15% annually',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'debt_to_equity',
            name: 'Debt to Equity Ratio',
            description: 'Maximum acceptable debt to equity ratio',
            metric: 'debt_to_equity',
            operator: '<',
            value: 0.5,
            severity: 'critical',
            message: 'Debt to equity ratio should be below 0.5',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'profit_margin',
            name: 'Profit Margin',
            description: 'Minimum profit margin requirement',
            metric: 'profit_margin',
            operator: '>',
            value: 10,
            severity: 'warning',
            message: 'Profit margin should be above 10%',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    constraints.push(...sampleConstraints);

    res.json({
        success: true,
        message: 'Sample constraints added',
        data: sampleConstraints
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Constraint Engine MCP Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 API docs: http://localhost:${PORT}/api/constraints`);
});

module.exports = app;