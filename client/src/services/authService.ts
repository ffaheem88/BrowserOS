/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  ApiError,
} from '../../../shared/types';
import { setTokens, getRefreshToken, clearTokens, getAccessToken } from '../utils/tokenStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const AUTH_BASE_URL = `${API_URL}/api/v1/auth`;

/**
 * Custom error class for API errors
 */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiRequestError(
        error.error.message || 'An error occurred',
        response.status,
        error.error.code,
        error.error.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof Error) {
      throw new ApiRequestError(
        error.message || 'Network error occurred',
        undefined,
        'NETWORK_ERROR'
      );
    }

    throw new ApiRequestError('An unexpected error occurred');
  }
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(`${AUTH_BASE_URL}/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store tokens
  setTokens(response.accessToken, response.refreshToken);

  return response;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>(`${AUTH_BASE_URL}/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Store tokens
  setTokens(response.accessToken, response.refreshToken);

  return response;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await apiRequest(`${AUTH_BASE_URL}/logout`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
        },
      });
    } catch (error) {
      // Even if logout fails on backend, clear local tokens
      console.error('Logout error:', error);
    }
  }

  // Clear tokens
  clearTokens();
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new ApiRequestError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
  }

  const response = await apiRequest<AuthResponse>(`${AUTH_BASE_URL}/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  // Store new tokens
  setTokens(response.accessToken, response.refreshToken);

  return response;
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new ApiRequestError('No access token available', 401, 'NO_ACCESS_TOKEN');
  }

  const response = await apiRequest<{ user: User }>(`${AUTH_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null && getRefreshToken() !== null;
}
