import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validation.js';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerSchema),
  authController.register.bind(authController)
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  authController.login.bind(authController)
);

/**
 * POST /api/v1/auth/logout
 * Logout user (requires authentication)
 */
router.post(
  '/logout',
  authenticate,
  validateRequest(refreshTokenSchema),
  authController.logout.bind(authController)
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  authController.refresh.bind(authController)
);

/**
 * GET /api/v1/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;
