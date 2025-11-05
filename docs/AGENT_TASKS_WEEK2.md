# Week 2 Agent Task Assignments

**Sprint**: 1.2 - Desktop Shell & Window Manager
**Date**: 2025-10-06
**Coordinator**: Tech Lead Agent

---

## Task Distribution Strategy

This sprint uses **parallel development** with clear interface boundaries to maximize efficiency. All agents should start work simultaneously on Day 1.

**Critical Path**:
1. State Management Stores (Backend Logic) → Required by all
2. Desktop Shell UI (Frontend) + Window Manager (Frontend) → Core experience
3. API Endpoints (Backend Database) → Required for persistence
4. Testing (QA) → Continuous throughout

**Integration Points**:
- Day 3: State stores integration with UI components
- Day 4: API integration for persistence
- Day 5: Full system integration testing

---

## Agent 1: Frontend Developer

**Agent Profile**: React/TypeScript expert, UI/UX specialist, animation expert
**Priority**: CRITICAL
**Estimated Duration**: 3-4 days
**Status**: READY TO START

### Context
You are building the visual heart of BrowserOS - the desktop environment that users will interact with every day. Your goal is to create an experience that feels as smooth and polished as native operating systems like Windows 11 or macOS. Every pixel, animation, and interaction matters.

### Prerequisites
- Read `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md`
- Review existing UI components in `/c/Codes/BrowserOS/client/src/components/ui/`
- Check Tailwind configuration and design system
- Ensure `react-draggable` and `react-resizable` packages are installed

### Task 1.1: Desktop Shell Foundation
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/features/desktop/components/DesktopShell.tsx`

**Requirements**:
- Create full-screen desktop container
- Implement wallpaper layer (background image with cover/contain options)
- Add desktop icons grid with configurable spacing
- Support theme switching (light/dark)
- Implement proper layering: wallpaper → icons → windows → menus

**Technical Details**:
```typescript
interface DesktopShellProps {
  wallpaper?: string;
  theme?: 'light' | 'dark';
  children?: React.ReactNode;
}

export function DesktopShell({ wallpaper, theme, children }: DesktopShellProps) {
  // Implementation
}
```

**Styling Requirements**:
- Full viewport height (100vh)
- Wallpaper with `background-size: cover` and `background-position: center`
- Prevent text selection on desktop (user-select: none)
- Smooth theme transitions (300ms)

**Acceptance Criteria**:
- [ ] Desktop fills entire screen
- [ ] Wallpaper displays correctly
- [ ] Theme switching works without flicker
- [ ] Proper z-index layering

### Task 1.2: Desktop Icons Component
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/features/desktop/components/DesktopIcon.tsx`

**Requirements**:
- Create draggable desktop icon component
- Support double-click to launch app
- Support right-click for context menu
- Icon with label underneath (similar to Windows/macOS)
- Highlight on hover and selection

**Technical Details**:
```typescript
interface DesktopIconProps {
  id: string;
  appId: string;
  icon: string; // URL or icon component
  label: string;
  position: { x: number; y: number };
  onDoubleClick: (appId: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
}
```

**Implementation Notes**:
- Use `react-draggable` for positioning
- Grid snapping (optional, but nice to have)
- Store position in desktop store
- Icon size: 64x64px, label below with ellipsis for long names

**Acceptance Criteria**:
- [ ] Icons can be dragged and repositioned
- [ ] Double-click launches application
- [ ] Right-click opens context menu
- [ ] Selection highlighting works
- [ ] Labels truncate properly

### Task 1.3: Window Component
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/features/windows/components/Window.tsx`

**Requirements**:
- Create draggable, resizable window component
- Implement title bar with icon, title, and control buttons
- 8-direction resizing (corners + edges)
- Window states: normal, minimized, maximized
- Click to focus (brings to front via z-index)
- Smooth animations for all state changes

**Technical Details**:
```typescript
interface WindowProps {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'normal' | 'minimized' | 'maximized';
  zIndex: number;
  focused: boolean;
  resizable?: boolean;
  movable?: boolean;
  children: React.ReactNode;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onFocus: (id: string) => void;
  onDragEnd: (id: string, position: { x: number; y: number }) => void;
  onResizeEnd: (id: string, size: { width: number; height: number }) => void;
}
```

**Structure**:
```tsx
<div className="window" style={{ zIndex }}>
  <WindowTitleBar
    title={title}
    icon={icon}
    onMinimize={handleMinimize}
    onMaximize={handleMaximize}
    onClose={handleClose}
    draggable={movable}
  />
  <WindowContent>
    {children}
  </WindowContent>
  {resizable && <WindowResizeHandles />}
</div>
```

**Performance Requirements**:
- Use CSS transforms for dragging (translate3d)
- Hardware acceleration for smooth 60fps
- Debounce resize events (16ms max)
- React.memo for window components

**Acceptance Criteria**:
- [ ] Windows can be dragged by title bar
- [ ] Windows can be resized from all 8 directions
- [ ] Minimize animation and state change
- [ ] Maximize toggles between full screen and normal
- [ ] Close removes window from DOM
- [ ] Focus management works correctly
- [ ] All operations run at 60fps

### Task 1.4: Window Title Bar
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/features/windows/components/WindowTitleBar.tsx`

**Requirements**:
- Display app icon, title, and control buttons
- Draggable handle for moving window
- Double-click to maximize/restore
- Right-click for window context menu

**Layout**:
```
[Icon] [Title..................] [−] [□] [×]
```

**Control Buttons**:
- Minimize (−): Minimizes window to taskbar
- Maximize (□): Toggles between maximized and normal
- Close (×): Closes window

