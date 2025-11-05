#!/usr/bin/env node
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { initializeDatabase } from '../src/config/database.js';
import { UserModel } from '../src/models/User.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../../.env') });

/**
 * Seed database with initial data
 */
async function seedDatabase() {
  let db;

  try {
    logger.info('='.repeat(60));
    logger.info('Database Seeding');
    logger.info('='.repeat(60));

    // Initialize database
    db = initializeDatabase();
    await db.connect();

    // Create test users
    await seedTestUsers();

    // Seed default applications (if needed)
    await seedDefaultApplications();

    logger.info('='.repeat(60));
    logger.info('Database seeding completed successfully');
    logger.info('='.repeat(60));

    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  } finally {
    if (db) {
      await db.disconnect();
    }
  }
}

/**
 * Seed test users
 */
async function seedTestUsers() {
  const testUsers = [
    {
      email: 'admin@browseros.com',
      password: 'Admin123!',
      displayName: 'Admin User',
    },
    {
      email: 'demo@browseros.com',
      password: 'Demo123!',
      displayName: 'Demo User',
    },
  ];

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const existing = await UserModel.findByEmail(userData.email);

      if (existing) {
        logger.info(`User already exists: ${userData.email}`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(
        userData.password,
        parseInt(process.env.BCRYPT_ROUNDS || '12')
      );

      // Create user
      const user = await UserModel.create({
        email: userData.email,
        password: passwordHash,
        displayName: userData.displayName,
      });

      logger.info(`Created test user: ${user.email}`);
    } catch (error) {
      logger.error(`Failed to create user: ${userData.email}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

/**
 * Seed default applications
 */
async function seedDefaultApplications() {
  // Default applications to be seeded
  const defaultApps = [
    {
      id: 'notes',
      name: 'Notes',
      version: '1.0.0',
      description: 'Simple note-taking application',
      author: 'BrowserOS',
      icon_url: '/apps/icons/notes.svg',
      manifest: {
        permissions: ['notes.read', 'notes.write'],
        windowConfig: {
          defaultSize: { width: 800, height: 600 },
          minSize: { width: 400, height: 300 },
          resizable: true,
          maximizable: true,
        },
        entryPoint: '/apps/notes/index.js',
      },
      published: true,
    },
    {
      id: 'calendar',
      name: 'Calendar',
      version: '1.0.0',
      description: 'Calendar and event management',
      author: 'BrowserOS',
      icon_url: '/apps/icons/calendar.svg',
      manifest: {
        permissions: ['calendar.read', 'calendar.write'],
        windowConfig: {
          defaultSize: { width: 900, height: 700 },
          minSize: { width: 600, height: 400 },
          resizable: true,
          maximizable: true,
        },
        entryPoint: '/apps/calendar/index.js',
      },
      published: true,
    },
    {
      id: 'files',
      name: 'File Manager',
      version: '1.0.0',
      description: 'Virtual file system manager',
      author: 'BrowserOS',
      icon_url: '/apps/icons/files.svg',
      manifest: {
        permissions: ['filesystem.read', 'filesystem.write'],
        windowConfig: {
          defaultSize: { width: 1000, height: 600 },
          minSize: { width: 600, height: 400 },
          resizable: true,
          maximizable: true,
        },
        entryPoint: '/apps/files/index.js',
      },
      published: true,
    },
    {
      id: 'settings',
      name: 'Settings',
      version: '1.0.0',
      description: 'System settings and preferences',
      author: 'BrowserOS',
      icon_url: '/apps/icons/settings.svg',
      manifest: {
        permissions: ['settings.read', 'settings.write', 'system.read'],
        windowConfig: {
          defaultSize: { width: 700, height: 500 },
          minSize: { width: 500, height: 400 },
          resizable: true,
          maximizable: false,
        },
        entryPoint: '/apps/settings/index.js',
      },
      published: true,
    },
  ];

  const db = initializeDatabase();

  for (const app of defaultApps) {
    try {
      // Check if app already exists
      const existingQuery = await db.query(
        'SELECT id FROM applications WHERE id = $1',
        [app.id]
      );

      if (existingQuery.rows.length > 0) {
        logger.info(`Application already exists: ${app.name}`);
        continue;
      }

      // Insert application
      await db.query(
        `INSERT INTO applications
         (id, name, version, description, author, icon_url, manifest, published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          app.id,
          app.name,
          app.version,
          app.description,
          app.author,
          app.icon_url,
          JSON.stringify(app.manifest),
          app.published,
        ]
      );

      logger.info(`Created default application: ${app.name}`);
    } catch (error) {
      logger.error(`Failed to create application: ${app.name}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

// Run seeding
seedDatabase();
