/**
 * State Management Demo
 * Example of how to use the BrowserOS state management system
 */

import { useEffect } from 'react';
import { useDesktop } from '../hooks/useDesktop';
import { useWindow } from '../hooks/useWindow';
import { useAppRegistry } from '../hooks/useAppRegistry';
import { registerSystemApps } from '../features/apps';

/**
 * Demo component showing all state management features
 */
export function StateManagementDemo() {
  const desktop = useDesktop();
  const window = useWindow();
  const appRegistry = useAppRegistry();

  // Initialize on mount
  useEffect(() => {
    // Register system apps
    registerSystemApps();

    // Load desktop state
    desktop.loadDesktopState();

    // Load window state
    window.loadWindowState();
  }, []);

  const handleLaunchCalculator = async () => {
    try {
      const windowId = await appRegistry.launchApp('calculator');
      console.log('Calculator launched:', windowId);
    } catch (error) {
      console.error('Failed to launch calculator:', error);
    }
  };

  const handleLaunchNotes = async () => {
    try {
      const windowId = await appRegistry.launchApp('notes', {
        position: { x: 150, y: 150 },
        size: { width: 700, height: 550 }
      });
      console.log('Notes launched:', windowId);
    } catch (error) {
      console.error('Failed to launch notes:', error);
    }
  };

  const handleLaunchClock = async () => {
    try {
      const windowId = await appRegistry.launchApp('clock');
      console.log('Clock launched:', windowId);
    } catch (error) {
      console.error('Failed to launch clock:', error);
    }
  };

  const handleAddDesktopIcon = () => {
    desktop.addIcon({
      id: `icon-${Date.now()}`,
      appId: 'calculator',
      icon: '🔢',
      label: 'Calculator',
      position: { x: 20 + desktop.iconCount * 20, y: 20 }
    });
  };

  const handleToggleTheme = () => {
    desktop.toggleTheme();
  };

  const handleMinimizeAll = () => {
    window.minimizeAll();
  };

  const handleCloseAll = () => {
    if (typeof globalThis.window !== 'undefined' && globalThis.window.confirm('Close all windows?')) {
      window.closeAll();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            BrowserOS State Management Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Testing the Zustand stores, hooks, and application framework
          </p>

          {/* Desktop State */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Desktop State
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Theme
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {desktop.theme}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Desktop Icons
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {desktop.iconCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Taskbar Position
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {desktop.taskbar.position}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pinned Apps
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {desktop.taskbar.pinnedApps.length}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleToggleTheme}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Toggle Theme
              </button>
              <button
                onClick={handleAddDesktopIcon}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Desktop Icon
              </button>
            </div>
          </section>

          {/* Window State */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Window State
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Windows
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.windowCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Visible
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.visibleWindowCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Minimized
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {window.minimizedWindowCount}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleMinimizeAll}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                disabled={!window.hasVisibleWindows}
              >
                Minimize All
              </button>
              <button
                onClick={handleCloseAll}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={!window.hasWindows}
              >
                Close All
              </button>
            </div>
          </section>

          {/* App Registry */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              App Registry
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Registered Apps
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {appRegistry.appCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Running Apps
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {appRegistry.runningAppCount}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Categories
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {appRegistry.categories.length}
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Sample Applications
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleLaunchCalculator}
                className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                <div className="text-4xl mb-2">🔢</div>
                <div className="font-semibold">Calculator</div>
                <div className="text-xs opacity-80">
                  {appRegistry.isAppRunning ? 'Running' : 'Launch'}
                </div>
              </button>

              <button
                onClick={handleLaunchNotes}
                className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
              >
                <div className="text-4xl mb-2">📝</div>
                <div className="font-semibold">Notes</div>
                <div className="text-xs opacity-80">Launch</div>
              </button>

              <button
                onClick={handleLaunchClock}
                className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <div className="text-4xl mb-2">🕐</div>
                <div className="font-semibold">Clock</div>
                <div className="text-xs opacity-80">Launch</div>
              </button>
            </div>
          </section>

          {/* Active Windows */}
          {window.hasWindows && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
                Active Windows
              </h2>
              <div className="space-y-2">
                {window.visibleWindows.map((win) => (
                  <div
                    key={win.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {appRegistry.getAppIcon(win.appId)}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {win.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {win.size.width}x{win.size.height} · z-index: {win.zIndex}
                        </div>
                      </div>
                      {win.focused && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          Focused
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.minimizeWindow(win.id)}
                        className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                      >
                        Minimize
                      </button>
                      <button
                        onClick={() => window.closeWindow(win.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
