import { User, CreateUserData } from '@shared/types';
import bcrypt from 'bcrypt';
import { executeQuery } from '../utils/testDb';

let userCounter = 0;

/**
 * Generate unique test email
 */
export function generateTestEmail(): string {
  userCounter++;
  return `test.user${userCounter}.${Date.now()}@example.com`;
}

/**
 * Generate test user data (without creating in DB)
 */
export function generateUserData(
  overrides?: Partial<CreateUserData>
): CreateUserData {
  return {
    email: generateTestEmail(),
    password: 'Test123!@#',
    displayName: `Test User ${userCounter}`,
    ...overrides,
  };
}

/**
 * Create a user in the test database with hashed password
 */
export async function createUser(
  overrides?: Partial<CreateUserData>
): Promise<User> {
  const userData = generateUserData(overrides);
  const passwordHash = await bcrypt.hash(userData.password, 10);

  const result = await executeQuery<User>(
    `
    INSERT INTO users (email, password_hash, display_name)
    VALUES ($1, $2, $3)
    RETURNING id, email, display_name as "displayName", avatar_url as "avatarUrl",
              created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin"
    `,
    [userData.email, passwordHash, userData.displayName]
  );

  return result[0];
}

/**
 * Create multiple users in the test database
 */
export async function createUsers(count: number): Promise<User[]> {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUser());
  }
  return users;
}

/**
 * Create a user with specific password (useful for login tests)
 */
export async function createUserWithPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<{ user: User; password: string }> {
  const user = await createUser({
    email,
    password,
    displayName: displayName || 'Test User',
  });
  return { user, password };
}

/**
 * Get user by ID from database
 */
export async function getUserById(userId: string): Promise<User | null> {
  const result = await executeQuery<User>(
    `
    SELECT id, email, display_name as "displayName", avatar_url as "avatarUrl",
           created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin"
    FROM users
    WHERE id = $1
    `,
    [userId]
  );
  return result[0] || null;
}

/**
 * Get user by email from database
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await executeQuery<User>(
    `
    SELECT id, email, display_name as "displayName", avatar_url as "avatarUrl",
           created_at as "createdAt", updated_at as "updatedAt", last_login as "lastLogin"
    FROM users
    WHERE email = $1
    `,
    [email]
  );
  return result[0] || null;
}

/**
 * Get password hash for a user (useful for verification tests)
 */
export async function getUserPasswordHash(userId: string): Promise<string | null> {
  const result = await executeQuery<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  return result[0]?.password_hash || null;
}

/**
 * Reset the user counter (useful for test isolation)
 */
export function resetUserCounter(): void {
  userCounter = 0;
}
