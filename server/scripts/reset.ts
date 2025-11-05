#!/usr/bin/env node
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { initializeDatabase } from '../src/config/database.js';
import { createMigrator } from '../src/database/migrator.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

/**
 * Prompt user for confirmation
 */
function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Reset and re-migrate database
 */
async function resetDatabase() {
  let db;

  try {
    logger.warn('='.repeat(60));
    logger.warn('DATABASE RESET - THIS WILL DELETE ALL DATA');
    logger.warn('='.repeat(60));

    // Safety check for production
    if (process.env.NODE_ENV === 'production') {
      logger.error('Cannot reset database in production environment');
      process.exit(1);
    }

    // Confirm action
    const confirmed = await confirm(
      'Are you sure you want to reset the database? This will DELETE ALL DATA.'
    );

    if (!confirmed) {
      logger.info('Database reset cancelled');
      process.exit(0);
    }

    // Initialize database
    db = initializeDatabase();
    await db.connect();

    // Create migrator
    const migrationsPath = join(__dirname, '../../database/migrations');
    const migrator = createMigrator(db, migrationsPath);

    // Reset database
    logger.warn('Dropping all tables...');
    await migrator.reset();

    // Re-run migrations
    logger.info('Running migrations...');
    await migrator.migrate();

    logger.info('='.repeat(60));
    logger.info('Database reset and migrations completed successfully');
    logger.info('='.repeat(60));
    logger.info('Run "npm run db:seed" to populate with initial data');

    process.exit(0);
  } catch (error) {
    logger.error('Database reset failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  } finally {
    if (db) {
      await db.disconnect();
    }
  }
}

// Run reset
resetDatabase();
