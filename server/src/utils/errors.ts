/**
 * Base error class for application-specific errors
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Invalid input or malformed request
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found - Resource not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: unknown) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

/**
 * 503 Service Unavailable - Service temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', details?: unknown) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

/**
 * Authentication-specific errors
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Invalid email or password') {
    super(message);
    this.code = 'INVALID_CREDENTIALS';
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor(message: string = 'Token has expired') {
    super(message);
    this.code = 'TOKEN_EXPIRED';
  }
}

export class InvalidTokenError extends UnauthorizedError {
  constructor(message: string = 'Invalid token') {
    super(message);
    this.code = 'INVALID_TOKEN';
  }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends InternalServerError {
  constructor(message: string = 'Database error', details?: unknown) {
    super(message, details);
    this.code = 'DATABASE_ERROR';
  }
}

export class DuplicateRecordError extends ConflictError {
  constructor(message: string = 'Record already exists', details?: unknown) {
    super(message, details);
    this.code = 'DUPLICATE_RECORD';
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: unknown): {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
} {
  if (isAppError(error)) {
    return {
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  // Unknown error - don't expose internal details
  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
  };
}
