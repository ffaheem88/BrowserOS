import { createClient, RedisClientType } from 'redis';
import { logger } from './logger.js';

/**
 * Redis client configuration and management
 *
 * Features:
 * - Connection pooling and automatic reconnection
 * - Health checks and monitoring
 * - Graceful error handling
 * - TTL-based caching with sensible defaults
 */
export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Initialize and connect to Redis
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            // Exponential backoff: 100ms, 200ms, 400ms, etc.
            const delay = Math.min(100 * Math.pow(2, retries), 3000);
            logger.warn(`Redis reconnecting in ${delay}ms...`, { retries });
            return delay;
          },
          connectTimeout: 10000,
        },
      });

      // Error handling
      this.client.on('error', (err) => {
        logger.error('Redis client error', { error: err.message });
      });

      this.client.on('connect', () => {
        logger.debug('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
      });

      this.client.on('end', () => {
        logger.info('Redis connection closed');
        this.isConnected = false;
      });

      await this.client.connect();

      // Test connection
      await this.client.ping();
      logger.info('Redis connected successfully', { url: redisUrl.replace(/:[^:@]+@/, ':****@') });
    } catch (error) {
      logger.error('Redis connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - allow server to start without Redis
      // Cache operations will gracefully degrade
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting from Redis', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Get a value from cache
   */
  public async get<T = string>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      logger.debug('Redis not connected, cache miss', { key });
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      logger.error('Redis GET error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache (will be JSON stringified)
   * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
   */
  public async set(key: string, value: unknown, ttlSeconds: number = 300): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      logger.debug('Redis not connected, skipping cache set', { key });
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error('Redis SET error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Delete a key from cache
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DELETE error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * @param pattern - Redis key pattern (e.g., "user:*" or "desktop:*")
   */
  public async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error('Redis DELETE PATTERN error', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * @returns TTL in seconds, or -1 if key doesn't exist, -2 if no TTL
   */
  public async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return -1;
    }
  }

  /**
   * Increment a counter
   */
  public async increment(key: string): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis INCR error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    message: string;
    latency?: number;
  }> {
    if (!this.isConnected || !this.client) {
      return {
        healthy: false,
        message: 'Redis not connected',
      };
    }

    try {
      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return {
        healthy: true,
        message: 'Redis connection healthy',
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  /**
   * Get Redis info
   */
  public async getInfo(): Promise<string | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      return await this.client.info();
    } catch (error) {
      logger.error('Redis INFO error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Check connection status
   */
  public isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  desktopState: (userId: string) => `desktop:state:${userId}`,
  windowStates: (userId: string) => `desktop:windows:${userId}`,
  userPattern: (userId: string) => `desktop:*:${userId}`,
  allDesktops: () => 'desktop:*',
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  DESKTOP_STATE: 300, // 5 minutes
  WINDOW_STATES: 300, // 5 minutes
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
};

// Export singleton instance getter
export const getRedisClient = () => RedisClient.getInstance();

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<RedisClient> {
  const client = RedisClient.getInstance();
  await client.connect();
  return client;
}
