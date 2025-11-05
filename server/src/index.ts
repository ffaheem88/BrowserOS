/**
 * Server Entry Point
 * Starts the Express server with all necessary initialization
 */

import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { SessionModel } from './models/Session.js';
import { createMigrator } from './database/migrator.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    const db = initializeDatabase();
    await db.connect();

    // Run database migrations
    logger.info('Running database migrations...');
    const migrationsPath = join(__dirname, '../../database/migrations');
    const migrator = createMigrator(db, migrationsPath);
    const status = await migrator.status();

    if (status.pending.length > 0) {
      logger.info(`Found ${status.pending.length} pending migration(s)`);
      await migrator.migrate();
      logger.info('Database migrations completed successfully');
    } else {
      logger.info('Database is up to date');
    }

    // Initialize Redis (non-blocking - server continues if Redis unavailable)
    logger.info('Initializing Redis connection...');
    const redis = await initializeRedis();

    // Start scheduled tasks
    startScheduledTasks();

    // Start Express server
    const port = config.PORT;
    const server = app.listen(port, () => {
      logger.info(`Server started successfully`, {
        port,
        environment: config.NODE_ENV,
        pid: process.pid,
      });
    });

    // Graceful shutdown handler
    setupGracefulShutdown(server, db, redis);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown
 */
function setupGracefulShutdown(server: any, db: any, redis: any) {
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close database connections
        await db.disconnect();

        // Close Redis connection
        await redis.disconnect();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error });
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', { reason, promise });
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Start scheduled tasks
 */
function startScheduledTasks() {
  // Clean up expired sessions every hour
  setInterval(
    async () => {
      try {
        await SessionModel.deleteExpired();
      } catch (error) {
        logger.error('Failed to cleanup expired sessions', { error });
      }
    },
    60 * 60 * 1000
  ); // 1 hour

  logger.info('Scheduled tasks started');
}

/**
 * Start the server
 */
startServer();
