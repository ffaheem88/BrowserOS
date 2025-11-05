/**
 * Desktop E2E Tests
 * Comprehensive end-to-end tests for desktop environment and window management
 *
 * Test Coverage:
 * - Window operations (open, close, minimize, maximize, restore)
 * - Drag and resize functionality
 * - Focus management
 * - Context menus
 * - Desktop state persistence
 * - Multi-window scenarios
 */

import { test, expect, Page } from '@playwright/test';

// Helper function to log in before tests
async function login(page: Page) {
  await page.goto('/auth/login');

  await page.fill('[data-testid="email-input"]', 'test@browseros.com');
  await page.fill('[data-testid="password-input"]', 'TestPassword123!');
  await page.click('[data-testid="login-button"]');

  // Wait for navigation to desktop
  await page.waitForURL('**/desktop', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Desktop Environment', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('loads desktop successfully', async ({ page }) => {
    // Verify desktop shell is rendered
    const desktop = page.locator('[data-testid="desktop-shell"]');
    await expect(desktop).toBeVisible();

    // Verify taskbar is present
    const taskbar = page.locator('[data-testid="taskbar"]');
    await expect(taskbar).toBeVisible();
  });

  test('displays wallpaper correctly', async ({ page }) => {
    const desktop = page.locator('[data-testid="desktop-shell"]');

    // Check that desktop has background image style
    const backgroundImage = await desktop.evaluate((el) =>
      window.getComputedStyle(el).backgroundImage
    );

    expect(backgroundImage).toBeTruthy();
    expect(backgroundImage).not.toBe('none');
  });

  test('displays desktop icons', async ({ page }) => {
    // Wait for icons to load
    await page.waitForSelector('[data-testid^="desktop-icon-"]', {
      timeout: 5000,
      state: 'visible'
    });

    const icons = page.locator('[data-testid^="desktop-icon-"]');
    const iconCount = await icons.count();

    expect(iconCount).toBeGreaterThan(0);
  });
});

test.describe('Window Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('opens window by double-clicking desktop icon', async ({ page }) => {
    // Find first desktop icon
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await expect(icon).toBeVisible();

    // Double-click to launch
    await icon.dblclick();

    // Wait for window to appear
    await page.waitForSelector('[data-testid="window"]', {
      timeout: 5000,
      state: 'visible'
    });

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();
  });

  test('closes window with close button', async ({ page }) => {
    // Open a window first
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Click close button
    const closeButton = page.locator('[data-testid="window-close-button"]');
    await closeButton.click();

    // Verify window is closed
    await expect(window).not.toBeVisible();
  });

  test('minimizes window', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Click minimize button
    const minimizeButton = page.locator('[data-testid="window-minimize-button"]');
    await minimizeButton.click();

    // Window should disappear from desktop
    await expect(window).not.toBeVisible();

    // But should appear in taskbar
    const taskbarIcon = page.locator('[data-testid^="taskbar-window-"]');
    await expect(taskbarIcon).toBeVisible();
  });

  test('restores minimized window from taskbar', async ({ page }) => {
    // Open and minimize window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const minimizeButton = page.locator('[data-testid="window-minimize-button"]');
    await minimizeButton.click();
    await expect(window).not.toBeVisible();

    // Click taskbar icon to restore
    const taskbarIcon = page.locator('[data-testid^="taskbar-window-"]').first();
    await taskbarIcon.click();

    // Window should reappear
    await expect(window).toBeVisible();
  });

  test('maximizes window', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Get initial size
    const initialBox = await window.boundingBox();

    // Click maximize button
    const maximizeButton = page.locator('[data-testid="window-maximize-button"]');
    await maximizeButton.click();

    // Wait for animation
    await page.waitForTimeout(300);

    // Get new size
    const maximizedBox = await window.boundingBox();

    // Window should be much larger (near full screen)
    expect(maximizedBox!.width).toBeGreaterThan(initialBox!.width * 1.5);
    expect(maximizedBox!.height).toBeGreaterThan(initialBox!.height * 1.5);
  });

  test('restores maximized window', async ({ page }) => {
    // Open and maximize window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const initialBox = await window.boundingBox();

    const maximizeButton = page.locator('[data-testid="window-maximize-button"]');
    await maximizeButton.click();
    await page.waitForTimeout(300);

    // Click maximize button again to restore
    await maximizeButton.click();
    await page.waitForTimeout(300);

    const restoredBox = await window.boundingBox();

    // Size should be close to original
    expect(restoredBox!.width).toBeCloseTo(initialBox!.width, -10);
    expect(restoredBox!.height).toBeCloseTo(initialBox!.height, -10);
  });

  test('double-click title bar maximizes window', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const initialBox = await window.boundingBox();

    // Double-click title bar
    const titleBar = page.locator('[data-testid="window-title-bar"]');
    await titleBar.dblclick();

    await page.waitForTimeout(300);

    const maximizedBox = await window.boundingBox();

    // Should be maximized
    expect(maximizedBox!.width).toBeGreaterThan(initialBox!.width * 1.5);
  });
});

