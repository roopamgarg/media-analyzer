# Postman Collection v2 Guide

This guide explains how to use the updated Media Analyzer Postman collection v2 with all endpoints including the new keyword extraction API, Instagram Reel analysis, cookie support, and Python worker endpoints.

## 🚀 **Quick Start**

1. **Import the Collection**: Import `postman-collection-v2.json` into Postman
2. **Set Environment Variables**: Update the variables in the collection
3. **Start Services**: Ensure both API and Python worker are running
4. **Test Endpoints**: Use the pre-configured requests

## 📋 **Collection Overview**

The collection now includes **25+ endpoints** organized into these categories:

### **🔐 Authentication Endpoints**
- **Get Demo Token** - Get a demo JWT token for testing
- **Login** - Authenticate with email/password
- **Register** - Create new user account
- **Verify Token** - Validate JWT token

### **📊 Content Analysis Endpoints**
- **Analyze Video (URL)** - Analyze video from URL
- **Analyze Instagram Reel (Basic)** - Basic Instagram analysis
- **Analyze Instagram Reel (with Chrome Cookies)** - With Chrome browser cookies
- **Analyze Instagram Reel (with Cookies File)** - With custom cookies file
- **Get Analysis Status** - Check analysis progress

### **🔍 Keyword Extraction Endpoints** ⭐ NEW
- **Extract Keywords (Basic)** - Basic keyword extraction from Instagram Reels
- **Extract Keywords (with Chrome Cookies)** - With Chrome browser cookies
- **Extract Keywords (with Cookies File)** - With custom cookies file
- **Keywords Health Check** - Keyword extraction service health

### **🔧 System Endpoints**
- **API Health Check** - API health status
- **Get Config (Debug)** - Runtime configuration
- **Get Metrics** - System metrics

### **🐍 Python Worker Endpoints**
- **Worker Health Check** - Worker health status
- **Download Instagram (Basic)** - Basic download
- **Download Instagram (Chrome Cookies)** - With Chrome cookies
- **Download Instagram (Firefox Cookies)** - With Firefox cookies
- **Download Instagram (Cookies File)** - With cookies file
- **ASR (Speech Recognition)** - Audio transcription
- **OCR (Text Recognition)** - Image text extraction

## 🔧 **Environment Variables**

The collection uses these variables (automatically set):

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:3000` | Main API server URL |
| `worker_python_url` | `http://localhost:8000` | Python worker URL |
| `jwt_token` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Pre-configured demo token |
| `analysis_id` | `an_abc123` | Sample analysis ID |
| `instagram_reel_url` | `https://www.instagram.com/reels/DO3i-MviVuG/` | Test Instagram URL |
| `cookies_file_path` | `/path/to/instagram_cookies.txt` | Cookies file path |

## 🆕 **New Keyword Extraction API**

### **Basic Keyword Extraction**
```json
{
  "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
  "languageHint": "en"
}
```

### **With Browser Cookies**
```json
{
  "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
  "languageHint": "en",
  "cookieOptions": {
    "browserCookies": "chrome"
  }
}
```

### **With Cookies File**
```json
{
  "instagramReelUrl": "https://www.instagram.com/reel/ABC123/",
  "languageHint": "en",
  "cookieOptions": {
    "cookiesFile": "/path/to/cookies.txt"
  }
}
```

### **Expected Response**
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

## 🧪 **Testing Workflows**

### **Workflow 1: Basic Health Check**
1. **API Health Check** → Should return `{"status":"ok"}`
2. **Worker Health Check** → Should return `{"status":"ok","service":"worker-python"}`
3. **Keywords Health Check** → Should return `{"status":"ok","service":"keyword-extractor"}`

### **Workflow 2: Authentication Flow**
1. **Get Demo Token** → Copy token to `jwt_token` variable
2. **Verify Token** → Should return user info
3. **Login** (optional) → Alternative authentication method

### **Workflow 3: Instagram Analysis**
1. **Analyze Instagram Reel (with Chrome Cookies)** → Should return analysis ID
2. **Get Analysis Status** → Use the analysis ID from step 1
3. **Check response** → Should show completed analysis with scores and flags

### **Workflow 4: Keyword Extraction** ⭐ NEW
1. **Extract Keywords (with Chrome Cookies)** → Should return keywords and metadata
2. **Check response** → Should show primary/secondary keywords, hashtags, topics
3. **Use searchableTerms** → For search optimization

### **Workflow 5: Direct Worker Testing**
1. **Download Instagram (Chrome Cookies)** → Test direct download
2. **ASR** → Test speech recognition with audio file
3. **OCR** → Test text extraction with image files

## 🔍 **Keyword Extraction Features**

