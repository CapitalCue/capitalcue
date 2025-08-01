import { randomUUID } from 'crypto';
import { 
  Alert, 
  ConstraintViolation, 
  FinancialMetric 
} from '@financial-analyzer/shared';

export interface AlertGenerationRequest {
  violations: ConstraintViolation[];
  analysisId: string;
  userId: string;
  documentId?: string;
  companyName?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  conditions: AlertCondition[];
  actions: AlertAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  type: 'metric_value' | 'violation_count' | 'severity_level';
  metric?: string;
  operator: '<' | '>' | '=' | '<=' | '>=' | '!=';
  value: number | string;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'sms' | 'slack';
  config: Record<string, any>;
  isEnabled: boolean;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  userType: 'vc' | 'investor' | 'both';
  template: string;
  variables: string[];
  isPublic: boolean;
}

export interface AlertStats {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
  acknowledgedAlerts: number;
  unacknowledgedAlerts: number;
  alertsByDay: Record<string, number>;
  alertsByMetric: Record<string, number>;
}

export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertTemplates: Map<string, AlertTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Generate alerts from constraint violations
   */
  generateAlerts(request: AlertGenerationRequest): Alert[] {
    const generatedAlerts: Alert[] = [];

    for (const violation of request.violations) {
      const alert: Alert = {
        id: randomUUID(),
        severity: violation.severity,
        message: this.enrichAlertMessage(violation, request),
        actualValue: violation.actualValue,
        expectedValue: violation.expectedValue,
        isAcknowledged: false,
        acknowledgedAt: undefined,
        acknowledgedBy: undefined,
        createdAt: new Date(),
        analysisId: request.analysisId,
        constraintId: violation.constraintId,
        userId: request.userId,
      };

      generatedAlerts.push(alert);
      this.alerts.set(alert.id, alert);
    }

    // Apply alert rules for additional processing
    this.applyAlertRules(generatedAlerts, request);

    return generatedAlerts;
  }

  /**
   * Enrich alert message with context
   */
  private enrichAlertMessage(violation: ConstraintViolation, request: AlertGenerationRequest): string {
    let message = violation.message;

    // Add company context if available
    if (request.companyName) {
      message = `[${request.companyName}] ${message}`;
    }

    // Add severity context
    const severityEmoji = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    };

    message = `${severityEmoji[violation.severity]} ${message}`;

    // Add value comparison
    const diff = violation.actualValue - violation.expectedValue;
    const percentDiff = ((diff / violation.expectedValue) * 100).toFixed(1);
    
    message += ` (Difference: ${diff > 0 ? '+' : ''}${diff.toFixed(2)}, ${percentDiff}%)`;

    return message;
  }

  /**
   * Apply custom alert rules
   */
  private applyAlertRules(alerts: Alert[], request: AlertGenerationRequest): void {
    const activeRules = Array.from(this.alertRules.values()).filter(rule => rule.isActive);

    for (const rule of activeRules) {
      const matchingAlerts = alerts.filter(alert => this.evaluateRuleConditions(rule, alert, alerts));
      
      if (matchingAlerts.length > 0) {
        this.executeRuleActions(rule, matchingAlerts, request);
      }
    }
  }

  /**
   * Evaluate alert rule conditions
   */
  private evaluateRuleConditions(rule: AlertRule, alert: Alert, allAlerts: Alert[]): boolean {
    return rule.conditions.every(condition => {
      switch (condition.type) {
        case 'metric_value':
          return this.evaluateMetricCondition(condition, alert);
        case 'violation_count':
          return this.evaluateViolationCountCondition(condition, allAlerts);
        case 'severity_level':
          return this.evaluateSeverityCondition(condition, alert);
        default:
          return false;
      }
    });
  }

  /**
   * Evaluate metric-based condition
   */
  private evaluateMetricCondition(condition: AlertCondition, alert: Alert): boolean {
    if (!condition.metric) return false;

    const value = alert.actualValue;
    const expected = typeof condition.value === 'number' ? condition.value : parseFloat(condition.value as string);

    switch (condition.operator) {
      case '<': return value < expected;
      case '>': return value > expected;
      case '=': return value === expected;
      case '<=': return value <= expected;
      case '>=': return value >= expected;
      case '!=': return value !== expected;
      default: return false;
    }
  }

  /**
   * Evaluate violation count condition
   */
  private evaluateViolationCountCondition(condition: AlertCondition, allAlerts: Alert[]): boolean {
    const count = allAlerts.length;
    const expected = typeof condition.value === 'number' ? condition.value : parseInt(condition.value as string);

    switch (condition.operator) {
      case '<': return count < expected;
      case '>': return count > expected;
      case '=': return count === expected;
      case '<=': return count <= expected;
      case '>=': return count >= expected;
      case '!=': return count !== expected;
      default: return false;
    }
  }

  /**
   * Evaluate severity condition
   */
  private evaluateSeverityCondition(condition: AlertCondition, alert: Alert): boolean {
    const severityLevels = { info: 1, warning: 2, critical: 3 };
    const alertLevel = severityLevels[alert.severity];
    const expectedLevel = severityLevels[condition.value as keyof typeof severityLevels];

    switch (condition.operator) {
      case '<': return alertLevel < expectedLevel;
      case '>': return alertLevel > expectedLevel;
      case '=': return alertLevel === expectedLevel;
      case '<=': return alertLevel <= expectedLevel;
      case '>=': return alertLevel >= expectedLevel;
      case '!=': return alertLevel !== expectedLevel;
      default: return false;
    }
  }

  /**
   * Execute alert rule actions
   */
  private executeRuleActions(rule: AlertRule, alerts: Alert[], request: AlertGenerationRequest): void {
    for (const action of rule.actions) {
      if (!action.isEnabled) continue;

      switch (action.type) {
        case 'email':
          this.sendEmailAlert(action, alerts, request);
          break;
        case 'webhook':
          this.sendWebhookAlert(action, alerts, request);
          break;
        case 'sms':
          this.sendSMSAlert(action, alerts, request);
          break;
        case 'slack':
          this.sendSlackAlert(action, alerts, request);
          break;
      }
    }
  }

  /**
   * Send email alert (placeholder implementation)
   */
  private async sendEmailAlert(action: AlertAction, alerts: Alert[], request: AlertGenerationRequest): Promise<void> {
    // Implementation would use nodemailer or similar
    console.log('Email alert sent:', {
      to: action.config.recipients,
      subject: `Financial Alert: ${alerts.length} violations detected`,
      alerts: alerts.map(a => ({ severity: a.severity, message: a.message }))
    });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(action: AlertAction, alerts: Alert[], request: AlertGenerationRequest): Promise<void> {
    // Implementation would make HTTP POST to webhook URL
    console.log('Webhook alert sent:', {
      url: action.config.url,
      payload: { alerts, analysisId: request.analysisId }
    });
  }

  /**
   * Send SMS alert (placeholder)
   */
  private async sendSMSAlert(action: AlertAction, alerts: Alert[], request: AlertGenerationRequest): Promise<void> {
    console.log('SMS alert sent:', {
      to: action.config.phoneNumber,
      message: `${alerts.length} financial alerts require attention`
    });
  }

  /**
   * Send Slack alert (placeholder)
   */
  private async sendSlackAlert(action: AlertAction, alerts: Alert[], request: AlertGenerationRequest): Promise<void> {
    console.log('Slack alert sent:', {
      channel: action.config.channel,
      alerts: alerts.length
    });
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return this.alerts.get(alertId);
  }

  /**
   * Get all alerts with optional filtering
   */
  getAlerts(filters?: {
    userId?: string;
    severity?: 'critical' | 'warning' | 'info';
    isAcknowledged?: boolean;
    analysisId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.userId) {
        alerts = alerts.filter(a => a.userId === filters.userId);
      }
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.isAcknowledged !== undefined) {
        alerts = alerts.filter(a => a.isAcknowledged === filters.isAcknowledged);
      }
      if (filters.analysisId) {
        alerts = alerts.filter(a => a.analysisId === filters.analysisId);
      }
      if (filters.fromDate) {
        alerts = alerts.filter(a => a.createdAt >= filters.fromDate!);
      }
      if (filters.toDate) {
        alerts = alerts.filter(a => a.createdAt <= filters.toDate!);
      }
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.isAcknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    return true;
  }

  /**
   * Bulk acknowledge alerts
   */
  bulkAcknowledgeAlerts(alertIds: string[], userId: string): number {
    let acknowledgedCount = 0;

    for (const alertId of alertIds) {
      if (this.acknowledgeAlert(alertId, userId)) {
        acknowledgedCount++;
      }
    }

    return acknowledgedCount;
  }

  /**
   * Delete an alert
   */
  deleteAlert(alertId: string): boolean {
    return this.alerts.delete(alertId);
  }

  /**
   * Get alert statistics
   */
  getAlertStats(userId?: string): AlertStats {
    let alerts = Array.from(this.alerts.values());
    
    if (userId) {
      alerts = alerts.filter(a => a.userId === userId);
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Group by day
    const alertsByDay: Record<string, number> = {};
    alerts.filter(a => a.createdAt >= sevenDaysAgo).forEach(alert => {
      const day = alert.createdAt.toISOString().split('T')[0];
      alertsByDay[day] = (alertsByDay[day] || 0) + 1;
    });

    // Group by metric (would need metric info - simplified for now)
    const alertsByMetric: Record<string, number> = {};

    return {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      warningAlerts: alerts.filter(a => a.severity === 'warning').length,
      infoAlerts: alerts.filter(a => a.severity === 'info').length,
      acknowledgedAlerts: alerts.filter(a => a.isAcknowledged).length,
      unacknowledgedAlerts: alerts.filter(a => !a.isAcknowledged).length,
      alertsByDay,
      alertsByMetric,
    };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Initialize default alert templates
   */
  private initializeDefaultTemplates(): void {
    const templates: AlertTemplate[] = [
      {
        id: 'vc-critical',
        name: 'VC Critical Alert',
        description: 'Template for critical alerts for VC users',
        userType: 'vc',
        template: '🚨 CRITICAL: {{companyName}} - {{metric}} is {{actualValue}}, expected {{operator}} {{expectedValue}}. {{message}}',
        variables: ['companyName', 'metric', 'actualValue', 'expectedValue', 'operator', 'message'],
        isPublic: true,
      },
      {
        id: 'investor-warning',
        name: 'Investor Warning Alert',
        description: 'Template for warning alerts for stock investors',
        userType: 'investor',
        template: '⚠️ WARNING: {{ticker}} - {{metric}} Alert: {{message}}. Current: {{actualValue}}, Target: {{operator}} {{expectedValue}}',
        variables: ['ticker', 'metric', 'actualValue', 'expectedValue', 'operator', 'message'],
        isPublic: true,
      },
    ];

    templates.forEach(template => {
      this.alertTemplates.set(template.id, template);
    });
  }

  /**
   * Get alert templates
   */
  getAlertTemplates(userType?: 'vc' | 'investor'): AlertTemplate[] {
    let templates = Array.from(this.alertTemplates.values());
    
    if (userType) {
      templates = templates.filter(t => t.userType === userType || t.userType === 'both');
    }

    return templates;
  }

  /**
   * Clear all alerts (for testing)
   */
  clearAllAlerts(): void {
    this.alerts.clear();
  }
}