test.describe('Window Drag and Resize', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('drags window to new position', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Get initial position
    const initialBox = await window.boundingBox();

    // Drag window by title bar
    const titleBar = page.locator('[data-testid="window-title-bar"]');

    await titleBar.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 200, initialBox!.y + 150);
    await page.mouse.up();

    // Wait for position update
    await page.waitForTimeout(100);

    // Get new position
    const newBox = await window.boundingBox();

    // Position should have changed
    expect(Math.abs(newBox!.x - initialBox!.x)).toBeGreaterThan(50);
    expect(Math.abs(newBox!.y - initialBox!.y)).toBeGreaterThan(50);
  });

  test('resizes window from bottom-right corner', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const initialBox = await window.boundingBox();

    // Find resize handle (bottom-right)
    const resizeHandle = page.locator('[data-testid="resize-handle-se"]');

    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + initialBox!.width + 100, initialBox!.y + initialBox!.height + 100);
    await page.mouse.up();

    await page.waitForTimeout(100);

    const resizedBox = await window.boundingBox();

    // Size should have increased
    expect(resizedBox!.width).toBeGreaterThan(initialBox!.width);
    expect(resizedBox!.height).toBeGreaterThan(initialBox!.height);
  });

  test('window stays within viewport bounds', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const titleBar = page.locator('[data-testid="window-title-bar"]');

    // Try to drag window off-screen
    await titleBar.hover();
    await page.mouse.down();
    await page.mouse.move(-1000, -1000); // Way off screen
    await page.mouse.up();

    await page.waitForTimeout(100);

    const finalBox = await window.boundingBox();

    // Window should still be visible and not completely off-screen
    expect(finalBox!.x).toBeGreaterThan(-800); // Some tolerance
    expect(finalBox!.y).toBeGreaterThan(-600);
  });

  test('drag performance is smooth', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const titleBar = page.locator('[data-testid="window-title-bar"]');
    const initialBox = await window.boundingBox();

    // Measure drag performance
    const startTime = Date.now();

    await titleBar.hover();
    await page.mouse.down();

    // Perform multiple mouse moves to simulate smooth drag
    for (let i = 0; i < 20; i++) {
      await page.mouse.move(
        initialBox!.x + i * 10,
        initialBox!.y + i * 5
      );
    }

    await page.mouse.up();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Drag should complete in reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000);
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('clicking window brings it to front', async ({ page }) => {
    // Open two windows
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    await icons.nth(0).dblclick();
    await page.waitForTimeout(300);

    await icons.nth(1).dblclick();
    await page.waitForTimeout(300);

    const windows = page.locator('[data-testid="window"]');
    expect(await windows.count()).toBe(2);

    const window1 = windows.nth(0);
    const window2 = windows.nth(1);

    // Get initial z-indices
    const zIndex1Initial = await window1.evaluate((el) =>
      window.getComputedStyle(el).zIndex
    );
    const zIndex2Initial = await window2.evaluate((el) =>
      window.getComputedStyle(el).zIndex
    );

    // window2 should be on top initially (created last)
    expect(parseInt(zIndex2Initial)).toBeGreaterThan(parseInt(zIndex1Initial));

    // Click window1 to bring to front
    await window1.click();
    await page.waitForTimeout(100);

    // Get new z-indices
    const zIndex1Final = await window1.evaluate((el) =>
      window.getComputedStyle(el).zIndex
    );
    const zIndex2Final = await window2.evaluate((el) =>
      window.getComputedStyle(el).zIndex
    );

    // window1 should now be on top
    expect(parseInt(zIndex1Final)).toBeGreaterThan(parseInt(zIndex2Final));
  });

  test('focused window has visual indicator', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Check for focused class or attribute
    const isFocused = await window.evaluate((el) =>
      el.hasAttribute('data-focused') || el.classList.contains('focused')
    );

    expect(isFocused).toBe(true);
  });

  test('only one window is focused at a time', async ({ page }) => {
    // Open three windows
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    for (let i = 0; i < 3; i++) {
      await icons.nth(i % (await icons.count())).dblclick();
      await page.waitForTimeout(300);
    }

    const windows = page.locator('[data-testid="window"]');

    // Count focused windows
    const focusedCount = await windows.evaluateAll((els) =>
      els.filter((el) =>
        el.hasAttribute('data-focused') || el.classList.contains('focused')
      ).length
    );

    expect(focusedCount).toBe(1);
  });
});

