#!/bin/bash

# Media Analyzer API Test Script
# This script tests the Instagram Reel functionality

BASE_URL="http://localhost:3000"

echo "🧪 Testing Media Analyzer API with Instagram Reel Support"
echo "=================================================="

# Get JWT Token first
echo "0. Getting JWT Token..."
JWT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/demo-token" \
  -H "Content-Type: application/json" \
  -d '{}')

JWT_TOKEN=$(echo "$JWT_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$JWT_TOKEN" = "null" ] || [ -z "$JWT_TOKEN" ]; then
  echo "❌ Failed to get JWT token. Make sure the API server is running."
  echo "Response: $JWT_RESPONSE"
  exit 1
fi

echo "✅ Got JWT token: ${JWT_TOKEN:0:20}..."
echo -e "\n"

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s -X GET "$BASE_URL/health" \
  -H "Content-Type: application/json" | jq '.' || echo "Health check failed"
echo -e "\n"

# Test 2: Valid Instagram Reel URL
echo "2. Testing Valid Instagram Reel URL..."
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/analyze" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "instagramReelUrl": "https://www.instagram.com/reel/ABC123DEF456/"
    },
    "brandKit": {
      "inline": {
        "brandName": "TestBrand",
        "palette": ["#FF0000", "#00FF00", "#0000FF"],
        "doDonts": {
          "do": ["Use our brand colors", "Be positive and engaging"],
          "dont": ["Mention competitors", "Make health claims"]
        },
        "competitors": ["CompetitorA", "CompetitorB"],
        "keywords": {
          "tone": ["friendly", "professional", "innovative"],
          "avoid": ["aggressive", "negative", "misleading"]
        }
      }
    },
    "category": "Beauty",
    "options": {
      "returnPdf": false,
      "evidence": {
        "screenshots": true,
        "transcriptSpans": true,
        "frames": [0, 1, 3, 5, 10]
      }
    }
  }')

echo "$RESPONSE" | jq '.' || echo "Instagram Reel analysis failed"
echo -e "\n"

# Test 3: Invalid Instagram URL
echo "3. Testing Invalid Instagram URL (should fail)..."
curl -s -X POST "$BASE_URL/v1/analyze" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "instagramReelUrl": "https://invalid-url.com/not-instagram"
    },
    "brandKit": {
      "inline": {
        "brandName": "TestBrand",
        "palette": ["#FF0000"],
        "doDonts": {
          "do": ["Use our colors"],
          "dont": ["Mention competitors"]
        }
      }
    },
    "category": "Beauty"
  }' | jq '.' || echo "Invalid URL test completed"
echo -e "\n"

# Test 4: Missing Input
echo "4. Testing Missing Input (should fail)..."
curl -s -X POST "$BASE_URL/v1/analyze" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandKit": {
      "inline": {
        "brandName": "TestBrand",
        "palette": ["#FF0000"],
        "doDonts": {
          "do": ["Use our colors"],
          "dont": ["Mention competitors"]
        }
      }
    },
    "category": "Beauty"
  }' | jq '.' || echo "Missing input test completed"
echo -e "\n"

# Test 5: Get Metrics
echo "5. Testing Metrics Endpoint..."
curl -s -X GET "$BASE_URL/metrics" \
  -H "Content-Type: application/json" | jq '.' || echo "Metrics endpoint failed"
echo -e "\n"

echo "✅ API Testing Complete!"
echo "Note: Make sure to:"
echo "1. Start the API server: cd apps/api && npm run dev"
echo "2. Replace JWT_TOKEN with a valid token"
echo "3. Install jq for JSON formatting: brew install jq"
