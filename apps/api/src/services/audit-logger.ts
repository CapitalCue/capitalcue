/**
 * Comprehensive Audit Logging Service
 * Tracks all user actions, security events, and compliance activities
 */

import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { logger } from '../index';
import { maskSensitiveData, hashData, createHMAC } from '../utils/encryption';

const prisma = new PrismaClient();

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  
  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  
  // Data events
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',
  
  // File events
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETE = 'FILE_DELETE',
  FILE_SHARE = 'FILE_SHARE',
  
  // System events
  SYSTEM_START = 'SYSTEM_START',
  SYSTEM_STOP = 'SYSTEM_STOP',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE',
  
  // Security events
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Compliance events
  GDPR_REQUEST = 'GDPR_REQUEST',
  DATA_RETENTION_POLICY = 'DATA_RETENTION_POLICY',
  PRIVACY_POLICY_ACCEPTED = 'PRIVACY_POLICY_ACCEPTED',
  
  // AI/ML events
  AI_ANALYSIS_STARTED = 'AI_ANALYSIS_STARTED',
  AI_ANALYSIS_COMPLETED = 'AI_ANALYSIS_COMPLETED',
  AI_MODEL_ACCESSED = 'AI_MODEL_ACCESSED'
}

// Risk levels for audit events
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Audit log entry interface
interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'ERROR';
  riskLevel: RiskLevel;
  details?: Record<string, any>;
  timestamp: Date;
  requestId?: string;
}

class AuditLogger {
  private isEnabled: boolean;
  private batchSize: number;
  private batchTimeout: number;
  private pendingLogs: AuditLogEntry[];
  private batchTimer?: NodeJS.Timeout;

  constructor() {
    this.isEnabled = process.env.AUDIT_LOGGING_ENABLED !== 'false';
    this.batchSize = parseInt(process.env.AUDIT_BATCH_SIZE || '10');
    this.batchTimeout = parseInt(process.env.AUDIT_BATCH_TIMEOUT || '5000');
    this.pendingLogs = [];
    
    if (this.isEnabled) {
      this.startBatchTimer();
    }
  }