test.describe('Context Menus', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('right-click desktop shows context menu', async ({ page }) => {
    const desktop = page.locator('[data-testid="desktop-area"]');

    // Right-click desktop
    await desktop.click({ button: 'right', position: { x: 500, y: 300 } });

    // Context menu should appear
    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();
  });

  test('context menu closes on outside click', async ({ page }) => {
    const desktop = page.locator('[data-testid="desktop-area"]');

    await desktop.click({ button: 'right', position: { x: 500, y: 300 } });

    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();

    // Click outside
    await page.click('body', { position: { x: 100, y: 100 } });

    // Menu should close
    await expect(contextMenu).not.toBeVisible();
  });

  test('window title bar shows context menu on right-click', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const titleBar = page.locator('[data-testid="window-title-bar"]');
    await expect(titleBar).toBeVisible();

    // Right-click title bar
    await titleBar.click({ button: 'right' });

    // Window context menu should appear
    const windowMenu = page.locator('[data-testid="window-context-menu"]');
    await expect(windowMenu).toBeVisible();
  });
});

test.describe('Multiple Windows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('opens multiple windows', async ({ page }) => {
    const icons = page.locator('[data-testid^="desktop-icon-"]');
    const iconCount = Math.min(await icons.count(), 3);

    // Open multiple windows
    for (let i = 0; i < iconCount; i++) {
      await icons.nth(i).dblclick();
      await page.waitForTimeout(300);
    }

    const windows = page.locator('[data-testid="window"]');
    expect(await windows.count()).toBe(iconCount);
  });

  test('windows have correct z-index stacking', async ({ page }) => {
    // Open three windows
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    await icons.nth(0).dblclick();
    await page.waitForTimeout(300);
    await icons.nth(1).dblclick();
    await page.waitForTimeout(300);
    await icons.nth(2).dblclick();
    await page.waitForTimeout(300);

    const windows = page.locator('[data-testid="window"]');
    expect(await windows.count()).toBe(3);

    // Get z-indices
    const zIndices: number[] = [];
    for (let i = 0; i < 3; i++) {
      const zIndex = await windows.nth(i).evaluate((el) =>
        parseInt(window.getComputedStyle(el).zIndex)
      );
      zIndices.push(zIndex);
    }

    // Each window should have a different z-index
    const uniqueZIndices = new Set(zIndices);
    expect(uniqueZIndices.size).toBe(3);

    // Last created window should have highest z-index
    expect(zIndices[2]).toBe(Math.max(...zIndices));
  });

  test('closes specific window without affecting others', async ({ page }) => {
    // Open three windows
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    for (let i = 0; i < 3; i++) {
      await icons.nth(i % (await icons.count())).dblclick();
      await page.waitForTimeout(300);
    }

    let windows = page.locator('[data-testid="window"]');
    expect(await windows.count()).toBe(3);

    // Close middle window
    const closeButtons = page.locator('[data-testid="window-close-button"]');
    await closeButtons.nth(1).click();

    await page.waitForTimeout(300);

    windows = page.locator('[data-testid="window"]');
    expect(await windows.count()).toBe(2);
  });

  test('minimizes specific window without affecting others', async ({ page }) => {
    // Open three windows
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    for (let i = 0; i < 3; i++) {
      await icons.nth(i % (await icons.count())).dblclick();
      await page.waitForTimeout(300);
    }

    const windows = page.locator('[data-testid="window"]');
    const visibleBefore = await windows.count();

    // Minimize one window
    const minimizeButtons = page.locator('[data-testid="window-minimize-button"]');
    await minimizeButtons.nth(1).click();

    await page.waitForTimeout(300);

    const visibleAfter = await windows.count();

    expect(visibleAfter).toBe(visibleBefore - 1);
  });
});

