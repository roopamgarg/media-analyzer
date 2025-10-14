#!/bin/bash

# Import Postman Collection v2 Script
# This script helps you import and configure the Media Analyzer Postman collection

echo "🚀 Media Analyzer Postman Collection v2 Setup"
echo "=============================================="
echo ""

# Check if Postman CLI is available
if command -v newman &> /dev/null; then
    echo "✅ Newman (Postman CLI) is available"
    NEWMAN_AVAILABLE=true
else
    echo "⚠️  Newman (Postman CLI) not found - you'll need to import manually"
    NEWMAN_AVAILABLE=false
fi

echo ""
echo "📋 Collection Files Available:"
echo "  📄 postman-collection-v2.json - Complete v2 collection with keyword extraction"
echo "  📄 postman-collection.json - Original collection"
echo "  📖 POSTMAN_COLLECTION_V2_GUIDE.md - Complete usage guide"
echo ""

echo "🔧 Setup Instructions:"
echo ""

echo "1️⃣  Start the Services:"
echo "   # Terminal 1: API Server"
echo "   cd apps/api && npm run dev"
echo ""
echo "   # Terminal 2: Python Worker"
echo "   cd apps/worker-python && python main.py"
echo ""

echo "2️⃣  Import Collection:"
echo "   Option A: Import via Postman UI"
echo "   - Open Postman"
echo "   - Click 'Import'"
echo "   - Select 'postman-collection-v2.json'"
echo "   - Click 'Import'"
echo ""
echo "   Option B: Import via CLI (if Newman is available)"
if [ "$NEWMAN_AVAILABLE" = true ]; then
    echo "   - Run: newman run postman-collection-v2.json"
fi
echo ""

echo "3️⃣  Configure Variables:"
echo "   - base_url: http://localhost:3000"
echo "   - worker_python_url: http://localhost:8000"
echo "   - instagram_reel_url: https://www.instagram.com/reels/DO3i-MviVuG/"
echo "   - cookies_file_path: /path/to/your/cookies.txt"
echo ""

echo "4️⃣  Test the Collection:"
echo "   🔐 Authentication:"
echo "   - Run 'Get Demo Token' to get JWT token"
echo "   - Run 'Verify Token' to confirm authentication"
echo ""
echo "   🔍 Keyword Extraction (NEW):"
echo "   - Run 'Extract Keywords (with Chrome Cookies)'"
echo "   - Check the response for keywords and metadata"
echo ""
echo "   📊 Content Analysis:"
echo "   - Run 'Analyze Instagram Reel (with Chrome Cookies)'"
echo "   - Run 'Get Analysis Status' with the returned analysis ID"
echo ""

echo "5️⃣  Quick Test Sequence:"
echo "   1. Health Check → API Health Check"
echo "   2. Authentication → Get Demo Token"
echo "   3. Keyword Extraction → Extract Keywords (with Chrome Cookies)"
echo "   4. Content Analysis → Analyze Instagram Reel (with Chrome Cookies)"
echo ""

echo "📚 Documentation:"
echo "   📖 POSTMAN_COLLECTION_V2_GUIDE.md - Complete usage guide"
echo "   🔍 KEYWORD_EXTRACTION_API.md - Keyword extraction API docs"
echo "   🍪 INSTAGRAM_COOKIES_GUIDE.md - Cookie setup guide"
echo ""

echo "🆕 New in v2:"
echo "   ✅ Keyword Extraction API - Extract searchable keywords from Instagram Reels"
echo "   ✅ Organized Categories - Better organization with emoji categories"
echo "   ✅ Auto-Configuration - Automatic JWT token and analysis ID extraction"
echo "   ✅ Enhanced Error Handling - Better error detection and logging"
echo "   ✅ Comprehensive Testing - More test scenarios and workflows"
echo ""

echo "🚨 Troubleshooting:"
echo "   - Ensure ports 3000 and 8000 are available"
echo "   - Make sure you're logged into Instagram in your browser"
echo "   - Check that both API and Python worker are running"
echo "   - Verify JWT token is valid and not expired"
echo ""

echo "✅ Setup Complete!"
echo "   Import 'postman-collection-v2.json' into Postman and start testing!"
echo ""

# If Newman is available, offer to run a quick test
if [ "$NEWMAN_AVAILABLE" = true ]; then
    echo "🧪 Quick Test with Newman:"
    read -p "Would you like to run a quick test with Newman? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running quick test..."
        newman run postman-collection-v2.json --folder "🔧 System & Health" --reporters cli
    fi
fi

echo ""
echo "🎉 Happy Testing!"
