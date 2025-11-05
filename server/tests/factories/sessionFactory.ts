import { Session, CreateSessionData } from '@shared/types';
import { executeQuery } from '../utils/testDb';
import { randomUUID } from 'crypto';

/**
 * Generate test session data (without creating in DB)
 */
export function generateSessionData(
  userId: string,
  overrides?: Partial<Omit<CreateSessionData, 'userId'>>
): CreateSessionData {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  return {
    userId,
    refreshToken: `refresh_token_${randomUUID()}_${Date.now()}`,
    expiresAt,
    userAgent: 'Mozilla/5.0 (Test Browser)',
    ipAddress: '127.0.0.1',
    ...overrides,
  };
}

/**
 * Create a session in the test database
 */
export async function createSession(
  userId: string,
  overrides?: Partial<Omit<CreateSessionData, 'userId'>>
): Promise<Session> {
  const sessionData = generateSessionData(userId, overrides);

  const result = await executeQuery<Session>(
    `
    INSERT INTO sessions (user_id, refresh_token, expires_at, user_agent, ip_address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, user_id as "userId", refresh_token as "refreshToken",
              expires_at as "expiresAt", user_agent as "userAgent",
              ip_address as "ipAddress", created_at as "createdAt"
    `,
    [
      sessionData.userId,
      sessionData.refreshToken,
      sessionData.expiresAt,
      sessionData.userAgent,
      sessionData.ipAddress,
    ]
  );

  return result[0];
}

/**
 * Create multiple sessions for a user
 */
export async function createSessions(
  userId: string,
  count: number
): Promise<Session[]> {
  const sessions: Session[] = [];
  for (let i = 0; i < count; i++) {
    sessions.push(await createSession(userId));
  }
  return sessions;
}

/**
 * Create an expired session
 */
export async function createExpiredSession(userId: string): Promise<Session> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return createSession(userId, { expiresAt: yesterday });
}

/**
 * Create sessions from different IPs and user agents
 */
export async function createSessionWithClientInfo(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<Session> {
  return createSession(userId, { ipAddress, userAgent });
}

/**
 * Get session by ID from database
 */
export async function getSessionById(
  sessionId: string
): Promise<Session | null> {
  const result = await executeQuery<Session>(
    `
    SELECT id, user_id as "userId", refresh_token as "refreshToken",
           expires_at as "expiresAt", user_agent as "userAgent",
           ip_address as "ipAddress", created_at as "createdAt"
    FROM sessions
    WHERE id = $1
    `,
    [sessionId]
  );
  return result[0] || null;
}

/**
 * Get session by refresh token from database
 */
export async function getSessionByRefreshToken(
  refreshToken: string
): Promise<Session | null> {
  const result = await executeQuery<Session>(
    `
    SELECT id, user_id as "userId", refresh_token as "refreshToken",
           expires_at as "expiresAt", user_agent as "userAgent",
           ip_address as "ipAddress", created_at as "createdAt"
    FROM sessions
    WHERE refresh_token = $1
    `,
    [refreshToken]
  );
  return result[0] || null;
}

/**
 * Get all sessions for a user
 */
export async function getSessionsByUserId(userId: string): Promise<Session[]> {
  return executeQuery<Session>(
    `
    SELECT id, user_id as "userId", refresh_token as "refreshToken",
           expires_at as "expiresAt", user_agent as "userAgent",
           ip_address as "ipAddress", created_at as "createdAt"
    FROM sessions
    WHERE user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await executeQuery('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  await executeQuery('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

/**
 * Count sessions for a user
 */
export async function countUserSessions(userId: string): Promise<number> {
  const result = await executeQuery<{ count: string }>(
    'SELECT COUNT(*) as count FROM sessions WHERE user_id = $1',
    [userId]
  );
  return parseInt(result[0].count, 10);
}
