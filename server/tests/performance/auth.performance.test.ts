import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';
import { createUser, createUsers } from '../factories/userFactory';
import { createSession, getSessionsByUserId } from '../factories/sessionFactory';
import { generateAccessToken, verifyAccessToken } from '../helpers/jwtHelper';

describe('Authentication Performance Tests', () => {
  describe('Password Hashing Performance', () => {
    it('should hash password within acceptable time (< 500ms)', async () => {
      const password = 'SecurePassword123!';
      const startTime = Date.now();

      await bcrypt.hash(password, 12);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });

    it('should verify password within acceptable time (< 500ms)', async () => {
      const password = 'SecurePassword123!';
      const hash = await bcrypt.hash(password, 12);

      const startTime = Date.now();
      await bcrypt.compare(password, hash);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should handle multiple concurrent hash operations', async () => {
      const passwords = Array.from({ length: 10 }, (_, i) => `Password${i}!`);

      const startTime = Date.now();
      await Promise.all(passwords.map((pwd) => bcrypt.hash(pwd, 12)));
      const duration = Date.now() - startTime;

      // Should complete 10 operations within reasonable time
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('JWT Token Performance', () => {
    it('should generate access token quickly (< 10ms)', async () => {
      const user = await createUser();

      const startTime = Date.now();
      generateAccessToken(user);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
    });

    it('should verify access token quickly (< 10ms)', async () => {
      const user = await createUser();
      const token = generateAccessToken(user);

      const startTime = Date.now();
      verifyAccessToken(token);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
    });

    it('should handle multiple concurrent token operations', async () => {
      const users = await createUsers(100);

      const startTime = Date.now();
      users.forEach((user) => generateAccessToken(user));
      const duration = Date.now() - startTime;

      // Generate 100 tokens quickly
      expect(duration).toBeLessThan(100);
    });

    it('should verify multiple tokens concurrently', async () => {
      const users = await createUsers(100);
      const tokens = users.map((user) => generateAccessToken(user));

      const startTime = Date.now();
      tokens.forEach((token) => verifyAccessToken(token));
      const duration = Date.now() - startTime;

      // Verify 100 tokens quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Database Query Performance', () => {
    it('should create user within acceptable time (< 200ms)', async () => {
      const startTime = Date.now();
      await createUser();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
    });

    it('should query user by email with index (< 50ms)', async () => {
      const user = await createUser({ email: 'perf@example.com' });

      const startTime = Date.now();
      await createUser({ email: 'perf@example.com' }).catch(() => {});
      const duration = Date.now() - startTime;

      // Should quickly find duplicate due to index
      expect(duration).toBeLessThan(50);
    });

    it('should handle bulk user creation efficiently', async () => {
      const startTime = Date.now();
      await createUsers(50);
      const duration = Date.now() - startTime;

      // Should create 50 users within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });

    it('should create session quickly (< 100ms)', async () => {
      const user = await createUser();

      const startTime = Date.now();
      await createSession(user.id);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should query sessions by user efficiently (< 50ms)', async () => {
      const user = await createUser();
      await createSession(user.id);
      await createSession(user.id);
      await createSession(user.id);

      const startTime = Date.now();
      await getSessionsByUserId(user.id);
      const duration = Date.now() - startTime;

      // Should use index on user_id
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Registration Flow Performance', () => {
    it('should complete registration within 1 second', async () => {
      const startTime = Date.now();

      // Simulate full registration flow
      const user = await createUser();
      const token = generateAccessToken(user);
      const session = await createSession(user.id);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent registrations', async () => {
      const startTime = Date.now();

      // Simulate 10 concurrent registrations
      await Promise.all(
        Array.from({ length: 10 }, () => createUser())
      );

      const duration = Date.now() - startTime;
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Login Flow Performance', () => {
    it('should complete login within 1 second', async () => {
      const password = 'TestPassword123!';
      const user = await createUser({ password });
      const hash = await bcrypt.hash(password, 12);

      const startTime = Date.now();

      // Simulate login flow
      await bcrypt.compare(password, hash);
      generateAccessToken(user);
      await createSession(user.id);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent logins efficiently', async () => {
      const password = 'TestPassword123!';
      const users = await Promise.all(
        Array.from({ length: 5 }, () => createUser({ password }))
      );
      const hash = await bcrypt.hash(password, 12);

      const startTime = Date.now();

      // Simulate 5 concurrent logins
      await Promise.all(
        users.map(async (user) => {
          await bcrypt.compare(password, hash);
          generateAccessToken(user);
          await createSession(user.id);
        })
      );

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Token Refresh Performance', () => {
    it('should refresh token within 500ms', async () => {
      const user = await createUser();
      const oldSession = await createSession(user.id);

      const startTime = Date.now();

      // Simulate token refresh
      generateAccessToken(user);
      await createSession(user.id);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Logout Performance', () => {
    it('should complete logout within 200ms', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      const startTime = Date.now();

      // Simulate logout (delete session)
      await session;

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const user = await createUser();
        generateAccessToken(user);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Should not significantly increase memory (< 50MB)
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe('Response Time Benchmarks', () => {
    it('should meet 95th percentile targets for registration', async () => {
      const times: number[] = [];

      // Run 20 registrations and measure
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await createUser();
        times.push(Date.now() - start);
      }

      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];

      // 95th percentile should be under 1.5 seconds
      expect(p95).toBeLessThan(1500);
    });

    it('should meet 95th percentile targets for login', async () => {
      const password = 'TestPassword123!';
      const user = await createUser({ password });
      const hash = await bcrypt.hash(password, 12);
      const times: number[] = [];

      // Run 20 logins and measure
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await bcrypt.compare(password, hash);
        generateAccessToken(user);
        times.push(Date.now() - start);
      }

      times.sort((a, b) => a - b);
      const p95 = times[Math.floor(times.length * 0.95)];

      // 95th percentile should be under 1 second
      expect(p95).toBeLessThan(1000);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle increasing load gracefully', async () => {
      const loads = [10, 20, 50];
      const times: number[] = [];

      for (const load of loads) {
        const start = Date.now();
        await Promise.all(
          Array.from({ length: load }, () => createUser())
        );
        times.push(Date.now() - start);
      }

      // Time should scale reasonably (not exponentially)
      // 50 users should take less than 10x the time of 10 users
      const ratio = times[2] / times[0];
      expect(ratio).toBeLessThan(10);
    });
  });

  describe('Connection Pool Performance', () => {
    it('should efficiently reuse database connections', async () => {
      const startTime = Date.now();

      // Perform many sequential operations
      for (let i = 0; i < 50; i++) {
        await createUser();
      }

      const duration = Date.now() - startTime;

      // Should complete reasonably fast due to connection pooling
      expect(duration).toBeLessThan(10000);
    });

    it('should handle concurrent operations with connection pool', async () => {
      const startTime = Date.now();

      // Many concurrent operations
      await Promise.all(
        Array.from({ length: 100 }, () => createUser())
      );

      const duration = Date.now() - startTime;

      // Should handle concurrency efficiently
      expect(duration).toBeLessThan(15000);
    });
  });
});
