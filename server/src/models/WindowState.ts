import { getDatabase } from '../config/database.js';
import { NotFoundError, DatabaseError } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import type { WindowDisplayState, Position, Size } from '@/shared/types/index.js';

/**
 * Database representation of window state
 */
export interface WindowStateRow {
  id: string;
  user_id: string;
  desktop_state_id: string;
  app_id: string;
  title: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  state: WindowDisplayState;
  z_index: number;
  focused: boolean;
  resizable: boolean;
  movable: boolean;
  app_state: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Window state data for creation
 */
export interface CreateWindowStateData {
  userId: string;
  desktopStateId: string;
  appId: string;
  title: string;
  position: Position;
  size: Size;
  state?: WindowDisplayState;
  zIndex?: number;
  focused?: boolean;
  resizable?: boolean;
  movable?: boolean;
  appState?: Record<string, unknown>;
}

/**
 * Window state data for updates
 */
export interface UpdateWindowStateData {
  title?: string;
  position?: Position;
  size?: Size;
  state?: WindowDisplayState;
  zIndex?: number;
  focused?: boolean;
  resizable?: boolean;
  movable?: boolean;
  appState?: Record<string, unknown>;
}

/**
 * WindowState Model - Handles all database operations for window states
 *
 * Features:
 * - Efficient bulk operations for loading/saving all windows
 * - Z-index management for window layering
 * - Focus management (only one focused window per user)
 * - Application-specific state persistence
 */
export class WindowStateModel {
  /**
   * Create a new window state
   */
  static async create(data: CreateWindowStateData): Promise<WindowStateRow> {
    const db = getDatabase();

    try {
      const result = await db.query<WindowStateRow>(
        `INSERT INTO window_states (
          user_id, desktop_state_id, app_id, title,
          position_x, position_y, width, height,
          state, z_index, focused, resizable, movable, app_state
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          data.userId,
          data.desktopStateId,
          data.appId,
          data.title,
          data.position.x,
          data.position.y,
          data.size.width,
          data.size.height,
          data.state || 'normal',
          data.zIndex ?? 0,
          data.focused ?? false,
          data.resizable ?? true,
          data.movable ?? true,
          JSON.stringify(data.appState || {}),
        ]
      );

      if (result.rows.length === 0) {
        throw new DatabaseError('Failed to create window state');
      }

      logger.info('Window state created', {
        userId: data.userId,
        windowId: result.rows[0].id,
        appId: data.appId,
      });

      return result.rows[0];
    } catch (error) {
      throw new DatabaseError('Failed to create window state', error);
    }
  }

  /**
   * Find window state by ID
   */
  static async findById(id: string): Promise<WindowStateRow | null> {
    const db = getDatabase();

    try {
      const result = await db.query<WindowStateRow>(
        `SELECT * FROM window_states WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find window state', error);
    }
  }

  /**
   * Find all window states for a user
   * Returns windows ordered by z-index (bottom to top)
   */
  static async findByUserId(userId: string): Promise<WindowStateRow[]> {
    const db = getDatabase();

    try {
      const result = await db.query<WindowStateRow>(
        `SELECT * FROM window_states
         WHERE user_id = $1
         ORDER BY z_index ASC, created_at ASC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to find window states', error);
    }
  }

  /**
   * Find all window states for a desktop
   * Returns windows ordered by z-index (bottom to top)
   */
  static async findByDesktopId(desktopStateId: string): Promise<WindowStateRow[]> {
    const db = getDatabase();

    try {
      const result = await db.query<WindowStateRow>(
        `SELECT * FROM window_states
         WHERE desktop_state_id = $1
         ORDER BY z_index ASC, created_at ASC`,
        [desktopStateId]
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to find window states', error);
    }
  }

  /**
   * Find windows by app ID
   * Useful for finding all instances of an application
   */
  static async findByAppId(userId: string, appId: string): Promise<WindowStateRow[]> {
    const db = getDatabase();

    try {
      const result = await db.query<WindowStateRow>(
        `SELECT * FROM window_states
         WHERE user_id = $1 AND app_id = $2
         ORDER BY z_index ASC, created_at ASC`,
        [userId, appId]
      );

      return result.rows;
    } catch (error) {
      throw new DatabaseError('Failed to find window states by app', error);
    }
  }

  /**
   * Get the currently focused window for a user
   */
  static async getFocusedWindow(userId: string): Promise<WindowStateRow | null> {
    const db = getDatabase();

    try {
      const result = await db.query<WindowStateRow>(
        `SELECT * FROM window_states
         WHERE user_id = $1 AND focused = TRUE
         LIMIT 1`,
        [userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      throw new DatabaseError('Failed to find focused window', error);
    }
  }

  /**
   * Update window state
   */
  static async update(id: string, data: UpdateWindowStateData): Promise<WindowStateRow> {
    const db = getDatabase();

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title);
    }

    if (data.position !== undefined) {
      updates.push(`position_x = $${paramIndex++}, position_y = $${paramIndex++}`);
      values.push(data.position.x, data.position.y);
    }

    if (data.size !== undefined) {
      updates.push(`width = $${paramIndex++}, height = $${paramIndex++}`);
      values.push(data.size.width, data.size.height);
    }

    if (data.state !== undefined) {
      updates.push(`state = $${paramIndex++}`);
      values.push(data.state);
    }

    if (data.zIndex !== undefined) {
      updates.push(`z_index = $${paramIndex++}`);
      values.push(data.zIndex);
    }

    if (data.focused !== undefined) {
      updates.push(`focused = $${paramIndex++}`);
      values.push(data.focused);
    }

    if (data.resizable !== undefined) {
      updates.push(`resizable = $${paramIndex++}`);
      values.push(data.resizable);
    }

    if (data.movable !== undefined) {
      updates.push(`movable = $${paramIndex++}`);
      values.push(data.movable);
    }

    if (data.appState !== undefined) {
      updates.push(`app_state = $${paramIndex++}`);
      values.push(JSON.stringify(data.appState));
    }

    if (updates.length === 0) {
      const state = await this.findById(id);
      if (!state) {
        throw new NotFoundError('Window state not found');
      }
      return state;
    }

    values.push(id);

    try {
      const result = await db.query<WindowStateRow>(
        `UPDATE window_states
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Window state not found');
      }

      logger.info('Window state updated', { windowId: id });

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to update window state', error);
    }
  }

  /**
   * Bulk update window states (efficient for updating multiple windows at once)
   * Used when saving entire desktop state
   */
  static async bulkUpdate(
    userId: string,
    windows: Array<{ id: string } & UpdateWindowStateData>
  ): Promise<void> {
    const db = getDatabase();

    try {
      await db.transaction(async (client) => {
        for (const window of windows) {
          const { id, ...data } = window;

          // Build update query for each window
          const updates: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            values.push(data.title);
          }

          if (data.position !== undefined) {
            updates.push(`position_x = $${paramIndex++}, position_y = $${paramIndex++}`);
            values.push(data.position.x, data.position.y);
          }

          if (data.size !== undefined) {
            updates.push(`width = $${paramIndex++}, height = $${paramIndex++}`);
            values.push(data.size.width, data.size.height);
          }

          if (data.state !== undefined) {
            updates.push(`state = $${paramIndex++}`);
            values.push(data.state);
          }

          if (data.zIndex !== undefined) {
            updates.push(`z_index = $${paramIndex++}`);
            values.push(data.zIndex);
          }

          if (data.focused !== undefined) {
            updates.push(`focused = $${paramIndex++}`);
            values.push(data.focused);
          }

          if (data.appState !== undefined) {
            updates.push(`app_state = $${paramIndex++}`);
            values.push(JSON.stringify(data.appState));
          }

          if (updates.length > 0) {
            values.push(id, userId);
            await client.query(
              `UPDATE window_states
               SET ${updates.join(', ')}, updated_at = NOW()
               WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
              values
            );
          }
        }
      });

      logger.info('Bulk window update completed', {
        userId,
        windowCount: windows.length,
      });
    } catch (error) {
      throw new DatabaseError('Failed to bulk update window states', error);
    }
  }

  /**
   * Delete window state
   */
  static async delete(id: string): Promise<void> {
    const db = getDatabase();

    try {
      const result = await db.query(`DELETE FROM window_states WHERE id = $1`, [id]);

      if (result.rowCount === 0) {
        throw new NotFoundError('Window state not found');
      }

      logger.info('Window state deleted', { windowId: id });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to delete window state', error);
    }
  }

  /**
   * Delete all windows for a user (useful for desktop reset)
   */
  static async deleteByUserId(userId: string): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query(`DELETE FROM window_states WHERE user_id = $1`, [userId]);

      const count = result.rowCount || 0;
      logger.info('User windows deleted', { userId, count });

      return count;
    } catch (error) {
      throw new DatabaseError('Failed to delete user windows', error);
    }
  }

  /**
   * Delete all windows for a desktop
   */
  static async deleteByDesktopId(desktopStateId: string): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query(
        `DELETE FROM window_states WHERE desktop_state_id = $1`,
        [desktopStateId]
      );

      const count = result.rowCount || 0;
      logger.info('Desktop windows deleted', { desktopStateId, count });

      return count;
    } catch (error) {
      throw new DatabaseError('Failed to delete desktop windows', error);
    }
  }

  /**
   * Get the maximum z-index for a user (useful for bringing window to front)
   */
  static async getMaxZIndex(userId: string): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query<{ max_z: number | null }>(
        `SELECT MAX(z_index) as max_z FROM window_states WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0]?.max_z ?? 0;
    } catch (error) {
      throw new DatabaseError('Failed to get max z-index', error);
    }
  }

  /**
   * Bring window to front (set highest z-index)
   */
  static async bringToFront(id: string): Promise<WindowStateRow> {
    const db = getDatabase();

    try {
      const window = await this.findById(id);
      if (!window) {
        throw new NotFoundError('Window state not found');
      }

      const maxZ = await this.getMaxZIndex(window.user_id);
      const newZ = maxZ + 1;

      return await this.update(id, { zIndex: newZ, focused: true });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to bring window to front', error);
    }
  }

  /**
   * Count windows for a user
   */
  static async countByUserId(userId: string): Promise<number> {
    const db = getDatabase();

    try {
      const result = await db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM window_states WHERE user_id = $1`,
        [userId]
      );

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      throw new DatabaseError('Failed to count window states', error);
    }
  }
}
