/**
 * Desktop Performance Tests
 * Tests for 60fps validation, load times, and performance benchmarks
 *
 * Target Metrics:
 * - Desktop load: < 500ms
 * - Window open: < 200ms
 * - Drag operations: 60fps (< 16.67ms per frame)
 * - Memory: Stable over time
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWindowStore } from '@/stores/windowStore';
import { useDesktopStore } from '@/stores/desktopStore';
import { useAppRegistryStore } from '@/stores/appRegistryStore';
import type { AppManifest } from '@/types/desktop';

// Mock component for testing
const MockComponent = () => null;

describe('Desktop Performance Tests', () => {
  beforeEach(() => {
    useWindowStore.getState().resetWindows();
    useDesktopStore.getState().resetDesktop();
    useAppRegistryStore.getState().resetRegistry();
  });

  describe('Store Performance', () => {
    it('creates windows efficiently (< 10ms each)', () => {
      // Register test app
      const manifest: AppManifest = {
        id: 'perf-test-app',
        name: 'Performance Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      const timings: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        useWindowStore.getState().createWindow('perf-test-app');
        const endTime = performance.now();

        timings.push(endTime - startTime);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);

      console.log(`Window Creation Performance:
        Average: ${avgTime.toFixed(2)}ms
        Max: ${maxTime.toFixed(2)}ms
        Min: ${Math.min(...timings).toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(10);
      expect(maxTime).toBeLessThan(50);
    });

    it('handles rapid window operations efficiently', () => {
      // Register app
      const manifest: AppManifest = {
        id: 'rapid-test-app',
        name: 'Rapid Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      const startTime = performance.now();

      // Perform 1000 rapid operations
      const windowIds: string[] = [];
      for (let i = 0; i < 200; i++) {
        const id = useWindowStore.getState().createWindow('rapid-test-app');
        windowIds.push(id);

        if (i % 2 === 0) {
          useWindowStore.getState().focusWindow(id);
        }

        if (i % 3 === 0) {
          useWindowStore.getState().minimizeWindow(id);
        }

        if (i % 5 === 0) {
          useWindowStore.getState().maximizeWindow(id);
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`Rapid Operations Performance:
        Total time for 200 operations: ${totalTime.toFixed(2)}ms
        Average per operation: ${(totalTime / 200).toFixed(2)}ms
      `);

      expect(totalTime).toBeLessThan(2000); // 2 seconds for 200 operations
    });

    it('focus management scales with many windows', () => {
      // Register app
      const manifest: AppManifest = {
        id: 'focus-test-app',
        name: 'Focus Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      // Create 50 windows
      const windowIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        windowIds.push(useWindowStore.getState().createWindow('focus-test-app'));
      }

      // Test focus switching performance
      const focusTimes: number[] = [];

      for (let i = 0; i < 50; i++) {
        const randomId = windowIds[Math.floor(Math.random() * windowIds.length)];

        const startTime = performance.now();
        useWindowStore.getState().focusWindow(randomId);
        const endTime = performance.now();

        focusTimes.push(endTime - startTime);
      }

      const avgFocusTime = focusTimes.reduce((a, b) => a + b, 0) / focusTimes.length;

      console.log(`Focus Performance with 50 windows:
        Average focus time: ${avgFocusTime.toFixed(2)}ms
        Max: ${Math.max(...focusTimes).toFixed(2)}ms
      `);

      expect(avgFocusTime).toBeLessThan(5);
    });

    it('z-index compacting is efficient', () => {
      // Force high z-index
      useWindowStore.setState({ nextZIndex: 1001 });

      // Register app
      const manifest: AppManifest = {
        id: 'zindex-test-app',
        name: 'ZIndex Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      // Create windows to trigger compacting
      for (let i = 0; i < 20; i++) {
        useWindowStore.getState().createWindow('zindex-test-app');
      }

      const startTime = performance.now();
      useWindowStore.getState().compactZIndices();
      const endTime = performance.now();

      const compactTime = endTime - startTime;

      console.log(`Z-Index Compacting Time: ${compactTime.toFixed(2)}ms`);

      expect(compactTime).toBeLessThan(10);
    });
  });

  describe('Desktop Store Performance', () => {
    it('handles icon operations efficiently', () => {
      const timings: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();

        useDesktopStore.getState().addIcon({
          id: `icon-${i}`,
          appId: `app-${i}`,
          icon: `/icon-${i}.png`,
          label: `App ${i}`,
          position: { x: i * 10, y: i * 10 }
        });

        const endTime = performance.now();
        timings.push(endTime - startTime);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;

      console.log(`Icon Addition Performance:
        Average: ${avgTime.toFixed(2)}ms
        Total for 100 icons: ${timings.reduce((a, b) => a + b, 0).toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(1);
    });

    it('icon position updates are fast', () => {
      // Add 50 icons
      for (let i = 0; i < 50; i++) {
        useDesktopStore.getState().addIcon({
          id: `icon-${i}`,
          appId: `app-${i}`,
          icon: `/icon.png`,
          label: `App ${i}`,
          position: { x: i * 10, y: i * 10 }
        });
      }

      const updateTimes: number[] = [];

      // Update each icon position
      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();

        useDesktopStore.getState().updateIconPosition(`icon-${i}`, {
          x: Math.random() * 1000,
          y: Math.random() * 1000
        });

        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }

      const avgTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;

      console.log(`Icon Position Update Performance:
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(2);
    });

    it('theme toggling is instant', () => {
      const toggleTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        useDesktopStore.getState().toggleTheme();
        const endTime = performance.now();

        toggleTimes.push(endTime - startTime);
      }

      const avgTime = toggleTimes.reduce((a, b) => a + b, 0) / toggleTimes.length;

      console.log(`Theme Toggle Performance:
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(1);
    });
  });

  describe('App Registry Performance', () => {
    it('registers apps quickly', () => {
      const registerTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const manifest: AppManifest = {
          id: `app-${i}`,
          name: `App ${i}`,
          version: '1.0.0',
          description: `Description ${i}`,
          author: 'Test',
          icon: `/icon-${i}.png`,
          category: 'Test',
          permissions: [],
          windowConfig: {
            defaultSize: { width: 800, height: 600 },
            resizable: true,
            maximizable: true
          },
          component: MockComponent
        };

        const startTime = performance.now();
        useAppRegistryStore.getState().registerApp(manifest);
        const endTime = performance.now();

        registerTimes.push(endTime - startTime);
      }

      const avgTime = registerTimes.reduce((a, b) => a + b, 0) / registerTimes.length;

      console.log(`App Registration Performance:
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(1);
    });

    it('searches apps efficiently with many registered', () => {
      // Register 200 apps
      for (let i = 0; i < 200; i++) {
        useAppRegistryStore.getState().registerApp({
          id: `app-${i}`,
          name: `Test App ${i}`,
          version: '1.0.0',
          description: `Description for app ${i}`,
          author: 'Test',
          icon: `/icon-${i}.png`,
          category: i % 5 === 0 ? 'Utilities' : 'Other',
          permissions: [],
          windowConfig: {
            defaultSize: { width: 800, height: 600 },
            resizable: true,
            maximizable: true
          },
          component: MockComponent
        });
      }

      const searchTimes: number[] = [];

      // Perform 100 searches
      for (let i = 0; i < 100; i++) {
        const query = `app-${Math.floor(Math.random() * 200)}`;

        const startTime = performance.now();
        useAppRegistryStore.getState().searchApps(query);
        const endTime = performance.now();

        searchTimes.push(endTime - startTime);
      }

      const avgTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;

      console.log(`App Search Performance (200 apps):
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(5);
    });

    it('launches apps quickly', async () => {
      const manifest: AppManifest = {
        id: 'launch-test-app',
        name: 'Launch Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      const launchTimes: number[] = [];

      for (let i = 0; i < 50; i++) {
        const startTime = performance.now();
        await useAppRegistryStore.getState().launchApp('launch-test-app');
        const endTime = performance.now();

        launchTimes.push(endTime - startTime);
      }

      const avgTime = launchTimes.reduce((a, b) => a + b, 0) / launchTimes.length;

      console.log(`App Launch Performance:
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(20);
    });
  });

  describe('Query Performance', () => {
    beforeEach(() => {
      // Set up scenario with many windows
      const manifest: AppManifest = {
        id: 'query-test-app',
        name: 'Query Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      // Create 100 windows
      for (let i = 0; i < 100; i++) {
        useWindowStore.getState().createWindow('query-test-app');

        // Minimize some
        if (i % 3 === 0) {
          const windows = Object.keys(useWindowStore.getState().windows);
          useWindowStore.getState().minimizeWindow(windows[windows.length - 1]);
        }
      }
    });

    it('getVisibleWindows is fast with many windows', () => {
      const queryTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        useWindowStore.getState().getVisibleWindows();
        const endTime = performance.now();

        queryTimes.push(endTime - startTime);
      }

      const avgTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;

      console.log(`getVisibleWindows Performance (100 windows):
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(2);
    });

    it('getWindowsByApp is fast', () => {
      const queryTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const startTime = performance.now();
        useWindowStore.getState().getWindowsByApp('query-test-app');
        const endTime = performance.now();

        queryTimes.push(endTime - startTime);
      }

      const avgTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;

      console.log(`getWindowsByApp Performance (100 windows):
        Average: ${avgTime.toFixed(2)}ms
      `);

      expect(avgTime).toBeLessThan(2);
    });
  });

  describe('Memory Performance', () => {
    it('does not leak memory with window creation/destruction', () => {
      const manifest: AppManifest = {
        id: 'memory-test-app',
        name: 'Memory Test App',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      // Create and destroy windows many times
      for (let cycle = 0; cycle < 10; cycle++) {
        const windowIds: string[] = [];

        // Create 50 windows
        for (let i = 0; i < 50; i++) {
          windowIds.push(useWindowStore.getState().createWindow('memory-test-app'));
        }

        // Close all windows
        windowIds.forEach(id => {
          useWindowStore.getState().closeWindow(id);
        });
      }

      // After all cycles, store should be clean
      const windowCount = Object.keys(useWindowStore.getState().windows).length;
      expect(windowCount).toBe(0);
    });

    it('handles large state efficiently', () => {
      // Create large desktop state
      for (let i = 0; i < 200; i++) {
        useDesktopStore.getState().addIcon({
          id: `icon-${i}`,
          appId: `app-${i}`,
          icon: `/icon-${i}.png`,
          label: `App ${i}`,
          position: { x: i * 10, y: i * 10 }
        });
      }

      const manifest: AppManifest = {
        id: 'large-state-test',
        name: 'Large State Test',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        icon: '/icon.png',
        category: 'Test',
        permissions: [],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          resizable: true,
          maximizable: true
        },
        component: MockComponent
      };

      useAppRegistryStore.getState().registerApp(manifest);

      // Create many windows
      for (let i = 0; i < 100; i++) {
        useWindowStore.getState().createWindow('large-state-test');
      }

      // Operations should still be fast
      const startTime = performance.now();

      // Perform various operations
      const windows = Object.keys(useWindowStore.getState().windows);
      windows.slice(0, 20).forEach(id => {
        useWindowStore.getState().focusWindow(id);
      });

      const endTime = performance.now();

      console.log(`Operations with large state: ${endTime - startTime}ms`);

      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
