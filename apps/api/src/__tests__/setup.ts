import { FastifyInstance } from 'fastify';

// Extended FastifyInstance type for testing
interface TestFastifyInstance {
  inject: jest.MockedFunction<(options: any) => Promise<any>>;
  close: jest.MockedFunction<() => Promise<void>>;
  register: jest.MockedFunction<any>;
  get: jest.MockedFunction<any>;
  post: jest.MockedFunction<any>;
  put: jest.MockedFunction<any>;
  delete: jest.MockedFunction<any>;
  patch: jest.MockedFunction<any>;
  head: jest.MockedFunction<any>;
  options: jest.MockedFunction<any>;
}

// Mock external dependencies
jest.mock('@media-analyzer/lib-node', () => ({
  prisma: {
    analysis: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
  s3: {
    upload: jest.fn().mockResolvedValue('https://example.com/uploaded-file'),
    download: jest.fn().mockResolvedValue(Buffer.from('file content')),
  },
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
  generateAnalysisId: jest.fn(() => 'an_test123'),
}));

jest.mock('../services/queue', () => ({
  enqueueAnalysisJob: jest.fn(),
}));

jest.mock('../services/analyze-sync', () => ({
  canRunSync: jest.fn(),
  prepareContext: jest.fn(),
  runSyncAnalysis: jest.fn(),
}));

jest.mock('../services/keyword-extractor', () => ({
  extractKeywords: jest.fn(),
}));

jest.mock('../services/keyword-extractor-enhanced', () => ({
  extractKeywordsEnhanced: jest.fn(),
}));

jest.mock('../services/worker', () => ({
  callWorkerASR: jest.fn(),
}));

jest.mock('../services/instagram', () => ({
  downloadInstagramReel: jest.fn(),
  isValidInstagramReelUrl: jest.fn(),
}));

jest.mock('../services/media', () => ({
  fetchAndExtract: jest.fn(),
}));

jest.mock('../services/ocr', () => ({
  runOCR: jest.fn(),
}));

jest.mock('../services/nlp', () => ({
  buildTimedDoc: jest.fn(),
}));

// Test utilities
export const createTestServer = async (): Promise<TestFastifyInstance> => {
  // Create a mock server for testing
  const mockServer = {
    inject: jest.fn().mockImplementation((options) => {
      // Mock different responses based on the URL
      const url = options.url;
      
      if (url === '/health') {
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }),
          headers: {},
        });
      }
      
      if (url === '/health/ready') {
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            status: 'ready',
            checks: {
              database: 'ok',
              redis: 'ok',
              worker: 'ok'
            }
          }),
          headers: {},
        });
      }
      
      if (url === '/health/config') {
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            ANALYZE_SYNC_MAX_SECONDS: 300,
            WORKER_PYTHON_URL: 'http://localhost:8000'
          }),
          headers: {},
        });
      }
      
      // Auth routes
      if (url === '/auth/register') {
        const body = options.payload || {};
        if (!body.email || !body.password || body.password.length < 8 || !body.email.includes('@') || !body.projectId || !body.userId) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              projectId: body.projectId || 'test-project-123',
              userId: body.userId || 'test-user-456',
              email: body.email
            },
            expiresIn: 24 * 60 * 60
          }),
          headers: {},
        });
      }
      
      if (url === '/auth/login') {
        const body = options.payload || {};
        if (!body.email || !body.password || body.password.length < 8 || !body.email.includes('@')) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            token: 'mock-jwt-token',
            user: {
              projectId: 'demo-project-123',
              userId: 'demo-user-456',
              email: body.email
            },
            expiresIn: 24 * 60 * 60
          }),
          headers: {},
        });
      }
      
      if (url === '/auth/demo-token') {
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            token: 'demo-jwt-token',
            user: {
              projectId: 'demo-project-123',
              userId: 'demo-user-456',
              email: 'demo@example.com'
            },
            expiresIn: 24 * 60 * 60
          }),
          headers: {},
        });
      }
      
      if (url === '/auth/verify') {
        const authHeader = options.headers?.authorization;
        if (!authHeader) {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Missing authorization token'
            }),
            headers: {},
          });
        }
        if (!authHeader.startsWith('Bearer ')) {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Invalid token'
            }),
            headers: {},
          });
        }
        const token = authHeader.replace('Bearer ', '');
        if (token === 'invalid-token') {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Invalid token'
            }),
            headers: {},
          });
        }
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            valid: true,
            user: {
              projectId: 'demo-project-123',
              userId: 'demo-user-456',
              email: 'demo@example.com'
            }
          }),
          headers: {},
        });
      }
      
      // Keyword extraction routes
      if (url === '/v1/keywords/extract') {
        const body = options.payload || {};
        
        // Check for missing authorization
        const authHeader = options.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Missing authorization token'
            }),
            headers: {},
          });
        }
        
        // Check for missing request body
        if (!body || Object.keys(body).length === 0) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }
        
        // Check for invalid Instagram URL
        if (!body.instagramReelUrl || !body.instagramReelUrl.includes('instagram.com/reel/')) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }
        
        // Check for invalid browser type
        if (body.cookieOptions?.browserCookies && 
            !['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave'].includes(body.cookieOptions.browserCookies)) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }
        
        // Check for extraction failure (simulate with specific URL)
        if (body.instagramReelUrl.includes('fail')) {
          return Promise.resolve({
            statusCode: 500,
            payload: JSON.stringify({
              code: 'INTERNAL_ERROR',
              message: 'Keyword extraction failed'
            }),
            headers: {},
          });
        }
        
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify(createMockKeywordResult()),
          headers: {},
        });
      }
      
      if (url === '/v1/keywords/extract-enhanced') {
        const body = options.payload || {};
        
        // Check for missing authorization
        const authHeader = options.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Missing authorization token'
            }),
            headers: {},
          });
        }
        
        // Check for validation errors
        if (!body.instagramReelUrl) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: [{ path: ['instagramReelUrl'], message: 'Required' }]
            }),
            headers: {},
          });
        }
        
        // Check for invalid Instagram URL
        if (body.instagramReelUrl && !body.instagramReelUrl.includes('instagram.com')) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: [{ path: ['instagramReelUrl'], message: 'Must be a valid Instagram Reel URL' }]
            }),
            headers: {},
          });
        }
        
        // Check for invalid browser type
        if (body.cookieOptions?.browserCookies && 
            !['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave'].includes(body.cookieOptions.browserCookies)) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: [{ path: ['cookieOptions', 'browserCookies'], message: 'Invalid enum value' }]
            }),
            headers: {},
          });
        }
        
        // Check for error cases
        if (body.instagramReelUrl === 'https://www.instagram.com/reel/ERROR/') {
          return Promise.resolve({
            statusCode: 500,
            payload: JSON.stringify({
              code: 'INTERNAL_ERROR',
              message: 'Enhanced keyword extraction failed',
              details: 'Mock extraction error'
            }),
            headers: {},
          });
        }
        
        if (body.instagramReelUrl === 'https://www.instagram.com/reel/UNKNOWN_ERROR/') {
          return Promise.resolve({
            statusCode: 500,
            payload: JSON.stringify({
              code: 'INTERNAL_ERROR',
              message: 'Enhanced keyword extraction failed',
              details: 'Unknown error'
            }),
            headers: {},
          });
        }
        
        // Mock service call
        const { extractKeywordsEnhanced } = require('../services/keyword-extractor-enhanced');
        const mockResult = createMockEnhancedKeywordResult();
        extractKeywordsEnhanced.mockResolvedValue(mockResult);
        
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify(mockResult),
          headers: {},
        });
      }
      
      if (url === '/v1/keywords/health') {
        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify({
            status: 'ok',
            service: 'keyword-extractor',
            timestamp: new Date().toISOString()
          }),
          headers: {},
        });
      }
      
      // Analysis routes
      if (url === '/v1/analyze') {
        // Check for missing authorization
        const authHeader = options.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Missing authorization token'
            }),
            headers: {},
          });
        }

        const body = options.payload || {};
        
        // Check for missing request body
        if (!body || Object.keys(body).length === 0) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }
        
        // Check for invalid input structure
        if (!body.input || !body.input.url || !body.input.url.includes('http')) {
          return Promise.resolve({
            statusCode: 400,
            payload: JSON.stringify({
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data'
            }),
            headers: {},
          });
        }

        // Check for analysis failure (simulate with specific URL)
        if (body.input.url.includes('fail')) {
          return Promise.resolve({
            statusCode: 500,
            payload: JSON.stringify({
              code: 'INTERNAL_ERROR',
              message: 'Analysis failed'
            }),
            headers: {},
          });
        }

        // Check for async mode (simulate with specific URL)
        if (body.input.url.includes('async')) {
          return Promise.resolve({
            statusCode: 202,
            payload: JSON.stringify({
              analysisId: 'an_test123',
              mode: 'async',
              status: 'queued',
              message: 'Analysis queued for processing'
            }),
            headers: {},
          });
        }

        // Check for custom analysis ID header
        const analysisId = options.headers?.['x-analysis-id'];
        if (analysisId) {
          return Promise.resolve({
            statusCode: 200,
            payload: JSON.stringify(createMockAnalysisResult({
              analysisId: analysisId,
              mode: 'sync',
            })),
            headers: {
              'x-analysis-id': analysisId
            },
          });
        }

        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify(createMockAnalysisResult()),
          headers: {},
        });
      }
      
      if (url.startsWith('/v1/analyses/')) {
        // Check for missing authorization
        const authHeader = options.headers?.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Promise.resolve({
            statusCode: 401,
            payload: JSON.stringify({
              code: 'UNAUTHORIZED',
              message: 'Missing authorization token'
            }),
            headers: {},
          });
        }

        const analysisId = url.split('/').pop();
        
        // Check for non-existent analysis
        if (analysisId === 'nonexistent') {
          return Promise.resolve({
            statusCode: 404,
            payload: JSON.stringify({
              code: 'NOT_FOUND',
              message: 'Analysis not found'
            }),
            headers: {},
          });
        }

        // Check for database error (simulate with specific ID)
        if (analysisId === 'dberror') {
          return Promise.resolve({
            statusCode: 500,
            payload: JSON.stringify({
              code: 'INTERNAL_ERROR',
              message: 'Failed to fetch analysis'
            }),
            headers: {},
          });
        }

        // Check for pending analysis (simulate with specific ID)
        if (analysisId === 'pending') {
          return Promise.resolve({
            statusCode: 200,
            payload: JSON.stringify({
              analysisId: 'an_test123',
              status: 'processing',
              progress: 50,
              result: undefined
            }),
            headers: {},
          });
        }

        return Promise.resolve({
          statusCode: 200,
          payload: JSON.stringify(createMockAnalysis({
            id: analysisId,
          })),
          headers: {},
        });
      }
      
      // Default response
      return Promise.resolve({
        statusCode: 200,
        payload: JSON.stringify({ success: true }),
        headers: {},
      });
    }),
    close: jest.fn().mockResolvedValue(undefined),
    register: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
  } as TestFastifyInstance;
  
  return mockServer;
};

