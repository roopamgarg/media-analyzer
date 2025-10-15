# API Documentation

Complete API reference for the Media Analyzer platform.

## Table of Contents
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [OpenAPI/Swagger](#openapi-swagger)
- [Error Handling](#error-handling)

## Quick Start

### View Interactive Documentation

```bash
# Start Swagger UI
npm run docs:serve
# or
./serve-swagger.sh

# Visit http://localhost:8080
```

### Get Authentication Token

```bash
# Get demo token
curl -X POST http://localhost:3000/auth/demo-token
```

## Base URLs

- **Main API**: `http://localhost:3000`
- **Python Worker**: `http://localhost:8000`

## Authentication

All API endpoints (except health checks) require JWT authentication:

```bash
Authorization: Bearer <jwt-token>
```

### Get Token

**Demo Token (for testing):**
```bash
curl -X POST http://localhost:3000/auth/demo-token
```

**User Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

## Endpoints

### Authentication (`/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | User login |
| `/auth/demo-token` | POST | Get demo token |
| `/auth/verify` | GET | Verify JWT token |

### Health (`/health`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Basic health check |
| `/health/ready` | GET | Readiness check |
| `/health/config` | GET | Configuration info |

### Analysis (`/v1`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/analyze` | POST | Analyze content (sync/async) |
| `/v1/analyses/:id` | GET | Get analysis status |

### Keywords (`/v1/keywords`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/keywords/extract` | POST | Basic keyword extraction |
| `/v1/keywords/extract-enhanced` | POST | Enhanced extraction with NLP |
| `/v1/keywords/health` | GET | Service health |

### Python Worker - Media

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/asr` | POST | Speech-to-text |
| `/ocr` | POST | Text extraction |
| `/download-instagram` | POST | Download Instagram Reel |

### Python Worker - NLP

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ner` | POST | Named Entity Recognition |
| `/semantic-similarity` | POST | Semantic clustering |

## Common Examples

### Analyze Instagram Reel

```bash
curl -X POST http://localhost:3000/v1/analyze \
  -H "Authorization: Bearer <token>" \
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

### Extract Keywords

```bash
curl -X POST http://localhost:3000/v1/keywords/extract \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
    "languageHint": "en",
    "cookieOptions": {
      "browserCookies": "chrome"
    }
  }'
```

## OpenAPI/Swagger

### Specification File

Complete OpenAPI 3.0 specification: `openapi.yaml`

### View Interactive Docs

**Option 1: Local Swagger UI**
```bash
npm run docs:serve
# Visit http://localhost:8080
```

**Option 2: Docker**
```bash
docker run -p 8080:8080 \
  -v $(pwd)/openapi.yaml:/openapi.yaml \
  -e SWAGGER_JSON=/openapi.yaml \
  swaggerapi/swagger-ui
```

**Option 3: Online Editor**
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Import `openapi.yaml`

### Generate API Clients

**TypeScript/JavaScript:**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/client
```

**Python:**
```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client
```

### Validate Specification

```bash
npm run docs:validate
# or
./validate-openapi.sh
```

### Import to Postman

1. Open Postman
2. Click **Import**
3. Select `openapi.yaml`
4. All endpoints auto-configured

## Error Handling

### Error Response Format

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional context"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Language Support

- **English (en)**: Full support
- **Hindi (hi)**: Native support
- **Hinglish (hi-en)**: Mixed content
- **Auto-detect**: Automatic language detection

## Rate Limits

- **Default**: 60 requests/min
- **Instagram**: 10 requests/min
- **Authentication**: 10 requests/min

## NPM Scripts

```bash
# Documentation
npm run docs:serve              # Serve Swagger UI
npm run docs:validate            # Validate OpenAPI spec
npm run docs:generate-client     # Generate TypeScript client

# Development
npm run dev                      # Start all services
npm run worker:python            # Start Python worker

# Testing
npm run test:all                 # Run all tests
npm run test:api                 # Test API
npm run test:worker              # Test Python worker
```

## Response Formats

### Success Response

```json
{
  "data": { ... },
  "timing": 1500,
  "metadata": { ... }
}
```

### Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "details": "Additional context"
}
```

## Quick Links

- **Swagger UI**: http://localhost:8080 (after `npm run docs:serve`)
- **Main API**: http://localhost:3000
- **Python Worker**: http://localhost:8000
- **Health Check**: http://localhost:3000/health

## See Also

- [Keyword Extraction](keyword-extraction.md) - Detailed keyword API guide
- [Instagram Cookies](instagram-cookies.md) - Instagram authentication setup
- [Testing Guide](testing.md) - How to test the API
- [Postman Guide](postman-guide.md) - Using Postman collections

