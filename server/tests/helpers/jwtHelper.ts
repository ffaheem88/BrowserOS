import jwt from 'jsonwebtoken';
import { User, TokenPayload } from '@shared/types';

/**
 * Generate a valid access token for testing
 */
export function generateAccessToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

/**
 * Generate a valid refresh token for testing
 */
export function generateRefreshToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    }
  );
}

/**
 * Generate an expired access token for testing
 */
export function generateExpiredAccessToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', {
    expiresIn: '-1s', // Already expired
  });
}

/**
 * Generate an expired refresh token for testing
 */
export function generateExpiredRefreshToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret',
    {
      expiresIn: '-1s', // Already expired
    }
  );
}

/**
 * Generate a token with invalid signature
 */
export function generateInvalidSignatureToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, 'wrong_secret', {
    expiresIn: '15m',
  });
}

/**
 * Decode a token without verification (for testing)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verify access token (for testing)
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(
    token,
    process.env.JWT_SECRET || 'test_secret'
  ) as TokenPayload;
}

/**
 * Verify refresh token (for testing)
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || 'test_refresh_secret'
  ) as TokenPayload;
}
