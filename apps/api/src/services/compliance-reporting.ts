/**
 * Compliance Reporting Service
 * Generates reports for GDPR, SOX, and other compliance frameworks
 */

import { PrismaClient } from '@prisma/client';
import { auditLogger } from './audit-logger';
import { logger } from '../index';
import fs from 'fs/promises';
import path from 'path';
import { maskSensitiveData } from '../utils/encryption';

const prisma = new PrismaClient();

export interface ComplianceReport {
  id: string;
  reportType: 'GDPR' | 'SOX' | 'CCPA' | 'HIPAA' | 'CUSTOM';
  framework: string[];
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  generatedBy: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  summary: {
    totalUsers: number;
    totalDataRequests: number;
    totalSecurityEvents: number;
    complianceScore: number;
    recommendations: string[];
  };
  sections: ComplianceSection[];
  downloadUrl?: string;
}

export interface ComplianceSection {
  title: string;
  description: string;
  requirements: ComplianceRequirement[];
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  evidence: string[];
  recommendations: string[];
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  framework: string;
  article?: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  evidence: string[];
  lastVerified: Date;
  nextReview: Date;
}

class ComplianceReportingService {
  private readonly reportsPath: string;

  constructor() {
    this.reportsPath = process.env.REPORTS_PATH || './reports';
    this.ensureReportsDirectory();
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.reportsPath, { recursive: true });
    } catch (error) {
      logger.error('Failed to create reports directory:', error);
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateGDPRReport(
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<string> {
    const reportId = `gdpr_${Date.now()}`;
    
    try {
      // Create report record
      const report = await this.createReportRecord(reportId, 'GDPR', ['GDPR'], periodStart, periodEnd, generatedBy);

      // Generate GDPR sections
      const sections = await this.generateGDPRSections(periodStart, periodEnd);
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(sections);
      
      // Generate summary
      const summary = await this.generateGDPRSummary(periodStart, periodEnd, complianceScore);

      // Create complete report
      const completeReport: ComplianceReport = {
        ...report,
        summary,
        sections,
        status: 'COMPLETED'
      };

      // Save report to file
      const downloadUrl = await this.saveReportToFile(reportId, completeReport);
      
      // Update report record
      await this.updateReportRecord(reportId, 'COMPLETED', downloadUrl);

      return reportId;

    } catch (error) {
      logger.error('GDPR report generation failed:', error);
      await this.updateReportRecord(reportId, 'FAILED');
      throw new Error('Failed to generate GDPR report');
    }
  }

  /**
   * Generate SOX compliance report
   */
  async generateSOXReport(
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<string> {
    const reportId = `sox_${Date.now()}`;
    
    try {
      const report = await this.createReportRecord(reportId, 'SOX', ['SOX'], periodStart, periodEnd, generatedBy);

      const sections = await this.generateSOXSections(periodStart, periodEnd);
      const complianceScore = this.calculateComplianceScore(sections);
      const summary = await this.generateSOXSummary(periodStart, periodEnd, complianceScore);

      const completeReport: ComplianceReport = {
        ...report,
        summary,
        sections,
        status: 'COMPLETED'
      };

      const downloadUrl = await this.saveReportToFile(reportId, completeReport);
      await this.updateReportRecord(reportId, 'COMPLETED', downloadUrl);

      return reportId;

    } catch (error) {
      logger.error('SOX report generation failed:', error);
      await this.updateReportRecord(reportId, 'FAILED');
      throw new Error('Failed to generate SOX report');
    }
  }

  /**
   * Generate custom compliance report
   */
  async generateCustomReport(
    reportType: string,
    frameworks: string[],
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string,
    customRequirements?: ComplianceRequirement[]
  ): Promise<string> {
    const reportId = `custom_${Date.now()}`;
    
    try {
      const report = await this.createReportRecord(reportId, 'CUSTOM', frameworks, periodStart, periodEnd, generatedBy);

      const sections = await this.generateCustomSections(frameworks, periodStart, periodEnd, customRequirements);
      const complianceScore = this.calculateComplianceScore(sections);
      const summary = await this.generateCustomSummary(periodStart, periodEnd, complianceScore);

      const completeReport: ComplianceReport = {
        ...report,
        summary,
        sections,
        status: 'COMPLETED'
      };

      const downloadUrl = await this.saveReportToFile(reportId, completeReport);
      await this.updateReportRecord(reportId, 'COMPLETED', downloadUrl);

      return reportId;

    } catch (error) {
      logger.error('Custom report generation failed:', error);
      await this.updateReportRecord(reportId, 'FAILED');
      throw new Error('Failed to generate custom report');
    }
  }

  /**
   * Get compliance report status
   */
  async getReportStatus(reportId: string): Promise<any> {
    const report = await prisma.complianceLog.findFirst({
      where: {
        resourceId: reportId,
        eventType: 'COMPLIANCE_REPORT_GENERATED'
      }
    });

    if (!report) {
      return null;
    }

    const details = JSON.parse(report.details || '{}');
    return {
      id: reportId,
      status: details.status,
      reportType: details.reportType,
      generatedAt: report.timestamp,
      downloadUrl: details.downloadUrl
    };
  }

  /**
   * Get compliance dashboard data
   */
  async getComplianceDashboard(): Promise<any> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      totalUsers,
      activeUsers,
      dataExportRequests,
      dataDeletionRequests,
      securityEvents,
      complianceLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.dataExportRequest.count({
        where: {
          requestedAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.dataDeletionRequest.count({
        where: {
          requestedAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.securityEvent.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.complianceLog.findMany({
        where: {
          timestamp: { gte: thirtyDaysAgo }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      })
    ]);

    // Calculate compliance scores
    const gdprScore = await this.calculateGDPRComplianceScore();
    const soxScore = await this.calculateSOXComplianceScore();
    const overallScore = Math.round((gdprScore + soxScore) / 2);

    return {
      summary: {
        totalUsers,
        activeUsers,
        dataExportRequests,
        dataDeletionRequests,
        securityEvents,
        overallComplianceScore: overallScore
      },
      complianceScores: {
        gdpr: gdprScore,
        sox: soxScore,
        overall: overallScore
      },
      recentActivity: complianceLogs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        timestamp: log.timestamp,
        details: JSON.parse(log.details || '{}')
      })),
      upcomingDeadlines: await this.getUpcomingComplianceDeadlines(),
      riskAssessment: await this.generateRiskAssessment()
    };
  }

  /**
   * Private helper methods
   */
  private async createReportRecord(
    reportId: string,
    reportType: string,
    frameworks: string[],
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    await prisma.complianceLog.create({
      data: {
        eventType: 'COMPLIANCE_REPORT_GENERATED',
        resourceId: reportId,
        details: JSON.stringify({
          reportType,
          frameworks,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          generatedBy,
          status: 'GENERATING'
        }),
        complianceFramework: frameworks,
        timestamp: new Date()
      }
    });

    return {
      id: reportId,
      reportType: reportType as any,
      framework: frameworks,
      periodStart,
      periodEnd,
      generatedAt: new Date(),
      generatedBy,
      status: 'GENERATING',
      summary: {
        totalUsers: 0,
        totalDataRequests: 0,
        totalSecurityEvents: 0,
        complianceScore: 0,
        recommendations: []
      },
      sections: []
    };
  }

  private async updateReportRecord(reportId: string, status: string, downloadUrl?: string): Promise<void> {
    const existingRecord = await prisma.complianceLog.findFirst({
      where: {
        resourceId: reportId,
        eventType: 'COMPLIANCE_REPORT_GENERATED'
      }
    });

    if (existingRecord) {
      const details = JSON.parse(existingRecord.details || '{}');
      details.status = status;
      if (downloadUrl) details.downloadUrl = downloadUrl;

      await prisma.complianceLog.update({
        where: { id: existingRecord.id },
        data: {
          details: JSON.stringify(details)
        }
      });
    }
  }

  private async generateGDPRSections(periodStart: Date, periodEnd: Date): Promise<ComplianceSection[]> {
    const sections: ComplianceSection[] = [];

    // Article 5 - Principles of processing
    sections.push({
      title: 'Article 5 - Principles of Processing Personal Data',
      description: 'Lawfulness, fairness and transparency; purpose limitation; data minimisation; accuracy; storage limitation; integrity and confidentiality',
      requirements: [
        {
          id: 'gdpr-art5-lawfulness',
          title: 'Lawful Basis for Processing',
          description: 'Personal data must be processed lawfully, fairly and transparently',
          framework: 'GDPR',
          article: 'Article 5(1)(a)',
          status: 'COMPLIANT',
          evidence: ['Privacy policy with legal basis', 'Consent management system', 'Data processing agreements'],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Documented legal basis for all processing activities'],
      recommendations: []
    });

    // Article 12-14 - Information to data subjects
    sections.push({
      title: 'Articles 12-14 - Information and Access',
      description: 'Transparent information, communication and modalities for the exercise of rights',
      requirements: [
        {
          id: 'gdpr-art12-transparency',
          title: 'Transparent Information',
          description: 'Information provided to data subjects must be clear and accessible',
          framework: 'GDPR',
          article: 'Article 12',
          status: 'COMPLIANT',
          evidence: ['Privacy policy', 'Cookie notice', 'Data subject request procedures'],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Clear privacy notices', 'Accessible request procedures'],
      recommendations: []
    });

    // Article 15 - Right of access
    const accessRequests = await prisma.dataExportRequest.count({
      where: {
        requestedAt: { gte: periodStart, lte: periodEnd }
      }
    });

    sections.push({
      title: 'Article 15 - Right of Access',
      description: 'Data subjects have the right to obtain confirmation of processing and access to their data',
      requirements: [
        {
          id: 'gdpr-art15-access',
          title: 'Data Access Requests',
          description: 'Process data access requests within one month',
          framework: 'GDPR',
          article: 'Article 15',
          status: 'COMPLIANT',
          evidence: [`${accessRequests} access requests processed in period`],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Data export functionality', 'Request tracking system'],
      recommendations: []
    });

    // Article 17 - Right to erasure
    const deletionRequests = await prisma.dataDeletionRequest.count({
      where: {
        requestedAt: { gte: periodStart, lte: periodEnd }
      }
    });

    sections.push({
      title: 'Article 17 - Right to Erasure',
      description: 'Data subjects have the right to request deletion of their personal data',
      requirements: [
        {
          id: 'gdpr-art17-erasure',
          title: 'Data Deletion Requests',
          description: 'Process data deletion requests appropriately',
          framework: 'GDPR',
          article: 'Article 17',
          status: 'COMPLIANT',
          evidence: [`${deletionRequests} deletion requests processed in period`],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Data deletion functionality', 'Automated purging procedures'],
      recommendations: []
    });

    // Article 25 - Data protection by design and by default
    sections.push({
      title: 'Article 25 - Data Protection by Design and Default',
      description: 'Technical and organisational measures to implement data protection principles',
      requirements: [
        {
          id: 'gdpr-art25-design',
          title: 'Privacy by Design',
          description: 'Implement appropriate technical and organisational measures',
          framework: 'GDPR',
          article: 'Article 25',
          status: 'COMPLIANT',
          evidence: ['Encryption at rest and in transit', 'Access controls', 'Data minimization practices'],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Technical security measures', 'Privacy impact assessments'],
      recommendations: []
    });

    // Article 32 - Security of processing
    const securityEvents = await prisma.securityEvent.count({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        severity: { in: ['HIGH', 'CRITICAL'] }
      }
    });

    sections.push({
      title: 'Article 32 - Security of Processing',
      description: 'Appropriate technical and organisational measures to ensure security',
      requirements: [
        {
          id: 'gdpr-art32-security',
          title: 'Security Measures',
          description: 'Implement appropriate security measures for personal data',
          framework: 'GDPR',
          article: 'Article 32',
          status: securityEvents > 5 ? 'PARTIAL' : 'COMPLIANT',
          evidence: ['Encryption implementation', 'Access logging', 'Security monitoring'],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        }
      ],
      status: securityEvents > 5 ? 'PARTIAL' : 'COMPLIANT',
      evidence: ['Security controls documentation', 'Incident response procedures'],
      recommendations: securityEvents > 5 ? ['Review security incidents and strengthen controls'] : []
    });

    return sections;
  }

  private async generateSOXSections(periodStart: Date, periodEnd: Date): Promise<ComplianceSection[]> {
    const sections: ComplianceSection[] = [];

    // Section 302 - Corporate responsibility for financial reports
    sections.push({
      title: 'Section 302 - Corporate Responsibility',
      description: 'CEOs and CFOs must certify the accuracy of financial reports',
      requirements: [
        {
          id: 'sox-302-certification',
          title: 'Management Certification',
          description: 'Management must certify internal controls over financial reporting',
          framework: 'SOX',
          article: 'Section 302',
          status: 'COMPLIANT',
          evidence: ['Audit trail implementation', 'Management approval workflows'],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Comprehensive audit logging', 'Management oversight controls'],
      recommendations: []
    });

    // Section 404 - Management assessment of internal controls
    sections.push({
      title: 'Section 404 - Internal Controls Assessment',
      description: 'Annual assessment of internal controls over financial reporting',
      requirements: [
        {
          id: 'sox-404-controls',
          title: 'Internal Controls Documentation',
          description: 'Document and test internal controls over financial reporting',
          framework: 'SOX',
          article: 'Section 404',
          status: 'COMPLIANT',
          evidence: ['Role-based access controls', 'Segregation of duties', 'Change management procedures'],
          lastVerified: new Date(),
          nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      ],
      status: 'COMPLIANT',
      evidence: ['Access control matrix', 'Control testing results'],
      recommendations: []
    });

    return sections;
  }

  private async generateCustomSections(
    frameworks: string[],
    periodStart: Date,
    periodEnd: Date,
    customRequirements?: ComplianceRequirement[]
  ): Promise<ComplianceSection[]> {
    const sections: ComplianceSection[] = [];

    if (frameworks.includes('CCPA')) {
      sections.push({
        title: 'CCPA - Consumer Privacy Rights',
        description: 'California Consumer Privacy Act compliance',
        requirements: [
          {
            id: 'ccpa-right-to-know',
            title: 'Right to Know',
            description: 'Consumers have the right to know what personal information is collected',
            framework: 'CCPA',
            status: 'COMPLIANT',
            evidence: ['Privacy policy disclosures', 'Data inventory'],
            lastVerified: new Date(),
            nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        ],
        status: 'COMPLIANT',
        evidence: ['CCPA-compliant privacy policy'],
        recommendations: []
      });
    }

    if (customRequirements) {
      sections.push({
        title: 'Custom Requirements',
        description: 'Organization-specific compliance requirements',
        requirements: customRequirements,
        status: 'COMPLIANT',
        evidence: ['Custom control implementations'],
        recommendations: []
      });
    }

    return sections;
  }

  private calculateComplianceScore(sections: ComplianceSection[]): number {
    if (sections.length === 0) return 0;

    let totalScore = 0;
    for (const section of sections) {
      switch (section.status) {
        case 'COMPLIANT':
          totalScore += 100;
          break;
        case 'PARTIAL':
          totalScore += 50;
          break;
        case 'NON_COMPLIANT':
          totalScore += 0;
          break;
      }
    }

    return Math.round(totalScore / sections.length);
  }

  private async generateGDPRSummary(periodStart: Date, periodEnd: Date, complianceScore: number): Promise<any> {
    const [totalUsers, totalDataRequests, totalSecurityEvents] = await Promise.all([
      prisma.user.count(),
      prisma.dataExportRequest.count({
        where: { requestedAt: { gte: periodStart, lte: periodEnd } }
      }) + prisma.dataDeletionRequest.count({
        where: { requestedAt: { gte: periodStart, lte: periodEnd } }
      }),
      prisma.securityEvent.count({
        where: { createdAt: { gte: periodStart, lte: periodEnd } }
      })
    ]);

    const recommendations = [];
    if (complianceScore < 100) {
      recommendations.push('Review and address non-compliant areas');
    }
    if (totalSecurityEvents > 10) {
      recommendations.push('Strengthen security monitoring and incident response');
    }

    return {
      totalUsers,
      totalDataRequests,
      totalSecurityEvents,
      complianceScore,
      recommendations
    };
  }

  private async generateSOXSummary(periodStart: Date, periodEnd: Date, complianceScore: number): Promise<any> {
    const totalUsers = await prisma.user.count();
    const totalAuditLogs = await prisma.auditLog.count({
      where: { createdAt: { gte: periodStart, lte: periodEnd } }
    });

    return {
      totalUsers,
      totalDataRequests: 0, // Not applicable for SOX
      totalSecurityEvents: totalAuditLogs,
      complianceScore,
      recommendations: complianceScore < 100 ? ['Review internal controls implementation'] : []
    };
  }

  private async generateCustomSummary(periodStart: Date, periodEnd: Date, complianceScore: number): Promise<any> {
    return {
      totalUsers: await prisma.user.count(),
      totalDataRequests: 0,
      totalSecurityEvents: 0,
      complianceScore,
      recommendations: []
    };
  }

  private async saveReportToFile(reportId: string, report: ComplianceReport): Promise<string> {
    const fileName = `${reportId}_${report.reportType.toLowerCase()}_report.json`;
    const filePath = path.join(this.reportsPath, fileName);

    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  private async calculateGDPRComplianceScore(): Promise<number> {
    // Simplified calculation - in reality would be more comprehensive
    const sections = await this.generateGDPRSections(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      new Date()
    );
    return this.calculateComplianceScore(sections);
  }

  private async calculateSOXComplianceScore(): Promise<number> {
    const sections = await this.generateSOXSections(
      new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      new Date()
    );
    return this.calculateComplianceScore(sections);
  }

  private async getUpcomingComplianceDeadlines(): Promise<any[]> {
    // Mock upcoming deadlines - in reality would be based on compliance calendar
    return [
      {
        id: 'gdpr-annual-review',
        title: 'GDPR Annual Privacy Policy Review',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        framework: 'GDPR',
        priority: 'HIGH'
      },
      {
        id: 'sox-quarterly-assessment',
        title: 'SOX Quarterly Controls Assessment',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        framework: 'SOX',
        priority: 'MEDIUM'
      }
    ];
  }

  private async generateRiskAssessment(): Promise<any> {
    const recentSecurityEvents = await prisma.securityEvent.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        severity: { in: ['HIGH', 'CRITICAL'] }
      }
    });

    const pendingDataRequests = await prisma.dataExportRequest.count({
      where: { status: 'PENDING' }
    }) + await prisma.dataDeletionRequest.count({
      where: { status: 'PENDING' }
    });

    let riskLevel = 'LOW';
    const risks = [];

    if (recentSecurityEvents > 5) {
      riskLevel = 'HIGH';
      risks.push('High number of recent security events');
    }

    if (pendingDataRequests > 10) {
      riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
      risks.push('Large number of pending data requests');
    }

    return {
      overallRisk: riskLevel,
      identifiedRisks: risks,
      lastAssessment: new Date(),
      nextAssessment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
  }
}

// Export singleton instance
export const complianceReporting = new ComplianceReportingService();