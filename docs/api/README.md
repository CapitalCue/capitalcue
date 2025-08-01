# Financial Constraint Analysis Platform API Documentation

This document provides comprehensive information about the Financial Constraint Analysis Platform REST API.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
- [Webhooks](#webhooks)
- [SDK and Libraries](#sdk-and-libraries)
- [Compliance](#compliance)

## Overview

The Financial Constraint Analysis Platform API is a RESTful API that provides programmatic access to financial document analysis, constraint management, AI-powered insights, and comprehensive compliance features.

### Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.financial-analyzer.com/api`

### API Version

Current API version: `v1.0.0`

### Content Type

All API requests and responses use `application/json` content type unless otherwise specified.

## Authentication

The API uses JWT (JSON Web Token) based authentication with optional multi-factor authentication (MFA).

### Authentication Flow

1. **Register/Login**: Obtain a JWT token
2. **Include Token**: Add token to Authorization header
3. **MFA (if enabled)**: Provide MFA token in `x-mfa-token` header

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
x-mfa-token: <mfa_token>  # Required if MFA is enabled
```

### Example Authentication

```bash
# Login
curl -X POST https://api.financial-analyzer.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'

# Use token in subsequent requests
curl -X GET https://api.financial-analyzer.com/api/user/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Rate Limiting

The API implements rate limiting to ensure fair usage and system stability.

### Limits

- **General API**: 1000 requests per hour per user
- **Authentication**: 10 requests per minute per IP
- **Privacy Requests**: 5 requests per day per user
- **Report Generation**: 10 reports per hour per user

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 3600
}
```

## Error Handling

The API uses standard HTTP status codes and returns detailed error messages.

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `202` - Accepted (for async operations)
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

### Error Response Format

```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - API rate limit exceeded
- `MFA_REQUIRED` - Multi-factor authentication required

## API Endpoints

### Health Check

Check the health and status of the API service.

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400,
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected",
  "services": {
    "document-parser": "healthy",
    "constraint-engine": "healthy",
    "alert-manager": "healthy",
    "ai-analyzer": "healthy"
  }
}
```

### Authentication Endpoints

#### Register User

```http
POST /auth/register
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "userType": "INVESTOR"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "INVESTOR",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "expiresIn": "7d"
}
```

#### Login User

```http
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "mfaToken": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "INVESTOR"
  },
  "expiresIn": "7d"
}
```

### Document Management

#### Upload Document

```http
POST /documents
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: Binary file data
- `companyId`: Company identifier
- `documentType`: Document type (QUARTERLY_REPORT, ANNUAL_REPORT, etc.)

**Response:**
```json
{
  "success": true,
  "document": {
    "id": "doc123",
    "fileName": "Q4_2023_Report.pdf",
    "fileType": "PDF",
    "fileSize": 2048576,
    "documentType": "QUARTERLY_REPORT",
    "status": "UPLOADED",
    "uploadedAt": "2024-01-15T10:30:00Z",
    "companyId": "company123"
  }
}
```

#### List Documents

```http
GET /documents?page=1&limit=20&companyId=company123
```

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc123",
      "fileName": "Q4_2023_Report.pdf",
      "fileType": "PDF",
      "documentType": "QUARTERLY_REPORT",
      "status": "PROCESSED",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "processedAt": "2024-01-15T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Constraint Management

#### Create Constraint

```http
POST /constraints
```

**Request:**
```json
{
  "name": "Debt-to-Equity Ratio",
  "description": "Monitor debt-to-equity ratio threshold",
  "metric": "debt_to_equity_ratio",
  "operator": "GREATER_THAN",
  "value": 2.0,
  "severity": "WARNING",
  "message": "Debt-to-equity ratio exceeds recommended threshold"
}
```

