# Desktop State API - Deployment Checklist

## Pre-Deployment Checklist

### 1. Database Setup

- [ ] PostgreSQL is running and accessible
- [ ] Database connection string is configured in `.env`
- [ ] Run migration: `npm run db:migrate`
- [ ] Verify tables exist:
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('desktop_states', 'window_states');
  ```
- [ ] Check indexes:
  ```sql
  SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename IN ('desktop_states', 'window_states');
  ```

### 2. Redis Setup

- [ ] Redis is running and accessible
- [ ] Redis connection string configured in `.env` (default: `redis://localhost:6379`)
- [ ] Test Redis connection:
  ```bash
  redis-cli ping
  # Should return: PONG
  ```
- [ ] Verify Redis accepts connections:
  ```bash
  redis-cli
  > SET test "value"
  > GET test
  > DEL test
  ```

### 3. Environment Variables

Required variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/browseros
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis (optional - server continues if Redis unavailable)
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# JWT (already configured)
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (already configured)
CORS_ORIGIN=http://localhost:5173
```

### 4. Dependencies

- [ ] Install server dependencies:
  ```bash
  cd server
  npm install
  ```
- [ ] Verify redis package is installed:
  ```bash
  npm list redis
  # Should show: redis@4.7.0
  ```

### 5. Code Verification

- [ ] All new files created:
  - [ ] `database/migrations/003_desktop_state.sql`
  - [ ] `server/src/config/redis.ts`
  - [ ] `server/src/models/DesktopState.ts`
  - [ ] `server/src/models/WindowState.ts`
  - [ ] `server/src/services/desktopService.ts`
  - [ ] `server/src/controllers/desktopController.ts`
  - [ ] `server/src/routes/desktopRoutes.ts`

- [ ] Modified files updated:
  - [ ] `server/src/index.ts` (Redis initialization, routes)
  - [ ] `server/src/models/index.ts` (model exports)

- [ ] Documentation created:
  - [ ] `docs/DESKTOP_STATE_API.md`
  - [ ] `docs/WEEK2_IMPLEMENTATION_SUMMARY.md`
  - [ ] `docs/FRONTEND_INTEGRATION_GUIDE.md`
  - [ ] `docs/DEPLOYMENT_CHECKLIST.md`

### 6. Server Startup

- [ ] Start server in development mode:
  ```bash
  cd server
  npm run dev
  ```
- [ ] Check console output for:
  - [ ] "Initializing database connection..."
  - [ ] "Database connected successfully"
  - [ ] "Initializing Redis connection..."
  - [ ] "Redis connected successfully"
  - [ ] "Server started successfully"

- [ ] No error messages in console

### 7. Health Check

- [ ] Test health endpoint:
  ```bash
  curl http://localhost:3000/health
  ```

- [ ] Verify response includes:
  ```json
  {
    "status": "healthy",
    "database": {
      "healthy": true
    },
    "redis": {
      "healthy": true,
      "latency": 5
    }
  }
  ```

### 8. API Testing

#### Get Auth Token

```bash
# Register or login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Save the accessToken from response
export TOKEN="<access-token-here>"
```

#### Test Desktop Endpoints

- [ ] Get desktop state:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/state
  ```
  Expected: 200 OK with desktop state

- [ ] Save desktop state:
  ```bash
  curl -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"state":{"theme":"dark"},"version":1}' \
    http://localhost:3000/api/v1/desktop/state
  ```
  Expected: 200 OK with updated state (version: 2)

- [ ] Get windows:
  ```bash
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/windows
  ```
  Expected: 200 OK with empty array initially

- [ ] Create window:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "appId":"notes",
      "title":"Notes",
      "position":{"x":100,"y":100},
      "size":{"width":800,"height":600},
      "state":"normal",
      "zIndex":1,
      "focused":true
    }' \
    http://localhost:3000/api/v1/desktop/windows
  ```
  Expected: 200 OK with created window (includes id)

- [ ] Focus window (use id from previous response):
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/windows/<window-id>/focus
  ```
  Expected: 200 OK with updated window (higher zIndex)

### 9. Performance Testing

- [ ] Test cache performance:
  ```bash
  # First request (cache miss)
  time curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/state

  # Second request (cache hit) - should be faster
  time curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/state
  ```

- [ ] Verify response times:
  - First request: <200ms
  - Subsequent requests: <50ms

### 10. Cache Verification

- [ ] Check Redis for cached data:
  ```bash
  redis-cli
  > KEYS desktop:*
  > GET desktop:state:<user-id>
  > TTL desktop:state:<user-id>
  ```

- [ ] Verify cache invalidation:
  ```bash
  # Check cache exists
  redis-cli GET desktop:state:<user-id>

  # Update desktop state
  curl -X PUT ... /api/v1/desktop/state

  # Verify cache was deleted
  redis-cli GET desktop:state:<user-id>
  # Should return: (nil)
  ```

### 11. Optimistic Locking

