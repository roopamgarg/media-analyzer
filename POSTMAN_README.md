# Postman Collections for Media Analyzer API

This directory contains comprehensive Postman collections for testing the Media Analyzer API, including the new keyword extraction functionality.

## 📁 **Files Overview**

| File | Description | Version |
|------|-------------|---------|
| `postman-collection-v2.json` | **Latest collection** with keyword extraction API | v2.0 |
| `postman-collection.json` | Original collection (legacy) | v1.0 |
| `POSTMAN_COLLECTION_V2_GUIDE.md` | Complete usage guide for v2 | - |
| `POSTMAN_COLLECTION_GUIDE.md` | Original guide (legacy) | - |
| `import-postman-collection.sh` | Setup script for easy import | - |

## 🚀 **Quick Start**

### **Option 1: Automated Setup**
```bash
# Run the setup script
./import-postman-collection.sh
```

### **Option 2: Manual Setup**
1. **Start Services**:
   ```bash
   # Terminal 1: API Server
   cd apps/api && npm run dev
   
   # Terminal 2: Python Worker
   cd apps/worker-python && python main.py
   ```

2. **Import Collection**:
   - Open Postman
   - Click "Import"
   - Select `postman-collection-v2.json`
   - Click "Import"

3. **Configure Variables**:
   - `base_url`: `http://localhost:3000`
   - `worker_python_url`: `http://localhost:8000`
   - `instagram_reel_url`: Your test Instagram URL
   - `cookies_file_path`: Path to your cookies file

## 📋 **Collection Features**

### **🔐 Authentication (4 endpoints)**
- Get Demo Token
- Login
- Register
- Verify Token

### **📊 Content Analysis (5 endpoints)**
- Analyze Video (URL)
- Analyze Instagram Reel (Basic)
- Analyze Instagram Reel (with Chrome Cookies)
- Analyze Instagram Reel (with Cookies File)
- Get Analysis Status

### **🔍 Keyword Extraction (4 endpoints)** ⭐ NEW
- Extract Keywords (Basic)
- Extract Keywords (with Chrome Cookies)
- Extract Keywords (with Cookies File)
- Keywords Health Check

### **🔧 System & Health (3 endpoints)**
- API Health Check
- Get Metrics
- Get Config (Debug)

### **🐍 Python Worker (7 endpoints)**
- Worker Health Check
- Download Instagram (Basic)
- Download Instagram (Chrome Cookies)
- Download Instagram (Firefox Cookies)
- Download Instagram (Cookies File)
- ASR (Speech Recognition)
- OCR (Text Recognition)

## 🆕 **What's New in v2**

### **Keyword Extraction API**
- **Primary Keywords**: Most important terms for search
- **Secondary Keywords**: Supporting context terms
- **Hashtags**: All hashtags from captions
- **Mentions**: All @mentions from captions
- **Topics**: Auto-categorized content (fashion, beauty, food, etc.)
- **Searchable Terms**: Combined optimized terms for search

### **Enhanced Organization**
- **Emoji Categories**: Better visual organization
- **Auto-Configuration**: Automatic JWT token and analysis ID extraction
- **Enhanced Error Handling**: Better error detection and logging
- **Comprehensive Testing**: More test scenarios and workflows

## 🧪 **Testing Workflows**

### **Workflow 1: Health Check**
```
API Health Check → Worker Health Check → Keywords Health Check
```

### **Workflow 2: Authentication**
```
Get Demo Token → Verify Token → (Optional) Login
```

### **Workflow 3: Keyword Extraction** ⭐ NEW
```
Extract Keywords (with Chrome Cookies) → Check Keywords Response
```

### **Workflow 4: Content Analysis**
```
Analyze Instagram Reel (with Chrome Cookies) → Get Analysis Status
```

### **Workflow 5: Direct Worker Testing**
```
Download Instagram (Chrome Cookies) → ASR → OCR
```

## 🔧 **Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `base_url` | `http://localhost:3000` | Main API server URL |
| `worker_python_url` | `http://localhost:8000` | Python worker URL |
| `jwt_token` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | JWT authentication token |
| `analysis_id` | `an_abc123` | Sample analysis ID |
| `instagram_reel_url` | `https://www.instagram.com/reels/DO3i-MviVuG/` | Test Instagram URL |
| `cookies_file_path` | `/path/to/instagram_cookies.txt` | Cookies file path |

