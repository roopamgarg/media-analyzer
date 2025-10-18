# Media Analyzer API - Complete Reference

Comprehensive reference guide for all Media Analyzer API endpoints with detailed explanations, examples, and use cases.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Authentication Endpoints](#authentication-endpoints)
- [Health Check Endpoints](#health-check-endpoints)
- [Analysis Endpoints](#analysis-endpoints)
- [Keyword Extraction Endpoints](#keyword-extraction-endpoints)
- [Python Worker - Media Processing](#python-worker---media-processing)
- [Python Worker - NLP](#python-worker---nlp)
- [Error Handling](#error-handling)

---

## Overview

### Base URLs

| Server | URL | Purpose |
|--------|-----|---------|
| Main API | `http://localhost:3000` | Content analysis, keywords, authentication |
| Python Worker | `http://localhost:8000` | Media processing, ASR, OCR, NER |
| Production | `https://api.media-analyzer.com` | Production environment |

### Architecture

The Media Analyzer platform consists of:

1. **Main API Server** (Node.js/Fastify) - Handles business logic, authentication, and orchestration
2. **Python Worker** (FastAPI) - Processes media files, runs ML models, performs ASR/OCR
3. **Database** (SQLite/PostgreSQL) - Stores analysis results and user data
4. **Queue System** (Redis/BullMQ) - Manages async job processing

---

## Authentication

All API endpoints (except health checks) require JWT authentication.

### Getting a Token

**Option 1: Demo Token (for testing)**
```bash
curl -X POST http://localhost:3000/auth/demo-token
```

**Option 2: User Registration**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password",
    "projectId": "project-123",
    "userId": "user-456"
  }'
```

**Option 3: User Login**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password"
  }'
```

### Using the Token

Include the JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Authentication Endpoints

### 1. POST /auth/register

**Purpose:** Create a new user account and receive authentication token.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "projectId": "project-123",
  "userId": "user-456"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "projectId": "project-123",
    "userId": "user-456"
  }
}
```

**Use Cases:**
- Creating new user accounts for the platform
- Onboarding new team members
- Setting up API access for applications

**Example:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@company.com",
    "password": "SecurePass123!",
    "projectId": "fashion-brand",
    "userId": "alice-123"
  }'
```

---

### 2. POST /auth/login

**Purpose:** Authenticate existing user and receive new token.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "projectId": "project-123"
  }
}
```

**Use Cases:**
- Daily user authentication
- Token refresh after expiration
- Multi-device login

**Example:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@company.com",
    "password": "SecurePass123!"
  }'
```

---

### 3. POST /auth/demo-token

**Purpose:** Get a demo JWT token for testing without registration.

**Authentication:** Not required

**Request:** No body required

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "note": "This is a demo token for testing purposes only"
}
```

**Use Cases:**
- Quick API testing
- Development and debugging
- Demo applications
- Integration testing

**Example:**
```bash
curl -X POST http://localhost:3000/auth/demo-token
```

---

### 4. GET /auth/verify

**Purpose:** Verify JWT token validity and get user information.

**Authentication:** Required

**Request:** No body required

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "projectId": "project-123"
  },
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

**Use Cases:**
- Token validation before operations
- Checking token expiration
- User session management
- Security audits

**Example:**
```bash
curl -X GET http://localhost:3000/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Health Check Endpoints

### 5. GET /health

**Purpose:** Basic health check - verify service is running.

**Authentication:** Not required

**Request:** No body required

**Response (200):**
```json
{
  "status": "ok",
  "service": "media-analyzer-api",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z",
  "uptime": 3600
}
```

**Use Cases:**
- Load balancer health checks
- Monitoring and alerting
- Service discovery
- Deployment verification

**Example:**
```bash
curl http://localhost:3000/health
```

---

### 6. GET /health/ready

**Purpose:** Comprehensive readiness check - verify all dependencies are ready.

**Authentication:** Not required

**Request:** No body required

**Response (200):**
```json
{
  "ready": true,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "redis": {
      "status": "healthy",
      "latency": 2
    },
    "pythonWorker": {
      "status": "healthy",
      "latency": 50,
      "url": "http://localhost:8000"
    }
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Use Cases:**
- Kubernetes readiness probes
- Pre-deployment verification
- Dependency monitoring
- System diagnostics

**Example:**
```bash
curl http://localhost:3000/health/ready
```

---

### 7. GET /health/config

**Purpose:** Get current service configuration (for debugging).

**Authentication:** Not required

**Request:** No body required

**Response (200):**
```json
{
  "environment": "development",
  "features": {
    "ocr": true,
    "asr": true,
    "ner": true,
    "semanticAnalysis": true
  },
  "limits": {
    "maxVideoSeconds": 60,
    "maxFrames": 10,
    "syncMaxSeconds": 10
  },
  "worker": {
    "url": "http://localhost:8000",
    "timeout": 30000
  }
}
```

**Use Cases:**
- Configuration debugging
- Feature flag verification
- Environment validation
- Integration testing setup

**Example:**
```bash
curl http://localhost:3000/health/config
```

---

## Analysis Endpoints

### 8. POST /v1/analyze

**Purpose:** Analyze Instagram Reel or video for brand compliance and content quality.

**Authentication:** Required

**Processing Modes:**
- **Sync:** For videos < 10 seconds (returns results immediately)
- **Async:** For longer videos (returns job ID, poll for results)

**Request Body:**
```json
{
  "input": {
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
    "url": "https://example.com/video.mp4",
    "s3Key": "videos/sample.mp4"
  },
  "brandKit": {
    "inline": {
      "brandName": "MyBrand",
      "category": "Beauty",
      "palette": ["#FF0000", "#00FF00"],
      "doDonts": {
        "do": ["Show product clearly", "Use bright lighting"],
        "dont": ["Mention competitors", "Make false claims"]
      }
    },
    "ref": "brandkit-123"
  },
  "category": "Beauty",
  "options": {
    "enableOCR": true,
    "enableASR": true,
    "maxFrames": 5,
    "languageHint": "en",
    "cookieOptions": {
      "browserCookies": "chrome"
    }
  }
}
```

**Sync Response (200):**
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
        "patterns": ["#ad", "#sponsored"],
        "foundAt": null
      }
    }
  ],
  "evidence": {
    "frames": [
      {
        "t": 0,
        "imageUrl": "https://s3.../frame_0.jpg",
        "ocr": "Amazing Skincare Product"
      },
      {
        "t": 5,
        "imageUrl": "https://s3.../frame_5.jpg",
        "ocr": "Only $49.99"
      }
    ],
    "caption": "Check out this amazing product! #beauty",
    "transcript": "Hey everyone, today I'm reviewing this amazing skincare product...",
    "entities": {
      "brands": ["MyBrand", "CompetitorBrand"],
      "products": ["Skincare Serum", "Face Cream"],
      "claims": ["amazing", "best"]
    }
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

**Async Response (202):**
```json
{
  "analysisId": "an_abc123",
  "mode": "async",
  "status": "queued",
  "message": "Analysis queued for processing",
  "pollUrl": "/v1/analyses/an_abc123",
  "estimatedCompletionSeconds": 30
}
```

**Use Cases:**
- **Influencer Marketing:** Verify influencer content meets brand guidelines
- **Compliance:** Check for required disclosures (#ad, #sponsored)
- **Brand Safety:** Detect competitor mentions, inappropriate content
- **Quality Control:** Ensure content matches brand tone and values
- **Legal Review:** Identify health claims, financial claims, disclaimers

**Example - Instagram Reel:**
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
        "brandName": "BeautyBrand",
        "category": "Beauty",
        "palette": ["#FF69B4"],
        "doDonts": {
          "do": ["Show product clearly", "Natural lighting"],
          "dont": ["False claims", "Competitor mentions"]
        }
      }
    },
    "category": "Beauty",
    "options": {
      "enableOCR": true,
      "enableASR": true,
      "languageHint": "en",
      "cookieOptions": {
        "browserCookies": "chrome"
      }
    }
  }'
```

**Example - Direct URL:**
```bash
curl -X POST http://localhost:3000/v1/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "url": "https://example.com/promo-video.mp4"
    },
    "brandKit": {
      "ref": "brandkit-fashion-123"
    },
    "category": "Fashion"
  }'
```

---

### 9. GET /v1/analyses/:id

**Purpose:** Get analysis status and results for async analysis.

**Authentication:** Required

**Request:** No body required

**Response (200) - Processing:**
```json
{
  "analysisId": "an_abc123",
  "status": "processing",
  "progress": 60,
  "message": "Running content analysis",
  "createdAt": "2024-01-15T12:00:00Z",
  "updatedAt": "2024-01-15T12:00:30Z"
}
```

**Response (200) - Completed:**
```json
{
  "analysisId": "an_abc123",
  "status": "completed",
  "scores": { /* same as sync response */ },
  "flags": [ /* array of flags */ ],
  "evidence": { /* evidence object */ },
  "completedAt": "2024-01-15T12:01:00Z"
}
```

**Response (200) - Failed:**
```json
{
  "analysisId": "an_abc123",
  "status": "failed",
  "error": {
    "code": "PROCESSING_ERROR",
    "message": "Failed to extract video frames",
    "details": "FFmpeg error: Invalid video format"
  },
  "failedAt": "2024-01-15T12:00:45Z"
}
```

**Use Cases:**
- Poll async analysis status
- Retrieve completed analysis results
- Handle failed analysis errors
- Monitor analysis progress

**Example:**
```bash
curl -X GET http://localhost:3000/v1/analyses/an_abc123 \
  -H "Authorization: Bearer <token>"
```

**Polling Pattern:**
```bash
# Start analysis (async)
ANALYSIS_ID=$(curl -X POST http://localhost:3000/v1/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ /* analysis request */ }' | jq -r '.analysisId')

# Poll for results
while true; do
  STATUS=$(curl -s http://localhost:3000/v1/analyses/$ANALYSIS_ID \
    -H "Authorization: Bearer <token>" | jq -r '.status')
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  
  echo "Status: $STATUS"
  sleep 2
done

# Get final results
curl http://localhost:3000/v1/analyses/$ANALYSIS_ID \
  -H "Authorization: Bearer <token>"
```

---

## Keyword Extraction Endpoints

### 10. POST /v1/keywords/extract

**Purpose:** Extract keywords, hashtags, and topics from Instagram Reels (basic version).

**Authentication:** Required

**Request Body:**
```json
{
  "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
  "languageHint": "en",
  "cookieOptions": {
    "browserCookies": "chrome",
    "cookiesFile": "/path/to/cookies.txt"
  }
}
```

**Response (200):**
```json
{
  "keywords": {
    "primary": ["fashion", "style", "outfit", "trendy"],
    "secondary": ["clothes", "accessories", "shopping", "beauty"],
    "hashtags": ["#fashion", "#style", "#ootd", "#trending"],
    "mentions": ["@fashionbrand", "@stylist"],
    "topics": ["fashion", "lifestyle"]
  },
  "metadata": {
    "caption": "Check out this amazing outfit! #fashion #style",
    "transcript": "Hey everyone, today I'm showing you my favorite outfit",
    "ocrText": "SALE 50% OFF",
    "duration": 30,
    "username": "fashionista"
  },
  "searchableTerms": [
    "fashion", "style", "outfit", "trendy", "clothes", "accessories",
    "shopping", "beauty", "lifestyle", "video", "reel", "instagram"
  ],
  "timings": {
    "totalMs": 2500,
    "stages": {
      "extract": 800,
      "asr": 1200,
      "ocr": 300,
      "processing": 200
    }
  }
}
```

**Use Cases:**
- **Content Discovery:** Make videos searchable by keywords
- **SEO Optimization:** Generate search-friendly terms
- **Hashtag Research:** Discover relevant hashtags
- **Topic Classification:** Categorize content automatically
- **Search Indexing:** Build searchable content databases

**Example:**
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

---

### 11. POST /v1/keywords/extract-enhanced

**Purpose:** Advanced keyword extraction with NLP features (sentiment, intent, entities, n-grams).

**Authentication:** Required

**Request Body:**
```json
{
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
}
```

**Response (200):**
```json
{
  "keywords": {
    "primary": [
      {
        "term": "skincare routine",
        "confidence": 0.95,
        "type": "phrase"
      },
      {
        "term": "beauty",
        "confidence": 0.88,
        "type": "single"
      }
    ],
    "secondary": ["skincare", "beauty", "moisturizer", "cleanser"],
    "phrases": [
      {
        "text": "skincare routine",
        "frequency": 3,
        "significance": 0.8
      },
      {
        "text": "morning routine",
        "frequency": 2,
        "significance": 0.7
      }
    ],
    "hashtags": ["#skincare", "#beauty", "#routine"],
    "mentions": ["@beautyexpert"]
  },
  "topics": {
    "primary": {
      "category": "beauty",
      "subcategory": "skincare",
      "confidence": 0.92
    },
    "secondary": [
      {
        "category": "lifestyle",
        "confidence": 0.70
      }
    ]
  },
  "sentiment": {
    "overall": "positive",
    "score": 3.2,
    "comparative": 0.8,
    "emotions": ["joy", "excitement", "confidence", "trust"]
  },
  "intent": {
    "primary": "educate",
    "secondary": ["inform", "inspire"],
    "confidence": 0.9
  },
  "entities": {
    "brands": ["CeraVe", "Neutrogena"],
    "products": ["cleanser", "moisturizer", "serum"],
    "people": ["Beauty Expert"],
    "prices": ["$50", "$25"],
    "locations": ["New York"],
    "events": ["beauty conference"]
  },
  "metadata": {
    "caption": "Amazing skincare routine! #skincare #beauty",
    "transcript": "This is an amazing skincare routine for beginners",
    "ocrText": "Brand Name - $50",
    "duration": 30,
    "username": "beautyexpert",
    "complexity": "moderate",
    "context": {
      "domain": "beauty",
      "targetAudience": ["young", "casual", "educational"],
      "contentStyle": "informal"
    },
    "detectedLanguage": "en",
    "languageConfidence": 0.95
  },
  "searchableTerms": [
    "skincare", "routine", "beauty", "CeraVe", "moisturizer",
    "cleanser", "video", "reel", "instagram", "educational"
  ],
  "timings": {
    "totalMs": 3500,
    "stages": {
      "extract": 800,
      "asr": 1200,
      "ocr": 300,
      "processing": 200,
      "enhancement": 1000
    }
  }
}
```

**Use Cases:**
- **Content Recommendation:** Understand content semantically for better matching
- **Sentiment Analysis:** Filter content by emotional tone
- **Intent Detection:** Route content based on purpose (educate, promote, entertain)
- **Entity Extraction:** Identify brands, products, people mentioned
- **Advanced Search:** Semantic search with phrase understanding
- **Content Moderation:** Detect inappropriate sentiment or intent
- **LLM Training:** Generate rich training data for AI models

**Example:**
```bash
curl -X POST http://localhost:3000/v1/keywords/extract-enhanced \
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
    },
    "cookieOptions": {
      "browserCookies": "chrome"
    }
  }'
```

---

### 12. GET /v1/keywords/health

**Purpose:** Check keyword extraction service health.

**Authentication:** Not required

**Request:** No body required

**Response (200):**
```json
{
  "status": "ok",
  "service": "keyword-extractor",
  "features": {
    "basic": true,
    "enhanced": true,
    "sentiment": true,
    "intent": true,
    "entities": true,
    "multilingual": true
  },
  "supportedLanguages": ["en", "hi", "hi-en"],
  "timestamp": "2024-01-15T12:00:00Z"
}
```

**Use Cases:**
- Service health monitoring
- Feature availability checking
- Integration testing
- Deployment verification

**Example:**
```bash
curl http://localhost:3000/v1/keywords/health
```

---

## Python Worker - Media Processing

### 13. POST /asr

**Purpose:** Automatic Speech Recognition - convert audio/video to text.

**Authentication:** Not required (internal service)

**Request (multipart/form-data):**
- `file`: Audio/video file
- `language`: Language code (en, hi, es, etc.)
- `enable_preprocessing`: Boolean (optional)

**Response (200):**
```json
{
  "success": true,
  "transcript": "Hey everyone, today I'm going to show you an amazing product that I've been using...",
  "language": "en",
  "duration": 45.5,
  "timing": 2300,
  "metadata": {
    "model": "whisper-base",
    "preprocessing": true,
    "confidence": 0.92
  }
}
```

**Use Cases:**
- Video transcription for analysis
- Subtitle generation
- Content accessibility
- Search indexing
- Compliance checking (spoken disclosures)

**Example:**
```bash
curl -X POST http://localhost:8000/asr \
  -F "file=@video.mp4" \
  -F "language=en" \
  -F "enable_preprocessing=true"
```

---

### 14. POST /ocr

**Purpose:** Optical Character Recognition - extract text from images/video frames.

**Authentication:** Not required (internal service)

**Request (multipart/form-data):**
- `files`: One or more image files

**Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "filename": "frame_001.jpg",
      "text": "Amazing Product\n50% OFF\nLimited Time Only",
      "confidence": 0.95
    },
    {
      "filename": "frame_002.jpg",
      "text": "Visit www.example.com",
      "confidence": 0.89
    }
  ],
  "combined_text": "Amazing Product 50% OFF Limited Time Only Visit www.example.com",
  "timing": 450
}
```

**Use Cases:**
- Extract on-screen text from videos
- Detect price mentions
- Find URLs and contact information
- Compliance checking (written disclosures)
- Price comparison

**Example:**
```bash
curl -X POST http://localhost:8000/ocr \
  -F "files=@frame_001.jpg" \
  -F "files=@frame_002.jpg" \
  -F "files=@frame_003.jpg"
