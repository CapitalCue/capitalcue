/**
 * Data Privacy and GDPR Compliance Service
 * Handles data export requests, deletion (right to be forgotten), consent management
 */

import { PrismaClient } from '@prisma/client';
import { auditLogger, AuditEventType } from './audit-logger';
import { encrypt, decrypt, maskSensitiveData, anonymizeEmail } from '../utils/encryption';
import { logger } from '../index';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { createWriteStream } from 'fs';

const prisma = new PrismaClient();

export interface DataExportOptions {
  includePersonalData?: boolean;
  includeActivityLog?: boolean;
  includeDocuments?: boolean;
  includeAnalysisResults?: boolean;
  format?: 'JSON' | 'CSV' | 'XML';
  anonymize?: boolean;
}

export interface ConsentRecord {
  type: 'privacy_policy' | 'terms_of_service' | 'marketing' | 'data_retention';
  version: string;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataDeletionOptions {
  deleteType: 'ACCOUNT_DELETION' | 'DATA_PURGE' | 'DOCUMENT_DELETION' | 'ANALYSIS_DELETION' | 'PARTIAL_DELETION';
  retainAuditLogs?: boolean;
  retainAnonymizedData?: boolean;
  reason?: string;
}

class PrivacyComplianceService {
  private readonly uploadPath: string;
  private readonly tempPath: string;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.tempPath = process.env.TEMP_PATH || './temp';
  }

  /**
   * Request data export for GDPR Article 15 (Right of Access)
   */
  async requestDataExport(
    userId: string,
    requestType: 'PERSONAL_DATA' | 'ACTIVITY_LOG' | 'DOCUMENTS' | 'ANALYSIS_RESULTS' | 'FULL_EXPORT',
    options: DataExportOptions = {}
  ): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create export request record
      const exportRequest = await prisma.dataExportRequest.create({
        data: {
          userId,
          requestType,
          status: 'PENDING',
          requestedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          metadata: JSON.stringify(options)
        }
      });

      // Log compliance event
      await auditLogger.logComplianceEvent(
        AuditEventType.GDPR_REQUEST,
        userId,
        user.email,
        {
          requestType,
          exportRequestId: exportRequest.id,
          options
        }
      );

      // Process export asynchronously
      this.processDataExport(exportRequest.id, userId, requestType, options).catch(error => {
        logger.error('Data export processing failed:', error);
      });

