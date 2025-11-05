# Week 2 Implementation Plan: Desktop Shell & Window Manager

**Sprint**: 1.2 - Desktop Environment Foundation
**Duration**: Week 2
**Status**: Planning Complete - Ready for Implementation
**Date**: 2025-10-06
**Tech Lead**: Head Coordinator Agent

---

## Executive Summary

Week 2 will deliver a fully functional desktop environment with a sophisticated window management system that rivals native OS experiences. This sprint builds upon the solid authentication foundation from Week 1 and introduces the core user-facing interface of BrowserOS.

**Key Deliverables**:
1. Complete desktop environment with wallpaper, icons, and taskbar
2. Advanced window manager with smooth drag, resize, minimize, maximize, and close operations
3. Application framework with base classes and registry system
4. Context menu system for desktop and window interactions
5. State persistence for desktop configuration and window positions

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Desktop Shell Layer                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Desktop Container (Full Screen)                           │ │
│  │  ├─ Wallpaper Layer                                        │ │
│  │  ├─ Desktop Icons Grid                                     │ │
│  │  ├─ Window Manager Container (z-index management)         │ │
│  │  │  └─ Multiple Window Instances                          │ │
│  │  ├─ Context Menu Layer                                     │ │
│  │  └─ Taskbar (docked at bottom/top/left/right)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      State Management Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Desktop Store│  │ Window Store │  │  App Registry│         │
│  │  (Zustand)   │  │  (Zustand)   │  │  (Zustand)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Application Framework                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  BaseApplication (Abstract Class)                          │ │
│  │  ├─ Lifecycle methods (init, mount, unmount, destroy)     │ │
│  │  ├─ Window configuration                                   │ │
│  │  ├─ State management hooks                                 │ │
│  │  └─ IPC/Event system                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
DesktopPage
├── DesktopShell
│   ├── WallpaperLayer
│   ├── DesktopIconsGrid
│   │   └── DesktopIcon (multiple)
│   ├── WindowManagerContainer
│   │   └── Window (multiple instances)
│   │       ├── WindowTitleBar
│   │       │   ├── WindowIcon
│   │       │   ├── WindowTitle
│   │       │   └── WindowControls (minimize, maximize, close)
│   │       ├── WindowContent
│   │       │   └── AppContainer (app-specific content)
│   │       └── WindowResizeHandles (8 directions)
│   ├── ContextMenuLayer
│   │   ├── DesktopContextMenu
│   │   └── WindowContextMenu
│   └── Taskbar
│       ├── StartButton
│       ├── TaskbarIcons (pinned + active)
│       ├── SystemTray
│       └── Clock
```

---

## Technical Specifications

### 1. Desktop Shell

**File**: `client/src/features/desktop/components/DesktopShell.tsx`

**Features**:
- Full-screen container with configurable wallpaper
- Grid-based layout for desktop icons
- Layer management for proper z-index stacking
- Context menu triggers on right-click
- Drag-and-drop support for icon positioning

**State Management**:
```typescript
interface DesktopState {
  wallpaper: string;
  theme: 'light' | 'dark';
  icons: DesktopIcon[];
  taskbarConfig: TaskbarConfig;
}

interface DesktopIcon {
  id: string;
  appId: string;
  label: string;
  icon: string;
  position: { x: number; y: number };
}
```

**Key Dependencies**:
- `react-draggable` for icon repositioning
- Radix UI Context Menu for right-click menus
- Zustand store for state management

### 2. Window Manager

**File**: `client/src/features/windows/components/WindowManager.tsx`

**Window Component**: `client/src/features/windows/components/Window.tsx`

**Features**:
- Draggable windows via title bar
- 8-direction resizing (corners + edges)
- Minimize/Maximize/Close operations
- Window focus management (z-index adjustment)
- Snap-to-edge functionality
- Double-click title bar to maximize
- Window state persistence

**Window State**:
```typescript
interface WindowState {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
  zIndex: number;
  focused: boolean;
  resizable: boolean;
  movable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}
```

**Interactions**:
- Click window to focus (brings to front)
- Drag title bar to move
- Drag resize handles to resize
- Click minimize to hide (moves to taskbar)
- Click maximize to fill screen (preserves normal state)
- Click close to destroy window instance
- Right-click title bar for window context menu

**Performance Considerations**:
- Use CSS transforms for smooth dragging (translate3d)
- Debounce resize events
- Virtual scrolling for window list if > 20 windows
- Lazy load window content

### 3. Application Framework

**Files**:
- `client/src/features/apps/base/BaseApplication.tsx`
- `client/src/features/apps/registry/AppRegistry.ts`
- `client/src/features/apps/hooks/useApplication.ts`

**Base Application Class**:
```typescript
abstract class BaseApplication {
  abstract id: string;
  abstract name: string;
  abstract icon: string;
  abstract version: string;

  // Window configuration
  windowConfig: WindowConfig = {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    maximizable: true,
    minimizable: true,
  };

  // Lifecycle hooks
  abstract onInit(): void | Promise<void>;
  abstract onMount(): void | Promise<void>;
  abstract onUnmount(): void | Promise<void>;
  abstract onDestroy(): void | Promise<void>;

