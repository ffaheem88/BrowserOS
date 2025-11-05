import winston from 'winston';
import { config, isProduction } from './env.js';

// Custom log format for development
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const reqId = requestId ? `[${requestId}]` : '';
    return `${timestamp} ${level} ${reqId}: ${message} ${metaStr}`;
  })
);

// JSON format for production (better for log aggregation)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger
export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'browseros-server' },
  transports: [
    // Console output
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

// Add file transports in production
if (isProduction) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Stream for Morgan HTTP logger
export const httpLoggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper function to create child logger with context
export const createChildLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};
