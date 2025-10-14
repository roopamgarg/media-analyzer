# Keyword Extraction API

A new API endpoint for extracting searchable keywords from Instagram Reels to enable better content discovery and search functionality.

## 🚀 Overview

The Keyword Extraction API analyzes Instagram Reels to extract:
- **Primary Keywords**: Most important terms for search
- **Secondary Keywords**: Supporting terms and context
- **Hashtags**: All hashtags from the caption
- **Mentions**: All @mentions from the caption
- **Topics**: Content categories (fashion, beauty, food, etc.)
- **Searchable Terms**: Combined terms optimized for search

## 📍 Endpoint

```
POST /v1/keywords/extract
```

## 🔐 Authentication

Requires JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

## 📝 Request Body

```json
{
  "instagramReelUrl": "https://www.instagram.com/reel/ABC123DEF456/",
  "languageHint": "en",
  "cookieOptions": {
    "browserCookies": "chrome",
    "cookiesFile": "/path/to/cookies.txt"
  }
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instagramReelUrl` | string | ✅ | Instagram Reel URL to analyze |
| `languageHint` | string | ❌ | Language hint for ASR (e.g., "en", "es", "fr") |
| `cookieOptions` | object | ❌ | Cookie configuration for Instagram access |
| `cookieOptions.browserCookies` | string | ❌ | Browser to extract cookies from ("chrome", "firefox", "safari", "edge", "opera", "brave") |
| `cookieOptions.cookiesFile` | string | ❌ | Path to cookies.txt file |

## 📊 Response Format

```json
{
  "keywords": {
    "primary": ["fashion", "style", "outfit", "trendy"],
    "secondary": ["clothes", "accessories", "shopping", "beauty"],
    "hashtags": ["#fashion", "#style", "#ootd", "#trending"],
    "mentions": ["@brand", "@influencer"],
    "topics": ["fashion", "lifestyle"]
  },
  "metadata": {
    "caption": "Check out this amazing outfit! #fashion #style",
    "transcript": "Hey everyone, today I'm showing you this amazing outfit...",
    "ocrText": "SALE 50% OFF",
    "duration": 30,
    "username": "fashionista"
  },
  "searchableTerms": [
    "fashion", "style", "outfit", "trendy", "clothes", "accessories",
    "shopping", "beauty", "fashion", "lifestyle", "video", "reel",
    "instagram", "social", "content", "viral", "trending"
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

## 🔍 Keyword Categories

### Primary Keywords
- Most important terms for search
- Extracted using TF-IDF-like algorithm
- Prioritizes words that appear in captions
- Limited to top 10 most relevant terms

### Secondary Keywords
- Supporting terms and context
- Related to primary keywords
- Provides additional search context
- Limited to top 15 terms

### Hashtags
- All hashtags from the Instagram caption
- Includes the # symbol
- Useful for hashtag-based discovery

### Mentions
- All @mentions from the Instagram caption
- Includes the @ symbol
- Useful for user-based discovery

### Topics
- Content category classification
- Automatically detected from content
- Categories: fashion, beauty, food, travel, fitness, technology, lifestyle, entertainment, education, business

### Searchable Terms
- Combined list of all terms optimized for search
- Includes primary keywords, hashtags (without #), mentions (without @), topics, and common search terms
- Limited to 50 terms for optimal search performance

## 🛠️ Technical Implementation

### Processing Pipeline

1. **Media Extraction**: Downloads Instagram Reel video
2. **Parallel Processing**: Runs ASR (speech-to-text) and OCR (text extraction) simultaneously
3. **Text Combination**: Combines caption, transcript, and OCR text
4. **Keyword Extraction**: Uses TF-IDF-like algorithm to identify important terms
5. **Topic Classification**: Categorizes content into predefined topics
6. **Search Optimization**: Generates searchable terms for discovery

### Performance

- **Typical processing time**: 2-5 seconds
- **Supported languages**: English, Spanish, French, Hindi, Tamil
- **Video duration limit**: 60 seconds (configurable)
- **Concurrent processing**: ASR and OCR run in parallel

## 🧪 Testing

### Using cURL

```bash
curl -X POST http://localhost:3000/v1/keywords/extract \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123DEF456/",
    "languageHint": "en",
    "cookieOptions": {
      "browserCookies": "chrome"
    }
  }'
```

### Using the Test Script

```bash
# Make sure the API server is running
cd apps/api && npm run dev

# Run the test script
./test-keywords-api.sh
```

## 🔧 Configuration

### Environment Variables

```env
# API Server
NODE_ENV=development
PORT=3000
WORKER_PYTHON_URL=http://localhost:8000

# Instagram Processing
INSTAGRAM_COOKIES_PATH=/path/to/cookies
INSTAGRAM_RATE_LIMIT=10

# Keyword Extraction
KEYWORD_MAX_PRIMARY=10
KEYWORD_MAX_SECONDARY=15
KEYWORD_MAX_SEARCHABLE=50
```

### Rate Limiting

- **Default limit**: 60 requests per minute per IP
- **Instagram-specific**: 10 requests per minute for Instagram downloads
- **Concurrent processing**: Up to 5 simultaneous extractions

## 🚨 Error Handling

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data or URL format |
| `INSTAGRAM_DOWNLOAD_FAILED` | 500 | Failed to download Instagram Reel |
| `ASR_PROCESSING_FAILED` | 500 | Speech-to-text processing failed |
| `OCR_PROCESSING_FAILED` | 500 | Text extraction from images failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Error Response Format

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": [
    {
      "path": ["instagramReelUrl"],
      "message": "Must be a valid Instagram Reel URL"
    }
  ]
}
```

## 🔒 Security Considerations

- **Authentication required**: All requests must include valid JWT token
- **Rate limiting**: Prevents abuse and ensures fair usage
- **Input validation**: Strict validation of Instagram URLs
- **Cookie handling**: Secure handling of browser cookies for Instagram access
- **Data privacy**: No persistent storage of extracted content

## 📈 Use Cases

### Content Discovery
- **Search optimization**: Use extracted keywords for better search results
- **Content categorization**: Automatically tag content by topics
- **Trend analysis**: Identify trending keywords and topics

### SEO and Marketing
- **Hashtag research**: Discover relevant hashtags for content
- **Keyword research**: Find high-value keywords for content strategy
- **Competitor analysis**: Analyze competitor content keywords

### Content Moderation
- **Topic classification**: Automatically categorize content
- **Keyword filtering**: Filter content based on keyword presence
- **Trend monitoring**: Track trending topics and keywords

## 🚀 Getting Started

1. **Start the services**:
   ```bash
   # Start API server
   cd apps/api && npm run dev
   
   # Start Python worker
   cd apps/worker-python && python main.py
   ```

2. **Get authentication token**:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "your-email", "password": "your-password"}'
   ```

3. **Test the endpoint**:
   ```bash
   ./test-keywords-api.sh
   ```

## 📚 Related APIs

- **Analysis API**: `/v1/analyze` - Full content analysis with compliance checking
- **Health API**: `/health` - Service health checks
- **Auth API**: `/auth/*` - Authentication endpoints

## 🤝 Contributing

To add new keyword extraction features:

1. **Add new topic categories** in `keyword-extractor.ts`
2. **Enhance keyword algorithms** in the extraction functions
3. **Add new metadata fields** in the response interface
4. **Update tests** in the test script

## 📄 License

MIT License - see LICENSE file for details.
