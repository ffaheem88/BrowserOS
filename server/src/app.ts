/**
 * Express Application
 * Exports the Express app without starting the server (for testing)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, isProduction } from './config/env.js';
import { requestId, requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import desktopRoutes from './routes/desktopRoutes.js';
import { getDatabase } from './config/database.js';
import { getRedisClient } from './config/redis.js';
import { logger } from './config/logger.js';

/**
 * Create Express application
 */
export const app = express();

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
