/**
 * Token Storage Utility
 * Manages access and refresh token storage in localStorage
 */

const ACCESS_TOKEN_KEY = 'browseros_access_token';
const REFRESH_TOKEN_KEY = 'browseros_refresh_token';
const USER_KEY = 'browseros_user';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Store authentication tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get both tokens
 */
export function getTokens(): StoredTokens | null {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
}

/**
 * Clear all stored tokens
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Store user data
 */
export function setUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getUser<T>(): T | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as T;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (has valid tokens)
 */
export function isAuthenticated(): boolean {
  return getTokens() !== null;
}
