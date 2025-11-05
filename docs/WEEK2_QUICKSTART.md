# Week 2 Quick Start Guide

**Sprint**: 1.2 - Desktop Shell & Window Manager
**Status**: READY TO START
**Date**: 2025-10-06

---

## For All Agents: Read This First

### What We're Building This Week
A complete desktop environment with window management that rivals native OS experiences. Think Windows 11 or macOS quality in the browser.

### Key Documents
1. **Implementation Plan**: `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md` (Read first!)
2. **Task Assignments**: `/c/Codes/BrowserOS/docs/AGENT_TASKS_WEEK2.md` (Your detailed tasks)
3. **Project Status**: `/c/Codes/BrowserOS/docs/PROJECT_STATUS.md` (Week 1 completion)

### Project Structure
```
/c/Codes/BrowserOS/
├── client/               # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── features/
│   │   │   ├── desktop/  # Desktop shell components
│   │   │   ├── windows/  # Window manager (empty - you'll build this)
│   │   │   └── apps/     # Applications
│   │   ├── stores/       # Zustand state management (empty)
│   │   ├── services/     # API clients (empty)
│   │   ├── hooks/        # Custom React hooks (empty)
│   │   └── components/   # Shared UI components
│   └── tests/            # Frontend tests
├── server/               # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   └── models/       # Database models
│   └── tests/            # Backend tests
├── shared/               # Shared types between frontend/backend
└── database/            # Migrations and seeds
```

### Development Commands
```bash
# Start all services (from project root)
docker-compose up -d

# Frontend development (from /client)
npm run dev          # Start dev server (http://localhost:5173)
npm run test         # Run tests
npm run lint         # Check code quality

# Backend development (from /server)
npm run dev          # Start dev server (http://localhost:3000)
npm run test         # Run tests
npm run db:migrate   # Run database migrations

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

---

## Frontend Developer: Start Here

### Your Mission
Build the visual desktop experience - shell, windows, taskbar, context menus.

### Quick Start (30 minutes)
1. Read: `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md` (Architecture section)
2. Review: Existing UI components in `/c/Codes/BrowserOS/client/src/components/ui/`
3. Check: Current desktop page at `/c/Codes/BrowserOS/client/src/features/desktop/pages/DesktopPage.tsx`

### Your Task Checklist
- [ ] Task 1.1: Desktop Shell component (full-screen container, wallpaper, layering)
- [ ] Task 1.2: Desktop Icons (draggable, double-click to launch)
- [ ] Task 1.3: Window component (drag, resize, minimize, maximize, close)
- [ ] Task 1.4: Window Title Bar (controls, double-click maximize)
- [ ] Task 1.5: Window Manager (z-index management, focus handling)
- [ ] Task 1.6: Taskbar (start button, app icons, system tray)
- [ ] Task 1.7: Context Menus (desktop and window right-click)
- [ ] Task 1.8: Animations (smooth transitions, 60fps)
- [ ] Task 1.9: Responsive layout

### Key Files You'll Create
```
client/src/features/desktop/components/
├── DesktopShell.tsx          # Main desktop container
├── DesktopIcon.tsx           # Individual desktop icons
├── DesktopContextMenu.tsx    # Right-click menu
└── Taskbar.tsx               # Bottom taskbar

client/src/features/windows/components/
├── WindowManager.tsx         # Container for all windows
├── Window.tsx                # Individual window
├── WindowTitleBar.tsx        # Title bar with controls
└── WindowContextMenu.tsx     # Window right-click menu

