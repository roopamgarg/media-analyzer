import { createTestServer, createMockUser, createMockAnalysis, createMockAnalysisResult } from '../setup';

// Import the test type
type TestFastifyInstance = Awaited<ReturnType<typeof createTestServer>>;

describe('Analysis Routes', () => {
  let server: TestFastifyInstance;
  let mockUser: any;

  beforeAll(async () => {
    server = await createTestServer();
    mockUser = createMockUser();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v1/analyze', () => {
    const validAnalysisRequest = {
      input: {
        url: 'https://example.com/video.mp4',
      },
      brandKit: {
        inline: {
          brandName: 'TestBrand',
          palette: ['#FF0000', '#00FF00'],
          doDonts: {
            do: ['Use our colors', 'Be positive'],
            dont: ['Mention competitors', 'Make health claims'],
          },
          competitors: ['Competitor1', 'Competitor2'],
          keywords: {
            tone: ['positive', 'friendly'],
            avoid: ['negative', 'aggressive'],
          },
        },
      },
      category: 'Beauty' as const,
      options: {
        evidence: {
          frames: [0, 1, 3, 5, 10],
          screenshots: true,
          transcriptSpans: true,
        },
        returnPdf: false,
      },
    };

    it('should handle synchronous analysis successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: validAnalysisRequest,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.analysisId).toBe('an_test123');
      expect(body.mode).toBe('sync');
      expect(body.status).toBe('completed');
    });

    it('should handle asynchronous analysis successfully', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: {
          ...validAnalysisRequest,
          input: {
            url: 'https://example.com/async-video.mp4', // Use async URL to trigger async mode
          },
        },
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.payload);
      expect(body.analysisId).toBeDefined();
      expect(body.mode).toBe('async');
      expect(body.status).toBe('queued');
    });

    it('should use provided analysis ID header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: validAnalysisRequest,
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
          'x-analysis-id': 'an_custom123',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-analysis-id']).toBe('an_custom123');
    });

    it('should return validation error for invalid request', async () => {
      const invalidRequest = {
        input: {
          // Missing required url field
        },
        brandKit: {},
        category: 'Beauty',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
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

    it('should return 500 for analysis failure', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: {
          ...validAnalysisRequest,
          input: {
            url: 'https://example.com/fail-video.mp4', // Use fail URL to trigger error
          },
        },
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body.message).toBe('Analysis failed');
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: validAnalysisRequest,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /v1/analyses/:id', () => {
    it('should return analysis status for completed analysis', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/analyses/an_test123',
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.analysisId).toBe('an_test123');
      expect(body.status).toBe('completed');
      expect(body.result).toBeDefined();
    });

    it('should return analysis status for pending analysis', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/analyses/pending', // Use pending ID to trigger pending status
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.analysisId).toBe('an_test123');
      expect(body.status).toBe('processing');
      expect(body.progress).toBe(50);
      expect(body.result).toBeUndefined();
    });

    it('should return 404 for non-existent analysis', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/analyses/nonexistent', // Use nonexistent ID to trigger 404
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('NOT_FOUND');
      expect(body.message).toBe('Analysis not found');
    });

    it('should return 500 for database error', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/analyses/dberror', // Use dberror ID to trigger database error
        headers: {
          authorization: `Bearer ${await getValidToken(server)}`,
        },
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.payload);
      expect(body.code).toBe('INTERNAL_ERROR');
      expect(body.message).toBe('Failed to fetch analysis');
    });

    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/v1/analyses/an_test123',
      });

      expect(response.statusCode).toBe(401);
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
