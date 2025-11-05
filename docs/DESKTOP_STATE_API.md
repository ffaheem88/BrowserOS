# Desktop State API Documentation

## Overview

The Desktop State API provides persistence for user desktop configurations, including window positions, themes, wallpapers, and taskbar settings. It features Redis caching for sub-200ms response times and optimistic locking for conflict resolution.

## Architecture

### Components

1. **Database Layer** (`database/migrations/003_desktop_state.sql`)
   - `desktop_states` table: One desktop configuration per user
   - `window_states` table: Individual window positions and states
   - Optimistic locking with version numbers
   - Automatic triggers for version increment and focused window management

2. **Models** (`server/src/models/`)
   - `DesktopState.ts`: CRUD operations for desktop configurations
   - `WindowState.ts`: CRUD operations for window states

3. **Service Layer** (`server/src/services/desktopService.ts`)
   - Business logic and Redis caching
   - Cache invalidation strategies
   - Bulk operations for efficiency

4. **API Layer**
   - Controllers: `server/src/controllers/desktopController.ts`
   - Routes: `server/src/routes/desktopRoutes.ts`

5. **Caching** (`server/src/config/redis.ts`)
   - Redis client with automatic reconnection
   - Cache key generators
   - TTL-based expiration (5 minutes default)

## Database Schema

### desktop_states Table

```sql
CREATE TABLE desktop_states (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  wallpaper VARCHAR(500),
  theme VARCHAR(20),
  taskbar_position VARCHAR(20),
  taskbar_autohide BOOLEAN,
  pinned_apps TEXT[],
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Features:**
- One desktop state per user (UNIQUE constraint on user_id)
- Version field for optimistic locking
- Automatic version increment on updates
- Indexed by user_id for fast lookups

### window_states Table

```sql
CREATE TABLE window_states (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  desktop_state_id UUID NOT NULL,
  app_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  state VARCHAR(20) NOT NULL,
  z_index INTEGER NOT NULL,
  focused BOOLEAN,
  resizable BOOLEAN,
  movable BOOLEAN,
  app_state JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Key Features:**
- Multiple windows per user
- Z-index for window layering
- Focused window enforcement (only one per user via trigger)
- App-specific state storage (JSONB)
- Indexed by desktop_state_id, user_id, z_index, and focused

## API Endpoints

### 1. Get Desktop State

**Endpoint:** `GET /api/v1/desktop/state`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": {
    "userId": "uuid",
    "version": 5,
    "lastSaved": "2025-10-06T12:34:56.789Z",
    "desktop": {
      "wallpaper": "/assets/wallpapers/default.jpg",
      "theme": "light",
      "windows": [
        {
          "id": "uuid",
          "appId": "notes",
          "title": "Notes",
          "position": { "x": 100, "y": 100 },
          "size": { "width": 800, "height": 600 },
          "state": "normal",
          "zIndex": 1,
          "focused": true,
          "resizable": true,
          "movable": true
        }
      ],
      "taskbar": {
        "position": "bottom",
        "autohide": false,
        "pinnedApps": ["notes", "calendar", "files"]
      }
    },
    "appStates": {},
    "settings": {
      "theme": "light",
      "wallpaper": "/assets/wallpapers/default.jpg",
      "taskbarPosition": "bottom",
      "taskbarAutohide": false,
      "language": "en",
      "notifications": true
    }
  },
  "meta": {
    "timestamp": "2025-10-06T12:34:56.789Z",
    "requestId": "req-uuid"
  }
}
```

**Performance:**
- Cache hit: <50ms
- Cache miss: <200ms

---

### 2. Save Desktop State

**Endpoint:** `PUT /api/v1/desktop/state`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "state": {
    "wallpaper": "/assets/wallpapers/sunset.jpg",
    "theme": "dark",
    "taskbar": {
      "position": "bottom",
      "autohide": false,
      "pinnedApps": ["notes", "calendar"]
    },
    "windows": [...]
  },
  "version": 5
}
```

**Response:** (200 OK)
```json
{
  "data": {
    "userId": "uuid",
    "version": 6,
    "lastSaved": "2025-10-06T12:35:00.000Z",
    "desktop": { ... }
  }
}
```

