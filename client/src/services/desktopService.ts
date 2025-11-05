/**
 * Desktop Service
 * Handles all desktop-related API calls
 */

import { getAccessToken } from '../utils/tokenStorage';
import { ApiRequestError } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DESKTOP_BASE_URL = `${API_URL}/api/v1/desktop`;

/**
 * Desktop state interface
 */
export interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  taskbar: {
    position: 'top' | 'bottom' | 'left' | 'right';
    autohide: boolean;
    pinnedApps: string[];
  };
}

/**
 * Desktop state response from API
 */
interface DesktopStateResponse {
  state: DesktopState;
  version: number;
  lastSaved: string;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new ApiRequestError('No access token available', 401, 'NO_ACCESS_TOKEN');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiRequestError(
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.code,
        data.error?.details
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

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
 * Get desktop state from server
 */
export async function getDesktopState(): Promise<DesktopStateResponse> {
  return apiRequest<DesktopStateResponse>(`${DESKTOP_BASE_URL}/state`, {
    method: 'GET',
  });
}

/**
 * Save desktop state to server
 */
export async function saveDesktopState(
  state: DesktopState,
  version?: number
): Promise<DesktopStateResponse> {
  return apiRequest<DesktopStateResponse>(`${DESKTOP_BASE_URL}/state`, {
    method: 'PUT',
    body: JSON.stringify({ state, version }),
  });
}

/**
 * Reset desktop to default state
 */
export async function resetDesktop(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${DESKTOP_BASE_URL}/reset`, {
    method: 'POST',
  });
}

/**
 * Window state interface
 */
export interface WindowState {
  id?: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
  zIndex?: number;
  focused?: boolean;
  resizable?: boolean;
  movable?: boolean;
}

/**
 * Get all windows from server
 */
export async function getWindows(): Promise<{ windows: WindowState[] }> {
  return apiRequest<{ windows: WindowState[] }>(`${DESKTOP_BASE_URL}/windows`, {
    method: 'GET',
  });
}

/**
 * Save single window state
 */
export async function saveWindow(window: WindowState): Promise<{ window: WindowState }> {
  return apiRequest<{ window: WindowState }>(`${DESKTOP_BASE_URL}/windows`, {
    method: 'POST',
    body: JSON.stringify(window),
  });
}

/**
 * Save multiple windows at once
 */
export async function saveWindows(windows: WindowState[]): Promise<{ windows: WindowState[] }> {
  return apiRequest<{ windows: WindowState[] }>(`${DESKTOP_BASE_URL}/windows/bulk`, {
    method: 'POST',
    body: JSON.stringify({ windows }),
  });
}

/**
 * Delete a window
 */
export async function deleteWindow(windowId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${DESKTOP_BASE_URL}/windows/${windowId}`, {
    method: 'DELETE',
  });
}

/**
 * Close all windows
 */
export async function closeAllWindows(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${DESKTOP_BASE_URL}/windows`, {
    method: 'DELETE',
  });
}

/**
 * Bring window to front
 */
export async function bringWindowToFront(windowId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${DESKTOP_BASE_URL}/windows/${windowId}/focus`, {
    method: 'POST',
  });
}
