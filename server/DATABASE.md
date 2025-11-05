# BrowserOS Database Layer Documentation

## Overview

The BrowserOS database layer provides a robust, type-safe interface for PostgreSQL database operations. It includes connection pooling, transaction management, migrations, and comprehensive models for user and session management.

## Architecture

```
server/
├── src/
│   ├── config/
│   │   └── database.ts          # Database connection pool configuration
│   ├── database/
│   │   ├── index.ts             # Module exports
│   │   ├── migrator.ts          # Migration runner
│   │   └── utils.ts             # Database utilities and helpers
│   ├── models/
│   │   ├── User.ts              # User model with CRUD operations
│   │   └── Session.ts           # Session model for authentication
│   └── utils/
│       ├── logger.ts            # Winston logger
│       └── healthCheck.ts       # Health check and cleanup utilities
└── scripts/
    ├── migrate.ts               # Migration runner script
    ├── seed.ts                  # Database seeding script
    └── reset.ts                 # Database reset script
```

## Features

### Database Configuration
- **Connection Pooling**: Optimized PostgreSQL connection pool with configurable min/max connections
- **Error Handling**: Comprehensive error handling with automatic retry logic
- **Health Checks**: Built-in health monitoring for connection status
- **Graceful Shutdown**: Proper connection cleanup on application termination

### Migration System
- **Version Control**: Track applied migrations in the database
- **Sequential Execution**: Migrations run in order based on filename prefix
- **Idempotent**: Safe to run multiple times - only pending migrations execute
- **Rollback Support**: Foundation for future rollback capabilities

### Models

#### UserModel
CRUD operations for user management:
- `create()` - Create new user with email validation
- `findById()` - Retrieve user by UUID
- `findByEmail()` - Retrieve user by email address
- `findByEmailWithPassword()` - Get user with password hash for authentication
- `update()` - Update user profile data
- `updatePassword()` - Update user password hash
- `updateLastLogin()` - Track user login activity
- `delete()` - Remove user (hard delete, cascades to sessions)
- `count()` - Get total user count
- `list()` - Paginated user listing

#### SessionModel
Refresh token session management:
- `create()` - Create new session with refresh token
- `findById()` - Retrieve session by UUID (excludes expired)
- `findByRefreshToken()` - Find session by token (excludes expired)
- `findByUserId()` - Get all sessions for a user
- `delete()` - Remove session by ID
- `deleteByRefreshToken()` - Remove session by token
- `deleteByUserId()` - Remove all sessions for a user
- `deleteExpired()` - Cleanup expired sessions
- `countByUserId()` - Count active sessions for user
- `countActive()` - Count all active sessions
- `getStatistics()` - Get session statistics
- `updateExpiration()` - Extend session expiration

### Utilities

#### Database Error Handling
- Custom `DatabaseError` class with PostgreSQL error codes
- Type-safe error checking (unique violations, foreign key violations, etc.)
- Detailed error logging with context

#### Query Builders
- `buildSetClause()` - Generate SET clause for UPDATE queries
- `buildWhereClause()` - Generate WHERE clause with AND conditions
- `buildOrderBy()` - Generate ORDER BY clause
- `buildPagination()` - Calculate limit and offset for pagination

#### Data Transformation
- `camelToSnake()` - Convert JavaScript camelCase to SQL snake_case
- `snakeToCamel()` - Convert SQL snake_case to JavaScript camelCase
- `rowToCamel()` - Transform database row to camelCase object
- `objectToSnake()` - Transform object to snake_case for database

#### Validation
- `isValidUUID()` - Validate UUID format
- `sanitizeSearchQuery()` - Sanitize input for full-text search

## Usage

### Initialization

```typescript
import { initializeDatabase } from './config/database.js';

// Initialize with environment variables
const db = initializeDatabase();
await db.connect();
```

### Basic Queries

```typescript
import { getDatabase } from './config/database.js';

const db = getDatabase();

// Simple query
const result = await db.query('SELECT * FROM users WHERE email = $1', ['user@example.com']);

// Get first row safely
const user = getFirstRow(result);
```

### Transactions

```typescript
const result = await db.transaction(async (client) => {
  // All queries use the same client
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO sessions ...');

  // Return value is passed through
  return { success: true };
});
```

### Using Models

```typescript
import { UserModel, SessionModel } from './models/index.js';

// Create user
const user = await UserModel.create({
  email: 'user@example.com',
  password: 'hashed_password',
  displayName: 'John Doe',
  passwordHash: 'hashed_password',
});

// Find user
const foundUser = await UserModel.findByEmail('user@example.com');

// Create session
const session = await SessionModel.create({
  userId: user.id,
  refreshToken: 'token_string',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
});

// Find session by token
const foundSession = await SessionModel.findByRefreshToken('token_string');
```

