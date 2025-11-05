import { DesktopStateModel, CreateDesktopStateData, UpdateDesktopStateData } from '../models/DesktopState.js';
import { WindowStateModel, CreateWindowStateData, UpdateWindowStateData } from '../models/WindowState.js';
import { getRedisClient, CacheKeys, CacheTTL } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import type {
  DesktopState,
  WindowState,
  PersistedDesktopState,
  Theme,
  TaskbarPosition,
  WindowDisplayState,
} from '@/shared/types/index.js';

/**
 * Desktop Service - Business logic for desktop and window state management
 *
 * Features:
 * - Redis caching for sub-200ms response times
 * - Optimistic locking for conflict resolution
 * - Efficient bulk operations
 * - Cache invalidation on updates
 * - Graceful degradation when Redis unavailable
 */
export class DesktopService {
  private redis = getRedisClient();

  /**
   * Get complete desktop state for a user (with caching)
   * Target: <200ms response time
   */
  async getDesktopState(userId: string): Promise<PersistedDesktopState> {
    const startTime = Date.now();

    try {
      // Try cache first
      const cacheKey = CacheKeys.desktopState(userId);
      const cached = await this.redis.get<PersistedDesktopState>(cacheKey);

      if (cached) {
        const duration = Date.now() - startTime;
        logger.debug('Desktop state cache hit', { userId, duration });
        return cached;
      }

      // Cache miss - load from database
      logger.debug('Desktop state cache miss', { userId });

      // Get or create desktop state
      const desktopState = await DesktopStateModel.getOrCreate(userId);

      // Load all windows
      const windowRows = await WindowStateModel.findByDesktopId(desktopState.id);

      // Transform to API format
      const result: PersistedDesktopState = {
        userId,
        version: desktopState.version,
        lastSaved: desktopState.updated_at,
        desktop: {
          wallpaper: desktopState.wallpaper,
          theme: desktopState.theme,
          windows: windowRows.map(this.transformWindowRow),
          taskbar: {
            position: desktopState.taskbar_position,
            autohide: desktopState.taskbar_autohide,
            pinnedApps: desktopState.pinned_apps,
          },
        },
        appStates: this.extractAppStates(windowRows),
        settings: {
          theme: desktopState.theme,
          wallpaper: desktopState.wallpaper,
          taskbarPosition: desktopState.taskbar_position,
          taskbarAutohide: desktopState.taskbar_autohide,
          language: (desktopState.settings as any)?.language || 'en',
          notifications: (desktopState.settings as any)?.notifications ?? true,
        },
      };

      // Cache the result
      await this.redis.set(cacheKey, result, CacheTTL.DESKTOP_STATE);

      const duration = Date.now() - startTime;
      logger.info('Desktop state loaded from database', { userId, duration, windowCount: windowRows.length });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get desktop state', { userId, duration, error });
      throw error;
    }
  }

  /**
   * Save complete desktop state (with optimistic locking)
   */
  async saveDesktopState(
    userId: string,
    state: Partial<DesktopState>,
    expectedVersion?: number
  ): Promise<PersistedDesktopState> {
    const startTime = Date.now();

    try {
      // Get current desktop state
      const desktopState = await DesktopStateModel.getOrCreate(userId);

      // Update desktop state with optimistic locking
      const updateData: UpdateDesktopStateData = {
        expectedVersion,
      };

      if (state.wallpaper !== undefined) {
        updateData.wallpaper = state.wallpaper;
      }

      if (state.theme !== undefined) {
        updateData.theme = state.theme;
      }

      if (state.taskbar !== undefined) {
        if (state.taskbar.position !== undefined) {
          updateData.taskbarPosition = state.taskbar.position;
        }
        if (state.taskbar.autohide !== undefined) {
          updateData.taskbarAutohide = state.taskbar.autohide;
        }
        if (state.taskbar.pinnedApps !== undefined) {
          updateData.pinnedApps = state.taskbar.pinnedApps;
        }
      }

      const updatedDesktop = await DesktopStateModel.update(userId, updateData);

      // Update windows if provided
      if (state.windows && state.windows.length > 0) {
        await this.saveWindows(userId, updatedDesktop.id, state.windows);
      }

      // Invalidate cache
      await this.invalidateCache(userId);

      const duration = Date.now() - startTime;
      logger.info('Desktop state saved', {
        userId,
        duration,
        version: updatedDesktop.version,
        windowCount: state.windows?.length || 0,
      });

      // Return updated state
      return await this.getDesktopState(userId);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to save desktop state', { userId, duration, error });
      throw error;
    }
  }

  /**
   * Get window states for a user (with caching)
   */
  async getWindows(userId: string): Promise<WindowState[]> {
    const startTime = Date.now();

    try {
      // Try cache first
      const cacheKey = CacheKeys.windowStates(userId);
      const cached = await this.redis.get<WindowState[]>(cacheKey);

      if (cached) {
        const duration = Date.now() - startTime;
        logger.debug('Window states cache hit', { userId, duration });
        return cached;
      }

      // Cache miss - load from database
      const windowRows = await WindowStateModel.findByUserId(userId);
      const windows = windowRows.map(this.transformWindowRow);

      // Cache the result
      await this.redis.set(cacheKey, windows, CacheTTL.WINDOW_STATES);

      const duration = Date.now() - startTime;
      logger.debug('Window states loaded from database', { userId, duration, count: windows.length });

      return windows;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Failed to get window states', { userId, duration, error });
      throw error;
    }
  }

