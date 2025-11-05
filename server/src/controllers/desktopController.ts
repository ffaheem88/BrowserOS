import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { desktopService } from '../services/desktopService.js';
import { logger } from '../config/logger.js';
import type { DesktopState, WindowState } from '@/shared/types/index.js';

/**
 * Desktop Controller
 * Handles HTTP requests for desktop and window state endpoints
 */
export class DesktopController {
  /**
   * Get user's desktop state
   * GET /api/v1/desktop/state
   */
  async getDesktopState(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const result = await desktopService.getDesktopState(userId);

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save user's desktop state
   * PUT /api/v1/desktop/state
   *
   * Body:
   * {
   *   "state": DesktopState,
   *   "version": number (optional, for optimistic locking)
   * }
   */
  async saveDesktopState(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const { state, version } = req.body;

      const result = await desktopService.saveDesktopState(userId, state, version);

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's window states
   * GET /api/v1/desktop/windows
   */
  async getWindows(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const windows = await desktopService.getWindows(userId);

      res.status(200).json({
        data: windows,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save window state
   * POST /api/v1/desktop/windows
   *
   * Body: WindowState
   */
  async saveWindow(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const window: WindowState = req.body;

      const result = await desktopService.saveWindow(userId, window);

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save multiple windows (bulk operation)
   * POST /api/v1/desktop/windows/bulk
   *
   * Body: { windows: WindowState[] }
   */
  async saveWindows(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const { windows } = req.body;

      // Get desktop state to get desktop_state_id
      const desktopState = await desktopService.getDesktopState(userId);

      await desktopService.saveWindows(userId, desktopState.desktop.windows[0]?.id || '', windows);

      // Return updated windows
      const result = await desktopService.getWindows(userId);

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete window
   * DELETE /api/v1/desktop/windows/:windowId
   */
  async deleteWindow(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const { windowId } = req.params;

      await desktopService.deleteWindow(userId, windowId);

      res.status(200).json({
        data: { message: 'Window deleted successfully' },
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close all windows
   * DELETE /api/v1/desktop/windows
   */
  async closeAllWindows(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;

      await desktopService.closeAllWindows(userId);

      res.status(200).json({
        data: { message: 'All windows closed successfully' },
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bring window to front
   * POST /api/v1/desktop/windows/:windowId/focus
   */
  async bringWindowToFront(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;
      const { windowId } = req.params;

      const result = await desktopService.bringWindowToFront(userId, windowId);

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset desktop to defaults
   * POST /api/v1/desktop/reset
   */
  async resetDesktop(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.userId;

      const result = await desktopService.resetDesktop(userId);

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get desktop statistics (admin/monitoring)
   * GET /api/v1/desktop/statistics
   */
  async getStatistics(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await desktopService.getStatistics();

      res.status(200).json({
        data: result,
        meta: {
          timestamp: new Date(),
          requestId: req.requestId,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export controller instance
export const desktopController = new DesktopController();
