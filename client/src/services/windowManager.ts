/**
 * Window Manager Service
 * Business logic for window operations and management
 */

import { useWindowStore } from '../stores/windowStore';
import { useAppRegistryStore } from '../stores/appRegistryStore';
import { WindowPosition, WindowSize, LaunchConfig } from '../types/desktop';

/**
 * Window Manager Service
 * Provides high-level window management operations
 */
export class WindowManagerService {
  /**
   * Launch an application and create its window
   */
  static async launchApp(appId: string, config?: LaunchConfig): Promise<string> {
    try {
      return await useAppRegistryStore.getState().launchApp(appId, config);
    } catch (error) {
      console.error(`Failed to launch app ${appId}:`, error);
      throw error;
    }
  }

  /**
   * Close a window
   */
  static closeWindow(windowId: string): void {
    useWindowStore.getState().closeWindow(windowId);
  }

  /**
   * Minimize a window
   */
  static minimizeWindow(windowId: string): void {
    useWindowStore.getState().minimizeWindow(windowId);
  }

  /**
   * Maximize a window
   */
  static maximizeWindow(windowId: string): void {
    useWindowStore.getState().maximizeWindow(windowId);
  }

  /**
   * Restore a window to normal state
   */
  static restoreWindow(windowId: string): void {
    useWindowStore.getState().restoreWindow(windowId);
  }

  /**
   * Focus a window (bring to front)
   */
  static focusWindow(windowId: string): void {
    useWindowStore.getState().focusWindow(windowId);
  }

  /**
   * Toggle window maximize state
   */
  static toggleMaximize(windowId: string): void {
    const window = useWindowStore.getState().getWindow(windowId);
    if (!window) return;

    if (window.state === 'maximized') {
      this.restoreWindow(windowId);
    } else {
      this.maximizeWindow(windowId);
    }
  }

  /**
   * Move window to position
   */
  static moveWindow(windowId: string, position: WindowPosition): void {
    useWindowStore.getState().updateWindowPosition(windowId, position);
  }

  /**
   * Resize window
   */
  static resizeWindow(windowId: string, size: WindowSize): void {
    useWindowStore.getState().updateWindowSize(windowId, size);
  }

  /**
   * Update window title
   */
  static updateWindowTitle(windowId: string, title: string): void {
    useWindowStore.getState().updateWindowTitle(windowId, title);
  }

  /**
   * Get all visible windows
   */
  static getVisibleWindows() {
    return useWindowStore.getState().getVisibleWindows();
  }

  /**
   * Get all minimized windows
   */
  static getMinimizedWindows() {
    return useWindowStore.getState().getMinimizedWindows();
  }

  /**
   * Get windows for a specific app
   */
  static getAppWindows(appId: string) {
    return useWindowStore.getState().getWindowsByApp(appId);
  }

  /**
   * Close all windows
   */
  static closeAllWindows(): void {
    const windows = useWindowStore.getState().windows;
    Object.keys(windows).forEach((windowId) => {
      this.closeWindow(windowId);
    });
  }

  /**
   * Minimize all windows
   */
  static minimizeAllWindows(): void {
    const windows = useWindowStore.getState().getVisibleWindows();
    windows.forEach((window) => {
      this.minimizeWindow(window.id);
    });
  }

  /**
   * Restore all minimized windows
   */
  static restoreAllWindows(): void {
    const windows = useWindowStore.getState().getMinimizedWindows();
    windows.forEach((window) => {
      this.restoreWindow(window.id);
    });
  }

  /**
   * Cascade windows (arrange in cascade pattern)
   */
  static cascadeWindows(): void {
    const windows = useWindowStore.getState().getVisibleWindows();
    const startX = 50;
    const startY = 50;
    const offsetX = 30;
    const offsetY = 30;

    windows.forEach((window, index) => {
      const position = {
        x: startX + index * offsetX,
        y: startY + index * offsetY
      };
      this.moveWindow(window.id, position);
    });
  }

  /**
   * Tile windows (arrange in grid)
   */
  static tileWindows(): void {
    const windows = useWindowStore.getState().getVisibleWindows();
    if (windows.length === 0) return;

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight - 48 : 1080; // Account for taskbar

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(windows.length));
    const rows = Math.ceil(windows.length / cols);

    const windowWidth = Math.floor(screenWidth / cols);
    const windowHeight = Math.floor(screenHeight / rows);

