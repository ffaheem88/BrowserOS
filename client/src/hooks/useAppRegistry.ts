/**
 * App Registry Hook
 * Convenience hook for accessing app registry with derived state and actions
 */

import { useCallback, useMemo } from 'react';
import { useAppRegistryStore } from '../stores/appRegistryStore';
import { AppManifest, LaunchConfig } from '../types/desktop';
import { useWindowStore } from '../stores/windowStore';

export function useAppRegistry(appId?: string) {
  const store = useAppRegistryStore();
  const windowStore = useWindowStore();

  // Get specific app if ID provided
  const app = useMemo(() => {
    return appId ? store.getApp(appId) : null;
  }, [appId, store.apps]);

  // Derived state
  const appCount = useMemo(() => Object.keys(store.apps).length, [store.apps]);
  const installedAppCount = useMemo(() => store.installedApps.length, [store.installedApps]);
  const hasApps = useMemo(() => appCount > 0, [appCount]);

  const appList = useMemo(() => store.listApps(), [store.apps]);
  const appsByCategory = useMemo(() => {
    const categories: Record<string, AppManifest[]> = {};
    appList.forEach(app => {
      if (!categories[app.category]) {
        categories[app.category] = [];
      }
      categories[app.category].push(app);
    });
    return categories;
  }, [appList]);

  const categories = useMemo(() => Object.keys(appsByCategory), [appsByCategory]);

  // Check if specific app is running
  const isAppRunning = useMemo(() => {
    if (!appId) return false;
    return windowStore.getWindowsByApp(appId).length > 0;
  }, [appId, windowStore.windows]);

  const runningAppCount = useMemo(() => {
    const uniqueAppIds = new Set(
      Object.values(windowStore.windows).map(w => w.appId)
    );
    return uniqueAppIds.size;
  }, [windowStore.windows]);

  // Memoized actions
  const launch = useCallback(async (config?: LaunchConfig) => {
    if (!appId) throw new Error('No app ID provided');
    return await store.launchApp(appId, config);
  }, [appId, store]);

  const launchApp = useCallback(async (targetAppId: string, config?: LaunchConfig) => {
    return await store.launchApp(targetAppId, config);
  }, [store]);

  const register = useCallback((manifest: AppManifest) => {
    store.registerApp(manifest);
  }, [store]);

  const unregister = useCallback((targetAppId: string) => {
    store.unregisterApp(targetAppId);
  }, [store]);

  const search = useCallback((query: string) => {
    return store.searchApps(query);
  }, [store]);

  const getAppsByCategory = useCallback((category: string) => {
    return store.listApps(category);
  }, [store]);

  const isInstalled = useCallback((targetAppId: string) => {
    return store.isAppInstalled(targetAppId);
  }, [store.installedApps]);

  const getAppWindows = useCallback((targetAppId: string) => {
    return windowStore.getWindowsByApp(targetAppId);
  }, [windowStore.windows]);

  const closeAppWindows = useCallback((targetAppId: string) => {
    const windows = windowStore.getWindowsByApp(targetAppId);
    windows.forEach(window => windowStore.closeWindow(window.id));
  }, [windowStore]);

  // App metadata helpers
  const getAppIcon = useCallback((targetAppId: string) => {
    const targetApp = store.getApp(targetAppId);
    return targetApp?.icon || '📦';
  }, [store.apps]);

  const getAppName = useCallback((targetAppId: string) => {
    const targetApp = store.getApp(targetAppId);
    return targetApp?.name || 'Unknown App';
  }, [store.apps]);

  const getAppDescription = useCallback((targetAppId: string) => {
    const targetApp = store.getApp(targetAppId);
    return targetApp?.description || '';
  }, [store.apps]);

  return {
    // Current app state (if ID provided)
    app,
    isAppRunning,

    // Current app actions (if ID provided)
    launch,

    // Global app state
    apps: store.apps,
    appList,
    appsByCategory,
    categories,
    installedApps: store.installedApps,
    loading: store.loading,
    error: store.error,
    appCount,
    installedAppCount,
    runningAppCount,
    hasApps,

    // Global app actions
    launchApp,
    register,
    unregister,
    search,
    getAppsByCategory,
    isInstalled,
    getAppWindows,
    closeAppWindows,
    getAppIcon,
    getAppName,
    getAppDescription,

    // Store actions
    registerApp: store.registerApp,
    unregisterApp: store.unregisterApp,
    getApp: store.getApp,
    listApps: store.listApps,
    searchApps: store.searchApps,
    isAppInstalled: store.isAppInstalled,
    loadSystemApps: store.loadSystemApps,
    resetRegistry: store.resetRegistry
  };
}
