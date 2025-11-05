import type { AuthResponse, User } from '@/shared/types/index.js';
import type { RegisterInput, LoginInput } from '../utils/validation.js';
import { UserModel } from '../models/User.js';
import { SessionModel } from '../models/Session.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  calculateTokenExpiry,
} from '../utils/jwt.js';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  InvalidCredentialsError,
  DuplicateRecordError,
  UnauthorizedError,
  NotFoundError,
} from '../utils/errors.js';

/**
 * Authentication Service
 * Handles all authentication business logic
 */
export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(data.email);
      if (existingUser) {
        throw new DuplicateRecordError('User with this email already exists');
      }

      // Hash password
      const passwordHash = await hashPassword(data.password);

      // Create user
      const user = await UserModel.create({
        email: data.email,
        password: passwordHash,
        displayName: data.displayName,
      });

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id, user.email);

      // Create session
      const expiresAt = calculateTokenExpiry(config.JWT_REFRESH_EXPIRES_IN);
      await SessionModel.create({
        userId: user.id,
        refreshToken,
        expiresAt,
      });

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
      });

      // Remove sensitive data from response
      const { ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration failed', { error, email: data.email });
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginInput, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
    try {
      // Find user by email with password
      const user = await UserModel.findByEmailWithPassword(credentials.email);

      if (!user) {
        throw new InvalidCredentialsError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await verifyPassword(credentials.password, user.password_hash);

      if (!isPasswordValid) {
        throw new InvalidCredentialsError('Invalid email or password');
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id, user.email);

      // Create session
      const expiresAt = calculateTokenExpiry(config.JWT_REFRESH_EXPIRES_IN);
      await SessionModel.create({
        userId: user.id,
        refreshToken,
        expiresAt,
        userAgent,
        ipAddress,
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
      });

      // Remove password from response
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login failed', { error, email: credentials.email });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Find and delete session
      await SessionModel.deleteByRefreshToken(refreshToken);

      logger.info('User logged out successfully');
    } catch (error) {
      if (error instanceof NotFoundError) {
        // Session already deleted or doesn't exist - that's okay
        logger.debug('Logout: session not found (may have already expired)');
        return;
      }
      logger.error('Logout failed', { error });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Find session
      const session = await SessionModel.findByRefreshToken(refreshToken);

      if (!session) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Find user
      const user = await UserModel.findById(payload.userId);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id, user.email);

      // Delete old session and create new one (token rotation)
      await SessionModel.deleteByRefreshToken(refreshToken);

      const expiresAt = calculateTokenExpiry(config.JWT_REFRESH_EXPIRES_IN);
      await SessionModel.create({
        userId: user.id,
        refreshToken: newRefreshToken,
        expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
      });

      logger.info('Token refreshed successfully', { userId: user.id });

      return {
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh failed', { error });
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<User> {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Failed to get current user', { error, userId });
      throw error;
    }
  }

  /**
   * Cleanup expired sessions (scheduled task)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const count = await SessionModel.deleteExpired();
      if (count > 0) {
        logger.info('Cleaned up expired sessions', { count });
      }
      return count;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