  /**
   * Log an audit event
   */
  async logEvent(entry: Partial<AuditLogEntry> & { 
    eventType: AuditEventType; 
    outcome: 'SUCCESS' | 'FAILURE' | 'ERROR';
  }): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date(),
        riskLevel: entry.riskLevel || this.calculateRiskLevel(entry.eventType),
        details: entry.details ? maskSensitiveData(entry.details) : undefined,
      };

      // Add integrity hash
      const entryWithHash = {
        ...auditEntry,
        integrityHash: this.calculateIntegrityHash(auditEntry)
      };

      // Add to batch or process immediately for critical events
      if (entry.riskLevel === RiskLevel.CRITICAL) {
        await this.writeToDatabase([entryWithHash]);
        await this.sendSecurityAlert(entryWithHash);
      } else {
        this.addToBatch(entryWithHash);
      }

      // Also log to application logger
      logger.info('Audit event', entryWithHash);

    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuthentication(
    eventType: AuditEventType.LOGIN_SUCCESS | AuditEventType.LOGIN_FAILURE | AuditEventType.LOGOUT,
    req: Request,
    userId?: string,
    userEmail?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType,
      userId,
      userEmail,
      sessionId: req.sessionID,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      outcome: eventType === AuditEventType.LOGIN_FAILURE ? 'FAILURE' : 'SUCCESS',
      details,
      requestId: req.headers['x-request-id'] as string
    });
  }

  /**
   * Log data access events
   */
  async logDataAccess(
    eventType: AuditEventType,
    req: Request,
    resource: string,
    resourceId?: string,
    outcome: 'SUCCESS' | 'FAILURE' | 'ERROR' = 'SUCCESS',
    details?: Record<string, any>
  ): Promise<void> {
    const user = (req as any).user;
    
    await this.logEvent({
      eventType,
      userId: user?.id,
      userEmail: user?.email,
      sessionId: req.sessionID,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      resource,
      resourceId,
      action: req.method,
      outcome,
      details,
      requestId: req.headers['x-request-id'] as string
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    req: Request,
    violationType: string,
    details: Record<string, any>
  ): Promise<void> {
    const user = (req as any).user;
    
    await this.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      userId: user?.id,
      userEmail: user?.email,
      sessionId: req.sessionID,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent'),
      resource: req.path,
      action: req.method,
      outcome: 'FAILURE',
      riskLevel: RiskLevel.HIGH,
      details: {
        violationType,
        ...details
      },
      requestId: req.headers['x-request-id'] as string
    });
  }

  /**
   * Log GDPR and compliance events
   */
  async logComplianceEvent(
    eventType: AuditEventType,
    userId: string,
    userEmail: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType,
      userId,
      userEmail,
      outcome: 'SUCCESS',
      riskLevel: RiskLevel.MEDIUM,
      details
    });
  }

  /**
   * Get audit trail for a user
   */
  async getUserAuditTrail(
    userId: string, 
    startDate?: Date, 
    endDate?: Date,
    eventTypes?: AuditEventType[]
  ): Promise<any[]> {
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    
    if (eventTypes && eventTypes.length > 0) {
      where.entityType = { in: eventTypes };
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000 // Limit to prevent large queries
    });
  }

  /**
   * Get security events
   */
  async getSecurityEvents(
    startDate?: Date,
    endDate?: Date,
    riskLevel?: RiskLevel
  ): Promise<any[]> {
    const where: any = {
      entityType: {
        in: [
          AuditEventType.SECURITY_VIOLATION,
          AuditEventType.SUSPICIOUS_ACTIVITY,
          AuditEventType.RATE_LIMIT_EXCEEDED,
          AuditEventType.ACCESS_DENIED,
          AuditEventType.LOGIN_FAILURE
        ]
      }
    };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    
    if (riskLevel) {
      where.riskLevel = riskLevel;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 500
    });
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: Record<string, number>;
    events: any[];
    dataAccess: any[];
    securityIncidents: any[];
  }> {
    const events = await prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const summary = events.reduce((acc, event) => {
      acc[event.entityType] = (acc[event.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dataAccess = events.filter(e => 
      [AuditEventType.DATA_READ, AuditEventType.DATA_CREATE, 
       AuditEventType.DATA_UPDATE, AuditEventType.DATA_DELETE].includes(e.entityType as AuditEventType)
    );

    const securityIncidents = events.filter(e => 
      [AuditEventType.SECURITY_VIOLATION, AuditEventType.SUSPICIOUS_ACTIVITY].includes(e.entityType as AuditEventType)
    );

    return {
      summary,
      events,
      dataAccess,
      securityIncidents
    };
  }

  /**
   * Private helper methods
   */
  private calculateRiskLevel(eventType: AuditEventType): RiskLevel {
    const highRiskEvents = [
      AuditEventType.SECURITY_VIOLATION,
      AuditEventType.SUSPICIOUS_ACTIVITY,
      AuditEventType.ACCOUNT_LOCKED,
      AuditEventType.DATA_DELETE,
      AuditEventType.PERMISSION_CHANGED
    ];

    const mediumRiskEvents = [
      AuditEventType.LOGIN_FAILURE,
      AuditEventType.ACCESS_DENIED,
      AuditEventType.DATA_EXPORT,
      AuditEventType.FILE_DOWNLOAD,
      AuditEventType.PASSWORD_CHANGE
    ];

    if (highRiskEvents.includes(eventType)) return RiskLevel.HIGH;
    if (mediumRiskEvents.includes(eventType)) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  private calculateIntegrityHash(entry: AuditLogEntry): string {
    const data = JSON.stringify({
      eventType: entry.eventType,
      userId: entry.userId,
      timestamp: entry.timestamp.toISOString(),
      outcome: entry.outcome,
      resource: entry.resource,
      action: entry.action
    });
    
    return createHMAC(data, process.env.AUDIT_INTEGRITY_KEY);
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  private addToBatch(entry: any): void {
    this.pendingLogs.push(entry);
    
    if (this.pendingLogs.length >= this.batchSize) {
      this.flushBatch();
    }
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.pendingLogs.length > 0) {
        this.flushBatch();
      }
    }, this.batchTimeout);
  }

  private async flushBatch(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToWrite = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      await this.writeToDatabase(logsToWrite);
    } catch (error) {
      logger.error('Failed to write audit logs to database:', error);
      // Re-add failed logs to retry queue
      this.pendingLogs.unshift(...logsToWrite);
    }
  }

  private async writeToDatabase(logs: any[]): Promise<void> {
    await prisma.auditLog.createMany({
      data: logs.map(log => ({
        entityType: log.eventType,
        entityId: log.resourceId || null,
        userId: log.userId || null,
        userEmail: log.userEmail || null,
        sessionId: log.sessionId || null,
        ipAddress: log.ipAddress || null,
        userAgent: log.userAgent || null,
        action: log.action || null,
        resource: log.resource || null,
        outcome: log.outcome,
        riskLevel: log.riskLevel,
        details: log.details ? JSON.stringify(log.details) : null,
        integrityHash: log.integrityHash,
        timestamp: log.timestamp,
        requestId: log.requestId || null
      }))
    });
  }

  private async sendSecurityAlert(entry: any): Promise<void> {
    // Send immediate alerts for critical security events
    logger.error('CRITICAL SECURITY EVENT', {
      eventType: entry.eventType,
      userId: entry.userId,
      ipAddress: entry.ipAddress,
      details: entry.details
    });

    // TODO: Integrate with external alerting systems (PagerDuty, Slack, etc.)
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    // Flush any remaining logs
    if (this.pendingLogs.length > 0) {
      this.flushBatch();
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Graceful shutdown
process.on('SIGINT', () => {
  auditLogger.destroy();
});

process.on('SIGTERM', () => {
  auditLogger.destroy();
});