import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { app } from '../../src/app.js';
import { resetDatabase } from '../utils/testDb.js';
import type { RegisterData, LoginCredentials } from '@shared/types';

const request = supertest(app);

/**
 * End-to-End Authentication Tests
 * These tests simulate complete user flows from registration to logout
 */

describe('E2E: Complete Authentication Flows', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Complete Registration Flow', () => {
    it('should allow new user to register and immediately use access token', async () => {
      const userData: RegisterData = {
        email: 'e2e-newuser@example.com',
        password: 'SecurePassword123!',
        displayName: 'E2E Test User',
      };

      // Step 1: Register
      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.user).toBeDefined();
      expect(registerResponse.body.user.email).toBe(userData.email.toLowerCase());
      expect(registerResponse.body.accessToken).toBeDefined();
      expect(registerResponse.body.refreshToken).toBeDefined();

      const { accessToken } = registerResponse.body;

      // Step 2: Immediately verify can use access token
      const meResponse = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.user.email).toBe(userData.email.toLowerCase());
      expect(meResponse.body.user.displayName).toBe(userData.displayName);
    });

    it('should prevent duplicate registration with same email', async () => {
      const userData: RegisterData = {
        email: 'e2e-duplicate@example.com',
        password: 'SecurePassword123!',
        displayName: 'First User',
      };

      // Step 1: Register first time
      await request.post('/api/v1/auth/register').send(userData).expect(201);

      // Step 2: Attempt duplicate registration
      const duplicateResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(duplicateResponse.body.error.message).toMatch(/already.*exists/i);
    });

    it('should validate registration input and provide clear errors', async () => {
      const invalidCases = [
        {
          data: { password: 'Pass123!', displayName: 'User' },
          expectedPattern: /email/i,
        },
        {
          data: { email: 'test@test.com', displayName: 'User' },
          expectedPattern: /password/i,
        },
        {
          data: { email: 'test@test.com', password: 'Pass123!' },
          expectedPattern: /displayName/i,
        },
        {
          data: { email: 'invalid-email', password: 'Pass123!', displayName: 'User' },
          expectedPattern: /email/i,
        },
        {
          data: { email: 'test@test.com', password: 'weak', displayName: 'User' },
          expectedPattern: /password/i,
        },
      ];

      for (const testCase of invalidCases) {
        const response = await request
          .post('/api/v1/auth/register')
          .send(testCase.data)
          .expect(400);

        expect(response.body.error.message).toMatch(testCase.expectedPattern);
      }
    });
  });

  describe('Complete Login Flow', () => {
    it('should allow registered user to login and access protected resources', async () => {
      const userData: RegisterData = {
        email: 'e2e-login@example.com',
        password: 'LoginPassword123!',
        displayName: 'Login Test User',
      };

      // Step 1: Register
      await request.post('/api/v1/auth/register').send(userData).expect(201);

      // Step 2: Login
      const loginData: LoginCredentials = {
        email: userData.email,
        password: userData.password,
      };

      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.accessToken).toBeDefined();
      expect(loginResponse.body.refreshToken).toBeDefined();
      expect(loginResponse.body.user.email).toBe(userData.email.toLowerCase());

      // Step 3: Use access token to access protected endpoint
      const meResponse = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(200);

      expect(meResponse.body.user.email).toBe(userData.email.toLowerCase());
      expect(meResponse.body.user.displayName).toBe(userData.displayName);
    });

    it('should reject login with incorrect password', async () => {
      const userData: RegisterData = {
        email: 'e2e-wrongpass@example.com',
        password: 'CorrectPassword123!',
        displayName: 'Wrong Pass User',
      };

      // Step 1: Register
      await request.post('/api/v1/auth/register').send(userData).expect(201);

      // Step 2: Attempt login with wrong password
      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(loginResponse.body.error.message).toMatch(/invalid.*credentials/i);
    });

    it('should reject login with non-existent email', async () => {
      const response = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123!',
        })
        .expect(401);

      expect(response.body.error.message).toMatch(/invalid.*credentials/i);
    });

    it('should handle case-insensitive email login', async () => {
      const userData: RegisterData = {
        email: 'e2e-CaseTest@Example.COM',
        password: 'CasePassword123!',
        displayName: 'Case Test User',
      };

      // Register with mixed case email
      await request.post('/api/v1/auth/register').send(userData).expect(201);

      // Login with different case
      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({
          email: 'E2E-casetest@example.com',
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.user.email).toBe('e2e-casetest@example.com');
    });
  });

  describe('Complete Token Refresh Flow', () => {
    it('should refresh access token using refresh token', async () => {
      const userData: RegisterData = {
        email: 'e2e-refresh@example.com',
        password: 'RefreshPassword123!',
        displayName: 'Refresh Test User',
      };

      // Step 1: Register
      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { refreshToken: oldRefreshToken } = registerResponse.body;

      // Step 2: Refresh token
      const refreshResponse = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      expect(refreshResponse.body.accessToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).toBeDefined();
      expect(refreshResponse.body.refreshToken).not.toBe(oldRefreshToken); // Token rotation

      // Step 3: Verify new access token works
      const meResponse = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
        .expect(200);

      expect(meResponse.body.user.email).toBe(userData.email.toLowerCase());

      // Step 4: Verify old refresh token is invalidated
      const oldTokenResponse = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      expect(oldTokenResponse.body.error).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token-string' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Complete Logout Flow', () => {
    it('should logout user and invalidate session', async () => {
      const userData: RegisterData = {
        email: 'e2e-logout@example.com',
        password: 'LogoutPassword123!',
        displayName: 'Logout Test User',
      };

      // Step 1: Register
      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken, refreshToken } = registerResponse.body;

      // Step 2: Verify token works before logout
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Step 3: Logout
      await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Step 4: Verify refresh token is invalidated
      const refreshResponse = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(refreshResponse.body.error).toBeDefined();
    });

    it('should allow logout even with invalid refresh token (idempotent)', async () => {
      const userData: RegisterData = {
        email: 'e2e-logout2@example.com',
        password: 'LogoutPassword123!',
        displayName: 'Logout Test User 2',
      };

      // Register
      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken } = registerResponse.body;

      // Logout with fake refresh token should still succeed
      await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'fake-token' })
        .expect(200);
    });
  });

  describe('Complete Multi-Session Flow', () => {
    it('should allow user to have multiple active sessions', async () => {
      const userData: RegisterData = {
        email: 'e2e-multisession@example.com',
        password: 'MultiSession123!',
        displayName: 'Multi Session User',
      };

      // Step 1: Register
      await request.post('/api/v1/auth/register').send(userData).expect(201);

      // Step 2: Login multiple times (simulating different devices)
      const loginData: LoginCredentials = {
        email: userData.email,
        password: userData.password,
      };

      const session1 = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);
      const session2 = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);
      const session3 = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      // Step 3: Verify all sessions have unique tokens
      expect(session1.body.refreshToken).not.toBe(session2.body.refreshToken);
      expect(session2.body.refreshToken).not.toBe(session3.body.refreshToken);
      expect(session1.body.refreshToken).not.toBe(session3.body.refreshToken);

      // Step 4: Verify all sessions work
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${session1.body.accessToken}`)
        .expect(200);
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${session2.body.accessToken}`)
        .expect(200);
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${session3.body.accessToken}`)
        .expect(200);
    });

    it('should allow logging out of specific session without affecting others', async () => {
      const userData: RegisterData = {
        email: 'e2e-multisession2@example.com',
        password: 'MultiSession123!',
        displayName: 'Multi Session User 2',
      };

      // Register
      await request.post('/api/v1/auth/register').send(userData).expect(201);

      // Create two sessions
      const loginData: LoginCredentials = {
        email: userData.email,
        password: userData.password,
      };

      const session1 = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);
      const session2 = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      // Logout session 1
      await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${session1.body.accessToken}`)
        .send({ refreshToken: session1.body.refreshToken })
        .expect(200);

      // Session 1 refresh token should be invalid
      await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: session1.body.refreshToken })
        .expect(401);

      // Session 2 should still work
      await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${session2.body.accessToken}`)
        .expect(200);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should handle typical user journey: register -> login -> use app -> logout -> login again', async () => {
      const userData: RegisterData = {
        email: 'e2e-journey@example.com',
        password: 'JourneyPassword123!',
        displayName: 'Journey User',
      };

      // 1. Register
      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const accessToken1 = registerResponse.body.accessToken;
      const refreshToken1 = registerResponse.body.refreshToken;

      // 2. Use app (access protected resource)
      const meResponse1 = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken1}`)
        .expect(200);
      expect(meResponse1.body.user.email).toBe(userData.email.toLowerCase());

      // 3. Logout
      await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ refreshToken: refreshToken1 })
        .expect(200);

      // 4. Login again
      const loginResponse = await request
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const accessToken2 = loginResponse.body.accessToken;

      // 5. Use app again
      const meResponse2 = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken2}`)
        .expect(200);
      expect(meResponse2.body.user.email).toBe(userData.email.toLowerCase());

      // Tokens should be different
      expect(accessToken2).not.toBe(accessToken1);
    });

    it('should handle token refresh in middle of session', async () => {
      const userData: RegisterData = {
        email: 'e2e-refresh-flow@example.com',
        password: 'RefreshFlow123!',
        displayName: 'Refresh Flow User',
      };

      // Register and get initial tokens
      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken: token1, refreshToken: refresh1 } = registerResponse.body;

      // Use app with first token
      await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${token1}`).expect(200);

      // Refresh token
      const refreshResponse = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refresh1 })
        .expect(200);

      const { accessToken: token2 } = refreshResponse.body;

      // Continue using app with new token
      await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${token2}`).expect(200);

      // Old token should still work (not expired yet)
      await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${token1}`).expect(200);
    });

    it('should handle concurrent requests with same access token', async () => {
      const userData: RegisterData = {
        email: 'e2e-concurrent@example.com',
        password: 'Concurrent123!',
        displayName: 'Concurrent User',
      };

      const registerResponse = await request
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      const { accessToken } = registerResponse.body;

      // Make multiple concurrent requests with same token
      const promises = Array.from({ length: 5 }, () =>
        request.get('/api/v1/auth/me').set('Authorization', `Bearer ${accessToken}`)
      );

      const results = await Promise.all(promises);

      // All requests should succeed
      results.forEach((result) => {
        expect(result.status).toBe(200);
        expect(result.body.user.email).toBe(userData.email.toLowerCase());
      });
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle missing authorization header gracefully', async () => {
      const response = await request.get('/api/v1/auth/me').expect(401);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toMatch(/token|authorization/i);
    });

    it('should handle malformed authorization header', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should handle empty token', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer ')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should provide clear error for missing request body fields', async () => {
      const response = await request.post('/api/v1/auth/login').send({}).expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });
  });
});