**Styling**:
- Height: 32px
- Background: theme-based gradient or solid color
- Hover effects on buttons
- Active state when window is focused

**Acceptance Criteria**:
- [ ] Title bar displays all elements correctly
- [ ] Dragging works smoothly
- [ ] Double-click toggles maximize
- [ ] Control buttons respond to clicks
- [ ] Right-click opens context menu

### Task 1.5: Window Manager Container
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/features/windows/components/WindowManager.tsx`

**Requirements**:
- Container for all active windows
- Manages z-index stacking
- Focus management (click any part of window to focus)
- Integration with window store

**Technical Details**:
```typescript
export function WindowManager() {
  const windows = useWindowStore(state => state.windows);
  const focusWindow = useWindowStore(state => state.focusWindow);
  const closeWindow = useWindowStore(state => state.closeWindow);
  // ... other actions

  return (
    <div className="window-manager">
      {Object.values(windows).map(window => (
        window.state !== 'minimized' && (
          <Window
            key={window.id}
            {...window}
            onFocus={focusWindow}
            onClose={closeWindow}
            // ... other handlers
          />
        )
      ))}
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] All active windows render correctly
- [ ] Z-index management works (focused window on top)
- [ ] Minimized windows don't render
- [ ] Window state updates propagate correctly

### Task 1.6: Taskbar Component
**Priority**: P1
**File**: `/c/Codes/BrowserOS/client/src/features/desktop/components/Taskbar.tsx`

**Requirements**:
- Display at bottom of screen (configurable position later)
- Start button on left
- Pinned + active app icons in center
- System tray (clock) on right
- Click app icon to restore minimized window or focus
- Right-click for context menu

**Layout**:
```
[Start] [App1] [App2] [App3*] [App4]        [🔔] [12:34 PM]
```
(* indicates active/focused)

**Technical Details**:
- Height: 48px
- Fixed positioning
- Blur backdrop effect
- Hover animations for icons
- Badge for notifications

**Acceptance Criteria**:
- [ ] Taskbar displays at bottom
- [ ] Start button opens app launcher
- [ ] App icons show active windows
- [ ] Click icon focuses/restores window
- [ ] System tray shows time
- [ ] Visual feedback on hover

### Task 1.7: Context Menus
**Priority**: P1
**Files**:
- `/c/Codes/BrowserOS/client/src/features/desktop/components/DesktopContextMenu.tsx`
- `/c/Codes/BrowserOS/client/src/features/windows/components/WindowContextMenu.tsx`

**Requirements**:
- Use Radix UI Context Menu component
- Desktop right-click menu (personalize, refresh, etc.)
- Window title bar right-click menu (restore, minimize, close, etc.)
- Keyboard navigation support

**Desktop Menu Items**:
- View → Icon size, sort by
- Refresh
- Paste (if clipboard has content)
- New → Folder, File
- Personalize

**Window Menu Items**:
- Restore / Maximize
- Minimize
- Move
- Resize
- Always on Top (future)
- Close

**Acceptance Criteria**:
- [ ] Right-click opens context menu
- [ ] Menu items trigger correct actions
- [ ] Keyboard navigation works
- [ ] Closes on outside click or Escape

### Task 1.8: Animations and Transitions
**Priority**: P1
**File**: `/c/Codes/BrowserOS/client/src/styles/animations.css`

**Requirements**:
- Window open animation (scale + fade in)
- Window close animation (scale + fade out)
- Minimize animation (shrink to taskbar icon)
- Maximize animation (expand to full screen)
- Smooth transitions for all state changes

**Animation Specs**:
- Duration: 200-300ms
- Easing: ease-out for most, ease-in-out for complex
- Use CSS transforms for performance
- Respect user's motion preferences (prefers-reduced-motion)

**Acceptance Criteria**:
- [ ] All window operations are smoothly animated
- [ ] Animations run at 60fps
- [ ] Reduced motion respected
- [ ] No janky transitions

### Task 1.9: Responsive Layout
**Priority**: P2
**Impact**: All components

**Requirements**:
- Desktop works on different screen sizes (1024px minimum)
- Windows constrained to viewport bounds
- Taskbar responsive to screen width
- Handle portrait/landscape orientations

**Acceptance Criteria**:
- [ ] Desktop works on 1024x768 and larger
- [ ] Windows don't render off-screen
- [ ] UI scales appropriately

### Deliverables Summary
- [ ] Complete Desktop Shell with wallpaper and icons
- [ ] Fully functional Window component with drag & resize
- [ ] Window Manager container with focus management
- [ ] Taskbar with app icons and system tray
- [ ] Context menus for desktop and windows
- [ ] Smooth animations throughout
- [ ] Responsive layout
- [ ] 60fps performance for all interactions

### Testing Requirements
- Write unit tests for each component
- Test drag and resize edge cases
- Test window state transitions
- Test focus management with multiple windows
- Verify animations work correctly

---

## Agent 2: Backend Logic Expert

**Agent Profile**: State management expert, application architecture specialist
**Priority**: HIGH
**Estimated Duration**: 2-3 days
**Status**: READY TO START

### Context
You are building the brain of BrowserOS - the state management and application framework that powers the desktop experience. Your work enables all other features and must be robust, performant, and extensible.

### Prerequisites
- Read `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md`
- Review Zustand documentation
- Check existing types in `/c/Codes/BrowserOS/shared/types/index.ts`
- Understand React lifecycle and hooks

### Task 2.1: Desktop Store (Zustand)
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/stores/desktopStore.ts`

**Requirements**:
- Create Zustand store for desktop state
- Manage wallpaper, theme, icons, taskbar config
- Actions for updating desktop settings
- Persistence integration with backend API
- Optimistic updates with rollback on error

**Implementation**:
```typescript
interface DesktopIcon {
  id: string;
  appId: string;
  icon: string;
  label: string;
  position: { x: number; y: number };
}

interface TaskbarConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  autohide: boolean;
  pinnedApps: string[];
}