- [ ] Test version conflict:
  ```bash
  # Get current version
  VERSION=$(curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/state | \
    jq -r '.data.version')

  # Try to update with old version
  curl -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"state\":{\"theme\":\"dark\"},\"version\":$((VERSION-1))}" \
    http://localhost:3000/api/v1/desktop/state
  ```
  Expected: 409 CONFLICT

### 12. Error Handling

- [ ] Test without authentication:
  ```bash
  curl http://localhost:3000/api/v1/desktop/state
  ```
  Expected: 401 UNAUTHORIZED

- [ ] Test with invalid data:
  ```bash
  curl -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"appId":"test"}' \
    http://localhost:3000/api/v1/desktop/windows
  ```
  Expected: 422 VALIDATION_ERROR

- [ ] Test with non-existent window:
  ```bash
  curl -X DELETE \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/v1/desktop/windows/nonexistent-id
  ```
  Expected: 404 NOT_FOUND

### 13. Database Verification

- [ ] Check data was saved:
  ```sql
  -- Count desktop states
  SELECT COUNT(*) FROM desktop_states;

  -- Count windows
  SELECT COUNT(*) FROM window_states;

  -- View recent desktop states
  SELECT user_id, version, theme, updated_at
  FROM desktop_states
  ORDER BY updated_at DESC
  LIMIT 5;

  -- View recent windows
  SELECT user_id, app_id, title, z_index, focused
  FROM window_states
  ORDER BY created_at DESC
  LIMIT 10;
  ```

### 14. Logging

- [ ] Check server logs for:
  - No error messages
  - Query performance logs (duration)
  - Cache hit/miss logs
  - Version increment logs

- [ ] Verify slow query logging:
  ```bash
  # Trigger a slow query (if any)
  # Check logs for "Slow query detected"
  ```

### 15. Graceful Shutdown

- [ ] Test graceful shutdown:
  ```bash
  # Send SIGTERM
  kill -SIGTERM <server-pid>

  # Or use Ctrl+C
  ```

- [ ] Verify logs show:
  - "SIGTERM received, starting graceful shutdown..."
  - "HTTP server closed"
  - "Database disconnected successfully"
  - "Redis disconnected successfully"
  - "Graceful shutdown completed"

## Production Checklist

### Additional Production Requirements

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong `JWT_SECRET` (32+ characters, random)
- [ ] Enable SSL for PostgreSQL connection
- [ ] Enable Redis password authentication
- [ ] Configure Redis persistence (AOF or RDB)
- [ ] Set up database backups
- [ ] Configure log aggregation
- [ ] Set up monitoring/alerting
- [ ] Configure rate limiting
- [ ] Review and tighten CORS settings
- [ ] Set appropriate Redis TTL for production
- [ ] Configure connection pool sizes based on load

### Security Hardening

- [ ] Database user has minimal required permissions
- [ ] Redis is not exposed to public internet
- [ ] All passwords stored in secure environment variables
- [ ] HTTPS enabled for API endpoints
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting configured

### Monitoring Setup

- [ ] Database query performance monitoring
- [ ] Redis memory usage monitoring
- [ ] API response time tracking
- [ ] Error rate monitoring
- [ ] Cache hit rate tracking
- [ ] Version conflict rate tracking

### Backup Strategy

- [ ] Database backup schedule configured
- [ ] Backup restoration tested
- [ ] Redis persistence configured (if critical)
- [ ] Backup retention policy defined

## Troubleshooting

### Server won't start

**Symptom:** Server crashes on startup

**Check:**
1. PostgreSQL is running and accessible
2. Database exists and migrations are run
3. Redis is running (or disable Redis in development)
4. All environment variables are set
5. Port 3000 is not in use

### Redis connection failed

**Symptom:** "Redis connection failed" in logs

**Solutions:**
1. Check Redis is running: `redis-cli ping`
2. Check Redis URL in `.env`
3. Server will continue without Redis (degraded performance)

### Slow queries

**Symptom:** Logs show "Slow query detected"

**Check:**
1. Database indexes are created
2. Connection pool is not exhausted
3. Database server performance
4. Query complexity

### Cache not working

**Symptom:** All requests slow, no cache hits in logs

**Check:**
1. Redis connection is healthy
2. TTL is not too short
3. Cache keys are correct
4. Cache invalidation is not too aggressive

### Version conflicts

**Symptom:** Frequent 409 CONFLICT errors

**Check:**
1. Multiple clients updating simultaneously
2. Frontend implementing proper conflict resolution
3. Auto-save interval not too short

### TypeScript compilation errors

**Note:** The codebase has some pre-existing TypeScript errors related to Express type definitions. These are non-critical and don't affect runtime behavior. The errors are:
- Unused variable warnings (TS6133)
- Express route handler type mismatches (TS2769)

These can be ignored for now or fixed with:
```typescript
// @ts-ignore
```

## Sign-off

- [ ] All database tables created and indexed
- [ ] All API endpoints tested and working
- [ ] Performance targets met (<200ms)
- [ ] Caching working correctly
- [ ] Optimistic locking tested
- [ ] Error handling verified
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for frontend integration

**Deployed by:** _______________

**Date:** _______________

**Environment:** _______________

**Notes:** _______________________________________________