```

---

### 15. POST /download-instagram

**Purpose:** Download Instagram Reels with metadata extraction.

**Authentication:** Not required (internal service)

**Request Body:**
```json
{
  "url": "https://www.instagram.com/reel/ABC123/",
  "browser_cookies": "chrome",
  "cookies_file": "/path/to/cookies.txt"
}
```

**Response (200):**
```json
{
  "success": true,
  "video_path": "/tmp/instagram_reel_ABC123.mp4",
  "caption": "Check out this amazing product! #ad #beauty",
  "username": "influencer_name",
  "duration": 30.5,
  "thumbnail": "/tmp/instagram_reel_ABC123_thumb.jpg",
  "view_count": 125000,
  "like_count": 5420,
  "comment_count": 234,
  "posted_at": "2024-01-15T10:30:00Z",
  "error": null
}
```

**Use Cases:**
- Download Instagram content for analysis
- Bypass rate limiting with cookies
- Extract metadata for reporting
- Content archival

**Example with Browser Cookies:**
```bash
curl -X POST http://localhost:8000/download-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reel/ABC123/",
    "browser_cookies": "chrome"
  }'
```

**Example with Cookies File:**
```bash
curl -X POST http://localhost:8000/download-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reel/ABC123/",
    "cookies_file": "/Users/user/instagram_cookies.txt"
  }'