export const createMockUser = (overrides = {}) => ({
  projectId: 'test-project-123',
  userId: 'test-user-456',
  email: 'test@example.com',
  ...overrides,
});

export const createMockAnalysis = (overrides = {}) => ({
  id: 'an_test123',
  analysisId: 'an_test123',
  projectId: 'test-project-123',
  status: 'completed',
  progress: 100,
  error: null,
  scores: {
    risk: 0.2,
    vibe: 0.8,
    labels: {
      risk: 'Low Risk',
      vibe: 'Positive Vibe',
    },
    components: {
      brandFit: 0.8,
      compliance: 0.9,
    },
  },
  flags: [],
  evidence: {
    frames: [
      { t: 0, imageUrl: 'https://example.com/frame1.jpg', ocr: 'Sample text' },
    ],
    caption: 'Sample caption',
    transcript: 'Sample transcript',
  },
  videoContent: {
    content: {
      summary: 'Sample video content summary',
      mainMessage: 'Main message of the video',
      keyTopics: ['topic1', 'topic2'],
      contentType: 'lifestyle' as const,
      targetAudience: 'general audience',
    },
    hook: {
      openingHook: 'Welcome to our amazing product!',
      hookType: 'statement' as const,
      engagementElements: ['visual appeal', 'clear messaging'],
      callToAction: 'Learn more about our product',
    },
    production: {
      visualQuality: 'high' as const,
      audioQuality: 'high' as const,
      editingStyle: 'professional' as const,
      colorScheme: ['#FF0000', '#00FF00', '#0000FF'],
      visualElements: ['logo', 'text overlay', 'background'],
    },
    performance: {
      pacing: 'moderate' as const,
      energyLevel: 'high' as const,
      emotionalTone: 'positive' as const,
      authenticity: 'high' as const,
    },
    recommendations: {
      strengths: ['Good lighting', 'Clear audio'],
      improvements: ['Better pacing', 'More engagement'],
      suggestedActions: ['Add more visual elements', 'Improve call-to-action'],
    },
    brandAlignment: {
      brandFit: 0.8,
      messagingConsistency: 0.9,
      visualConsistency: 0.7,
      toneAlignment: 0.8,
    },
    duration: 30,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
  },
  artifacts: {
    pdfUrl: 'https://example.com/report.pdf',
  },
  timings: {
    totalMs: 5000,
    stages: {
      extract: 2000,
      analyze: 2000,
      score: 1000,
    },
  },
  result: {
    scores: {
      risk: 0.2,
      vibe: 0.8,
      labels: {
        risk: 'Low Risk',
        vibe: 'Positive Vibe',
      },
      components: {
        brandFit: 0.8,
        compliance: 0.9,
      },
    },
  },
  ruleset: 'v1.0.0',
  ...overrides,
});

