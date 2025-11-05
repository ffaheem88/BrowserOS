# BrowserOS

> A revolutionary browser-based operating system providing a complete desktop experience with persistent state management, file system, and extensible application architecture.

**Project Status**: Week 2+ - Authentication Integration Complete ✅
**Project Owner**: ARC (Agents Reaching Consciousness)
**Timeline**: 12 weeks to MVP, 24 weeks to Production v1.0

> 🎉 **Latest Update (2025-11-05)**: Frontend authentication fully integrated with backend API! Users can now register, login, and access the desktop with real JWT token management. 30+ integration tests ensure API reliability.

---

## Overview

BrowserOS transforms the browser into a complete operating system environment, offering:

- Native OS-like desktop experience with window management
- Seamless state persistence across sessions (< 3 seconds login to productivity)
- Virtual file system with S3-backed storage
- Extensible application architecture with plugin system
- Real-time collaboration features
- Enterprise-grade security and authentication

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Query
- **UI Framework**: Tailwind CSS + Radix UI
- **Desktop/Window Manager**: Custom React-based WM

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express
- **Database**: PostgreSQL 16
- **Cache/Sessions**: Redis 7
- **Real-time**: Socket.io (WebSockets)
- **File Storage**: S3-compatible (MinIO for development)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Testing**: Vitest + React Testing Library + Playwright

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BrowserOS
   ```

2. **Set up environment variables**
   ```bash
   # Root directory
   cp .env.example .env

   # Frontend
   cp client/.env.example client/.env

   # Backend
   cp server/.env.example server/.env
   ```

3. **Start development environment with Docker**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - MinIO S3 storage (ports 9000, 9001)
   - Backend API (port 5000)
   - Frontend dev server (port 3000)

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MinIO Console: http://localhost:9001

### Local Development (Without Docker)

1. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

2. **Set up PostgreSQL and Redis locally**
   - Ensure PostgreSQL is running on port 5432
   - Ensure Redis is running on port 6379
   - Update connection strings in `.env` files

3. **Run database migrations**
   ```bash
   cd server
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev

   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

---

## Project Structure

```
BrowserOS/
├── client/                   # Frontend application
│   ├── src/
│   │   ├── components/       # Shared UI components
│   │   ├── apps/            # Desktop applications
│   │   ├── features/        # Feature-specific code
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # State management (Zustand)
│   │   ├── services/        # API clients
│   │   └── utils/           # Utility functions
│   └── tests/               # Frontend tests
│
├── server/                   # Backend application
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   └── tests/               # Backend tests
│
├── shared/                   # Shared TypeScript types and utilities
├── database/                 # Database migrations and seeds
├── docker/                   # Docker configurations
├── docs/                     # Documentation
└── .github/                  # GitHub Actions workflows
```

---

## Development Workflow

### Code Quality

```bash
# Lint code
npm run lint              # Check all code
npm run lint:fix          # Auto-fix issues

# Format code
npm run format            # Format with Prettier

# Type checking
npm run type-check        # TypeScript validation
```

### Testing

```bash
# Frontend tests
cd client
npm test                  # Run tests in watch mode
npm run test:coverage     # Generate coverage report

# Backend tests
cd server
npm test                  # Run tests
npm run test:coverage     # Generate coverage report
```

### Building for Production

```bash
# Build frontend
cd client
npm run build

# Build backend
cd server
npm run build
```

### Database Management

