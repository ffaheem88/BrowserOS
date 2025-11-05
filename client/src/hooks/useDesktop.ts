/**
 * Desktop Hook
 * Convenience hook for accessing desktop store with derived state and actions
 */

import { useCallback, useMemo } from 'react';
import { useDesktopStore } from '../stores/desktopStore';
import { DesktopIcon } from '../types/desktop';

export function useDesktop() {
  const store = useDesktopStore();

  // Memoized derived state
  const isDarkMode = useMemo(() => store.theme === 'dark', [store.theme]);
  const isLightMode = useMemo(() => store.theme === 'light', [store.theme]);
  const hasIcons = useMemo(() => store.icons.length > 0, [store.icons.length]);
  const iconCount = useMemo(() => store.icons.length, [store.icons.length]);

  // Memoized actions
  const setDarkMode = useCallback(() => {
    store.setTheme('dark');
  }, [store]);

  const setLightMode = useCallback(() => {
    store.setTheme('light');
  }, [store]);

  const toggleTheme = useCallback(() => {
    store.toggleTheme();
  }, [store]);

  const changeWallpaper = useCallback((url: string) => {
    store.setWallpaper(url);
  }, [store]);

  const addDesktopIcon = useCallback((icon: DesktopIcon) => {
    store.addIcon(icon);
  }, [store]);

  const removeDesktopIcon = useCallback((id: string) => {
    store.removeIcon(id);
  }, [store]);

  const moveIcon = useCallback((id: string, x: number, y: number) => {
    store.updateIconPosition(id, { x, y });
  }, [store]);

  const getIcon = useCallback((id: string) => {
    return store.icons.find(icon => icon.id === id) || null;
  }, [store.icons]);

  const pinApp = useCallback((appId: string) => {
    const pinnedApps = store.taskbar.pinnedApps;
    if (!pinnedApps.includes(appId)) {
      store.updateTaskbarConfig({
        pinnedApps: [...pinnedApps, appId]
      });
    }
  }, [store]);

  const unpinApp = useCallback((appId: string) => {
    store.updateTaskbarConfig({
      pinnedApps: store.taskbar.pinnedApps.filter(id => id !== appId)
    });
  }, [store]);

  const isAppPinned = useCallback((appId: string) => {
    return store.taskbar.pinnedApps.includes(appId);
  }, [store.taskbar.pinnedApps]);

  return {
    // State
    wallpaper: store.wallpaper,
    theme: store.theme,
    icons: store.icons,
    taskbar: store.taskbar,
    loading: store.loading,
    error: store.error,

    // Derived state
    isDarkMode,
    isLightMode,
    hasIcons,
    iconCount,

    // Actions
    setDarkMode,
    setLightMode,
    toggleTheme,
    changeWallpaper,
    addDesktopIcon,
    removeDesktopIcon,
    moveIcon,
    getIcon,
    pinApp,
    unpinApp,
    isAppPinned,

    // Store actions
    setWallpaper: store.setWallpaper,
    setTheme: store.setTheme,
    addIcon: store.addIcon,
    removeIcon: store.removeIcon,
    updateIconPosition: store.updateIconPosition,
    updateTaskbarConfig: store.updateTaskbarConfig,
    loadDesktopState: store.loadDesktopState,
    saveDesktopState: store.saveDesktopState,
    resetDesktop: store.resetDesktop
  };
}
