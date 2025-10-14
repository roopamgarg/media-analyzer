#!/bin/bash

# Test script for the new keyword extraction API
# This script demonstrates how to use the keyword extraction endpoint

echo "🚀 Testing Keyword Extraction API"
echo "=================================="

# Configuration
API_BASE_URL="http://localhost:3000"
ENDPOINT="/v1/keywords/extract"

# You'll need to replace this with a valid JWT token
# Get one from the auth endpoint first
JWT_TOKEN="your-jwt-token-here"

# Test Instagram Reel URL (replace with a real one)
INSTAGRAM_REEL_URL="https://www.instagram.com/reel/ABC123DEF456/"

echo "📝 Testing keyword extraction for Instagram Reel..."
echo "URL: $INSTAGRAM_REEL_URL"
echo ""

# Make the API request
curl -X POST "$API_BASE_URL$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d "{
    \"instagramReelUrl\": \"$INSTAGRAM_REEL_URL\",
    \"languageHint\": \"en\",
    \"cookieOptions\": {
      \"browserCookies\": \"chrome\"
    }
  }" \
  -w "\n\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (install jq for formatted output)"

echo ""
echo "✅ Test completed!"
echo ""
echo "📋 API Endpoint Details:"
echo "  Method: POST"
echo "  URL: $API_BASE_URL$ENDPOINT"
echo "  Headers: Authorization: Bearer <token>"
echo ""
echo "📝 Request Body:"
echo "  {
    \"instagramReelUrl\": \"https://www.instagram.com/reel/ABC123/\",
    \"languageHint\": \"en\",
    \"cookieOptions\": {
      \"browserCookies\": \"chrome\"
    }
  }"
echo ""
echo "📊 Expected Response:"
echo "  {
    \"keywords\": {
      \"primary\": [\"keyword1\", \"keyword2\"],
      \"secondary\": [\"keyword3\", \"keyword4\"],
      \"hashtags\": [\"#hashtag1\", \"#hashtag2\"],
      \"mentions\": [\"@user1\", \"@user2\"],
      \"topics\": [\"fashion\", \"beauty\"]
    },
    \"metadata\": {
      \"caption\": \"Video caption text\",
      \"transcript\": \"Full transcript text\",
      \"ocrText\": \"Text from video frames\",
      \"duration\": 30,
      \"username\": \"username\"
    },
    \"searchableTerms\": [\"term1\", \"term2\", \"term3\"],
    \"timings\": {
      \"totalMs\": 2500,
      \"stages\": {
        \"extract\": 800,
        \"asr\": 1200,
        \"ocr\": 300,
        \"processing\": 200
      }
    }
  }"
