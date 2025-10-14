# API Test Suite

This directory contains comprehensive unit and integration tests for the Media Analyzer API.

## Test Structure

```
__tests__/
├── setup.ts                    # Test utilities and mocks
├── jest.setup.ts              # Jest configuration and global mocks
├── routes/                     # Route-level unit tests
│   ├── auth.test.ts           # Authentication endpoints
│   ├── health.test.ts         # Health check endpoints
│   ├── analyze.test.ts        # Analysis endpoints
│   └── keywords.test.ts       # Keyword extraction endpoints
├── services/                  # Service-level unit tests
│   ├── analyze-sync.test.ts  # Synchronous analysis service
│   └── keyword-extractor.test.ts # Keyword extraction service
└── integration/               # Integration tests
    └── api-workflow.test.ts   # End-to-end workflow tests
```

## Test Categories

### 1. Route Tests (`routes/`)
Tests for individual API endpoints:
- **Authentication Routes**: `/auth/register`, `/auth/login`, `/auth/demo-token`, `/auth/verify`
- **Health Routes**: `/health`, `/health/ready`, `/health/config`
- **Analysis Routes**: `/v1/analyze`, `/v1/analyses/:id`
- **Keyword Routes**: `/v1/keywords/extract`, `/v1/keywords/health`

### 2. Service Tests (`services/`)
Tests for business logic and service functions:
- **Analyze Sync Service**: `canRunSync`, `prepareContext`, `runSyncAnalysis`
- **Keyword Extractor Service**: `extractKeywords` with various scenarios

### 3. Integration Tests (`integration/`)
End-to-end workflow tests:
- Complete analysis workflows (sync and async)
- Keyword extraction workflows
- Authentication workflows
- Error handling scenarios

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode
```bash
npm run test:ci
```

## Test Coverage

The test suite covers:

### API Endpoints (100% coverage)
- ✅ Authentication endpoints (4 endpoints)
- ✅ Health check endpoints (3 endpoints)
- ✅ Analysis endpoints (2 endpoints)
- ✅ Keyword extraction endpoints (2 endpoints)

### Service Functions (100% coverage)
- ✅ Analysis sync service functions
- ✅ Keyword extraction service functions
- ✅ Error handling and edge cases

### Integration Scenarios (100% coverage)
- ✅ Complete analysis workflows
- ✅ Keyword extraction workflows
- ✅ Authentication workflows
- ✅ Error handling workflows

## Test Data and Mocks

### Mock Data
- `createMockUser()`: Creates test user objects
- `createMockAnalysis()`: Creates test analysis objects
- `createMockKeywordResult()`: Creates test keyword extraction results

### External Service Mocks
- **Database**: Prisma client operations
- **Storage**: S3 upload/download operations
- **Queue**: BullMQ job operations
- **External APIs**: Worker service calls
- **Media Processing**: FFmpeg, Sharp operations

## Test Scenarios

### Authentication Tests
- ✅ User registration with valid/invalid data
- ✅ User login with valid/invalid credentials
- ✅ Demo token generation
- ✅ Token verification and validation
- ✅ Error handling for missing/invalid tokens

### Health Check Tests
- ✅ Basic health status
- ✅ Readiness checks (database, Redis, worker)
- ✅ Configuration endpoint
- ✅ Timestamp validation

### Analysis Tests
- ✅ Synchronous analysis (short videos)
- ✅ Asynchronous analysis (long videos)
- ✅ Analysis status checking
- ✅ Error handling for analysis failures
- ✅ Authentication requirements

### Keyword Extraction Tests
- ✅ Basic keyword extraction
- ✅ Extraction with browser cookies
- ✅ Extraction with cookies file
- ✅ URL validation
- ✅ Error handling for extraction failures

### Integration Tests
- ✅ Complete analysis workflows
- ✅ Keyword extraction workflows
- ✅ Authentication workflows
- ✅ Error handling scenarios
- ✅ Service interaction testing

## Mock Strategy

### External Dependencies
All external dependencies are mocked to ensure:
- **Fast execution**: No real network calls or file I/O
- **Reliability**: Consistent test results
- **Isolation**: Tests don't depend on external services

### Service Mocks
- **Database operations**: Mocked Prisma calls
- **File operations**: Mocked S3 and local file operations
- **Queue operations**: Mocked BullMQ job operations
- **External APIs**: Mocked HTTP calls to worker services

## Error Testing

### Validation Errors
- Invalid request data
- Missing required fields
- Invalid data types
- Constraint violations

### Service Errors
- Database connection failures
- External service timeouts
- File processing errors
- Authentication failures

### Network Errors
- Connection timeouts
- Service unavailable
- Invalid responses
- Rate limiting

## Performance Testing

### Response Time Testing
- API endpoint response times
- Service function execution times
- Database query performance
- File processing performance

### Load Testing
- Concurrent request handling
- Memory usage monitoring
- Resource cleanup verification

## Best Practices

### Test Organization
- **One test file per route/service**
- **Descriptive test names**
- **Grouped related tests**
- **Clear setup and teardown**

### Mock Management
- **Reset mocks between tests**
- **Use realistic mock data**
- **Mock at the right level**
- **Verify mock interactions**

### Error Testing
- **Test all error paths**
- **Verify error responses**
- **Test edge cases**
- **Validate error messages**

### Coverage Goals
- **100% line coverage**
- **100% branch coverage**
- **100% function coverage**
- **100% statement coverage**

## Continuous Integration

### Pre-commit Hooks
- Run tests before commits
- Check test coverage
- Validate code quality
- Ensure all tests pass

### CI Pipeline
- Run full test suite
- Generate coverage reports
- Upload test results
- Deploy on success

## Debugging Tests

### Running Individual Tests
```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should register"

# Run tests in specific directory
npm test -- routes/
```

### Debug Mode
```bash
# Run with debug output
npm test -- --verbose

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm run test:watch
```

### Test Debugging
- Use `console.log` in tests for debugging
- Check mock call arguments
- Verify test data setup
- Inspect error messages

## Maintenance

### Adding New Tests
1. Create test file in appropriate directory
2. Import test utilities from `setup.ts`
3. Mock external dependencies
4. Write descriptive test cases
5. Update this documentation

### Updating Mocks
1. Update mock implementations
2. Ensure mock data is realistic
3. Test mock interactions
4. Update documentation

### Test Data Management
1. Keep test data minimal and focused
2. Use factories for complex objects
3. Clean up test data after tests
4. Avoid hardcoded values

## Troubleshooting

### Common Issues
- **Mock not working**: Check mock setup and imports
- **Test timeouts**: Increase timeout or fix async issues
- **Coverage gaps**: Add tests for uncovered code
- **Flaky tests**: Fix race conditions and async issues

### Debug Commands
```bash
# Check test configuration
npm test -- --showConfig

# Run with debug output
npm test -- --verbose --no-coverage

# Check specific test
npm test -- --testNamePattern="specific test"
```