client/src/styles/
└── animations.css            # Window animations
```

### Dependencies Already Installed
- `react-draggable` - For dragging windows and icons
- `react-resizable` - For resizing windows
- `@radix-ui/react-context-menu` - For context menus
- `lucide-react` - For icons

### Performance Targets
- Desktop load: < 500ms
- Window operations: 60fps (< 16ms per frame)
- Smooth animations with CSS transforms
- Support 20+ windows without lag

### Integration Points
- **Day 3**: Connect to window store for state management
- **Day 5**: Full integration with backend persistence

### First Day Goals
- Desktop Shell rendering with wallpaper
- Basic Window component with title bar
- Window can be moved by dragging title bar

---

## Backend Logic Expert: Start Here

### Your Mission
Build the state management brain - Zustand stores, app framework, lifecycle management.

### Quick Start (30 minutes)
1. Read: `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md` (State Management section)
2. Review: Shared types in `/c/Codes/BrowserOS/shared/types/index.ts`
3. Study: Zustand documentation (https://zustand-demo.pmnd.rs/)

### Your Task Checklist
- [ ] Task 2.1: Desktop Store (wallpaper, theme, icons, taskbar config)
- [ ] Task 2.2: Window Store (window lifecycle, focus, z-index management)
- [ ] Task 2.3: App Registry Store (app catalog, launch logic)
- [ ] Task 2.4: Base Application class (abstract class for all apps)
- [ ] Task 2.5: Sample Applications (Welcome, Settings, About)
- [ ] Task 2.6: Convenience hooks (useDesktop, useWindow, useAppRegistry)
- [ ] Task 2.7: WebSocket integration (optional, real-time sync)

### Key Files You'll Create
```
client/src/stores/
├── desktopStore.ts           # Desktop state management
├── windowStore.ts            # Window state management
└── appRegistryStore.ts       # App catalog and launch

client/src/features/apps/base/
├── BaseApplication.tsx       # Abstract base class
└── AppContainer.tsx          # Wrapper for app rendering

client/src/features/apps/
├── WelcomeApp/index.tsx      # Sample app 1
├── SettingsApp/index.tsx     # Sample app 2
└── AboutApp/index.tsx        # Sample app 3

client/src/hooks/
├── useDesktop.ts             # Desktop store hook
├── useWindow.ts              # Window store hook
└── useAppRegistry.ts         # App registry hook
```

### Store Architecture Pattern
```typescript
// Example structure for all stores
interface Store {
  // State
  data: SomeData;
  loading: boolean;
  error: string | null;

  // Actions
  someAction: () => void;
  anotherAction: (param: string) => void;

  // Persistence
  load: () => Promise<void>;
  save: () => Promise<void>;

  // Queries (derived state)
  getSomething: (id: string) => Something | null;
}
```

### Integration Points
- **Day 2**: Frontend components will start consuming your stores
- **Day 4**: Backend APIs will integrate for persistence

### First Day Goals
- All three stores created with basic structure
- Window create/close/focus working
- Desktop store can update wallpaper and theme

---

## Backend Database: Start Here

### Your Mission
Build the persistence layer - APIs, database migrations, caching.

### Quick Start (30 minutes)
1. Read: `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md` (Backend API section)
2. Review: Existing auth routes in `/c/Codes/BrowserOS/server/src/routes/authRoutes.ts`
3. Check: Database schema in `/c/Codes/BrowserOS/database/migrations/001_initial_schema.sql`

### Your Task Checklist
- [ ] Task 3.1: Database migration for window_states table
- [ ] Task 3.2: Desktop state service (CRUD operations, caching)
- [ ] Task 3.3: Desktop state controller (request handlers, validation)
- [ ] Task 3.4: Desktop routes (API endpoints, auth, rate limiting)
- [ ] Task 3.5: Frontend API client (Axios service)
- [ ] Task 3.6: Redis configuration (caching layer)

### Key Files You'll Create
```
database/migrations/
└── 003_window_states.sql     # New table for window persistence

server/src/services/
└── desktopService.ts          # Business logic for desktop state

server/src/controllers/
└── desktopController.ts       # Request handlers

server/src/routes/
└── desktopRoutes.ts           # API route definitions

client/src/services/
└── desktopApi.ts              # Frontend API client

