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

## 🚀 Enhanced Keyword Extraction API

### Overview

The Enhanced Keyword Extraction API provides advanced semantic analysis capabilities beyond the basic keyword extraction. It includes n-gram extraction, sentiment analysis, intent detection, entity extraction, and confidence-scored topic classification.

### Endpoint

```
POST /v1/keywords/extract-enhanced
```

### Request Body

```json
{
  "instagramReelUrl": "https://www.instagram.com/reel/ABC123DEF456/",
  "languageHint": "en",
  "cookieOptions": {
    "browserCookies": "chrome",
    "cookiesFile": "/path/to/cookies.txt"
  },
  "options": {
    "includeNgrams": true,
    "includeSentiment": true,
    "includeIntent": true,
    "includeEntities": true
  },
  "async": false
}
```

### Enhanced Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instagramReelUrl` | string | ✅ | Instagram Reel URL to analyze |
| `languageHint` | string | ❌ | Language hint for ASR (e.g., "en", "es", "fr") |
| `cookieOptions` | object | ❌ | Cookie configuration for Instagram access |
| `options` | object | ❌ | Feature toggles for enhanced analysis |
| `options.includeNgrams` | boolean | ❌ | Extract n-grams and phrases (default: true) |
| `options.includeSentiment` | boolean | ❌ | Perform sentiment analysis (default: true) |
| `options.includeIntent` | boolean | ❌ | Detect user intent (default: true) |
| `options.includeEntities` | boolean | ❌ | Extract entities (default: true) |
| `async` | boolean | ❌ | Process asynchronously (default: false) |

### Enhanced Response Format

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
    "secondary": ["skincare", "beauty", "skin", "care"],
    "phrases": [
      {
        "text": "skincare routine",
        "frequency": 3,
        "significance": 0.8
      }
    ],
    "hashtags": ["#skincare", "#beauty", "#routine"],
    "mentions": ["@beautyexpert"]
  },
  "topics": {
    "primary": {
      "category": "fashion",
      "subcategory": "skincare",
      "confidence": 0.92
    },
    "secondary": [
      {
        "category": "beauty",
        "confidence": 0.85
      }
    ]
  },
  "sentiment": {
    "overall": "positive",
    "score": 3.2,
    "comparative": 0.8,
    "emotions": ["excitement", "curiosity"]
  },
  "intent": {
    "primary": "educate",
    "secondary": ["inform", "inspire"],
    "confidence": 0.9
  },
  "entities": {
    "brands": ["Nike", "Apple"],
    "products": ["cleanser", "moisturizer"],
    "people": ["influencer", "expert"],
    "prices": ["$50", "$25"],
    "locations": ["New York", "Los Angeles"]
  },
  "metadata": {
    "caption": "Amazing skincare routine! #skincare #beauty",
    "transcript": "This is an amazing skincare routine for beginners",
    "ocrText": "Brand Name - $50",
    "duration": 30,
    "username": "beautyexpert",
    "complexity": "moderate"
  },
  "searchableTerms": [
    "skincare", "routine", "beauty", "fashion", "skincare", "beauty",
    "video", "reel", "instagram", "social", "content", "viral", "trending"
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

### Enhanced Features

#### 1. N-gram and Phrase Extraction
- Extracts meaningful multi-word phrases
- Scores phrases by frequency and significance
- Supports bigrams and trigrams

#### 2. Sentiment Analysis
- Overall sentiment: positive, negative, neutral
- Sentiment score: -5 to 5 scale
- Emotion detection: excitement, curiosity, frustration, etc.

#### 3. Intent Detection
- Primary intent: educate, entertain, promote, inspire, inform
- Secondary intents with confidence scores
- Pattern-based detection with keyword matching

#### 4. Entity Extraction
- **Brands**: Company names and organizations
- **Products**: Product categories and names
- **People**: Person names and influencers
- **Prices**: Monetary values and price points
- **Locations**: Geographic locations and places

#### 5. Topic Classification with Confidence
- Primary topic with subcategory
- Confidence scores for topic relevance
- Secondary topics with relevance scores
- Support for hierarchical topic structure

#### 6. Content Complexity Analysis
- **Simple**: Basic vocabulary, short sentences
- **Moderate**: Intermediate complexity
- **Complex**: Technical terms, long sentences, advanced concepts

### Use Cases

#### Content Recommendation
- Match user queries with semantically similar content
- Understand content intent for better categorization
- Analyze sentiment for appropriate content filtering

#### SEO and Marketing
- Extract meaningful phrases for better search optimization
- Understand content sentiment for brand alignment
- Identify entities for targeted marketing

#### Content Moderation
- Detect inappropriate sentiment or intent
- Classify content topics for filtering
- Analyze content complexity for audience targeting

### Performance Considerations

- **Processing time**: 3-8 seconds (vs 2-5 for basic)
- **Memory usage**: Higher due to NLP libraries
- **Accuracy**: Significantly improved semantic understanding
- **Scalability**: Consider async processing for high volume

### When to Use Enhanced vs Basic

**Use Enhanced when:**
- Building recommendation systems
- Need semantic understanding
- Require sentiment analysis
- Want entity extraction
- Building LLM training data

**Use Basic when:**
- Simple keyword extraction is sufficient
- Performance is critical
- Processing high volume with minimal latency
- Basic search functionality

### Error Handling

Enhanced endpoint uses the same error codes as the basic endpoint:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data or URL format |
| `INSTAGRAM_DOWNLOAD_FAILED` | 500 | Failed to download Instagram Reel |
| `ASR_PROCESSING_FAILED` | 500 | Speech-to-text processing failed |
| `OCR_PROCESSING_FAILED` | 500 | Text extraction from images failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Testing Enhanced Endpoint

```bash
curl -X POST http://localhost:3000/v1/keywords/extract-enhanced \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt-token>" \
  -d '{
    "instagramReelUrl": "https://www.instagram.com/reel/ABC123DEF456/",
    "languageHint": "en",
    "options": {
      "includeNgrams": true,
      "includeSentiment": true,
      "includeIntent": true,
      "includeEntities": true
    }
  }'
```

## 📄 License

MIT License - see LICENSE file for details.
