# Python Worker Service Test Suite

This directory contains comprehensive tests for the Python worker service that handles media analysis tasks including ASR (Automatic Speech Recognition), OCR (Optical Character Recognition), and Instagram video downloads.

## Test Structure

```
tests/
├── conftest.py                    # Test configuration and fixtures
├── unit/                          # Unit tests
│   ├── test_main.py              # Tests for FastAPI endpoints
│   ├── test_instagram_downloader.py  # Tests for Instagram downloader
│   ├── test_audio_preprocessing.py   # Tests for audio preprocessing
│   ├── test_text_postprocessing.py  # Tests for text post-processing
│   └── test_language_config.py   # Tests for language configuration
├── integration/                   # Integration tests
│   ├── test_api_integration.py   # End-to-end API workflows
│   └── test_multilingual_workflows.py  # Multilingual workflow tests
├── fixtures/                      # Test data fixtures
├── run_multilingual_tests.py     # Test runner for multilingual features
└── README.md                     # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)

#### `test_main.py`
Tests for the main FastAPI application endpoints:

- **Health Endpoint**: `/health` - Service health checks
- **ASR Endpoint**: `/asr` - Speech-to-text transcription
- **OCR Endpoint**: `/ocr` - Optical character recognition
- **Instagram Download**: `/download-instagram` - Instagram Reel downloads

**Key Test Scenarios:**
- ✅ Successful processing with valid inputs
- ✅ Error handling for invalid inputs
- ✅ File upload validation
- ✅ Response structure validation
- ✅ Timing accuracy
- ✅ Language parameter handling
- ✅ Cookie options for Instagram downloads

#### `test_instagram_downloader.py`
Tests for the Instagram downloader module:

- **Initialization**: Browser cookies, cookies file, no cookies
- **URL Processing**: Reel ID extraction from various URL formats
- **Download Process**: Successful downloads, error handling
- **Metadata Extraction**: Caption, username, duration, etc.
- **File Management**: Temporary directory cleanup
- **Edge Cases**: Empty metadata, missing formats, network errors

#### `test_audio_preprocessing.py` ⭐ NEW
Tests for the audio preprocessing module:

- **Main Preprocessing**: All preprocessing levels (minimal, standard, aggressive)
- **Audio Processing**: Normalization, DC offset removal, noise reduction
- **Filtering**: High-pass, bandpass, and language-specific filters
- **Quality Assessment**: Audio quality metrics and validation
- **Error Handling**: Processing errors and fallback behavior
- **Performance**: Large audio data and memory management

#### `test_text_postprocessing.py` ⭐ NEW
Tests for the text post-processing module:

- **General Processing**: Filler word removal, repetition removal, error correction
- **Language-Specific Processing**: Language-aware text cleaning
- **Aggressive Cleaning**: Advanced text cleaning rules
- **Quality Validation**: Post-processing quality assessment
- **Error Handling**: Processing errors and fallback behavior
- **Edge Cases**: Empty text, special characters, large text

#### `test_language_config.py` ⭐ NEW
Tests for the language configuration module:

- **Whisper Parameters**: Language-specific Whisper configuration
- **Frequency Ranges**: Language-specific audio frequency ranges
- **Post-processing Rules**: Language-specific text cleaning rules
- **Supported Languages**: Language support validation
- **Data Consistency**: Configuration data integrity
- **Edge Cases**: Unsupported languages, invalid inputs

### Integration Tests (`tests/integration/`)

#### `test_api_integration.py`
End-to-end API workflow tests:

- **Complete Workflows**: ASR, OCR, Instagram download workflows

#### `test_multilingual_workflows.py` ⭐ NEW
Multilingual ASR workflow tests:

- **Complete Multilingual Workflows**: Hindi, Spanish, Chinese, Tamil workflows
- **Error Handling**: Language-specific error scenarios
- **Performance Testing**: Multilingual processing timing
- **Configuration Testing**: Environment variables and parameter overrides
- **Model Caching**: Whisper model caching for multilingual requests
- **Error Handling**: Network errors, processing failures
- **Concurrent Requests**: Multiple simultaneous requests
- **Performance**: Timing accuracy, response times
- **Data Validation**: Input validation, response structure
- **Resource Cleanup**: Temporary file management

## Test Fixtures

### Audio Fixtures
- `sample_audio_file`: Generated WAV file with sine wave
- `asr_test_data`: Expected ASR response structure

### Image Fixtures
- `sample_image_file`: Generated PNG image with text patterns
- `ocr_test_data`: Expected OCR response structure

### Instagram Fixtures
- `sample_instagram_url`: Test Instagram Reel URL
- `sample_instagram_response`: Expected download response
- `mock_instagram_downloader`: Mocked downloader with test data

### Service Fixtures
- `mock_whisper_model`: Mocked Whisper ASR model
- `mock_pytesseract`: Mocked Tesseract OCR engine
- `client`: FastAPI test client

## Running Tests

### Prerequisites
```bash
# Install dependencies
pip install -r requirements.txt

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx pytest-mock
```

### Test Commands

```bash
# Run all tests
npm test
# or
pytest

# Run unit tests only
npm run test:unit
# or
pytest tests/unit -v

# Run integration tests only
npm run test:integration
# or
pytest tests/integration -v

# Run with coverage
npm run test:coverage
# or
pytest --cov=. --cov-report=html --cov-report=term-missing

# Run specific test file
pytest tests/unit/test_main.py -v