interface DesktopState {
  // State
  wallpaper: string;
  theme: 'light' | 'dark';
  icons: DesktopIcon[];
  taskbar: TaskbarConfig;
  loading: boolean;
  error: string | null;

  // Actions
  setWallpaper: (url: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addIcon: (icon: DesktopIcon) => void;
  removeIcon: (id: string) => void;
  updateIconPosition: (id: string, position: { x: number; y: number }) => void;
  updateTaskbarConfig: (config: Partial<TaskbarConfig>) => void;

  // Persistence
  loadDesktopState: () => Promise<void>;
  saveDesktopState: () => Promise<void>;

  // Reset
  resetDesktop: () => void;
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
  // Default state
  wallpaper: '/assets/wallpapers/default.jpg',
  theme: 'dark',
  icons: [],
  taskbar: {
    position: 'bottom',
    autohide: false,
    pinnedApps: []
  },
  loading: false,
  error: null,

  // Actions implementation
  setWallpaper: (url) => {
    set({ wallpaper: url });
    get().saveDesktopState(); // Auto-save
  },

  // ... implement all actions
}));
```

**Persistence Strategy**:
- Debounce saves (2 seconds after last change)
- Use `localStorage` for immediate caching
- Sync with backend API for persistence
- Handle conflicts with version numbers

**Acceptance Criteria**:
- [ ] All state actions work correctly
- [ ] State persists to localStorage
- [ ] Backend sync works (when API ready)
- [ ] Optimistic updates with error handling
- [ ] No unnecessary re-renders

### Task 2.2: Window Store (Zustand)
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/stores/windowStore.ts`

**Requirements**:
- Manage all active windows
- Track focused window
- Handle window lifecycle (create, update, destroy)
- Z-index management
- Window state persistence

**Implementation**:
```typescript
interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon?: string;
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
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  updateWindowTitle: (id: string, title: string) => void;

  // Queries
  getWindow: (id: string) => WindowState | null;
  getVisibleWindows: () => WindowState[];
  getMinimizedWindows: () => WindowState[];
  getWindowsByApp: (appId: string) => WindowState[];

  // Persistence
  saveWindowState: () => Promise<void>;
  loadWindowState: () => Promise<void>;
}
```

**Z-Index Management**:
- Base z-index: 100
- Focused window always has highest z-index
- When window focused, set zIndex = nextZIndex++
- Recompact z-indices when nextZIndex > 1000

**Window Creation**:
```typescript
createWindow: (appId, config) => {
  const app = useAppRegistryStore.getState().getApp(appId);
  if (!app) throw new Error(`App ${appId} not found`);

  const id = `window-${Date.now()}-${Math.random()}`;
  const defaultPosition = calculateDefaultPosition(); // Cascade windows
  const defaultSize = app.manifest.windowConfig.defaultSize;

  const window: WindowState = {
    id,
    appId,
    title: app.name,
    icon: app.iconUrl,
    position: config?.position || defaultPosition,
    size: config?.size || defaultSize,
    state: 'normal',
    zIndex: get().nextZIndex++,
    focused: true,
    resizable: app.manifest.windowConfig.resizable,
    movable: true,
    minimizable: true,
    maximizable: app.manifest.windowConfig.maximizable,
    ...config
  };

  set(state => ({
    windows: { ...state.windows, [id]: window },
    focusedWindowId: id,
    nextZIndex: state.nextZIndex + 1
  }));

  return id;
}
```

**Acceptance Criteria**:
- [ ] Windows can be created with unique IDs
- [ ] Focus management works correctly
- [ ] Z-index handling prevents overlaps
- [ ] Window state transitions work
- [ ] Queries return correct results
- [ ] State persistence works

### Task 2.3: App Registry Store (Zustand)
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/src/stores/appRegistryStore.ts`

**Requirements**:
- Central registry for all available apps
- App manifest storage
- App launch logic
- Integration with window store

**Implementation**:
```typescript
interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon: string;
  category: string;
  manifest: {
    permissions: string[];
    windowConfig: {
      defaultSize: { width: number; height: number };
      minSize?: { width: number; height: number };
      maxSize?: { width: number; height: number };
      resizable: boolean;
      maximizable: boolean;
    };
    entryPoint: string; // Component path
  };
}

interface AppRegistryStore {
  // State
  apps: Record<string, AppManifest>;
  installedApps: string[];
  loading: boolean;

  // Actions
  registerApp: (manifest: AppManifest) => void;
  unregisterApp: (appId: string) => void;
  launchApp: (appId: string, config?: LaunchConfig) => Promise<string>;

  // Queries
  getApp: (appId: string) => AppManifest | null;
  listApps: (category?: string) => AppManifest[];
  searchApps: (query: string) => AppManifest[];

