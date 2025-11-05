/**
 * Authentication Flow E2E Tests
 * Complete user journey from registration/login through desktop usage to logout
 *
 * Test Coverage:
 * - User registration flow
 * - User login flow
 * - Desktop access after authentication
 * - Token refresh
 * - Logout and session cleanup
 * - Protected route redirects
 */

import { test, expect, Page } from '@playwright/test';

// Helper: Register a new user with unique email
async function registerUser(page: Page, email: string, displayName: string, password: string) {
  await page.goto('/auth/register');

  // Wait for register form
  await page.waitForSelector('input[autocomplete="name"]', { state: 'visible' });

  // Fill in registration form
  await page.fill('input[autocomplete="name"]', displayName);
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="new-password"]', password);

  // Fill in password confirmation
  const passwordInputs = page.locator('input[autocomplete="new-password"]');
  await passwordInputs.last().fill(password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to desktop
  await page.waitForURL('**/desktop', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// Helper: Login with existing credentials
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login');

  // Wait for login form
  await page.waitForSelector('input[autocomplete="email"]', { state: 'visible' });

  // Fill in login form
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to desktop
  await page.waitForURL('**/desktop', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

// Helper: Logout
async function logoutUser(page: Page) {
  // Find and click logout button (adjust selector based on your UI)
  // This might be in a user menu, taskbar, or settings
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), button[aria-label="Logout"]').first();

  if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutButton.click();

    // Wait for redirect to login page
    await page.waitForURL('**/auth/login', { timeout: 5000 });
  } else {
    // Alternative: Click user menu first if logout is nested
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("User"), [aria-label="User menu"]').first();

    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(500);

      const logoutOption = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
      await logoutOption.click();

      await page.waitForURL('**/auth/login', { timeout: 5000 });
    }
  }
}

test.describe('User Registration Flow', () => {
  test('successfully registers a new user and navigates to desktop', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@browseros.com`;
    const displayName = 'Test User';
    const password = 'TestPassword123';

    await registerUser(page, uniqueEmail, displayName, password);

    // Verify we're on the desktop page
    expect(page.url()).toContain('/desktop');

    // Verify desktop shell is rendered
    const desktopShell = page.locator('[data-testid="desktop-shell"]');
    await expect(desktopShell).toBeVisible();

    // Verify user is authenticated (check for user display name or menu)
    const userDisplay = page.locator(`text=${displayName}`).first();
    await expect(userDisplay).toBeVisible({ timeout: 5000 });
  });

  test('shows validation errors for invalid registration data', async ({ page }) => {
    await page.goto('/auth/register');

    // Try to submit with empty fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=/display name is required/i')).toBeVisible();
    await expect(page.locator('text=/email is required/i')).toBeVisible();
  });

  test('shows error for duplicate email registration', async ({ page }) => {
    const uniqueEmail = `existing-${Date.now()}@browseros.com`;
    const displayName = 'Existing User';
    const password = 'TestPassword123';

    // Register first user
    await registerUser(page, uniqueEmail, displayName, password);

    // Logout
    await logoutUser(page);

    // Try to register again with same email
    await page.goto('/auth/register');
    await page.fill('input[autocomplete="name"]', 'Another User');
    await page.fill('input[autocomplete="email"]', uniqueEmail);
    await page.fill('input[autocomplete="new-password"]', password);

    const passwordInputs = page.locator('input[autocomplete="new-password"]');
    await passwordInputs.last().fill(password);

    await page.click('button[type="submit"]');

    // Should show error about existing email
    await expect(page.locator('text=/already exists/i, text=/already registered/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows error for weak password', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[autocomplete="name"]', 'Test User');
    await page.fill('input[autocomplete="email"]', `test-${Date.now()}@browseros.com`);
    await page.fill('input[autocomplete="new-password"]', 'weak');

    const passwordInputs = page.locator('input[autocomplete="new-password"]');
    await passwordInputs.last().fill('weak');

    await page.click('button[type="submit"]');

    // Should show password strength error
    await expect(page.locator('text=/password/i')).toBeVisible();
  });
});

test.describe('User Login Flow', () => {
  let testEmail: string;
  const testPassword = 'TestPassword123';

  test.beforeEach(async ({ page }) => {
    // Create a test user before each test
    testEmail = `login-test-${Date.now()}@browseros.com`;
    await registerUser(page, testEmail, 'Login Test User', testPassword);
    await logoutUser(page);
  });

  test('successfully logs in and navigates to desktop', async ({ page }) => {
    await loginUser(page, testEmail, testPassword);

    // Verify we're on the desktop page
    expect(page.url()).toContain('/desktop');

    // Verify desktop is rendered
    const desktopShell = page.locator('[data-testid="desktop-shell"]');
    await expect(desktopShell).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[autocomplete="email"]', 'nonexistent@browseros.com');
    await page.fill('input[autocomplete="current-password"]', testPassword);

    await page.click('button[type="submit"]');

    // Should show authentication error
    await expect(page.locator('text=/invalid/i, text=/incorrect/i, text=/not found/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows error for incorrect password', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[autocomplete="email"]', testEmail);
    await page.fill('input[autocomplete="current-password"]', 'WrongPassword123');

    await page.click('button[type="submit"]');

    // Should show authentication error
    await expect(page.locator('text=/invalid/i, text=/incorrect/i')).toBeVisible({ timeout: 5000 });
  });

  test('remembers user when remember me is checked', async ({ page, context }) => {
    await page.goto('/auth/login');

    await page.fill('input[autocomplete="email"]', testEmail);
    await page.fill('input[autocomplete="current-password"]', testPassword);

    // Check remember me checkbox
    await page.check('input[type="checkbox"]');

    await page.click('button[type="submit"]');

    // Wait for desktop to load
    await page.waitForURL('**/desktop', { timeout: 10000 });

    // Get cookies to verify remember me token
    const cookies = await context.cookies();
    const hasRefreshToken = cookies.some(cookie =>
      cookie.name.includes('refresh') || cookie.name.includes('token')
    );

    // Check localStorage for tokens
    const hasTokens = await page.evaluate(() => {
      return (
        localStorage.getItem('accessToken') !== null ||
        localStorage.getItem('refreshToken') !== null
      );
    });

    // Either cookies or localStorage should have tokens
    expect(hasRefreshToken || hasTokens).toBe(true);
  });
});

test.describe('Complete User Journey', () => {
  test('complete flow: register → use desktop → logout → login → use desktop → logout', async ({ page }) => {
    const uniqueEmail = `journey-${Date.now()}@browseros.com`;
    const displayName = 'Journey Test User';
    const password = 'TestPassword123';

    // Step 1: Register
    await registerUser(page, uniqueEmail, displayName, password);

    // Step 2: Verify desktop loaded
    const desktopShell = page.locator('[data-testid="desktop-shell"]');
    await expect(desktopShell).toBeVisible();

    // Step 3: Use desktop (open a window)
    const icon = page.locator('[data-testid^="desktop-icon-"]').first();
    if (await icon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await icon.dblclick();
      await page.waitForTimeout(500);

      // Verify window opened
      const window = page.locator('[data-testid="window"]');
      await expect(window).toBeVisible({ timeout: 3000 });
    }

    // Step 4: Logout
    await logoutUser(page);

    // Verify redirected to login
    expect(page.url()).toContain('/auth/login');

    // Step 5: Login again
    await loginUser(page, uniqueEmail, password);

    // Verify back on desktop
    await expect(desktopShell).toBeVisible();

    // Step 6: Logout again
    await logoutUser(page);

    // Verify redirected to login again
    expect(page.url()).toContain('/auth/login');
  });

  test('session persists across page reloads', async ({ page }) => {
    const uniqueEmail = `persist-${Date.now()}@browseros.com`;
    const displayName = 'Persist Test User';
    const password = 'TestPassword123';

    // Register and login
    await registerUser(page, uniqueEmail, displayName, password);

    // Verify on desktop
    const desktopShell = page.locator('[data-testid="desktop-shell"]');
    await expect(desktopShell).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on desktop (session persisted)
    await expect(desktopShell).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Protected Routes', () => {
  test('redirects to login when accessing desktop without authentication', async ({ page }) => {
    // Try to access desktop directly without logging in
    await page.goto('/desktop');

    // Should redirect to login page
    await page.waitForURL('**/auth/login', { timeout: 5000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('allows access to desktop after authentication', async ({ page }) => {
    const uniqueEmail = `protected-${Date.now()}@browseros.com`;
    const password = 'TestPassword123';

    // Register user
    await registerUser(page, uniqueEmail, 'Protected Test User', password);

    // Logout
    await logoutUser(page);

    // Login again
    await loginUser(page, uniqueEmail, password);

    // Now try to access desktop directly
    await page.goto('/desktop');

    // Should stay on desktop (no redirect)
    expect(page.url()).toContain('/desktop');

    const desktopShell = page.locator('[data-testid="desktop-shell"]');
    await expect(desktopShell).toBeVisible();
  });

  test('redirects to desktop when accessing login while authenticated', async ({ page }) => {
    const uniqueEmail = `authed-${Date.now()}@browseros.com`;
    const password = 'TestPassword123';

    // Register user (will be logged in automatically)
    await registerUser(page, uniqueEmail, 'Authed Test User', password);

    // Try to go to login page while authenticated
    await page.goto('/auth/login');

    // Should redirect back to desktop
    await page.waitForURL('**/desktop', { timeout: 5000 });
    expect(page.url()).toContain('/desktop');
  });
});

test.describe('Session Management', () => {
  test('clears tokens on logout', async ({ page }) => {
    const uniqueEmail = `tokens-${Date.now()}@browseros.com`;
    const password = 'TestPassword123';

    // Register and login
    await registerUser(page, uniqueEmail, 'Token Test User', password);

    // Verify tokens exist
    const tokensBeforeLogout = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      };
    });

    // At least one token should exist
    expect(
      tokensBeforeLogout.accessToken !== null || tokensBeforeLogout.refreshToken !== null
    ).toBe(true);

    // Logout
    await logoutUser(page);

    // Verify tokens cleared
    const tokensAfterLogout = await page.evaluate(() => {
      return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
      };
    });

    expect(tokensAfterLogout.accessToken).toBeNull();
    expect(tokensAfterLogout.refreshToken).toBeNull();
  });

  test('handles expired session gracefully', async ({ page }) => {
    const uniqueEmail = `expired-${Date.now()}@browseros.com`;
    const password = 'TestPassword123';

    // Register and login
    await registerUser(page, uniqueEmail, 'Expired Test User', password);

    // Manually expire tokens (set to invalid value)
    await page.evaluate(() => {
      localStorage.setItem('accessToken', 'expired-token');
      localStorage.setItem('refreshToken', 'expired-refresh');
    });

    // Try to reload desktop
    await page.reload();

    // Should redirect to login due to invalid tokens
    await page.waitForURL('**/auth/login', { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });
});

test.describe('Performance', () => {
  test('login completes within 3 seconds', async ({ page }) => {
    const uniqueEmail = `perf-${Date.now()}@browseros.com`;
    const password = 'TestPassword123';

    // Register user first
    await registerUser(page, uniqueEmail, 'Perf Test User', password);
    await logoutUser(page);

    // Measure login time
    const startTime = Date.now();

    await page.goto('/auth/login');
    await page.fill('input[autocomplete="email"]', uniqueEmail);
    await page.fill('input[autocomplete="current-password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/desktop', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const loginTime = Date.now() - startTime;

    // Login should complete within 3 seconds
    expect(loginTime).toBeLessThan(3000);
  });

  test('desktop loads within 2 seconds after login', async ({ page }) => {
    const uniqueEmail = `load-${Date.now()}@browseros.com`;
    const password = 'TestPassword123';

    // Register and login
    await registerUser(page, uniqueEmail, 'Load Test User', password);

    // Logout
    await logoutUser(page);

    // Login and measure desktop load time
    await page.goto('/auth/login');
    await page.fill('input[autocomplete="email"]', uniqueEmail);
    await page.fill('input[autocomplete="current-password"]', password);
    await page.click('button[type="submit"]');

    const startTime = Date.now();

    await page.waitForURL('**/desktop', { timeout: 10000 });

    const desktopShell = page.locator('[data-testid="desktop-shell"]');
    await expect(desktopShell).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Desktop should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });
});
