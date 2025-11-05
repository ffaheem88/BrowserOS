import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/authenticate.js';
import { authService } from '../services/authService.js';
import { logger } from '../config/logger.js';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
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
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userAgent = req.get('user-agent');
      const ipAddress = req.ip;

      const result = await authService.login(req.body, userAgent, ipAddress);

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
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      res.status(200).json({
        data: { message: 'Logged out successfully' },
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
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

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
   * Get current user
   * GET /api/v1/auth/me
   */
  async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.userId;

      const user = await authService.getCurrentUser(userId);

      res.status(200).json({
        data: user,
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
export const authController = new AuthController();
