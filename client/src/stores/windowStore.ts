/**
 * Window Store
 * Manages all active windows including lifecycle, focus, and z-index management
 */

import { create } from 'zustand';
import { WindowState, WindowPosition, WindowSize, WindowStateType } from '../types/desktop';

interface WindowStore {
  // State
  windows: Record<string, WindowState>;
  focusedWindowId: string | null;
  nextZIndex: number;

  // Window Actions
  createWindow: (
    appId: string,
    config?: Partial<Omit<WindowState, 'id' | 'appId' | 'zIndex' | 'focused'>>
  ) => string;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, position: WindowPosition) => void;
  updateWindowSize: (id: string, size: WindowSize) => void;
  updateWindowTitle: (id: string, title: string) => void;
  updateWindowState: (id: string, state: WindowStateType) => void;

  // Queries
  getWindow: (id: string) => WindowState | null;
  getVisibleWindows: () => WindowState[];
  getMinimizedWindows: () => WindowState[];
  getWindowsByApp: (appId: string) => WindowState[];

  // Persistence
  saveWindowState: () => Promise<void>;
  loadWindowState: () => Promise<void>;

  // Utilities
  cascadePosition: () => WindowPosition;
  compactZIndices: () => void;

  // Reset
  resetWindows: () => void;
}

// Base z-index for windows
const BASE_Z_INDEX = 100;
const CASCADE_OFFSET = 30;

