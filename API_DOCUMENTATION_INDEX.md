# Media Analyzer API - Documentation Index

## 📚 Overview

Welcome to the Media Analyzer API documentation! This comprehensive guide covers all aspects of the API, from authentication to advanced features.

## 🎯 Quick Start

### 1. View Interactive Documentation

**Recommended: Use Swagger UI**
```bash
./serve-swagger.sh
```

Then visit `http://localhost:8080` for interactive API documentation.

### 2. Get Started with the API

```bash
# Get a demo token
curl -X POST http://localhost:3000/auth/demo-token

# Use the token for API calls
curl -X GET http://localhost:3000/health \
  -H "Authorization: Bearer <your-token>"
```

## 📋 Documentation Files

### Main Documentation

| File | Description | Use Case |
|------|-------------|----------|
| **`openapi.yaml`** | Complete OpenAPI 3.0 specification | Primary API reference, client generation |
| **`SWAGGER_DOCUMENTATION.md`** | Swagger/OpenAPI usage guide | Learn how to use the OpenAPI spec |
| **`README.md`** | Project overview and setup | Getting started with the project |

### Specialized Guides

| File | Description |
|------|-------------|
| `KEYWORD_EXTRACTION_API.md` | Detailed keyword extraction guide |
| `INSTAGRAM_COOKIES_GUIDE.md` | Instagram authentication setup |
| `POSTMAN_COLLECTION_GUIDE.md` | Postman collection usage |
| `NER_IMPLEMENTATION_SUMMARY.md` | Named Entity Recognition details |
| `TEST_RUNNER.md` | Testing documentation |

### API Collections

| File | Description |
|------|-------------|
| `postman-collection.json` | Postman collection v1 |
| `postman-collection-v2.json` | Enhanced Postman collection v2 |

## 🚀 API Overview

### Base URLs

- **Main API**: `http://localhost:3000`
- **Python Worker**: `http://localhost:8000`

### API Sections

#### 1. Authentication (`/auth`)
Manage user authentication and JWT tokens.

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/demo-token` - Get demo token
- `GET /auth/verify` - Verify JWT token

**Quick Example:**
```bash
# Get demo token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/demo-token | jq -r '.token')

# Use token
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/health
```

#### 2. Health Checks (`/health`)
System health monitoring and configuration.

**Endpoints:**
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check
- `GET /health/config` - Configuration info

#### 3. Content Analysis (`/v1`)
Comprehensive content analysis for compliance and brand safety.

**Endpoints:**
- `POST /v1/analyze` - Analyze content (sync/async)
- `GET /v1/analyses/:id` - Get analysis status

**Features:**
- Brand compliance checking
- Risk and vibe scoring
- Flag detection (disclosures, claims, safety)
- Evidence collection (screenshots, transcripts, OCR)

#### 4. Keyword Extraction (`/v1/keywords`)
Extract keywords and semantic information from content.

**Endpoints:**
- `POST /v1/keywords/extract` - Basic keyword extraction
- `POST /v1/keywords/extract-enhanced` - Advanced extraction with NLP
- `GET /v1/keywords/health` - Service health

**Features:**
- Primary/secondary keywords
- Hashtags and mentions
- Topic categorization
- Sentiment analysis
- Intent detection
- Entity extraction

#### 5. Python Worker - Media Processing
Core media processing capabilities.

**Endpoints:**
- `POST /asr` - Speech-to-text (Whisper)
- `POST /ocr` - Text extraction from images
- `POST /download-instagram` - Instagram Reel downloader

**Features:**
- Multilingual ASR (English, Hindi, Hinglish)
- Audio preprocessing
- Text post-processing
- Cookie-based Instagram access

#### 6. Python Worker - NLP
Natural Language Processing capabilities.

**Endpoints:**
- `POST /ner` - Named Entity Recognition
- `POST /semantic-similarity` - Semantic keyword clustering

**Features:**
- ML-based entity extraction
- Multilingual support
- Semantic embeddings
- Keyword clustering

## 🔧 Tools and Scripts

### Swagger/OpenAPI Tools

| Script | Purpose | Usage |
|--------|---------|-------|
| `./serve-swagger.sh` | Run Swagger UI locally | `./serve-swagger.sh` |
| `./validate-openapi.sh` | Validate OpenAPI spec | `./validate-openapi.sh` |

### Testing Scripts

| Script | Purpose |
|--------|---------|
| `./test-api.sh` | Test main API endpoints |
| `./test-keywords-api.sh` | Test keyword extraction |
| `./run-tests.sh` | Run full test suite |

### Setup Scripts

| Script | Purpose |
|--------|---------|
| `./import-postman-collection.sh` | Import Postman collection |

## 📖 How to Use This Documentation

### For Developers

1. **Start Here**: Read `README.md` for project setup
2. **API Reference**: Use `openapi.yaml` in Swagger UI for complete API reference
3. **Integration**: Import `openapi.yaml` to Postman or generate API clients
4. **Advanced Features**: Refer to specialized guides for specific features

### For Testers

1. **Postman**: Import `postman-collection-v2.json` for pre-configured requests
2. **Manual Testing**: Use Swagger UI for interactive testing
3. **Automated Testing**: See `TEST_RUNNER.md` for test automation

### For Product Managers

1. **API Capabilities**: Review `openapi.yaml` in Swagger UI for feature overview
2. **Use Cases**: See specialized guides for specific use cases
3. **Examples**: Check Postman collections for real-world examples

## 🎨 Example Workflows

### Workflow 1: Basic Content Analysis

```bash
# 1. Get authentication token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/demo-token | jq -r '.token')