server/src/config/
└── redis.ts                   # Redis client setup
```

### API Endpoints You'll Create
```
GET    /api/desktop/state      # Get user's desktop state
PUT    /api/desktop/state      # Update desktop state
GET    /api/desktop/windows    # Get saved window positions
POST   /api/desktop/windows    # Save window state
```

### Database Schema
```sql
-- You'll create this table
CREATE TABLE window_states (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  app_id VARCHAR(100),
  position JSONB,
  size JSONB,
  state VARCHAR(20),
  z_index INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(user_id, app_id)
);
```

### Caching Strategy
- Cache desktop state in Redis for 5 minutes
- Invalidate on updates
- Reduce database load for frequent reads

### Integration Points
- **Day 3**: Frontend stores will call your APIs
- **Day 4**: Full integration testing with QA

### First Day Goals
- Migration runs successfully
- Desktop state GET/PUT endpoints working
- Redis caching layer set up

---

## QA Tester: Start Here

### Your Mission
Ensure bulletproof quality - write tests, find bugs, verify performance.

### Quick Start (30 minutes)
1. Read: `/c/Codes/BrowserOS/docs/WEEK2_IMPLEMENTATION_PLAN.md` (Testing Strategy section)
2. Review: Existing test setup in `/c/Codes/BrowserOS/docs/TESTING_GUIDE.md`
3. Check: Current auth tests in `/c/Codes/BrowserOS/server/tests/integration/authRoutes.test.ts`

### Your Task Checklist
- [ ] Task 4.1: Desktop component unit tests (Vitest + React Testing Library)
- [ ] Task 4.2: Window manager unit tests (drag, resize, focus)
- [ ] Task 4.3: State management tests (store actions, state updates)
- [ ] Task 4.4: Integration tests (desktop to window communication)
- [ ] Task 4.5: E2E tests (Playwright - full user workflows)
- [ ] Task 4.6: Performance tests (load time, frame rates, memory)
- [ ] Task 4.7: Backend API tests (endpoints, auth, errors)

### Test Structure You'll Create
```
client/tests/
├── components/
│   ├── DesktopShell.test.tsx
│   ├── Window.test.tsx
│   └── Taskbar.test.tsx
├── stores/
│   ├── desktopStore.test.ts
│   ├── windowStore.test.ts
│   └── appRegistryStore.test.ts
├── integration/
│   └── desktop.test.tsx
├── e2e/
│   └── desktop.spec.ts
└── performance/
    └── desktop.perf.test.ts

server/tests/
└── integration/
    └── desktopRoutes.test.ts
