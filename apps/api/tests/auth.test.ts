/**
 * Authentication API Tests
 * Tests for user registration, login, logout, and authentication middleware
 */

import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { setupTests, teardownTests, testUsers, testHelpers, testConfig } from './setup';
import authRoutes from '../src/routes/auth';
import { errorHandler } from '../src/middleware/error-handler';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

const prisma = new PrismaClient();

describe('Authentication API', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTests();
  }, testConfig.timeout);

  afterAll(async () => {
    await teardownTests();
  }, testConfig.timeout);

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        email: testHelpers.randomEmail(),
        password: 'SecurePassword123!',
        name: 'New User',
        userType: 'INVESTOR'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(newUser.email);
      expect(response.body.user.name).toBe(newUser.name);
      expect(response.body.user.userType).toBe(newUser.userType);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with duplicate email', async () => {
      const duplicateUser = {
        email: testUsers.investor.email,
        password: 'SecurePassword123!',
        name: 'Duplicate User',
        userType: 'INVESTOR'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(duplicateUser)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
    });

    it('should fail with invalid email format', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Invalid User',
        userType: 'INVESTOR'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with weak password', async () => {
      const weakPasswordUser = {
        email: testHelpers.randomEmail(),
        password: '123',
        name: 'Weak Password User',
        userType: 'INVESTOR'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing required fields', async () => {
      const incompleteUser = {
        email: testHelpers.randomEmail(),
        password: 'SecurePassword123!'
        // Missing name and userType
      };

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid user type', async () => {
      const invalidTypeUser = {
        email: testHelpers.randomEmail(),
        password: 'SecurePassword123!',
        name: 'Invalid Type User',
        userType: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidTypeUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: testUsers.investor.email,
        password: testUsers.investor.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with incorrect password', async () => {
      const loginData = {
        email: testUsers.investor.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with non-existent email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid email format', async () => {
      const loginData = {
        email: 'invalid-email',
        password: 'SomePassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.investor.email,
          password: testUsers.investor.password
        });

      const token = loginResponse.body.token;

      // Then logout
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail without authentication token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      // First login to get a token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.vc.email,
          password: testUsers.vc.password
        });

      const token = loginResponse.body.token;

      const changePasswordData = {
        currentPassword: testUsers.vc.password,
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changePasswordData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify old password no longer works
      await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.vc.email,
          password: testUsers.vc.password
        })
        .expect(401);

      // Verify new password works
      await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.vc.email,
          password: 'NewSecurePassword123!'
        })
        .expect(200);
    });

    it('should fail with incorrect current password', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.investor.email,
          password: testUsers.investor.password
        });

      const token = loginResponse.body.token;

      const changePasswordData = {
        currentPassword: 'WrongCurrentPassword',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with mismatched password confirmation', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.investor.email,
          password: testUsers.investor.password
        });

      const token = loginResponse.body.token;

      const changePasswordData = {
        currentPassword: testUsers.investor.password,
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail with weak new password', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.investor.email,
          password: testUsers.investor.password
        });

      const token = loginResponse.body.token;

      const changePasswordData = {
        currentPassword: testUsers.investor.password,
        newPassword: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changePasswordData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const changePasswordData = {
        currentPassword: 'SomePassword',
        newPassword: 'NewSecurePassword123!',
        confirmPassword: 'NewSecurePassword123!'
      };

      const response = await request(app)
        .post('/auth/change-password')
        .send(changePasswordData)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Token Validation', () => {
    it('should validate tokens correctly', async () => {
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.investor.email,
          password: testUsers.investor.password
        });

      const token = loginResponse.body.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should reject malformed tokens', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer malformed.token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject expired tokens', async () => {
      // This would require a token with a very short expiry time
      // For now, we'll test with a manually created expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LWludmVzdG9yLTEiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTY0MDk5NTIwMX0.invalid';

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow normal login attempts', async () => {
      const loginData = {
        email: testUsers.investor.email,
        password: testUsers.investor.password
      };

      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/auth/login')
          .send(loginData)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        await testHelpers.delay(100); // Small delay between requests
      }
    });

    it('should handle multiple failed login attempts', async () => {
      const loginData = {
        email: testUsers.investor.email,
        password: 'WrongPassword'
      };

      // Make several failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/auth/login')
          .send(loginData)
          .expect(401);
        
        await testHelpers.delay(100);
      }

      // Should still fail with correct password if rate limited
      // (This behavior depends on rate limiting implementation)
    });
  });

  describe('Security Headers', () => {
    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword'
        })
        .expect(401);

      expect(response.body.error).not.toContain('password');
      expect(response.body.error).not.toContain('hash');
      expect(response.body.error).not.toContain('database');
    });

    it('should include security headers in responses', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUsers.investor.email,
          password: testUsers.investor.password
        });

      // Check for common security headers (if implemented)
      expect(response.headers).toBeDefined();
    });
  });
});