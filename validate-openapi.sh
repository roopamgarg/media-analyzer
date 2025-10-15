#!/bin/bash

# Validate OpenAPI Specification
# This script checks the openapi.yaml file for errors and provides feedback

set -e

echo "🔍 Media Analyzer API - OpenAPI Validation"
echo "=========================================="
echo ""

# Check if openapi.yaml exists
if [ ! -f "openapi.yaml" ]; then
    echo "❌ Error: openapi.yaml not found in current directory"
    exit 1
fi

# Check if swagger-cli is installed
if ! command -v swagger-cli &> /dev/null; then
    echo "⚠️  swagger-cli not found. Installing..."
    npm install -g @apidevtools/swagger-cli
    echo "✅ swagger-cli installed successfully"
    echo ""
fi

# Validate the OpenAPI spec
echo "📋 Validating OpenAPI 3.0 specification..."
echo ""

if swagger-cli validate openapi.yaml; then
    echo ""
    echo "✅ OpenAPI specification is valid!"
    echo ""
    
    # Show spec info
    echo "📊 Specification Details:"
    echo "------------------------"
    
    # Extract info using grep (portable)
    VERSION=$(grep -A 1 "^  version:" openapi.yaml | tail -1 | sed 's/.*version: //' | tr -d ' "')
    TITLE=$(grep -A 1 "^  title:" openapi.yaml | tail -1 | sed 's/.*title: //' | tr -d ' "')
    
    echo "Title: $TITLE"
    echo "Version: $VERSION"
    echo ""
    
    # Count paths
    PATH_COUNT=$(grep -c "^  /.*:$" openapi.yaml || true)
    echo "Total Endpoints: $PATH_COUNT"
    echo ""
    
    # List all endpoints
    echo "📍 Available Endpoints:"
    echo "----------------------"
    grep "^  /.*:$" openapi.yaml | sed 's/:$//' | sed 's/^  /  ✓ /' || echo "  None found"
    echo ""
    
    echo "🚀 Next Steps:"
    echo "  1. Run './serve-swagger.sh' to view interactive docs"
    echo "  2. Import to Postman: File → Import → openapi.yaml"
    echo "  3. Generate client: See SWAGGER_DOCUMENTATION.md"
    echo ""
else
    echo ""
    echo "❌ OpenAPI specification validation failed!"
    echo ""
    echo "Please fix the errors above and try again."
    exit 1
fi

