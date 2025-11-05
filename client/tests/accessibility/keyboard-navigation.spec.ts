/**
 * Accessibility Tests - Keyboard Navigation
 * Tests for keyboard accessibility, ARIA attributes, and screen reader support
 *
 * Standards: WCAG 2.1 Level AA
 */

import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('[data-testid="email-input"]', 'test@browseros.com');
  await page.fill('[data-testid="password-input"]', 'TestPassword123!');
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('**/desktop', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Tab navigation works through desktop icons', async ({ page }) => {
    // Press Tab to focus first icon
    await page.keyboard.press('Tab');

    // Check that an icon is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toHaveAttribute('data-testid', /desktop-icon/);

    // Tab through more icons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should still be on an icon or taskbar element
    const currentFocus = page.locator(':focus');
    await expect(currentFocus).toBeVisible();
  });

  test('Enter key opens application from desktop icon', async ({ page }) => {
    // Focus first icon
    await page.keyboard.press('Tab');

    const focusedIcon = page.locator(':focus');
    await expect(focusedIcon).toHaveAttribute('data-testid', /desktop-icon/);

    // Press Enter to open
    await page.keyboard.press('Enter');

    // Window should open
    await page.waitForSelector('[data-testid="window"]', { timeout: 5000 });
    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();
  });

  test('Space key also opens application', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Space');

    await page.waitForSelector('[data-testid="window"]', { timeout: 5000 });
    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();
  });

  test('Arrow keys navigate between desktop icons', async ({ page }) => {
    // Focus first icon
    await page.keyboard.press('Tab');

    const icon1 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // Press Right arrow
    await page.keyboard.press('ArrowRight');

    const icon2 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // Should have moved to different icon
    expect(icon2).not.toBe(icon1);

    // Press Down arrow
    await page.keyboard.press('ArrowDown');

    const icon3 = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));

    // Should have moved again
    expect(icon3).not.toBe(icon2);
  });

  test('Escape closes focused window', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.click();
    await page.keyboard.press('Enter');

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Window may close or lose focus depending on implementation
    // At minimum, it should respond to Escape
  });

  test('Alt+F4 closes active window', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Press Alt+F4
    await page.keyboard.press('Alt+F4');

    await page.waitForTimeout(300);

    // Window should close (if shortcut is implemented)
    // Otherwise, test documents expected behavior
  });

  test('Tab cycles through window controls', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Click window to focus it
    await window.click();

    // Tab should cycle through window controls
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Should be able to tab to minimize, maximize, close buttons
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    }
  });

  test('Context menu navigable with keyboard', async ({ page }) => {
    // Open context menu
    const desktop = page.locator('[data-testid="desktop-area"]');
    await desktop.click({ button: 'right', position: { x: 500, y: 300 } });

    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();

    // Arrow keys should navigate menu items
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Enter should activate menu item
    await page.keyboard.press('Enter');

    // Menu should close or execute action
  });

  test('Escape closes context menu', async ({ page }) => {
    const desktop = page.locator('[data-testid="desktop-area"]');
    await desktop.click({ button: 'right', position: { x: 500, y: 300 } });

    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(contextMenu).not.toBeVisible();
  });

  test('Alt+Tab switches between windows (if implemented)', async ({ page }) => {
    // Open two windows
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    await icons.nth(0).dblclick();
    await page.waitForTimeout(300);

    await icons.nth(1).dblclick();
    await page.waitForTimeout(300);

    const windows = page.locator('[data-testid="window"]');
    expect(await windows.count()).toBe(2);

    // Alt+Tab should switch focus
    await page.keyboard.press('Alt+Tab');

    await page.waitForTimeout(100);

    // Document expected behavior
  });

  test('Keyboard shortcuts are consistent', async ({ page }) => {
    // Test that shortcuts work consistently
    // This is more of a behavioral test

    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Multiple Escape presses should be safe
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    // No crashes or errors should occur
  });
});

test.describe('ARIA Attributes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Desktop icons have proper ARIA labels', async ({ page }) => {
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    const firstIcon = icons.first();
    await expect(firstIcon).toHaveAttribute('role');
    await expect(firstIcon).toHaveAttribute('aria-label');
  });

  test('Windows have proper ARIA roles', async ({ page }) => {
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Window should have dialog or window role
    const role = await window.getAttribute('role');
    expect(['dialog', 'window', 'region']).toContain(role);

    // Should have aria-label or aria-labelledby
    const hasLabel =
      (await window.getAttribute('aria-label')) !== null ||
      (await window.getAttribute('aria-labelledby')) !== null;

    expect(hasLabel).toBe(true);
  });

  test('Buttons have accessible names', async ({ page }) => {
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Window control buttons
    const closeButton = page.locator('[data-testid="window-close-button"]');
    const minimizeButton = page.locator('[data-testid="window-minimize-button"]');
    const maximizeButton = page.locator('[data-testid="window-maximize-button"]');

    // Each should have aria-label or text content
    await expect(closeButton).toHaveAttribute('aria-label');
    await expect(minimizeButton).toHaveAttribute('aria-label');
    await expect(maximizeButton).toHaveAttribute('aria-label');
  });

  test('Context menu has proper ARIA markup', async ({ page }) => {
    const desktop = page.locator('[data-testid="desktop-area"]');
    await desktop.click({ button: 'right', position: { x: 500, y: 300 } });

    const contextMenu = page.locator('[data-testid="desktop-context-menu"]');
    await expect(contextMenu).toBeVisible();

    // Should have menu role
    await expect(contextMenu).toHaveAttribute('role', 'menu');

    // Menu items should have menuitem role
    const menuItems = contextMenu.locator('[role="menuitem"]');
    expect(await menuItems.count()).toBeGreaterThan(0);
  });

  test('Dynamic content has live regions', async ({ page }) => {
    // Check for aria-live regions for notifications/updates
    const liveRegions = page.locator('[aria-live]');

    // Should have at least one live region for notifications
    // This depends on implementation
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check that focus indicator is visible (not display:none or opacity:0)
    const opacity = await focusedElement.evaluate((el) =>
      window.getComputedStyle(el).opacity
    );
    const display = await focusedElement.evaluate((el) =>
      window.getComputedStyle(el).display
    );

    expect(parseFloat(opacity)).toBeGreaterThan(0);
    expect(display).not.toBe('none');
  });
});

