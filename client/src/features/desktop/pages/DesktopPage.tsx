import React, { useState } from 'react';
import {
  DesktopShell,
  DesktopArea,
  DesktopIcon,
  Taskbar,
  DesktopContextMenu,
} from '../components';
import { WindowManager } from '../../windows';
import { Settings, FolderOpen, Info } from 'lucide-react';

/**
 * DesktopPage - The main desktop environment
 *
 * This is a demo implementation that showcases all desktop features.
 * In production, this will integrate with Zustand stores created by Backend Logic Expert.
 *
 * Features demonstrated:
 * - Beautiful wallpaper and desktop shell
 * - Draggable desktop icons
 * - Window manager with multiple windows
 * - Taskbar with active windows
 * - Context menus
 * - Smooth animations
 */
export function DesktopPage() {
  // Demo state (will be replaced with Zustand stores)
  const [windows, setWindows] = useState<Record<string, any>>({});
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // Helper to constrain window positions to keep them visible
  const constrainPosition = (position: { x: number; y: number }, size: { width: number; height: number }) => {
    const taskbarHeight = 48;
    const minY = 0;
    const maxY = Math.max(50, window.innerHeight - taskbarHeight - 100);
    const minX = -size.width + 100; // Allow partial off-screen left
    const maxX = Math.max(100, window.innerWidth - 100);

    return {
      x: Math.max(minX, Math.min(maxX, position.x)),
      y: Math.max(minY, Math.min(maxY, position.y)),
    };
  };

  // Helper to compact z-indices when they get too large
  const compactZIndices = () => {
    if (nextZIndex > 1000) {
      console.log('[Z-INDEX] Compacting z-indices...');
      const sortedWindows = Object.values(windows).sort((a: any, b: any) => a.zIndex - b.zIndex);
      const compacted: Record<string, any> = {};

      sortedWindows.forEach((win: any, index: number) => {
        compacted[win.id] = {
          ...win,
          zIndex: 100 + index,
        };
      });

      setWindows(compacted);
      setNextZIndex(100 + sortedWindows.length);
      console.log('[Z-INDEX] Compacted to range 100-' + (100 + sortedWindows.length));
    }
  };

  // Demo desktop icons - using React components instead of SVG paths
  const [icons, setIcons] = useState([
    {
      id: 'icon-1',
      appId: 'file-explorer',
      icon: FolderOpen,
      label: 'File Explorer',
      position: { x: 20, y: 20 },
    },
    {
      id: 'icon-2',
      appId: 'settings',
      icon: Settings,
      label: 'Settings',
      position: { x: 20, y: 120 },
    },
    {
      id: 'icon-3',
      appId: 'welcome',
      icon: Info,
      label: 'Welcome',
      position: { x: 20, y: 220 },
    },
  ]);

  // Create a new window
  const createWindow = (appId: string, config?: any) => {
    const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const zIndex = nextZIndex;

    const appConfigs: Record<string, any> = {
      'file-explorer': {
        title: 'File Explorer',
        size: { width: 800, height: 600 },
      },
      settings: {
        title: 'Settings',
        size: { width: 700, height: 500 },
      },
      welcome: {
        title: 'Welcome to BrowserOS',
        size: { width: 600, height: 400 },
      },
    };

    const appConfig = appConfigs[appId] || {
      title: 'New Window',
      size: { width: 800, height: 600 },
    };

    // Simple cascading position
    const windowCount = Object.keys(windows).length;
    const cascadeOffset = 30;
    const maxCascadeSteps = 10; // Reset position after 10 windows
    const cascadeStep = windowCount % maxCascadeSteps;

    // Start from a safe position and cascade
    const initialX = 100 + (cascadeStep * cascadeOffset);
    const initialY = 50 + (cascadeStep * cascadeOffset);

    // Constrain the position to ensure it's visible
    const constrainedPosition = constrainPosition(
      { x: initialX, y: initialY },
      appConfig.size
    );

    console.log(`[CREATE WINDOW] Creating window ${id}:
      App: ${appId}
      Window #${windowCount + 1} (cascade step ${cascadeStep})
      Position: x=${constrainedPosition.x}, y=${constrainedPosition.y} (initial: ${initialX},${initialY})
      Size: ${appConfig.size.width}x${appConfig.size.height}
      Viewport: ${window.innerWidth}x${window.innerHeight}
      Existing windows: ${Object.keys(windows).length}`);

    const newWindow = {
      id,
      appId,
      title: appConfig.title,
      position: constrainedPosition,
      size: appConfig.size,
      state: 'normal',
      zIndex,
      focused: true,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      content: getWindowContent(appId),
      ...config,
    };

    setWindows((prev) => {
      // Unfocus all existing windows
      const unfocusedWindows: Record<string, any> = {};
      Object.keys(prev).forEach((key) => {
        unfocusedWindows[key] = {
          ...prev[key],
          focused: false,
        };
      });

      // Add the new focused window
      const updated = {
        ...unfocusedWindows,
        [id]: newWindow,
      };

      console.log(`[WINDOWS STATE] After create:`, Object.keys(updated).map(k => ({
        id: k,
        position: updated[k].position,
        state: updated[k].state,
        zIndex: updated[k].zIndex,
        focused: updated[k].focused,
      })));
      return updated;
    });

    setFocusedWindowId(id);
    setNextZIndex(zIndex + 1);

    // Compact z-indices if getting too large
    if (zIndex > 1000) {
      setTimeout(compactZIndices, 0);
    }

    return id;
  };

  // Get window content based on app
  const getWindowContent = (appId: string) => {
    const contents: Record<string, React.ReactNode> = {
      'file-explorer': (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <FolderOpen className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold">File Explorer</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your personal file system in the cloud.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <FolderOpen className="w-6 h-6 mb-2 text-blue-500" />
              <div className="font-medium">Documents</div>
              <div className="text-sm text-slate-500">12 items</div>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <FolderOpen className="w-6 h-6 mb-2 text-green-500" />
              <div className="font-medium">Pictures</div>
              <div className="text-sm text-slate-500">48 items</div>
            </div>
          </div>
        </div>
      ),
      settings: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-8 h-8 text-purple-500" />
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Customize your BrowserOS experience.
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="font-medium mb-1">Appearance</div>
              <div className="text-sm text-slate-500">
                Theme, wallpaper, and colors
              </div>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="font-medium mb-1">Desktop</div>
              <div className="text-sm text-slate-500">
                Icons, taskbar, and layout
              </div>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="font-medium mb-1">System</div>
              <div className="text-sm text-slate-500">
                Performance and updates
              </div>
            </div>
          </div>
        </div>
      ),
      welcome: (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-8 h-8 text-blue-500" />
            <h2 className="text-2xl font-bold">Welcome to BrowserOS</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your browser-based operating system is ready!
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <div className="font-medium mb-1">Drag & Drop</div>
              <div className="text-sm opacity-90">
                Move windows and icons anywhere you like
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg">
              <div className="font-medium mb-1">Resize Windows</div>
              <div className="text-sm opacity-90">
                Grab any edge or corner to resize
              </div>
            </div>
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg">
              <div className="font-medium mb-1">Multiple Apps</div>
              <div className="text-sm opacity-90">
                Run multiple applications simultaneously
              </div>
            </div>
          </div>
        </div>
      ),
    };

    return contents[appId];
  };

  // Handle window actions
  const handleCloseWindow = (id: string) => {
    setWindows((prev) => {
      const newWindows = { ...prev };
      delete newWindows[id];
      return newWindows;
    });

    if (focusedWindowId === id) {
      setFocusedWindowId(null);
    }
  };

  const handleMinimizeWindow = (id: string) => {
    setWindows((prev) => {
      const window = prev[id];
      // Preserve position and size when minimizing
      return {
        ...prev,
        [id]: {
          ...window,
          state: 'minimized',
          // Store the previous state to restore later
          previousState: window.state,
          savedPosition: window.position,
          savedSize: window.size,
        },
      };
    });

    if (focusedWindowId === id) {
      setFocusedWindowId(null);
    }
  };

  const handleMaximizeWindow = (id: string) => {
    setWindows((prev) => {
      const window = prev[id];
      const isCurrentlyMaximized = window.state === 'maximized';

      return {
        ...prev,
        [id]: {
          ...window,
          state: isCurrentlyMaximized ? 'normal' : 'maximized',
          // Save position and size before maximizing
          savedPosition: isCurrentlyMaximized ? window.savedPosition : window.position,
          savedSize: isCurrentlyMaximized ? window.savedSize : window.size,
          // Restore position when un-maximizing
          position: isCurrentlyMaximized
            ? (window.savedPosition || window.position)
            : window.position,
          size: isCurrentlyMaximized
            ? (window.savedSize || window.size)
            : window.size,
        },
      };
    });
  };

  const handleFocusWindow = (id: string) => {
    setFocusedWindowId(id);

    // Unfocus all windows first, then focus the target window
    setWindows((prev) => {
      const updated: Record<string, any> = {};

      // Unfocus all windows
      Object.keys(prev).forEach((key) => {
        updated[key] = {
          ...prev[key],
          focused: false,
        };
      });

      // Focus the target window and bring it to front
      if (updated[id]) {
        updated[id] = {
          ...updated[id],
          focused: true,
          zIndex: nextZIndex,
        };
      }

      return updated;
    });

    setNextZIndex(nextZIndex + 1);

    // Compact z-indices if getting too large
    if (nextZIndex > 1000) {
      setTimeout(compactZIndices, 0);
    }
  };

  const handleUpdatePosition = (id: string, position: { x: number; y: number }) => {
    console.log(`[UPDATE POSITION] Window ${id} moved to:`, position);
    setWindows((prev) => {
      const updated = {
        ...prev,
        [id]: { ...prev[id], position },
      };
      console.log(`[WINDOWS STATE] After position update:`, Object.keys(updated).map(k => ({
        id: k,
        position: updated[k].position,
        state: updated[k].state,
      })));
      return updated;
    });
  };

  const handleUpdateSize = (id: string, size: { width: number; height: number }) => {
    setWindows((prev) => ({
      ...prev,
      [id]: { ...prev[id], size },
    }));
  };

  // Handle icon actions
  const handleIconDoubleClick = (appId: string) => {
    createWindow(appId);
  };

  const handleIconDragEnd = (id: string, position: { x: number; y: number }) => {
    setIcons((prev) =>
      prev.map((icon) => (icon.id === id ? { ...icon, position } : icon))
    );
  };

  const handleIconContextMenu = (_e: React.MouseEvent, id: string) => {
    setSelectedIconId(id);
  };

  // Handle taskbar actions
  const handleAppClick = (windowId: string) => {
    const window = windows[windowId];
    if (window) {
      if (window.state === 'minimized') {
        // Restore from minimized - restore previous state and position
        setWindows((prev) => {
          const win = prev[windowId];
          return {
            ...prev,
            [windowId]: {
              ...win,
              state: win.previousState || 'normal',
              // Restore saved position and size
              position: win.savedPosition || win.position,
              size: win.savedSize || win.size,
            },
          };
        });
      }
      handleFocusWindow(windowId);
    }
  };

  const handleStartClick = () => {
    // TODO: Open start menu
    console.log('Start menu will be implemented in Week 3');
  };

  // Convert windows to taskbar apps
  const taskbarApps = Object.values(windows).map((window) => ({
    id: window.id,
    appId: window.appId,
    title: window.title,
    icon: window.icon,
    isActive: true,
    isFocused: window.id === focusedWindowId,
  }));

  return (
    <DesktopShell
      wallpaper="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop"
      theme="dark"
    >
      <DesktopContextMenu
        onRefresh={() => console.log('Refresh desktop')}
        onPersonalize={() => console.log('Open personalization')}
        onNewFolder={() => console.log('Create new folder')}
        onNewFile={() => console.log('Create new file')}
      >
        <DesktopArea>
          {/* Window Manager - render first so icons are on top in z-order */}
          <WindowManager
            windows={windows}
            focusedWindowId={focusedWindowId}
            onFocusWindow={handleFocusWindow}
            onCloseWindow={handleCloseWindow}
            onMinimizeWindow={handleMinimizeWindow}
            onMaximizeWindow={handleMaximizeWindow}
            onUpdatePosition={handleUpdatePosition}
            onUpdateSize={handleUpdateSize}
          />

          {/* Desktop Icons - render after windows so they're clickable */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {icons.map((icon) => (
              <DesktopIcon
                key={icon.id}
                id={icon.id}
                appId={icon.appId}
                icon={icon.icon}
                label={icon.label}
                position={icon.position}
                selected={selectedIconId === icon.id}
                onDoubleClick={handleIconDoubleClick}
                onContextMenu={handleIconContextMenu}
                onDragEnd={handleIconDragEnd}
                onSelect={setSelectedIconId}
              />
            ))}
          </div>
        </DesktopArea>
      </DesktopContextMenu>

      {/* Taskbar */}
      <Taskbar
        apps={taskbarApps}
        pinnedApps={['file-explorer', 'settings', 'terminal']}
        onAppClick={handleAppClick}
        onStartClick={handleStartClick}
      />
    </DesktopShell>
  );
}
