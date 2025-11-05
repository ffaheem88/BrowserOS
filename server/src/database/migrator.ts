import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Database } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface Migration {
  id: number;
  name: string;
  filename: string;
  sql: string;
}

interface MigrationRecord {
  id: number;
  name: string;
  applied_at: Date;
}

/**
 * Database Migration Runner
 *
 * Manages database schema migrations with:
 * - Sequential migration execution
 * - Migration tracking
 * - Rollback support (future enhancement)
 * - Idempotent execution
 */
export class Migrator {
  private db: Database;
  private migrationsPath: string;

  constructor(db: Database, migrationsPath: string) {
    this.db = db;
    this.migrationsPath = migrationsPath;
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.db.query(sql);
    logger.debug('Migrations table ready');
  }

  /**
   * Get list of applied migrations
   */
  private async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const result = await this.db.query<MigrationRecord>(
      'SELECT id, name, applied_at FROM migrations ORDER BY id'
    );
    return result.rows;
  }

  /**
   * Load migration files from filesystem
   */
  private async loadMigrationFiles(): Promise<Migration[]> {
    try {
      const files = await readdir(this.migrationsPath);

      // Filter and sort SQL files
      const sqlFiles = files
        .filter((file) => file.endsWith('.sql'))
        .sort();

      const migrations: Migration[] = [];

      for (const filename of sqlFiles) {
        // Extract migration ID from filename (e.g., 001_initial_schema.sql)
        const match = filename.match(/^(\d+)_(.+)\.sql$/);

        if (!match) {
          logger.warn(`Skipping invalid migration filename: ${filename}`);
          continue;
        }

        const id = parseInt(match[1], 10);
        const name = match[2];
        const filepath = join(this.migrationsPath, filename);
        const sql = await readFile(filepath, 'utf-8');

        migrations.push({ id, name, filename, sql });
      }

      return migrations;
    } catch (error) {
      logger.error('Failed to load migration files', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: this.migrationsPath,
      });
      throw error;
    }
  }

  /**
   * Apply a single migration
   */
  private async applyMigration(migration: Migration): Promise<void> {
    logger.info(`Applying migration: ${migration.filename}`);

    await this.db.transaction(async (client) => {
      // Execute migration SQL
      await client.query(migration.sql);

      // Record migration
      await client.query(
        'INSERT INTO migrations (id, name, applied_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
        [migration.id, migration.name]
      );

      logger.info(`Migration applied successfully: ${migration.filename}`);
    });
  }

  /**
   * Run all pending migrations
   */
  public async migrate(): Promise<void> {
    try {
      logger.info('Starting database migration');

      // Ensure migrations table exists
      await this.ensureMigrationsTable();

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedIds = new Set(appliedMigrations.map((m) => m.id));

      logger.info(`Found ${appliedMigrations.length} applied migrations`);

      // Load migration files
      const migrations = await this.loadMigrationFiles();
      logger.info(`Found ${migrations.length} migration files`);

      // Filter pending migrations
      const pendingMigrations = migrations.filter((m) => !appliedIds.has(m.id));

      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);

      // Apply each pending migration
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get migration status
   */
  public async status(): Promise<{
    applied: MigrationRecord[];
    pending: Migration[];
  }> {
    await this.ensureMigrationsTable();

    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map((m) => m.id));

    const allMigrations = await this.loadMigrationFiles();
    const pendingMigrations = allMigrations.filter((m) => !appliedIds.has(m.id));

    return {
      applied: appliedMigrations,
      pending: pendingMigrations,
    };
  }

  /**
   * Reset database (drop all tables) - USE WITH CAUTION
   */
  public async reset(): Promise<void> {
    logger.warn('Resetting database - dropping all tables');

    const sql = `
      DO $$ DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables in public schema
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;

        -- Drop all sequences
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;

        -- Drop all functions
        FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') LOOP
          EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.routine_name) || ' CASCADE';
        END LOOP;
      END $$;
    `;

    await this.db.query(sql);
    logger.warn('Database reset complete');
  }
}

/**
 * Create migrator instance
 */
export function createMigrator(db: Database, migrationsPath?: string): Migrator {
  const defaultPath = join(process.cwd(), '..', 'database', 'migrations');
  return new Migrator(db, migrationsPath || defaultPath);
}