  /**
   * Save window state
   */
  async saveWindow(userId: string, window: WindowState): Promise<WindowState> {
    try {
      const desktopState = await DesktopStateModel.getOrCreate(userId);

      if (window.id) {
        // Update existing window
        const updated = await WindowStateModel.update(window.id, {
          title: window.title,
          position: window.position,
          size: window.size,
          state: window.state,
          zIndex: window.zIndex,
          focused: window.focused,
          resizable: window.resizable,
          movable: window.movable,
        });

        await this.invalidateCache(userId);
        return this.transformWindowRow(updated);
      } else {
        // Create new window
        const created = await WindowStateModel.create({
          userId,
          desktopStateId: desktopState.id,
          appId: window.appId,
          title: window.title,
          position: window.position,
          size: window.size,
          state: window.state,
          zIndex: window.zIndex,
          focused: window.focused,
          resizable: window.resizable,
          movable: window.movable,
        });

        await this.invalidateCache(userId);
        return this.transformWindowRow(created);
      }
    } catch (error) {
      logger.error('Failed to save window state', { userId, windowId: window.id, error });
      throw error;
    }
  }

  /**
   * Save multiple windows efficiently (bulk operation)
   */
  async saveWindows(userId: string, desktopStateId: string, windows: WindowState[]): Promise<void> {
    try {
      // Separate new windows from updates
      const newWindows = windows.filter((w) => !w.id);
      const updateWindows = windows.filter((w) => w.id);

      // Create new windows
      for (const window of newWindows) {
        await WindowStateModel.create({
          userId,
          desktopStateId,
          appId: window.appId,
          title: window.title,
          position: window.position,
          size: window.size,
          state: window.state,
          zIndex: window.zIndex,
          focused: window.focused,
          resizable: window.resizable,
          movable: window.movable,
        });
      }

      // Bulk update existing windows
      if (updateWindows.length > 0) {
        await WindowStateModel.bulkUpdate(
          userId,
          updateWindows.map((w) => ({
            id: w.id,
            title: w.title,
            position: w.position,
            size: w.size,
            state: w.state,
            zIndex: w.zIndex,
            focused: w.focused,
          }))
        );
      }

      await this.invalidateCache(userId);
    } catch (error) {
      logger.error('Failed to save windows', { userId, count: windows.length, error });
      throw error;
    }
  }

  /**
   * Delete a window
   */
  async deleteWindow(userId: string, windowId: string): Promise<void> {
    try {
      await WindowStateModel.delete(windowId);
      await this.invalidateCache(userId);

      logger.info('Window deleted', { userId, windowId });
    } catch (error) {
      logger.error('Failed to delete window', { userId, windowId, error });
      throw error;
    }
  }

  /**
   * Close all windows for a user
   */
  async closeAllWindows(userId: string): Promise<void> {
    try {
      const count = await WindowStateModel.deleteByUserId(userId);
      await this.invalidateCache(userId);

      logger.info('All windows closed', { userId, count });
    } catch (error) {
      logger.error('Failed to close all windows', { userId, error });
      throw error;
    }
  }

  /**
   * Bring window to front
   */
  async bringWindowToFront(userId: string, windowId: string): Promise<WindowState> {
    try {
      const updated = await WindowStateModel.bringToFront(windowId);
      await this.invalidateCache(userId);

      return this.transformWindowRow(updated);
    } catch (error) {
      logger.error('Failed to bring window to front', { userId, windowId, error });
      throw error;
    }
  }

  /**
   * Reset desktop to defaults
   */
  async resetDesktop(userId: string): Promise<PersistedDesktopState> {
    try {
      // Delete all windows
      await WindowStateModel.deleteByUserId(userId);

      // Reset desktop state
      const updated = await DesktopStateModel.update(userId, {
        wallpaper: '/assets/wallpapers/default.jpg',
        theme: 'light',
        taskbarPosition: 'bottom',
        taskbarAutohide: false,
        pinnedApps: [],
        settings: {},
      });

      // Invalidate cache
      await this.invalidateCache(userId);

      logger.info('Desktop reset to defaults', { userId });

      return await this.getDesktopState(userId);
    } catch (error) {
      logger.error('Failed to reset desktop', { userId, error });
      throw error;
    }
  }

  /**
   * Invalidate all cache entries for a user
   */
  private async invalidateCache(userId: string): Promise<void> {
    try {
      await this.redis.deletePattern(CacheKeys.userPattern(userId));
      logger.debug('Cache invalidated', { userId });
    } catch (error) {
      logger.error('Failed to invalidate cache', { userId, error });
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }

  /**
   * Transform database window row to API format
   */
  private transformWindowRow(row: any): WindowState {
    return {
      id: row.id,
      appId: row.app_id,
      title: row.title,
      position: {
        x: row.position_x,
        y: row.position_y,
      },
      size: {
        width: row.width,
        height: row.height,
      },
      state: row.state as WindowDisplayState,
      zIndex: row.z_index,
      focused: row.focused,
      resizable: row.resizable,
      movable: row.movable,
    };
  }

  /**
   * Extract app-specific states from window rows
   */
  private extractAppStates(windowRows: any[]): Record<string, unknown> {
    const appStates: Record<string, unknown> = {};

    for (const window of windowRows) {
      if (window.app_state && Object.keys(window.app_state).length > 0) {
        appStates[window.app_id] = window.app_state;
      }
    }

    return appStates;
  }

  /**
   * Get desktop statistics (for monitoring)
   */
  async getStatistics(): Promise<any> {
    try {
      return await DesktopStateModel.getStatistics();
    } catch (error) {
      logger.error('Failed to get desktop statistics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const desktopService = new DesktopService();