export const createMockAnalysisResult = (overrides = {}) => ({
  analysisId: 'an_test123',
  mode: 'sync' as const,
  status: 'completed' as const,
  scores: {
    risk: 0.2,
    vibe: 0.8,
    labels: {
      risk: 'Low Risk',
      vibe: 'Positive Vibe',
    },
    components: {
      brandFit: 0.8,
      compliance: 0.9,
    },
  },
  flags: [],
  evidence: {
    frames: [
      { t: 0, imageUrl: 'https://example.com/frame1.jpg', ocr: 'Sample text' },
    ],
    caption: 'Sample caption',
    transcript: 'Sample transcript',
  },
  videoContent: {
    content: {
      summary: 'Sample video content summary',
      mainMessage: 'Main message of the video',
      keyTopics: ['topic1', 'topic2'],
      contentType: 'lifestyle' as const,
      targetAudience: 'general audience',
    },
    hook: {
      openingHook: 'Welcome to our amazing product!',
      hookType: 'statement' as const,
      engagementElements: ['visual appeal', 'clear messaging'],
      callToAction: 'Learn more about our product',
    },
    production: {
      visualQuality: 'high' as const,
      audioQuality: 'high' as const,
      editingStyle: 'professional' as const,
      colorScheme: ['#FF0000', '#00FF00', '#0000FF'],
      visualElements: ['logo', 'text overlay', 'background'],
    },
    performance: {
      pacing: 'moderate' as const,
      energyLevel: 'high' as const,
      emotionalTone: 'positive' as const,
      authenticity: 'high' as const,
    },
    recommendations: {
      strengths: ['Good lighting', 'Clear audio'],
      improvements: ['Better pacing', 'More engagement'],
      suggestedActions: ['Add more visual elements', 'Improve call-to-action'],
    },
    brandAlignment: {
      brandFit: 0.8,
      messagingConsistency: 0.9,
      visualConsistency: 0.7,
      toneAlignment: 0.8,
    },
    duration: 30,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
  },
  artifacts: {
    pdfUrl: 'https://example.com/report.pdf',
  },
  timings: {
    totalMs: 5000,
    stages: {
      extract: 2000,
      analyze: 2000,
      score: 1000,
    },
  },
  version: 'v1.0.0',
  ...overrides,
});

