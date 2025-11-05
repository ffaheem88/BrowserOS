# Desktop Components Documentation

## Overview

This directory contains the complete desktop environment for BrowserOS, including the desktop shell, window management system, taskbar, and all related UI components.

## Components

### DesktopShell

The main container for the entire desktop environment.

```tsx
import { DesktopShell } from '@/features/desktop';

<DesktopShell
  wallpaper="/path/to/wallpaper.jpg"
  theme="dark" // or "light"
>
  {/* Desktop content */}
</DesktopShell>
```

**Props**:
- `wallpaper?: string` - URL to wallpaper image
- `theme?: 'light' | 'dark'` - Theme mode
- `children?: React.ReactNode` - Desktop content
- `className?: string` - Additional CSS classes

### DesktopArea

The main area where icons and windows are rendered.

```tsx
import { DesktopArea } from '@/features/desktop';

<DesktopArea onContextMenu={(e) => handleRightClick(e)}>
  {/* Icons and windows */}
</DesktopArea>
```

**Props**:
- `children?: React.ReactNode` - Desktop content
- `className?: string` - Additional CSS classes
- `onContextMenu?: (e: React.MouseEvent) => void` - Right-click handler

### DesktopIcon

A draggable icon that launches applications.

```tsx
import { DesktopIcon } from '@/features/desktop';

<DesktopIcon
  id="icon-1"
  appId="file-explorer"
  icon="/icons/folder.svg"
  label="File Explorer"
  position={{ x: 20, y: 20 }}
  selected={false}
  onDoubleClick={(appId) => launchApp(appId)}
  onContextMenu={(e, id) => showMenu(e, id)}
  onDragEnd={(id, pos) => savePosition(id, pos)}
  onSelect={(id) => selectIcon(id)}
/>
```

**Props**:
- `id: string` - Unique icon identifier
- `appId: string` - Application identifier
- `icon: string` - Icon image URL
- `label: string` - Display label
- `position: { x: number; y: number }` - Icon position
- `selected?: boolean` - Selection state
- `onDoubleClick: (appId: string) => void` - Double-click handler
- `onContextMenu: (e: React.MouseEvent, id: string) => void` - Right-click handler
- `onDragEnd: (id: string, position: { x: number; y: number }) => void` - Drag end handler
- `onSelect?: (id: string) => void` - Selection handler

### Taskbar

The bottom taskbar showing active windows and system tray.

```tsx
import { Taskbar } from '@/features/desktop';

<Taskbar
  apps={[
    {
      id: 'window-1',
      appId: 'file-explorer',
      title: 'File Explorer',
      icon: '/icons/folder.svg',
      isActive: true,
      isFocused: true
    }
  ]}
  pinnedApps={['file-explorer', 'settings']}
  onAppClick={(id) => focusWindow(id)}
  onStartClick={() => openStartMenu()}
/>
```

**Props**:
- `apps?: TaskbarApp[]` - Active applications
- `pinnedApps?: string[]` - Pinned app IDs
- `onAppClick?: (appId: string) => void` - App click handler
- `onStartClick?: () => void` - Start button handler
- `className?: string` - Additional CSS classes

**TaskbarApp Interface**:
```typescript
interface TaskbarApp {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  isActive: boolean;
  isFocused: boolean;
}
```

### DesktopContextMenu

Right-click context menu for the desktop.

```tsx
import { DesktopContextMenu } from '@/features/desktop';

<DesktopContextMenu
  onRefresh={() => refresh()}
  onPersonalize={() => openSettings()}
  onNewFolder={() => createFolder()}
  onNewFile={() => createFile()}
  onPaste={() => paste()}
  hasClipboard={false}
>
  {/* Wrap desktop area */}
</DesktopContextMenu>
```

**Props**:
- `children: React.ReactNode` - Content to wrap
- `onRefresh?: () => void` - Refresh handler
- `onPersonalize?: () => void` - Personalize handler
- `onNewFolder?: () => void` - New folder handler
- `onNewFile?: () => void` - New file handler
- `onPaste?: () => void` - Paste handler
- `hasClipboard?: boolean` - Enable paste option

## Window Components

### Window

A draggable, resizable window component.

```tsx
import { Window } from '@/features/windows';

<Window
  id="window-1"
  appId="file-explorer"
  title="File Explorer"
  icon="/icons/folder.svg"
  position={{ x: 100, y: 100 }}
  size={{ width: 800, height: 600 }}
  state="normal"
  zIndex={100}
  focused={true}
  resizable={true}
  movable={true}
  minimizable={true}
  maximizable={true}
  onClose={(id) => closeWindow(id)}
  onMinimize={(id) => minimizeWindow(id)}
  onMaximize={(id) => maximizeWindow(id)}
  onFocus={(id) => focusWindow(id)}
  onDragEnd={(id, pos) => updatePosition(id, pos)}
  onResizeEnd={(id, size) => updateSize(id, size)}
>
  {/* Window content */}
</Window>
```