**Response:**
```json
{
  "success": true,
  "constraint": {
    "id": "constraint123",
    "name": "Debt-to-Equity Ratio",
    "description": "Monitor debt-to-equity ratio threshold",
    "metric": "debt_to_equity_ratio",
    "operator": "GREATER_THAN",
    "value": 2.0,
    "severity": "WARNING",
    "message": "Debt-to-equity ratio exceeds recommended threshold",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Analysis Endpoints

#### Start Analysis

```http
POST /analysis
```

**Request:**
```json
{
  "documentId": "doc123",
  "constraintIds": ["constraint123", "constraint456"],
  "aiAnalysis": true
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "analysis123",
    "status": "RUNNING",
    "startedAt": "2024-01-15T10:30:00Z",
    "documentId": "doc123",
    "estimatedCompletion": "2024-01-15T10:35:00Z"
  }
}
```

#### Get Analysis Results

```http
GET /analysis/analysis123
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "analysis123",
    "status": "COMPLETED",
    "startedAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:34:00Z",
    "financialMetrics": [
      {
        "id": "metric123",
        "name": "Debt-to-Equity Ratio",
        "value": 2.5,
        "unit": "ratio",
        "period": "Q4 2023",
        "confidence": 0.95
      }
    ],
    "alerts": [
      {
        "id": "alert123",
        "severity": "WARNING",
        "message": "Debt-to-equity ratio exceeds recommended threshold",
        "actualValue": 2.5,
        "expectedValue": 2.0,
        "createdAt": "2024-01-15T10:34:00Z"
      }
    ]
  }
}
```

### AI Insights

#### Get AI Analysis

```http
GET /analysis/analysis123/ai-insights
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "summary": "The analysis reveals concerning leverage levels with debt-to-equity ratio at 2.5x, above industry benchmark of 2.0x.",
    "keyFindings": [
      "Debt-to-equity ratio of 2.5x exceeds industry benchmark",
      "Interest coverage ratio shows declining trend",
      "Current ratio remains within acceptable range"
    ],
    "riskAssessment": {
      "riskLevel": "MEDIUM",
      "riskFactors": [
        "High leverage ratio",
        "Declining profitability metrics",
        "Industry headwinds"
      ]
    },
    "recommendations": [
      {
        "category": "Capital Structure",
        "recommendation": "Consider debt reduction strategies to improve leverage ratios",
        "priority": "HIGH"
      },
      {
        "category": "Operational Efficiency",
        "recommendation": "Focus on cost optimization to improve margins",
        "priority": "MEDIUM"
      }
    ]
  }
}
```

### Privacy & GDPR Endpoints

#### Request Data Export

```http
POST /privacy/export-request
```

**Request:**
```json
{
  "requestType": "FULL_EXPORT",
  "options": {
    "format": "JSON",
    "anonymize": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "export123",
  "message": "Data export request created. You will be notified when ready.",
  "estimatedCompletion": "24-48 hours"
}
```

#### Request Data Deletion

```http
POST /privacy/deletion-request
```

**Request:**
```json
{
  "deletionType": "ACCOUNT_DELETION",
  "options": {
    "retainAuditLogs": true,
    "reason": "User requested account closure"
  }
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "deletion123",
  "message": "Data deletion request created. Deletion will be processed after 30 days notice period.",
  "warningPeriod": "30 days",
  "canCancel": true
}
```

#### Record Consent

```http
POST /privacy/consent
```

**Request:**
```json
{
  "consentType": "privacy_policy",
  "version": "2.0",
  "granted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Consent recorded successfully",
  "consentType": "privacy_policy",
  "granted": true,
  "recordedAt": "2024-01-15T10:30:00Z"
}
```

### Security Endpoints (Admin Only)

#### Get Security Dashboard

```http
GET /security/dashboard?timeframe=24h
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "timeframe": "24h",
    "summary": {
      "totalEvents": 150,
      "criticalEvents": 2,
      "activeThreats": 1,
      "resolvedThreats": 149,
      "blockedIPs": 3,
      "quarantinedUsers": 0
    },
    "eventsByType": {
      "AUTHENTICATION_FAILURE": 45,
      "RATE_LIMIT_EXCEEDED": 12,
      "SUSPICIOUS_ACTIVITY": 8
    },
    "threatLevel": "LOW"
  }
}
```

### Compliance Endpoints (Admin Only)

#### Get Compliance Dashboard

```http
GET /compliance/dashboard
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "summary": {
      "totalUsers": 1250,
      "activeUsers": 450,
      "dataExportRequests": 12,
      "dataDeletionRequests": 3,
      "overallComplianceScore": 95
    },
    "complianceScores": {
      "gdpr": 96,
      "sox": 94,
      "overall": 95
    },
    "upcomingDeadlines": [
      {
        "id": "gdpr-annual-review",
        "title": "GDPR Annual Privacy Policy Review",
        "dueDate": "2024-02-15",
        "framework": "GDPR",
        "priority": "HIGH"
      }
    ]
  }
}
```

#### Generate GDPR Report

```http
POST /compliance/reports/gdpr
```

**Request:**
```json
{
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31"
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "gdpr_report_123",
  "message": "GDPR compliance report generation started",
  "estimatedCompletion": "5-10 minutes"
}
```

## Webhooks

The platform supports webhooks for real-time notifications of important events.

### Webhook Events

- `analysis.completed` - Analysis processing completed
- `analysis.failed` - Analysis processing failed
- `document.processed` - Document processing completed
- `alert.triggered` - Constraint violation alert triggered
- `security.threat_detected` - Security threat detected
- `privacy.export_ready` - Data export ready for download
- `compliance.deadline_approaching` - Compliance deadline approaching

### Webhook Payload

```json
{
  "event": "analysis.completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "analysisId": "analysis123",
    "documentId": "doc123",
    "status": "COMPLETED",
    "alertsGenerated": 2
  },
  "signature": "sha256=abc123..."
}
```

### Webhook Verification

Webhooks include an HMAC-SHA256 signature in the `X-Webhook-Signature` header for verification.

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
}
```