```

---

## Python Worker - NLP

### 16. POST /ner

**Purpose:** Named Entity Recognition - extract entities (people, brands, locations, etc.) from text.

**Authentication:** Not required (internal service)

**Request Body:**
```json
{
  "text": "Apple was founded by Steve Jobs in California. Nike makes great running shoes.",
  "language": "en",
  "include_relationships": true
}
```

**Response (200):**
```json
{
  "entities": {
    "persons": [
      {
        "text": "Steve Jobs",
        "confidence": 0.95
      }
    ],
    "organizations": [
      {
        "text": "Apple",
        "confidence": 0.92,
        "category": "tech"
      },
      {
        "text": "Nike",
        "confidence": 0.91,
        "category": "fashion"
      }
    ],
    "locations": [
      {
        "text": "California",
        "confidence": 0.88
      }
    ],
    "brands": [
      {
        "text": "Nike",
        "confidence": 0.90,
        "category": "fashion"
      },
      {
        "text": "Apple",
        "confidence": 0.89,
        "category": "tech"
      }
    ],
    "products": [
      {
        "text": "running shoes",
        "confidence": 0.82
      }
    ]
  },
  "relationships": [
    {
      "entity1": "Steve Jobs",
      "entity2": "Apple",
      "type": "person-organization",
      "confidence": 0.85
    },
    {
      "entity1": "Nike",
      "entity2": "running shoes",
      "type": "brand-product",
      "confidence": 0.80
    }
  ],
  "metadata": {
    "language": "en",
    "total_entities": 5,
    "confidence_threshold": 0.7,
    "model": "bert-base-ner"
  },
  "timing": 250.5
}
```

**Use Cases:**
- Competitor detection (brand mentions)
- Entity extraction for compliance
- Brand co-mention analysis
- Content categorization
- Relationship discovery

**Example:**
```bash
curl -X POST http://localhost:8000/ner \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Just bought the new iPhone from Apple! Best phone ever. Also tried Samsung Galaxy but Apple is better.",
    "language": "en",
    "include_relationships": true
  }'