      return exportRequest.id;

    } catch (error) {
      logger.error('Data export request failed:', error);
      throw new Error('Failed to create data export request');
    }
  }

  /**
   * Process data export request
   */
  private async processDataExport(
    requestId: string,
    userId: string,
    requestType: string,
    options: DataExportOptions
  ): Promise<void> {
    try {
      // Update request status
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'IN_PROGRESS' }
      });

      const exportData: any = {};
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      // Collect personal data
      if (requestType === 'PERSONAL_DATA' || requestType === 'FULL_EXPORT') {
        exportData.personalData = await this.collectPersonalData(userId, options.anonymize);
      }

      // Collect activity logs
      if (requestType === 'ACTIVITY_LOG' || requestType === 'FULL_EXPORT') {
        exportData.activityLog = await this.collectActivityLog(userId, options.anonymize);
      }

      // Collect documents
      if (requestType === 'DOCUMENTS' || requestType === 'FULL_EXPORT') {
        exportData.documents = await this.collectDocumentData(userId, options.anonymize);
      }

      // Collect analysis results
      if (requestType === 'ANALYSIS_RESULTS' || requestType === 'FULL_EXPORT') {
        exportData.analysisResults = await this.collectAnalysisData(userId, options.anonymize);
      }

      // Create export file
      const exportPath = await this.createExportFile(requestId, exportData, options.format || 'JSON');

      // Update request with download URL
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          downloadUrl: exportPath
        }
      });

      // Log completion
      await auditLogger.logComplianceEvent(
        AuditEventType.DATA_EXPORTED,
        userId,
        user.email,
        {
          requestId,
          exportPath,
          dataTypes: Object.keys(exportData)
        }
      );

    } catch (error) {
      logger.error('Data export processing failed:', error);
      
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED' }
      });
    }
  }

  /**
   * Request data deletion for GDPR Article 17 (Right to be Forgotten)
   */
  async requestDataDeletion(
    userId: string,
    deletionType: 'ACCOUNT_DELETION' | 'DATA_PURGE' | 'DOCUMENT_DELETION' | 'ANALYSIS_DELETION' | 'PARTIAL_DELETION',
    options: DataDeletionOptions
  ): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create deletion request record
      const deletionRequest = await prisma.dataDeletionRequest.create({
        data: {
          userId,
          requestType: deletionType,
          status: 'PENDING',
          requestedAt: new Date(),
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days notice
          metadata: JSON.stringify(options)
        }
      });

      // Log compliance event
      await auditLogger.logComplianceEvent(
        AuditEventType.GDPR_REQUEST,
        userId,
        user.email,
        {
          requestType: 'DATA_DELETION',
          deletionType,
          deletionRequestId: deletionRequest.id,
          options
        }
      );

      return deletionRequest.id;

    } catch (error) {
      logger.error('Data deletion request failed:', error);
      throw new Error('Failed to create data deletion request');
    }
  }

  /**
   * Process scheduled data deletions
   */
  async processScheduledDeletions(): Promise<void> {
    try {
      const pendingDeletions = await prisma.dataDeletionRequest.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date()
          }
        },
        include: {
          user: true
        }
      });

      for (const deletion of pendingDeletions) {
        try {
          await this.executeDeletion(deletion);
        } catch (error) {
          logger.error(`Failed to process deletion ${deletion.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Failed to process scheduled deletions:', error);
    }
  }

  /**
   * Execute data deletion
   */
  private async executeDeletion(deletionRequest: any): Promise<void> {
    const { id, userId, requestType, metadata } = deletionRequest;
    const options: DataDeletionOptions = JSON.parse(metadata || '{}');

    try {
      // Update status
      await prisma.dataDeletionRequest.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });

      switch (requestType) {
        case 'ACCOUNT_DELETION':
          await this.deleteUserAccount(userId, options);
          break;
        case 'DATA_PURGE':
          await this.purgeUserData(userId, options);
          break;
        case 'DOCUMENT_DELETION':
          await this.deleteUserDocuments(userId);
          break;
        case 'ANALYSIS_DELETION':
          await this.deleteUserAnalyses(userId);
          break;
        case 'PARTIAL_DELETION':
          await this.partialDataDeletion(userId, options);
          break;
      }

      // Mark as completed
      await prisma.dataDeletionRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Log completion
      await auditLogger.logComplianceEvent(
        AuditEventType.DATA_DELETED,
        userId,
        deletionRequest.user.email,
        {
          requestId: id,
          deletionType: requestType,
          retainAuditLogs: options.retainAuditLogs
        }
      );

    } catch (error) {
      logger.error(`Data deletion execution failed for request ${id}:`, error);
      
      await prisma.dataDeletionRequest.update({
        where: { id },
        data: { status: 'FAILED' }
      });
    }
  }

  /**
   * Record user consent for privacy policies
   */
  async recordConsent(
    userId: string,
    consentType: 'privacy_policy' | 'terms_of_service' | 'marketing' | 'data_retention',
    version: string,
    granted: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update user record
      const updateData: any = {};
      switch (consentType) {
        case 'privacy_policy':
          updateData.privacyPolicyAccepted = granted;
          updateData.privacyPolicyVersion = version;
          break;
        case 'terms_of_service':
          updateData.termsAccepted = granted;
          updateData.termsVersion = version;
          break;
        case 'marketing':
          updateData.marketingConsent = granted;
          break;
        case 'data_retention':
          updateData.dataRetentionConsent = granted;
          break;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      // Log consent event
      await auditLogger.logComplianceEvent(
        granted ? AuditEventType.PRIVACY_POLICY_ACCEPTED : AuditEventType.GDPR_REQUEST,
        userId,
        user.email,
        {
          consentType,
          version,
          granted,
          ipAddress,
          userAgent
        }
      );

    } catch (error) {
      logger.error('Consent recording failed:', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Get user's consent history
   */
  async getConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const complianceLogs = await prisma.complianceLog.findMany({
        where: {
          userId,
          eventType: {
            in: ['CONSENT_GIVEN', 'CONSENT_WITHDRAWN', 'PRIVACY_POLICY_UPDATED']
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      return complianceLogs.map(log => {
        const details = JSON.parse(log.details || '{}');
        return {
          type: details.consentType,
          version: details.version,
          granted: details.granted,
          timestamp: log.timestamp,
          ipAddress: details.ipAddress,
          userAgent: details.userAgent
        };
      });

    } catch (error) {
      logger.error('Failed to get consent history:', error);
      return [];
    }
  }

  /**
   * Apply data retention policies
   */
  async applyDataRetentionPolicies(): Promise<void> {
    try {
      const retentionPeriod = parseInt(process.env.DATA_RETENTION_PERIOD || '2555'); // 7 years default
      const cutoffDate = new Date(Date.now() - retentionPeriod * 24 * 60 * 60 * 1000);

      // Find users with expired data retention
      const expiredUsers = await prisma.user.findMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          dataRetentionConsent: false
        }
      });

      for (const user of expiredUsers) {
        // Create automatic deletion request
        await this.requestDataDeletion(
          user.id,
          'DATA_PURGE',
          {
            deleteType: 'DATA_PURGE',
            retainAuditLogs: true,
            reason: 'Data retention policy expired'
          }
        );

        // Log retention policy application
        await auditLogger.logComplianceEvent(
          AuditEventType.DATA_RETENTION_POLICY,
          user.id,
          user.email,
          {
            reason: 'Data retention period expired',
            cutoffDate: cutoffDate.toISOString()
          }
        );
      }

    } catch (error) {
      logger.error('Data retention policy application failed:', error);
    }
  }

  /**
   * Private helper methods
   */
  private async collectPersonalData(userId: string, anonymize = false): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companies: true
      }
    });

    if (!user) return null;

    const personalData = {
      id: user.id,
      email: anonymize ? anonymizeEmail(user.email) : user.email,
      name: anonymize ? user.name.replace(/./g, '*') : user.name,
      userType: user.userType,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      companies: user.companies.map(company => ({
        id: company.id,
        name: anonymize ? company.name.replace(/./g, '*') : company.name,
        ticker: company.ticker,
        sector: company.sector,
        createdAt: company.createdAt
      })),
      consent: {
        privacyPolicyAccepted: user.privacyPolicyAccepted,
        privacyPolicyVersion: user.privacyPolicyVersion,
        termsAccepted: user.termsAccepted,
        termsVersion: user.termsVersion,
        marketingConsent: user.marketingConsent,
        dataRetentionConsent: user.dataRetentionConsent
      }
    };

    return anonymize ? maskSensitiveData(personalData) : personalData;
  }

  private async collectActivityLog(userId: string, anonymize = false): Promise<any[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1000
    });

    return auditLogs.map(log => {
      const logData = {
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: anonymize ? 'masked' : log.resourceId,
        timestamp: log.createdAt,
        oldValues: log.oldValues,
        newValues: log.newValues
      };

      return anonymize ? maskSensitiveData(logData) : logData;
    });
  }

  private async collectDocumentData(userId: string, anonymize = false): Promise<any[]> {
    const documents = await prisma.document.findMany({
      where: { userId },
      include: {
        company: true
      }
    });

    return documents.map(doc => {
      const docData = {
        id: doc.id,
        fileName: anonymize ? 'document_' + doc.id : doc.fileName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        documentType: doc.documentType,
        uploadedAt: doc.uploadedAt,
        processedAt: doc.processedAt,
        status: doc.status,
        company: {
          name: anonymize ? 'company_' + doc.company.id : doc.company.name,
          ticker: doc.company.ticker,
          sector: doc.company.sector
        }
      };

      return anonymize ? maskSensitiveData(docData) : docData;
    });
  }

  private async collectAnalysisData(userId: string, anonymize = false): Promise<any[]> {
    const analyses = await prisma.analysis.findMany({
      where: { userId },
      include: {
        document: true,
        financialMetrics: true,
        alerts: true
      }
    });

    return analyses.map(analysis => {
      const analysisData = {
        id: analysis.id,
        status: analysis.status,
        startedAt: analysis.startedAt,
        completedAt: analysis.completedAt,
        aiInsights: anonymize ? '[ANONYMIZED]' : analysis.aiInsights,
        document: {
          fileName: anonymize ? 'document_' + analysis.document.id : analysis.document.fileName,
          fileType: analysis.document.fileType
        },
        metrics: analysis.financialMetrics.map(metric => ({
          name: metric.name,
          value: anonymize ? 0 : metric.value,
          unit: metric.unit,
          period: metric.period,
          confidence: metric.confidence
        })),
        alerts: analysis.alerts.map(alert => ({
          severity: alert.severity,
          message: anonymize ? '[ANONYMIZED]' : alert.message,
          createdAt: alert.createdAt
        }))
      };

      return anonymize ? maskSensitiveData(analysisData) : analysisData;
    });
  }

  private async createExportFile(requestId: string, data: any, format: string): Promise<string> {
    const exportDir = path.join(this.tempPath, 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const fileName = `data_export_${requestId}.${format.toLowerCase()}`;
    const filePath = path.join(exportDir, fileName);

    switch (format) {
      case 'JSON':
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        break;
      case 'CSV':
        // Flatten data for CSV format
        const csv = this.convertToCSV(data);
        await fs.writeFile(filePath, csv);
        break;
      case 'XML':
        const xml = this.convertToXML(data);
        await fs.writeFile(filePath, xml);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return filePath;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would need more sophisticated implementation for production
    const flatten = (obj: any, prefix = ''): any => {
      const flattened: any = {};
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, flatten(obj[key], `${prefix}${key}.`));
        } else {
          flattened[`${prefix}${key}`] = obj[key];
        }
      }
      return flattened;
    };

    const flattened = flatten(data);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened).join(',');
    
    return `${headers}\n${values}`;
  }

  private convertToXML(data: any): string {
    // Simple XML conversion - would need more sophisticated implementation for production
    const toXML = (obj: any, rootName = 'export'): string => {
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;
      
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          xml += `  <${key}>\n`;
          value.forEach((item, index) => {
            xml += `    <item_${index}>${JSON.stringify(item)}</item_${index}>\n`;
          });
          xml += `  </${key}>\n`;
        } else {
          xml += `  <${key}>${value}</${key}>\n`;
        }
      }
      
      xml += `</${rootName}>`;
      return xml;
    };

    return toXML(data);
  }

  private async deleteUserAccount(userId: string, options: DataDeletionOptions): Promise<void> {
    // Delete in reverse dependency order
    await prisma.alert.deleteMany({ where: { userId } });
    await prisma.analysisConstraint.deleteMany({
      where: { analysis: { userId } }
    });
    await prisma.financialMetric.deleteMany({
      where: { analysis: { userId } }
    });
    await prisma.analysis.deleteMany({ where: { userId } });
    await prisma.document.deleteMany({ where: { userId } });
    await prisma.constraint.deleteMany({ where: { userId } });
    await prisma.company.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.apiKey.deleteMany({ where: { userId } });
    await prisma.dataExportRequest.deleteMany({ where: { userId } });
    await prisma.dataDeletionRequest.deleteMany({ where: { userId } });

    if (!options.retainAuditLogs) {
      await prisma.auditLog.deleteMany({ where: { userId } });
    }

    // Finally delete user
    await prisma.user.delete({ where: { id: userId } });
  }

  private async purgeUserData(userId: string, options: DataDeletionOptions): Promise<void> {
    // Similar to account deletion but may retain some anonymized data
    await this.deleteUserAccount(userId, options);
  }

  private async deleteUserDocuments(userId: string): Promise<void> {
    const documents = await prisma.document.findMany({
      where: { userId }
    });

    // Delete physical files
    for (const doc of documents) {
      try {
        await fs.unlink(doc.filePath);
      } catch (error) {
        logger.warn(`Failed to delete file ${doc.filePath}:`, error);
      }
    }

    // Delete database records
    await prisma.document.deleteMany({ where: { userId } });
  }

  private async deleteUserAnalyses(userId: string): Promise<void> {
    await prisma.alert.deleteMany({
      where: { analysis: { userId } }
    });
    await prisma.analysisConstraint.deleteMany({
      where: { analysis: { userId } }
    });
    await prisma.financialMetric.deleteMany({
      where: { analysis: { userId } }
    });
    await prisma.analysis.deleteMany({ where: { userId } });
  }

  private async partialDataDeletion(userId: string, options: DataDeletionOptions): Promise<void> {
    // Implement partial deletion based on specific requirements
    // This would be customized based on the specific deletion request
    logger.info(`Partial data deletion for user ${userId} - implementation needed`);
  }
}

// Export singleton instance
export const privacyComplianceService = new PrivacyComplianceService();

// Scheduled task to process deletions and apply retention policies
setInterval(async () => {
  try {
    await privacyComplianceService.processScheduledDeletions();
    await privacyComplianceService.applyDataRetentionPolicies();
  } catch (error) {
    logger.error('Scheduled privacy compliance tasks failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run daily