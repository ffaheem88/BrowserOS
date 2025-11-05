import { getDatabase } from '../config/database.js';
import type { User, CreateUserData } from '@/shared/types/index.js';
import { NotFoundError, DuplicateRecordError, DatabaseError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

/**
 * User Model - Handles all database operations for users
 */
export class UserModel {
  /**
   * Create a new user
   */
  static async create(data: CreateUserData): Promise<User> {
    const db = getDatabase();

    try {
      const result = await db.query<User>(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, avatar_url, created_at, updated_at, last_login`,
        [data.email.toLowerCase(), data.password, data.displayName]
      );

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create user');
      }

      logger.info('User created', { userId: result.rows[0].id, email: data.email });
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new DuplicateRecordError('User with this email already exists');
      }
      throw new DatabaseError('Failed to create user', error);
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    const db = getDatabase();

    try {
      const result = await db.query<User>(
        `SELECT id, email, display_name, avatar_url, created_at, updated_at, last_login
         FROM users
         WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user', error);
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const db = getDatabase();

    try {
      const result = await db.query<User>(
        `SELECT id, email, display_name, avatar_url, created_at, updated_at, last_login
         FROM users
         WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error);
    }
  }

  /**
   * Find user by email with password hash (for authentication)
   */
  static async findByEmailWithPassword(
    email: string
  ): Promise<(User & { password_hash: string }) | null> {
    const db = getDatabase();

    try {
      const result = await db.query<User & { password_hash: string }>(
        `SELECT id, email, password_hash, display_name, avatar_url, created_at, updated_at, last_login
         FROM users
         WHERE email = $1 AND deleted_at IS NULL`,
        [email.toLowerCase()]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find user by email', error);
    }
  }

  /**
   * Update user information
   */
  static async update(
    id: string,
    data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    const db = getDatabase();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.displayName !== undefined) {
      updates.push('display_name = $' + paramIndex++);
      values.push(data.displayName);
    }

    if (data.avatarUrl !== undefined) {
      updates.push('avatar_url = $' + paramIndex++);
      values.push(data.avatarUrl);
    }

    if (updates.length === 0) {
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }
      return user;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    try {
      const result = await db.query<User>(
        'UPDATE users SET ' +
          updates.join(', ') +
          ' WHERE id = $' +
          paramIndex +
          ' AND deleted_at IS NULL RETURNING id, email, display_name, avatar_url, created_at, updated_at, last_login',
        values
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      logger.info('User updated', { userId: id });
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to update user', error);
    }
  }

  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    const db = getDatabase();

    try {
      await db.query(
        `UPDATE users SET last_login = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      logger.debug('User last login updated', { userId: id });
    } catch (error) {
      throw new DatabaseError('Failed to update last login', error);
    }
  }

  /**
   * Soft delete a user
   */
  static async delete(id: string): Promise<void> {
    const db = getDatabase();

    try {
      const result = await db.query(
        `UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
        [id]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('User not found');
      }

      logger.info('User soft deleted', { userId: id });
    } catch (error) {
      throw new DatabaseError('Failed to delete user', error);
    }
  }
}