  // Initialization
  loadSystemApps: () => Promise<void>;
}
```

**Launch Logic**:
```typescript
launchApp: async (appId, config) => {
  const app = get().getApp(appId);
  if (!app) throw new Error(`App ${appId} not found`);

  // Create window instance
  const windowId = useWindowStore.getState().createWindow(appId, config);

  // Initialize app instance (if has initialization logic)
  // Future: Load app bundle dynamically

  return windowId;
}
```

**Acceptance Criteria**:
- [ ] Apps can be registered and unregistered
- [ ] Launch creates window with app content
- [ ] Search and filtering work
- [ ] System apps load on initialization

### Task 2.4: Base Application Class
**Priority**: P1
**File**: `/c/Codes/BrowserOS/client/src/features/apps/base/BaseApplication.tsx`

**Requirements**:
- Abstract base class for all applications
- Lifecycle hooks (init, mount, unmount, destroy)
- State management helpers
- Window communication interface

**Implementation**:
```typescript
export interface IApplication {
  // Metadata
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly icon: string;

  // Window configuration
  windowConfig: WindowConfig;

  // Lifecycle
  onInit(): void | Promise<void>;
  onMount(): void | Promise<void>;
  onUnmount(): void | Promise<void>;
  onDestroy(): void | Promise<void>;

  // Render
  render(): React.ReactNode;
}

export abstract class BaseApplication implements IApplication {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly icon: string;

  windowConfig: WindowConfig = {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 400, height: 300 },
    resizable: true,
    maximizable: true,
  };

  protected state: Record<string, any> = {};
  protected windowId: string = '';

  constructor(windowId: string) {
    this.windowId = windowId;
  }

  // Default lifecycle implementations
  async onInit() {}
  async onMount() {}
  async onUnmount() {}
  async onDestroy() {}

  // State management
  protected setState(newState: Partial<typeof this.state>) {
    this.state = { ...this.state, ...newState };
    this.forceUpdate(); // Trigger re-render
  }

  protected getState() {
    return this.state;
  }

  // Window communication
  protected updateWindowTitle(title: string) {
    useWindowStore.getState().updateWindowTitle(this.windowId, title);
  }

  protected closeWindow() {
    useWindowStore.getState().closeWindow(this.windowId);
  }

  // Must be implemented by subclass
  abstract render(): React.ReactNode;

  // Force update helper
  private forceUpdate() {
    // Implementation depends on how we mount apps
  }
}
```

**Acceptance Criteria**:
- [ ] Base class provides all required interfaces
- [ ] Lifecycle hooks can be overridden
- [ ] State management works
- [ ] Window communication works

### Task 2.5: Sample Applications
**Priority**: P1
**Files**:
- `/c/Codes/BrowserOS/client/src/features/apps/WelcomeApp/index.tsx`
- `/c/Codes/BrowserOS/client/src/features/apps/SettingsApp/index.tsx`
- `/c/Codes/BrowserOS/client/src/features/apps/AboutApp/index.tsx`

**Requirements**:
- Create 3 simple apps for testing window manager
- Each app extends BaseApplication
- Each app has different window sizes
- Register apps in app registry on load

**Welcome App**:
- Display welcome message and BrowserOS info
- Size: 600x400
- Non-resizable

**Settings App**:
- Desktop settings (wallpaper, theme)
- Size: 800x600
- Resizable

**About App**:
- Show version, credits
- Size: 400x300
- Non-resizable

**Acceptance Criteria**:
- [ ] All 3 apps can be launched
- [ ] Apps render in windows correctly
- [ ] Each app demonstrates different configs

### Task 2.6: Hooks and Utilities
**Priority**: P1
**Files**:
- `/c/Codes/BrowserOS/client/src/hooks/useDesktop.ts`
- `/c/Codes/BrowserOS/client/src/hooks/useWindow.ts`
- `/c/Codes/BrowserOS/client/src/hooks/useAppRegistry.ts`

**Requirements**:
- Create convenience hooks for store access
- Add derived state and computed values
- Memoization for performance

**Example**:
```typescript
// useDesktop.ts
export function useDesktop() {
  const store = useDesktopStore();

  const setDarkMode = useCallback(() => {
    store.setTheme('dark');
  }, [store]);

  const setLightMode = useCallback(() => {
    store.setTheme('light');
  }, [store]);

  const toggleTheme = useCallback(() => {
    store.setTheme(store.theme === 'dark' ? 'light' : 'dark');
  }, [store]);

  return {
    ...store,
    setDarkMode,
    setLightMode,
    toggleTheme,
  };
}
```

**Acceptance Criteria**:
- [ ] Hooks provide clean API
- [ ] No unnecessary re-renders
- [ ] Proper memoization

### Task 2.7: WebSocket Integration (Optional)
**Priority**: P2
**File**: `/c/Codes/BrowserOS/client/src/services/websocket.ts`

**Requirements**:
- Set up Socket.io client
- Handle real-time desktop state sync
- Reconnection logic

**Acceptance Criteria**:
- [ ] WebSocket connects successfully
- [ ] State changes sync in real-time
- [ ] Reconnection works after disconnect

### Deliverables Summary
- [ ] Complete Zustand stores (desktop, window, app registry)
- [ ] Base application class and framework
- [ ] 3 sample applications
- [ ] Convenience hooks for store access
- [ ] State persistence logic
- [ ] WebSocket integration (optional)

### Testing Requirements
- Unit tests for all store actions
- Test window lifecycle management
- Test z-index and focus logic
- Test app launch and close flow

---

## Agent 3: Backend Database

**Agent Profile**: Node.js/Express expert, database specialist, API designer
**Priority**: HIGH
**Estimated Duration**: 1-2 days
**Status**: READY TO START

### Context
You are building the persistence layer for BrowserOS desktop state. Your APIs will ensure that user's desktop configuration, window positions, and preferences are saved and restored seamlessly across sessions.

### Prerequisites
- Read `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md`
- Review existing API structure in `/c/Codes/BrowserOS/server/src/`
- Check database schema in `/c/Codes/BrowserOS/database/migrations/001_initial_schema.sql`
- Understand authentication middleware

### Task 3.1: Database Migration for Window States
**Priority**: P0
**File**: `/c/Codes/BrowserOS/database/migrations/003_window_states.sql`

**Requirements**:
- Create table for persisting window positions and states
- Support per-user window configurations
- Version control for conflict resolution

**SQL**:
```sql
-- Window States Table
CREATE TABLE window_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id VARCHAR(100) NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}',
  size JSONB NOT NULL DEFAULT '{"width": 800, "height": 600}',
  state VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (state IN ('normal', 'minimized', 'maximized', 'fullscreen')),
  z_index INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_app_window UNIQUE(user_id, app_id)
);