### Error Handling

```typescript
import { DatabaseError, handleDatabaseError } from './database/utils.js';

try {
  await UserModel.create(userData);
} catch (error) {
  const dbError = handleDatabaseError(error);

  if (dbError.isUniqueViolation()) {
    // Handle duplicate email
    console.error('Email already exists');
  }

  throw dbError;
}
```

## Database Scripts

### Run Migrations

```bash
npm run db:migrate
```

Applies all pending migrations to the database.

### Seed Database

```bash
npm run db:seed
```

Populates database with:
- Test users (admin@browseros.com, demo@browseros.com)
- Default applications (Notes, Calendar, File Manager, Settings)

### Reset Database

```bash
npm run db:reset
```

**WARNING**: Drops all tables and re-runs migrations. Only works in development.

## Configuration

Environment variables (see `.env.example`):

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/browseros
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Security
BCRYPT_ROUNDS=12
```

## Performance Optimization

### Indexing Strategy

The schema includes indexes for:
- Email lookups: `idx_users_email`
- Session lookups: `idx_sessions_user_id`, `idx_sessions_refresh_token`
- VFS operations: `idx_vfs_user_parent`, `idx_vfs_storage_key`

### Query Optimization

- **Parameterized queries**: All queries use `$1`, `$2` placeholders to prevent SQL injection
- **Connection pooling**: Reuse connections for better performance
- **Slow query logging**: Queries >1000ms are logged automatically
- **Transaction batching**: Related operations grouped in transactions

### Best Practices

1. **Always use models**: Models provide validation and consistent error handling
2. **Use transactions**: Group related operations for data consistency
3. **Handle errors**: Use try-catch and DatabaseError for proper error handling
4. **Log appropriately**: Use structured logging for debugging
5. **Cleanup regularly**: Run `SessionModel.deleteExpired()` periodically
6. **Monitor health**: Use health check endpoints to monitor database status

## Health Monitoring

```typescript
import { performHealthCheck, getDatabaseStatistics } from './utils/healthCheck.js';

// Check overall health
const health = await performHealthCheck();
console.log(health.status); // 'healthy' | 'degraded' | 'unhealthy'

// Get detailed statistics
const stats = await getDatabaseStatistics();
console.log(stats.sessions); // { total, active, expired }
console.log(stats.pool); // { total, idle, waiting }
```

## Scheduled Tasks

Recommended scheduled tasks:

1. **Session Cleanup** (every hour)
   ```typescript
   await SessionModel.deleteExpired();
   ```

2. **Health Check** (every 5 minutes)
   ```typescript
   await performHealthCheck();
   ```

3. **Statistics Collection** (every 15 minutes)
   ```typescript
   await getDatabaseStatistics();
   ```

## Security Considerations

1. **Password Storage**: Never store plain text passwords. Always use bcrypt.
2. **SQL Injection**: All queries use parameterized statements.
3. **Session Management**: Refresh tokens are unique and expire automatically.
4. **Data Validation**: Models validate input before database operations.
5. **Connection Security**: SSL enabled in production environments.

## Testing

Models and utilities are designed for easy testing:

```typescript
import { Database } from './config/database.js';
import { UserModel } from './models/User.js';

// In test setup
const testDb = Database.getInstance(testConfig);
await testDb.connect();

// Run tests
const user = await UserModel.create(testData);
expect(user.email).toBe(testData.email);

// Cleanup
await testDb.disconnect();
```

## Migration Development

Create new migrations:

1. Create file: `database/migrations/003_description.sql`
2. Write SQL (use IF NOT EXISTS for idempotency)
3. Add comments for documentation
4. Test with `npm run db:reset && npm run db:migrate`

Example migration:

```sql
-- Migration 003: Add user preferences
-- Created: 2025-10-02

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, key)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings';
```

## Troubleshooting

### Connection Issues

- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Check network/firewall settings
- Review connection pool configuration

### Migration Failures

- Check SQL syntax
- Verify dependencies (foreign keys, etc.)
- Review migration order
- Check database user permissions

### Performance Issues

- Review slow query logs
- Check connection pool stats
- Analyze query execution plans
- Verify indexes are being used

## Future Enhancements

- [ ] Read replicas support
- [ ] Query result caching
- [ ] Migration rollback support
- [ ] Soft delete implementation
- [ ] Full-text search integration
- [ ] Connection pooling optimization
- [ ] Query builder DSL
- [ ] Audit logging

## Support

For issues or questions about the database layer, refer to:
- Migration files: `database/migrations/`
- Type definitions: `shared/types/index.ts`
- Task documentation: `docs/AGENT_TASKS.md`
