import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

let pool: Pool | null = null;

/**
 * Get or create database connection pool for testing
 */
export function getTestPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Log connection errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

/**
 * Setup test database - create tables and initial schema
 */
export async function setupTestDatabase(): Promise<void> {
  const testPool = getTestPool();

  try {
    // Drop all tables if they exist (clean slate)
    await testPool.query(`
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS vfs_nodes CASCADE;
      DROP TABLE IF EXISTS persisted_states CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Read and execute schema migration
    const schemaPath = join(__dirname, '../../database/migrations/001_initial_schema.sql');
    let schemaSql: string;

    try {
      schemaSql = readFileSync(schemaPath, 'utf-8');
    } catch (error) {
      // If migration file doesn't exist yet, create basic schema inline
      console.warn('Migration file not found, using inline schema for tests');
      schemaSql = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          display_name VARCHAR(100) NOT NULL,
          avatar_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE
        );

        -- Sessions table
        CREATE TABLE IF NOT EXISTS sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          refresh_token VARCHAR(500) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          user_agent VARCHAR(500),
          ip_address VARCHAR(45),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      `;
    }

    await testPool.query(schemaSql);
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Reset database - clear all data but keep schema
 */
export async function resetDatabase(): Promise<void> {
  const testPool = getTestPool();

  try {
    await testPool.query('BEGIN');
    await testPool.query('DELETE FROM sessions');
    await testPool.query('DELETE FROM users');
    await testPool.query('COMMIT');
  } catch (error) {
    await testPool.query('ROLLBACK');
    console.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Teardown test database - close connections
 */
export async function teardownTestDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Test database connections closed');
  }
}

/**
 * Execute a raw SQL query for testing purposes
 */
export async function executeQuery<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const testPool = getTestPool();
  const result = await testPool.query(sql, params);
  return result.rows;
}

/**
 * Begin a transaction for testing
 */
export async function beginTransaction(): Promise<void> {
  const testPool = getTestPool();
  await testPool.query('BEGIN');
}

/**
 * Commit a transaction
 */
export async function commitTransaction(): Promise<void> {
  const testPool = getTestPool();
  await testPool.query('COMMIT');
}

/**
 * Rollback a transaction
 */
export async function rollbackTransaction(): Promise<void> {
  const testPool = getTestPool();
  await testPool.query('ROLLBACK');
}
