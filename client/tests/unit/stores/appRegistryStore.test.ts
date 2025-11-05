/**
 * App Registry Store Unit Tests
 * Comprehensive tests for application registration and launch logic
 *
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppRegistryStore } from '@/stores/appRegistryStore';
import { useWindowStore } from '@/stores/windowStore';
import type { AppManifest } from '@/types/desktop';
import { createElement } from 'react';

// Mock component for testing
const MockAppComponent = () => createElement('div', null, 'Mock App');

describe('appRegistryStore', () => {
  const createTestManifest = (id: string, overrides: Partial<AppManifest> = {}): AppManifest => ({
    id,
    name: `Test App ${id}`,
    version: '1.0.0',
    description: `Description for ${id}`,
    author: 'Test Author',
    icon: `/icon-${id}.png`,
    category: 'Utilities',
    permissions: [],
    windowConfig: {
      defaultSize: { width: 800, height: 600 },
      minSize: { width: 400, height: 300 },
      resizable: true,
      maximizable: true
    },
    component: MockAppComponent,
    ...overrides
  });

  beforeEach(() => {
    useAppRegistryStore.getState().resetRegistry();
    useWindowStore.getState().resetWindows();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('has correct default state', () => {
      const state = useAppRegistryStore.getState();

      expect(state.apps).toEqual({});
      expect(state.installedApps).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('App Registration', () => {
    it('registers app successfully', () => {
      const manifest = createTestManifest('text-editor');
      useAppRegistryStore.getState().registerApp(manifest);

      const app = useAppRegistryStore.getState().getApp('text-editor');
      expect(app).toEqual(manifest);
      expect(useAppRegistryStore.getState().installedApps).toContain('text-editor');
    });

    it('registers multiple apps', () => {
      const manifest1 = createTestManifest('app1');
      const manifest2 = createTestManifest('app2');
      const manifest3 = createTestManifest('app3');

      useAppRegistryStore.getState().registerApp(manifest1);
      useAppRegistryStore.getState().registerApp(manifest2);
      useAppRegistryStore.getState().registerApp(manifest3);

      expect(Object.keys(useAppRegistryStore.getState().apps)).toHaveLength(3);
      expect(useAppRegistryStore.getState().installedApps).toHaveLength(3);
    });

    it('overwrites existing app when registering duplicate ID', () => {
      const manifest1 = createTestManifest('app1', { version: '1.0.0' });
      const manifest2 = createTestManifest('app1', { version: '2.0.0' });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      useAppRegistryStore.getState().registerApp(manifest1);
      useAppRegistryStore.getState().registerApp(manifest2);

      const app = useAppRegistryStore.getState().getApp('app1');
      expect(app?.version).toBe('2.0.0');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('does not register invalid manifest (missing id)', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidManifest = { ...createTestManifest('test'), id: '' };

      useAppRegistryStore.getState().registerApp(invalidManifest);

      expect(Object.keys(useAppRegistryStore.getState().apps)).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('does not register invalid manifest (missing name)', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidManifest = { ...createTestManifest('test'), name: '' };

      useAppRegistryStore.getState().registerApp(invalidManifest);

      expect(Object.keys(useAppRegistryStore.getState().apps)).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('does not register invalid manifest (missing component)', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidManifest = { ...createTestManifest('test'), component: null as any };

      useAppRegistryStore.getState().registerApp(invalidManifest);

      expect(Object.keys(useAppRegistryStore.getState().apps)).toHaveLength(0);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('does not duplicate app ID in installedApps', () => {
      const manifest = createTestManifest('app1');

      useAppRegistryStore.getState().registerApp(manifest);
      useAppRegistryStore.getState().registerApp(manifest);

      const installedApps = useAppRegistryStore.getState().installedApps;
      expect(installedApps.filter(id => id === 'app1')).toHaveLength(1);
    });
  });

  describe('App Unregistration', () => {
    it('unregisters app successfully', () => {
      const manifest = createTestManifest('text-editor');
      useAppRegistryStore.getState().registerApp(manifest);

      useAppRegistryStore.getState().unregisterApp('text-editor');

      const app = useAppRegistryStore.getState().getApp('text-editor');
      expect(app).toBeNull();
      expect(useAppRegistryStore.getState().installedApps).not.toContain('text-editor');
    });

    it('handles unregistering non-existent app', () => {
      expect(() => {
        useAppRegistryStore.getState().unregisterApp('non-existent');
      }).not.toThrow();

      expect(useAppRegistryStore.getState().installedApps).toHaveLength(0);
    });

    it('removes app from apps object', () => {
      const manifest = createTestManifest('app1');
      useAppRegistryStore.getState().registerApp(manifest);

      useAppRegistryStore.getState().unregisterApp('app1');

      expect(useAppRegistryStore.getState().apps['app1']).toBeUndefined();
    });

    it('removes app from installedApps array', () => {
      const manifest1 = createTestManifest('app1');
      const manifest2 = createTestManifest('app2');
      const manifest3 = createTestManifest('app3');

      useAppRegistryStore.getState().registerApp(manifest1);
      useAppRegistryStore.getState().registerApp(manifest2);
      useAppRegistryStore.getState().registerApp(manifest3);

      useAppRegistryStore.getState().unregisterApp('app2');

      const installedApps = useAppRegistryStore.getState().installedApps;
      expect(installedApps).toHaveLength(2);
      expect(installedApps).toContain('app1');
      expect(installedApps).toContain('app3');
      expect(installedApps).not.toContain('app2');
    });
  });

  describe('App Launch', () => {
    it('launches app successfully', async () => {
      const manifest = createTestManifest('text-editor');
      useAppRegistryStore.getState().registerApp(manifest);

      const windowId = await useAppRegistryStore.getState().launchApp('text-editor');

      expect(windowId).toBeTruthy();
      const window = useWindowStore.getState().getWindow(windowId);
      expect(window).toBeDefined();
      expect(window?.appId).toBe('text-editor');
      expect(window?.title).toBe('Test App text-editor');
    });

    it('creates window with app configuration', async () => {
      const manifest = createTestManifest('calculator', {
        windowConfig: {
          defaultSize: { width: 400, height: 500 },
          resizable: false,
          maximizable: false
        }
      });

      useAppRegistryStore.getState().registerApp(manifest);
      const windowId = await useAppRegistryStore.getState().launchApp('calculator');

      const window = useWindowStore.getState().getWindow(windowId);
      expect(window?.size).toEqual({ width: 400, height: 500 });
      expect(window?.resizable).toBe(false);
      expect(window?.maximizable).toBe(false);
    });

    it('allows launching with custom launch config', async () => {
      const manifest = createTestManifest('text-editor');
      useAppRegistryStore.getState().registerApp(manifest);

      const launchConfig = {
        position: { x: 200, y: 300 },
        size: { width: 1000, height: 800 },
        state: 'maximized' as const
      };

      const windowId = await useAppRegistryStore.getState().launchApp('text-editor', launchConfig);

      const window = useWindowStore.getState().getWindow(windowId);
      expect(window?.position).toEqual(launchConfig.position);
      expect(window?.size).toEqual(launchConfig.size);
      expect(window?.state).toBe('maximized');
    });

    it('throws error when launching non-existent app', async () => {
      await expect(
        useAppRegistryStore.getState().launchApp('non-existent')
      ).rejects.toThrow('App non-existent not found in registry');

      expect(useAppRegistryStore.getState().error).toBeTruthy();
    });

    it('allows multiple instances of same app', async () => {
      const manifest = createTestManifest('text-editor');
      useAppRegistryStore.getState().registerApp(manifest);

      const windowId1 = await useAppRegistryStore.getState().launchApp('text-editor');
      const windowId2 = await useAppRegistryStore.getState().launchApp('text-editor');
      const windowId3 = await useAppRegistryStore.getState().launchApp('text-editor');

      expect(windowId1).not.toBe(windowId2);
      expect(windowId2).not.toBe(windowId3);

      const windows = useWindowStore.getState().getWindowsByApp('text-editor');
      expect(windows).toHaveLength(3);
    });

    it('logs app launch', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const manifest = createTestManifest('text-editor');
      useAppRegistryStore.getState().registerApp(manifest);

      await useAppRegistryStore.getState().launchApp('text-editor');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('App launched: Test App text-editor')
      );
    });

    it('handles launch errors gracefully', async () => {
      const manifest = createTestManifest('broken-app');
      useAppRegistryStore.getState().registerApp(manifest);

      // Mock windowStore.createWindow to throw error
      const originalCreate = useWindowStore.getState().createWindow;
      useWindowStore.setState({
        createWindow: () => {
          throw new Error('Window creation failed');
        }
      });

      await expect(
        useAppRegistryStore.getState().launchApp('broken-app')
      ).rejects.toThrow();

      expect(useAppRegistryStore.getState().error).toBeTruthy();

      // Restore
      useWindowStore.setState({ createWindow: originalCreate });
    });
  });

  describe('App Queries', () => {
    beforeEach(() => {
      const manifests = [
        createTestManifest('text-editor', { category: 'Productivity' }),
        createTestManifest('calculator', { category: 'Utilities' }),
        createTestManifest('browser', { category: 'Internet', name: 'Web Browser' }),
        createTestManifest('terminal', { category: 'Development' }),
        createTestManifest('file-manager', { category: 'System' })
      ];

      manifests.forEach(m => useAppRegistryStore.getState().registerApp(m));
    });

    it('gets app by ID', () => {
      const app = useAppRegistryStore.getState().getApp('text-editor');

      expect(app).toBeDefined();
      expect(app?.id).toBe('text-editor');
      expect(app?.category).toBe('Productivity');
    });

    it('returns null for non-existent app', () => {
      const app = useAppRegistryStore.getState().getApp('non-existent');

      expect(app).toBeNull();
    });

    it('lists all apps', () => {
      const apps = useAppRegistryStore.getState().listApps();

      expect(apps).toHaveLength(5);
    });

    it('lists apps by category', () => {
      const utilityApps = useAppRegistryStore.getState().listApps('Utilities');

      expect(utilityApps).toHaveLength(1);
      expect(utilityApps[0].id).toBe('calculator');
    });

    it('returns empty array for non-existent category', () => {
      const apps = useAppRegistryStore.getState().listApps('NonExistent');

      expect(apps).toEqual([]);
    });

    it('searches apps by name', () => {
      const results = useAppRegistryStore.getState().searchApps('browser');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('browser');
    });

    it('searches apps by description', () => {
      const results = useAppRegistryStore.getState().searchApps('calculator');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(app => app.id === 'calculator')).toBe(true);
    });

    it('searches apps by category', () => {
      const results = useAppRegistryStore.getState().searchApps('development');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('terminal');
    });

    it('search is case-insensitive', () => {
      const results1 = useAppRegistryStore.getState().searchApps('BROWSER');
      const results2 = useAppRegistryStore.getState().searchApps('browser');
      const results3 = useAppRegistryStore.getState().searchApps('BrOwSeR');

      expect(results1).toEqual(results2);
      expect(results2).toEqual(results3);
    });

    it('returns empty array for no search matches', () => {
      const results = useAppRegistryStore.getState().searchApps('nonexistent-query-xyz');

      expect(results).toEqual([]);
    });

    it('checks if app is installed', () => {
      expect(useAppRegistryStore.getState().isAppInstalled('text-editor')).toBe(true);
      expect(useAppRegistryStore.getState().isAppInstalled('calculator')).toBe(true);
      expect(useAppRegistryStore.getState().isAppInstalled('non-existent')).toBe(false);
    });
  });

  describe('System Apps Loading', () => {
    it('loads system apps successfully', async () => {
      useAppRegistryStore.setState({ loading: true });

      await useAppRegistryStore.getState().loadSystemApps();

      expect(useAppRegistryStore.getState().loading).toBe(false);
      expect(useAppRegistryStore.getState().error).toBeNull();
    });

    it('sets loading state during load', async () => {
      const loadPromise = useAppRegistryStore.getState().loadSystemApps();

      expect(useAppRegistryStore.getState().loading).toBe(true);

      await loadPromise;

      expect(useAppRegistryStore.getState().loading).toBe(false);
    });

    it('logs successful load', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await useAppRegistryStore.getState().loadSystemApps();

      expect(consoleSpy).toHaveBeenCalledWith('System apps loaded');
    });
  });

  describe('Reset', () => {
    it('resets registry to initial state', () => {
      // Add some apps
      const manifests = [
        createTestManifest('app1'),
        createTestManifest('app2'),
        createTestManifest('app3')
      ];

      manifests.forEach(m => useAppRegistryStore.getState().registerApp(m));

      // Reset
      useAppRegistryStore.getState().resetRegistry();

      const state = useAppRegistryStore.getState();
      expect(state.apps).toEqual({});
      expect(state.installedApps).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('clears errors on reset', () => {
      useAppRegistryStore.setState({ error: 'Some error' });

      useAppRegistryStore.getState().resetRegistry();

      expect(useAppRegistryStore.getState().error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles registering many apps', () => {
      for (let i = 0; i < 100; i++) {
        useAppRegistryStore.getState().registerApp(createTestManifest(`app-${i}`));
      }

      expect(Object.keys(useAppRegistryStore.getState().apps)).toHaveLength(100);
      expect(useAppRegistryStore.getState().installedApps).toHaveLength(100);
    });

    it('handles launching multiple apps simultaneously', async () => {
      const manifests = [
        createTestManifest('app1'),
        createTestManifest('app2'),
        createTestManifest('app3')
      ];

      manifests.forEach(m => useAppRegistryStore.getState().registerApp(m));

      const launchPromises = manifests.map(m =>
        useAppRegistryStore.getState().launchApp(m.id)
      );

      const windowIds = await Promise.all(launchPromises);

      expect(windowIds).toHaveLength(3);
      windowIds.forEach(id => {
        expect(id).toBeTruthy();
        expect(useWindowStore.getState().getWindow(id)).toBeDefined();
      });
    });

    it('maintains registry consistency during concurrent operations', async () => {
      const manifest1 = createTestManifest('app1');
      const manifest2 = createTestManifest('app2');

      useAppRegistryStore.getState().registerApp(manifest1);
      useAppRegistryStore.getState().registerApp(manifest2);

      await Promise.all([
        useAppRegistryStore.getState().launchApp('app1'),
        useAppRegistryStore.getState().launchApp('app2'),
        useAppRegistryStore.getState().launchApp('app1')
      ]);

      expect(Object.keys(useAppRegistryStore.getState().apps)).toHaveLength(2);
      expect(useWindowStore.getState().getWindowsByApp('app1')).toHaveLength(2);
      expect(useWindowStore.getState().getWindowsByApp('app2')).toHaveLength(1);
    });

    it('handles special characters in app IDs', () => {
      const specialIds = [
        'app-with-dashes',
        'app_with_underscores',
        'app.with.dots',
        'app123'
      ];

      specialIds.forEach(id => {
        useAppRegistryStore.getState().registerApp(createTestManifest(id));
      });

      specialIds.forEach(id => {
        expect(useAppRegistryStore.getState().getApp(id)).toBeDefined();
      });
    });

    it('handles apps with minimal configuration', () => {
      const minimalManifest: AppManifest = {
        id: 'minimal-app',
        name: 'Minimal App',
        version: '1.0.0',
        description: 'A minimal app',
        author: 'Author',
        icon: '/icon.png',
        category: 'Other',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockAppComponent
      };

      useAppRegistryStore.getState().registerApp(minimalManifest);

      const app = useAppRegistryStore.getState().getApp('minimal-app');
      expect(app).toEqual(minimalManifest);
    });

    it('handles apps with complex window configuration', async () => {
      const manifest = createTestManifest('complex-app', {
        windowConfig: {
          defaultSize: { width: 1920, height: 1080 },
          minSize: { width: 640, height: 480 },
          maxSize: { width: 3840, height: 2160 },
          resizable: true,
          maximizable: true
        }
      });

      useAppRegistryStore.getState().registerApp(manifest);
      const windowId = await useAppRegistryStore.getState().launchApp('complex-app');

      const window = useWindowStore.getState().getWindow(windowId);
      expect(window?.size).toEqual({ width: 1920, height: 1080 });
    });
  });

  describe('Error Scenarios', () => {
    it('handles missing window store gracefully', async () => {
      const manifest = createTestManifest('test-app');
      useAppRegistryStore.getState().registerApp(manifest);

      // Break the window store reference temporarily
      const originalGetState = useWindowStore.getState;
      (useWindowStore as any).getState = () => ({
        createWindow: () => {
          throw new Error('Store not available');
        }
      });

      await expect(
        useAppRegistryStore.getState().launchApp('test-app')
      ).rejects.toThrow();

      // Restore
      (useWindowStore as any).getState = originalGetState;
    });

    it('sets error state on launch failure', async () => {
      await expect(
        useAppRegistryStore.getState().launchApp('non-existent')
      ).rejects.toThrow();

      expect(useAppRegistryStore.getState().error).toContain('not found in registry');
    });
  });
});
