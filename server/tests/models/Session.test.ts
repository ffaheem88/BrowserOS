import { describe, it, expect } from 'vitest';
import { createUser } from '../factories/userFactory';
import {
  createSession,
  createExpiredSession,
  getSessionById,
  getSessionByRefreshToken,
  getSessionsByUserId,
  deleteSession,
  countUserSessions,
} from '../factories/sessionFactory';
import { executeQuery } from '../utils/testDb';

describe('Session Model', () => {
  describe('create', () => {
    it('should create a session with all required fields', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.refreshToken).toBeDefined();
      expect(session.expiresAt).toBeInstanceOf(Date);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should generate UUID for session ID', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      expect(session.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should enforce unique refresh token constraint', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      await expect(
        executeQuery(
          'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
          [user.id, session.refreshToken, new Date(Date.now() + 86400000)]
        )
      ).rejects.toThrow();
    });

    it('should store optional userAgent', async () => {
      const user = await createUser();
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const session = await createSession(user.id, { userAgent });

      expect(session.userAgent).toBe(userAgent);
    });

    it('should store optional ipAddress', async () => {
      const user = await createUser();
      const ipAddress = '192.168.1.100';
      const session = await createSession(user.id, { ipAddress });

      expect(session.ipAddress).toBe(ipAddress);
    });

    it('should set expiresAt in the future', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should enforce foreign key constraint on userId', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';

      await expect(
        executeQuery(
          'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
          [fakeUserId, 'token', new Date(Date.now() + 86400000)]
        )
      ).rejects.toThrow();
    });
  });

  describe('findByRefreshToken', () => {
    it('should return session by refresh token', async () => {
      const user = await createUser();
      const created = await createSession(user.id);
      const found = await getSessionByRefreshToken(created.refreshToken);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.userId).toBe(user.id);
      expect(found!.refreshToken).toBe(created.refreshToken);
    });

    it('should return null for non-existent token', async () => {
      const found = await getSessionByRefreshToken('non-existent-token');
      expect(found).toBeNull();
    });

    it('should find expired sessions', async () => {
      const user = await createUser();
      const expired = await createExpiredSession(user.id);
      const found = await getSessionByRefreshToken(expired.refreshToken);

      expect(found).toBeDefined();
      expect(found!.expiresAt.getTime()).toBeLessThan(Date.now());
    });
  });

  describe('findByUserId', () => {
    it('should return all sessions for a user', async () => {
      const user = await createUser();
      await createSession(user.id);
      await createSession(user.id);
      await createSession(user.id);

      const sessions = await getSessionsByUserId(user.id);
      expect(sessions.length).toBe(3);
      sessions.forEach((session) => {
        expect(session.userId).toBe(user.id);
      });
    });

    it('should return empty array for user with no sessions', async () => {
      const user = await createUser();
      const sessions = await getSessionsByUserId(user.id);

      expect(sessions).toEqual([]);
    });

    it('should order sessions by creation time (newest first)', async () => {
      const user = await createUser();
      const session1 = await createSession(user.id);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session2 = await createSession(user.id);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const session3 = await createSession(user.id);

      const sessions = await getSessionsByUserId(user.id);

      expect(sessions[0].id).toBe(session3.id);
      expect(sessions[1].id).toBe(session2.id);
      expect(sessions[2].id).toBe(session1.id);
    });

    it('should not return other users sessions', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await createSession(user1.id);
      await createSession(user2.id);

      const user1Sessions = await getSessionsByUserId(user1.id);
      expect(user1Sessions.length).toBe(1);
      expect(user1Sessions[0].userId).toBe(user1.id);
    });
  });

  describe('delete', () => {
    it('should delete session by ID', async () => {
      const user = await createUser();
      const session = await createSession(user.id);

      await deleteSession(session.id);

      const deleted = await getSessionById(session.id);
      expect(deleted).toBeNull();
    });

    it('should not affect other sessions', async () => {
      const user = await createUser();
      const session1 = await createSession(user.id);
      const session2 = await createSession(user.id);

      await deleteSession(session1.id);

      const remaining = await getSessionById(session2.id);
      expect(remaining).toBeDefined();
      expect(remaining!.id).toBe(session2.id);
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all sessions for a user', async () => {
      const user = await createUser();
      await createSession(user.id);
      await createSession(user.id);
      await createSession(user.id);

      const beforeCount = await countUserSessions(user.id);
      expect(beforeCount).toBe(3);

      await executeQuery('DELETE FROM sessions WHERE user_id = $1', [user.id]);

      const afterCount = await countUserSessions(user.id);
      expect(afterCount).toBe(0);
    });

    it('should not affect other users sessions', async () => {
      const user1 = await createUser();
      const user2 = await createUser();

      await createSession(user1.id);
      await createSession(user2.id);

      await executeQuery('DELETE FROM sessions WHERE user_id = $1', [user1.id]);

      const user1Sessions = await countUserSessions(user1.id);
      const user2Sessions = await countUserSessions(user2.id);

      expect(user1Sessions).toBe(0);
      expect(user2Sessions).toBe(1);
    });
  });

  describe('deleteExpired', () => {
    it('should delete only expired sessions', async () => {
      const user = await createUser();
      const validSession = await createSession(user.id);
      const expiredSession = await createExpiredSession(user.id);

      await executeQuery('DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP');

      const valid = await getSessionById(validSession.id);
      const expired = await getSessionById(expiredSession.id);

      expect(valid).toBeDefined();
      expect(expired).toBeNull();
    });

    it('should return count of deleted sessions', async () => {
      const user = await createUser();
      await createExpiredSession(user.id);
      await createExpiredSession(user.id);
      await createSession(user.id); // Valid session

      const result = await executeQuery(
        'DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP RETURNING id'
      );

      expect(result.length).toBe(2);
    });

    it('should handle no expired sessions', async () => {
      const user = await createUser();
      await createSession(user.id);

      const result = await executeQuery(
        'DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP RETURNING id'
      );

      expect(result.length).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have index on user_id for fast lookups', async () => {
      const indexes = await executeQuery(
        `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sessions' AND indexname LIKE '%user_id%'
        `
      );

      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have index on refresh_token for fast lookups', async () => {
      const indexes = await executeQuery(
        `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sessions' AND indexname LIKE '%refresh_token%'
        `
      );

      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should have index on expires_at for cleanup queries', async () => {
      const indexes = await executeQuery(
        `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'sessions' AND indexname LIKE '%expires_at%'
        `
      );

      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Cascade Delete', () => {
    it('should delete sessions when user is deleted', async () => {
      const user = await createUser();
      await createSession(user.id);
      await createSession(user.id);

      const sessionsBeforeDelete = await countUserSessions(user.id);
      expect(sessionsBeforeDelete).toBe(2);

      await executeQuery('DELETE FROM users WHERE id = $1', [user.id]);

      const sessionsAfterDelete = await countUserSessions(user.id);
      expect(sessionsAfterDelete).toBe(0);
    });
  });

  describe('Data Validation', () => {
    it('should enforce NOT NULL on user_id', async () => {
      await expect(
        executeQuery(
          'INSERT INTO sessions (refresh_token, expires_at) VALUES ($1, $2)',
          ['token', new Date(Date.now() + 86400000)]
        )
      ).rejects.toThrow();
    });

    it('should enforce NOT NULL on refresh_token', async () => {
      const user = await createUser();

      await expect(
        executeQuery(
          'INSERT INTO sessions (user_id, expires_at) VALUES ($1, $2)',
          [user.id, new Date(Date.now() + 86400000)]
        )
      ).rejects.toThrow();
    });

    it('should enforce NOT NULL on expires_at', async () => {
      const user = await createUser();

      await expect(
        executeQuery(
          'INSERT INTO sessions (user_id, refresh_token) VALUES ($1, $2)',
          [user.id, 'token']
        )
      ).rejects.toThrow();
    });
  });

  describe('Session Expiry Checks', () => {
    it('should identify expired sessions', async () => {
      const user = await createUser();
      const expired = await createExpiredSession(user.id);

      expect(expired.expiresAt.getTime()).toBeLessThan(Date.now());
    });

    it('should identify valid sessions', async () => {
      const user = await createUser();
      const valid = await createSession(user.id);

      expect(valid.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Multiple Sessions Per User', () => {
    it('should allow multiple active sessions for same user', async () => {
      const user = await createUser();
      const session1 = await createSession(user.id);
      const session2 = await createSession(user.id);
      const session3 = await createSession(user.id);

      expect(session1.userId).toBe(user.id);
      expect(session2.userId).toBe(user.id);
      expect(session3.userId).toBe(user.id);
      expect(session1.id).not.toBe(session2.id);
      expect(session2.id).not.toBe(session3.id);
    });

    it('should track different devices via userAgent', async () => {
      const user = await createUser();
      const desktop = await createSession(user.id, {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      });
      const mobile = await createSession(user.id, {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });

      expect(desktop.userAgent).not.toBe(mobile.userAgent);
    });

    it('should track different locations via ipAddress', async () => {
      const user = await createUser();
      const home = await createSession(user.id, { ipAddress: '192.168.1.1' });
      const work = await createSession(user.id, { ipAddress: '10.0.0.1' });

      expect(home.ipAddress).not.toBe(work.ipAddress);
    });
  });
});
