import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import type { TokenPayload } from '@/shared/types/index.js';

/**
 * Generate an access token (short-lived)
 * @param userId - User ID
 * @param email - User email
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId,
    email,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN, // 15 minutes
    issuer: 'browseros',
    audience: 'browseros-client',
  });
}

/**
 * Generate a refresh token (long-lived)
 * @param userId - User ID
 * @param email - User email
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId,
    email,
  };

  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN, // 30 days
    issuer: 'browseros',
    audience: 'browseros-client',
  });
}

/**
 * Verify an access token
 * @param token - JWT access token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'browseros',
      audience: 'browseros-client',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Verify a refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET, {
      issuer: 'browseros',
      audience: 'browseros-client',
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}

/**
 * Decode a token without verifying (useful for debugging)
 * @param token - JWT token
 * @returns Decoded token payload or null
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate token expiry date
 * @param expiresIn - Expiration time string (e.g., '15m', '7d')
 * @returns Date when token expires
 */
export function calculateTokenExpiry(expiresIn: string): Date {
  const now = new Date();

  // Parse expiry time (e.g., '15m', '7d', '30d')
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiresIn}`);
  }

  const [, value, unit] = match;
  const numValue = parseInt(value, 10);

  switch (unit) {
    case 's': // seconds
      now.setSeconds(now.getSeconds() + numValue);
      break;
    case 'm': // minutes
      now.setMinutes(now.getMinutes() + numValue);
      break;
    case 'h': // hours
      now.setHours(now.getHours() + numValue);
      break;
    case 'd': // days
      now.setDate(now.getDate() + numValue);
      break;
    default:
      throw new Error(`Invalid time unit: ${unit}`);
  }

  return now;
}
