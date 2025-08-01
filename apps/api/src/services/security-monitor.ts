/**
 * Security Monitoring and Threat Detection Service
 * Real-time monitoring of security events and anomaly detection
 */

import { PrismaClient } from '@prisma/client';
import { auditLogger, AuditEventType, RiskLevel } from './audit-logger';
import { logger } from '../index';
import { Request } from 'express';

const prisma = new PrismaClient();

export interface SecurityEvent {
  type: 'AUTHENTICATION_FAILURE' | 'AUTHORIZATION_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 
        'DATA_BREACH_ATTEMPT' | 'RATE_LIMIT_EXCEEDED' | 'MALICIOUS_REQUEST' | 
        'PRIVILEGE_ESCALATION' | 'ACCOUNT_TAKEOVER' | 'DATA_EXFILTRATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ThreatDetectionRule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  threshold: number;
  timeWindow: number; // in minutes
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  actions: ('LOG' | 'ALERT' | 'BLOCK' | 'QUARANTINE')[];
}

class SecurityMonitoringService {
  private alertThresholds: Map<string, number> = new Map();
  private blockedIPs: Set<string> = new Set();
  private suspiciousUsers: Set<string> = new Set();
  private threatRules: ThreatDetectionRule[] = [];

  constructor() {
    this.initializeThreatRules();
    this.startPeriodicChecks();
  }

  /**
   * Initialize default threat detection rules
   */
  private initializeThreatRules(): void {
    this.threatRules = [
      {
        id: 'failed-login-attempts',
        name: 'Multiple Failed Login Attempts',
        description: 'Detects multiple failed login attempts from same IP or user',
        eventType: 'AUTHENTICATION_FAILURE',
        threshold: 5,
        timeWindow: 15,
        severity: 'HIGH',
        enabled: true,
        actions: ['ALERT', 'BLOCK']
      },
      {
        id: 'rapid-api-requests',
        name: 'Rapid API Requests',
        description: 'Detects unusually high API request rates',
        eventType: 'RATE_LIMIT_EXCEEDED',
        threshold: 10,
        timeWindow: 5,
        severity: 'MEDIUM',
        enabled: true,
        actions: ['LOG', 'ALERT']
      },
      {
        id: 'privilege-escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Detects attempts to access unauthorized resources',
        eventType: 'AUTHORIZATION_FAILURE',
        threshold: 3,
        timeWindow: 10,
        severity: 'CRITICAL',
        enabled: true,
        actions: ['ALERT', 'QUARANTINE']
      },
      {
        id: 'data-exfiltration',
        name: 'Potential Data Exfiltration',
        description: 'Detects large volume data export attempts',
        eventType: 'DATA_EXFILTRATION',
        threshold: 3,
        timeWindow: 60,
        severity: 'CRITICAL',
        enabled: true,
        actions: ['ALERT', 'BLOCK']
      },
      {
        id: 'suspicious-login-patterns',
        name: 'Suspicious Login Patterns',
        description: 'Detects logins from unusual locations or times',
        eventType: 'SUSPICIOUS_ACTIVITY',
        threshold: 1,
        timeWindow: 1,
        severity: 'MEDIUM',
        enabled: true,
        actions: ['LOG', 'ALERT']
      }
    ];
  }

