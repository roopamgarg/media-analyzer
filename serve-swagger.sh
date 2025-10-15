#!/bin/bash

# Media Analyzer API - Swagger UI Server
# This script serves the OpenAPI documentation using Swagger UI

set -e

echo "📚 Media Analyzer API - Swagger Documentation Server"
echo "=================================================="
echo ""

# Check if swagger-ui-watcher is installed
if ! command -v swagger-ui-watcher &> /dev/null; then
    echo "⚠️  swagger-ui-watcher not found. Installing..."
    npm install -g swagger-ui-watcher
    echo "✅ swagger-ui-watcher installed successfully"
    echo ""
fi

# Check if openapi.yaml exists
if [ ! -f "openapi.yaml" ]; then
    echo "❌ Error: openapi.yaml not found in current directory"
    exit 1
fi

# Validate OpenAPI spec (if swagger-cli is installed)
if command -v swagger-cli &> /dev/null; then
    echo "🔍 Validating OpenAPI specification..."
    swagger-cli validate openapi.yaml
    echo "✅ OpenAPI specification is valid"
    echo ""
else
    echo "ℹ️  Install swagger-cli for validation: npm install -g @apidevtools/swagger-cli"
    echo ""
fi

# Start Swagger UI
echo "🚀 Starting Swagger UI server..."
echo ""
echo "📖 Documentation will be available at:"
echo "   http://localhost:8080"
echo ""
echo "🔧 API Servers configured:"
echo "   - Main API: http://localhost:3000"
echo "   - Python Worker: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

swagger-ui-watcher openapi.yaml

