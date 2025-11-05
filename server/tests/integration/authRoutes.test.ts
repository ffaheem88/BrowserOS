import { describe, it, expect, beforeEach } from 'vitest';
import supertest from 'supertest';
import { app } from '../../src/app.js';
import { createUser } from '../factories/userFactory.js';
import { createSession } from '../factories/sessionFactory.js';
import { generateAccessToken, generateExpiredAccessToken } from '../helpers/jwtHelper.js';
import { resetDatabase } from '../utils/testDb.js';
import type { RegisterData, LoginCredentials } from '@shared/types';

const request = supertest(app);

describe('Authentication API Integration Tests', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should return 201 and user data for valid registration', async () => {
      const registerData: RegisterData = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        displayName: 'New User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(registerData.email.toLowerCase());
      expect(response.body.user.displayName).toBe(registerData.displayName);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();

      // Should not return password
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should return 400 for missing email', async () => {
      const invalidData = {
        password: 'SecurePass123!',
        displayName: 'Test User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const invalidData = {
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing displayName', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidData: RegisterData = {
        email: 'not-an-email',
        password: 'SecurePass123!',
        displayName: 'Test User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for weak password', async () => {
      const invalidData: RegisterData = {
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      const existingUser = await createUser();

      const duplicateData: RegisterData = {
        email: existingUser.email,
        password: 'SecurePass123!',
        displayName: 'Duplicate User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(duplicateData)
        .expect(409);

      expect(response.body.error.message).toMatch(/already.*exists/i);
    });

    it('should trim whitespace from email', async () => {
      const registerData: RegisterData = {
        email: '  test@example.com  ',
        password: 'SecurePass123!',
        displayName: 'Test User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should convert email to lowercase', async () => {
      const registerData: RegisterData = {
        email: 'TEST@EXAMPLE.COM',
        password: 'SecurePass123!',
        displayName: 'Test User',
      };

      const response = await request
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.user.email).toBe('test@example.com');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and tokens for valid credentials', async () => {
      const password = 'ValidPass123!';
      const user = await createUser({ password });

      const loginData: LoginCredentials = {
        email: user.email,
        password,
      };

      const response = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const loginData: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!',
      };

      const response = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error.message).toMatch(/invalid.*credentials/i);
    });

    it('should return 401 for invalid password', async () => {
      const user = await createUser({ password: 'CorrectPass123!' });

      const loginData: LoginCredentials = {
        email: user.email,
        password: 'WrongPass123!',
      };

      const response = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error.message).toMatch(/invalid.*credentials/i);
    });

    it('should return 400 for missing email', async () => {
      const loginData = {
        password: 'SomePass123!',
      };

      const response = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle case-insensitive email login', async () => {
      const password = 'TestPass123!';
      const user = await createUser({
        email: 'test@example.com',
        password,
      });

      const loginData: LoginCredentials = {
        email: 'TEST@EXAMPLE.COM',
        password,
      };

      const response = await request
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 and invalidate session', async () => {
      const user = await createUser();
      const session = await createSession(user.id);
      const accessToken = generateAccessToken(user);

      const response = await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: session.refreshToken })
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should return 401 without access token', async () => {
      const response = await request
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for invalid access token', async () => {
      const response = await request
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken: 'some-token' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 200 even for non-existent refresh token', async () => {
      const user = await createUser();
      const accessToken = generateAccessToken(user);

      const response = await request
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'non-existent-token' })
        .expect(200);

      // Logout should be idempotent
      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 200 and new tokens for valid refresh token', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      const response = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: session.refreshToken })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.refreshToken).not.toBe(session.refreshToken);
    });

    it('should return 401 for expired refresh token', async () => {
      const user = await createUser();
      const expiredSession = await createSession(user.id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const response = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredSession.refreshToken })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return 200 and user data for authenticated request', async () => {
      const user = await createUser();
      const accessToken = generateAccessToken(user);

      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.id).toBe(user.id);
      expect(response.body.user.email).toBe(user.email);
      expect(response.body.user.displayName).toBe(user.displayName);
    });

    it('should return 401 without access token', async () => {
      const response = await request.get('/api/v1/auth/me').expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for invalid access token', async () => {
      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for expired access token', async () => {
      const user = await createUser();
      const expiredToken = generateExpiredAccessToken(user);

      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should not return password hash', async () => {
      const user = await createUser();
      const accessToken = generateAccessToken(user);

      const response = await request
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.passwordHash).toBeUndefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request.get('/api/v1/auth/me');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
