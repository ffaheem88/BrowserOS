import { Router } from 'express';
import { desktopController } from '../controllers/desktopController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { z } from 'zod';

const router = Router();

// All desktop routes require authentication
router.use(authenticate);

/**
 * Validation schemas
 */

// Position schema
const positionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Size schema
const sizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

// Window state schema
const windowStateSchema = z.object({
  id: z.string().optional(),
  appId: z.string().min(1),
  title: z.string().min(1),
  position: positionSchema,
  size: sizeSchema,
  state: z.enum(['normal', 'minimized', 'maximized', 'fullscreen']).optional(),
  zIndex: z.number().optional(),
  focused: z.boolean().optional(),
  resizable: z.boolean().optional(),
  movable: z.boolean().optional(),
});

// Taskbar config schema
const taskbarConfigSchema = z.object({
  position: z.enum(['top', 'bottom', 'left', 'right']).optional(),
  autohide: z.boolean().optional(),
  pinnedApps: z.array(z.string()).optional(),
});

// Desktop state schema
const desktopStateSchema = z.object({
  wallpaper: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  windows: z.array(windowStateSchema).optional(),
  taskbar: taskbarConfigSchema.optional(),
});

// Save desktop state schema
const saveDesktopStateSchema = z.object({
  state: desktopStateSchema,
  version: z.number().optional(),
});

// Bulk windows schema
const bulkWindowsSchema = z.object({
  windows: z.array(windowStateSchema).min(1),
});

/**
 * GET /api/v1/desktop/state
 * Load user's desktop configuration
 */
router.get('/state', desktopController.getDesktopState.bind(desktopController));

/**
 * PUT /api/v1/desktop/state
 * Save desktop configuration
 * Supports optimistic locking with version number
 */
router.put(
  '/state',
  validateRequest(saveDesktopStateSchema),
  desktopController.saveDesktopState.bind(desktopController)
);

/**
 * GET /api/v1/desktop/windows
 * Load window positions
 */
router.get('/windows', desktopController.getWindows.bind(desktopController));

/**
 * POST /api/v1/desktop/windows
 * Save window state (create or update)
 */
router.post(
  '/windows',
  validateRequest(windowStateSchema),
  desktopController.saveWindow.bind(desktopController)
);

/**
 * POST /api/v1/desktop/windows/bulk
 * Save multiple windows at once (bulk operation)
 */
router.post(
  '/windows/bulk',
  validateRequest(bulkWindowsSchema),
  desktopController.saveWindows.bind(desktopController)
);

/**
 * DELETE /api/v1/desktop/windows/:windowId
 * Delete a specific window
 */
router.delete('/windows/:windowId', desktopController.deleteWindow.bind(desktopController));

/**
 * DELETE /api/v1/desktop/windows
 * Close all windows
 */
router.delete('/windows', desktopController.closeAllWindows.bind(desktopController));

/**
 * POST /api/v1/desktop/windows/:windowId/focus
 * Bring window to front and focus it
 */
router.post(
  '/windows/:windowId/focus',
  desktopController.bringWindowToFront.bind(desktopController)
);

/**
 * POST /api/v1/desktop/reset
 * Reset desktop to default state
 */
router.post('/reset', desktopController.resetDesktop.bind(desktopController));

/**
 * GET /api/v1/desktop/statistics
 * Get desktop statistics (for monitoring/admin)
 */
router.get('/statistics', desktopController.getStatistics.bind(desktopController));

export default router;
