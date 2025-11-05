import { getDatabase } from '../config/database.js';
import type { Session, CreateSessionData } from '@/shared/types/index.js';
import { NotFoundError, DatabaseError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

/**
 * Session Model - Handles all database operations for user sessions
 */
export class SessionModel {
  /**
   * Create a new session
   */
  static async create(data: CreateSessionData): Promise<Session> {
    const db = getDatabase();

    try {
      const result = await db.query<Session>(
        `INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, refresh_token, expires_at, user_agent, ip_address, created_at`,
        [data.userId, data.refreshToken, data.expiresAt, data.userAgent, data.ipAddress]
      );

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create session');
      }

      logger.info('Session created', { sessionId: result.rows[0].id, userId: data.userId });
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to create session', error);
    }
  }

  /**
   * Find session by refresh token
   */
  static async findByRefreshToken(token: string): Promise<Session | null> {
    const db = getDatabase();

    try {
      const result = await db.query<Session>(
        `SELECT id, user_id, refresh_token, expires_at, user_agent, ip_address, created_at
         FROM sessions
         WHERE refresh_token = $1 AND expires_at > NOW()`,
        [token]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find session', error);
    }
  }

  /**
   * Find all sessions for a user
   */
  static async findByUserId(userId: string): Promise<Session[]> {
    const db = getDatabase();

    try {
      const result = await db.query<Session>(
        `SELECT id, user_id, refresh_token, expires_at, user_agent, ip_address, created_at
         FROM sessions
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to find user sessions', error);
    }
  }

  /**
   * Delete a session by ID
   */
  static async delete(id: string): Promise<void> {
    const db = getDatabase();

    try {
      const result = await db.query('DELETE FROM sessions WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        throw new NotFoundError('Session not found');
      }

      logger.info('Session deleted', { sessionId: id });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete session', error);
    }
  }

  /**
   * Delete session by refresh token
   */
  static async deleteByRefreshToken(token: string): Promise<void> {
    const db = getDatabase();

    try {
      const result = await db.query('DELETE FROM sessions WHERE refresh_token = $1', [token]);

      if (result.rowCount === 0) {
        throw new NotFoundError('Session not found');
      }

      logger.info('Session deleted by refresh token');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete session', error);
    }
  }

  /**
   * Delete all sessions for a user
   */
  static async deleteByUserId(userId: string): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);

      const count = result.rowCount || 0;
      logger.info('User sessions deleted', { userId, count });

      return count;
    } catch (error) {
      throw new DatabaseError('Failed to delete user sessions', error);
    }
  }

  /**
   * Delete all expired sessions (cleanup task)
   */
  static async deleteExpired(): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query('DELETE FROM sessions WHERE expires_at <= NOW()');

      const count = result.rowCount || 0;
      if (count > 0) {
        logger.info('Expired sessions cleaned up', { count });
      }

      return count;
    } catch (error) {
      throw new DatabaseError('Failed to delete expired sessions', error);
    }
  }

  /**
   * Count active sessions for a user
   */
  static async countByUserId(userId: string): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1 AND expires_at > NOW()',
        [userId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new DatabaseError('Failed to count user sessions', error);
    }
  }

  /**
   * Get session statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    active: number;
    expired: number;
  }> {
    const db = getDatabase();

    try {
      const result = await db.query<{
        total: string;
        active: string;
        expired: string;
      }>(
        `SELECT
           COUNT(*) as total,
           COUNT(*) FILTER (WHERE expires_at > NOW()) as active,
           COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired
         FROM sessions`
      );

      const row = result.rows[0];
      return {
        total: parseInt(row.total, 10),
        active: parseInt(row.active, 10),
        expired: parseInt(row.expired, 10),
      };
    } catch (error) {
      throw new DatabaseError('Failed to get session statistics', error);
    }
  }
}
