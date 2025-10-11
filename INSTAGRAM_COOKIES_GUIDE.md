# Instagram Cookies Guide for yt-dlp

This guide explains how to use browser cookies with yt-dlp to bypass Instagram rate limiting and authentication issues.

## Why Use Cookies?

Instagram has implemented rate limiting and authentication requirements that can block automated downloads. Using cookies from your logged-in browser session helps bypass these restrictions.

## Method 1: Using Browser Cookies Directly (Recommended)

### Step 1: Log into Instagram
1. Open Chrome (or your preferred browser)
2. Go to https://www.instagram.com
3. Log into your Instagram account
4. **Important**: Keep the browser open and logged in

### Step 2: Use Browser Cookies in Code

```python
# In your Python code
from instagram_downloader import InstagramDownloader

# Use Chrome cookies directly
downloader = InstagramDownloader(browser_cookies='chrome')
result = downloader.download_reel('https://www.instagram.com/reels/ABC123/')

# Or use other browsers
downloader = InstagramDownloader(browser_cookies='firefox')
downloader = InstagramDownloader(browser_cookies='safari')
```

### Step 3: Test with API

```bash
curl -X POST http://localhost:8000/download-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reels/ABC123/",
    "browser_cookies": "chrome"
  }'
```

## Method 2: Using Cookies File

### Step 1: Extract Cookies

```bash
# Navigate to the worker-python directory
cd apps/worker-python

# Run the cookie extraction script
python extract_cookies.py
```

### Step 2: Use Cookies File

```python
# In your Python code
downloader = InstagramDownloader(cookies_file='/path/to/cookies.txt')
result = downloader.download_reel('https://www.instagram.com/reels/ABC123/')
```

### Step 3: Test with API

```bash
curl -X POST http://localhost:8000/download-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reels/ABC123/",
    "cookies_file": "/path/to/cookies.txt"
  }'
```

## Method 3: Manual Cookie Extraction

### Step 1: Export Cookies from Browser

1. Install a browser extension like "Get cookies.txt" or "cookies.txt"
2. Go to Instagram and log in
3. Use the extension to export cookies in Netscape format
4. Save as `instagram_cookies.txt`

### Step 2: Use the Cookies File

```python
downloader = InstagramDownloader(cookies_file='instagram_cookies.txt')
```

## Supported Browsers

yt-dlp supports cookies from these browsers:
- `chrome` - Google Chrome
- `firefox` - Mozilla Firefox  
- `safari` - Safari (macOS only)
- `edge` - Microsoft Edge
- `opera` - Opera
- `brave` - Brave Browser

## Troubleshooting

### Error: "Requested content is not available, rate-limit reached or login required"

**Solution**: Use cookies from a logged-in browser session

```python
# Make sure you're logged into Instagram in Chrome first
downloader = InstagramDownloader(browser_cookies='chrome')
```

### Error: "Cookies database not found"

**Solution**: 
1. Make sure the browser is installed
2. Try a different browser
3. Use cookies file method instead

### Error: "Permission denied" (macOS)

**Solution**: Grant permission to access browser data
1. Go to System Preferences > Security & Privacy > Privacy
2. Add your terminal/Python to "Full Disk Access"

### Cookies Not Working

**Solutions**:
1. **Log in fresh**: Log out and log back into Instagram
2. **Try different browser**: Switch from Chrome to Firefox
3. **Update yt-dlp**: `pip install --upgrade yt-dlp`
4. **Check Instagram status**: Instagram might be blocking automated access

## Best Practices

1. **Keep browser logged in**: Don't close the browser after logging in
2. **Use private/incognito mode**: Avoid conflicts with other sessions
3. **Rotate browsers**: If one browser gets blocked, try another
4. **Respect rate limits**: Don't make too many requests too quickly
5. **Update regularly**: Keep yt-dlp updated for latest Instagram changes

## Legal Considerations

- Only download content you have permission to access
- Respect Instagram's Terms of Service
- Don't use for commercial purposes without permission
- Consider using Instagram's official APIs for production use

## Example Usage in Media Analyzer

```typescript
// In your analysis request
const analysisRequest = {
  input: {
    instagramReelUrl: "https://www.instagram.com/reels/ABC123/"
  },
  // Add cookie options
  cookieOptions: {
    browserCookies: "chrome"  // or cookiesFile: "/path/to/cookies.txt"
  },
  // ... rest of your request
};
```

## Testing Your Setup

```bash
# Test cookie extraction
cd apps/worker-python
python extract_cookies.py

# Test Instagram download with cookies
curl -X POST http://localhost:8000/download-instagram \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.instagram.com/reels/DO3i-MviVuG/",
    "browser_cookies": "chrome"
  }'
```

## Environment Variables

You can also set default cookie options via environment variables:

```bash
export INSTAGRAM_BROWSER_COOKIES=chrome
export INSTAGRAM_COOKIES_FILE=/path/to/cookies.txt
```

This will automatically use these settings if no cookies are specified in the request.
