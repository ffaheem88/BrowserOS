/**
 * Desktop State Types
 * Type definitions for desktop, window, and application state management
 */

// Desktop Icon Types
export interface DesktopIcon {
  id: string;
  appId: string;
  icon: string;
  label: string;
  position: { x: number; y: number };
}

// Taskbar Configuration
export interface TaskbarConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  autohide: boolean;
  pinnedApps: string[];
}

// Desktop State
export interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  icons: DesktopIcon[];
  taskbar: TaskbarConfig;
  loading: boolean;
  error: string | null;
}

// Window State
export type WindowStateType = 'normal' | 'minimized' | 'maximized' | 'fullscreen';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  position: WindowPosition;
  size: WindowSize;
  state: WindowStateType;
  zIndex: number;
  focused: boolean;
  resizable: boolean;
  movable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}

// Application Manifest
export interface WindowConfig {
  defaultSize: WindowSize;
  minSize?: WindowSize;
  maxSize?: WindowSize;
  resizable: boolean;
  maximizable: boolean;
}

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon: string;
  category: string;
  permissions: string[];
  windowConfig: WindowConfig;
  component: React.ComponentType<AppComponentProps>;
}

// Application Component Props
export interface AppComponentProps {
  windowId: string;
  appId: string;
}

// Export AppComponentProps from types
export type { AppComponentProps as AppProps };

// Launch Configuration
export interface LaunchConfig {
  position?: WindowPosition;
  size?: WindowSize;
  state?: WindowStateType;
}
