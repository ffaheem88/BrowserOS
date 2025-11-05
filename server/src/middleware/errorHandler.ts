import type { Request, Response, NextFunction } from 'express';
import { isAppError, formatErrorResponse } from '../utils/errors.js';
import { logger } from '../config/logger.js';
import { isProduction } from '../config/env.js';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle operational errors
  if (isAppError(error)) {
    const errorResponse = formatErrorResponse(error);
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle unexpected errors
  const statusCode = 500;
  const response = {
    error: {
      message: isProduction ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR',
      ...(isProduction ? {} : { stack: error.stack }),
    },
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
}
