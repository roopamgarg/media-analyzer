# Postman Collection Guide

This guide explains how to use the updated Media Analyzer Postman collection with all the new cookie functionality and endpoints.

## 🚀 **Quick Start**

1. **Import the Collection**: Import `postman-collection.json` into Postman
2. **Set Environment Variables**: Update the variables in the collection
3. **Start Services**: Ensure both API and Python worker are running
4. **Test Endpoints**: Use the pre-configured requests

## 📋 **Collection Overview**

The collection now includes **17 endpoints** organized into these categories:

### **🔐 Authentication Endpoints**
- **Get Demo Token** - Get a demo JWT token for testing
- **Login** - Authenticate with email/password
- **Register** - Create new user account
- **Verify Token** - Validate JWT token

### **📊 Analysis Endpoints**
- **Analyze Video (URL)** - Analyze video from URL
- **Analyze Instagram Reel (Basic)** - Basic Instagram analysis
- **Analyze Instagram Reel (with Chrome Cookies)** - With Chrome browser cookies
- **Analyze Instagram Reel (with Cookies File)** - With custom cookies file
- **Get Analysis Status** - Check analysis progress

### **🔧 System Endpoints**
- **Health Check** - API health status
- **Get Config (Debug)** - Runtime configuration
- **Get Metrics** - System metrics

### **🐍 Python Worker Endpoints**
- **Python Worker - Health Check** - Worker health status
- **Python Worker - Download Instagram (Basic)** - Basic download
- **Python Worker - Download Instagram (Chrome Cookies)** - With Chrome cookies
- **Python Worker - Download Instagram (Firefox Cookies)** - With Firefox cookies
- **Python Worker - Download Instagram (Cookies File)** - With cookies file
- **Python Worker - ASR (Speech Recognition)** - Audio transcription
- **Python Worker - OCR (Text Recognition)** - Image text extraction

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

## 🍪 **Cookie Usage Examples**

### **Method 1: Chrome Browser Cookies**

```json
{
  "input": {
    "instagramReelUrl": "{{instagram_reel_url}}"
  },
  "options": {
    "cookieOptions": {
      "browserCookies": "chrome"
    }
  }
}
```

### **Method 2: Firefox Browser Cookies**

```json
{
  "input": {
    "instagramReelUrl": "{{instagram_reel_url}}"
  },
  "options": {
    "cookieOptions": {
      "browserCookies": "firefox"
    }
  }
}
```

### **Method 3: Custom Cookies File**

```json
{
  "input": {
    "instagramReelUrl": "{{instagram_reel_url}}"
  },
  "options": {
    "cookieOptions": {
      "cookiesFile": "{{cookies_file_path}}"
    }
  }
}
```

## 🧪 **Testing Workflow**

### **Step 1: Health Checks**
1. Run **Health Check** to verify API is running
2. Run **Python Worker - Health Check** to verify worker is running

### **Step 2: Authentication**
1. Run **Get Demo Token** to get a JWT token
2. Copy the token to the `jwt_token` variable
3. Run **Verify Token** to confirm authentication

### **Step 3: Instagram Analysis**
1. **Basic Test**: Run **Analyze Instagram Reel (Basic)**
2. **With Cookies**: Run **Analyze Instagram Reel (with Chrome Cookies)**
3. **Check Status**: Use **Get Analysis Status** with the returned analysis ID

### **Step 4: Direct Worker Testing**
1. **Download Test**: Run **Python Worker - Download Instagram (Chrome Cookies)**
2. **ASR Test**: Run **Python Worker - ASR** with an audio file
3. **OCR Test**: Run **Python Worker - OCR** with image files

## 🔍 **Expected Responses**

### **Successful Instagram Download**
```json
{
  "success": true,
  "video_path": "/tmp/instagram_reel_ABC123.mp4",
  "caption": "Sample Instagram Reel caption",
  "username": "sample_user",
  "duration": 30.5,
  "error": null
}
```

### **Successful Analysis**
```json
{
  "id": "an_abc123",
  "status": "completed",
  "scores": {
    "risk": 0.2,
    "vibe": 0.8
  },
  "flags": ["positive_tone", "brand_aligned"],
  "evidence": {
    "frames": [...],
    "transcript": "...",
    "caption": "..."
  }
}
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port Conflicts**: Ensure ports 3000 and 8000 are available
2. **Cookie Errors**: Make sure you're logged into Instagram in your browser
3. **Authentication**: Verify JWT token is valid and not expired
4. **File Paths**: Update `cookies_file_path` to actual file location

### **Error Responses**

```json
{
  "success": false,
  "error": "Instagram download failed: rate-limit reached or login required"
}
```

## 🔄 **Cookie Management**

### **Supported Browsers**
- `chrome` - Google Chrome
- `firefox` - Mozilla Firefox
- `safari` - Safari (macOS)
- `edge` - Microsoft Edge
- `opera` - Opera
- `brave` - Brave Browser

### **Cookie File Format**
The cookies file should be in Netscape format:
```
# Netscape HTTP Cookie File
.instagram.com	TRUE	/	FALSE	1234567890	sessionid	your_session_id_here
```

## 📝 **Best Practices**

1. **Use Variables**: Always use collection variables for URLs and tokens
2. **Test Health First**: Always check health endpoints before analysis
3. **Handle Errors**: Check response status and error messages
4. **Rate Limiting**: Don't make too many requests too quickly
5. **Cookie Freshness**: Refresh browser cookies if downloads fail

## 🎯 **Quick Test Sequence**

1. **Health Check** → Should return `{"status":"ok"}`
2. **Get Demo Token** → Copy token to `jwt_token` variable
3. **Analyze Instagram Reel (with Chrome Cookies)** → Should return analysis ID
4. **Get Analysis Status** → Use the analysis ID from step 3

## 🔗 **Related Documentation**

- [Instagram Cookies Guide](./INSTAGRAM_COOKIES_GUIDE.md) - Detailed cookie setup
- [API Documentation](./README.md) - Complete API reference
- [Python Worker Setup](./apps/worker-python/README.md) - Worker configuration

## 📞 **Support**

If you encounter issues:
1. Check the terminal logs for detailed error messages
2. Verify all services are running (`npm run dev` and `npm run worker:python`)
3. Ensure you're logged into Instagram in your browser
4. Try different browser cookies if one fails
