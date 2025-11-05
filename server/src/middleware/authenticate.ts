import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { UnauthorizedError, InvalidTokenError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

/**
 * Extended Request interface with user information
 */
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
  requestId?: string;
}

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header
 * Attaches user information to request object
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user info to request
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
    };

    logger.debug('User authenticated', {
      userId: payload.userId,
      requestId: (req as AuthenticatedRequest).requestId,
    });

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return next(new UnauthorizedError('Access token expired'));
      }
      if (error.message.includes('invalid')) {
        return next(new InvalidTokenError('Invalid access token'));
      }
    }

    next(new UnauthorizedError('Authentication failed'));
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require authentication
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);

    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    // Token is invalid, but we don't fail - just continue without user info
    next();
  }
}