CREATE INDEX idx_window_states_user_id ON window_states(user_id);
CREATE INDEX idx_window_states_app_id ON window_states(user_id, app_id);

-- Trigger to update updated_at
CREATE TRIGGER update_window_states_updated_at
  BEFORE UPDATE ON window_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE window_states IS 'Persisted window positions and states per user';
COMMENT ON COLUMN window_states.position IS 'JSON object with x and y coordinates';
COMMENT ON COLUMN window_states.size IS 'JSON object with width and height';
```

**Acceptance Criteria**:
- [ ] Migration creates table successfully
- [ ] Indexes improve query performance
- [ ] Trigger updates timestamp automatically

### Task 3.2: Desktop State Service
**Priority**: P0
**File**: `/c/Codes/BrowserOS/server/src/services/desktopService.ts`

**Requirements**:
- CRUD operations for desktop state
- Version control for optimistic locking
- Caching with Redis

**Implementation**:
```typescript
import { Pool } from 'pg';
import { RedisClient } from '../config/redis';
import { DesktopState } from '../../../shared/types';

export class DesktopService {
  constructor(
    private db: Pool,
    private redis: RedisClient
  ) {}

  async getDesktopState(userId: string): Promise<DesktopState | null> {
    // Try cache first
    const cached = await this.redis.get(`desktop:${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Query database
    const result = await this.db.query(
      `SELECT state, version, last_saved
       FROM desktop_states
       WHERE user_id = $1
       ORDER BY last_saved DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const state = {
      userId,
      version: result.rows[0].version,
      lastSaved: result.rows[0].last_saved,
      desktop: result.rows[0].state
    };

    // Cache for 5 minutes
    await this.redis.setex(
      `desktop:${userId}`,
      300,
      JSON.stringify(state)
    );

    return state;
  }

  async updateDesktopState(
    userId: string,
    desktopState: Partial<DesktopState>,
    expectedVersion?: number
  ): Promise<DesktopState> {
    // Optimistic locking
    const current = await this.getDesktopState(userId);

    if (expectedVersion && current && current.version !== expectedVersion) {
      throw new Error('Version conflict - desktop state was modified');
    }

    const newVersion = (current?.version || 0) + 1;

    const result = await this.db.query(
      `INSERT INTO desktop_states (user_id, state, version)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, version)
       DO UPDATE SET state = $2, last_saved = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, JSON.stringify(desktopState.desktop), newVersion]
    );

    // Invalidate cache
    await this.redis.del(`desktop:${userId}`);

    return {
      userId,
      version: newVersion,
      lastSaved: result.rows[0].last_saved,
      desktop: desktopState.desktop!
    };
  }

  async getWindowStates(userId: string): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM window_states WHERE user_id = $1`,
      [userId]
    );

    return result.rows;
  }

  async saveWindowState(
    userId: string,
    appId: string,
    windowState: any
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO window_states (user_id, app_id, position, size, state, z_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, app_id)
       DO UPDATE SET
         position = $3,
         size = $4,
         state = $5,
         z_index = $6,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        appId,
        JSON.stringify(windowState.position),
        JSON.stringify(windowState.size),
        windowState.state,
        windowState.zIndex
      ]
    );
  }

  async deleteWindowState(userId: string, appId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM window_states WHERE user_id = $1 AND app_id = $2`,
      [userId, appId]
    );
  }
}
```

**Acceptance Criteria**:
- [ ] All CRUD operations work
- [ ] Caching improves performance
- [ ] Version control prevents conflicts
- [ ] Error handling for edge cases

### Task 3.3: Desktop State Controller
**Priority**: P0
**File**: `/c/Codes/BrowserOS/server/src/controllers/desktopController.ts`

**Requirements**:
- Handle HTTP requests for desktop state
- Input validation
- Error responses

**Implementation**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { DesktopService } from '../services/desktopService';
import { z } from 'zod';

const UpdateDesktopStateSchema = z.object({
  version: z.number().optional(),
  desktop: z.object({
    wallpaper: z.string(),
    theme: z.enum(['light', 'dark']),
    icons: z.array(z.object({
      id: z.string(),
      appId: z.string(),
      icon: z.string(),
      label: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number()
      })
    })),
    taskbar: z.object({
      position: z.enum(['top', 'bottom', 'left', 'right']),
      autohide: z.boolean(),
      pinnedApps: z.array(z.string())
    })
  })
});

export class DesktopController {
  constructor(private desktopService: DesktopService) {}

  getDesktopState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId; // From auth middleware

      const state = await this.desktopService.getDesktopState(userId);

      if (!state) {
        // Return default state
        return res.json({
          data: {
            userId,
            version: 0,
            desktop: this.getDefaultDesktopState(),
            lastSaved: new Date()
          }
        });
      }