```bash
cd server

# Run migrations
npm run db:migrate

# Seed database with default data
npm run db:seed

# Reset database (drop all tables and recreate)
npm run db:reset
```

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Desktop Shell │ Window Manager │ Application Framework     │
│  Theme Engine  │ State Persist  │ Keyboard/Mouse Handlers   │
└─────────────────────────────────────────────────────────────┘
                            ↕ (HTTPS/WSS)
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Auth Service  │  Session Manager  │  Rate Limiting         │
│  Load Balancer │  WebSocket Router │  API Versioning        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Application Services                      │
├─────────────────────────────────────────────────────────────┤
│ User Service    │ Desktop Service │ App Service             │
│ File Service    │ Settings Service│ Notification Service    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│ PostgreSQL      │ Redis Cache     │ Object Storage          │
│ (User/App Data) │ (Sessions/State)│ (Files/Assets)          │
└─────────────────────────────────────────────────────────────┘
```

### Core Features

1. **Authentication & Session Management**
   - JWT-based authentication with refresh tokens
   - Secure session management in Redis
   - Multiple concurrent sessions support

2. **Desktop Environment**
   - Window management (drag, resize, minimize, maximize)
   - Taskbar with application launcher
   - Customizable themes and wallpapers
   - Keyboard shortcuts

3. **State Persistence**
   - Automatic state saving (debounced every 5 seconds)
   - State restoration on login
   - Version control and conflict resolution

4. **Virtual File System**
   - Hierarchical file and folder structure
   - S3-backed file storage
   - File operations (create, read, update, delete)
   - File sharing and permissions

5. **Application Framework**
   - Plugin architecture for extensibility
   - Sandboxed application execution
   - Permission system
   - Inter-app communication via event bus

---

## Recent Deliverables

### Week 2+ Completed (2025-11-05) ✅

**Authentication Integration**
- [x] Frontend authentication service with full API client
- [x] Token storage utility (localStorage management)
- [x] LoginPage connected to backend API
- [x] RegisterPage connected to backend API
- [x] JWT token management with refresh flow
- [x] 30+ integration tests for auth endpoints
- [x] Backend app refactored for testability (supertest)

### Week 1 Foundation ✅

**Infrastructure & Setup**
- [x] Project scaffolding with Vite + React + TypeScript
- [x] Database schema design and migrations (3 migrations)
- [x] User authentication system (register, login, logout)
- [x] JWT token management with refresh flow
- [x] Complete API structure with error handling
- [x] Development environment setup (Docker Compose)
- [x] CI/CD pipeline foundation
- [x] Desktop shell UI with window management
- [x] State management with Zustand stores

---

## API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/register    # Register new user
POST   /api/v1/auth/login       # Login user
POST   /api/v1/auth/logout      # Logout user
POST   /api/v1/auth/refresh     # Refresh access token
GET    /api/v1/auth/me          # Get current user info
```

### Desktop Endpoints

```
GET    /api/v1/desktop          # Get desktop state
PUT    /api/v1/desktop          # Update desktop state
PATCH  /api/v1/desktop          # Partial update desktop state
```

### File System Endpoints

```
GET    /api/v1/files            # List files/folders
GET    /api/v1/files/:id        # Get file details
POST   /api/v1/files            # Create file/folder
PUT    /api/v1/files/:id        # Update file
DELETE /api/v1/files/:id        # Delete file
POST   /api/v1/files/:id/upload # Upload file content
GET    /api/v1/files/:id/download # Download file
```

---

## Troubleshooting

### bcrypt Binding Error

If you encounter an error like `Error loading shared library ... bcrypt_lib.node: Exec format error`, this means the bcrypt native bindings were compiled for a different architecture than your Docker container.

**Solution:**

1. **Stop and remove all containers and volumes:**
   ```bash
   docker compose down -v
   ```

2. **Rebuild the containers from scratch:**
   ```bash
   docker compose build --no-cache backend
   docker compose up -d
   ```

The updated Dockerfile now includes `npm rebuild bcrypt --build-from-source` to ensure bcrypt is compiled for Alpine Linux, but you need to clear the old volumes that contain incompatible binaries.

**Why this happens:**
- Docker Compose uses named volumes for `node_modules` to improve performance
- If dependencies were first installed on your host machine (macOS/Windows) and the volume was created with those binaries, they're incompatible with Alpine Linux in the container
- Clearing the volume forces a fresh installation inside the container

### Other Docker Issues

**Container won't start:**
- Check logs: `docker compose logs backend`
- Ensure all required ports are available (3000, 5000, 5432, 6379, 9000, 9001)
- Verify environment variables are set correctly

**Database connection errors:**
- Wait for PostgreSQL to fully initialize (check with `docker compose logs postgres`)
- Ensure DATABASE_URL in backend environment matches PostgreSQL credentials

---

## Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| First Contentful Paint | < 1.0s | < 1.5s |
| Time to Interactive | < 2.0s | < 3.0s |
| API Response (p95) | < 100ms | < 500ms |
| Desktop State Save | < 100ms | < 500ms |
| State Persistence | 99.99% | 99.9% |

---

## Contributing

### Agent Specializations

- **Frontend Developer**: React components, state management, UI/UX
- **Backend Database Specialist**: Schema design, queries, migrations
- **Backend Logic Expert**: API endpoints, business logic, security
- **QA Tester**: Test coverage, E2E testing, quality assurance

### Code Standards

- TypeScript strict mode enabled
- ESLint and Prettier for code quality
- Minimum 80% test coverage
- All PRs require passing CI/CD checks

---

## Security

- HTTPS/TLS 1.3 for all communications
- JWT with short-lived access tokens (15 min)
- Refresh token rotation
- bcrypt password hashing (cost factor 12)
- Rate limiting on all endpoints
- Content Security Policy headers
- SQL injection prevention (parameterized queries)
- XSS and CSRF protection

---

## License

UNLICENSED - Proprietary software for ARC

---

## Support

For questions or issues, please refer to the project documentation in the `docs/` directory or contact the project team.

---

**Built with AI-driven development by ARC (Agents Reaching Consciousness)**