export const createMockKeywordResult = (overrides = {}) => ({
  keywords: {
    primary: ['fashion', 'style', 'outfit'],
    secondary: ['trendy', 'chic', 'elegant'],
    hashtags: ['#fashion', '#style', '#ootd'],
    mentions: ['@brand', '@influencer'],
    topics: ['fashion', 'lifestyle'],
  },
  metadata: {
    caption: 'Check out this amazing outfit! #fashion #style',
    transcript: 'This is a great outfit for the summer season',
    ocrText: 'Brand Name',
    duration: 30,
    username: 'fashionista',
  },
  searchableTerms: ['fashion', 'style', 'outfit', 'summer', 'brand'],
  timings: {
    totalMs: 5000,
    stages: {
      extract: 2000,
      asr: 1500,
      ocr: 1000,
      processing: 500,
    },
  },
  ...overrides,
});

export const createMockEnhancedKeywordResult = (overrides = {}) => ({
  keywords: {
    primary: [
      { term: 'skincare', confidence: 0.95, type: 'single' as const },
      { term: 'routine', confidence: 0.88, type: 'single' as const }
    ],
    secondary: ['beauty', 'skin', 'care'],
    phrases: [
      { text: 'skincare routine', frequency: 2, significance: 0.8 }
    ],
    hashtags: ['#skincare', '#beauty'],
    mentions: ['@brand']
  },
  topics: {
    primary: { category: 'fashion', subcategory: 'skincare', confidence: 0.92 },
    secondary: [{ category: 'beauty', confidence: 0.85 }]
  },
  sentiment: {
    overall: 'positive' as const,
    score: 3.2,
    comparative: 0.8,
    emotions: ['excitement']
  },
  intent: {
    primary: 'educate' as const,
    secondary: ['inform'],
    confidence: 0.9
  },
  entities: {
    brands: ['nike'],
    products: ['cleanser'],
    people: ['influencer'],
    prices: ['$50'],
    locations: ['New York']
  },
  metadata: {
    caption: 'Amazing skincare routine!',
    transcript: 'This is an amazing skincare routine',
    ocrText: 'Brand Name',
    duration: 30,
    username: 'beautyexpert',
    complexity: 'moderate' as const
  },
  searchableTerms: ['skincare', 'routine', 'beauty', 'fashion'],
  timings: {
    totalMs: 2500,
    stages: {
      extract: 800,
      asr: 1200,
      ocr: 300,
      processing: 200,
      enhancement: 200
    }
  },
  ...overrides,
});