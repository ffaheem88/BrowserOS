import { getDatabase } from '../config/database.js';
import { SessionModel } from '../models/Session.js';
import { logger } from './logger.js';

/**
 * Health check status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
    uptime: HealthCheckResult;
  };
  metadata: {
    version: string;
    environment: string;
    nodeVersion: string;
  };
}

interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  details?: Record<string, unknown>;
  duration?: number;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthStatus> {
  const checks = {
    database: await checkDatabase(),
    memory: checkMemory(),
    uptime: checkUptime(),
  };

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  const hasFailure = Object.values(checks).some((check) => check.status === 'fail');
  const hasWarning = Object.values(checks).some((check) => check.status === 'warn');

  if (hasFailure) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date(),
    checks,
    metadata: {
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
  };
}

/**
 * Check database health
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const db = getDatabase();
    const health = await db.healthCheck();
    const duration = Date.now() - startTime;

    if (!health.healthy) {
      return {
        status: 'fail',
        message: health.message,
        duration,
      };
    }

    // Check for slow response (> 100ms is concerning)
    if (duration > 100) {
      return {
        status: 'warn',
        message: 'Database responding slowly',
        details: {
          ...health.details,
          responseTime: `${duration}ms`,
        },
        duration,
      };
    }

    return {
      status: 'pass',
      message: 'Database connection healthy',
      details: health.details,
      duration,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Database health check failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthCheckResult {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);
  const externalMB = Math.round(memUsage.external / 1024 / 1024);

  const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  // Warning if heap usage > 80%
  if (heapUsagePercent > 80) {
    return {
      status: 'warn',
      message: 'High memory usage detected',
      details: {
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${heapTotalMB} MB`,
        heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
        rss: `${rssMB} MB`,
        external: `${externalMB} MB`,
      },
    };
  }

  return {
    status: 'pass',
    message: 'Memory usage normal',
    details: {
      heapUsed: `${heapUsedMB} MB`,
      heapTotal: `${heapTotalMB} MB`,
      heapUsagePercent: `${heapUsagePercent.toFixed(2)}%`,
      rss: `${rssMB} MB`,
      external: `${externalMB} MB`,
    },
  };
}

/**
 * Check uptime
 */
function checkUptime(): HealthCheckResult {
  const uptimeSeconds = process.uptime();
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const uptimeDays = Math.floor(uptimeHours / 24);

  let uptimeStr = '';
  if (uptimeDays > 0) {
    uptimeStr = `${uptimeDays}d ${uptimeHours % 24}h`;
  } else if (uptimeHours > 0) {
    uptimeStr = `${uptimeHours}h ${uptimeMinutes % 60}m`;
  } else if (uptimeMinutes > 0) {
    uptimeStr = `${uptimeMinutes}m ${Math.floor(uptimeSeconds % 60)}s`;
  } else {
    uptimeStr = `${Math.floor(uptimeSeconds)}s`;
  }

  // Warning if uptime < 60 seconds (recently restarted)
  if (uptimeSeconds < 60) {
    return {
      status: 'warn',
      message: 'Service recently restarted',
      details: {
        uptime: uptimeStr,
        uptimeSeconds: Math.floor(uptimeSeconds),
      },
    };
  }

  return {
    status: 'pass',
    message: 'Service running normally',
    details: {
      uptime: uptimeStr,
      uptimeSeconds: Math.floor(uptimeSeconds),
    },
  };
}

/**
 * Perform cleanup tasks
 * Should be run periodically (e.g., every hour)
 */
export async function performCleanup(): Promise<{
  expiredSessions: number;
}> {
  try {
    logger.info('Running cleanup tasks');

    // Clean up expired sessions
    const expiredSessions = await SessionModel.deleteExpired();

    logger.info('Cleanup completed', { expiredSessions });

    return {
      expiredSessions,
    };
  } catch (error) {
    logger.error('Cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStatistics(): Promise<{
  sessions: {
    total: number;
    active: number;
    expired: number;
  };
  pool: {
    total: number;
    idle: number;
    waiting: number;
  };
}> {
  try {
    const db = getDatabase();
    const sessionStats = await SessionModel.getStatistics();
    const poolStats = db.getPoolStats();

    return {
      sessions: sessionStats,
      pool: {
        total: poolStats.totalConnections,
        idle: poolStats.idleConnections,
        waiting: poolStats.waitingClients,
      },
    };
  } catch (error) {
    logger.error('Failed to get database statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