# 2. Analyze Instagram Reel
curl -X POST http://localhost:3000/v1/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "instagramReelUrl": "https://www.instagram.com/reel/ABC123/"
    },
    "brandKit": {
      "inline": {
        "brandName": "MyBrand",
        "category": "Beauty",
        "palette": ["#FF0000"],
        "doDonts": {
          "do": ["Show product"],
          "dont": ["False claims"]
        }
      }
    },
    "category": "Beauty"
  }'
```

### Workflow 2: Enhanced Keyword Extraction

```bash
# Extract keywords with full NLP features
curl -X POST http://localhost:3000/v1/keywords/extract-enhanced \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
    "languageHint": "en",
    "options": {
      "includeNgrams": true,
      "includeSentiment": true,
      "includeIntent": true,
      "includeEntities": true
    },
    "cookieOptions": {
      "browserCookies": "chrome"
    }
  }'
```

### Workflow 3: Direct Media Processing

```bash
# 1. Download Instagram Reel
curl -X POST http://localhost:8000/download-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reel/ABC123/",
    "browser_cookies": "chrome"
  }'

# 2. Transcribe audio
curl -X POST http://localhost:8000/asr \
  -F "file=@video.mp4" \
  -F "language=en"

# 3. Extract text from images
curl -X POST http://localhost:8000/ocr \
  -F "files=@frame1.jpg" \
  -F "files=@frame2.jpg"
```

## 🔐 Authentication

All API endpoints (except health checks) require JWT authentication:

```bash
# Include token in Authorization header
Authorization: Bearer <jwt-token>
```

**Get Token Options:**
1. Demo token: `POST /auth/demo-token` (for testing)
2. User login: `POST /auth/login` (with credentials)
3. User registration: `POST /auth/register` (create account)

## 🚨 Error Handling

All APIs return consistent error responses:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional context (optional)"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Missing/invalid authentication
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## 🌍 Multilingual Support

The API supports multiple languages:

- **English (en)**: Full support
- **Hindi (hi)**: Native Hindi with Devanagari script
- **Hinglish (hi-en)**: Mixed Hindi-English content
- **Auto-detection**: Automatic language detection

## 📊 Rate Limits

- **Default**: 60 requests/minute per IP
- **Instagram**: 10 requests/minute
- **Analysis**: Based on complexity
- **Authentication**: 10 requests/minute

## 🔗 Client Generation

Generate API clients from the OpenAPI spec:

```bash
# TypeScript/JavaScript
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/client

# Python
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client

# Other languages
openapi-generator-cli generate \
  -i openapi.yaml \
  -g <generator> \
  -o ./generated/<language>-client
```

## 📚 Additional Resources

### External Documentation
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [Postman Documentation](https://learning.postman.com/docs/)

### Internal Guides
- Project Architecture: See `README.md`
- Testing Guide: See `TEST_RUNNER.md`
- Cookie Setup: See `INSTAGRAM_COOKIES_GUIDE.md`

## 🆘 Getting Help

1. **API Issues**: Check OpenAPI spec in Swagger UI
2. **Integration Help**: See Postman collections
3. **Feature Questions**: Review specialized guides
4. **Bugs/Errors**: Check error responses and logs

## 🚀 Next Steps

1. ✅ **Setup**: Follow `README.md` to set up the project
2. ✅ **Explore**: Run `./serve-swagger.sh` to view interactive docs
3. ✅ **Test**: Import Postman collection or use Swagger UI
4. ✅ **Build**: Generate API clients for your language
5. ✅ **Deploy**: See deployment section in `README.md`

---

*This documentation index provides a complete overview of all API documentation resources. Start with the OpenAPI spec in Swagger UI for the best experience.*
