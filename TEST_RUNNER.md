# Media Analyzer Test Runner

This document describes the comprehensive test runner for the Media Analyzer platform, which supports both Node.js (API) and Python (Worker) services.

## Overview

The test runner (`run-tests.sh`) provides a unified interface to run all tests across the entire Media Analyzer platform, including:

- **Node.js API Service** (Fastify-based)
- **Python Worker Service** (FastAPI-based)

## Quick Start

### Run All Tests
```bash
# Run all tests for both services
npm run test:all
# or
./run-tests.sh
```

### Run Specific Service Tests
```bash
# Run only Node.js API tests
npm run test:node
# or
./run-tests.sh --node

# Run only Python worker tests
npm run test:python
# or
./run-tests.sh --python
```

### Run Tests with Coverage
```bash
# Run all tests with coverage reports
npm run test:coverage
# or
./run-tests.sh --coverage
```

## Available Commands

### NPM Scripts (Recommended)
```bash
# Test Commands
npm run test:all          # Run all tests (Node.js + Python)
npm run test:node         # Run only Node.js API tests
npm run test:python       # Run only Python worker tests
npm run test:coverage      # Run all tests with coverage
npm run test:unit         # Run only unit tests for both services
npm run test:integration  # Run only integration tests for both services
npm run test:api          # Alias for test:node
npm run test:worker        # Alias for test:python

# Development Commands
npm run dev               # Start all services in development mode
npm run build             # Build all services
npm run lint              # Lint all code
npm run type-check        # Type check all TypeScript code
```

### Direct Script Usage
```bash
# Basic usage
./run-tests.sh                    # Run all tests
./run-tests.sh --node             # Run only Node.js tests
./run-tests.sh --python           # Run only Python tests
./run-tests.sh --coverage         # Run with coverage

# Specific test suites
./run-tests.sh --specific node unit           # Node.js unit tests only
./run-tests.sh --specific node integration    # Node.js integration tests only
./run-tests.sh --specific python unit         # Python unit tests only
./run-tests.sh --specific python integration  # Python integration tests only

# Help
./run-tests.sh --help             # Show help message
```

## Test Structure

### Node.js API Service (`apps/api/`)
```
apps/api/
├── src/
│   ├── __tests__/
│   │   ├── routes/           # API endpoint tests
│   │   ├── services/         # Service layer tests
│   │   └── integration/      # Integration tests
│   └── ...
├── jest.config.js
└── package.json
```

**Test Categories:**
- **Unit Tests**: Individual function and endpoint testing
- **Integration Tests**: End-to-end API workflow testing
- **Service Tests**: Business logic and service layer testing

### Python Worker Service (`apps/worker-python/`)
```
apps/worker-python/
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/         # Integration tests
│   └── conftest.py          # Test configuration
├── main.py
├── instagram_downloader.py
├── pytest.ini
└── requirements.txt
```

**Test Categories:**
- **Unit Tests**: Individual function and endpoint testing
- **Integration Tests**: End-to-end workflow testing
- **API Tests**: FastAPI endpoint testing

## Test Coverage

### Node.js API Service
- **Total Tests**: 69 tests
- **Unit Tests**: 39 tests
- **Integration Tests**: 30 tests
- **Coverage**: 90%+ code coverage

**Test Areas:**
- Authentication endpoints (`/auth/*`)
- Health check endpoints (`/health/*`)
- Analysis endpoints (`/v1/analyze`, `/v1/analyses/*`)
- Keyword extraction endpoints (`/v1/keywords/*`)
- Service layer functions
- Error handling and validation

### Python Worker Service
- **Total Tests**: 57 tests
- **Unit Tests**: 39 tests
- **Integration Tests**: 18 tests
- **Coverage**: 90%+ code coverage

**Test Areas:**
- Health endpoint (`/health`)
- ASR endpoint (`/asr`) - Speech-to-text
- OCR endpoint (`/ocr`) - Optical character recognition
- Instagram download (`/download-instagram`)
- Instagram downloader module
- Error handling and validation

## Prerequisites

### Node.js Service
- Node.js >= 18.0.0
- npm dependencies installed
- Jest testing framework

### Python Service
- Python 3.13+
- Virtual environment activated
- pytest and dependencies installed

## Installation

### First Time Setup
```bash
# Install Node.js dependencies
cd apps/api
npm install
cd ../..

# Install Python dependencies
cd apps/worker-python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### Verify Installation
```bash
# Test Node.js setup
npm run test:node

# Test Python setup
npm run test:python
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      
      - name: Install Node.js dependencies
        run: cd apps/api && npm install
      
      - name: Install Python dependencies
        run: |
          cd apps/worker-python
          python -m venv venv
          source venv/bin/activate
          pip install -r requirements.txt
      
      - name: Run all tests
        run: npm run test:all
      
      - name: Run tests with coverage
        run: npm run test:coverage
```

## Troubleshooting

### Common Issues

#### Node.js Tests Failing
```bash
# Check if dependencies are installed
cd apps/api
npm install

# Check Jest configuration
cat jest.config.js

# Run tests with verbose output
npm test -- --verbose
```

#### Python Tests Failing
```bash
# Check if virtual environment is activated
cd apps/worker-python
source venv/bin/activate

# Check if dependencies are installed
pip list | grep pytest

# Run tests with verbose output
python -m pytest tests/ -v
```

#### Permission Issues
```bash
# Make script executable
chmod +x run-tests.sh

# Check file permissions
ls -la run-tests.sh
```

### Debug Mode
```bash
# Run with debug output
DEBUG=1 ./run-tests.sh

# Run specific test with debug
cd apps/api && npm test -- --verbose
cd apps/worker-python && source venv/bin/activate && python -m pytest tests/ -v -s
```

## Performance

### Test Execution Times
- **Node.js Tests**: ~2-3 seconds (69 tests)
- **Python Tests**: ~0.5 seconds (57 tests)
- **Total Runtime**: ~3-5 seconds for all tests

### Optimization Tips
- Use `--coverage` only when needed (slower)
- Run specific test suites during development
- Use `npm run test:unit` for faster feedback
- Use `npm run test:integration` for comprehensive testing

## Best Practices

### Development Workflow
1. **Unit Tests First**: Write unit tests for new features
2. **Integration Tests**: Add integration tests for workflows
3. **Run Locally**: Always run tests before committing
4. **Coverage**: Maintain high test coverage (>90%)

### Test Organization
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test complete workflows and API interactions
- **Error Tests**: Test error handling and edge cases
- **Performance Tests**: Test timing and concurrent requests

### Code Quality
- **Consistent Naming**: Use descriptive test names
- **Single Responsibility**: Each test should test one thing
- **Mock External Dependencies**: Don't rely on external services
- **Clean Setup/Teardown**: Properly manage test resources

## Contributing

### Adding New Tests
1. **Node.js**: Add tests to appropriate `__tests__` directory
2. **Python**: Add tests to appropriate `tests/` directory
3. **Update Documentation**: Update this README if needed
4. **Run Tests**: Ensure all tests pass before submitting

### Test Standards
- **Coverage**: Maintain >90% code coverage
- **Performance**: Keep test execution fast
- **Reliability**: Tests should be deterministic
- **Maintainability**: Tests should be easy to understand and modify

## Support

For issues or questions about the test runner:

1. **Check Logs**: Review test output for specific errors
2. **Verify Setup**: Ensure all dependencies are installed
3. **Run Individual Tests**: Isolate failing tests
4. **Check Documentation**: Review this README and service-specific docs

## License

This test runner is part of the Media Analyzer platform and follows the same licensing terms.