```

---

### 17. POST /semantic-similarity

**Purpose:** Compute semantic similarity and cluster keywords.

**Authentication:** Not required (internal service)

**Request Body:**
```json
{
  "keywords": ["running", "jogging", "sprinting", "swimming", "cycling"],
  "language": "en",
  "cluster": true
}
```

**Response (200):**
```json
{
  "clusters": [
    {
      "id": 0,
      "keywords": ["running", "jogging", "sprinting"],
      "centroid_keyword": "running",
      "size": 3,
      "avg_similarity": 0.85
    },
    {
      "id": 1,
      "keywords": ["swimming"],
      "centroid_keyword": "swimming",
      "size": 1,
      "avg_similarity": 1.0
    },
    {
      "id": 2,
      "keywords": ["cycling"],
      "centroid_keyword": "cycling",
      "size": 1,
      "avg_similarity": 1.0
    }
  ],
  "similarity_matrix": [
    [1.0, 0.92, 0.88, 0.45, 0.52],
    [0.92, 1.0, 0.85, 0.42, 0.48],
    [0.88, 0.85, 1.0, 0.40, 0.46],
    [0.45, 0.42, 0.40, 1.0, 0.55],
    [0.52, 0.48, 0.46, 0.55, 1.0]
  ],
  "grouped_keywords": {
    "running": [
      ["jogging", 0.92],
      ["sprinting", 0.88]
    ],
    "swimming": [
      ["cycling", 0.55]
    ]
  },
  "embeddings_shape": [5, 768],
  "metadata": {
    "num_keywords": 5,
    "similarity_threshold": 0.75,
    "language": "en",
    "model": "all-mpnet-base-v2"
  },
  "timing": 125.3
}
```

**Use Cases:**
- Keyword deduplication
- Semantic clustering
- Related keyword discovery
- Content categorization
- Search query expansion

**Example:**
```bash
curl -X POST http://localhost:8000/semantic-similarity \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": [
      "fashion", "style", "clothing", "outfit",
      "technology", "gadget", "device", "electronics"
    ],
    "language": "en",
    "cluster": true
  }'
