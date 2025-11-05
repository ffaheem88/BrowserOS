import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors.js';

/**
 * Create a validation middleware for request body
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateRequest<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate and parse request body
      const validated = schema.parse(req.body);

      // Replace request body with validated and transformed data
      req.body = validated;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod validation errors
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(
          new ValidationError('Request validation failed', {
            errors,
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Create a validation middleware for query parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(
          new ValidationError('Query validation failed', {
            errors,
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Create a validation middleware for route parameters
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        next(
          new ValidationError('Parameter validation failed', {
            errors,
          })
        );
      } else {
        next(error);
      }
    }
  };
}