## 🍪 **Cookie Configuration**

### **Browser Cookies**
```json
{
  "cookieOptions": {
    "browserCookies": "chrome"  // or "firefox", "safari", "edge", "opera", "brave"
  }
}
```

### **Cookies File**
```json
{
  "cookieOptions": {
    "cookiesFile": "/path/to/cookies.txt"
  }
}
```

## 📊 **Expected Responses**

### **Keyword Extraction Response**
```json
{
  "keywords": {
    "primary": ["fashion", "style", "outfit"],
    "secondary": ["clothes", "accessories", "shopping"],
    "hashtags": ["#fashion", "#style", "#ootd"],
    "mentions": ["@brand", "@influencer"],
    "topics": ["fashion", "lifestyle"]
  },
  "metadata": {
    "caption": "Check out this amazing outfit! #fashion",
    "transcript": "Hey everyone, today I'm showing you...",
    "ocrText": "SALE 50% OFF",
    "duration": 30,
    "username": "fashionista"
  },
  "searchableTerms": ["fashion", "style", "outfit", "clothes", "accessories", "shopping", "beauty", "lifestyle", "video", "reel", "instagram", "social", "content", "viral", "trending"],
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

### **Analysis Response**
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

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port Conflicts**
   - Ensure ports 3000 and 8000 are available
   - Check if services are running: `lsof -i :3000` and `lsof -i :8000`

2. **Authentication Errors**
   - Verify JWT token is valid and not expired
   - Run "Get Demo Token" to get a fresh token

3. **Instagram Download Failures**
   - Make sure you're logged into Instagram in your browser
   - Try different browser cookies (chrome, firefox, safari)
   - Check cookies file path is correct

4. **Python Worker Issues**
   - Ensure Python worker is running: `python main.py`
   - Check worker health: `GET http://localhost:8000/health`

5. **Keyword Extraction Failures**
   - Ensure Python worker is running for ASR/OCR
   - Check Instagram URL is valid and accessible
   - Verify cookie configuration

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

## 📝 **Best Practices**

1. **Always Test Health First**
   - Run health checks before analysis
   - Verify all services are running

2. **Use Variables**
   - Always use collection variables for URLs and tokens
   - Update variables when switching environments

3. **Handle Rate Limiting**
   - Don't make too many requests too quickly
   - Wait between requests if needed

4. **Cookie Management**
   - Refresh browser cookies if downloads fail
   - Use different browsers for testing

5. **Error Handling**
   - Check response status codes
   - Read error messages for debugging

## 🔗 **Related Documentation**

- [Keyword Extraction API](./KEYWORD_EXTRACTION_API.md) - Detailed keyword API documentation
- [Instagram Cookies Guide](./INSTAGRAM_COOKIES_GUIDE.md) - Cookie setup instructions
- [API Documentation](./README.md) - Complete API reference
- [Python Worker Setup](./apps/worker-python/README.md) - Worker configuration

## 📞 **Support**

If you encounter issues:

1. **Check Logs**: Look at terminal output for detailed error messages
2. **Verify Services**: Ensure both API and Python worker are running
3. **Test Health**: Run health check endpoints first
4. **Check Authentication**: Verify JWT token is valid
5. **Try Different Cookies**: Switch between browser cookies if one fails

## 🎯 **Quick Test Sequence**

1. **Health Check** → API Health Check
2. **Authentication** → Get Demo Token
3. **Keyword Extraction** → Extract Keywords (with Chrome Cookies) ⭐ NEW
4. **Content Analysis** → Analyze Instagram Reel (with Chrome Cookies)
5. **Check Results** → Verify responses contain expected data

## 🆕 **Version History**

### **v2.0 (Current)**
- ✅ Added Keyword Extraction API
- ✅ Organized categories with emojis
- ✅ Auto-configuration features
- ✅ Enhanced error handling
- ✅ Comprehensive testing workflows

### **v1.0 (Legacy)**
- ✅ Basic analysis endpoints
- ✅ Instagram Reel support
- ✅ Cookie configuration
- ✅ Python worker integration

---

**Ready to test?** Import `postman-collection-v2.json` and start exploring the Media Analyzer API! 🚀
