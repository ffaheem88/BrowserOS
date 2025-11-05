import { getDatabase } from '../config/database.js';
import { NotFoundError, DatabaseError, ConflictError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import type { Theme, TaskbarPosition } from '@/shared/types/index.js';

/**
 * Database representation of desktop state
 */
export interface DesktopStateRow {
  id: string;
  user_id: string;
  version: number;
  wallpaper: string;
  theme: Theme;
  taskbar_position: TaskbarPosition;
  taskbar_autohide: boolean;
  pinned_apps: string[];
  settings: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Desktop state data for creation
 */
export interface CreateDesktopStateData {
  userId: string;
  wallpaper?: string;
  theme?: Theme;
  taskbarPosition?: TaskbarPosition;
  taskbarAutohide?: boolean;
  pinnedApps?: string[];
  settings?: Record<string, unknown>;
}

/**
 * Desktop state data for updates
 */
export interface UpdateDesktopStateData {
  wallpaper?: string;
  theme?: Theme;
  taskbarPosition?: TaskbarPosition;
  taskbarAutohide?: boolean;
  pinnedApps?: string[];
  settings?: Record<string, unknown>;
  expectedVersion?: number; // For optimistic locking
}

/**
 * DesktopState Model - Handles all database operations for desktop states
 *
 * Features:
 * - Optimistic locking with version numbers
 * - One desktop state per user
 * - Efficient querying with proper indexes
 */
export class DesktopStateModel {
  /**
   * Create a new desktop state for a user
   * Note: Each user can only have one desktop state (enforced by UNIQUE constraint)
   */
  static async create(data: CreateDesktopStateData): Promise<DesktopStateRow> {
    const db = getDatabase();

    try {
      const result = await db.query<DesktopStateRow>(
        `INSERT INTO desktop_states (
          user_id, wallpaper, theme, taskbar_position,
          taskbar_autohide, pinned_apps, settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          data.userId,
          data.wallpaper || '/assets/wallpapers/default.jpg',
          data.theme || 'light',
          data.taskbarPosition || 'bottom',
          data.taskbarAutohide ?? false,
          data.pinnedApps || [],
          JSON.stringify(data.settings || {}),
        ]
      );

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create desktop state');
      }

      logger.info('Desktop state created', {
        userId: data.userId,
        desktopStateId: result.rows[0].id,
      });

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation - user already has a desktop state
        throw new ConflictError('Desktop state already exists for this user');
      }
      throw new DatabaseError('Failed to create desktop state', error);
    }
  }

  /**
   * Find desktop state by user ID
   */
  static async findByUserId(userId: string): Promise<DesktopStateRow | null> {
    const db = getDatabase();

    try {
      const result = await db.query<DesktopStateRow>(
        `SELECT * FROM desktop_states WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find desktop state', error);
    }
  }

  /**
   * Find desktop state by ID
   */
  static async findById(id: string): Promise<DesktopStateRow | null> {
    const db = getDatabase();

    try {
      const result = await db.query<DesktopStateRow>(
        `SELECT * FROM desktop_states WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find desktop state', error);
    }
  }

  /**
   * Update desktop state with optimistic locking
   *
   * @param userId - User ID to update
   * @param data - Data to update
   * @returns Updated desktop state
   * @throws ConflictError if version mismatch (optimistic lock failure)
   * @throws NotFoundError if desktop state doesn't exist
   */
  static async update(
    userId: string,
    data: UpdateDesktopStateData
  ): Promise<DesktopStateRow> {
    const db = getDatabase();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.wallpaper !== undefined) {
      updates.push(`wallpaper = $${paramIndex++}`);
      values.push(data.wallpaper);
    }

    if (data.theme !== undefined) {
      updates.push(`theme = $${paramIndex++}`);
      values.push(data.theme);
    }

    if (data.taskbarPosition !== undefined) {
      updates.push(`taskbar_position = $${paramIndex++}`);
      values.push(data.taskbarPosition);
    }

    if (data.taskbarAutohide !== undefined) {
      updates.push(`taskbar_autohide = $${paramIndex++}`);
      values.push(data.taskbarAutohide);
    }

    if (data.pinnedApps !== undefined) {
      updates.push(`pinned_apps = $${paramIndex++}`);
      values.push(data.pinnedApps);
    }

    if (data.settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(data.settings));
    }

    if (updates.length === 0) {
      const state = await this.findByUserId(userId);
      if (!state) {
        throw new NotFoundError('Desktop state not found');
      }
      return state;
    }

    // Add WHERE clause parameters
    values.push(userId);
    const userIdParam = paramIndex++;

    // Build query with optional version check (optimistic locking)
    let whereClause = `user_id = $${userIdParam}`;
    if (data.expectedVersion !== undefined) {
      values.push(data.expectedVersion);
      whereClause += ` AND version = $${paramIndex++}`;
    }

    try {
      const result = await db.query<DesktopStateRow>(
        `UPDATE desktop_states
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE ${whereClause}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        // Check if it's a version mismatch or missing record
        const existing = await this.findByUserId(userId);
        if (!existing) {
          throw new NotFoundError('Desktop state not found');
        }
        if (data.expectedVersion !== undefined && existing.version !== data.expectedVersion) {
          throw new ConflictError(
            `Version conflict: expected ${data.expectedVersion}, got ${existing.version}`
          );
        }
        throw new DatabaseError('Failed to update desktop state');
      }

      logger.info('Desktop state updated', {
        userId,
        version: result.rows[0].version,
      });

      return result.rows[0];
    } catch (error) {
      if (error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update desktop state', error);
    }
  }

  /**
   * Get or create desktop state for a user
   * Ensures a desktop state always exists for a user
   */
  static async getOrCreate(userId: string): Promise<DesktopStateRow> {
    const existing = await this.findByUserId(userId);

    if (existing) {
      return existing;
    }

    // Create default desktop state
    return await this.create({
      userId,
      wallpaper: '/assets/wallpapers/default.jpg',
      theme: 'light',
      taskbarPosition: 'bottom',
      taskbarAutohide: false,
      pinnedApps: [],
      settings: {},
    });
  }

  /**
   * Delete desktop state (cascade will delete window states)
   */
  static async delete(userId: string): Promise<void> {
    const db = getDatabase();

    try {
      const result = await db.query(
        `DELETE FROM desktop_states WHERE user_id = $1`,
        [userId]
      );

      if (result.rowCount === 0) {
        throw new NotFoundError('Desktop state not found');
      }

      logger.info('Desktop state deleted', { userId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete desktop state', error);
    }
  }

  /**
   * Get desktop state statistics (for admin/monitoring)
   */
  static async getStatistics(): Promise<{
    totalDesktops: number;
    byTheme: { light: number; dark: number };
    averageWindows: number;
  }> {
    const db = getDatabase();

    try {
      const result = await db.query<{
        total: string;
        light_theme: string;
        dark_theme: string;
        avg_windows: string;
      }>(
        `SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE theme = 'light') as light_theme,
          COUNT(*) FILTER (WHERE theme = 'dark') as dark_theme,
          COALESCE(AVG(window_count), 0) as avg_windows
        FROM desktop_states
        LEFT JOIN (
          SELECT desktop_state_id, COUNT(*) as window_count
          FROM window_states
          GROUP BY desktop_state_id
        ) windows ON desktop_states.id = windows.desktop_state_id`
      );

      const row = result.rows[0];
      return {
        totalDesktops: parseInt(row.total, 10),
        byTheme: {
          light: parseInt(row.light_theme, 10),
          dark: parseInt(row.dark_theme, 10),
        },
        averageWindows: parseFloat(row.avg_windows),
      };
    } catch (error) {
      throw new DatabaseError('Failed to get desktop statistics', error);
    }
  }
}
