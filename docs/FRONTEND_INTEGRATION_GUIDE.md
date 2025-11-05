# Frontend Integration Guide: Desktop State API

## Quick Start

This guide helps the frontend team integrate with the new Desktop State API.

## Authentication

All endpoints require authentication. Include JWT token in Authorization header:

```typescript
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};
```

## Base URL

```typescript
const API_BASE = 'http://localhost:3000/api/v1/desktop';
```

## Type Definitions

```typescript
// Already defined in shared/types/index.ts

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

type WindowDisplayState = 'normal' | 'minimized' | 'maximized' | 'fullscreen';
type Theme = 'light' | 'dark';
type TaskbarPosition = 'top' | 'bottom' | 'left' | 'right';

interface WindowState {
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

interface DesktopState {
  wallpaper: string;
  theme: Theme;
  windows: WindowState[];
  taskbar: {
    position: TaskbarPosition;
    autohide: boolean;
    pinnedApps: string[];
  };
}

interface PersistedDesktopState {
  userId: string;
  version: number;
  lastSaved: Date;
  desktop: DesktopState;
  appStates: Record<string, unknown>;
  settings: UserSettings;
}
```

## Common Operations

### 1. Load Desktop on Login

```typescript
async function loadDesktop() {
  try {
    const response = await fetch(`${API_BASE}/state`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load desktop');
    }

    const { data } = await response.json();

    // Store version for later updates
    const currentVersion = data.version;

    // Apply desktop state
    applyWallpaper(data.desktop.wallpaper);
    applyTheme(data.desktop.theme);
    restoreWindows(data.desktop.windows);
    configureTaskbar(data.desktop.taskbar);

    return data;
  } catch (error) {
    console.error('Error loading desktop:', error);
    // Fallback to default desktop
    return getDefaultDesktop();
  }
}
```

### 2. Save Desktop State (with Optimistic Locking)

```typescript
let currentVersion = 1; // Loaded from initial state

async function saveDesktop(desktopState: Partial<DesktopState>) {
  try {
    const response = await fetch(`${API_BASE}/state`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        state: desktopState,
        version: currentVersion
      })
    });

    if (response.status === 409) {
      // Version conflict - need to reload and merge
      console.warn('Desktop state conflict detected');
      await handleConflict(desktopState);
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to save desktop');
    }

    const { data } = await response.json();

    // Update version for next save
    currentVersion = data.version;

    return data;
  } catch (error) {
    console.error('Error saving desktop:', error);
    throw error;
  }
}

async function handleConflict(localChanges: Partial<DesktopState>) {
  // Reload latest state
  const latestState = await loadDesktop();

  // Implement merge strategy (example: keep local changes)
  const merged = {
    ...latestState.desktop,
    ...localChanges
  };

  // Retry save with new version
  currentVersion = latestState.version;
  await saveDesktop(merged);
}
```

### 3. Create/Update Window

```typescript
async function saveWindow(window: WindowState) {
  try {
    const response = await fetch(`${API_BASE}/windows`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(window)
    });

    if (!response.ok) {
      throw new Error('Failed to save window');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving window:', error);
    throw error;
  }
}

// Example usage: Create new window
async function openApp(appId: string) {
  const window: WindowState = {
    appId,
    title: getAppTitle(appId),
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    state: 'normal',
    zIndex: getNextZIndex(),
    focused: true,
    resizable: true,
    movable: true
  };

  const savedWindow = await saveWindow(window);
  renderWindow(savedWindow);
}
```

### 4. Update Window Position (Drag)

```typescript
// Debounce saves during drag
const debouncedSave = debounce(async (window: WindowState) => {
  await saveWindow(window);
}, 500);

function onWindowDrag(windowId: string, newPosition: Position) {
  // Update local state immediately
  const window = getWindowById(windowId);
  window.position = newPosition;
  updateWindowDOM(window);

  // Save to backend (debounced)
  debouncedSave(window);
}
```

### 5. Focus Window

```typescript
async function focusWindow(windowId: string) {
  try {
    const response = await fetch(`${API_BASE}/windows/${windowId}/focus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to focus window');
    }

    const { data } = await response.json();

    // Update local state
    updateWindowZIndex(windowId, data.zIndex);
    setWindowFocused(windowId);

    return data;
  } catch (error) {
    console.error('Error focusing window:', error);
    throw error;
  }
}
```

### 6. Close Window

```typescript
async function closeWindow(windowId: string) {
  try {
    // Remove from UI immediately (optimistic update)
    removeWindowFromDOM(windowId);

    // Delete from backend
    const response = await fetch(`${API_BASE}/windows/${windowId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      // Rollback if failed
      restoreWindowToDOM(windowId);
      throw new Error('Failed to close window');
    }
  } catch (error) {
    console.error('Error closing window:', error);
    throw error;
  }
}
```

### 7. Change Theme

```typescript
async function changeTheme(theme: Theme) {
  // Apply theme immediately (optimistic update)
  applyTheme(theme);

  // Save to backend
  await saveDesktop({ theme });
}
```

### 8. Bulk Save Windows

```typescript
// Use when saving multiple windows at once (more efficient)
async function saveMultipleWindows(windows: WindowState[]) {
  try {
    const response = await fetch(`${API_BASE}/windows/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ windows })
    });

    if (!response.ok) {
      throw new Error('Failed to save windows');
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving windows:', error);
    throw error;
  }
}

// Example: Save all windows before logout
async function saveAllWindows() {
  const windows = getAllOpenWindows();
  await saveMultipleWindows(windows);
}
```

## Recommended Patterns

### 1. Auto-Save Strategy

```typescript
// Save desktop state periodically
setInterval(async () => {
  const currentState = getCurrentDesktopState();
  await saveDesktop(currentState);
}, 30000); // Every 30 seconds

