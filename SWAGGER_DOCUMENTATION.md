# Media Analyzer API - Swagger/OpenAPI Documentation

## 📚 Overview

This project includes a comprehensive OpenAPI 3.0 specification that documents all API endpoints, request/response schemas, and examples.

**File**: `openapi.yaml`

## 🚀 Quick Start

### View in Swagger UI

#### Option 1: Using Swagger Editor (Online)
1. Go to [Swagger Editor](https://editor.swagger.io/)
2. Click **File** → **Import File**
3. Select `openapi.yaml` from this project
4. Explore the interactive documentation

#### Option 2: Using Swagger UI Locally

**Install Swagger UI:**
```bash
npm install -g swagger-ui-watcher
```

**Run Swagger UI:**
```bash
swagger-ui-watcher openapi.yaml
```

The documentation will open at `http://localhost:8080`

#### Option 3: Using Docker

```bash
docker run -p 8080:8080 \
  -e SWAGGER_JSON=/openapi.yaml \
  -v $(pwd)/openapi.yaml:/openapi.yaml \
  swaggerapi/swagger-ui
```

Visit `http://localhost:8080`

### Generate API Client

You can auto-generate API clients in various languages using the OpenAPI spec:

**JavaScript/TypeScript:**
```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./generated/client
```

**Python:**
```bash
pip install openapi-generator-cli
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated/python-client
```

**Other Languages:**
```bash
# Java
openapi-generator-cli generate -i openapi.yaml -g java -o ./generated/java-client

# Go
openapi-generator-cli generate -i openapi.yaml -g go -o ./generated/go-client

# Ruby
openapi-generator-cli generate -i openapi.yaml -g ruby -o ./generated/ruby-client
```

## 📋 API Sections

### 1. Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/demo-token` - Get demo token
- `GET /auth/verify` - Verify JWT token

### 2. Health Checks (`/health`)
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check
- `GET /health/config` - Configuration info

### 3. Content Analysis (`/v1`)
- `POST /v1/analyze` - Analyze content (sync/async)
- `GET /v1/analyses/:id` - Get analysis status

### 4. Keyword Extraction (`/v1/keywords`)
- `POST /v1/keywords/extract` - Basic keyword extraction
- `POST /v1/keywords/extract-enhanced` - Enhanced extraction
- `GET /v1/keywords/health` - Service health

### 5. Python Worker - Media Processing (`/`)
- `POST /asr` - Speech-to-text transcription
- `POST /ocr` - Optical character recognition
- `POST /download-instagram` - Download Instagram Reel

### 6. Python Worker - NLP (`/`)
- `POST /ner` - Named Entity Recognition
- `POST /semantic-similarity` - Semantic similarity analysis

## 🔧 Testing with Swagger UI

### 1. Authenticate
1. Expand **Authentication** → **POST /auth/demo-token**
2. Click **Try it out** → **Execute**
3. Copy the `token` from the response
4. Click **Authorize** button at the top
5. Enter: `Bearer <your-token>`
6. Click **Authorize**

### 2. Test Endpoints
Now you can test any protected endpoint:
1. Expand the endpoint (e.g., **POST /v1/analyze**)
2. Click **Try it out**
3. Modify the request body as needed
4. Click **Execute**
5. View the response

## 📊 Examples

### Example 1: Analyze Instagram Reel

```bash
curl -X POST "http://localhost:3000/v1/analyze" \
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
        "palette": ["#FF0000", "#00FF00"],
        "doDonts": {
          "do": ["Use bright colors"],
          "dont": ["Use competitor logos"]
        }
      }
    },
    "category": "Beauty"
  }'
```

### Example 2: Extract Keywords

```bash
curl -X POST "http://localhost:3000/v1/keywords/extract" \
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

### Example 3: Enhanced Keyword Extraction

```bash
curl -X POST "http://localhost:3000/v1/keywords/extract-enhanced" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
    "languageHint": "en",
    "options": {
      "includeNgrams": true,
      "includeSentiment": true,
      "includeIntent": true,
      "includeEntities": true
    }
  }'
```

## 🔄 Using Postman

### Import OpenAPI Spec to Postman

1. Open Postman
2. Click **Import** button
3. Select **Link** tab
4. Enter: `file:///<path-to-project>/openapi.yaml`
5. Or drag and drop `openapi.yaml` file
6. Click **Import**

Postman will automatically:
- Create all endpoints
- Set up request bodies
- Configure examples
- Add authentication

## 🛠️ Development

### Validate OpenAPI Spec

**Using Swagger CLI:**
```bash
npm install -g @apidevtools/swagger-cli
swagger-cli validate openapi.yaml
```

**Using OpenAPI Generator:**
```bash
npx @openapitools/openapi-generator-cli validate -i openapi.yaml
```

### Update Documentation

When adding new endpoints:

1. Edit `openapi.yaml`
2. Add path under `paths` section
3. Add schemas under `components/schemas`
4. Add examples under request body
5. Validate the spec
6. Test in Swagger UI

### Generate Server Stubs

Generate server code from the spec:

```bash
# Node.js/Express
openapi-generator-cli generate \
  -i openapi.yaml \
  -g nodejs-express-server \
  -o ./generated/server

# Python/FastAPI
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python-fastapi \
  -o ./generated/fastapi-server
```

## 📈 Best Practices

### 1. Keep Examples Updated
- Update examples when API changes
- Include both success and error examples
- Cover edge cases

### 2. Document All Fields
- Add descriptions for all properties
- Specify required vs optional fields
- Include validation constraints

### 3. Version Your API
- Use semantic versioning
- Document breaking changes
- Maintain backwards compatibility

### 4. Security
- Always require authentication for sensitive endpoints
- Document rate limits
- Include error responses

## 🔒 Security Schemes

The API uses JWT Bearer authentication:

```yaml
securitySchemes:
  BearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

To use authenticated endpoints:
1. Get token from `/auth/login` or `/auth/demo-token`
2. Include in Authorization header: `Bearer <token>`

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional error details"
}
```

### Common Error Codes:
- `VALIDATION_ERROR` (400) - Invalid request data
- `UNAUTHORIZED` (401) - Missing/invalid authentication
- `NOT_FOUND` (404) - Resource not found
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## 📚 Additional Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Postman OpenAPI Import](https://learning.postman.com/docs/integrations/available-integrations/working-with-openAPI/)

## 🔗 Related Documentation

- Main API Documentation: See `openapi.yaml` in Swagger UI
- Keyword Extraction Guide: `KEYWORD_EXTRACTION_API.md`
- Instagram Cookies Setup: `INSTAGRAM_COOKIES_GUIDE.md`
- Postman Collection: `postman-collection.json`

---

*This OpenAPI specification provides a complete, interactive, and machine-readable documentation of the Media Analyzer API.*
