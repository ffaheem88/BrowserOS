# BrowserOS Testing Guide

## Table of Contents
- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Categories](#test-categories)
- [Best Practices](#best-practices)
- [Coverage Requirements](#coverage-requirements)
- [Troubleshooting](#troubleshooting)

## Overview

BrowserOS uses a comprehensive testing strategy that includes:
- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test API endpoints and service interactions
- **E2E Tests**: Test complete user flows
- **Performance Tests**: Measure and benchmark operation speed
- **Security Tests**: Verify authentication and authorization security

### Testing Frameworks
- **Backend**: Vitest + PostgreSQL test database
- **Frontend**: Vitest + React Testing Library + jsdom
- **Coverage**: V8 coverage provider
- **CI/CD**: GitHub Actions

## Test Infrastructure

### Backend Test Setup

#### Configuration Files
- `server/vitest.config.ts` - Vitest configuration
- `server/.env.test` - Test environment variables
- `server/tests/setup.ts` - Global test setup

#### Test Database
Tests use a separate PostgreSQL database (`browseros_test`) that is:
- Automatically created before test suite
- Reset after each test
- Cleaned up after all tests

#### Test Utilities
- `server/tests/utils/testDb.ts` - Database utilities
- `server/tests/factories/` - Test data factories
- `server/tests/helpers/` - Helper functions

### Frontend Test Setup

#### Configuration Files
- `client/vitest.config.ts` - Vitest configuration
- `client/tests/setup.ts` - Global test setup with jsdom

## Running Tests

### Backend Tests

```bash
# Run all tests
cd server
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/services/authService.test.ts

# Run tests matching pattern
npm test -- --grep "register"
```

### Frontend Tests

```bash
# Run all tests
cd client
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### All Tests with Coverage Check

```bash
# From project root
npm run test:all  # If script is configured
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createUser } from '../factories/userFactory';

describe('AuthService', () => {
  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        displayName: 'Test User',
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/index';

describe('POST /api/v1/auth/register', () => {
  it('should return 201 and user data', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        displayName: 'New User',
      })
      .expect(201);

    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

### Using Test Factories

```typescript
import { createUser } from '../factories/userFactory';
import { createSession } from '../factories/sessionFactory';

// Create a user with defaults
const user = await createUser();

// Create a user with overrides
const customUser = await createUser({
  email: 'custom@example.com',
  displayName: 'Custom User',
});

// Create a session for user
const session = await createSession(user.id);

// Create expired session
const expiredSession = await createSession(user.id, {
  expiresAt: new Date(Date.now() - 1000),
});
```

## Test Categories

### 1. Unit Tests

**Location**: `server/tests/services/`, `server/tests/models/`

**Purpose**: Test business logic in isolation

**Guidelines**:
- Mock external dependencies
- Test one function/method at a time
- Cover edge cases and error conditions
- Fast execution (< 100ms per test)

**Example**:
```typescript
describe('Password Validation', () => {
  it('should reject passwords shorter than 8 characters', () => {
    expect(validatePassword('Short1!')).toBe(false);
  });

  it('should require uppercase, lowercase, number, and special char', () => {
    expect(validatePassword('password')).toBe(false);
    expect(validatePassword('Password123!')).toBe(true);
  });
});
```

### 2. Integration Tests

**Location**: `server/tests/integration/`

**Purpose**: Test API endpoints with real database

**Guidelines**:
- Use test database
- Test complete request/response cycle
- Verify database state changes
- Test error responses

**Example**:
```typescript
describe('POST /api/v1/auth/login', () => {
  it('should return tokens for valid credentials', async () => {
    const user = await createUser({ password: 'TestPass123!' });

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: user.email,
        password: 'TestPass123!',
      })
      .expect(200);

    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

### 3. E2E Tests

**Location**: `server/tests/e2e/`

**Purpose**: Test complete user workflows

**Guidelines**:
- Test realistic user scenarios
- Verify full flow from start to finish
- Include error recovery
- Test multiple related operations

**Example**:
```typescript
it('should handle complete registration to logout flow', async () => {
  // 1. Register
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send(userData);

  // 2. Access protected resource
  await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${registerRes.body.data.accessToken}`);

  // 3. Logout
  await request(app)
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${registerRes.body.data.accessToken}`)
    .send({ refreshToken: registerRes.body.data.refreshToken });
});
```

### 4. Performance Tests

**Location**: `server/tests/performance/`

**Purpose**: Verify operations meet performance requirements

**Guidelines**:
- Measure execution time
- Test with realistic data volumes
- Verify scalability
- Check memory usage

**Example**:
```typescript
it('should hash password within 500ms', async () => {
  const start = Date.now();
  await bcrypt.hash('Password123!', 12);
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(500);
});
```

### 5. Security Tests

**Location**: `server/tests/security/`

**Purpose**: Verify security measures are in place

**Guidelines**:
- Test authentication/authorization
- Verify input validation
- Test for common vulnerabilities
- Verify encryption/hashing

**Example**:
```typescript
it('should prevent SQL injection in email lookup', async () => {
  const maliciousEmail = "' OR '1'='1";
  const result = await executeQuery(
    'SELECT * FROM users WHERE email = $1',
    [maliciousEmail]
  );

  expect(result.length).toBe(0);
});
```

## Best Practices

### Test Organization

```typescript
describe('Feature/Module', () => {
  describe('specific function/method', () => {
    it('should do X when Y happens', () => {
      // Arrange
      const input = setupTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx`
- Describe blocks: Use noun phrases ("AuthService", "User Model")
- Test cases: Use "should" statements ("should return user when email exists")

### AAA Pattern

Structure tests with Arrange, Act, Assert:

```typescript
it('should calculate total correctly', () => {
  // Arrange - Set up test data
  const items = [10, 20, 30];

  // Act - Execute the code under test
  const total = calculateTotal(items);

  // Assert - Verify the result
  expect(total).toBe(60);
});
```

### Test Independence

Each test should:
- Run independently
- Not depend on other tests
- Clean up after itself
- Use fresh test data

```typescript
// Bad - Tests depend on each other
let user;
it('should create user', () => {
  user = createUser();
});
it('should login user', () => {
  loginUser(user); // Depends on previous test
});

// Good - Each test is independent
it('should create user', async () => {
  const user = await createUser();
  expect(user).toBeDefined();
});

it('should login user', async () => {
  const user = await createUser();
  const result = await loginUser(user);
  expect(result).toBeDefined();
});
```

### Descriptive Assertions

```typescript
// Bad - Unclear what's being tested
expect(result).toBeTruthy();

// Good - Clear expectation
expect(user.email).toBe('test@example.com');
expect(response.status).toBe(200);
expect(tokens.accessToken).toBeDefined();
```

### Test Data Management

Use factories for consistent test data:

```typescript
// Create with defaults
const user = await createUser();

// Customize specific fields
const admin = await createUser({
  email: 'admin@example.com',
  role: 'admin',
});

// Create multiple
const users = await createUsers(10);
```

### Error Testing

Test both success and failure cases:

```typescript
describe('login', () => {
  it('should succeed with valid credentials', async () => {
    // Test success case
  });

  it('should fail with invalid password', async () => {
    await expect(
      authService.login({ email: 'test@test.com', password: 'wrong' })
    ).rejects.toThrow(/invalid.*credentials/i);
  });

  it('should fail with non-existent email', async () => {
    await expect(
      authService.login({ email: 'none@test.com', password: 'any' })
    ).rejects.toThrow();
  });
});
```

## Coverage Requirements

### Minimum Coverage Targets

- **Overall**: 80% coverage (lines, functions, branches, statements)
- **Critical Paths**: 90% coverage (authentication, authorization, data integrity)
- **Core Features**: 80% coverage
- **Supporting Features**: 70% coverage

### Viewing Coverage Reports

```bash
# Generate and view HTML coverage report
cd server
npm run test:coverage
open coverage/index.html  # macOS
start coverage/index.html  # Windows
xdg-open coverage/index.html  # Linux
```

### Coverage Metrics

- **Lines**: Percentage of executed lines
- **Functions**: Percentage of called functions
- **Branches**: Percentage of executed if/else branches
- **Statements**: Percentage of executed statements

### Improving Coverage

1. Identify uncovered code:
   ```bash
   npm run test:coverage
   ```

2. Review coverage report in `coverage/index.html`

3. Add tests for uncovered paths:
   - Error handling branches
   - Edge cases
   - Validation logic
   - Error recovery

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env.test`
- Verify test database exists

#### Test Timeouts

```
Error: Test timed out in 10000ms
```

**Solution**:
- Increase timeout in test file:
  ```typescript
  it('slow operation', async () => {
    // test code
  }, 20000); // 20 second timeout
  ```
- Check for hanging promises
- Ensure proper cleanup

#### Port Already in Use

```
Error: Port 5001 is already in use
```

**Solution**:
- Kill process using port
- Use different port in `.env.test`

#### Test Database State Issues

```
Error: duplicate key value violates unique constraint
```

**Solution**:
- Verify `resetDatabase()` is called in `afterEach`
- Check test isolation
- Ensure unique test data

### Debugging Tests

#### Run Single Test

```bash
npm test -- tests/services/authService.test.ts
```

#### Run with Debugging

```bash
# Add debugger statement in test
it('should work', () => {
  debugger;
  // test code
});

# Run with Node inspector
node --inspect-brk node_modules/.bin/vitest run
```

#### Verbose Output

```bash
npm test -- --reporter=verbose
```

## CI/CD Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Manual workflow dispatch

### GitHub Actions Workflow

See `.github/workflows/test.yml` for complete configuration.

**Includes**:
- Backend unit & integration tests
- Frontend component tests
- Linting (ESLint)
- Type checking (TypeScript)
- Coverage reporting
- Security scanning

### Required Checks

Pull requests must pass:
- All test suites
- Coverage thresholds (80%)
- Linting
- Type checking
- Security audit

## Contributing

When contributing tests:

1. Follow existing test structure and patterns
2. Maintain or improve coverage
3. Write descriptive test names
4. Include both happy path and error cases
5. Add comments for complex test logic
6. Update documentation if adding new test types

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [PostgreSQL Testing Best Practices](https://www.postgresql.org/docs/current/regress.html)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

## Questions?

Contact the QA team or open an issue in the repository.
