import { createTestServer, createMockUser, createMockAnalysis, createMockAnalysisResult, createMockKeywordResult, createMockEnhancedKeywordResult } from '../setup';

// Import the test type
type TestFastifyInstance = Awaited<ReturnType<typeof createTestServer>>;
import { canRunSync, prepareContext, runSyncAnalysis } from '../../services/analyze-sync';
import { enqueueAnalysisJob } from '../../services/queue';
import { extractKeywords } from '../../services/keyword-extractor';
import { extractKeywordsEnhanced } from '../../services/keyword-extractor-enhanced';
import { prisma } from '@media-analyzer/lib-node';

// Mock the services
jest.mock('../../services/analyze-sync');
jest.mock('../../services/queue');
jest.mock('../../services/keyword-extractor');
jest.mock('../../services/keyword-extractor-enhanced');
jest.mock('@media-analyzer/lib-node');

const mockCanRunSync = canRunSync as jest.MockedFunction<typeof canRunSync>;
const mockPrepareContext = prepareContext as jest.MockedFunction<typeof prepareContext>;
const mockRunSyncAnalysis = runSyncAnalysis as jest.MockedFunction<typeof runSyncAnalysis>;
const mockEnqueueAnalysisJob = enqueueAnalysisJob as jest.MockedFunction<typeof enqueueAnalysisJob>;
const mockExtractKeywords = extractKeywords as jest.MockedFunction<typeof extractKeywords>;
const mockExtractKeywordsEnhanced = extractKeywordsEnhanced as jest.MockedFunction<typeof extractKeywordsEnhanced>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('API Integration Tests', () => {
  let server: TestFastifyInstance;
  let authToken: string;

  beforeAll(async () => {
    server = await createTestServer();
    
    // Get authentication token
    const tokenResponse = await server.inject({
      method: 'POST',
      url: '/auth/demo-token',
    });
    const { token } = JSON.parse(tokenResponse.payload);
    authToken = token;
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Analysis Workflow', () => {
    it('should complete sync analysis workflow', async () => {
      // Step 1: Authenticate
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      expect(authResponse.statusCode).toBe(200);
      const { token } = JSON.parse(authResponse.payload);

      // Step 2: Perform sync analysis
      mockCanRunSync.mockReturnValue(true);
      mockPrepareContext.mockResolvedValue({
        analysisId: 'an_test123',
        input: { url: 'https://example.com/video.mp4' },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: { do: [], dont: [] },
            competitors: ['Competitor1'],
            keywords: { tone: ['positive'], avoid: ['negative'] },
          },
        },
        category: 'Beauty',
        options: { evidence: { frames: [0, 1, 3, 5, 10], screenshots: true, transcriptSpans: true }, returnPdf: false },
        projectId: 'test-project-123',
        s3Prefix: 'test-prefix',
      });
      mockRunSyncAnalysis.mockResolvedValue(createMockAnalysisResult({
        analysisId: 'an_test123',
        mode: 'sync',
      }));

      const analysisRequest = {
        input: { url: 'https://example.com/video.mp4' },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: { do: ['Be positive'], dont: ['Mention competitors'] },
          },
        },
        category: 'Beauty',
        options: {
          evidence: {
            frames: [0, 1, 3, 5, 10],
            screenshots: true,
            transcriptSpans: true,
          },
        },
      };

      const analysisResponse = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: analysisRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(analysisResponse.statusCode).toBe(200);
      const analysisResult = JSON.parse(analysisResponse.payload);
      expect(analysisResult.analysisId).toBe('an_test123');
      expect(analysisResult.mode).toBe('sync');
      expect(analysisResult.status).toBe('completed');
    });

    it('should complete async analysis workflow', async () => {
      // Step 1: Authenticate
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      // Step 2: Start async analysis
      mockCanRunSync.mockReturnValue(false);
      mockEnqueueAnalysisJob.mockResolvedValue(undefined);

      const analysisRequest = {
        input: { url: 'https://example.com/async-video.mp4' }, // Use async URL to trigger async mode
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: { do: ['Be positive'], dont: ['Mention competitors'] },
          },
        },
        category: 'Beauty',
        options: {
          evidence: {
            frames: [0, 1, 3, 5, 10],
            screenshots: true,
            transcriptSpans: true,
          },
        },
      };

      const analysisResponse = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: analysisRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(analysisResponse.statusCode).toBe(202);
      const analysisResult = JSON.parse(analysisResponse.payload);
      expect(analysisResult.mode).toBe('async');
      expect(analysisResult.status).toBe('queued');

      // Step 3: Check analysis status
      const mockAnalysis = createMockAnalysis({
        id: analysisResult.analysisId,
        status: 'completed',
      });
      (mockPrisma.analysis.findFirst as jest.Mock).mockResolvedValue(mockAnalysis);

      const statusResponse = await server.inject({
        method: 'GET',
        url: `/v1/analyses/${analysisResult.analysisId}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(statusResponse.statusCode).toBe(200);
      const statusResult = JSON.parse(statusResponse.payload);
      expect(statusResult.status).toBe('completed');
      expect(statusResult.result).toBeDefined();
    });
  });

  describe('Keyword Extraction Workflow', () => {
    it('should complete keyword extraction workflow', async () => {
      // Step 1: Authenticate
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      // Step 2: Extract keywords
      const mockKeywordResult = createMockKeywordResult();
      mockExtractKeywords.mockResolvedValue(mockKeywordResult);

      const keywordRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        languageHint: 'en',
        cookieOptions: {
          browserCookies: 'chrome',
        },
      };

      const keywordResponse = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: keywordRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(keywordResponse.statusCode).toBe(200);
      const keywordResult = JSON.parse(keywordResponse.payload);
      expect(keywordResult.keywords).toBeDefined();
      expect(keywordResult.metadata).toBeDefined();
      expect(keywordResult.searchableTerms).toBeDefined();
      expect(keywordResult.timings).toBeDefined();
    });

    it('should handle keyword extraction with cookies file', async () => {
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      const mockKeywordResult = createMockKeywordResult();

      const keywordRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        cookieOptions: {
          cookiesFile: '/path/to/cookies.txt',
        },
      };

      const keywordResponse = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract',
        payload: keywordRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(keywordResponse.statusCode).toBe(200);
    });
  });

  describe('Enhanced Keyword Extraction Workflow', () => {
    it('should complete enhanced keyword extraction workflow', async () => {
      // Step 1: Authenticate
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      // Step 2: Extract enhanced keywords
      const mockEnhancedResult = createMockEnhancedKeywordResult();
      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const enhancedKeywordRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        languageHint: 'en',
        options: {
          includeNgrams: true,
          includeSentiment: true,
          includeIntent: true,
          includeEntities: true,
        },
        cookieOptions: {
          browserCookies: 'chrome',
        },
      };

      const enhancedKeywordResponse = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        payload: enhancedKeywordRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(enhancedKeywordResponse.statusCode).toBe(200);
      const enhancedKeywordResult = JSON.parse(enhancedKeywordResponse.payload);
      
      // Verify enhanced response structure
      expect(enhancedKeywordResult.keywords).toBeDefined();
      expect(enhancedKeywordResult.keywords.primary).toBeDefined();
      expect(enhancedKeywordResult.keywords.phrases).toBeDefined();
      expect(enhancedKeywordResult.topics).toBeDefined();
      expect(enhancedKeywordResult.sentiment).toBeDefined();
      expect(enhancedKeywordResult.intent).toBeDefined();
      expect(enhancedKeywordResult.entities).toBeDefined();
      expect(enhancedKeywordResult.metadata).toBeDefined();
      expect(enhancedKeywordResult.searchableTerms).toBeDefined();
      expect(enhancedKeywordResult.timings).toBeDefined();
      
      // Verify enhanced features
      expect(enhancedKeywordResult.sentiment.overall).toBeDefined();
      expect(enhancedKeywordResult.sentiment.score).toBeDefined();
      expect(enhancedKeywordResult.intent.primary).toBeDefined();
      expect(enhancedKeywordResult.entities.brands).toBeDefined();
      expect(enhancedKeywordResult.entities.products).toBeDefined();
      expect(enhancedKeywordResult.entities.people).toBeDefined();
      expect(enhancedKeywordResult.topics.primary.category).toBeDefined();
    });

    it('should handle enhanced keyword extraction with minimal options', async () => {
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      const mockEnhancedResult = createMockEnhancedKeywordResult();
      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const minimalRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        languageHint: 'en',
        options: {
          includeNgrams: false,
          includeSentiment: false,
          includeIntent: false,
          includeEntities: false,
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        payload: minimalRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.keywords).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle enhanced keyword extraction with cookies file', async () => {
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      const mockEnhancedResult = createMockEnhancedKeywordResult();
      mockExtractKeywordsEnhanced.mockResolvedValue(mockEnhancedResult);

      const requestWithCookieFile = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        languageHint: 'en',
        cookieOptions: {
          cookiesFile: '/path/to/cookies.txt',
        },
        options: {
          includeNgrams: true,
          includeSentiment: true,
          includeIntent: true,
          includeEntities: true,
        },
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        payload: requestWithCookieFile,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.keywords).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.entities).toBeDefined();
    });

    it('should handle enhanced keyword extraction errors', async () => {
      const authResponse = await server.inject({
        method: 'POST',
        url: '/auth/demo-token',
      });
      const { token } = JSON.parse(authResponse.payload);

      // Mock service to throw error
      mockExtractKeywordsEnhanced.mockRejectedValue(new Error('Enhanced extraction failed'));

      const errorRequest = {
        instagramReelUrl: 'https://www.instagram.com/reel/ERROR/',
        languageHint: 'en',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        payload: errorRequest,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(500);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.message).toBe('Enhanced keyword extraction failed');
    });
  });

  describe('Health Check Workflow', () => {
    it('should complete health check workflow', async () => {
      // Step 1: Check basic health
      const healthResponse = await server.inject({
        method: 'GET',
        url: '/health',
      });
      expect(healthResponse.statusCode).toBe(200);
      const healthResult = JSON.parse(healthResponse.payload);
      expect(healthResult.status).toBe('ok');

      // Step 2: Check readiness
      const readyResponse = await server.inject({
        method: 'GET',
        url: '/health/ready',
      });
      expect(readyResponse.statusCode).toBe(200);
      const readyResult = JSON.parse(readyResponse.payload);
      expect(readyResult.status).toBe('ready');
      expect(readyResult.checks.database).toBe('ok');
      expect(readyResult.checks.redis).toBe('ok');
      expect(readyResult.checks.worker).toBe('ok');

      // Step 3: Check configuration
      const configResponse = await server.inject({
        method: 'GET',
        url: '/health/config',
      });
      expect(configResponse.statusCode).toBe(200);
      const configResult = JSON.parse(configResponse.payload);
      expect(configResult.ANALYZE_SYNC_MAX_SECONDS).toBeDefined();
      expect(configResult.WORKER_PYTHON_URL).toBeDefined();
    });
  });

  describe('Authentication Workflow', () => {
    it('should complete authentication workflow', async () => {
      // Step 1: Register new user
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'newuser@example.com',
          password: 'password123',
          projectId: 'project-123',
          userId: 'user-456',
        },
      });
      expect(registerResponse.statusCode).toBe(200);
      const registerResult = JSON.parse(registerResponse.payload);
      expect(registerResult.token).toBeDefined();

      // Step 2: Login with existing user
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'user@example.com',
          password: 'password123',
        },
      });
      expect(loginResponse.statusCode).toBe(200);
      const loginResult = JSON.parse(loginResponse.payload);
      expect(loginResult.token).toBeDefined();

      // Step 3: Verify token
      const verifyResponse = await server.inject({
        method: 'GET',
        url: '/auth/verify',
        headers: { authorization: `Bearer ${loginResult.token}` },
      });
      expect(verifyResponse.statusCode).toBe(200);
      const verifyResult = JSON.parse(verifyResponse.payload);
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.user).toBeDefined();
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle authentication errors', async () => {
      // Try to access protected endpoint without token
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: {
          input: { url: 'https://example.com/video.mp4' },
          brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: { do: [], dont: [] },
            competitors: ['Competitor1'],
            keywords: { tone: ['positive'], avoid: ['negative'] },
          },
        },
          category: 'Beauty',
        },
      });
      expect(response.statusCode).toBe(401);
    });

    it('should handle validation errors', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: {
          // Missing required fields
        },
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/v1/analyze',
        payload: {
          input: { url: 'https://example.com/fail-video.mp4' }, // Use fail URL to trigger error
          brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: { do: [], dont: [] },
            competitors: ['Competitor1'],
            keywords: { tone: ['positive'], avoid: ['negative'] },
          },
        },
          category: 'Beauty',
        },
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(response.statusCode).toBe(500);
      const result = JSON.parse(response.payload);
      expect(result.code).toBe('INTERNAL_ERROR');
    });
  });
});