### **Keyword Types**
- **Primary Keywords**: Most important terms (TF-IDF algorithm)
- **Secondary Keywords**: Supporting context terms
- **Hashtags**: All hashtags from captions
- **Mentions**: All @mentions from captions
- **Topics**: Auto-categorized content (fashion, beauty, food, etc.)
- **Searchable Terms**: Combined optimized terms for search

### **Topic Categories**
- `fashion` - Style, outfits, clothing
- `beauty` - Makeup, skincare, cosmetics
- `food` - Recipes, cooking, restaurants
- `travel` - Destinations, trips, adventures
- `fitness` - Workouts, health, exercise
- `technology` - Apps, gadgets, digital
- `lifestyle` - Daily routines, personal life
- `entertainment` - Fun, comedy, music
- `education` - Learning, tutorials, courses
- `business` - Work, career, professional

### **Use Cases**
- **Content Discovery**: Optimize search with extracted keywords
- **SEO & Marketing**: Research hashtags and keywords
- **Content Moderation**: Auto-categorize content
- **Trend Analysis**: Track trending topics
- **Competitor Analysis**: Analyze competitor strategies

## 🍪 **Cookie Usage Examples**

### **Method 1: Chrome Browser Cookies**
```json
{
  "cookieOptions": {
    "browserCookies": "chrome"
  }
}
```

### **Method 2: Firefox Browser Cookies**
```json
{
  "cookieOptions": {
    "browserCookies": "firefox"
  }
}
```

### **Method 3: Custom Cookies File**
```json
{
  "cookieOptions": {
    "cookiesFile": "/path/to/cookies.txt"
  }
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port Conflicts**: Ensure ports 3000 and 8000 are available
2. **Cookie Errors**: Make sure you're logged into Instagram in your browser
3. **Authentication**: Verify JWT token is valid and not expired
4. **File Paths**: Update `cookies_file_path` to actual file location
5. **Keyword Extraction**: Ensure Python worker is running for ASR/OCR

### **Error Responses**

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

## 🔄 **Auto-Configuration Features**

The collection includes automatic configuration:

- **Auto JWT Token**: Automatically extracts and sets JWT token from demo token response
- **Auto Analysis ID**: Automatically extracts analysis ID from analysis responses
- **Response Logging**: Logs response times and errors
- **Error Detection**: Automatically detects and logs errors

## 📝 **Best Practices**

1. **Use Variables**: Always use collection variables for URLs and tokens
2. **Test Health First**: Always check health endpoints before analysis
3. **Handle Errors**: Check response status and error messages
4. **Rate Limiting**: Don't make too many requests too quickly
5. **Cookie Freshness**: Refresh browser cookies if downloads fail
6. **Keyword Testing**: Test keyword extraction with different content types

## 🎯 **Quick Test Sequences**

### **Sequence 1: Full Analysis Flow**
1. **API Health Check** → `{"status":"ok"}`
2. **Get Demo Token** → Copy to `jwt_token`
3. **Analyze Instagram Reel (with Chrome Cookies)** → Get analysis ID
4. **Get Analysis Status** → Check completion

### **Sequence 2: Keyword Extraction Flow** ⭐ NEW
1. **API Health Check** → `{"status":"ok"}`
2. **Get Demo Token** → Copy to `jwt_token`
3. **Extract Keywords (with Chrome Cookies)** → Get keywords
4. **Check searchableTerms** → Use for search optimization

### **Sequence 3: Worker Testing**
1. **Worker Health Check** → `{"status":"ok"}`
2. **Download Instagram (Chrome Cookies)** → Test download
3. **ASR** → Test with audio file
4. **OCR** → Test with image files

## 🔗 **Related Documentation**

- [Keyword Extraction API](./KEYWORD_EXTRACTION_API.md) - Detailed keyword API documentation
- [Instagram Cookies Guide](./INSTAGRAM_COOKIES_GUIDE.md) - Cookie setup instructions
- [API Documentation](./README.md) - Complete API reference
- [Python Worker Setup](./apps/worker-python/README.md) - Worker configuration

## 📞 **Support**

If you encounter issues:
1. Check the terminal logs for detailed error messages
2. Verify all services are running (`npm run dev` and `python main.py`)
3. Ensure you're logged into Instagram in your browser
4. Try different browser cookies if one fails
5. Check Python worker is running for keyword extraction

## 🆕 **What's New in v2**

- ✅ **Keyword Extraction API** - New endpoint for extracting searchable keywords
- ✅ **Organized Categories** - Better organization with emoji categories
- ✅ **Auto-Configuration** - Automatic JWT token and analysis ID extraction
- ✅ **Enhanced Error Handling** - Better error detection and logging
- ✅ **Comprehensive Testing** - More test scenarios and workflows
- ✅ **Updated Documentation** - Complete guide with examples