```

### Testing Tools
- **Vitest**: Unit and integration tests
- **React Testing Library**: Component testing
- **Playwright**: E2E browser testing
- **@vitest/ui**: Visual test runner

### Test Coverage Goals
- Components: 90%+
- Stores: 95%+
- API endpoints: 100%
- Overall: 90%+

### Key Test Scenarios
1. **Window Operations**: Open, drag, resize, minimize, maximize, close
2. **Focus Management**: Click window to bring to front, z-index updates
3. **State Persistence**: Save state, reload, verify restored
4. **Multi-window**: 20+ windows, verify performance stays 60fps
5. **Context Menus**: Right-click, menu appears, actions work

### Integration Points
- **Continuous**: Write tests alongside development
- **Day 3**: Integration testing begins
- **Day 5**: Full E2E test suite execution

### First Day Goals
- Test infrastructure verified working
- First component tests written (DesktopShell)
- Test coverage reporting set up

---

## Coordination Schedule

### Daily Standup (9:00 AM)
- **Duration**: 15 minutes
- **Format**: Each agent shares:
  - What I completed yesterday
  - What I'm working on today
  - Any blockers

### Integration Checkpoints

#### Day 1 EOD Sync
- Frontend: Components structure in place?
- Backend Logic: Stores created?
- Backend Database: Migration successful?
- QA: Tests running?

#### Day 3 Midpoint Sync
- Integration status
- Blocker identification
- Timeline adjustments

#### Day 5 Integration Day
- Full system testing
- Bug triage
- Polish tasks

#### Day 7 Sprint Review
- Feature demo
- Test results
- Retrospective

---

## Communication Channels

### For Blockers
- Tag Tech Lead immediately
- Don't stay blocked > 30 minutes

### For Questions
- Check implementation plan first
- Ask in daily standup
- Direct message for urgent items

### For Integration
- Coordinate interface changes
- Notify affected agents
- Update shared types in `/shared/types/`

---

## Definition of Done

### For All Features
- [ ] Implementation complete per spec
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code reviewed (self or peer)
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Performance targets met

### For Sprint Completion
- [ ] All tasks marked complete
- [ ] 90%+ test coverage achieved
- [ ] E2E tests passing
- [ ] Desktop loads in < 500ms
- [ ] Window operations at 60fps
- [ ] State persists across sessions
- [ ] Demo-ready for stakeholders

---

## Helpful Commands

### Check Docker Services
```bash
docker-compose ps                    # See running services
docker-compose logs -f backend       # Watch backend logs
docker-compose logs -f postgres      # Watch database logs
docker-compose restart backend       # Restart backend
```

### Database
```bash
npm run db:migrate                   # Run migrations
docker exec -it browseros-postgres psql -U postgres -d browseros  # Connect to DB
```

### Testing
```bash
npm test                             # Run all tests
npm test -- --ui                     # Visual test UI
npm test -- --coverage               # Coverage report
npx playwright test                  # E2E tests
npx playwright test --ui             # E2E with UI
```

### Code Quality
```bash
npm run lint                         # Check code style
npm run lint:fix                     # Auto-fix issues
npm run type-check                   # TypeScript check
```

---

## Success Criteria Checklist

By end of Week 2, we should have:

### User Experience
- [ ] Beautiful desktop with customizable wallpaper
- [ ] Desktop icons that can be repositioned
- [ ] Windows that open, close, minimize, maximize smoothly
- [ ] Smooth 60fps dragging and resizing
- [ ] Taskbar showing active apps
- [ ] Context menus on right-click
- [ ] Theme switching (light/dark)

### Technical Excellence
- [ ] 90%+ test coverage
- [ ] Zero memory leaks
- [ ] < 500ms desktop load time
- [ ] 60fps for all animations
- [ ] State persists across browser sessions
- [ ] Clean, maintainable code
- [ ] Complete documentation

### Deliverables
- [ ] Working desktop environment
- [ ] 3+ sample applications
- [ ] Comprehensive test suite
- [ ] API documentation
- [ ] Performance benchmarks
- [ ] Demo video/screenshots

---

## Troubleshooting

### Frontend Dev Server Won't Start
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend Can't Connect to Database
```bash
docker-compose down
docker-compose up -d postgres redis
# Wait 10 seconds
npm run db:migrate
npm run dev
```

### Tests Failing
```bash
# Clear test cache
npm test -- --clearCache
# Run specific test
npm test -- Window.test.tsx
```

### TypeScript Errors
```bash
# Regenerate types
npm run type-check
# Check shared types are in sync
```

---

## Resources

### Documentation
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Zustand**: https://zustand-demo.pmnd.rs/
- **Radix UI**: https://www.radix-ui.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/

### Design Inspiration
- Windows 11 Desktop
- macOS Desktop
- Ubuntu GNOME Shell
- Chrome OS

### Code Examples
- Check existing auth components for patterns
- Review UI component library in `/client/src/components/ui/`
- Look at auth tests for testing examples

---

## Let's Build Something Amazing!

Remember:
- **Quality over speed** - Do it right the first time
- **Test as you go** - Don't leave testing for the end
- **Communicate early** - Ask questions, share blockers
- **Focus on UX** - Every pixel matters
- **Have fun** - We're building the future of computing!

**Ready? Let's ship Week 2!**

---

**Document Version**: 1.0
**Last Updated**: 2025-10-06
**Next Review**: End of Day 1
