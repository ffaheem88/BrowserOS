/**
 * Window Store Unit Tests
 * Comprehensive tests for window lifecycle, focus, and z-index management
 *
 * Coverage Target: 100% (Critical Path)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useWindowStore } from '@/stores/windowStore';
import type { WindowPosition, WindowSize } from '@/types/desktop';

describe('windowStore', () => {
  // Reset store and localStorage before each test
  beforeEach(() => {
    useWindowStore.getState().resetWindows();
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Window Creation', () => {
    it('creates window with unique ID', () => {
      const id = useWindowStore.getState().createWindow('test-app');

      expect(id).toBeTruthy();
      expect(id).toMatch(/^window-\d+-/);

      const window = useWindowStore.getState().getWindow(id);
      expect(window).toBeDefined();
      expect(window?.appId).toBe('test-app');
    });

    it('creates window with default configuration', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const window = useWindowStore.getState().getWindow(id);

      expect(window).toMatchObject({
        appId: 'test-app',
        title: 'Untitled',
        state: 'normal',
        focused: true,
        resizable: true,
        movable: true,
        minimizable: true,
        maximizable: true
      });

      expect(window?.size).toEqual({ width: 800, height: 600 });
      expect(window?.zIndex).toBeGreaterThanOrEqual(100);
    });

    it('creates window with custom configuration', () => {
      const customConfig = {
        title: 'Custom Window',
        icon: '/icon.png',
        position: { x: 200, y: 200 },
        size: { width: 1024, height: 768 },
        resizable: false,
        maximizable: false
      };

      const id = useWindowStore.getState().createWindow('test-app', customConfig);
      const window = useWindowStore.getState().getWindow(id);

      expect(window).toMatchObject(customConfig);
    });

    it('creates multiple windows with cascading positions', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');
      const id3 = useWindowStore.getState().createWindow('app3');

      const win1 = useWindowStore.getState().getWindow(id1);
      const win2 = useWindowStore.getState().getWindow(id2);
      const win3 = useWindowStore.getState().getWindow(id3);

      // Each window should have a different position (cascaded)
      expect(win2?.position.x).toBeGreaterThan(win1?.position.x || 0);
      expect(win2?.position.y).toBeGreaterThan(win1?.position.y || 0);
      expect(win3?.position.x).toBeGreaterThan(win2?.position.x || 0);
      expect(win3?.position.y).toBeGreaterThan(win2?.position.y || 0);
    });

    it('auto-focuses newly created window', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const window = useWindowStore.getState().getWindow(id);

      expect(window?.focused).toBe(true);
      expect(useWindowStore.getState().focusedWindowId).toBe(id);
    });

    it('unfocuses previous window when creating new window', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');

      const win1 = useWindowStore.getState().getWindow(id1);
      const win2 = useWindowStore.getState().getWindow(id2);

      expect(win1?.focused).toBe(false);
      expect(win2?.focused).toBe(true);
    });
  });

  describe('Focus Management', () => {
    it('focuses window and updates z-index', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');

      const initialZIndex1 = useWindowStore.getState().getWindow(id1)?.zIndex;

      useWindowStore.getState().focusWindow(id1);

      const win1 = useWindowStore.getState().getWindow(id1);
      const win2 = useWindowStore.getState().getWindow(id2);

      expect(win1?.focused).toBe(true);
      expect(win2?.focused).toBe(false);
      expect(win1?.zIndex).toBeGreaterThan(initialZIndex1 || 0);
      expect(win1?.zIndex).toBeGreaterThan(win2?.zIndex || 0);
      expect(useWindowStore.getState().focusedWindowId).toBe(id1);
    });

    it('does nothing when focusing non-existent window', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const initialState = useWindowStore.getState();

      useWindowStore.getState().focusWindow('non-existent-id');

      const finalState = useWindowStore.getState();
      expect(finalState.focusedWindowId).toBe(initialState.focusedWindowId);
    });

    it('increments nextZIndex on focus', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const initialNextZIndex = useWindowStore.getState().nextZIndex;

      useWindowStore.getState().focusWindow(id);

      expect(useWindowStore.getState().nextZIndex).toBe(initialNextZIndex + 1);
    });
  });

  describe('Window State Transitions', () => {
    it('minimizes window correctly', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().minimizeWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).toBe('minimized');
      expect(window?.focused).toBe(false);
    });

    it('does not minimize window if not minimizable', () => {
      const id = useWindowStore.getState().createWindow('test-app', { minimizable: false });
      useWindowStore.getState().minimizeWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).not.toBe('minimized');
    });

    it('maximizes window correctly', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().maximizeWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).toBe('maximized');
    });

    it('toggles between maximized and normal', () => {
      const id = useWindowStore.getState().createWindow('test-app');

      useWindowStore.getState().maximizeWindow(id);
      expect(useWindowStore.getState().getWindow(id)?.state).toBe('maximized');

      useWindowStore.getState().maximizeWindow(id);
      expect(useWindowStore.getState().getWindow(id)?.state).toBe('normal');
    });

    it('does not maximize window if not maximizable', () => {
      const id = useWindowStore.getState().createWindow('test-app', { maximizable: false });
      useWindowStore.getState().maximizeWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).toBe('normal');
    });

    it('restores window from minimized state', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().minimizeWindow(id);
      useWindowStore.getState().restoreWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).toBe('normal');
      expect(window?.focused).toBe(true);
    });

    it('restores window from maximized state', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().maximizeWindow(id);
      useWindowStore.getState().restoreWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).toBe('normal');
    });
  });

  describe('Window Closing', () => {
    it('closes window and removes from store', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().closeWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window).toBeNull();
      expect(useWindowStore.getState().windows[id]).toBeUndefined();
    });

    it('focuses another window when closing focused window', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');

      // id2 is currently focused
      useWindowStore.getState().closeWindow(id2);

      expect(useWindowStore.getState().focusedWindowId).toBe(id1);
      expect(useWindowStore.getState().getWindow(id1)?.focused).toBe(true);
    });

    it('clears focusedWindowId when closing last window', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().closeWindow(id);

      expect(useWindowStore.getState().focusedWindowId).toBeNull();
    });

    it('focuses highest z-index window after closing focused window', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');
      const id3 = useWindowStore.getState().createWindow('app3');

      // Close id3 (highest z-index)
      useWindowStore.getState().closeWindow(id3);

      // id2 should now be focused (second highest z-index)
      expect(useWindowStore.getState().focusedWindowId).toBe(id2);
    });
  });

  describe('Window Position and Size', () => {
    it('updates window position when movable', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const newPosition: WindowPosition = { x: 500, y: 300 };

      useWindowStore.getState().updateWindowPosition(id, newPosition);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.position).toEqual(newPosition);
    });

    it('does not update position when not movable', () => {
      const id = useWindowStore.getState().createWindow('test-app', { movable: false });
      const initialPosition = useWindowStore.getState().getWindow(id)?.position;
      const newPosition: WindowPosition = { x: 500, y: 300 };

      useWindowStore.getState().updateWindowPosition(id, newPosition);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.position).toEqual(initialPosition);
    });

    it('updates window size when resizable', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const newSize: WindowSize = { width: 1200, height: 900 };

      useWindowStore.getState().updateWindowSize(id, newSize);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.size).toEqual(newSize);
    });

    it('does not update size when not resizable', () => {
      const id = useWindowStore.getState().createWindow('test-app', { resizable: false });
      const initialSize = useWindowStore.getState().getWindow(id)?.size;
      const newSize: WindowSize = { width: 1200, height: 900 };

      useWindowStore.getState().updateWindowSize(id, newSize);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.size).toEqual(initialSize);
    });

    it('updates window title', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      useWindowStore.getState().updateWindowTitle(id, 'New Title');

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.title).toBe('New Title');
    });
  });

  describe('Window Queries', () => {
    it('gets window by ID', () => {
      const id = useWindowStore.getState().createWindow('test-app');
      const window = useWindowStore.getState().getWindow(id);

      expect(window).toBeDefined();
      expect(window?.id).toBe(id);
    });

    it('returns null for non-existent window', () => {
      const window = useWindowStore.getState().getWindow('non-existent');
      expect(window).toBeNull();
    });

    it('gets visible windows (excluding minimized)', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');
      const id3 = useWindowStore.getState().createWindow('app3');

      useWindowStore.getState().minimizeWindow(id2);

      const visibleWindows = useWindowStore.getState().getVisibleWindows();

      expect(visibleWindows).toHaveLength(2);
      expect(visibleWindows.some(w => w.id === id1)).toBe(true);
      expect(visibleWindows.some(w => w.id === id3)).toBe(true);
      expect(visibleWindows.some(w => w.id === id2)).toBe(false);
    });

    it('gets minimized windows', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');
      const id3 = useWindowStore.getState().createWindow('app3');

      useWindowStore.getState().minimizeWindow(id1);
      useWindowStore.getState().minimizeWindow(id3);

      const minimizedWindows = useWindowStore.getState().getMinimizedWindows();

      expect(minimizedWindows).toHaveLength(2);
      expect(minimizedWindows.some(w => w.id === id1)).toBe(true);
      expect(minimizedWindows.some(w => w.id === id3)).toBe(true);
    });

    it('gets windows by app ID', () => {
      const id1 = useWindowStore.getState().createWindow('text-editor');
      const id2 = useWindowStore.getState().createWindow('browser');
      const id3 = useWindowStore.getState().createWindow('text-editor');

      const textEditorWindows = useWindowStore.getState().getWindowsByApp('text-editor');

      expect(textEditorWindows).toHaveLength(2);
      expect(textEditorWindows.some(w => w.id === id1)).toBe(true);
      expect(textEditorWindows.some(w => w.id === id3)).toBe(true);
    });
  });

  describe('Z-Index Management', () => {
    it('assigns incrementing z-indices to new windows', () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');
      const id3 = useWindowStore.getState().createWindow('app3');

      const win1 = useWindowStore.getState().getWindow(id1);
      const win2 = useWindowStore.getState().getWindow(id2);
      const win3 = useWindowStore.getState().getWindow(id3);

      expect(win2?.zIndex).toBeGreaterThan(win1?.zIndex || 0);
      expect(win3?.zIndex).toBeGreaterThan(win2?.zIndex || 0);
    });

    it('compacts z-indices when exceeding threshold', () => {
      vi.useFakeTimers();

      // Set nextZIndex to just above 1000 to trigger compacting
      useWindowStore.setState({ nextZIndex: 1001 });

      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');

      // Wait for compacting to occur (setTimeout in createWindow)
      vi.runAllTimers();

      const win1 = useWindowStore.getState().getWindow(id1);
      const win2 = useWindowStore.getState().getWindow(id2);

      // Z-indices should be compacted back to base range
      expect(win1?.zIndex).toBeLessThan(200);
      expect(win2?.zIndex).toBeLessThan(200);
      expect(useWindowStore.getState().nextZIndex).toBeLessThan(200);

      vi.useRealTimers();
    });

    it('maintains z-index order after compacting', () => {
      vi.useFakeTimers();

      useWindowStore.setState({ nextZIndex: 1001 });

      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');
      const id3 = useWindowStore.getState().createWindow('app3');

      vi.runAllTimers();

      const win1 = useWindowStore.getState().getWindow(id1);
      const win2 = useWindowStore.getState().getWindow(id2);
      const win3 = useWindowStore.getState().getWindow(id3);

      expect(win1?.zIndex).toBeLessThan(win2?.zIndex || Infinity);
      expect(win2?.zIndex).toBeLessThan(win3?.zIndex || Infinity);

      vi.useRealTimers();
    });
  });

  describe('Cascade Position', () => {
    it('calculates cascading positions for multiple windows', () => {
      const pos1 = useWindowStore.getState().cascadePosition();
      const pos2 = useWindowStore.getState().cascadePosition();
      const pos3 = useWindowStore.getState().cascadePosition();

      expect(pos2.x).toBeGreaterThan(pos1.x);
      expect(pos2.y).toBeGreaterThan(pos1.y);
      expect(pos3.x).toBeGreaterThan(pos2.x);
      expect(pos3.y).toBeGreaterThan(pos2.y);
    });

    it('resets cascade position when exceeding threshold', () => {
      // Reset cascade state first
      useWindowStore.getState().resetWindows();

      // Create many positions to exceed cascade threshold (400/30 = 13.3, so need 14+ calls)
      for (let i = 0; i < 16; i++) {
        useWindowStore.getState().cascadePosition();
      }

      const position = useWindowStore.getState().cascadePosition();

      // Should reset to initial range after threshold (starts at 100, resets when > 400)
      expect(position.x).toBeLessThanOrEqual(130); // Initial + one cascade
      expect(position.y).toBeLessThanOrEqual(130);
    });
  });

  describe('Persistence', () => {
    it('saves window state to localStorage', async () => {
      const id1 = useWindowStore.getState().createWindow('app1');
      const id2 = useWindowStore.getState().createWindow('app2');

      await useWindowStore.getState().saveWindowState();

      const saved = localStorage.getItem('windowState');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.windows[id1]).toBeDefined();
      expect(parsed.windows[id2]).toBeDefined();
      expect(parsed.focusedWindowId).toBe(id2);
    });

    it('loads window state from localStorage', async () => {
      const mockState = {
        windows: {
          'window-1': {
            id: 'window-1',
            appId: 'test-app',
            title: 'Test Window',
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            state: 'normal',
            zIndex: 100,
            focused: true,
            resizable: true,
            movable: true,
            minimizable: true,
            maximizable: true
          }
        },
        focusedWindowId: 'window-1'
      };

      localStorage.setItem('windowState', JSON.stringify(mockState));

      await useWindowStore.getState().loadWindowState();

      const loadedWindow = useWindowStore.getState().getWindow('window-1');
      expect(loadedWindow).toBeDefined();
      expect(loadedWindow?.title).toBe('Test Window');
      expect(useWindowStore.getState().focusedWindowId).toBe('window-1');
    });

    it('handles missing localStorage data gracefully', async () => {
      localStorage.clear();
      await useWindowStore.getState().loadWindowState();

      expect(useWindowStore.getState().windows).toEqual({});
      expect(useWindowStore.getState().focusedWindowId).toBeNull();
    });
  });

  describe('Reset', () => {
    it('resets all windows to initial state', () => {
      useWindowStore.getState().createWindow('app1');
      useWindowStore.getState().createWindow('app2');

      useWindowStore.getState().resetWindows();

      expect(useWindowStore.getState().windows).toEqual({});
      expect(useWindowStore.getState().focusedWindowId).toBeNull();
      expect(useWindowStore.getState().nextZIndex).toBe(100);
    });

    it('clears localStorage on reset', () => {
      localStorage.setItem('windowState', JSON.stringify({ test: 'data' }));

      useWindowStore.getState().resetWindows();

      expect(localStorage.getItem('windowState')).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid window creation', () => {
      const ids = [];
      for (let i = 0; i < 50; i++) {
        ids.push(useWindowStore.getState().createWindow(`app-${i}`));
      }

      const windows = useWindowStore.getState().windows;
      expect(Object.keys(windows)).toHaveLength(50);
      ids.forEach(id => {
        expect(windows[id]).toBeDefined();
      });
    });

    it('handles operations on non-existent windows gracefully', () => {
      const nonExistentId = 'window-does-not-exist';

      expect(() => useWindowStore.getState().closeWindow(nonExistentId)).not.toThrow();
      expect(() => useWindowStore.getState().focusWindow(nonExistentId)).not.toThrow();
      expect(() => useWindowStore.getState().minimizeWindow(nonExistentId)).not.toThrow();
      expect(() => useWindowStore.getState().maximizeWindow(nonExistentId)).not.toThrow();
    });

    it('handles minimizing already minimized window', () => {
      const id = useWindowStore.getState().createWindow('test-app');

      useWindowStore.getState().minimizeWindow(id);
      useWindowStore.getState().minimizeWindow(id); // Second minimize

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.state).toBe('minimized');
    });

    it('maintains window state integrity during concurrent operations', () => {
      const id = useWindowStore.getState().createWindow('test-app');

      // Perform multiple operations quickly
      useWindowStore.getState().updateWindowPosition(id, { x: 200, y: 200 });
      useWindowStore.getState().updateWindowSize(id, { width: 1000, height: 700 });
      useWindowStore.getState().updateWindowTitle(id, 'Updated Title');
      useWindowStore.getState().focusWindow(id);

      const window = useWindowStore.getState().getWindow(id);
      expect(window?.position).toEqual({ x: 200, y: 200 });
      expect(window?.size).toEqual({ width: 1000, height: 700 });
      expect(window?.title).toBe('Updated Title');
      expect(window?.focused).toBe(true);
    });
  });
});