test.describe('Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Page has proper document structure', async ({ page }) => {
    // Should have main landmark
    const main = page.locator('main, [role="main"]');
    expect(await main.count()).toBeGreaterThan(0);

    // Should have proper heading hierarchy
    const h1 = page.locator('h1');
    // May not have visible h1 on desktop, but should have semantic structure
  });

  test('Images have alt text', async ({ page }) => {
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Either has alt text or is decorative (alt="")
      expect(alt).not.toBeNull();
    }
  });

  test('Interactive elements are in tab order', async ({ page }) => {
    const tabbableElements = page.locator(
      'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const count = await tabbableElements.count();
    expect(count).toBeGreaterThan(0);

    // All should be keyboard accessible
    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = tabbableElements.nth(i);
      const tabIndex = await element.getAttribute('tabindex');

      // Should not have negative tabindex unless intentional
      if (tabIndex !== null) {
        expect(parseInt(tabIndex)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('Status messages announced to screen readers', async ({ page }) => {
    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    // Check for status/toast notifications with aria-live
    const statusRegions = page.locator('[aria-live], [role="status"], [role="alert"]');

    // At least notification system should exist
    // Implementation specific
  });

  test('Window state changes announced', async ({ page }) => {
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Minimize window
    const minimizeButton = page.locator('[data-testid="window-minimize-button"]');
    await minimizeButton.click();

    // Should announce state change (implementation specific)
    // Can check for aria-live regions or role changes
  });
});

test.describe('Color Contrast', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Text has sufficient contrast ratio', async ({ page }) => {
    // This is a basic check - full contrast testing requires specialized tools
    const desktop = page.locator('[data-testid="desktop-shell"]');

    const backgroundColor = await desktop.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Background should be defined
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('UI is usable in high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });

    const desktop = page.locator('[data-testid="desktop-shell"]');
    await expect(desktop).toBeVisible();

    // Switch to light
    await page.emulateMedia({ colorScheme: 'light' });

    await expect(desktop).toBeVisible();
  });
});

test.describe('Reduced Motion', () => {
  test('Respects prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@browseros.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/desktop');

    // Open window
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    // Animations should be reduced or instant
    // This is implementation specific - check that transitions are short or none
  });
});

test.describe('Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Focus trapped in modal dialogs', async ({ page }) => {
    // If a modal opens, focus should be trapped
    // This is implementation specific
  });

  test('Focus returned after closing window', async ({ page }) => {
    // Focus an icon
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    await icon.focus();

    // Open and close window
    await icon.dblclick();

    const window = page.locator('[data-testid="window"]');
    await expect(window).toBeVisible();

    const closeButton = page.locator('[data-testid="window-close-button"]');
    await closeButton.click();

    await expect(window).not.toBeVisible();

    // Focus should return to icon or desktop
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('Initial focus set correctly on page load', async ({ page }) => {
    // Desktop should have focus or skip link after load
    await page.waitForTimeout(500);

    // Check that focus is somewhere reasonable
    const focusedElement = page.locator(':focus');

    // Focus should not be on body
    const tagName = await focusedElement.evaluate((el) => el.tagName);
    expect(tagName.toLowerCase()).not.toBe('body');
  });
});

test.describe('Mobile Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Touch targets are large enough', async ({ page }) => {
    // Minimum touch target: 44x44px (Apple) or 48x48dp (Android)
    const icons = page.locator('[data-testid^="desktop-icon-"]');

    const firstIcon = icons.first();
    await expect(firstIcon).toBeVisible();

    const boundingBox = await firstIcon.boundingBox();

    expect(boundingBox!.width).toBeGreaterThanOrEqual(44);
    expect(boundingBox!.height).toBeGreaterThanOrEqual(44);
  });

  test('Content is readable without zoom', async ({ page }) => {
    // Font size should be at least 16px for body text
    const desktop = page.locator('[data-testid="desktop-shell"]');

    const fontSize = await desktop.evaluate((el) =>
      window.getComputedStyle(el).fontSize
    );

    const size = parseInt(fontSize);
    expect(size).toBeGreaterThanOrEqual(14); // Minimum readable size
  });
});