      res.json({ data: state });
    } catch (error) {
      next(error);
    }
  };

  updateDesktopState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // Validate request body
      const validated = UpdateDesktopStateSchema.parse(req.body);

      const updatedState = await this.desktopService.updateDesktopState(
        userId,
        validated,
        validated.version
      );

      res.json({ data: updatedState });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            message: 'Invalid request data',
            details: error.errors
          }
        });
      }

      if (error.message.includes('Version conflict')) {
        return res.status(409).json({
          error: {
            message: 'Desktop state was modified by another session',
            code: 'VERSION_CONFLICT'
          }
        });
      }

      next(error);
    }
  };

  getWindowStates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const states = await this.desktopService.getWindowStates(userId);
      res.json({ data: states });
    } catch (error) {
      next(error);
    }
  };

  saveWindowState = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { appId, ...windowState } = req.body;

      await this.desktopService.saveWindowState(userId, appId, windowState);

      res.json({ data: { success: true } });
    } catch (error) {
      next(error);
    }
  };

  private getDefaultDesktopState() {
    return {
      wallpaper: '/assets/wallpapers/default.jpg',
      theme: 'dark',
      icons: [],
      taskbar: {
        position: 'bottom',
        autohide: false,
        pinnedApps: ['file-explorer', 'settings', 'terminal']
      }
    };
  }
}
```

**Acceptance Criteria**:
- [ ] All endpoints handle requests correctly
- [ ] Validation catches invalid data
- [ ] Errors return proper status codes
- [ ] Default state returned when no saved state

### Task 3.4: Desktop Routes
**Priority**: P0
**File**: `/c/Codes/BrowserOS/server/src/routes/desktopRoutes.ts`

**Requirements**:
- Define routes for desktop API
- Apply authentication middleware
- Rate limiting for write operations

**Implementation**:
```typescript
import { Router } from 'express';
import { DesktopController } from '../controllers/desktopController';
import { authenticate } from '../middleware/authenticate';
import { rateLimit } from 'express-rate-limit';

const desktopRouter = Router();

// Rate limiter for state updates (prevent spam)
const updateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many state updates, please try again later'
});

// All routes require authentication
desktopRouter.use(authenticate);

// Desktop state routes
desktopRouter.get('/state', desktopController.getDesktopState);
desktopRouter.put('/state', updateLimiter, desktopController.updateDesktopState);

// Window state routes
desktopRouter.get('/windows', desktopController.getWindowStates);
desktopRouter.post('/windows', updateLimiter, desktopController.saveWindowState);

export { desktopRouter };
```

**Register in main app**:
```typescript
// server/src/index.ts
import { desktopRouter } from './routes/desktopRoutes';

app.use('/api/desktop', desktopRouter);
```

**Acceptance Criteria**:
- [ ] Routes are properly defined
- [ ] Authentication required for all routes
- [ ] Rate limiting works
- [ ] Routes registered in main app

### Task 3.5: API Client Service (Frontend)
**Priority**: P1
**File**: `/c/Codes/BrowserOS/client/src/services/desktopApi.ts`

**Requirements**:
- Axios client for desktop API calls
- Error handling and retries
- TypeScript interfaces

**Implementation**:
```typescript
import axios from 'axios';
import { DesktopState } from '../../../shared/types';

