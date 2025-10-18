# Media Analyzer Documentation

Welcome to the Media Analyzer documentation! All project documentation is organized here for easy access.

> **⚠️ API Deprecation Notice:** The `instagramReelUrl` field is deprecated and will be removed in a future version. Please use `shortVideoUrl` instead, which supports both Instagram Reels and YouTube Shorts.

## 📚 Documentation Index

### Core Documentation

| Document | Description | Use When |
|----------|-------------|----------|
| [API Reference](api-reference.md) | **Complete reference for all 17 API endpoints** with detailed explanations, examples, and use cases | You need detailed information about any API endpoint |
| [API Documentation](api-documentation.md) | Quick API reference with authentication, endpoints, and examples | You need a quick API overview |
| [Keyword Extraction](keyword-extraction.md) | Detailed guide for keyword extraction features | Working with keyword extraction |
| [NER Implementation](ner-implementation.md) | Named Entity Recognition implementation details | Understanding NER features |

### Setup & Configuration

| Document | Description | Use When |
|----------|-------------|----------|
| [Instagram Cookies](instagram-cookies.md) | How to setup Instagram authentication | Downloading Instagram content |
| [Testing Guide](testing.md) | How to run tests across the platform | Running or writing tests |
| [Postman Guide](postman-guide.md) | Using Postman collections for API testing | Testing APIs with Postman |

## 🚀 Quick Start

### 1. API Documentation
```bash
# View interactive Swagger UI
npm run docs:serve
# Visit http://localhost:8080
```

### 2. Test the API
```bash
# Get a demo token
curl -X POST http://localhost:3000/auth/demo-token

# Use the token to test endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3000/health
```

### 3. Run Tests
```bash
npm run test:all
```

## 📖 Documentation Organization

### By Feature
- **Analysis**: See [API Documentation](api-documentation.md) → Analysis section
- **Keywords**: See [Keyword Extraction](keyword-extraction.md)
- **NER/NLP**: See [NER Implementation](ner-implementation.md)
- **Testing**: See [Testing Guide](testing.md)

### By Use Case
- **Getting Started**: Start with [API Documentation](api-documentation.md)
- **Integration**: Use [Postman Guide](postman-guide.md) or [API Documentation](api-documentation.md)
- **Instagram Content**: See [Instagram Cookies](instagram-cookies.md)
- **Contributing**: See [Testing Guide](testing.md)

## 🔗 External Resources

- [OpenAPI Specification](https://swagger.io/specification/) - API specification format
- [Swagger Editor](https://editor.swagger.io/) - Online API editor
- [Postman Documentation](https://learning.postman.com/docs/) - Postman learning resources

## 📝 Document Updates

When adding new documentation:

1. Create the file in `/docs` with a descriptive name (use kebab-case)
2. Add an entry to this README
3. Link from main README if it's a core document
4. Keep documentation focused and single-purpose

## 🆘 Need Help?

- **API Questions**: See [API Documentation](api-documentation.md)
- **Setup Issues**: Check relevant setup guides
- **Testing Issues**: See [Testing Guide](testing.md)
- **Feature Details**: Check feature-specific docs

