import { createTestServer, createMockKeywordResult } from '../setup';

// Import the test type
type TestFastifyInstance = Awaited<ReturnType<typeof createTestServer>>;

describe('Keywords Routes', () => {
  let server: TestFastifyInstance;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/keywords/extract', () => {
    const validKeywordRequest = {
      instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      languageHint: 'en',
      cookieOptions: {
        browserCookies: 'chrome' as const,
      },
    };

    it('should extract keywords successfully', async () => {
      const mockResult = createMockKeywordResult();

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: validKeywordRequest,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toEqual(mockResult);
    });

    it('should extract keywords with cookies file', async () => {
      const requestWithCookiesFile = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        cookieOptions: {
          cookiesFile: '/path/to/cookies.txt',
        },
      };
      const mockResult = createMockKeywordResult();

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: requestWithCookiesFile,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should extract keywords without cookie options', async () => {
      const requestWithoutCookies = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      };
      const mockResult = createMockKeywordResult();

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: requestWithoutCookies,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return validation error for invalid Instagram URL', async () => {
      const invalidRequest = {
        instagramReelUrl: 'https://example.com/not-instagram',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: invalidRequest,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.message).toBe('Invalid request data');
    });

    it('should return validation error for non-URL input', async () => {
      const invalidRequest = {
        instagramReelUrl: 'not-a-url',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: invalidRequest,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for invalid browser type', async () => {
      const invalidRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        cookieOptions: {
          browserCookies: 'invalid-browser',
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: invalidRequest,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 500 for extraction failure', async () => {

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: {
          ...validKeywordRequest,
          instagramReelUrl: 'https://www.instagram.com/reel/fail/', // Use fail URL to trigger error
        },
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body.message).toBe('Keyword extraction failed');
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: validKeywordRequest,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle missing request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /v1/keywords/health', () => {
    it('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/keywords/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('service', 'keyword-extractor');
      expect(body).toHaveProperty('timestamp');
      expect(typeof body.timestamp).toBe('string');
    });

    it('should return valid timestamp format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/keywords/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      const timestamp = new Date(body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });
});

// Helper function to get a valid token
async function getValidToken(server: TestFastifyInstance): Promise<string> {
  const tokenResponse = await server.inject({
    method: 'POST',
    url: '/auth/demo-token',
  });
  const { token } = JSON.parse(tokenResponse.payload);
  return token;
}