// Helper to calculate cascade position for new windows
let lastCascadeX = 50;
let lastCascadeY = 50;

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: {},
  focusedWindowId: null,
  nextZIndex: BASE_Z_INDEX,

  // Create a new window
  createWindow: (appId, config = {}) => {
    const state = get();
    const id = `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get default position (cascading)
    const defaultPosition = state.cascadePosition();

    // Create window state
    const newWindow: WindowState = {
      id,
      appId,
      title: config.title || 'Untitled',
      icon: config.icon,
      position: config.position || defaultPosition,
      size: config.size || { width: 800, height: 600 },
      state: config.state || 'normal',
      zIndex: state.nextZIndex,
      focused: true,
      resizable: config.resizable !== undefined ? config.resizable : true,
      movable: config.movable !== undefined ? config.movable : true,
      minimizable: config.minimizable !== undefined ? config.minimizable : true,
      maximizable: config.maximizable !== undefined ? config.maximizable : true
    };

    // Unfocus all other windows
    const updatedWindows = Object.fromEntries(
      Object.entries(state.windows).map(([key, win]) => [
        key,
        { ...win, focused: false }
      ])
    );

    set({
      windows: {
        ...updatedWindows,
        [id]: newWindow
      },
      focusedWindowId: id,
      nextZIndex: state.nextZIndex + 1
    });

    // Compact z-indices if getting too large
    if (state.nextZIndex > 1000) {
      setTimeout(() => get().compactZIndices(), 0);
    }

    // Auto-save window state
    setTimeout(() => get().saveWindowState(), 1000);

    return id;
  },

  // Close a window
  closeWindow: (id: string) => {
    const state = get();
    const { [id]: removed, ...remainingWindows } = state.windows;

    // If closing focused window, focus another window
    let newFocusedId = state.focusedWindowId;
    if (state.focusedWindowId === id) {
      const visibleWindows = Object.values(remainingWindows)
        .filter((w) => w.state !== 'minimized')
        .sort((a, b) => b.zIndex - a.zIndex);

      newFocusedId = visibleWindows[0]?.id || null;
    }

    set({
      windows: remainingWindows,
      focusedWindowId: newFocusedId
    });

    // Focus the new window if any
    if (newFocusedId && newFocusedId !== id) {
      get().focusWindow(newFocusedId);
    }

    // Auto-save
    setTimeout(() => get().saveWindowState(), 1000);
  },

  // Minimize a window
  minimizeWindow: (id: string) => {
    const state = get();
    const window = state.windows[id];
    if (!window || !window.minimizable) return;

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, state: 'minimized', focused: false }
      },
      focusedWindowId: state.focusedWindowId === id ? null : state.focusedWindowId
    });

    // Focus another window if needed
    if (state.focusedWindowId === id) {
      const visibleWindows = Object.values(state.windows)
        .filter((w) => w.id !== id && w.state !== 'minimized')
        .sort((a, b) => b.zIndex - a.zIndex);

      if (visibleWindows[0]) {
        setTimeout(() => get().focusWindow(visibleWindows[0].id), 0);
      }
    }

    setTimeout(() => get().saveWindowState(), 1000);
  },

  // Maximize a window
  maximizeWindow: (id: string) => {
    const state = get();
    const window = state.windows[id];
    if (!window || !window.maximizable) return;

    const newState: WindowStateType = window.state === 'maximized' ? 'normal' : 'maximized';

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, state: newState }
      }
    });

    // Focus the window
    get().focusWindow(id);

    setTimeout(() => get().saveWindowState(), 1000);
  },

  // Restore a window from minimized or maximized state
  restoreWindow: (id: string) => {
    const state = get();
    const window = state.windows[id];
    if (!window) return;

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, state: 'normal' }
      }
    });

    // Focus the window
    get().focusWindow(id);

    setTimeout(() => get().saveWindowState(), 1000);
  },

  // Focus a window (brings to front)
  focusWindow: (id: string) => {
    const state = get();
    const window = state.windows[id];
    if (!window) return;

    // Unfocus all windows
    const updatedWindows = Object.fromEntries(
      Object.entries(state.windows).map(([key, win]) => [
        key,
        {
          ...win,
          focused: key === id,
          zIndex: key === id ? state.nextZIndex : win.zIndex
        }
      ])
    );

    set({
      windows: updatedWindows,
      focusedWindowId: id,
      nextZIndex: state.nextZIndex + 1
    });

    // Compact z-indices if needed
    if (state.nextZIndex > 1000) {
      setTimeout(() => get().compactZIndices(), 0);
    }
  },

  // Update window position
  updateWindowPosition: (id: string, position: WindowPosition) => {
    const state = get();
    const window = state.windows[id];
    if (!window || !window.movable) return;

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, position }
      }
    });

    // Debounced save
    setTimeout(() => get().saveWindowState(), 2000);
  },

  // Update window size
  updateWindowSize: (id: string, size: WindowSize) => {
    const state = get();
    const window = state.windows[id];
    if (!window || !window.resizable) return;

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, size }
      }
    });

    // Debounced save
    setTimeout(() => get().saveWindowState(), 2000);
  },

  // Update window title
  updateWindowTitle: (id: string, title: string) => {
    const state = get();
    const window = state.windows[id];
    if (!window) return;

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, title }
      }
    });
  },

  // Update window state
  updateWindowState: (id: string, windowState: WindowStateType) => {
    const state = get();
    const window = state.windows[id];
    if (!window) return;

    set({
      windows: {
        ...state.windows,
        [id]: { ...window, state: windowState }
      }
    });

    setTimeout(() => get().saveWindowState(), 1000);
  },

  // Get a specific window
  getWindow: (id: string) => {
    return get().windows[id] || null;
  },

  // Get all visible windows
  getVisibleWindows: () => {
    return Object.values(get().windows)
      .filter((w) => w.state !== 'minimized')
      .sort((a, b) => a.zIndex - b.zIndex);
  },

  // Get all minimized windows
  getMinimizedWindows: () => {
    return Object.values(get().windows).filter((w) => w.state === 'minimized');
  },

  // Get windows by app ID
  getWindowsByApp: (appId: string) => {
    return Object.values(get().windows).filter((w) => w.appId === appId);
  },

  // Save window state to storage
  saveWindowState: async () => {
    try {
      const state = get();
      const stateToSave = {
        windows: state.windows,
        focusedWindowId: state.focusedWindowId
      };

      localStorage.setItem('windowState', JSON.stringify(stateToSave));

      // TODO: Sync with backend API when available
      // await fetch('/api/desktop/windows', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(stateToSave)
      // });

    } catch (error) {
      console.error('Failed to save window state:', error);
    }
  },

  // Load window state from storage
  loadWindowState: async () => {
    try {
      const cached = localStorage.getItem('windowState');
      if (cached) {
        const state = JSON.parse(cached);
        set({
          windows: state.windows || {},
          focusedWindowId: state.focusedWindowId || null
        });
      }

      // TODO: Fetch from backend API when available
      // const response = await fetch('/api/desktop/windows');
      // const data = await response.json();
      // set({ windows: data.windows, focusedWindowId: data.focusedWindowId });

    } catch (error) {
      console.error('Failed to load window state:', error);
    }
  },

  // Calculate cascade position for new window
  cascadePosition: () => {
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const maxY = Math.max(100, screenHeight - 500); // Keep windows visible

    lastCascadeX += CASCADE_OFFSET;
    lastCascadeY += CASCADE_OFFSET;

    // Reset if cascaded too far
    if (lastCascadeX > 400 || lastCascadeY > maxY) {
      lastCascadeX = 50;
      lastCascadeY = 50;
    }

    return { x: lastCascadeX, y: lastCascadeY };
  },

  // Compact z-indices to prevent overflow
  compactZIndices: () => {
    const state = get();
    const sortedWindows = Object.values(state.windows).sort((a, b) => a.zIndex - b.zIndex);

    const updatedWindows: Record<string, WindowState> = {};
    sortedWindows.forEach((window, index) => {
      updatedWindows[window.id] = {
        ...window,
        zIndex: BASE_Z_INDEX + index
      };
    });

    set({
      windows: updatedWindows,
      nextZIndex: BASE_Z_INDEX + sortedWindows.length
    });
  },

  // Reset all windows
  resetWindows: () => {
    set({
      windows: {},
      focusedWindowId: null,
      nextZIndex: BASE_Z_INDEX
    });
    localStorage.removeItem('windowState');
  }
}));

// Initialize window state on module load
if (typeof window !== 'undefined') {
  useWindowStore.getState().loadWindowState();
}
