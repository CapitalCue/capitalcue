/**
 * Constraints API Tests
 * Tests for constraint creation, management, and validation
 */

import request from 'supertest';
import express from 'express';
import { setupTests, teardownTests, testUsers, testHelpers, testConfig } from './setup';
import constraintRoutes from '../src/routes/constraints';
import { authenticateJWT } from '../src/middleware/advanced-auth';
import { errorHandler } from '../src/middleware/error-handler';

const app = express();
app.use(express.json());
app.use(authenticateJWT);
app.use('/constraints', constraintRoutes);
app.use(errorHandler);

describe('Constraints API', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTests();
  }, testConfig.timeout);

  afterAll(async () => {
    await teardownTests();
  }, testConfig.timeout);

  describe('GET /constraints', () => {
    it('should list user constraints successfully', async () => {
      const response = await request(app)
        .get('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('constraints');
      expect(Array.isArray(response.body.constraints)).toBe(true);
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter constraints by active status', async () => {
      const response = await request(app)
        .get('/constraints?isActive=true')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.constraints)).toBe(true);
      
      // All returned constraints should be active
      response.body.constraints.forEach((constraint: any) => {
        expect(constraint.isActive).toBe(true);
      });
    });

    it('should paginate constraints correctly', async () => {
      const response = await request(app)
        .get('/constraints?page=1&limit=5')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/constraints')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return empty list for user with no constraints', async () => {
      const response = await request(app)
        .get('/constraints')
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.constraints).toHaveLength(0);
    });
  });

  describe('POST /constraints', () => {
    const validConstraint = {
      name: 'Test Constraint',
      description: 'A test constraint for validation',
      metric: 'current_ratio',
      operator: 'LESS_THAN',
      value: 1.0,
      severity: 'CRITICAL',
      message: 'Current ratio is below acceptable threshold'
    };

    it('should create constraint successfully', async () => {
      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(validConstraint)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('constraint');
      expect(response.body.constraint.name).toBe(validConstraint.name);
      expect(response.body.constraint.metric).toBe(validConstraint.metric);
      expect(response.body.constraint.operator).toBe(validConstraint.operator);
      expect(response.body.constraint.value).toBe(validConstraint.value);
      expect(response.body.constraint.severity).toBe(validConstraint.severity);
      expect(response.body.constraint.isActive).toBe(true);
    });

    it('should fail without required fields', async () => {
      const incompleteConstraint = {
        name: 'Incomplete Constraint',
        // Missing metric, operator, value, severity, message
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(incompleteConstraint)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid operator', async () => {
      const invalidConstraint = {
        ...validConstraint,
        operator: 'INVALID_OPERATOR'
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidConstraint)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid severity', async () => {
      const invalidConstraint = {
        ...validConstraint,
        severity: 'INVALID_SEVERITY'
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidConstraint)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid value type', async () => {
      const invalidConstraint = {
        ...validConstraint,
        value: 'not_a_number'
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidConstraint)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with empty name', async () => {
      const invalidConstraint = {
        ...validConstraint,
        name: ''
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidConstraint)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with empty message', async () => {
      const invalidConstraint = {
        ...validConstraint,
        message: ''
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidConstraint)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/constraints')
        .send(validConstraint)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle duplicate constraint names', async () => {
      // First constraint should succeed
      await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send({
          ...validConstraint,
          name: 'Duplicate Name Test'
        })
        .expect(201);

      // Second constraint with same name should still succeed (names can be duplicated)
      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send({
          ...validConstraint,
          name: 'Duplicate Name Test',
          metric: 'debt_to_equity_ratio'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /constraints/:id', () => {
    it('should get constraint details successfully', async () => {
      const response = await request(app)
        .get(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('constraint');
      expect(response.body.constraint.id).toBe(testData.constraint.id);
      expect(response.body.constraint.name).toBe(testData.constraint.name);
    });

    it('should fail with non-existent constraint ID', async () => {
      const response = await request(app)
        .get('/constraints/non-existent-id')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail accessing other user\'s constraint', async () => {
      const response = await request(app)
        .get(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/constraints/${testData.constraint.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /constraints/:id', () => {
    const updateData = {
      name: 'Updated Constraint Name',
      description: 'Updated description',
      value: 1.5,
      severity: 'WARNING',
      message: 'Updated message'
    };

    it('should update constraint successfully', async () => {
      const response = await request(app)
        .put(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('constraint');
      expect(response.body.constraint.name).toBe(updateData.name);
      expect(response.body.constraint.description).toBe(updateData.description);
      expect(response.body.constraint.value).toBe(updateData.value);
      expect(response.body.constraint.severity).toBe(updateData.severity);
      expect(response.body.constraint.message).toBe(updateData.message);
    });

    it('should fail with non-existent constraint ID', async () => {
      const response = await request(app)
        .put('/constraints/non-existent-id')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail updating other user\'s constraint', async () => {
      const response = await request(app)
        .put(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid update data', async () => {
      const invalidUpdate = {
        value: 'not_a_number',
        severity: 'INVALID_SEVERITY'
      };

      const response = await request(app)
        .put(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/constraints/${testData.constraint.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not allow updating immutable fields', async () => {
      const invalidUpdate = {
        metric: 'different_metric',
        operator: 'GREATER_THAN'
      };

      const response = await request(app)
        .put(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(invalidUpdate)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /constraints/:id', () => {
    it('should delete constraint successfully', async () => {
      // First create a constraint to delete
      const createResponse = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send({
          name: 'Constraint to Delete',
          description: 'This will be deleted',
          metric: 'profit_margin',
          operator: 'LESS_THAN',
          value: 0.1,
          severity: 'WARNING',
          message: 'Low profit margin'
        });

      const constraintId = createResponse.body.constraint.id;

      const response = await request(app)
        .delete(`/constraints/${constraintId}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify constraint is deleted
      await request(app)
        .get(`/constraints/${constraintId}`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);
    });

    it('should fail with non-existent constraint ID', async () => {
      const response = await request(app)
        .delete('/constraints/non-existent-id')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail deleting other user\'s constraint', async () => {
      const response = await request(app)
        .delete(`/constraints/${testData.constraint.id}`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/constraints/${testData.constraint.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /constraints/:id/toggle', () => {
    it('should toggle constraint active status', async () => {
      const initialStatus = testData.constraint.isActive;

      const response = await request(app)
        .post(`/constraints/${testData.constraint.id}/toggle`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.constraint.isActive).toBe(!initialStatus);

      // Toggle back
      const response2 = await request(app)
        .post(`/constraints/${testData.constraint.id}/toggle`)
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response2.body.constraint.isActive).toBe(initialStatus);
    });

    it('should fail with non-existent constraint ID', async () => {
      const response = await request(app)
        .post('/constraints/non-existent-id/toggle')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail toggling other user\'s constraint', async () => {
      const response = await request(app)
        .post(`/constraints/${testData.constraint.id}/toggle`)
        .set(testHelpers.authHeader(testData.users.vc.id))
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post(`/constraints/${testData.constraint.id}/toggle`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /constraints/templates', () => {
    it('should list constraint templates successfully', async () => {
      const response = await request(app)
        .get('/constraints/templates')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('templates');
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should filter templates by user type', async () => {
      const response = await request(app)
        .get('/constraints/templates?userType=INVESTOR')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.templates)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/constraints/templates')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Constraint Validation', () => {
    const validOperators = ['LESS_THAN', 'GREATER_THAN', 'EQUAL', 'LESS_THAN_OR_EQUAL', 'GREATER_THAN_OR_EQUAL', 'NOT_EQUAL'];
    const validSeverities = ['CRITICAL', 'WARNING', 'INFO'];

    validOperators.forEach(operator => {
      it(`should accept ${operator} operator`, async () => {
        const constraint = {
          name: `Test ${operator}`,
          description: 'Test constraint',
          metric: 'test_metric',
          operator,
          value: 1.0,
          severity: 'WARNING',
          message: 'Test message'
        };

        const response = await request(app)
          .post('/constraints')
          .set(testHelpers.authHeader(testData.users.investor.id))
          .send(constraint)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.constraint.operator).toBe(operator);
      });
    });

    validSeverities.forEach(severity => {
      it(`should accept ${severity} severity`, async () => {
        const constraint = {
          name: `Test ${severity}`,
          description: 'Test constraint',
          metric: 'test_metric',
          operator: 'GREATER_THAN',
          value: 1.0,
          severity,
          message: 'Test message'
        };

        const response = await request(app)
          .post('/constraints')
          .set(testHelpers.authHeader(testData.users.investor.id))
          .send(constraint)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.constraint.severity).toBe(severity);
      });
    });

    it('should handle negative values', async () => {
      const constraint = {
        name: 'Test Negative Value',
        description: 'Test constraint with negative value',
        metric: 'test_metric',
        operator: 'GREATER_THAN',
        value: -1.5,
        severity: 'WARNING',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(constraint)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.constraint.value).toBe(-1.5);
    });

    it('should handle zero values', async () => {
      const constraint = {
        name: 'Test Zero Value',
        description: 'Test constraint with zero value',
        metric: 'test_metric',
        operator: 'EQUAL',
        value: 0,
        severity: 'INFO',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(constraint)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.constraint.value).toBe(0);
    });

    it('should handle very large values', async () => {
      const constraint = {
        name: 'Test Large Value',
        description: 'Test constraint with large value',
        metric: 'test_metric',
        operator: 'LESS_THAN',
        value: 999999.99,
        severity: 'CRITICAL',
        message: 'Test message'
      };

      const response = await request(app)
        .post('/constraints')
        .set(testHelpers.authHeader(testData.users.investor.id))
        .send(constraint)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.constraint.value).toBe(999999.99);
    });
  });
});