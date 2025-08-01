/**
 * Documents API Tests
 * Tests for document upload, processing, and management
 */

import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { setupTests, teardownTests, testUsers, testHelpers, testConfig } from './setup';
import documentRoutes from '../src/routes/documents';
import { authenticateJWT } from '../src/middleware/advanced-auth';
import { errorHandler } from '../src/middleware/error-handler';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(authenticateJWT);
app.use('/documents', documentRoutes);
app.use(errorHandler);

describe('Documents API', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTests();
  }, testConfig.timeout);

  afterAll(async () => {
    await teardownTests();
  }, testConfig.timeout);

  describe('GET /documents', () => {
    it('should list user documents successfully', async () => {
      const response = await request(app)
        .get('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('documents');
      expect(Array.isArray(response.body.documents)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter documents by company', async () => {
      const response = await request(app)
        .get(`/documents?companyId=${testData.company.id}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    it('should paginate documents correctly', async () => {
      const response = await request(app)
        .get('/documents?page=1&limit=5')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/documents')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return empty list for user with no documents', async () => {
      const response = await request(app)
        .get('/documents')
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.documents).toHaveLength(0);
    });
  });

  describe('POST /documents', () => {
    it('should upload document successfully', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', Buffer.from('test document content'), 'test-upload.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('document');
      expect(response.body.document.fileName).toBe('test-upload.pdf');
      expect(response.body.document.documentType).toBe('QUARTERLY_REPORT');
      expect(response.body.document.companyId).toBe(testData.company.id);
    });

    it('should fail without file', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'QUARTERLY_REPORT')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without company ID', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', Buffer.from('test document content'), 'test-upload.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without document type', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .attach('file', Buffer.from('test document content'), 'test-upload.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid company ID', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', 'non-existent-company')
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', Buffer.from('test document content'), 'test-upload.pdf')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid document type', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'INVALID_TYPE')
        .attach('file', Buffer.from('test document content'), 'test-upload.pdf')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with file too large', async () => {
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024); // 51MB
      
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', largeBuffer, 'large-file.pdf')
        .expect(413);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with unsupported file type', async () => {
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', Buffer.from('test content'), 'test-file.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/documents')
        .field('companyId', testData.company.id)
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', Buffer.from('test document content'), 'test-upload.pdf')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /documents/:id', () => {
    it('should get document details successfully', async () => {
      const response = await request(app)
        .get(`/documents/${testData.document.id}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('document');
      expect(response.body.document.id).toBe(testData.document.id);
      expect(response.body.document.fileName).toBe(testData.document.fileName);
    });

    it('should fail with non-existent document ID', async () => {
      const response = await request(app)
        .get('/documents/non-existent-id')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail accessing other user\'s document', async () => {
      const response = await request(app)
        .get(`/documents/${testData.document.id}`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/documents/${testData.document.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document successfully', async () => {
      // First create a document to delete
      const uploadResponse = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'OTHER')
        .attach('file', Buffer.from('test document to delete'), 'delete-test.pdf');

      const documentId = uploadResponse.body.document.id;

      const response = await request(app)
        .delete(`/documents/${documentId}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify document is deleted
      await request(app)
        .get(`/documents/${documentId}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);
    });

    it('should fail with non-existent document ID', async () => {
      const response = await request(app)
        .delete('/documents/non-existent-id')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail deleting other user\'s document', async () => {
      const response = await request(app)
        .delete(`/documents/${testData.document.id}`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/documents/${testData.document.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /documents/:id/reprocess', () => {
    it('should reprocess document successfully', async () => {
      const response = await request(app)
        .post(`/documents/${testData.document.id}/reprocess`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should fail with non-existent document ID', async () => {
      const response = await request(app)
        .post('/documents/non-existent-id/reprocess')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail reprocessing other user\'s document', async () => {
      const response = await request(app)
        .post(`/documents/${testData.document.id}/reprocess`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/documents/${testData.document.id}/reprocess`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Document Status Updates', () => {
    it('should handle document processing status updates', async () => {
      // Upload a document
      const uploadResponse = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'QUARTERLY_REPORT')
        .attach('file', Buffer.from('test document content'), 'status-test.pdf');

      const documentId = uploadResponse.body.document.id;

      // Check initial status
      const statusResponse = await request(app)
        .get(`/documents/${documentId}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(statusResponse.body.document.status).toBeDefined();
      expect(['UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED']).toContain(statusResponse.body.document.status);
    });
  });

  describe('File Type Validation', () => {
    const validFileTypes = [
      { name: 'test.pdf', type: 'application/pdf' },
      { name: 'test.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { name: 'test.xls', type: 'application/vnd.ms-excel' },
      { name: 'test.csv', type: 'text/csv' }
    ];

    validFileTypes.forEach(fileType => {
      it(`should accept ${fileType.name} files`, async () => {
        const response = await request(app)
          .post('/documents')
          .set(testHelpers.authHeader(testData.users.investor.id))
          .field('companyId', testData.company.id)
          .field('documentType', 'OTHER')
          .attach('file', Buffer.from('test content'), fileType.name)
          .expect(201);

        expect(response.body.success).toBe(true);
      });
    });

    const invalidFileTypes = [
      'test.txt',
      'test.doc',
      'test.zip',
      'test.exe',
      'test.jpg'
    ];

    invalidFileTypes.forEach(fileName => {
      it(`should reject ${fileName} files`, async () => {
        const response = await request(app)
          .post('/documents')
          .set(testHelpers.authHeader(testData.users.investor.id))
          .field('companyId', testData.company.id)
          .field('documentType', 'OTHER')
          .attach('file', Buffer.from('test content'), fileName)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Document Security', () => {
    it('should sanitize file names', async () => {
      const maliciousFileName = '../../../etc/passwd.pdf';
      
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'OTHER')
        .attach('file', Buffer.from('test content'), maliciousFileName)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.document.fileName).not.toContain('../');
      expect(response.body.document.fileName).not.toContain('/etc/');
    });

    it('should handle file names with special characters', async () => {
      const specialFileName = 'test file with spaces & special chars!@#$.pdf';
      
      const response = await request(app)
        .post('/documents')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .field('companyId', testData.company.id)
        .field('documentType', 'OTHER')
        .attach('file', Buffer.from('test content'), specialFileName)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.document.fileName).toBeDefined();
    });
  });
});