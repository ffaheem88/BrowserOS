/**
 * Database module exports
 *
 * Central export point for all database-related functionality
 */

// Configuration
export { Database, initializeDatabase, getDatabase } from '../config/database.js';

// Migration
export { Migrator, createMigrator } from './migrator.js';

// Utilities
export {
  DatabaseError,
  DatabaseErrorCode,
  handleDatabaseError,
  getFirstRow,
  getAllRows,
  buildSetClause,
  buildWhereClause,
  buildOrderBy,
  buildPagination,
  camelToSnake,
  snakeToCamel,
  rowToCamel,
  objectToSnake,
  isValidUUID,
  sanitizeSearchQuery,
  formatTimestamp,
  parseTimestamp,
} from './utils.js';

// Models
export { UserModel } from '../models/User.js';
export { SessionModel } from '../models/Session.js';