```

---

## Error Handling

### Error Response Format

All errors follow this consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": "Additional context or technical details"
}
```

### Common Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `VALIDATION_ERROR` | 400 | Invalid request data | Check request format and required fields |
| `UNAUTHORIZED` | 401 | Missing/invalid token | Get new token via auth endpoints |
| `FORBIDDEN` | 403 | Insufficient permissions | Check user permissions |
| `NOT_FOUND` | 404 | Resource not found | Verify resource ID |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry with exponential backoff |
| `INSTAGRAM_DOWNLOAD_FAILED` | 500 | Instagram download error | Use browser cookies or different URL |
| `ASR_PROCESSING_FAILED` | 500 | Speech recognition error | Check audio quality, try different language |
| `OCR_PROCESSING_FAILED` | 500 | Text extraction error | Check image quality and format |
| `INTERNAL_ERROR` | 500 | Server error | Retry request, contact support if persists |

### Example Error Responses

**Validation Error:**
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "path": ["instagramReelUrl"],
      "message": "Must be a valid Instagram Reel URL",
      "expected": "https://www.instagram.com/reel/[id]/"
    }
  ]
}
```

**Authentication Error:**
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired authentication token",
  "details": "JWT token has expired. Please login again."
}
```

**Rate Limit Error:**
```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "details": {
    "limit": 60,
    "window": "1 minute",
    "retryAfter": 45
  }
}
```