const api = axios.create({
  baseURL: '/api/desktop',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const desktopApi = {
  async getDesktopState(): Promise<DesktopState> {
    const response = await api.get('/state');
    return response.data.data;
  },

  async updateDesktopState(state: DesktopState): Promise<DesktopState> {
    const response = await api.put('/state', state);
    return response.data.data;
  },

  async getWindowStates(): Promise<any[]> {
    const response = await api.get('/windows');
    return response.data.data;
  },

  async saveWindowState(appId: string, windowState: any): Promise<void> {
    await api.post('/windows', { appId, ...windowState });
  }
};
```

**Acceptance Criteria**:
- [ ] API client makes correct requests
- [ ] Auth token included in headers
- [ ] Error responses handled
- [ ] TypeScript types are correct

### Task 3.6: Redis Configuration
**Priority**: P1
**File**: `/c/Codes/BrowserOS/server/src/config/redis.ts`

**Requirements**:
- Set up Redis client
- Connection pooling
- Error handling

**Implementation**:
```typescript
import { createClient } from 'redis';
import { logger } from '../utils/logger';

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  await redisClient.connect();

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
```

**Acceptance Criteria**:
- [ ] Redis client connects successfully
- [ ] Connection is reused
- [ ] Errors are logged
- [ ] Graceful shutdown

### Deliverables Summary
- [ ] Database migration for window states
- [ ] Desktop state service with caching
- [ ] Desktop state controller with validation
- [ ] RESTful routes for desktop API
- [ ] Frontend API client
- [ ] Redis caching layer

### Testing Requirements
- Unit tests for service methods
- Integration tests for API endpoints
- Test version conflict handling
- Test caching behavior
- Load testing for concurrent updates

---

## Agent 4: QA Tester

**Agent Profile**: Testing specialist, quality assurance expert
**Priority**: HIGH
**Estimated Duration**: 2 days (concurrent with development)
**Status**: READY TO START

### Context
You are ensuring BrowserOS desktop is rock-solid and production-ready. Your comprehensive testing will catch bugs early and ensure smooth user experience.

### Prerequisites
- Read `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md`
- Review testing setup in `/c/Codes/BrowserOS/docs/TESTING_GUIDE.md`
- Understand Vitest and Playwright
- Set up testing environment

### Task 4.1: Desktop Component Unit Tests
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/tests/components/DesktopShell.test.tsx`

**Requirements**:
- Test desktop shell rendering
- Test wallpaper display
- Test theme switching
- Test icon positioning

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DesktopShell } from '../../src/features/desktop/components/DesktopShell';

describe('DesktopShell', () => {
  it('renders with default wallpaper', () => {
    render(<DesktopShell />);
    const desktop = screen.getByTestId('desktop-shell');
    expect(desktop).toBeInTheDocument();
  });

  it('applies wallpaper URL correctly', () => {
    render(<DesktopShell wallpaper="/test-wallpaper.jpg" />);
    const desktop = screen.getByTestId('desktop-shell');
    expect(desktop).toHaveStyle({
      backgroundImage: 'url(/test-wallpaper.jpg)'
    });
  });

  it('switches theme correctly', () => {
    const { rerender } = render(<DesktopShell theme="light" />);
    let desktop = screen.getByTestId('desktop-shell');
    expect(desktop).toHaveClass('light');

    rerender(<DesktopShell theme="dark" />);
    desktop = screen.getByTestId('desktop-shell');
    expect(desktop).toHaveClass('dark');
  });
});
```

**Test Coverage**:
- DesktopShell component
- DesktopIcon component
- Taskbar component
- Context menus

**Acceptance Criteria**:
- [ ] All components have unit tests
- [ ] Tests cover happy path and edge cases
- [ ] 90%+ code coverage for components

### Task 4.2: Window Manager Unit Tests
**Priority**: P0
**File**: `/c/Codes/BrowserOS/client/tests/components/Window.test.tsx`

**Requirements**:
- Test window rendering
- Test window drag logic
- Test window resize logic
- Test window state transitions

**Test Cases**:
```typescript
describe('Window', () => {
  it('renders with correct title and content', () => {});
  it('can be dragged to new position', () => {});
  it('can be resized from corners', () => {});
  it('minimizes on minimize button click', () => {});
  it('maximizes on maximize button click', () => {});
  it('closes on close button click', () => {});
  it('focuses on click', () => {});
  it('updates z-index when focused', () => {});
});
```

**Acceptance Criteria**:
- [ ] Window component fully tested
- [ ] Drag and resize logic verified
- [ ] State transitions tested
- [ ] Focus management tested

### Task 4.3: State Management Tests
**Priority**: P0
**Files**:
- `/c/Codes/BrowserOS/client/tests/stores/desktopStore.test.ts`
- `/c/Codes/BrowserOS/client/tests/stores/windowStore.test.ts`

**Requirements**:
- Test all store actions
- Test state updates
- Test persistence logic

**Example**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '../../src/stores/windowStore';

describe('windowStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useWindowStore.getState().resetWindows();
  });

  it('creates window with unique ID', () => {
    const id = useWindowStore.getState().createWindow('test-app');
    expect(id).toBeTruthy();

    const window = useWindowStore.getState().getWindow(id);
    expect(window).toBeDefined();
    expect(window?.appId).toBe('test-app');
  });

  it('focuses window and updates z-index', () => {
    const id1 = useWindowStore.getState().createWindow('app1');
    const id2 = useWindowStore.getState().createWindow('app2');

    useWindowStore.getState().focusWindow(id1);

    const win1 = useWindowStore.getState().getWindow(id1);
    const win2 = useWindowStore.getState().getWindow(id2);

    expect(win1?.focused).toBe(true);
    expect(win2?.focused).toBe(false);
    expect(win1?.zIndex).toBeGreaterThan(win2?.zIndex || 0);
  });

  it('minimizes window correctly', () => {
    const id = useWindowStore.getState().createWindow('test-app');
    useWindowStore.getState().minimizeWindow(id);

    const window = useWindowStore.getState().getWindow(id);
    expect(window?.state).toBe('minimized');
  });
});
```

**Acceptance Criteria**:
- [ ] All store actions tested
- [ ] Edge cases covered
- [ ] State consistency verified

### Task 4.4: Integration Tests
**Priority**: P1
**File**: `/c/Codes/BrowserOS/client/tests/integration/desktop.test.tsx`

**Requirements**:
- Test desktop to window manager integration
- Test app launch flow
- Test state persistence

**Test Scenarios**:
```typescript
describe('Desktop Integration', () => {
  it('launches app and creates window', () => {
    // Click desktop icon
    // Verify window appears
    // Verify window has correct content
  });

  it('manages multiple windows correctly', () => {
    // Open 3 windows
    // Verify all render
    // Click different windows
    // Verify focus changes
  });

  it('persists desktop state on save', async () => {
    // Change desktop settings
    // Trigger save
    // Reload desktop
    // Verify settings restored
  });
});
```

**Acceptance Criteria**:
- [ ] Integration between components verified
- [ ] State flow tested end-to-end
- [ ] No integration bugs

### Task 4.5: E2E Tests with Playwright
**Priority**: P1
**File**: `/c/Codes/BrowserOS/client/tests/e2e/desktop.spec.ts`

**Requirements**:
- Test complete user workflows
- Test across different browsers
- Visual regression testing (optional)

**Test Scenarios**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Desktop Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[name=email]', 'test@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');
    await page.waitForURL('/desktop');
  });

  test('opens and closes window', async ({ page }) => {
    // Click app icon
    await page.click('[data-testid="desktop-icon-welcome"]');

    // Wait for window
    await page.waitForSelector('[data-testid="window"]');

    // Verify window appears
    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Click close button
    await page.click('[data-testid="window-close-btn"]');

    // Verify window disappears
    await expect(window).not.toBeVisible();
  });

  test('drags window to new position', async ({ page }) => {
    // Open window
    await page.click('[data-testid="desktop-icon-welcome"]');

    const window = page.locator('[data-testid="window"]');
    const titleBar = page.locator('[data-testid="window-title-bar"]');

    // Get initial position
    const initialBox = await window.boundingBox();

    // Drag window
    await titleBar.dragTo(page.locator('body'), {
      targetPosition: { x: 500, y: 300 }
    });

    // Verify position changed
    const newBox = await window.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
  });

  test('resizes window', async ({ page }) => {
    // Open window
    await page.click('[data-testid="desktop-icon-welcome"]');

    const window = page.locator('[data-testid="window"]');
    const resizeHandle = page.locator('[data-testid="resize-handle-se"]');

    // Get initial size
    const initialBox = await window.boundingBox();

    // Resize window
    await resizeHandle.dragTo(page.locator('body'), {
      targetPosition: { x: 1000, y: 800 }
    });

    // Verify size changed
    const newBox = await window.boundingBox();
    expect(newBox?.width).toBeGreaterThan(initialBox?.width || 0);
  });

  test('minimizes and restores window', async ({ page }) => {
    // Open window
    await page.click('[data-testid="desktop-icon-welcome"]');

    const window = page.locator('[data-testid="window"]');

    // Minimize
    await page.click('[data-testid="window-minimize-btn"]');
    await expect(window).not.toBeVisible();

    // Restore from taskbar
    await page.click('[data-testid="taskbar-icon-welcome"]');
    await expect(window).toBeVisible();
  });

  test('maximizes and restores window', async ({ page }) => {
    // Open window
    await page.click('[data-testid="desktop-icon-welcome"]');

    const window = page.locator('[data-testid="window"]');

    // Get initial size
    const initialBox = await window.boundingBox();

    // Maximize
    await page.click('[data-testid="window-maximize-btn"]');

    // Verify fills screen
    const maxBox = await window.boundingBox();
    const viewport = page.viewportSize();
    expect(maxBox?.width).toBeCloseTo(viewport?.width || 0, -1);

    // Restore
    await page.click('[data-testid="window-maximize-btn"]');

    // Verify back to original size
    const restoredBox = await window.boundingBox();
    expect(restoredBox?.width).toBeCloseTo(initialBox?.width || 0, -1);
  });

  test('context menu appears on right-click', async ({ page }) => {
    // Right-click desktop
    await page.click('body', { button: 'right' });

    // Verify context menu appears
    const menu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(menu).toBeVisible();

    // Click outside to close
    await page.click('body');
    await expect(menu).not.toBeVisible();
  });
});
```

**Acceptance Criteria**:
- [ ] All user workflows tested
- [ ] Tests pass on Chrome, Firefox, Safari
- [ ] Visual regressions caught

### Task 4.6: Performance Testing
**Priority**: P2
**File**: `/c/Codes/BrowserOS/client/tests/performance/desktop.perf.test.ts`

**Requirements**:
- Measure desktop load time
- Test with multiple windows (10, 20, 50)
- Measure drag/resize frame rates
- Memory leak detection

**Metrics**:
- Desktop load: < 500ms
- Window open: < 200ms
- Drag operations: 60fps (< 16ms per frame)
- Memory: stable over time

**Acceptance Criteria**:
- [ ] Performance benchmarks created
- [ ] All targets met
- [ ] No memory leaks detected

### Task 4.7: Backend API Tests
**Priority**: P1
**File**: `/c/Codes/BrowserOS/server/tests/integration/desktopRoutes.test.ts`

**Requirements**:
- Test all desktop API endpoints
- Test authentication
- Test error handling

**Test Cases**:
```typescript
describe('Desktop API', () => {
  it('GET /api/desktop/state requires auth', async () => {});
  it('GET /api/desktop/state returns state', async () => {});
  it('PUT /api/desktop/state updates state', async () => {});
  it('PUT /api/desktop/state handles version conflict', async () => {});
  it('POST /api/desktop/windows saves window state', async () => {});
  it('handles rate limiting correctly', async () => {});
});
```

**Acceptance Criteria**:
- [ ] All endpoints tested
- [ ] Auth verified
- [ ] Error cases covered

### Deliverables Summary
- [ ] Unit tests for all components (90%+ coverage)
- [ ] State management tests
- [ ] Integration tests for desktop flow
- [ ] E2E tests with Playwright
- [ ] Performance benchmarks
- [ ] Backend API tests
- [ ] Test documentation and bug reports

---

## Coordination Points

### Day 1 Sync (End of Day)
**Attendees**: All agents + Tech Lead
**Agenda**:
- Frontend: Desktop Shell and Window component structure ready?
- Backend Logic: Stores created and basic functionality working?
- Backend Database: Migrations run successfully?
- QA: Test infrastructure set up?

### Day 3 Sync (Midpoint)
**Attendees**: All agents + Tech Lead
**Agenda**:
- Integration status check
- Blocker identification
- Timeline adjustments if needed

### Day 5 Sync (Integration Day)
**Attendees**: All agents + Tech Lead
**Agenda**:
- Full system integration testing
- Bug triage and assignment
- Polish and refinement tasks

### Day 7 Review (Sprint Close)
**Attendees**: All agents + Tech Lead
**Agenda**:
- Demo of completed features
- Test results review
- Lessons learned
- Week 3 preparation

---

## Success Metrics

- [ ] Desktop loads in < 500ms
- [ ] All window operations work at 60fps
- [ ] 90%+ test coverage achieved
- [ ] Zero critical bugs
- [ ] State persistence works across sessions
- [ ] At least 3 apps can be launched and used
- [ ] Documentation complete

---

**Document Status**: Ready for Agent Assignment
**Next Action**: Agents begin work immediately
**Coordination**: Daily standups at 9 AM