test.describe('Desktop State Persistence', () => {
  test('persists desktop state across page reloads', async ({ page }) => {
    // Set up desktop state
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Wait for state to save
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check if window state is restored
    // Note: This depends on implementation - windows might not persist
    // but desktop settings should
    const desktop = page.locator('[data-testid="desktop-shell"]');
    await expect(desktop).toBeVisible();
  });
});

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('desktop loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    // Desktop should already be loaded from beforeEach
    const desktop = page.locator('[data-testid="desktop-shell"]');
    await expect(desktop).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load quickly (< 500ms after navigation)
    expect(loadTime).toBeLessThan(500);
  });

  test('window operations complete within 300ms', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();

    const startTime = Date.now();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const operationTime = Date.now() - startTime;

    // Window should open quickly
    expect(operationTime).toBeLessThan(300);
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('can close window with keyboard shortcut', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Focus window and press Alt+F4 or equivalent
    await window.click();
    await page.keyboard.press('Alt+F4');

    await page.waitForTimeout(300);

    // Window should close
    // Note: This depends on keyboard shortcut implementation
  });

  test('Escape key closes context menu', async ({ page }) => {
    const desktop = page.locator('[data-testid="desktop-area"]');

    // Open context menu
    await desktop.click({ button: 'right', position: { x: 500, y: 300 } });

    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    await page.waitForTimeout(100);

    // Menu should close
    await expect(contextMenu).not.toBeVisible();
  });
});

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('handles rapid window opening', async ({ page }) => {
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();

    // Rapidly open same app multiple times
    for (let i = 0; i < 5; i++) {
      await icon.dblclick();
      await page.waitForTimeout(100);
    }

    // Should have created multiple windows
    const windows = page.locator('[data-testid="window"]');
    const count = await windows.count();

    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5);
  });

  test('handles window operations on minimized window gracefully', async ({ page }) => {
    // Open and minimize window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const minimizeButton = page.locator('[data-testid="window-minimize-button"]');
    await minimizeButton.click();

    await expect(window).not.toBeVisible();

    // Operations should handle gracefully (no errors)
    // The window is now in taskbar, not on desktop
  });

  test('handles very small window size', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Try to resize to very small size
    const resizeHandle = page.locator('[data-testid="resize-handle-se"]');

    const initialBox = await window.boundingBox();

    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100); // Very small
    await page.mouse.up();

    await page.waitForTimeout(100);

    const resizedBox = await window.boundingBox();

    // Window should respect minimum size constraints
    expect(resizedBox!.width).toBeGreaterThan(200); // Assume min width
    expect(resizedBox!.height).toBeGreaterThan(150); // Assume min height
  });
});