### Error Handling Best Practices

**1. Retry Logic:**
```javascript
async function callApiWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
      
      // Don't retry on 4xx errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(await response.text());
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

**2. Rate Limit Handling:**
```javascript
if (error.code === 'RATE_LIMIT_EXCEEDED') {
  const retryAfter = error.details.retryAfter || 60;
  await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  // Retry request
}
```

**3. Token Refresh:**
```javascript
if (error.code === 'UNAUTHORIZED') {
  // Get new token
  const newToken = await login(email, password);
  // Retry with new token
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Default | 60 requests | per minute |
| Authentication | 10 requests | per minute |
| Instagram downloads | 10 requests | per minute |
| Analysis (sync) | 30 requests | per minute |
| Analysis (async) | 100 requests | per minute |

---

## Language Support

| Language | Code | ASR | OCR | NER | Sentiment |
|----------|------|-----|-----|-----|-----------|
| English | en | ✅ | ✅ | ✅ | ✅ |
| Hindi | hi | ✅ | ✅ | ✅ | ✅ |
| Hinglish | hi-en | ✅ | ✅ | ✅ | ✅ |
| Spanish | es | ✅ | ✅ | ⚠️ | ⚠️ |
| French | fr | ✅ | ✅ | ⚠️ | ❌ |
| Chinese | zh | ✅ | ✅ | ⚠️ | ❌ |

✅ Full support | ⚠️ Partial support | ❌ Not supported

---

## Best Practices

### 1. Authentication
- Store tokens securely (environment variables, key management)
- Refresh tokens before expiration
- Use demo tokens only for testing

### 2. Error Handling
- Implement retry logic with exponential backoff
- Handle rate limits gracefully
- Log errors for debugging

### 3. Performance
- Use async analysis for long videos
- Cache analysis results when possible
- Batch similar requests

### 4. Instagram Downloads
- Always use browser cookies for reliability
- Keep cookies fresh (login regularly)
- Respect rate limits (max 10 requests/minute)

### 5. Content Analysis
- Provide language hints for better accuracy
- Enable relevant features (OCR, ASR) based on content
- Use appropriate brand kits for compliance

---

## Support & Resources

- **Documentation**: `/docs` folder
- **OpenAPI Spec**: `openapi.yaml`
- **Interactive Docs**: Run `npm run docs:serve`
- **Postman Collection**: `postman-collection.json`

For issues or questions, refer to the project README and documentation files.

