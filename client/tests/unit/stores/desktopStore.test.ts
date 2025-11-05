/**
 * Desktop Store Unit Tests
 * Comprehensive tests for desktop state management including wallpaper, theme, icons, and taskbar
 *
 * Coverage Target: 95%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDesktopStore } from '@/stores/desktopStore';
import type { DesktopIcon, TaskbarConfig } from '@/types/desktop';

describe('desktopStore', () => {
  beforeEach(() => {
    useDesktopStore.getState().resetDesktop();
    localStorage.clear();
    document.documentElement.className = '';
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('has correct default state', () => {
      const state = useDesktopStore.getState();

      expect(state.wallpaper).toBe('/assets/wallpapers/default.jpg');
      expect(state.theme).toBe('dark');
      expect(state.icons).toEqual([]);
      expect(state.taskbar).toEqual({
        position: 'bottom',
        autohide: false,
        pinnedApps: ['file-manager', 'text-editor', 'settings']
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Wallpaper Management', () => {
    it('sets wallpaper', () => {
      useDesktopStore.getState().setWallpaper('/assets/wallpapers/mountains.jpg');

      expect(useDesktopStore.getState().wallpaper).toBe('/assets/wallpapers/mountains.jpg');
    });

    it('triggers auto-save after wallpaper change', () => {
      vi.useFakeTimers();
      const saveSpy = vi.spyOn(useDesktopStore.getState(), 'saveDesktopState');

      useDesktopStore.getState().setWallpaper('/new-wallpaper.jpg');

      // Fast-forward time to trigger debounced save
      vi.advanceTimersByTime(2000);

      expect(saveSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Theme Management', () => {
    it('sets theme to light', () => {
      useDesktopStore.getState().setTheme('light');

      expect(useDesktopStore.getState().theme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('sets theme to dark', () => {
      useDesktopStore.getState().setTheme('dark');

      expect(useDesktopStore.getState().theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('toggles theme from dark to light', () => {
      useDesktopStore.getState().setTheme('dark');
      useDesktopStore.getState().toggleTheme();

      expect(useDesktopStore.getState().theme).toBe('light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
    });

    it('toggles theme from light to dark', () => {
      useDesktopStore.getState().setTheme('light');
      useDesktopStore.getState().toggleTheme();

      expect(useDesktopStore.getState().theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('triggers auto-save after theme change', () => {
      vi.useFakeTimers();
      const saveSpy = vi.spyOn(useDesktopStore.getState(), 'saveDesktopState');

      useDesktopStore.getState().setTheme('light');

      vi.advanceTimersByTime(2000);

      expect(saveSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Icon Management', () => {
    const createTestIcon = (id: string): DesktopIcon => ({
      id,
      appId: `app-${id}`,
      icon: `/icon-${id}.png`,
      label: `App ${id}`,
      position: { x: 100, y: 100 }
    });

    it('adds desktop icon', () => {
      const icon = createTestIcon('1');
      useDesktopStore.getState().addIcon(icon);

      const icons = useDesktopStore.getState().icons;
      expect(icons).toHaveLength(1);
      expect(icons[0]).toEqual(icon);
    });

    it('adds multiple icons', () => {
      const icon1 = createTestIcon('1');
      const icon2 = createTestIcon('2');
      const icon3 = createTestIcon('3');

      useDesktopStore.getState().addIcon(icon1);
      useDesktopStore.getState().addIcon(icon2);
      useDesktopStore.getState().addIcon(icon3);

      expect(useDesktopStore.getState().icons).toHaveLength(3);
    });

    it('removes desktop icon', () => {
      const icon1 = createTestIcon('1');
      const icon2 = createTestIcon('2');

      useDesktopStore.getState().addIcon(icon1);
      useDesktopStore.getState().addIcon(icon2);

      useDesktopStore.getState().removeIcon('1');

      const icons = useDesktopStore.getState().icons;
      expect(icons).toHaveLength(1);
      expect(icons[0].id).toBe('2');
    });

    it('updates icon position', () => {
      const icon = createTestIcon('1');
      useDesktopStore.getState().addIcon(icon);

      const newPosition = { x: 300, y: 400 };
      useDesktopStore.getState().updateIconPosition('1', newPosition);

      const updatedIcon = useDesktopStore.getState().icons[0];
      expect(updatedIcon.position).toEqual(newPosition);
    });

    it('does not update position for non-existent icon', () => {
      const icon = createTestIcon('1');
      useDesktopStore.getState().addIcon(icon);

      const originalIcons = useDesktopStore.getState().icons;
      useDesktopStore.getState().updateIconPosition('non-existent', { x: 500, y: 500 });

      expect(useDesktopStore.getState().icons).toEqual(originalIcons);
    });

    it('triggers auto-save after adding icon', () => {
      vi.useFakeTimers();
      const saveSpy = vi.spyOn(useDesktopStore.getState(), 'saveDesktopState');

      useDesktopStore.getState().addIcon(createTestIcon('1'));

      vi.advanceTimersByTime(2000);

      expect(saveSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('triggers auto-save after removing icon', () => {
      vi.useFakeTimers();
      const icon = createTestIcon('1');
      useDesktopStore.getState().addIcon(icon);

      const saveSpy = vi.spyOn(useDesktopStore.getState(), 'saveDesktopState');

      useDesktopStore.getState().removeIcon('1');

      vi.advanceTimersByTime(2000);

      expect(saveSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('triggers auto-save after updating icon position', () => {
      vi.useFakeTimers();
      const icon = createTestIcon('1');
      useDesktopStore.getState().addIcon(icon);

      const saveSpy = vi.spyOn(useDesktopStore.getState(), 'saveDesktopState');

      useDesktopStore.getState().updateIconPosition('1', { x: 200, y: 200 });

      vi.advanceTimersByTime(2000);

      expect(saveSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Taskbar Configuration', () => {
    it('updates taskbar position', () => {
      useDesktopStore.getState().updateTaskbarConfig({ position: 'top' });

      expect(useDesktopStore.getState().taskbar.position).toBe('top');
    });

    it('updates taskbar autohide', () => {
      useDesktopStore.getState().updateTaskbarConfig({ autohide: true });

      expect(useDesktopStore.getState().taskbar.autohide).toBe(true);
    });

    it('updates pinned apps', () => {
      const newPinnedApps = ['browser', 'terminal', 'calculator'];
      useDesktopStore.getState().updateTaskbarConfig({ pinnedApps: newPinnedApps });

      expect(useDesktopStore.getState().taskbar.pinnedApps).toEqual(newPinnedApps);
    });

    it('updates multiple taskbar properties at once', () => {
      const config: Partial<TaskbarConfig> = {
        position: 'left',
        autohide: true,
        pinnedApps: ['app1', 'app2']
      };

      useDesktopStore.getState().updateTaskbarConfig(config);

      const taskbar = useDesktopStore.getState().taskbar;
      expect(taskbar.position).toBe('left');
      expect(taskbar.autohide).toBe(true);
      expect(taskbar.pinnedApps).toEqual(['app1', 'app2']);
    });

    it('preserves unmodified taskbar properties', () => {
      const originalPosition = useDesktopStore.getState().taskbar.position;
      const originalPinnedApps = useDesktopStore.getState().taskbar.pinnedApps;

      useDesktopStore.getState().updateTaskbarConfig({ autohide: true });

      const taskbar = useDesktopStore.getState().taskbar;
      expect(taskbar.position).toBe(originalPosition);
      expect(taskbar.pinnedApps).toEqual(originalPinnedApps);
      expect(taskbar.autohide).toBe(true);
    });

    it('triggers auto-save after taskbar config change', () => {
      vi.useFakeTimers();
      const saveSpy = vi.spyOn(useDesktopStore.getState(), 'saveDesktopState');

      useDesktopStore.getState().updateTaskbarConfig({ position: 'top' });

      vi.advanceTimersByTime(2000);

      expect(saveSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Persistence', () => {
    it('saves desktop state to localStorage', async () => {
      useDesktopStore.getState().setWallpaper('/custom-wallpaper.jpg');
      useDesktopStore.getState().setTheme('light');

      await useDesktopStore.getState().saveDesktopState();

      const saved = localStorage.getItem('desktopState');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.wallpaper).toBe('/custom-wallpaper.jpg');
      expect(parsed.theme).toBe('light');
    });

    it('loads desktop state from localStorage', async () => {
      const mockState = {
        wallpaper: '/saved-wallpaper.jpg',
        theme: 'light',
        icons: [
          {
            id: 'icon-1',
            appId: 'test-app',
            icon: '/test-icon.png',
            label: 'Test App',
            position: { x: 50, y: 50 }
          }
        ],
        taskbar: {
          position: 'top',
          autohide: true,
          pinnedApps: ['app1', 'app2']
        }
      };

      localStorage.setItem('desktopState', JSON.stringify(mockState));

      await useDesktopStore.getState().loadDesktopState();

      const state = useDesktopStore.getState();
      expect(state.wallpaper).toBe('/saved-wallpaper.jpg');
      expect(state.theme).toBe('light');
      expect(state.icons).toHaveLength(1);
      expect(state.taskbar.position).toBe('top');
      expect(state.loading).toBe(false);
    });

    it('applies theme to document when loading', async () => {
      const mockState = {
        wallpaper: '/wallpaper.jpg',
        theme: 'light',
        icons: [],
        taskbar: {
          position: 'bottom',
          autohide: false,
          pinnedApps: []
        }
      };

      localStorage.setItem('desktopState', JSON.stringify(mockState));

      await useDesktopStore.getState().loadDesktopState();

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('handles missing localStorage data gracefully', async () => {
      localStorage.clear();

      await useDesktopStore.getState().loadDesktopState();

      const state = useDesktopStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles corrupted localStorage data', async () => {
      localStorage.setItem('desktopState', 'invalid-json{{{');

      await useDesktopStore.getState().loadDesktopState();

      const state = useDesktopStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeTruthy();
    });

    it('sets loading state during load', async () => {
      const loadPromise = useDesktopStore.getState().loadDesktopState();

      // Check loading state before promise resolves
      expect(useDesktopStore.getState().loading).toBe(true);

      await loadPromise;

      expect(useDesktopStore.getState().loading).toBe(false);
    });

    it('debounces multiple save calls', async () => {
      vi.useFakeTimers();

      // Make multiple rapid changes
      useDesktopStore.getState().setWallpaper('/wallpaper1.jpg');
      vi.advanceTimersByTime(500);

      useDesktopStore.getState().setWallpaper('/wallpaper2.jpg');
      vi.advanceTimersByTime(500);

      useDesktopStore.getState().setWallpaper('/wallpaper3.jpg');

      // Check localStorage has NOT been called yet (debouncing)
      const initialCalls = localStorage.setItem.mock?.calls?.length || 0;

      // Advance past the debounce time (2 seconds)
      vi.advanceTimersByTime(2000);

      // Now check that save happened
      const finalCalls = localStorage.setItem.mock?.calls?.length || 0;

      // Should have saved (may be more than 1 if other operations also saved)
      expect(finalCalls).toBeGreaterThan(initialCalls);

      vi.useRealTimers();
    });
  });

  describe('Reset', () => {
    it('resets to default state', () => {
      // Make changes
      useDesktopStore.getState().setWallpaper('/custom.jpg');
      useDesktopStore.getState().setTheme('light');
      useDesktopStore.getState().addIcon({
        id: '1',
        appId: 'app1',
        icon: '/icon.png',
        label: 'App',
        position: { x: 0, y: 0 }
      });

      useDesktopStore.getState().resetDesktop();

      const state = useDesktopStore.getState();
      expect(state.wallpaper).toBe('/assets/wallpapers/default.jpg');
      expect(state.theme).toBe('dark');
      expect(state.icons).toEqual([]);
      expect(state.taskbar).toEqual({
        position: 'bottom',
        autohide: false,
        pinnedApps: ['file-manager', 'text-editor', 'settings']
      });
    });

    it('clears localStorage on reset', () => {
      localStorage.setItem('desktopState', JSON.stringify({ test: 'data' }));

      useDesktopStore.getState().resetDesktop();

      expect(localStorage.getItem('desktopState')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid theme toggling', () => {
      for (let i = 0; i < 100; i++) {
        useDesktopStore.getState().toggleTheme();
      }

      // Should end up in light mode (started dark, toggled even number)
      expect(useDesktopStore.getState().theme).toBe('dark');
    });

    it('handles adding many icons', () => {
      for (let i = 0; i < 100; i++) {
        useDesktopStore.getState().addIcon({
          id: `icon-${i}`,
          appId: `app-${i}`,
          icon: `/icon-${i}.png`,
          label: `App ${i}`,
          position: { x: i * 10, y: i * 10 }
        });
      }

      expect(useDesktopStore.getState().icons).toHaveLength(100);
    });

    it('handles removing non-existent icon', () => {
      const initialIcons = useDesktopStore.getState().icons;

      useDesktopStore.getState().removeIcon('non-existent');

      expect(useDesktopStore.getState().icons).toEqual(initialIcons);
    });

    it('maintains state consistency during concurrent operations', () => {
      useDesktopStore.getState().setWallpaper('/wallpaper.jpg');
      useDesktopStore.getState().setTheme('light');
      useDesktopStore.getState().addIcon({
        id: '1',
        appId: 'app1',
        icon: '/icon.png',
        label: 'App',
        position: { x: 100, y: 100 }
      });
      useDesktopStore.getState().updateTaskbarConfig({ position: 'top' });

      const state = useDesktopStore.getState();
      expect(state.wallpaper).toBe('/wallpaper.jpg');
      expect(state.theme).toBe('light');
      expect(state.icons).toHaveLength(1);
      expect(state.taskbar.position).toBe('top');
    });
  });

  describe('Error Handling', () => {
    it('sets error message when save fails', async () => {
      // Mock localStorage.setItem to throw error
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await useDesktopStore.getState().saveDesktopState();

      expect(useDesktopStore.getState().error).toBeTruthy();
      expect(useDesktopStore.getState().error).toContain('Failed to save');
    });

    it('sets error message when load fails', async () => {
      // Mock localStorage.getItem to throw error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      await useDesktopStore.getState().loadDesktopState();

      expect(useDesktopStore.getState().error).toBeTruthy();
      expect(useDesktopStore.getState().loading).toBe(false);
    });
  });
});