    windows.forEach((win, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      const position = {
        x: col * windowWidth,
        y: row * windowHeight
      };

      const size = {
        width: windowWidth,
        height: windowHeight
      };

      this.moveWindow(win.id, position);
      this.resizeWindow(win.id, size);

      // Ensure window is in normal state
      if (win.state !== 'normal') {
        useWindowStore.getState().updateWindowState(win.id, 'normal');
      }
    });
  }

  /**
   * Center window on screen
   */
  static centerWindow(windowId: string): void {
    const win = useWindowStore.getState().getWindow(windowId);
    if (!win) return;

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

    const position = {
      x: Math.floor((screenWidth - win.size.width) / 2),
      y: Math.floor((screenHeight - win.size.height) / 2)
    };

    this.moveWindow(windowId, position);
  }

  /**
   * Ensure window is within screen bounds
   */
  static constrainWindowToScreen(windowId: string): void {
    const win = useWindowStore.getState().getWindow(windowId);
    if (!win) return;

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight - 48 : 1080; // Account for taskbar

    let { x, y } = win.position;
    let { width, height } = win.size;

    // Constrain position
    x = Math.max(0, Math.min(x, screenWidth - width));
    y = Math.max(0, Math.min(y, screenHeight - height));

    // Constrain size
    width = Math.min(width, screenWidth);
    height = Math.min(height, screenHeight);

    if (x !== win.position.x || y !== win.position.y) {
      this.moveWindow(windowId, { x, y });
    }

    if (width !== win.size.width || height !== win.size.height) {
      this.resizeWindow(windowId, { width, height });
    }
  }

  /**
   * Get focused window
   */
  static getFocusedWindow() {
    const focusedId = useWindowStore.getState().focusedWindowId;
    return focusedId ? useWindowStore.getState().getWindow(focusedId) : null;
  }

  /**
   * Focus next window (cycling)
   */
  static focusNextWindow(): void {
    const windows = useWindowStore.getState().getVisibleWindows();
    if (windows.length === 0) return;

    const focusedId = useWindowStore.getState().focusedWindowId;
    const currentIndex = windows.findIndex((w) => w.id === focusedId);

    const nextIndex = (currentIndex + 1) % windows.length;
    this.focusWindow(windows[nextIndex].id);
  }

  /**
   * Focus previous window (cycling)
   */
  static focusPreviousWindow(): void {
    const windows = useWindowStore.getState().getVisibleWindows();
    if (windows.length === 0) return;

    const focusedId = useWindowStore.getState().focusedWindowId;
    const currentIndex = windows.findIndex((w) => w.id === focusedId);

    const previousIndex = currentIndex <= 0 ? windows.length - 1 : currentIndex - 1;
    this.focusWindow(windows[previousIndex].id);
  }

  /**
   * Check if app has any open windows
   */
  static isAppRunning(appId: string): boolean {
    return useWindowStore.getState().getWindowsByApp(appId).length > 0;
  }

  /**
   * Close all windows for an app
   */
  static closeAppWindows(appId: string): void {
    const windows = useWindowStore.getState().getWindowsByApp(appId);
    windows.forEach((window) => {
      this.closeWindow(window.id);
    });
  }

  /**
   * Save window state
   */
  static async saveWindowState(): Promise<void> {
    await useWindowStore.getState().saveWindowState();
  }

  /**
   * Load window state
   */
  static async loadWindowState(): Promise<void> {
    await useWindowStore.getState().loadWindowState();
  }
}

// Keyboard shortcuts
export function setupWindowManagerKeyboardShortcuts() {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (event: KeyboardEvent) => {
    // Alt + Tab: Focus next window
    if (event.altKey && event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        WindowManagerService.focusPreviousWindow();
      } else {
        WindowManagerService.focusNextWindow();
      }
    }

    // Alt + F4: Close focused window
    if (event.altKey && event.key === 'F4') {
      event.preventDefault();
      const focused = WindowManagerService.getFocusedWindow();
      if (focused) {
        WindowManagerService.closeWindow(focused.id);
      }
    }

    // Win + D: Minimize all windows
    if (event.metaKey && event.key === 'd') {
      event.preventDefault();
      WindowManagerService.minimizeAllWindows();
    }

    // Win + Up: Maximize focused window
    if (event.metaKey && event.key === 'ArrowUp') {
      event.preventDefault();
      const focused = WindowManagerService.getFocusedWindow();
      if (focused) {
        WindowManagerService.maximizeWindow(focused.id);
      }
    }

    // Win + Down: Restore focused window
    if (event.metaKey && event.key === 'ArrowDown') {
      event.preventDefault();
      const focused = WindowManagerService.getFocusedWindow();
      if (focused) {
        WindowManagerService.restoreWindow(focused.id);
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}
