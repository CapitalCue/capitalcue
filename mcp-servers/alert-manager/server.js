#!/usr/bin/env node
/**
 * Alert Manager MCP Server
 * Handles alerts, notifications, and monitoring
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8003;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for alerts
let alerts = [];
let alertRules = [];

// Alert severity levels
const SEVERITY_LEVELS = {
    CRITICAL: 'critical',
    WARNING: 'warning', 
    INFO: 'info'
};

// Alert types
const ALERT_TYPES = {
    CONSTRAINT_VIOLATION: 'constraint_violation',
    PERFORMANCE_ISSUE: 'performance_issue',
    DATA_QUALITY: 'data_quality',
    SYSTEM_ERROR: 'system_error'
};

class AlertManager {
    static createAlert(type, severity, title, message, metadata = {}) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity,
            title,
            message,
            metadata,
            timestamp: new Date().toISOString(),
            isRead: false,
            isResolved: false,
            createdBy: 'system'
        };

        alerts.unshift(alert); // Add to beginning for newest first
        return alert;
    }

    static processConstraintViolations(violations) {
        const generatedAlerts = [];

        violations.forEach(violation => {
            const alert = this.createAlert(
                ALERT_TYPES.CONSTRAINT_VIOLATION,
                violation.severity,
                `Constraint Violation: ${violation.constraint_name}`,
                violation.message,
                {
                    constraint_id: violation.constraint_id,
                    metric_name: violation.metric_name,
                    expected: violation.expected,
                    actual: violation.actual
                }
            );
            generatedAlerts.push(alert);
        });

        return generatedAlerts;
    }

    static getAlertStats() {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const stats = {
            total: alerts.length,
            unread: alerts.filter(a => !a.isRead).length,
            unresolved: alerts.filter(a => !a.isResolved).length,
            last24Hours: alerts.filter(a => new Date(a.timestamp) > last24Hours).length,
            bySeverity: {
                critical: alerts.filter(a => a.severity === SEVERITY_LEVELS.CRITICAL).length,
                warning: alerts.filter(a => a.severity === SEVERITY_LEVELS.WARNING).length,
                info: alerts.filter(a => a.severity === SEVERITY_LEVELS.INFO).length
            },
            byType: {}
        };

        // Count by type
        Object.values(ALERT_TYPES).forEach(type => {
            stats.byType[type] = alerts.filter(a => a.type === type).length;
        });

        return stats;
    }
}

// Routes

// Health check
app.get('/health', (req, res) => {
    const stats = AlertManager.getAlertStats();
    res.json({
        status: 'healthy',
        service: 'alert-manager-mcp',
        timestamp: new Date().toISOString(),
        alerts: stats
    });
});

// Get all alerts
app.get('/api/alerts', (req, res) => {
    const { 
        limit = 50, 
        offset = 0, 
        severity, 
        type, 
        unread_only, 
        unresolved_only 
    } = req.query;

    let filteredAlerts = [...alerts];

    // Apply filters
    if (severity) {
        filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
    }
    
    if (type) {
        filteredAlerts = filteredAlerts.filter(a => a.type === type);
    }
    
    if (unread_only === 'true') {
        filteredAlerts = filteredAlerts.filter(a => !a.isRead);
    }
    
    if (unresolved_only === 'true') {
        filteredAlerts = filteredAlerts.filter(a => !a.isResolved);
    }

    // Pagination
    const paginatedAlerts = filteredAlerts.slice(
        parseInt(offset), 
        parseInt(offset) + parseInt(limit)
    );

    res.json({
        success: true,
        data: paginatedAlerts,
        pagination: {
            total: filteredAlerts.length,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: filteredAlerts.length > parseInt(offset) + parseInt(limit)
        }
    });
});

// Get specific alert
app.get('/api/alerts/:id', (req, res) => {
    const alert = alerts.find(a => a.id === req.params.id);
    
    if (!alert) {
        return res.status(404).json({
            success: false,
            error: 'Alert not found'
        });
    }

    res.json({
        success: true,
        data: alert
    });
});

// Create new alert
app.post('/api/alerts', (req, res) => {
    try {
        const { type, severity, title, message, metadata } = req.body;

        // Validate required fields
        if (!type || !severity || !title || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type, severity, title, message'
            });
        }

        // Validate severity
        if (!Object.values(SEVERITY_LEVELS).includes(severity)) {
            return res.status(400).json({
                success: false,
                error: `Invalid severity. Must be one of: ${Object.values(SEVERITY_LEVELS).join(', ')}`
            });
        }

        // Validate type
        if (!Object.values(ALERT_TYPES).includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid type. Must be one of: ${Object.values(ALERT_TYPES).join(', ')}`
            });
        }

        const alert = AlertManager.createAlert(type, severity, title, message, metadata);

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: alert
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update alert (mark as read/resolved)
app.put('/api/alerts/:id', (req, res) => {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    
    if (alertIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Alert not found'
        });
    }

    const updates = {};
    if (req.body.isRead !== undefined) {
        updates.isRead = req.body.isRead;
        if (updates.isRead) {
            updates.readAt = new Date().toISOString();
        }
    }
    
    if (req.body.isResolved !== undefined) {
        updates.isResolved = req.body.isResolved;
        if (updates.isResolved) {
            updates.resolvedAt = new Date().toISOString();
        }
    }

    alerts[alertIndex] = { ...alerts[alertIndex], ...updates };

    res.json({
        success: true,
        message: 'Alert updated successfully',
        data: alerts[alertIndex]
    });
});

// Delete alert
app.delete('/api/alerts/:id', (req, res) => {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    
    if (alertIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'Alert not found'
        });
    }

    alerts.splice(alertIndex, 1);

    res.json({
        success: true,
        message: 'Alert deleted successfully'
    });
});

// Process constraint violations into alerts
app.post('/api/alerts/process-violations', (req, res) => {
    try {
        const { violations } = req.body;

        if (!Array.isArray(violations)) {
            return res.status(400).json({
                success: false,
                error: 'Violations must be an array'
            });
        }

        const generatedAlerts = AlertManager.processConstraintViolations(violations);

        res.json({
            success: true,
            message: `Generated ${generatedAlerts.length} alerts from violations`,
            data: generatedAlerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get alert statistics
app.get('/api/alerts/stats', (req, res) => {
    const stats = AlertManager.getAlertStats();
    res.json({
        success: true,
        data: stats
    });
});

// Mark multiple alerts as read
app.post('/api/alerts/mark-read', (req, res) => {
    const { alert_ids } = req.body;

    if (!Array.isArray(alert_ids)) {
        return res.status(400).json({
            success: false,
            error: 'alert_ids must be an array'
        });
    }

    let updatedCount = 0;
    alerts.forEach(alert => {
        if (alert_ids.includes(alert.id) && !alert.isRead) {
            alert.isRead = true;
            alert.readAt = new Date().toISOString();
            updatedCount++;
        }
    });

    res.json({
        success: true,
        message: `Marked ${updatedCount} alerts as read`,
        updated_count: updatedCount
    });
});

// Clear all alerts (for testing)
app.delete('/api/alerts', (req, res) => {
    const count = alerts.length;
    alerts = [];
    res.json({
        success: true,
        message: `Cleared ${count} alerts`
    });
});

// Seed sample alerts for testing
app.post('/api/alerts/seed', (req, res) => {
    const sampleAlerts = [
        AlertManager.createAlert(
            ALERT_TYPES.CONSTRAINT_VIOLATION,
            SEVERITY_LEVELS.CRITICAL,
            'Critical: Debt to Equity Ratio Exceeded',
            'Company debt to equity ratio of 0.65 exceeds maximum threshold of 0.5',
            { constraint_id: 'debt_to_equity', actual: 0.65, threshold: 0.5 }
        ),
        AlertManager.createAlert(
            ALERT_TYPES.CONSTRAINT_VIOLATION,
            SEVERITY_LEVELS.WARNING,
            'Warning: Revenue Growth Below Target',
            'Revenue growth of 12% is below target of 15%',
            { constraint_id: 'revenue_growth', actual: 12, threshold: 15 }
        ),
        AlertManager.createAlert(
            ALERT_TYPES.DATA_QUALITY,
            SEVERITY_LEVELS.INFO,
            'Document Processing Complete',
            'Successfully processed quarterly report Q4-2023.pdf',
            { document_id: 'doc_123', filename: 'Q4-2023.pdf' }
        )
    ];

    res.json({
        success: true,
        message: 'Sample alerts created',
        data: sampleAlerts
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚨 Alert Manager MCP Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔔 API docs: http://localhost:${PORT}/api/alerts`);
});

module.exports = app;