import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger.js';

interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  min: number;
  max: number;
}

/**
 * Database class - Manages PostgreSQL connection pool and provides query interface
 *
 * Features:
 * - Connection pooling for optimal performance
 * - Transaction support with automatic rollback on error
 * - Query logging and error handling
 * - Health check functionality
 * - Graceful shutdown
 */
export class Database {
  private static instance: Database;
  private pool: Pool;
  private isConnected: boolean = false;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.min,
      max: config.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Enhanced error handling
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Connection pool error handling
    this.pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err.message, stack: err.stack });
    });

    this.pool.on('connect', () => {
      logger.debug('New database client connected');
    });

    this.pool.on('remove', () => {
      logger.debug('Database client removed from pool');
    });
  }

  /**
   * Get singleton instance of Database
   */
  public static getInstance(config?: DatabaseConfig): Database {
    if (!Database.instance) {
      if (!config) {
        throw new Error('Database configuration required for first initialization');
      }
      Database.instance = new Database(config);
    }
    return Database.instance;
  }

  /**
   * Initialize and test database connection
   */
  public async connect(): Promise<void> {
    try {
      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as connected_at, version() as version');

      logger.info('Database connected successfully', {
        connectedAt: result.rows[0].connected_at,
        version: result.rows[0].version.split(' ')[0], // PostgreSQL version
      });

      client.release();
      this.isConnected = true;
    } catch (error) {
      logger.error('Database connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Close all connections in the pool
   */
  public async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Execute a query with parameterized values
   *
   * @param sql - SQL query string with $1, $2, etc. placeholders
   * @param params - Array of parameter values
   * @returns Query result
   */
  public async query<T extends QueryResultRow>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();

    try {
      const result = await this.pool.query<T>(sql, params);
      const duration = Date.now() - startTime;

      if (duration > 1000) {
        logger.warn('Slow query detected', {
          duration: `${duration}ms`,
          sql: sql.substring(0, 100), // Log first 100 chars
          rowCount: result.rowCount,
        });
      }

      logger.debug('Query executed', {
        duration: `${duration}ms`,
        rowCount: result.rowCount,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Query execution failed', {
        duration: `${duration}ms`,
        sql: sql.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
        params: params ? JSON.stringify(params).substring(0, 200) : undefined,
      });
      throw error;
    }
  }

  /**
   * Execute a transaction with automatic commit/rollback
   *
   * @param callback - Function containing transaction logic
   * @returns Result from callback
   *
   * @example
   * const result = await db.transaction(async (client) => {
   *   await client.query('INSERT INTO users ...');
   *   await client.query('INSERT INTO sessions ...');
   *   return { success: true };
   * });
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      await client.query('BEGIN');
      logger.debug('Transaction started');

      const result = await callback(client);

      await client.query('COMMIT');
      const duration = Date.now() - startTime;
      logger.debug('Transaction committed', { duration: `${duration}ms` });

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      const duration = Date.now() - startTime;
      logger.error('Transaction rolled back', {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for multiple operations
   * Remember to release the client when done!
   */
  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Check database health
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    message: string;
    details?: {
      totalConnections: number;
      idleConnections: number;
      waitingClients: number;
    };
  }> {
    if (!this.isConnected) {
      return {
        healthy: false,
        message: 'Database not connected',
      };
    }

    try {
      await this.pool.query('SELECT 1');

      return {
        healthy: true,
        message: 'Database connection healthy',
        details: {
          totalConnections: this.pool.totalCount,
          idleConnections: this.pool.idleCount,
          waitingClients: this.pool.waitingCount,
        },
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  /**
   * Get pool statistics
   */
  public getPoolStats() {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
    };
  }
}

/**
 * Initialize database connection from environment variables
 */
export function initializeDatabase(): Database {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Parse DATABASE_URL: postgresql://user:password@host:port/database
  const url = new URL(databaseUrl);

  const config: DatabaseConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
    min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
  };

  logger.info('Initializing database connection', {
    host: config.host,
    port: config.port,
    database: config.database,
    poolMin: config.min,
    poolMax: config.max,
  });

  return Database.getInstance(config);
}

// Export singleton instance getter
export const getDatabase = () => Database.getInstance();