## SDK and Libraries

### Official SDKs

- **JavaScript/Node.js**: `@financial-analyzer/sdk-js`
- **Python**: `financial-analyzer-sdk`
- **Go**: `github.com/financial-analyzer/sdk-go`

### JavaScript SDK Example

```javascript
import { FinancialAnalyzer } from '@financial-analyzer/sdk-js';

const client = new FinancialAnalyzer({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.financial-analyzer.com/api'
});

// Upload and analyze document
const document = await client.documents.upload({
  file: fileBuffer,
  companyId: 'company123',
  documentType: 'QUARTERLY_REPORT'
});

const analysis = await client.analysis.start({
  documentId: document.id,
  constraintIds: ['constraint123'],
  aiAnalysis: true
});

// Wait for completion and get results
const results = await client.analysis.waitForCompletion(analysis.id);
console.log(results.insights);
```

## Compliance

The API implements comprehensive compliance features:

### GDPR Compliance

- **Article 15**: Right of access via data export endpoints
- **Article 17**: Right to erasure via data deletion endpoints
- **Article 20**: Data portability with multiple export formats
- **Article 32**: Security of processing with encryption and monitoring

### SOX Compliance

- **Section 302**: Management certification with audit trails
- **Section 404**: Internal controls assessment and documentation

### Security Standards

- **Encryption**: AES-256-GCM for data at rest and TLS 1.3 for data in transit
- **Authentication**: JWT with optional MFA
- **Audit Logging**: Comprehensive logging of all API access
- **Rate Limiting**: Protection against abuse and DoS attacks

### Data Retention

- **Audit Logs**: 7 years retention
- **User Data**: Configurable retention periods
- **Automated Cleanup**: Scheduled data purging per retention policies

## Support

For API support, please contact:

- **Email**: api-support@financial-analyzer.com
- **Documentation**: https://docs.financial-analyzer.com
- **Status Page**: https://status.financial-analyzer.com
- **GitHub Issues**: https://github.com/financial-analyzer/api/issues

### API Status

Check real-time API status and performance metrics at our status page.

### Changelog

See our [changelog](./CHANGELOG.md) for recent API updates and breaking changes.

### Migration Guides

When we release new API versions, migration guides will be available in the [migrations](./migrations/) directory.