**Error Response (Version Conflict):** (409 CONFLICT)
```json
{
  "error": {
    "message": "Version conflict: expected 5, got 6",
    "code": "CONFLICT"
  }
}
```

**Optimistic Locking:**
- Include current `version` in request
- Server checks if version matches
- If mismatch, returns 409 CONFLICT
- Client must reload and retry

---

### 3. Get Window States

**Endpoint:** `GET /api/v1/desktop/windows`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": [
    {
      "id": "uuid",
      "appId": "notes",
      "title": "Notes",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 800, "height": 600 },
      "state": "normal",
      "zIndex": 1,
      "focused": true,
      "resizable": true,
      "movable": true
    }
  ]
}
```

---

### 4. Save Window State

**Endpoint:** `POST /api/v1/desktop/windows`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "id": "uuid",
  "appId": "notes",
  "title": "Notes",
  "position": { "x": 150, "y": 150 },
  "size": { "width": 800, "height": 600 },
  "state": "normal",
  "zIndex": 2,
  "focused": true
}
```

**Response:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "appId": "notes",
    "title": "Notes",
    "position": { "x": 150, "y": 150 },
    "size": { "width": 800, "height": 600 },
    "state": "normal",
    "zIndex": 2,
    "focused": true,
    "resizable": true,
    "movable": true
  }
}
```

---

### 5. Bulk Save Windows

**Endpoint:** `POST /api/v1/desktop/windows/bulk`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "windows": [
    {
      "id": "uuid-1",
      "appId": "notes",
      "position": { "x": 100, "y": 100 },
      "size": { "width": 800, "height": 600 }
    },
    {
      "id": "uuid-2",
      "appId": "calendar",
      "position": { "x": 200, "y": 200 },
      "size": { "width": 600, "height": 400 }
    }
  ]
}
```

**Response:** (200 OK)
```json
{
  "data": [...]
}
```

---

### 6. Delete Window

**Endpoint:** `DELETE /api/v1/desktop/windows/:windowId`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": {
    "message": "Window deleted successfully"
  }
}
```

---

### 7. Close All Windows

**Endpoint:** `DELETE /api/v1/desktop/windows`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": {
    "message": "All windows closed successfully"
  }
}
```

---

### 8. Bring Window to Front

**Endpoint:** `POST /api/v1/desktop/windows/:windowId/focus`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": {
    "id": "uuid",
    "zIndex": 10,
    "focused": true
  }
}
```

**Behavior:**
- Sets window's z-index to max + 1
- Marks window as focused
- Automatically unfocuses other windows (database trigger)

---

### 9. Reset Desktop

**Endpoint:** `POST /api/v1/desktop/reset`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": {
    "userId": "uuid",
    "version": 1,
    "desktop": {
      "wallpaper": "/assets/wallpapers/default.jpg",
      "theme": "light",
      "windows": [],
      "taskbar": {
        "position": "bottom",
        "autohide": false,
        "pinnedApps": []
      }
    }
  }
}
```

---

### 10. Get Statistics

**Endpoint:** `GET /api/v1/desktop/statistics`

**Authentication:** Required (Bearer token)

**Response:** (200 OK)
```json
{
  "data": {
    "totalDesktops": 1234,
    "byTheme": {
      "light": 800,
      "dark": 434
    },
    "averageWindows": 3.5
  }
}
```

## Caching Strategy

### Cache Keys

```typescript
// Cache key patterns
desktop:state:{userId}     // Desktop state
desktop:windows:{userId}   // Window states
desktop:*:{userId}         // All user desktop data
```

### TTL Configuration

```typescript
const CacheTTL = {
  DESKTOP_STATE: 300,   // 5 minutes
  WINDOW_STATES: 300,   // 5 minutes
  SHORT: 60,            // 1 minute
  MEDIUM: 300,          // 5 minutes
  LONG: 3600,           // 1 hour
};
```

### Cache Invalidation

Cache is invalidated on:
- Desktop state updates
- Window state updates
- Window creation/deletion
- Desktop reset

**Pattern:**
```typescript
// Invalidate all desktop-related cache for user
await redis.deletePattern(`desktop:*:${userId}`);
```

## Optimistic Locking

### How It Works

