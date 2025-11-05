# Quick Test Commands Reference

## Backend Testing

### Basic Commands
```bash
cd server

# Run all tests
npm test

# Run specific test file
npm test tests/services/authService.test.ts

# Run tests with pattern
npm test -- --grep "register"

# Watch mode (re-run on file changes)
npm test -- --watch

# Run with coverage report
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Test Categories
```bash
# Unit tests only
npm test tests/services/ tests/models/

# Integration tests
npm test tests/integration/

# E2E tests
npm test tests/e2e/

# Performance tests
npm test tests/performance/

# Security tests
npm test tests/security/
```

### Debugging
```bash
# Run single test with verbose output
npm test tests/services/authService.test.ts -- --reporter=verbose

# Run with Node debugger
node --inspect-brk node_modules/.bin/vitest run

# Run tests with increased timeout
npm test -- --testTimeout=30000
```

## Frontend Testing

### Basic Commands
```bash
cd client

# Run all tests
npm test

# Run with UI interface
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

## CI/CD Testing

### GitHub Actions
Tests run automatically on:
- Push to main or develop branches
- Pull requests to main or develop
- Manual workflow dispatch

### Local CI Simulation
```bash
# Backend tests (as CI runs them)
cd server
npm ci
cp .env.test .env
npm run test:coverage

# Frontend tests (as CI runs them)
cd client
npm ci
npm run test:coverage

# Lint and type check
cd server && npm run lint && npm run type-check
cd client && npm run lint && npm run type-check
```

## Coverage Analysis

### Generate and View Coverage
```bash
cd server
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

### Check Coverage Thresholds
```bash
# Backend (requires jq)
cd server
npm run test:coverage
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
echo "Coverage: $COVERAGE%"

# Frontend
cd client
npm run test:coverage
COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
echo "Coverage: $COVERAGE%"
```

## Database Management for Tests

### Setup Test Database (one-time)
```bash
# Connect to PostgreSQL
psql -U browseros_user -d postgres

# Create test database
CREATE DATABASE browseros_test;

# Exit
\q
```

### Reset Test Database
Test database is automatically reset between tests by the test framework.

Manual reset:
```bash
cd server
npm test tests/utils/testDb.test.ts
```

### Clean Test Database
```bash
psql -U browseros_user -d browseros_test -c "
  DROP TABLE IF EXISTS sessions CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
"
```

## Common Test Scenarios

### Test New Feature
```bash
# 1. Write test first (TDD)
touch server/tests/services/newFeature.test.ts

# 2. Run test (should fail)
npm test tests/services/newFeature.test.ts

# 3. Implement feature
# ... code implementation ...

# 4. Run test again (should pass)
npm test tests/services/newFeature.test.ts

# 5. Verify coverage
npm run test:coverage
```

### Debug Failing Test
```bash
# Run only failing test with verbose output
npm test failing.test.ts -- --reporter=verbose

# Add console.log or debugger in test
# Re-run test

# Check test database state
# Add queries in test to inspect data
```

### Benchmark Performance
```bash
# Run performance tests
cd server
npm test tests/performance/

# Compare results over time
# Save output to file
npm test tests/performance/ > perf-results.txt
```

### Security Audit
```bash
# Run security tests
npm test tests/security/

# Run npm audit
npm audit

# Check for known vulnerabilities
npm audit --audit-level=moderate
```

## Test Maintenance

### Update Test Snapshots
```bash
# If tests use snapshots (future)
npm test -- -u
```

### Clear Test Cache
```bash
# Clear Vitest cache
rm -rf node_modules/.vitest

# Reinstall dependencies
npm ci
```

### Update Test Dependencies
```bash
# Update test-related packages
npm update vitest @vitest/coverage-v8 @testing-library/react

# Check for outdated packages
npm outdated
```

## Tips and Tricks

### Filter Tests by Name
```bash
# Run tests with "register" in name
npm test -- --grep register

# Run tests with "User" in describe block
npm test -- --grep "User Model"
```

### Run Tests in Parallel
```bash
# Vitest runs tests in parallel by default
# To run sequentially:
npm test -- --poolOptions.threads.singleThread=true
```

### Skip Tests Temporarily
```typescript
// In test file
it.skip('test to skip', () => {
  // This test won't run
});

describe.skip('Suite to skip', () => {
  // These tests won't run
});
```

### Run Only Specific Tests
```typescript
// In test file
it.only('only this test', () => {
  // Only this test will run
});

describe.only('Only this suite', () => {
  // Only this suite will run
});
```

### Watch Mode with UI
```bash
cd client
npm run test:ui
# Opens browser with interactive test UI
```

## Environment Variables

### Backend Test Environment
```bash
# File: server/.env.test
NODE_ENV=test
PORT=5001
DATABASE_URL=postgresql://browseros_user:browseros_dev_password@localhost:5432/browseros_test
REDIS_URL=redis://:browseros_redis_password@localhost:6379/1
JWT_SECRET=test_jwt_secret_for_testing_only
JWT_REFRESH_SECRET=test_jwt_refresh_secret_for_testing_only
```

### Override Environment Variables
```bash
# Temporarily override for single test run
DATABASE_URL=postgresql://localhost:5432/custom_test_db npm test
```

## Troubleshooting

### "Cannot find module" errors
```bash
# Rebuild dependencies
rm -rf node_modules
npm install
```

### "Port already in use" errors
```bash
# Kill process on port 5001
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5001 | xargs kill -9
```

### "Database connection refused"
```bash
# Check PostgreSQL is running
# Windows: Services app
# macOS: brew services list
# Linux: systemctl status postgresql

# Start PostgreSQL
# Windows: Start service from Services app
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Test timeout errors
```bash
# Increase timeout
npm test -- --testTimeout=30000

# Or in test file
it('slow test', async () => {
  // test code
}, 30000); // 30 second timeout
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests |
| `npm test -- --watch` | Watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm test <file>` | Run specific file |
| `npm test -- --grep <pattern>` | Filter by pattern |
| `npm run test:ui` | Open test UI (frontend) |

---

For comprehensive testing guide, see `docs/TESTING_GUIDE.md`
