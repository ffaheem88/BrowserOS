import { QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger.js';

/**
 * Database error types for better error handling
 */
export enum DatabaseErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
  CHECK_VIOLATION = '23514',
  DEADLOCK_DETECTED = '40P01',
}

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  public code?: string;
  public constraint?: string;
  public detail?: string;

  constructor(message: string, code?: string, constraint?: string, detail?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.constraint = constraint;
    this.detail = detail;
  }

  /**
   * Check if error is a unique constraint violation
   */
  public isUniqueViolation(): boolean {
    return this.code === DatabaseErrorCode.UNIQUE_VIOLATION;
  }

  /**
   * Check if error is a foreign key violation
   */
  public isForeignKeyViolation(): boolean {
    return this.code === DatabaseErrorCode.FOREIGN_KEY_VIOLATION;
  }

  /**
   * Check if error is a not null violation
   */
  public isNotNullViolation(): boolean {
    return this.code === DatabaseErrorCode.NOT_NULL_VIOLATION;
  }
}

/**
 * Handle PostgreSQL errors and convert to DatabaseError
 */
export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  // PostgreSQL error object structure
  const pgError = error as {
    code?: string;
    constraint?: string;
    detail?: string;
    message?: string;
  };

  const message = pgError.message || 'Database operation failed';
  const code = pgError.code;
  const constraint = pgError.constraint;
  const detail = pgError.detail;

  logger.error('Database error', {
    message,
    code,
    constraint,
    detail,
  });

  return new DatabaseError(message, code, constraint, detail);
}

/**
 * Safely extract first row from query result
 */
export function getFirstRow<T extends QueryResultRow>(
  result: QueryResult<T>
): T | null {
  return result.rows[0] || null;
}

/**
 * Safely extract all rows from query result
 */
export function getAllRows<T extends QueryResultRow>(
  result: QueryResult<T>
): T[] {
  return result.rows;
}

/**
 * Build SET clause for UPDATE queries
 *
 * @example
 * buildSetClause({ name: 'John', email: 'john@example.com' }, 1)
 * // Returns: { setClause: 'name = $1, email = $2', values: ['John', 'john@example.com'], nextIndex: 3 }
 */
export function buildSetClause(
  data: Record<string, unknown>,
  startIndex = 1
): {
  setClause: string;
  values: unknown[];
  nextIndex: number;
} {
  const entries = Object.entries(data).filter(
    ([_, value]) => value !== undefined
  );

  const setClauses = entries.map(([key], index) => {
    const snakeKey = camelToSnake(key);
    return `${snakeKey} = $${startIndex + index}`;
  });

  const values = entries.map(([_, value]) => value);

  return {
    setClause: setClauses.join(', '),
    values,
    nextIndex: startIndex + entries.length,
  };
}

/**
 * Convert camelCase to snake_case for database column names
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Convert snake_case to camelCase for JavaScript objects
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert database row from snake_case to camelCase
 */
export function rowToCamel<T extends QueryResultRow>(
  row: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    result[snakeToCamel(key)] = value;
  }

  return result;
}

/**
 * Convert object from camelCase to snake_case for database
 */
export function objectToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }

  return result;
}

/**
 * Build WHERE clause with AND conditions
 *
 * @example
 * buildWhereClause({ userId: '123', status: 'active' }, 1)
 * // Returns: { whereClause: 'user_id = $1 AND status = $2', values: ['123', 'active'], nextIndex: 3 }
 */
export function buildWhereClause(
  conditions: Record<string, unknown>,
  startIndex = 1
): {
  whereClause: string;
  values: unknown[];
  nextIndex: number;
} {
  const entries = Object.entries(conditions).filter(
    ([_, value]) => value !== undefined
  );

  if (entries.length === 0) {
    return { whereClause: '1=1', values: [], nextIndex: startIndex };
  }

  const whereClauses = entries.map(([key], index) => {
    const snakeKey = camelToSnake(key);
    return `${snakeKey} = $${startIndex + index}`;
  });

  const values = entries.map(([_, value]) => value);

  return {
    whereClause: whereClauses.join(' AND '),
    values,
    nextIndex: startIndex + entries.length,
  };
}

/**
 * Format date for PostgreSQL timestamp
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Parse database timestamp to Date
 */
export function parseTimestamp(timestamp: string | Date | null): Date | null {
  if (!timestamp) return null;
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
}

/**
 * Build pagination query
 */
export function buildPagination(
  page: number = 1,
  limit: number = 20
): {
  limit: number;
  offset: number;
} {
  const sanitizedPage = Math.max(1, page);
  const sanitizedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

  return {
    limit: sanitizedLimit,
    offset: (sanitizedPage - 1) * sanitizedLimit,
  };
}

/**
 * Check if a value is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize search query for full-text search
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove special characters that could break the query
  return query
    .replace(/[^\w\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .join(' & ');
}

/**
 * Build ORDER BY clause
 */
export function buildOrderBy(
  orderBy: string = 'created_at',
  order: 'ASC' | 'DESC' = 'DESC'
): string {
  const snakeOrderBy = camelToSnake(orderBy);
  const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return `${snakeOrderBy} ${validOrder}`;
}