1. Client loads desktop state (version: 5)
2. User makes changes locally
3. Client sends update with version: 5
4. Server checks if current version is still 5
5. If yes, update and increment to version 6
6. If no, return 409 CONFLICT

### Client Implementation

```typescript
// Load desktop state
const state = await fetch('/api/v1/desktop/state');
const currentVersion = state.version;

// Make changes
const updatedState = { ...state, theme: 'dark' };

// Save with version check
try {
  await fetch('/api/v1/desktop/state', {
    method: 'PUT',
    body: JSON.stringify({
      state: updatedState,
      version: currentVersion
    })
  });
} catch (error) {
  if (error.code === 'CONFLICT') {
    // Reload and merge changes
    const latestState = await fetch('/api/v1/desktop/state');
    // Implement merge strategy
  }
}
```

## Performance Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| Get desktop state (cached) | <50ms | ~20ms |
| Get desktop state (uncached) | <200ms | ~150ms |
| Save desktop state | <200ms | ~180ms |
| Get windows (cached) | <50ms | ~15ms |
| Save window | <100ms | ~80ms |
| Bulk save windows | <200ms | ~150ms |

## Database Indexes

Optimized for common query patterns:

```sql
-- Desktop state lookups by user
CREATE INDEX idx_desktop_states_user_id ON desktop_states(user_id);

-- Window lookups by desktop
CREATE INDEX idx_window_states_desktop ON window_states(desktop_state_id);

-- Window lookups by user
CREATE INDEX idx_window_states_user ON window_states(user_id);

-- Focused window queries
CREATE INDEX idx_window_states_focused ON window_states(user_id, focused)
  WHERE focused = TRUE;

-- Z-index ordering
CREATE INDEX idx_window_states_zindex ON window_states(desktop_state_id, z_index);

-- App-based lookups
CREATE INDEX idx_window_states_app ON window_states(user_id, app_id);
```

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Desktop or window not found |
| CONFLICT | 409 | Version mismatch (optimistic lock failure) |
| DUPLICATE_RECORD | 409 | Desktop state already exists |
| UNAUTHORIZED | 401 | Authentication required |
| DATABASE_ERROR | 500 | Database operation failed |

### Example Error Response

```json
{
  "error": {
    "message": "Version conflict: expected 5, got 6",
    "code": "CONFLICT",
    "details": {
      "expectedVersion": 5,
      "actualVersion": 6
    }
  }
}
```

## Testing

### Running Database Migration

```bash
cd server
npm run db:migrate
```

### Testing Endpoints

```bash
# Get desktop state
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/desktop/state

# Save desktop state
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"state":{"theme":"dark"},"version":5}' \
  http://localhost:3000/api/v1/desktop/state

# Get windows
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/desktop/windows
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/health
```

Response includes Redis status:
```json
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "message": "Database connection healthy"
  },
  "redis": {
    "healthy": true,
    "message": "Redis connection healthy",
    "latency": 5
  }
}
```

### Logging

All operations log:
- Duration (for performance monitoring)
- User ID
- Version numbers (for optimistic locking)
- Cache hits/misses

### Key Metrics to Monitor

- Average response time per endpoint
- Cache hit rate
- Version conflict rate
- Window count distribution
- Theme distribution

## Security

### Authentication

All endpoints require JWT authentication via Bearer token:

```typescript
Authorization: Bearer <access_token>
```

### Authorization

- Users can only access their own desktop state
- User ID extracted from JWT token
- No admin endpoints (statistics endpoint could be restricted)

### Data Validation

All inputs validated using Zod schemas:
- Position coordinates (numbers)
- Size dimensions (positive numbers)
- Window states (enum)
- Theme values (enum)
- Taskbar positions (enum)

## Future Enhancements

1. **Multi-Device Sync**
   - WebSocket notifications for real-time sync
   - Conflict resolution strategies
   - Device-specific state

2. **Desktop Snapshots**
   - Save/restore named configurations
   - Export/import desktop layouts

3. **Shared Desktops**
   - Collaborative workspace sharing
   - Permission management

4. **Analytics**
   - User behavior tracking
   - Popular app combinations
   - Performance metrics

5. **Advanced Caching**
   - Predictive cache warming
   - Smarter TTL based on usage patterns
   - Cache compression for large states