  // State management
  protected state: Record<string, any> = {};
  protected setState(newState: Partial<typeof this.state>): void;

  // IPC/Events
  protected emit(event: string, data?: any): void;
  protected on(event: string, handler: Function): void;
  protected off(event: string, handler: Function): void;

  // Render method
  abstract render(): React.ReactNode;
}
```

**Application Registry**:
- Central registry for all available applications
- Singleton pattern for global access
- Methods: `register()`, `unregister()`, `get()`, `list()`, `launch()`
- Auto-discovery of installed apps

**Built-in Sample Apps** (for testing):
1. **Welcome App** - Simple info display
2. **File Explorer** - Basic file browser UI
3. **Settings** - Desktop configuration

### 4. Context Menu System

**Files**:
- `client/src/features/desktop/components/DesktopContextMenu.tsx`
- `client/src/features/windows/components/WindowContextMenu.tsx`

**Desktop Context Menu Options**:
- New Folder
- New File
- Paste (if clipboard has content)
- Refresh
- View Options (icon size, grid)
- Personalize (wallpaper, theme)

**Window Context Menu Options** (on title bar):
- Restore / Maximize
- Minimize
- Move
- Resize
- Always on Top (toggle)
- Close

**Implementation**:
- Use Radix UI `@radix-ui/react-context-menu`
- Portal-based rendering for proper layering
- Keyboard navigation support
- Close on outside click or Escape key

### 5. Taskbar

**File**: `client/src/features/desktop/components/Taskbar.tsx`

**Features**:
- Configurable position (top/bottom/left/right)
- Start button with app launcher
- Pinned app icons
- Active window indicators
- System tray (clock, notifications, system icons)
- Auto-hide option

**Components**:
- `StartButton.tsx` - Opens app launcher menu
- `TaskbarIcon.tsx` - Represents app in taskbar
- `SystemTray.tsx` - Clock and system indicators
- `AppLauncher.tsx` - Grid of available apps

---

## State Management Architecture

### Desktop Store (Zustand)

**File**: `client/src/stores/desktopStore.ts`

```typescript
interface DesktopStore {
  // State
  wallpaper: string;
  theme: 'light' | 'dark';
  icons: DesktopIcon[];
  taskbar: TaskbarConfig;

  // Actions
  setWallpaper: (url: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addIcon: (icon: DesktopIcon) => void;
  removeIcon: (id: string) => void;
  updateIconPosition: (id: string, position: Position) => void;
  updateTaskbarConfig: (config: Partial<TaskbarConfig>) => void;

  // Persistence
  loadDesktopState: () => Promise<void>;
  saveDesktopState: () => Promise<void>;
}
```

### Window Store (Zustand)

**File**: `client/src/stores/windowStore.ts`

```typescript
interface WindowStore {
  // State
  windows: Record<string, WindowState>;
  focusedWindowId: string | null;
  nextZIndex: number;

  // Actions
  createWindow: (appId: string, config?: Partial<WindowState>) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: Position) => void;
  updateWindowSize: (id: string, size: Size) => void;

  // Queries
  getWindow: (id: string) => WindowState | null;
  getVisibleWindows: () => WindowState[];
  getMinimizedWindows: () => WindowState[];
}
```

### App Registry Store (Zustand)

**File**: `client/src/stores/appRegistryStore.ts`

```typescript
interface AppRegistryStore {
  // State
  apps: Record<string, AppManifest>;
  installedApps: string[];

  // Actions
  registerApp: (manifest: AppManifest) => void;
  unregisterApp: (appId: string) => void;
  launchApp: (appId: string, config?: LaunchConfig) => Promise<string>;

  // Queries
  getApp: (appId: string) => AppManifest | null;
  listApps: () => AppManifest[];
  getInstalledApps: () => AppManifest[];
}
```

---

## Backend API Endpoints

### Desktop State Management

**Base URL**: `/api/desktop`

#### GET `/api/desktop/state`
Get user's desktop state (wallpaper, icons, taskbar config)

**Response**:
```json
{
  "data": {
    "userId": "uuid",
    "version": 1,
    "desktop": {
      "wallpaper": "url",
      "theme": "dark",
      "icons": [...],
      "taskbar": {...}
    },
    "lastSaved": "2025-10-06T10:00:00Z"
  }
}
```

#### PUT `/api/desktop/state`
Update desktop state

**Request Body**:
```json
{
  "version": 1,
  "desktop": {
    "wallpaper": "url",
    "theme": "dark",
    "icons": [...],
    "taskbar": {...}
  }
}
```

#### POST `/api/desktop/windows/state`
Save window positions and states

**Request Body**:
```json
{
  "windows": [
    {
      "appId": "app-id",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 800, "height": 600 },
      "state": "normal"
    }
  ]
}
```

---

## Database Schema Updates

**Table**: `window_states` (new)

```sql
CREATE TABLE window_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id VARCHAR(100) NOT NULL,
  position JSONB NOT NULL,
  size JSONB NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('normal', 'minimized', 'maximized')),
  z_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, app_id)
);

