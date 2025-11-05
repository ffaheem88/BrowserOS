import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, isProduction } from './config/env.js';
import { logger } from './config/logger.js';
import { initializeDatabase, getDatabase } from './config/database.js';
import { initializeRedis, getRedisClient } from './config/redis.js';
import { requestId, requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import desktopRoutes from './routes/desktopRoutes.js';
import { SessionModel } from './models/Session.js';

/**
 * Create Express application
 */
const app = express();

/**
 * Security middleware
 */
app.use(
  helmet({
    contentSecurityPolicy: isProduction,
    crossOriginEmbedderPolicy: isProduction,
  })
);

/**
 * CORS configuration
 */
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  })
);

/**
 * Compression middleware
 */
app.use(compression());

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request ID and logging middleware
 */
app.use(requestId);
app.use(requestLogger);

/**
 * Rate limiting
 */
app.use('/api', apiRateLimiter);

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const db = getDatabase();
    const dbHealth = await db.healthCheck();

    const redis = getRedisClient();
    const redisHealth = await redis.healthCheck();

    const health = {
      status: dbHealth.healthy && redisHealth.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: dbHealth,
      redis: redisHealth,
    };

    const statusCode = dbHealth.healthy && redisHealth.healthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * API Routes
 */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/desktop', desktopRoutes);

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'BrowserOS API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/v1/docs',
  });
});

/**
 * 404 handler - must be after all other routes
 */
app.use(notFoundHandler);

/**
 * Error handling middleware - must be last
 */
app.use(errorHandler);

/**
 * Start server
 */
async function startServer() {
  try {
    // Initialize database
    logger.info('Initializing database connection...');
    const db = initializeDatabase();
    await db.connect();

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

export default app;
