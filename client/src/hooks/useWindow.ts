/**
 * Window Hook
 * Convenience hook for accessing window store with derived state and actions
 */

import { useCallback, useMemo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { WindowPosition, WindowSize, WindowStateType } from '../types/desktop';

export function useWindow(windowId?: string) {
  const store = useWindowStore();

  // Get specific window if ID provided
  const window = useMemo(() => {
    return windowId ? store.getWindow(windowId) : null;
  }, [windowId, store.windows]);

  // Derived state
  const visibleWindows = useMemo(() => store.getVisibleWindows(), [store.windows]);
  const minimizedWindows = useMemo(() => store.getMinimizedWindows(), [store.windows]);
  const focusedWindow = useMemo(() => {
    return store.focusedWindowId ? store.getWindow(store.focusedWindowId) : null;
  }, [store.focusedWindowId, store.windows]);

  const windowCount = useMemo(() => Object.keys(store.windows).length, [store.windows]);
  const visibleWindowCount = useMemo(() => visibleWindows.length, [visibleWindows]);
  const minimizedWindowCount = useMemo(() => minimizedWindows.length, [minimizedWindows]);

  const hasWindows = useMemo(() => windowCount > 0, [windowCount]);
  const hasVisibleWindows = useMemo(() => visibleWindowCount > 0, [visibleWindowCount]);
  const hasMinimizedWindows = useMemo(() => minimizedWindowCount > 0, [minimizedWindowCount]);

  // Memoized actions for specific window
  const close = useCallback(() => {
    if (windowId) store.closeWindow(windowId);
  }, [windowId, store]);

  const minimize = useCallback(() => {
    if (windowId) store.minimizeWindow(windowId);
  }, [windowId, store]);

  const maximize = useCallback(() => {
    if (windowId) store.maximizeWindow(windowId);
  }, [windowId, store]);

  const restore = useCallback(() => {
    if (windowId) store.restoreWindow(windowId);
  }, [windowId, store]);

  const focus = useCallback(() => {
    if (windowId) store.focusWindow(windowId);
  }, [windowId, store]);

  const move = useCallback((position: WindowPosition) => {
    if (windowId) store.updateWindowPosition(windowId, position);
  }, [windowId, store]);

  const resize = useCallback((size: WindowSize) => {
    if (windowId) store.updateWindowSize(windowId, size);
  }, [windowId, store]);

  const updateTitle = useCallback((title: string) => {
    if (windowId) store.updateWindowTitle(windowId, title);
  }, [windowId, store]);

  const updateState = useCallback((state: WindowStateType) => {
    if (windowId) store.updateWindowState(windowId, state);
  }, [windowId, store]);

  // General window actions
  const createWindow = useCallback((appId: string, config?: any) => {
    return store.createWindow(appId, config);
  }, [store]);

  const getWindowsByApp = useCallback((appId: string) => {
    return store.getWindowsByApp(appId);
  }, [store.windows]);

  const closeAll = useCallback(() => {
    Object.keys(store.windows).forEach(id => store.closeWindow(id));
  }, [store]);

  const minimizeAll = useCallback(() => {
    visibleWindows.forEach(win => store.minimizeWindow(win.id));
  }, [visibleWindows, store]);

  const restoreAll = useCallback(() => {
    minimizedWindows.forEach(win => store.restoreWindow(win.id));
  }, [minimizedWindows, store]);

  // Window state checks
  const isMinimized = useMemo(() => window?.state === 'minimized', [window]);
  const isMaximized = useMemo(() => window?.state === 'maximized', [window]);
  const isNormal = useMemo(() => window?.state === 'normal', [window]);
  const isFocused = useMemo(() => window?.focused || false, [window]);

  return {
    // Current window state (if ID provided)
    window,
    isMinimized,
    isMaximized,
    isNormal,
    isFocused,

    // Current window actions (if ID provided)
    close,
    minimize,
    maximize,
    restore,
    focus,
    move,
    resize,
    updateTitle,
    updateState,

    // Global window state
    windows: store.windows,
    visibleWindows,
    minimizedWindows,
    focusedWindow,
    focusedWindowId: store.focusedWindowId,
    windowCount,
    visibleWindowCount,
    minimizedWindowCount,
    hasWindows,
    hasVisibleWindows,
    hasMinimizedWindows,

    // Global window actions
    createWindow,
    getWindowsByApp,
    closeAll,
    minimizeAll,
    restoreAll,

    // Store actions
    closeWindow: store.closeWindow,
    minimizeWindow: store.minimizeWindow,
    maximizeWindow: store.maximizeWindow,
    restoreWindow: store.restoreWindow,
    focusWindow: store.focusWindow,
    updateWindowPosition: store.updateWindowPosition,
    updateWindowSize: store.updateWindowSize,
    updateWindowTitle: store.updateWindowTitle,
    updateWindowState: store.updateWindowState,
    getWindow: store.getWindow,
    saveWindowState: store.saveWindowState,
    loadWindowState: store.loadWindowState,
    resetWindows: store.resetWindows
  };
}
