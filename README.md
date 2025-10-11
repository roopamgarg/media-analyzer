# Media Analyzer

A comprehensive media analysis platform for brand-fit and compliance checking with explainable flags and evidence.

## Architecture

This is a monorepo containing:

- **`apps/api`** - Fastify API server handling analysis requests
- **`apps/orchestrator`** - BullMQ workers for async job processing
- **`apps/worker-python`** - FastAPI microservice for ASR/OCR processing
- **`apps/web`** - Next.js client (to be implemented)
- **`packages/contracts`** - Shared Zod schemas and TypeScript types
- **`packages/rules`** - YAML rulepacks and rule evaluation engine
- **`packages/lib-node`** - Shared Node.js utilities (S3, Prisma, logging, etc.)

## Features

- **Sync & Async Analysis**: Automatic routing based on media size/duration
- **Multi-modal Processing**: Video, audio, text, and image analysis
- **Compliance Checking**: Disclosure, claims, brand safety, competitor conflicts
- **Brand-fit Scoring**: Risk and vibe scores with explainable components
- **Evidence Assembly**: Screenshots, transcripts, OCR results
- **Idempotency**: Safe retry with consistent results
- **Rate Limiting**: Per-project quotas and burst handling
- **Observability**: Structured logging, metrics, and tracing

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL
- Redis

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd media-analyzer
   npm install
   ```

2. **Start infrastructure:**
   ```bash
   cd infra
   docker-compose up -d postgres redis
   ```

3. **Set up environment variables:**
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit .env with your configuration
   ```

4. **Run database migrations:**
   ```bash
   cd apps/api
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start all services:**
   ```bash
   # Terminal 1: API server
   cd apps/api && npm run dev
   
   # Terminal 2: Python worker
   cd apps/worker-python && pip install -r requirements.txt && python main.py
   
   # Terminal 3: Orchestrator
   cd apps/orchestrator && npm run dev
   ```

### Docker Development

```bash
cd infra
docker-compose up
```

This starts all services with hot reloading enabled.

## API Usage

### Authentication

All requests require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

### Analyze Media

**Sync Analysis (for short videos <10s):**
```bash
curl -X POST http://localhost:3000/v1/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "url": "https://example.com/video.mp4"
    },
    "brandKit": {
      "inline": {
        "brandName": "MyBrand",
        "palette": ["#FF0000", "#00FF00"],
        "doDonts": {
          "do": ["Use our colors", "Be positive"],
          "dont": ["Mention competitors", "Make health claims"]
        }
      }
    },
    "category": "Beauty"
  }'
```

**Async Analysis (for longer videos):**
```bash
# Same request, but returns 202 with analysisId
# Poll for results:
curl http://localhost:3000/v1/analyses/{analysisId} \
  -H "Authorization: Bearer <token>"
```

### Response Format

```json
{
  "analysisId": "an_abc123",
  "mode": "sync",
  "status": "completed",
  "scores": {
    "risk": 25,
    "vibe": 85,
    "labels": {
      "risk": "Low",
      "vibe": "Excellent"
    },
    "components": {
      "claims": 0,
      "safety": 0,
      "disclosure": 25,
      "visual": 0,
      "competitor": 0,
      "toneMatch": 90
    }
  },
  "flags": [
    {
      "type": "disclosure",
      "code": "DISCLOSURE_MISSING_OR_DELAYED",
      "severity": "high",
      "message": "No #ad/#sponsored disclosure found in first 125 characters",
      "evidence": {
        "missing": true,
        "patterns": ["#ad", "#sponsored"]
      }
    }
  ],
  "evidence": {
    "frames": [
      {
        "t": 0,
        "imageUrl": "https://s3.../frame_0.jpg",
        "ocr": "Check out this amazing product!"
      }
    ],
    "caption": "Check out this amazing product! #ad",
    "transcript": "Hey everyone, today I'm reviewing this amazing product..."
  },
  "artifacts": {
    "pdfUrl": null
  },
  "timings": {
    "totalMs": 2500,
    "stages": {
      "extract": 800,
      "asr": 1200,
      "ocr": 300,
      "rules": 100,
      "scoring": 50,
      "evidence": 50
    }
  },
  "version": "2024-01-15"
}
```

## Configuration

### Environment Variables

**API Server (`apps/api/.env`):**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/media_analyzer
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
WORKER_PYTHON_URL=http://localhost:8000
S3_BUCKET=media-analyzer-dev
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
ANALYZE_SYNC_MAX_SECONDS=10
ANALYZE_MAX_FRAMES=5
OCR_ENABLED=true
```

**Python Worker:**
```env
PYTHONUNBUFFERED=1
```

### Feature Flags

- `ANALYZE_SYNC_MAX_SECONDS` - Max duration for sync processing (default: 10s)
- `ANALYZE_MAX_FRAMES` - Max frames to extract (default: 5)
- `OCR_ENABLED` - Enable OCR processing (default: true)
- `LANG_HI` - Enable Hindi language support (default: true)
- `LANG_TA` - Enable Tamil language support (default: false)

## Rules Engine

The rules engine evaluates content against YAML rulepacks:

- **`disclosure.yaml`** - Disclosure requirements (#ad, #sponsored)
- **`health.yaml`** - Health claims and disclaimers
- **`finance.yaml`** - Financial claims and risk disclaimers
- **`safety.yaml`** - Brand safety (profanity, politics, religion)

### Adding Custom Rules

1. Create a new YAML file in `packages/rules/rulepacks/`
2. Define rules with patterns, severity, and evidence
3. Restart the API server to load new rules

Example rule:
```yaml
name: "Custom Rules"
version: "1.0.0"
rules:
  - id: "CUSTOM_VIOLATION"
    type: "other"
    severity: "medium"
    message: "Custom violation detected"
    patterns:
      - "violation pattern"
    category: "Custom"
```

## Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

## Deployment

### Production Build
```bash
npm run build
```

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up
```

### Kubernetes
```bash
kubectl apply -f infra/k8s/
```

## Monitoring

### Health Checks
- API: `GET /health`
- Worker: `GET /health`
- Orchestrator: Built-in health checks

### Metrics
- Prometheus metrics on `/metrics` endpoint
- Key metrics: `analyze_latency_ms`, `worker_asr_ms`, `queue_depth`

### Logging
- Structured JSON logs with request IDs
- Log levels: `error`, `warn`, `info`, `debug`
- Redacted sensitive data (API keys, tokens)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