  /**
   * Log security event and check for threats
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Store in database
      await prisma.securityEvent.create({
        data: {
          eventType: event.type,
          severity: event.severity,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          resource: event.resource,
          description: event.description,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
          resolved: false,
          createdAt: event.timestamp
        }
      });

      // Check against threat detection rules
      await this.checkThreatRules(event);

      // Log to audit system
      await auditLogger.logEvent({
        eventType: AuditEventType.SECURITY_VIOLATION,
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        resource: event.resource,
        outcome: 'FAILURE',
        riskLevel: this.mapSeverityToRiskLevel(event.severity),
        details: {
          securityEventType: event.type,
          description: event.description,
          ...event.metadata
        }
      });

    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Check security event against threat detection rules
   */
  private async checkThreatRules(event: SecurityEvent): Promise<void> {
    for (const rule of this.threatRules) {
      if (!rule.enabled) continue;

      try {
        const isMatch = await this.evaluateRule(rule, event);
        if (isMatch) {
          await this.executeRuleActions(rule, event);
        }
      } catch (error) {
        logger.error(`Failed to evaluate rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate if an event triggers a threat detection rule
   */
  private async evaluateRule(rule: ThreatDetectionRule, event: SecurityEvent): Promise<boolean> {
    const timeWindowStart = new Date(Date.now() - rule.timeWindow * 60 * 1000);

    let eventCount = 0;

    switch (rule.id) {
      case 'failed-login-attempts':
        eventCount = await this.countFailedLogins(event.ipAddress, event.userId, timeWindowStart);
        break;
      case 'rapid-api-requests':
        eventCount = await this.countRateLimitExceeded(event.ipAddress, event.userId, timeWindowStart);
        break;
      case 'privilege-escalation':
        eventCount = await this.countAuthorizationFailures(event.userId, timeWindowStart);
        break;
      case 'data-exfiltration':
        eventCount = await this.countDataExportAttempts(event.userId, timeWindowStart);
        break;
      case 'suspicious-login-patterns':
        return await this.detectSuspiciousLoginPattern(event);
      default:
        return false;
    }

    return eventCount >= rule.threshold;
  }

  /**
   * Execute actions defined in threat detection rule
   */
  private async executeRuleActions(rule: ThreatDetectionRule, event: SecurityEvent): Promise<void> {
    logger.warn(`Threat detected: ${rule.name}`, {
      ruleId: rule.id,
      eventType: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress
    });

    for (const action of rule.actions) {
      try {
        switch (action) {
          case 'LOG':
            await this.logThreatDetection(rule, event);
            break;
          case 'ALERT':
            await this.sendSecurityAlert(rule, event);
            break;
          case 'BLOCK':
            await this.blockIPAddress(event.ipAddress);
            break;
          case 'QUARANTINE':
            await this.quarantineUser(event.userId);
            break;
        }
      } catch (error) {
        logger.error(`Failed to execute action ${action} for rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Monitor authentication patterns for anomalies
   */
  async monitorAuthentication(req: Request, userId?: string, success: boolean = true): Promise<void> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!success) {
      await this.logSecurityEvent({
        type: 'AUTHENTICATION_FAILURE',
        severity: 'MEDIUM',
        userId,
        ipAddress,
        userAgent,
        description: 'Failed login attempt',
        metadata: {
          endpoint: req.path,
          method: req.method
        },
        timestamp: new Date()
      });
    } else if (userId) {
      // Check for suspicious login patterns
      const suspiciousPattern = await this.detectSuspiciousLoginPattern({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        userId,
        ipAddress,
        userAgent,
        description: 'Login pattern analysis',
        timestamp: new Date()
      });

      if (suspiciousPattern) {
        await this.logSecurityEvent({
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'MEDIUM',
          userId,
          ipAddress,
          userAgent,
          description: 'Suspicious login pattern detected',
          metadata: {
            reason: 'Unusual location or timing'
          },
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Monitor data access patterns
   */
  async monitorDataAccess(req: Request, resource: string, userId?: string): Promise<void> {
    const ipAddress = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || 'unknown';

    // Check for potential data exfiltration
    if (this.isDataExportEndpoint(req.path)) {
      await this.logSecurityEvent({
        type: 'DATA_EXFILTRATION',
        severity: 'HIGH',
        userId,
        ipAddress,
        userAgent,
        resource,
        description: 'Data export attempt detected',
        metadata: {
          endpoint: req.path,
          method: req.method,
          queryParams: req.query
        },
        timestamp: new Date()
      });
    }

    // Monitor for suspicious access patterns
    if (await this.detectSuspiciousAccess(userId, resource, ipAddress)) {
      await this.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        userId,
        ipAddress,
        userAgent,
        resource,
        description: 'Suspicious data access pattern',
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if IP address is blocked
   */
  isIPBlocked(ipAddress?: string): boolean {
    return ipAddress ? this.blockedIPs.has(ipAddress) : false;
  }

  /**
   * Check if user is quarantined
   */
  isUserQuarantined(userId?: string): boolean {
    return userId ? this.suspiciousUsers.has(userId) : false;
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<any> {
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720;
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [events, threats, blockedIPs, quarantinedUsers] = await Promise.all([
      this.getSecurityEventsSummary(startDate),
      this.getActiveThreatsSummary(startDate),
      this.getBlockedIPsSummary(),
      this.getQuarantinedUsersSummary()
    ]);

    return {
      timeframe,
      summary: {
        totalEvents: events.total,
        criticalEvents: events.critical,
        activeThreats: threats.active,
        resolvedThreats: threats.resolved,
        blockedIPs: blockedIPs.length,
        quarantinedUsers: quarantinedUsers.length
      },
      eventsByType: events.byType,
      eventsBySeverity: events.bySeverity,
      topThreats: threats.top,
      recentEvents: events.recent,
      blockedIPs,
      quarantinedUsers
    };
  }

  /**
   * Private helper methods
   */
  private async countFailedLogins(ipAddress?: string, userId?: string, since: Date): Promise<number> {
    const where: any = {
      eventType: 'AUTHENTICATION_FAILURE',
      createdAt: { gte: since }
    };

    if (ipAddress) where.ipAddress = ipAddress;
    if (userId) where.userId = userId;

    return await prisma.securityEvent.count({ where });
  }

  private async countRateLimitExceeded(ipAddress?: string, userId?: string, since: Date): Promise<number> {
    const where: any = {
      eventType: 'RATE_LIMIT_EXCEEDED',
      createdAt: { gte: since }
    };

    if (ipAddress) where.ipAddress = ipAddress;
    if (userId) where.userId = userId;

    return await prisma.securityEvent.count({ where });
  }

  private async countAuthorizationFailures(userId?: string, since: Date): Promise<number> {
    if (!userId) return 0;

    return await prisma.securityEvent.count({
      where: {
        eventType: 'AUTHORIZATION_FAILURE',
        userId,
        createdAt: { gte: since }
      }
    });
  }

  private async countDataExportAttempts(userId?: string, since: Date): Promise<number> {
    if (!userId) return 0;

    return await prisma.securityEvent.count({
      where: {
        eventType: 'DATA_EXFILTRATION',
        userId,
        createdAt: { gte: since }
      }
    });
  }

  private async detectSuspiciousLoginPattern(event: SecurityEvent): Promise<boolean> {
    if (!event.userId || !event.ipAddress) return false;

    // Get user's recent login history
    const recentLogins = await prisma.securityEvent.findMany({
      where: {
        userId: event.userId,
        eventType: 'AUTHENTICATION_FAILURE',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Check for new IP address
    const knownIPs = new Set(recentLogins.map(login => login.ipAddress).filter(Boolean));
    if (!knownIPs.has(event.ipAddress)) {
      return true; // New IP address
    }

    // Check for unusual timing patterns
    const currentHour = new Date().getHours();
    const usualHours = recentLogins.map(login => new Date(login.createdAt).getHours());
    const averageHour = usualHours.reduce((a, b) => a + b, 0) / usualHours.length;
    
    if (Math.abs(currentHour - averageHour) > 6) {
      return true; // Unusual timing
    }

    return false;
  }

  private async detectSuspiciousAccess(userId?: string, resource?: string, ipAddress?: string): Promise<boolean> {
    if (!userId) return false;

    // Check access frequency
    const recentAccess = await prisma.auditLog.count({
      where: {
        userId,
        resource,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    return recentAccess > 50; // More than 50 accesses per hour is suspicious
  }

  private isDataExportEndpoint(path: string): boolean {
    const exportEndpoints = [
      '/api/privacy/export-request',
      '/api/privacy/download',
      '/api/documents/download',
      '/api/analysis/export'
    ];

    return exportEndpoints.some(endpoint => path.includes(endpoint));
  }

  private async logThreatDetection(rule: ThreatDetectionRule, event: SecurityEvent): Promise<void> {
    logger.warn(`THREAT DETECTED: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      eventType: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress,
      description: event.description
    });
  }

  private async sendSecurityAlert(rule: ThreatDetectionRule, event: SecurityEvent): Promise<void> {
    // In production, this would integrate with alerting systems (PagerDuty, Slack, etc.)
    logger.error(`SECURITY ALERT: ${rule.name}`, {
      ruleId: rule.id,
      severity: rule.severity,
      eventType: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress,
      description: event.description,
      timestamp: event.timestamp
    });

    // TODO: Implement actual alerting mechanism
    // - Send to security team
    // - Integrate with SIEM systems
    // - Send to monitoring dashboards
  }

  private async blockIPAddress(ipAddress?: string): Promise<void> {
    if (!ipAddress) return;

    this.blockedIPs.add(ipAddress);
    logger.warn(`IP address blocked: ${ipAddress}`);

    // Set automatic unblock after 24 hours
    setTimeout(() => {
      this.blockedIPs.delete(ipAddress);
      logger.info(`IP address unblocked: ${ipAddress}`);
    }, 24 * 60 * 60 * 1000);
  }

  private async quarantineUser(userId?: string): Promise<void> {
    if (!userId) return;

    this.suspiciousUsers.add(userId);
    logger.warn(`User quarantined: ${userId}`);

    // Revoke all user sessions
    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  private mapSeverityToRiskLevel(severity: string): RiskLevel {
    switch (severity) {
      case 'CRITICAL': return RiskLevel.CRITICAL;
      case 'HIGH': return RiskLevel.HIGH;
      case 'MEDIUM': return RiskLevel.MEDIUM;
      default: return RiskLevel.LOW;
    }
  }

  private async getSecurityEventsSummary(since: Date) {
    const events = await prisma.securityEvent.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' }
    });

    return {
      total: events.length,
      critical: events.filter(e => e.severity === 'CRITICAL').length,
      byType: events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      bySeverity: events.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recent: events.slice(0, 10)
    };
  }

  private async getActiveThreatsSummary(since: Date) {
    const threats = await prisma.securityEvent.findMany({
      where: {
        createdAt: { gte: since },
        severity: { in: ['HIGH', 'CRITICAL'] }
      }
    });

    return {
      active: threats.filter(t => !t.resolved).length,
      resolved: threats.filter(t => t.resolved).length,
      top: threats.slice(0, 5)
    };
  }

  private async getBlockedIPsSummary() {
    return Array.from(this.blockedIPs);
  }

  private async getQuarantinedUsersSummary() {
    return Array.from(this.suspiciousUsers);
  }

  private startPeriodicChecks(): void {
    // Run security checks every 5 minutes
    setInterval(async () => {
      try {
        await this.performPeriodicSecurityChecks();
      } catch (error) {
        logger.error('Periodic security check failed:', error);
      }
    }, 5 * 60 * 1000);
  }

  private async performPeriodicSecurityChecks(): Promise<void> {
    // Check for unresolved high-severity events
    const unresolvedCritical = await prisma.securityEvent.count({
      where: {
        severity: 'CRITICAL',
        resolved: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    if (unresolvedCritical > 0) {
      logger.error(`${unresolvedCritical} unresolved critical security events`);
    }

    // Clean up old blocked IPs and quarantined users
    // (This is handled by setTimeout in block/quarantine methods)
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitoringService();