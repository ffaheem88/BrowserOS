/**
 * Desktop API Integration Tests
 * Comprehensive tests for desktop state and window persistence endpoints
 *
 * Coverage Target: 100%
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';
import { pool } from '../../src/config/database';
import { createTestUser, generateToken } from '../helpers/jwtHelper';

describe('Desktop API Endpoints', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const user = await createTestUser();
    userId = user.userId;
    authToken = generateToken(userId);
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.end();
  });

  beforeEach(async () => {
    // Clean desktop state before each test
    await pool.query('DELETE FROM desktop_states WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM window_states WHERE user_id = $1', [userId]);
  });

  describe('GET /api/desktop/state', () => {
    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/desktop/state')
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });

    it('returns default state for new user', async () => {
      const response = await request(app)
        .get('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.data.version).toBe(0);
      expect(response.body.data.desktop).toBeDefined();
      expect(response.body.data.desktop.theme).toBeTruthy();
      expect(response.body.data.desktop.wallpaper).toBeTruthy();
    });

    it('returns saved desktop state', async () => {
      // Save desktop state first
      const desktopState = {
        wallpaper: '/custom-wallpaper.jpg',
        theme: 'light',
        icons: [
          {
            id: 'icon-1',
            appId: 'test-app',
            icon: '/icon.png',
            label: 'Test App',
            position: { x: 100, y: 100 }
          }
        ],
        taskbar: {
          position: 'top',
          autohide: false,
          pinnedApps: ['app1', 'app2']
        }
      };

      await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ desktop: desktopState })
        .expect(200);

      // Retrieve state
      const response = await request(app)
        .get('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.desktop.wallpaper).toBe('/custom-wallpaper.jpg');
      expect(response.body.data.desktop.theme).toBe('light');
      expect(response.body.data.desktop.icons).toHaveLength(1);
      expect(response.body.data.desktop.taskbar.position).toBe('top');
    });

    it('returns correct version number', async () => {
      // Save state multiple times
      for (let i = 0; i < 3; i++) {
        await request(app)
          .put('/api/desktop/state')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            desktop: {
              wallpaper: `/wallpaper-${i}.jpg`,
              theme: 'dark',
              icons: [],
              taskbar: { position: 'bottom', autohide: false, pinnedApps: [] }
            }
          })
          .expect(200);
      }

      const response = await request(app)
        .get('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.version).toBe(3);
    });
  });

  describe('PUT /api/desktop/state', () => {
    it('returns 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/desktop/state')
        .send({ desktop: {} })
        .expect(401);

      expect(response.body.error).toBeTruthy();
    });

    it('saves desktop state successfully', async () => {
      const desktopState = {
        wallpaper: '/test-wallpaper.jpg',
        theme: 'dark',
        icons: [],
        taskbar: {
          position: 'bottom',
          autohide: false,
          pinnedApps: ['app1']
        }
      };

      const response = await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ desktop: desktopState })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.version).toBe(1);
    });

    it('returns 400 for invalid state data', async () => {
      const response = await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ desktop: { invalid: 'data' } })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toContain('Invalid request data');
    });

    it('validates required fields', async () => {
      const invalidState = {
        wallpaper: '/wallpaper.jpg'
        // Missing theme, icons, taskbar
      };

      const response = await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ desktop: invalidState })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('handles version conflict correctly', async () => {
      // Save initial state
      await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          desktop: {
            wallpaper: '/v1.jpg',
            theme: 'dark',
            icons: [],
            taskbar: { position: 'bottom', autohide: false, pinnedApps: [] }
          }
        })
        .expect(200);

      // Try to update with wrong version
      const response = await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          version: 0, // Wrong version
          desktop: {
            wallpaper: '/v2.jpg',
            theme: 'light',
            icons: [],
            taskbar: { position: 'top', autohide: false, pinnedApps: [] }
          }
        })
        .expect(409);

      expect(response.body.error.code).toBe('VERSION_CONFLICT');
    });

    it('increments version on each save', async () => {
      const desktopState = {
        wallpaper: '/wallpaper.jpg',
        theme: 'dark',
        icons: [],
        taskbar: { position: 'bottom', autohide: false, pinnedApps: [] }
      };

      // Save multiple times
      for (let i = 1; i <= 5; i++) {
        const response = await request(app)
          .put('/api/desktop/state')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ desktop: desktopState })
          .expect(200);

        expect(response.body.data.version).toBe(i);
      }
    });

    it('respects rate limiting', async () => {
      const desktopState = {
        wallpaper: '/wallpaper.jpg',
        theme: 'dark',
        icons: [],
        taskbar: { position: 'bottom', autohide: false, pinnedApps: [] }
      };

      // Make many rapid requests
      const requests = [];
      for (let i = 0; i < 35; i++) {
        requests.push(
          request(app)
            .put('/api/desktop/state')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ desktop: desktopState })
        );
      }

      const responses = await Promise.allSettled(requests);

      // Some requests should be rate limited (429)
      const rateLimited = responses.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/desktop/windows', () => {
    it('returns 401 without authentication', async () => {
      await request(app)
        .get('/api/desktop/windows')
        .expect(401);
    });

    it('returns empty array for new user', async () => {
      const response = await request(app)
        .get('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
    });

    it('returns saved window states', async () => {
      // Save some window states
      await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appId: 'text-editor',
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          state: 'normal',
          zIndex: 100
        })
        .expect(200);

      await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appId: 'calculator',
          position: { x: 200, y: 200 },
          size: { width: 400, height: 500 },
          state: 'normal',
          zIndex: 101
        })
        .expect(200);

      const response = await request(app)
        .get('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].app_id).toBe('text-editor');
      expect(response.body.data[1].app_id).toBe('calculator');
    });
  });

  describe('POST /api/desktop/windows', () => {
    it('returns 401 without authentication', async () => {
      await request(app)
        .post('/api/desktop/windows')
        .send({ appId: 'test-app' })
        .expect(401);
    });

    it('saves window state successfully', async () => {
      const windowState = {
        appId: 'text-editor',
        position: { x: 150, y: 150 },
        size: { width: 1000, height: 700 },
        state: 'normal',
        zIndex: 105
      };

      const response = await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(windowState)
        .expect(200);

      expect(response.body.data.success).toBe(true);

      // Verify it was saved
      const getResponse = await request(app)
        .get('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(getResponse.body.data).toHaveLength(1);
      expect(getResponse.body.data[0].app_id).toBe('text-editor');
    });

    it('updates existing window state for same app', async () => {
      const initialState = {
        appId: 'text-editor',
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        state: 'normal',
        zIndex: 100
      };

      await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(initialState)
        .expect(200);

      // Update the same app
      const updatedState = {
        appId: 'text-editor',
        position: { x: 200, y: 200 },
        size: { width: 1000, height: 800 },
        state: 'maximized',
        zIndex: 110
      };

      await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatedState)
        .expect(200);

      // Should still have only one window state
      const response = await request(app)
        .get('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].position.x).toBe(200);
      expect(response.body.data[0].state).toBe('maximized');
    });

    it('validates window state data', async () => {
      const invalidState = {
        appId: 'test-app',
        position: { x: 'invalid', y: 100 }, // Invalid x
        size: { width: 800, height: 600 },
        state: 'normal',
        zIndex: 100
      };

      await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidState)
        .expect(400);
    });

    it('respects rate limiting', async () => {
      const windowState = {
        appId: 'test-app',
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        state: 'normal',
        zIndex: 100
      };

      // Make many rapid requests
      const requests = [];
      for (let i = 0; i < 35; i++) {
        requests.push(
          request(app)
            .post('/api/desktop/windows')
            .set('Authorization', `Bearer ${authToken}`)
            .send(windowState)
        );
      }

      const responses = await Promise.allSettled(requests);

      // Some should be rate limited
      const rateLimited = responses.filter(
        (r) => r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('handles concurrent desktop state updates', async () => {
      const desktopState = {
        wallpaper: '/wallpaper.jpg',
        theme: 'dark',
        icons: [],
        taskbar: { position: 'bottom', autohide: false, pinnedApps: [] }
      };

      // Make 10 concurrent requests
      const startTime = Date.now();

      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .put('/api/desktop/state')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ desktop: desktopState })
        );
      }

      await Promise.all(requests);

      const duration = Date.now() - startTime;

      // All requests should complete in reasonable time
      expect(duration).toBeLessThan(2000);
    });

    it('handles large desktop state efficiently', async () => {
      // Create large state with many icons
      const icons = [];
      for (let i = 0; i < 100; i++) {
        icons.push({
          id: `icon-${i}`,
          appId: `app-${i}`,
          icon: `/icon-${i}.png`,
          label: `App ${i}`,
          position: { x: i * 10, y: i * 10 }
        });
      }

      const largeState = {
        wallpaper: '/wallpaper.jpg',
        theme: 'dark',
        icons,
        taskbar: {
          position: 'bottom',
          autohide: false,
          pinnedApps: Array.from({ length: 20 }, (_, i) => `app-${i}`)
        }
      };

      const startTime = Date.now();

      await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ desktop: largeState })
        .expect(200);

      const saveDuration = Date.now() - startTime;

      // Should save efficiently even with large data
      expect(saveDuration).toBeLessThan(500);

      // Verify retrieval is also efficient
      const getStartTime = Date.now();

      const response = await request(app)
        .get('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const getDuration = Date.now() - getStartTime;

      expect(getDuration).toBeLessThan(300);
      expect(response.body.data.desktop.icons).toHaveLength(100);
    });
  });

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      // This test would require mocking database failures
      // Implementation depends on how database connection is managed
    });

    it('returns proper error messages for malformed requests', async () => {
      const response = await request(app)
        .put('/api/desktop/state')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeTruthy();
    });

    it('handles missing required fields', async () => {
      const response = await request(app)
        .post('/api/desktop/windows')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          position: { x: 100, y: 100 }
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
