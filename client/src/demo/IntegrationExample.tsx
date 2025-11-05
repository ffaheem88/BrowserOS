/**
 * Integration Example
 * Complete example showing how to integrate state management with UI components
 */

import { useEffect } from 'react';
import { useDesktop } from '../hooks/useDesktop';
import { useWindow } from '../hooks/useWindow';
import { useAppRegistry } from '../hooks/useAppRegistry';
import { registerSystemApps } from '../features/apps';
import { setupWindowManagerKeyboardShortcuts } from '../services/windowManager';

/**
 * Example: Desktop Integration
 * Shows how to use desktop state in components
 */
export function DesktopExample() {
  const { theme, wallpaper, toggleTheme } = useDesktop();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundImage: `url(${wallpaper})` }}
      data-theme={theme}
    >
      <button onClick={toggleTheme}>Toggle Theme ({theme})</button>
    </div>
  );
}

/**
 * Example: Window Management
 * Shows how to create and manage windows
 */
export function WindowManagementExample() {
  const { launchApp } = useAppRegistry();
  const { visibleWindows, minimizeAll, closeAll } = useWindow();

  const handleLaunchCalculator = async () => {
    await launchApp('calculator');
  };

  return (
    <div>
      <h2>Window Management</h2>
      <button onClick={handleLaunchCalculator}>Launch Calculator</button>
      <button onClick={minimizeAll}>Minimize All</button>
      <button onClick={closeAll}>Close All</button>

      <div>
        <h3>Active Windows: {visibleWindows.length}</h3>
        {visibleWindows.map((win) => (
          <div key={win.id}>
            {win.title} - {win.size.width}x{win.size.height}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: App Launcher
 * Shows how to build an app launcher menu
 */
export function AppLauncherExample() {
  const { appList, launchApp } = useAppRegistry();

  return (
    <div className="grid grid-cols-3 gap-4">
      {appList.map((app) => (
        <button
          key={app.id}
          onClick={() => launchApp(app.id)}
          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="text-4xl mb-2">{app.icon}</div>
          <div className="font-semibold">{app.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {app.category}
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Example: Desktop Icons
 * Shows how to render and manage desktop icons
 */
export function DesktopIconsExample() {
  const { icons, addIcon, removeIcon } = useDesktop();

  const handleAddIcon = () => {
    addIcon({
      id: `icon-${Date.now()}`,
      appId: 'calculator',
      icon: '🔢',
      label: 'Calculator',
      position: { x: 20 + icons.length * 100, y: 20 }
    });
  };

  return (
    <div>
      <button onClick={handleAddIcon}>Add Icon</button>

      <div className="relative w-full h-screen">
        {icons.map((icon) => (
          <div
            key={icon.id}
            className="absolute w-20 text-center cursor-pointer"
            style={{
              left: icon.position.x,
              top: icon.position.y
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              removeIcon(icon.id);
            }}
          >
            <div className="text-4xl mb-1">{icon.icon}</div>
            <div className="text-sm">{icon.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Taskbar
 * Shows how to build a taskbar with active windows
 */
export function TaskbarExample() {
  const { visibleWindows, minimizedWindows, focusWindow, restoreWindow } = useWindow();
  const { getAppIcon, getAppName } = useAppRegistry();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-12 bg-gray-900 flex items-center gap-2 px-4">
      {/* Active Windows */}
      {visibleWindows.map((win) => (
        <button
          key={win.id}
          onClick={() => focusWindow(win.id)}
          className={`px-3 py-1.5 rounded ${
            win.focused ? 'bg-blue-600' : 'bg-gray-700'
          } hover:bg-blue-500 transition-colors`}
        >
          <span className="mr-2">{getAppIcon(win.appId)}</span>
          <span className="text-sm text-white">{win.title}</span>
        </button>
      ))}

      {/* Minimized Windows */}
      {minimizedWindows.map((win) => (
        <button
          key={win.id}
          onClick={() => restoreWindow(win.id)}
          className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition-colors opacity-50"
        >
          <span className="mr-2">{getAppIcon(win.appId)}</span>
          <span className="text-sm text-white">{getAppName(win.appId)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Example: Complete Desktop Setup
 * Shows how to initialize everything on app start
 */
export function CompleteDesktopSetup() {
  const desktop = useDesktop();
  const window = useWindow();

  useEffect(() => {
    // 1. Register all system applications
    registerSystemApps();

    // 2. Load desktop state from storage
    desktop.loadDesktopState();

    // 3. Load window state from storage
    window.loadWindowState();

    // 4. Set up keyboard shortcuts
    const cleanup = setupWindowManagerKeyboardShortcuts();

    // 5. Clean up on unmount
    return cleanup;
  }, []);

  return (
    <div>
      <p>Desktop initialized!</p>
      <p>Theme: {desktop.theme}</p>
      <p>Windows: {window.windowCount}</p>
    </div>
  );
}

/**
 * Example: State Persistence
 * Shows how state automatically persists
 */
export function StatePersistenceExample() {
  const { theme, setTheme } = useDesktop();

  // State automatically persists to localStorage
  // and will sync with backend when API is ready

  const handleChangeTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    // Auto-saves after 2 seconds
    // No manual save needed!
  };

  return (
    <div>
      <button onClick={handleChangeTheme}>
        Change Theme (auto-saves)
      </button>
    </div>
  );
}

/**
 * Example: Window Controls in App
 * Shows how apps can control their own window
 */
export function AppWithWindowControlsExample() {
  const { close, minimize, maximize, updateTitle } = useWindow('window-id-here');

  useEffect(() => {
    updateTitle('My Custom Title');
  }, []);

  return (
    <div className="h-full flex flex-col p-4">
      <header className="flex justify-between items-center mb-4">
        <h1>My Application</h1>
        <div className="flex gap-2">
          <button onClick={minimize}>Minimize</button>
          <button onClick={maximize}>Maximize</button>
          <button onClick={close}>Close</button>
        </div>
      </header>

      <main className="flex-1">
        {/* App content */}
      </main>
    </div>
  );
}

/**
 * Example: Search Apps
 * Shows how to implement app search
 */
export function AppSearchExample() {
  const { searchApps, launchApp } = useAppRegistry();

  const handleSearch = (query: string) => {
    const results = searchApps(query);
    console.log('Search results:', results);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search apps..."
        onChange={(e) => handleSearch(e.target.value)}
        className="px-4 py-2 border rounded"
      />
    </div>
  );
}

/**
 * Example: App Categories
 * Shows how to organize apps by category
 */
export function AppCategoriesExample() {
  const { appsByCategory, launchApp } = useAppRegistry();

  return (
    <div>
      {Object.entries(appsByCategory).map(([category, apps]) => (
        <div key={category} className="mb-6">
          <h2 className="text-xl font-bold mb-3">{category}</h2>
          <div className="grid grid-cols-4 gap-4">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => launchApp(app.id)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-lg"
              >
                <div className="text-3xl mb-2">{app.icon}</div>
                <div className="font-medium">{app.name}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Desktop Context Menu
 * Shows how to implement right-click menu
 */
export function DesktopContextMenuExample() {
  const { toggleTheme, addIcon } = useDesktop();
  const { launchApp } = useAppRegistry();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();

    // Show context menu at cursor position
    const menu = [
      { label: 'New Calculator', action: () => launchApp('calculator') },
      { label: 'New Notes', action: () => launchApp('notes') },
      { label: 'Toggle Theme', action: toggleTheme },
      { label: 'Add Icon', action: () => addIcon({
        id: `icon-${Date.now()}`,
        appId: 'calculator',
        icon: '🔢',
        label: 'Calculator',
        position: { x: e.clientX, y: e.clientY }
      })}
    ];

    // Render menu (using Radix UI or similar)
    console.log('Context menu:', menu);
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="w-full h-screen bg-gray-100"
    >
      Right-click anywhere
    </div>
  );
}