CREATE INDEX idx_window_states_user_id ON window_states(user_id);
```

---

## Testing Strategy

### Unit Tests
- Desktop component rendering
- Window drag and resize logic
- State management actions
- Application lifecycle hooks

### Integration Tests
- Desktop to window manager communication
- Window focus management
- State persistence round-trip
- App launch and close flow

### E2E Tests (Playwright)
- User logs in and sees desktop
- User can open, drag, resize, minimize, maximize, close windows
- Desktop state persists across sessions
- Context menus appear and function correctly

**Test Coverage Goal**: 90%+ for core desktop and window components

---

## Performance Targets

- Desktop load time: < 500ms
- Window open animation: 60fps
- Drag operations: < 16ms per frame (60fps)
- State save debounce: 2 seconds after last change
- Support 20+ simultaneous windows without degradation

---

## Agent Task Assignments

### Frontend Developer Agent
**Priority**: CRITICAL
**Duration**: 3-4 days

**Tasks**:
1. Implement Desktop Shell component with wallpaper and icon grid
2. Build Window Manager with drag and resize functionality
3. Create Window component with title bar and controls
4. Implement smooth animations using CSS transforms
5. Add window focus management and z-index handling
6. Create Taskbar component with pinned and active apps
7. Integrate Context Menu components
8. Polish UI/UX to native OS quality

**Deliverables**:
- Fully functional desktop environment
- Smooth 60fps window operations
- Beautiful animations and transitions
- Responsive layout for different screen sizes

### Backend Logic Expert Agent
**Priority**: HIGH
**Duration**: 2-3 days

**Tasks**:
1. Create Zustand stores (desktopStore, windowStore, appRegistryStore)
2. Implement Application Registry system
3. Build BaseApplication abstract class and lifecycle
4. Create application launch and management logic
5. Implement state persistence hooks with debouncing
6. Add WebSocket event handlers for real-time sync
7. Create sample applications (Welcome, File Explorer, Settings)

**Deliverables**:
- Complete state management architecture
- Working application framework
- 3 sample applications for testing
- Real-time state synchronization

### Backend Database Agent
**Priority**: HIGH
**Duration**: 1-2 days

**Tasks**:
1. Create desktop state API endpoints (`/api/desktop/*`)
2. Implement window state persistence
3. Add database migration for window_states table
4. Create services for desktop state CRUD operations
5. Implement optimistic locking for concurrent updates
6. Add caching layer with Redis for frequent reads

**Deliverables**:
- Complete REST API for desktop state
- Database schema for window persistence
- Performant caching strategy

### QA Tester Agent
**Priority**: HIGH
**Duration**: 2 days (concurrent with development)

**Tasks**:
1. Write unit tests for desktop components
2. Create integration tests for window manager
3. Build E2E test suite with Playwright
4. Test window operations (drag, resize, minimize, maximize)
5. Verify state persistence across sessions
6. Performance testing for multiple windows
7. Cross-browser compatibility testing

**Deliverables**:
- 90%+ test coverage for desktop features
- E2E test suite covering all user workflows
- Performance benchmark report
- Bug reports with reproduction steps

---

## Implementation Timeline

### Day 1-2: Foundation
- Desktop Shell UI structure
- Basic window rendering
- State management stores setup
- Database schema and API endpoints

### Day 3-4: Core Functionality
- Window drag and resize implementation
- Window state management (minimize, maximize, close)
- Desktop icons and interaction
- Application framework base classes

### Day 5-6: Polish & Integration
- Taskbar implementation
- Context menus
- Animations and transitions
- Sample applications
- State persistence integration

### Day 7: Testing & Refinement
- Comprehensive testing
- Bug fixes
- Performance optimization
- Documentation updates

---

## Success Criteria

- [ ] Desktop loads in < 500ms after authentication
- [ ] Windows can be dragged smoothly at 60fps
- [ ] Windows can be resized from all 8 directions
- [ ] Minimize, maximize, restore, close all work correctly
- [ ] Window focus management works (click to bring to front)
- [ ] Desktop icons can be repositioned
- [ ] Taskbar shows active windows
- [ ] Context menus appear on right-click
- [ ] Desktop state persists across browser sessions
- [ ] At least 3 sample applications can be launched
- [ ] 90%+ test coverage achieved
- [ ] No memory leaks with 20+ windows open

---

## Risk Mitigation

### Risk: Performance degradation with many windows
**Mitigation**:
- Virtual scrolling for window list
- Lazy loading of window content
- CSS transform optimization
- React.memo and useMemo for expensive operations

### Risk: State sync conflicts
**Mitigation**:
- Optimistic locking with version numbers
- Conflict resolution strategy (last-write-wins with merge)
- WebSocket for real-time state sync

### Risk: Browser compatibility issues
**Mitigation**:
- Cross-browser testing matrix
- Polyfills for older browsers
- Graceful degradation strategy

---

## Next Steps (Week 3 Preview)

After Week 2 completion, Week 3 will focus on:
- Virtual File System implementation
- File Explorer application
- Drag-and-drop file operations
- Cloud storage integration (S3/MinIO)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Status**: Ready for Implementation
