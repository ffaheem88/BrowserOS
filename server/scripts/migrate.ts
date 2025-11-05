#!/usr/bin/env node
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from '../src/config/database.js';
import { createMigrator } from '../src/database/migrator.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

/**
 * Run database migrations
 */
async function runMigrations() {
  let db;

  try {
    logger.info('='.repeat(60));
    logger.info('Database Migration Runner');
    logger.info('='.repeat(60));

    // Initialize database
    db = initializeDatabase();
    await db.connect();

    // Create migrator
    const migrationsPath = join(__dirname, '../../database/migrations');
    const migrator = createMigrator(db, migrationsPath);

    // Get migration status
    const status = await migrator.status();

    logger.info(`Applied migrations: ${status.applied.length}`);
    logger.info(`Pending migrations: ${status.pending.length}`);

    if (status.pending.length === 0) {
      logger.info('No pending migrations');
      logger.info('='.repeat(60));
      process.exit(0);
    }

    // Show pending migrations
    logger.info('Pending migrations:');
    status.pending.forEach((m) => {
      logger.info(`  - ${m.filename}`);
    });

    // Run migrations
    await migrator.migrate();

    logger.info('='.repeat(60));
    logger.info('All migrations completed successfully');
    logger.info('='.repeat(60));

    process.exit(0);
  } catch (error) {
    logger.error('Migration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  } finally {
    if (db) {
      await db.disconnect();
    }
  }
}

// Run migrations
runMigrations();
