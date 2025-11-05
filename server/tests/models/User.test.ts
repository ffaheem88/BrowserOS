import { describe, it, expect } from 'vitest';
import { createUser, getUserById, getUserByEmail } from '../factories/userFactory';
import { executeQuery } from '../utils/testDb';
import type { User, CreateUserData } from '@shared/types';

describe('User Model', () => {
  describe('create', () => {
    it('should create a user with all required fields', async () => {
      const userData: CreateUserData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        displayName: 'Test User',
      };

      const user = await createUser(userData);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.displayName).toBe(userData.displayName);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate UUID for user ID', async () => {
      const user = await createUser();

      expect(user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should hash the password', async () => {
      const password = 'PlainTextPassword123!';
      const user = await createUser({ password });

      const result = await executeQuery<{ password_hash: string }>(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      expect(result[0].password_hash).toBeDefined();
      expect(result[0].password_hash).not.toBe(password);
      expect(result[0].password_hash.startsWith('$2b$')).toBe(true);
    });

    it('should enforce unique email constraint', async () => {
      const email = 'unique@example.com';
      await createUser({ email });

      // Attempting to create another user with same email should fail
      await expect(
        executeQuery(
          'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3)',
          [email, 'hash', 'Another User']
        )
      ).rejects.toThrow();
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const before = new Date();
      const user = await createUser();
      const after = new Date();

      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should allow optional avatarUrl', async () => {
      const user = await createUser();
      expect(user.avatarUrl).toBeUndefined();

      // If avatarUrl is provided
      const userWithAvatar = await executeQuery<User>(
        `
        INSERT INTO users (email, password_hash, display_name, avatar_url)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, display_name as "displayName", avatar_url as "avatarUrl",
                  created_at as "createdAt", updated_at as "updatedAt"
        `,
        ['avatar@example.com', 'hash', 'User', 'https://example.com/avatar.jpg']
      );

      expect(userWithAvatar[0].avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should initialize lastLogin as null', async () => {
      const user = await createUser();
      expect(user.lastLogin).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return user by ID', async () => {
      const created = await createUser();
      const found = await getUserById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.email).toBe(created.email);
      expect(found!.displayName).toBe(created.displayName);
    });

    it('should return null for non-existent ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const found = await getUserById(fakeId);

      expect(found).toBeNull();
    });

    it('should not return password hash', async () => {
      const user = await createUser();
      const found = await getUserById(user.id);

      expect(found).not.toHaveProperty('password');
      expect(found).not.toHaveProperty('passwordHash');
      expect(found).not.toHaveProperty('password_hash');
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const email = 'findme@example.com';
      const created = await createUser({ email });
      const found = await getUserByEmail(email);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.email).toBe(email);
    });

    it('should return null for non-existent email', async () => {
      const found = await getUserByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    it('should be case-insensitive', async () => {
      const email = 'test@example.com';
      await createUser({ email });

      const foundUpper = await getUserByEmail('TEST@EXAMPLE.COM');
      expect(foundUpper).toBeDefined();
      expect(foundUpper!.email).toBe(email);
    });

    it('should handle email with special characters', async () => {
      const email = 'user+tag@example.co.uk';
      await createUser({ email });

      const found = await getUserByEmail(email);
      expect(found).toBeDefined();
      expect(found!.email).toBe(email);
    });
  });

  describe('update', () => {
    it('should update user displayName', async () => {
      const user = await createUser();
      const newDisplayName = 'Updated Name';

      await executeQuery(
        'UPDATE users SET display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newDisplayName, user.id]
      );

      const updated = await getUserById(user.id);
      expect(updated!.displayName).toBe(newDisplayName);
    });

    it('should update user avatarUrl', async () => {
      const user = await createUser();
      const avatarUrl = 'https://example.com/new-avatar.jpg';

      await executeQuery(
        'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [avatarUrl, user.id]
      );

      const updated = await getUserById(user.id);
      expect(updated!.avatarUrl).toBe(avatarUrl);
    });

    it('should update updatedAt timestamp', async () => {
      const user = await createUser();
      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await executeQuery(
        'UPDATE users SET display_name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['New Name', user.id]
      );

      const updated = await getUserById(user.id);
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should not allow updating to duplicate email', async () => {
      const user1 = await createUser({ email: 'user1@example.com' });
      const user2 = await createUser({ email: 'user2@example.com' });

      await expect(
        executeQuery('UPDATE users SET email = $1 WHERE id = $2', [
          user1.email,
          user2.id,
        ])
      ).rejects.toThrow();
    });
  });

  describe('updateLastLogin', () => {
    it('should update lastLogin timestamp', async () => {
      const user = await createUser();
      expect(user.lastLogin).toBeUndefined();

      await executeQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      const updated = await getUserById(user.id);
      expect(updated!.lastLogin).toBeDefined();
      expect(updated!.lastLogin).toBeInstanceOf(Date);
    });

    it('should update lastLogin on subsequent logins', async () => {
      const user = await createUser();

      await executeQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      const firstLogin = await getUserById(user.id);

      // Wait to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await executeQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
      const secondLogin = await getUserById(user.id);

      expect(secondLogin!.lastLogin!.getTime()).toBeGreaterThan(
        firstLogin!.lastLogin!.getTime()
      );
    });
  });

  describe('delete', () => {
    it('should delete user by ID', async () => {
      const user = await createUser();

      await executeQuery('DELETE FROM users WHERE id = $1', [user.id]);

      const deleted = await getUserById(user.id);
      expect(deleted).toBeNull();
    });

    it('should cascade delete user sessions', async () => {
      const user = await createUser();

      await executeQuery(
        'INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
        [user.id, 'token', new Date(Date.now() + 86400000)]
      );

      const sessions = await executeQuery(
        'SELECT * FROM sessions WHERE user_id = $1',
        [user.id]
      );
      expect(sessions.length).toBe(1);

      await executeQuery('DELETE FROM users WHERE id = $1', [user.id]);

      const sessionsAfter = await executeQuery(
        'SELECT * FROM sessions WHERE user_id = $1',
        [user.id]
      );
      expect(sessionsAfter.length).toBe(0);
    });
  });

  describe('Indexes', () => {
    it('should have index on email for fast lookups', async () => {
      const indexes = await executeQuery(
        `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'users' AND indexname LIKE '%email%'
        `
      );

      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should enforce NOT NULL on email', async () => {
      await expect(
        executeQuery(
          'INSERT INTO users (password_hash, display_name) VALUES ($1, $2)',
          ['hash', 'User']
        )
      ).rejects.toThrow();
    });

    it('should enforce NOT NULL on password_hash', async () => {
      await expect(
        executeQuery(
          'INSERT INTO users (email, display_name) VALUES ($1, $2)',
          ['test@example.com', 'User']
        )
      ).rejects.toThrow();
    });

    it('should enforce NOT NULL on display_name', async () => {
      await expect(
        executeQuery(
          'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
          ['test@example.com', 'hash']
        )
      ).rejects.toThrow();
    });
  });
});
