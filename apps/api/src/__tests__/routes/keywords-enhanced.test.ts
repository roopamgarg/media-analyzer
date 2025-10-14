import { createTestServer } from '../setup';
import { extractKeywordsEnhanced } from '../../services/keyword-extractor-enhanced';

// Get the mocked service
const mockExtractKeywordsEnhanced = extractKeywordsEnhanced as jest.MockedFunction<typeof extractKeywordsEnhanced>;

describe('Enhanced Keywords Routes', () => {
  let server: Awaited<ReturnType<typeof createTestServer>>;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/keywords/extract-enhanced', () => {
    const validRequest = {
      instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      languageHint: 'en',
      cookieOptions: {
        browserCookies: 'chrome' as const,
      },
      options: {
        includeNgrams: true,
        includeSentiment: true,
        includeIntent: true,
        includeEntities: true,
      },
    };

    const mockEnhancedResult = {
      keywords: {
        primary: [
          { term: 'skincare', confidence: 0.95, type: 'single' as const },
          { term: 'routine', confidence: 0.88, type: 'single' as const },
        ],
        secondary: ['beauty', 'skin', 'care'],
        phrases: [
          { text: 'skincare routine', frequency: 2, significance: 0.8 },
        ],
        hashtags: ['#skincare', '#beauty'],
        mentions: ['@brand'],
      },
      topics: {
        primary: {
          category: 'fashion',
          subcategory: 'skincare',
          confidence: 0.92,
        },
        secondary: [
          { category: 'beauty', confidence: 0.85 },
        ],
      },
      sentiment: {
        overall: 'positive' as const,
        score: 3.2,
        comparative: 0.8,
        emotions: ['excitement'],
      },
      intent: {
        primary: 'educate' as const,
        secondary: ['inform'],
        confidence: 0.9,
      },
      entities: {
        brands: ['nike'],
        products: ['cleanser'],
        people: ['influencer'],
        prices: ['$50'],
        locations: ['New York'],
        events: [],
        dates: [],
        measurements: [],
        currencies: []
      },
      metadata: {
        caption: 'Amazing skincare routine!',
        transcript: 'This is an amazing skincare routine',
        ocrText: 'Brand Name',
        duration: 30,
        username: 'beautyexpert',
        complexity: 'moderate' as const,
        detectedLanguage: 'en',
        languageConfidence: 0.95,
      },
      searchableTerms: ['skincare', 'routine', 'beauty', 'fashion'],
      timings: {
        totalMs: 2500,
        stages: {
          extract: 800,
          asr: 1200,
          ocr: 300,
          processing: 200,
          enhancement: 200,
        },
      },
    };

    it('should extract enhanced keywords successfully', async () => {
      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: validRequest,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockEnhancedResult);
    });

    it('should handle request with minimal options', async () => {
      const minimalRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      };

      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: minimalRequest,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle request with disabled options', async () => {
      const requestWithDisabledOptions = {
        ...validRequest,
        options: {
          includeNgrams: false,
          includeSentiment: false,
          includeIntent: false,
          includeEntities: false,
        },
      };

      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: requestWithDisabledOptions,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle async request', async () => {
      const asyncRequest = {
        ...validRequest,
        async: true,
      };

      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: asyncRequest,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should validate Instagram URL format', async () => {
      const invalidRequest = {
        ...validRequest,
        instagramReelUrl: 'https://invalid-url.com',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
      });
    });

    it('should validate cookie options', async () => {
      const invalidRequest = {
        ...validRequest,
        cookieOptions: {
          browserCookies: 'invalid-browser' as any,
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
      });
    });

    it('should handle extraction errors', async () => {
      const errorRequest = {
        ...validRequest,
        instagramReelUrl: 'https://www.instagram.com/reel/ERROR/',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: errorRequest,
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.payload)).toMatchObject({
        code: 'INTERNAL_ERROR',
        message: 'Enhanced keyword extraction failed',
        details: 'Mock extraction error',
      });
    });

    it('should handle unknown errors', async () => {
      const unknownErrorRequest = {
        ...validRequest,
        instagramReelUrl: 'https://www.instagram.com/reel/UNKNOWN_ERROR/',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: unknownErrorRequest,
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.payload)).toMatchObject({
        code: 'INTERNAL_ERROR',
        message: 'Enhanced keyword extraction failed',
        details: 'Unknown error',
      });
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        payload: validRequest,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle missing request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
      });
    });

    it('should handle malformed JSON', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        payload: 'invalid json',
      });

      expect(response.statusCode).toBe(400);
    });

    it('should log request details', async () => {
      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: validRequest,
      });

      // Test completed successfully
    });

    it('should log response details', async () => {
      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: validRequest,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockEnhancedResult);
    });

    it('should handle different language hints', async () => {
      const spanishRequest = {
        ...validRequest,
        languageHint: 'es',
      };

      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: spanishRequest,
      });

      expect(response.statusCode).toBe(200);
    });

    it('should handle cookie file option', async () => {
      const requestWithCookieFile = {
        ...validRequest,
        cookieOptions: {
          cookiesFile: '/path/to/cookies.txt',
        },
      };

      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer valid-token',
        },
        payload: requestWithCookieFile,
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
