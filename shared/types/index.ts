// Shared TypeScript types between frontend and backend

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Session types
export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface CreateSessionData {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// Window types
export interface WindowState {
  id: string;
  appId: string;
  title: string;
  position: Position;
  size: Size;
  state: WindowDisplayState;
  zIndex: number;
  focused: boolean;
  resizable: boolean;
  movable: boolean;
}

export type WindowDisplayState = 'normal' | 'minimized' | 'maximized' | 'fullscreen';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Desktop types
export interface DesktopState {
  wallpaper: string;
  theme: Theme;
  windows: WindowState[];
  taskbar: TaskbarConfig;
}

export type Theme = 'light' | 'dark';

export interface TaskbarConfig {
  position: TaskbarPosition;
  autohide: boolean;
  pinnedApps: string[];
}

export type TaskbarPosition = 'top' | 'bottom' | 'left' | 'right';

// Persisted state types
export interface PersistedDesktopState {
  userId: string;
  version: number;
  lastSaved: Date;
  desktop: DesktopState;
  appStates: Record<string, unknown>;
  settings: UserSettings;
}

export interface UserSettings {
  theme: Theme;
  wallpaper: string;
  taskbarPosition: TaskbarPosition;
  taskbarAutohide: boolean;
  language: string;
  notifications: boolean;
}

// Virtual File System types
export interface VFSNode {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  type: VFSNodeType;
  size: number;
  mimeType?: string;
  storageKey?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type VFSNodeType = 'file' | 'directory';

export interface CreateVFSNodeData {
  userId: string;
  parentId: string | null;
  name: string;
  type: VFSNodeType;
  mimeType?: string;
}

// Application types
export interface Application {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  iconUrl: string;
  manifest: AppManifest;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppManifest {
  permissions: Permission[];
  windowConfig: WindowConfig;
  entryPoint: string;
}

export type Permission =
  | 'filesystem.read'
  | 'filesystem.write'
  | 'network.access'
  | 'settings.read'
  | 'settings.write'
  | 'system.read'
  | 'applications.manage'
  | 'notes.read'
  | 'notes.write'
  | 'calendar.read'
  | 'calendar.write';

export interface WindowConfig {
  defaultSize: Size;
  minSize?: Size;
  maxSize?: Size;
  resizable: boolean;
  maximizable: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data: T;
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

// WebSocket event types
export type WSEvent =
  | { type: 'desktop:subscribe' }
  | { type: 'desktop:update'; payload: Partial<DesktopState> }
  | { type: 'desktop:sync'; payload: DesktopState }
  | { type: 'desktop:conflict'; payload: { version: number } }
  | { type: 'notification:new'; payload: Notification }
  | { type: 'system:message'; payload: { message: string } };

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
