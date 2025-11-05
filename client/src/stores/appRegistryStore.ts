/**
 * App Registry Store
 * Central registry for all available applications with launch logic
 */

import { create } from 'zustand';
import { AppManifest, LaunchConfig } from '../types/desktop';
import { useWindowStore } from './windowStore';

interface AppRegistryStore {
  // State
  apps: Record<string, AppManifest>;
  installedApps: string[];
  loading: boolean;
  error: string | null;

  // Actions
  registerApp: (manifest: AppManifest) => void;
  unregisterApp: (appId: string) => void;
  launchApp: (appId: string, config?: LaunchConfig) => Promise<string>;

  // Queries
  getApp: (appId: string) => AppManifest | null;
  listApps: (category?: string) => AppManifest[];
  searchApps: (query: string) => AppManifest[];
  isAppInstalled: (appId: string) => boolean;

  // Initialization
  loadSystemApps: () => Promise<void>;

  // Reset
  resetRegistry: () => void;
}

export const useAppRegistryStore = create<AppRegistryStore>((set, get) => ({
  apps: {},
  installedApps: [],
  loading: false,
  error: null,

  // Register a new application
  registerApp: (manifest: AppManifest) => {
    const state = get();

    // Validate manifest
    if (!manifest.id || !manifest.name || !manifest.component) {
      console.error('Invalid app manifest:', manifest);
      return;
    }

    // Check for duplicate
    if (state.apps[manifest.id]) {
      console.warn(`App ${manifest.id} is already registered. Overwriting...`);
    }

    set({
      apps: {
        ...state.apps,
        [manifest.id]: manifest
      },
      installedApps: state.installedApps.includes(manifest.id)
        ? state.installedApps
        : [...state.installedApps, manifest.id]
    });

    console.log(`App registered: ${manifest.name} (${manifest.id})`);
  },

  // Unregister an application
  unregisterApp: (appId: string) => {
    const state = get();
    const { [appId]: removed, ...remainingApps } = state.apps;

    set({
      apps: remainingApps,
      installedApps: state.installedApps.filter((id) => id !== appId)
    });

    console.log(`App unregistered: ${appId}`);
  },

  // Launch an application
  launchApp: async (appId: string, config?: LaunchConfig) => {
    const state = get();
    const app = state.apps[appId];

    if (!app) {
      const error = `App ${appId} not found in registry`;
      console.error(error);
      set({ error });
      throw new Error(error);
    }

    try {
      // For now, allow multiple instances
      // In the future, we could add a "singleInstance" flag to AppManifest
      // to check if app already has windows open

      // Create window with app configuration
      const windowConfig = {
        title: app.name,
        icon: app.icon,
        position: config?.position,
        size: config?.size || app.windowConfig.defaultSize,
        state: config?.state,
        resizable: app.windowConfig.resizable,
        maximizable: app.windowConfig.maximizable
      };

      const windowId = useWindowStore.getState().createWindow(appId, windowConfig);

      console.log(`App launched: ${app.name} (window: ${windowId})`);

      return windowId;
    } catch (error) {
      const errorMsg = `Failed to launch app ${appId}: ${error}`;
      console.error(errorMsg);
      set({ error: errorMsg });
      throw error;
    }
  },

  // Get a specific app
  getApp: (appId: string) => {
    return get().apps[appId] || null;
  },

  // List all apps (optionally filtered by category)
  listApps: (category?: string) => {
    const apps = Object.values(get().apps);

    if (category) {
      return apps.filter((app) => app.category === category);
    }

    return apps;
  },

  // Search apps by name or description
  searchApps: (query: string) => {
    const apps = Object.values(get().apps);
    const lowerQuery = query.toLowerCase();

    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(lowerQuery) ||
        app.description.toLowerCase().includes(lowerQuery) ||
        app.category.toLowerCase().includes(lowerQuery)
    );
  },

  // Check if app is installed
  isAppInstalled: (appId: string) => {
    return get().installedApps.includes(appId);
  },

  // Load system applications
  loadSystemApps: async () => {
    set({ loading: true, error: null });

    try {
      // System apps will be registered by individual app modules
      // This function ensures the registry is ready

      // In the future, we could load apps dynamically from the backend
      // const response = await fetch('/api/apps');
      // const apps = await response.json();
      // apps.forEach(app => get().registerApp(app));

      set({ loading: false });
      console.log('System apps loaded');
    } catch (error) {
      const errorMsg = `Failed to load system apps: ${error}`;
      console.error(errorMsg);
      set({ error: errorMsg, loading: false });
    }
  },

  // Reset registry
  resetRegistry: () => {
    set({
      apps: {},
      installedApps: [],
      loading: false,
      error: null
    });
  }
}));

// Initialize registry on module load
if (typeof window !== 'undefined') {
  useAppRegistryStore.getState().loadSystemApps();
}