# Run specific test
pytest tests/unit/test_main.py::TestASREndpoint::test_asr_success -v

# Run with watch mode (auto-rerun on changes)
npm run test:watch
# or
pytest --watch
```

### CI/CD Testing
```bash
# Run tests for CI/CD pipeline
npm run test:ci
# or
pytest --cov=. --cov-report=xml --junitxml=test-results.xml
```

## Test Configuration

### pytest.ini
- **Test Discovery**: Automatic test discovery in `tests/` directory
- **Coverage**: HTML and terminal coverage reports
- **Async Support**: Automatic async test handling
- **Markers**: Unit, integration, and slow test markers

### Coverage Configuration
- **Exclusions**: Test files, virtual environment, cache files
- **Reports**: HTML (detailed), terminal (summary), XML (CI/CD)

## Mock Strategy

### External Dependencies
- **Whisper Model**: Mocked to avoid loading large ML models
- **Tesseract OCR**: Mocked to avoid system dependencies
- **yt-dlp**: Mocked for Instagram downloads
- **File I/O**: In-memory file handling for tests

### Service Isolation
- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test complete workflows with mocked external services
- **Fixtures**: Reusable test data and setup

## Test Data

### Audio Test Data
- Generated sine wave audio files
- Multiple formats (WAV, MP3)
- Various durations and sample rates

### Image Test Data
- Generated test images with text patterns
- Multiple formats (PNG, JPEG)
- Various sizes and color depths

### Instagram Test Data
- Sample Instagram Reel URLs
- Mock metadata (captions, usernames, durations)
- Various cookie configurations

## Performance Testing

### Timing Validation
- ASR processing time accuracy
- OCR processing time accuracy
- Request/response timing validation

### Concurrent Testing
- Multiple simultaneous ASR requests
- Multiple simultaneous OCR requests
- Resource cleanup under load

## Error Scenarios

### Input Validation
- Invalid file formats
- Missing required parameters
- Malformed URLs
- Empty file uploads

### Processing Errors
- Whisper model failures
- Tesseract OCR failures
- Instagram download failures
- Network connectivity issues

### Resource Management
- Temporary file cleanup
- Memory usage optimization
- Concurrent request handling

## Running Tests

### Basic Test Execution
```bash
# Run all tests
pytest tests/

# Run unit tests only
pytest tests/unit/

# Run integration tests only
pytest tests/integration/

# Run with verbose output
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=main --cov-report=html
```

### Multilingual Test Execution ⭐ NEW
```bash
# Run all multilingual tests
python tests/run_multilingual_tests.py

# Run with coverage
python tests/run_multilingual_tests.py coverage

# Run tests for specific language
python tests/run_multilingual_tests.py language hi

# Run specific test categories
pytest tests/unit/test_audio_preprocessing.py -v
pytest tests/unit/test_text_postprocessing.py -v
pytest tests/unit/test_language_config.py -v
pytest tests/integration/test_multilingual_workflows.py -v
```

### Enhanced Test Categories
```bash
# Test audio preprocessing
pytest tests/unit/test_audio_preprocessing.py -v

# Test text post-processing
pytest tests/unit/test_text_postprocessing.py -v

# Test language configuration
pytest tests/unit/test_language_config.py -v

# Test multilingual ASR endpoints
pytest tests/unit/test_main.py::TestMultilingualASR -v

# Test enhanced ASR features
pytest tests/unit/test_main.py::TestEnhancedASRFeatures -v

# Test multilingual workflows
pytest tests/integration/test_multilingual_workflows.py -v
```

## Best Practices

### Test Organization
- **Single Responsibility**: Each test focuses on one scenario
- **Descriptive Names**: Clear test method names
- **Setup/Teardown**: Proper fixture usage
- **Isolation**: Tests don't depend on each other

### Mock Usage
- **Minimal Mocking**: Only mock external dependencies
- **Realistic Data**: Use realistic test data
- **Error Simulation**: Test error conditions
- **Performance**: Avoid slow external calls

### Coverage Goals
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: Critical workflow coverage
- **Error Handling**: All error paths tested
- **Edge Cases**: Boundary conditions covered

## Continuous Integration

### GitHub Actions
```yaml
- name: Run Python Tests
  run: |
    cd apps/worker-python
    npm run test:ci
```

### Test Reports
- **Coverage**: HTML reports in `htmlcov/` directory
- **JUnit**: XML reports for CI/CD integration
- **Terminal**: Detailed test output with timing

## Troubleshooting

### Common Issues
1. **Import Errors**: Ensure all dependencies are installed
2. **Mock Failures**: Check mock setup and return values
3. **File Permissions**: Ensure write access to temp directories
4. **Memory Issues**: Large test datasets may cause memory issues

### Debug Mode
```bash
# Run with verbose output
pytest -v -s

# Run specific test with debugging
pytest tests/unit/test_main.py::TestASREndpoint::test_asr_success -v -s

# Run with coverage and debugging
pytest --cov=. --cov-report=html -v -s
```

## Contributing

### Adding New Tests
1. **Unit Tests**: Add to appropriate `test_*.py` file
2. **Integration Tests**: Add to `test_api_integration.py`
3. **Fixtures**: Add to `conftest.py` if reusable
4. **Documentation**: Update this README

### Test Standards
- **Naming**: Use descriptive test method names
- **Documentation**: Add docstrings for complex tests
- **Coverage**: Ensure new code is tested
- **Performance**: Keep tests fast and reliable
