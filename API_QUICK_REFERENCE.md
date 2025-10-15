# Media Analyzer API - Quick Reference

## 🚀 Quick Start

```bash
# Start Swagger UI documentation
npm run docs:serve
# or
./serve-swagger.sh

# Validate OpenAPI spec
npm run docs:validate
```

## 🔑 Authentication

### Get Demo Token
```bash
curl -X POST http://localhost:3000/auth/demo-token
```

### Use Token
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/health
```

## 📍 API Endpoints

### Base URLs
- **Main API**: `http://localhost:3000`
- **Python Worker**: `http://localhost:8000`

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
| `/v1/keywords/extract-enhanced` | POST | Enhanced extraction |
| `/v1/keywords/health` | GET | Service health |

### Python Worker - Media
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/asr` | POST | Speech-to-text |
| `/ocr` | POST | Text extraction |
| `/download-instagram` | POST | Download Reel |

### Python Worker - NLP
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ner` | POST | Named Entity Recognition |
| `/semantic-similarity` | POST | Semantic clustering |

## 💡 Common Examples

### 1. Analyze Instagram Reel
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

### 2. Extract Keywords
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

### 3. Enhanced Keywords with NLP
```bash
curl -X POST http://localhost:3000/v1/keywords/extract-enhanced \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
    "options": {
      "includeNgrams": true,
      "includeSentiment": true,
      "includeIntent": true,
      "includeEntities": true
    }
  }'
```

### 4. Speech-to-Text
```bash
curl -X POST http://localhost:8000/asr \
  -F "file=@audio.mp4" \
  -F "language=en" \
  -F "enable_preprocessing=true"
```

### 5. Named Entity Recognition
```bash
curl -X POST http://localhost:8000/ner \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Apple Inc. is headquartered in Cupertino, California.",
    "language": "en",
    "include_relationships": true
  }'
```

## 🚨 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing/invalid auth |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## 🌍 Language Support

- **English (en)**: Full support
- **Hindi (hi)**: Native support
- **Hinglish (hi-en)**: Mixed content
- **Auto-detect**: Automatic language detection

## 📊 Rate Limits

- **Default**: 60 requests/min
- **Instagram**: 10 requests/min
- **Authentication**: 10 requests/min

## 🛠️ NPM Scripts

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

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `openapi.yaml` | Complete API specification |
| `API_DOCUMENTATION_INDEX.md` | Documentation index |
| `SWAGGER_DOCUMENTATION.md` | Swagger usage guide |
| `API_QUICK_REFERENCE.md` | This file (quick reference) |

## 🔗 Quick Links

- **Swagger UI**: `http://localhost:8080` (after running `npm run docs:serve`)
- **Main API**: `http://localhost:3000`
- **Python Worker**: `http://localhost:8000`
- **Health Check**: `http://localhost:3000/health`

## 💻 Client Generation

```bash
# TypeScript/Axios
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml -g typescript-axios -o ./generated/client

# Python
openapi-generator-cli generate \
  -i openapi.yaml -g python -o ./generated/python-client
```

## 📦 Response Format

### Success
```json
{
  "data": { ... },
  "timing": 1500,
  "metadata": { ... }
}
```

### Error
```json
{
  "code": "ERROR_CODE",
  "message": "Error description",
  "details": "Additional context"
}
```

---

*For complete documentation, run `npm run docs:serve` and visit http://localhost:8080*
