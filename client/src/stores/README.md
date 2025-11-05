# BrowserOS State Management

This directory contains the Zustand stores that power BrowserOS's state management layer.

## Overview

BrowserOS uses Zustand for state management, providing a lightweight, performant, and TypeScript-friendly solution for managing application state.

## Stores

### 1. Desktop Store (`desktopStore.ts`)

Manages desktop environment state including wallpaper, theme, icons, and taskbar configuration.

**State:**
- `wallpaper`: Current wallpaper URL
- `theme`: Current theme ('light' | 'dark')
- `icons`: Array of desktop icons with positions
- `taskbar`: Taskbar configuration (position, autohide, pinned apps)
- `loading`: Loading state for async operations
- `error`: Error message if any

**Key Features:**
- Auto-save to localStorage with 2-second debounce
- Theme switching with DOM class updates
- Icon position management
- Taskbar customization
- Backend sync ready (API endpoints to be added)

**Usage:**
```typescript
import { useDesktopStore } from './stores/desktopStore';

function MyComponent() {
  const { theme, wallpaper, setTheme, addIcon } = useDesktopStore();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

### 2. Window Store (`windowStore.ts`)

Manages all active windows including lifecycle, focus management, and z-index ordering.

**State:**
- `windows`: Record of all active windows
- `focusedWindowId`: ID of currently focused window
- `nextZIndex`: Next z-index value for new windows

**Key Features:**
- Window lifecycle management (create, close, minimize, maximize, restore)
- Focus management with automatic z-index updates
- Cascade positioning for new windows
- Z-index compaction to prevent overflow
- Window state persistence to localStorage
- Support for multiple windows per app

**Window States:**
- `normal`: Standard window state
- `minimized`: Hidden from view, shown in taskbar
- `maximized`: Fills entire screen
- `fullscreen`: Full screen mode (future feature)

**Usage:**
```typescript
import { useWindowStore } from './stores/windowStore';

function WindowManager() {
  const { windows, createWindow, closeWindow, focusWindow } = useWindowStore();

  const handleLaunch = () => {
    const windowId = createWindow('my-app', {
      title: 'My App',
      size: { width: 800, height: 600 }
    });
  };

  return (
    <div>
      {Object.values(windows).map(window => (
        <Window key={window.id} {...window} />
      ))}
    </div>
  );
}
```

### 3. App Registry Store (`appRegistryStore.ts`)

Central registry for all available applications with launch logic.

**State:**
- `apps`: Record of registered applications with manifests
- `installedApps`: Array of installed app IDs
- `loading`: Loading state
- `error`: Error message if any

**Key Features:**
- Application registration and discovery
- App launch with window creation
- Search and filtering by category
- Manifest validation
- Integration with window store

**App Manifest Structure:**
```typescript
interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon: string;
  category: string;
  permissions: string[];
  windowConfig: {
    defaultSize: { width: number; height: number };
    minSize?: { width: number; height: number };
    maxSize?: { width: number; height: number };
    resizable: boolean;
    maximizable: boolean;
  };
  component: React.ComponentType<AppComponentProps>;
}
```

**Usage:**
```typescript
import { useAppRegistryStore } from './stores/appRegistryStore';

function AppLauncher() {
  const { apps, launchApp } = useAppRegistryStore();

  const handleLaunch = async (appId: string) => {
    const windowId = await launchApp(appId);
    console.log(`Launched ${appId} in window ${windowId}`);
  };

  return (
    <div>
      {Object.values(apps).map(app => (
        <button key={app.id} onClick={() => handleLaunch(app.id)}>
          {app.icon} {app.name}
        </button>
      ))}
    </div>
  );
}
```

## State Persistence

All stores implement automatic state persistence:

1. **localStorage**: Immediate caching for quick recovery
2. **Backend API**: Debounced sync (to be implemented by Backend Database specialist)
3. **Conflict Resolution**: Version-based optimistic locking

### Persistence Flow

```
User Action → Store Update → localStorage (immediate) → Backend API (debounced)
                                                              ↓
                                                    Conflict Detection
                                                              ↓
                                           Success / Rollback on Error
```

## Performance Optimizations

1. **Debounced Saves**: Prevent excessive writes (2s debounce)
2. **Z-Index Compaction**: Reset z-indices when > 1000
3. **Selective Re-renders**: Zustand only re-renders subscribed components
4. **Memoization**: Use derived state with useMemo in hooks
5. **Cascade Positioning**: Efficient window placement algorithm

## Best Practices

### 1. Use Hooks Instead of Direct Store Access

```typescript
// ✅ Good
import { useDesktop } from '../hooks/useDesktop';
const { theme, toggleTheme } = useDesktop();

// ❌ Avoid
import { useDesktopStore } from '../stores/desktopStore';
const theme = useDesktopStore(state => state.theme);
const toggleTheme = useDesktopStore(state => state.toggleTheme);
```

### 2. Subscribe to Specific State Slices

```typescript
// ✅ Good - only re-renders when theme changes
const theme = useDesktopStore(state => state.theme);

// ❌ Avoid - re-renders on any state change
const store = useDesktopStore();
```

### 3. Use Actions for State Updates

```typescript
// ✅ Good
const { addIcon } = useDesktopStore();
addIcon(newIcon);

// ❌ Avoid - bypasses persistence logic
useDesktopStore.setState({ icons: [...icons, newIcon] });
```

### 4. Handle Errors Gracefully

```typescript
const { launchApp, error } = useAppRegistryStore();

try {
  const windowId = await launchApp('my-app');
} catch (err) {
  console.error('Failed to launch app:', err);
  // Show user-friendly error message
}
```

## Integration with Backend

When the backend API is ready, update the following methods:

### Desktop Store
```typescript
// In loadDesktopState()
const response = await fetch('/api/desktop/state', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
set({ ...data, loading: false });

// In saveDesktopState()
await fetch('/api/desktop/state', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify(stateToSave)
});
```

### Window Store
```typescript
// Similar pattern for window state persistence
await fetch('/api/desktop/windows', { ... });
```

## Testing

Unit tests for stores should cover:

1. **State Updates**: Verify all actions update state correctly
2. **Persistence**: Mock localStorage and verify saves
3. **Edge Cases**: Multiple windows, z-index overflow, etc.
4. **Error Handling**: Async operation failures

Example test:
```typescript
import { useWindowStore } from './windowStore';

describe('windowStore', () => {
  beforeEach(() => {
    useWindowStore.getState().resetWindows();
  });

  it('creates window with unique ID', () => {
    const id = useWindowStore.getState().createWindow('test-app');
    expect(id).toBeTruthy();

    const window = useWindowStore.getState().getWindow(id);
    expect(window?.appId).toBe('test-app');
  });
});
```

## Troubleshooting

### State Not Persisting
- Check localStorage quota (may be full)
- Verify debounce timing
- Check for errors in console

### Windows Not Focusing
- Verify z-index updates in store
- Check focusWindow action calls
- Ensure window exists in store

### Memory Leaks
- Clean up window references on close
- Remove event listeners
- Clear timeouts in store cleanup

## Future Enhancements

1. **WebSocket Sync**: Real-time state synchronization
2. **Multi-tab Support**: Share state across browser tabs
3. **State History**: Undo/redo functionality
4. **Snapshots**: Save/restore desktop layouts
5. **Cloud Sync**: Sync across devices