// Also save on:
// - Window close
// - Theme change
// - Taskbar config change
// - Before logout
```

### 2. Offline Support

```typescript
// Queue changes when offline
const pendingChanges = [];

async function saveDesktopWithOfflineSupport(state: Partial<DesktopState>) {
  if (!navigator.onLine) {
    // Queue for later
    pendingChanges.push(state);
    localStorage.setItem('pendingDesktopChanges', JSON.stringify(pendingChanges));
    return;
  }

  try {
    await saveDesktop(state);
  } catch (error) {
    // Queue if server error
    pendingChanges.push(state);
  }
}

// Sync when back online
window.addEventListener('online', async () => {
  while (pendingChanges.length > 0) {
    const change = pendingChanges.shift();
    try {
      await saveDesktop(change);
    } catch (error) {
      // Put back in queue
      pendingChanges.unshift(change);
      break;
    }
  }
});
```

### 3. Error Handling

```typescript
async function robustSaveDesktop(state: Partial<DesktopState>) {
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      return await saveDesktop(state);
    } catch (error) {
      retries++;

      if (retries === MAX_RETRIES) {
        // Show error to user
        showNotification({
          type: 'error',
          message: 'Failed to save desktop state. Changes may be lost.',
          action: 'Retry',
          onAction: () => robustSaveDesktop(state)
        });
        throw error;
      }

      // Exponential backoff
      await sleep(Math.pow(2, retries) * 1000);
    }
  }
}
```

### 4. Loading States

```typescript
function DesktopManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desktop, setDesktop] = useState(null);

  useEffect(() => {
    loadDesktop()
      .then(data => {
        setDesktop(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
        // Fallback to default
        setDesktop(getDefaultDesktop());
      });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={loadDesktop} />;
  }

  return <Desktop state={desktop} />;
}
```

## Performance Tips

### 1. Debounce Window Updates

```typescript
// Don't save on every pixel moved
const debouncedWindowUpdate = debounce(saveWindow, 500);
```

### 2. Batch Window Updates

```typescript
// Instead of multiple individual saves
for (const window of windows) {
  await saveWindow(window); // BAD - makes N requests
}

// Do this
await saveMultipleWindows(windows); // GOOD - single request
```

### 3. Optimistic Updates

```typescript
// Update UI immediately, save in background
function updateWindowSize(windowId: string, size: Size) {
  // Update UI (instant feedback)
  updateWindowDOM(windowId, size);

  // Save to backend (async, non-blocking)
  saveWindow({ id: windowId, size }).catch(error => {
    // Rollback on error
    revertWindowDOM(windowId);
    showError('Failed to save window size');
  });
}
```

### 4. Cache State Locally

```typescript
// Cache in memory for fast access
let cachedDesktopState: PersistedDesktopState | null = null;

async function getDesktopState(forceRefresh = false) {
  if (cachedDesktopState && !forceRefresh) {
    return cachedDesktopState;
  }

  const state = await loadDesktop();
  cachedDesktopState = state;
  return state;
}
```

## Testing

### Mock API for Development

```typescript
// Create a mock API for development without backend
const mockAPI = {
  async loadDesktop() {
    await sleep(100); // Simulate network delay
    return {
      userId: 'mock-user',
      version: 1,
      desktop: {
        wallpaper: '/assets/wallpapers/default.jpg',
        theme: 'light',
        windows: [],
        taskbar: {
          position: 'bottom',
          autohide: false,
          pinnedApps: []
        }
      }
    };
  },

  async saveDesktop(state: any) {
    await sleep(100);
    return { ...state, version: state.version + 1 };
  }
};

// Use in development
const api = process.env.NODE_ENV === 'development' ? mockAPI : realAPI;
```

## Common Issues

### Issue: Version Conflicts

**Problem:** Getting 409 CONFLICT errors

**Solution:**
1. Reload latest state
2. Merge with local changes
3. Retry save with new version

```typescript
if (response.status === 409) {
  const latest = await loadDesktop();
  const merged = mergeStates(latest, localChanges);
  await saveDesktop(merged);
}
```

### Issue: Slow Saves

**Problem:** Desktop saves taking too long

**Solution:**
1. Check network connection
2. Use debouncing for frequent updates
3. Batch multiple changes
4. Implement optimistic updates

### Issue: Lost Changes

**Problem:** Changes not persisting

**Solution:**
1. Check authentication token
2. Verify network connection
3. Implement retry logic
4. Queue changes when offline
5. Add explicit save button as fallback

## Support

For questions or issues:
1. Check API documentation: `docs/DESKTOP_STATE_API.md`
2. Review implementation: `docs/WEEK2_IMPLEMENTATION_SUMMARY.md`
3. Contact backend team
4. Check health endpoint: `GET /health`

## Example: Complete Desktop Component

```typescript
import { useEffect, useState } from 'react';

function Desktop() {
  const [state, setState] = useState<PersistedDesktopState | null>(null);
  const [loading, setLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    loadDesktop()
      .then(data => {
        setState(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!state) return;

    const interval = setInterval(() => {
      saveDesktop(state.desktop);
    }, 30000);

    return () => clearInterval(interval);
  }, [state]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state) {
        // Use sendBeacon for reliable save on page unload
        navigator.sendBeacon(
          `${API_BASE}/state`,
          JSON.stringify({ state: state.desktop, version: state.version })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  if (loading) return <LoadingSpinner />;
  if (!state) return <ErrorScreen />;

  return (
    <div className={`desktop theme-${state.desktop.theme}`}>
      <Wallpaper src={state.desktop.wallpaper} />
      <WindowManager windows={state.desktop.windows} />
      <Taskbar config={state.desktop.taskbar} />
    </div>
  );
}
```
