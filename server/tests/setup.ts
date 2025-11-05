import { beforeAll, afterAll, afterEach } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { setupTestDatabase, teardownTestDatabase, resetDatabase } from './utils/testDb';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Setup test database before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Clean up database after each test
afterEach(async () => {
  await resetDatabase();
});

// Teardown test database after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

// Increase timeout for database operations
export const TEST_TIMEOUT = 10000;