**Props**:
- `id: string` - Window identifier
- `appId: string` - Application identifier
- `title: string` - Window title
- `icon?: string` - Window icon
- `position: { x: number; y: number }` - Window position
- `size: { width: number; height: number }` - Window size
- `state: 'normal' | 'minimized' | 'maximized' | 'fullscreen'` - Window state
- `zIndex: number` - Stack order
- `focused: boolean` - Focus state
- `resizable?: boolean` - Enable resizing
- `movable?: boolean` - Enable dragging
- `minimizable?: boolean` - Show minimize button
- `maximizable?: boolean` - Show maximize button
- `children: React.ReactNode` - Window content
- `onClose: (id: string) => void` - Close handler
- `onMinimize: (id: string) => void` - Minimize handler
- `onMaximize: (id: string) => void` - Maximize handler
- `onFocus: (id: string) => void` - Focus handler
- `onDragEnd: (id: string, position: { x: number; y: number }) => void` - Drag handler
- `onResizeEnd: (id: string, size: { width: number; height: number }) => void` - Resize handler

### WindowManager

Container that manages all active windows.

```tsx
import { WindowManager } from '@/features/windows';

<WindowManager
  windows={windowsRecord}
  focusedWindowId="window-1"
  onFocusWindow={(id) => focus(id)}
  onCloseWindow={(id) => close(id)}
  onMinimizeWindow={(id) => minimize(id)}
  onMaximizeWindow={(id) => maximize(id)}
  onUpdatePosition={(id, pos) => updatePos(id, pos)}
  onUpdateSize={(id, size) => updateSize(id, size)}
/>
```

**Props**:
- `windows?: Record<string, WindowState>` - Window states
- `focusedWindowId?: string | null` - Currently focused window
- `onFocusWindow?: (id: string) => void` - Focus handler
- `onCloseWindow?: (id: string) => void` - Close handler
- `onMinimizeWindow?: (id: string) => void` - Minimize handler
- `onMaximizeWindow?: (id: string) => void` - Maximize handler
- `onUpdatePosition?: (id: string, position: { x: number; y: number }) => void` - Position handler
- `onUpdateSize?: (id: string, size: { width: number; height: number }) => void` - Size handler

### WindowContextMenu

Right-click context menu for window title bars.

```tsx
import { WindowContextMenu } from '@/features/windows';

<WindowContextMenu
  isMaximized={false}
  onRestore={() => restore()}
  onMinimize={() => minimize()}
  onMaximize={() => maximize()}
  onClose={() => close()}
  onMove={() => enterMoveMode()}
  onResize={() => enterResizeMode()}
>
  {/* Wrap window title bar */}
</WindowContextMenu>
```

**Props**:
- `children: React.ReactNode` - Content to wrap
- `isMaximized?: boolean` - Window maximized state
- `onRestore?: () => void` - Restore handler
- `onMinimize?: () => void` - Minimize handler
- `onMaximize?: () => void` - Maximize handler
- `onClose?: () => void` - Close handler
- `onMove?: () => void` - Move handler
- `onResize?: () => void` - Resize handler

## Usage Example

Complete desktop setup:

```tsx
import {
  DesktopShell,
  DesktopArea,
  DesktopIcon,
  Taskbar,
  DesktopContextMenu,
} from '@/features/desktop';
import { WindowManager } from '@/features/windows';

function Desktop() {
  return (
    <DesktopShell wallpaper="/wallpaper.jpg" theme="dark">
      <DesktopContextMenu>
        <DesktopArea>
          {/* Desktop Icons */}
          <DesktopIcon {...iconProps} />

          {/* Window Manager */}
          <WindowManager {...windowProps} />
        </DesktopArea>
      </DesktopContextMenu>

      {/* Taskbar */}
      <Taskbar {...taskbarProps} />
    </DesktopShell>
  );
}
```

## Styling

All components use Tailwind CSS and support dark mode. Custom styles are in:
- `client/src/styles/window-resizable.css` - Resize handle styles

## Performance Tips

1. Use `React.memo` for window components
2. Debounce resize/drag events
3. Use CSS transforms for positioning
4. Minimize re-renders with proper state management
5. Use hardware acceleration for animations

## Accessibility

- Full keyboard navigation in context menus
- ARIA labels on all interactive elements
- Focus indicators on all focusable elements
- Screen reader support with semantic HTML
- Respects `prefers-reduced-motion`

## Browser Support

- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

## Notes for Backend Integration

Replace demo state management in `DesktopPage.tsx` with Zustand stores. See `WEEK2_FRONTEND_IMPLEMENTATION.md` for detailed integration guide.
