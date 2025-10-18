import { z } from 'zod';
import { extractKeywords, KeywordExtractionRequest } from '../services/keyword-extractor';
import { extractKeywordsEnhanced, EnhancedKeywordExtractionRequest } from '../services/keyword-extractor-enhanced';

// Request validation schema
const KeywordExtractionRequestSchema = z.object({
  instagramReelUrl: z.string().url().refine(
    (url) => {
      const instagramPatterns = [
        /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
      ];
      return instagramPatterns.some(pattern => pattern.test(url));
    },
    { message: "Must be a valid Instagram Reel URL" }
  ).optional().describe("DEPRECATED: Use shortVideoUrl instead. This field will be removed in a future version."),
  shortVideoUrl: z.string().url().refine(
    (url) => {
      const instagramPatterns = [
        /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
      ];
      const youtubePatterns = [
        /^https?:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]+$/,
        /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]+$/,
      ];
      return instagramPatterns.some(pattern => pattern.test(url)) || 
             youtubePatterns.some(pattern => pattern.test(url));
    },
    { message: "Must be a valid Instagram Reel or YouTube Shorts URL" }
  ).optional(),
  languageHint: z.string().optional(),
  cookieOptions: z.object({
    browserCookies: z.enum(['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave']).optional(),
    cookiesFile: z.string().optional(),
  }).optional(),
}).refine((data) => !!(data.instagramReelUrl || data.shortVideoUrl), {
  message: "Provide either instagramReelUrl or shortVideoUrl",
  path: ['input']
});

// Enhanced request validation schema
const EnhancedKeywordExtractionRequestSchema = z.object({
  instagramReelUrl: z.string().url().refine(
    (url) => {
      const instagramPatterns = [
        /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
      ];
      return instagramPatterns.some(pattern => pattern.test(url));
    },
    { message: "Must be a valid Instagram Reel URL" }
  ).optional().describe("DEPRECATED: Use shortVideoUrl instead. This field will be removed in a future version."),
  shortVideoUrl: z.string().url().refine(
    (url) => {
      const instagramPatterns = [
        /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
        /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
      ];
      const youtubePatterns = [
        /^https?:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]+$/,
        /^https?:\/\/youtu\.be\/[A-Za-z0-9_-]+$/,
      ];
      return instagramPatterns.some(pattern => pattern.test(url)) || 
             youtubePatterns.some(pattern => pattern.test(url));
    },
    { message: "Must be a valid Instagram Reel or YouTube Shorts URL" }
  ).optional(),
  languageHint: z.string().optional(),
  cookieOptions: z.object({
    browserCookies: z.enum(['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave']).optional(),
    cookiesFile: z.string().optional(),
  }).optional(),
  options: z.object({
    includeNgrams: z.boolean().optional().default(true),
    includeSentiment: z.boolean().optional().default(true),
    includeIntent: z.boolean().optional().default(true),
    includeEntities: z.boolean().optional().default(true),
  }).optional(),
  async: z.boolean().optional().default(false),
}).refine((data) => !!(data.instagramReelUrl || data.shortVideoUrl), {
  message: "Provide either instagramReelUrl or shortVideoUrl",
  path: ['input']
});

export const keywordRoutes = async (fastify: any) => {
  fastify.post('/keywords/extract', async (request: any, reply: any) => {
    const startTime = Date.now();
    
    try {
      // Parse and validate request
      const parsed = KeywordExtractionRequestSchema.parse(request.body);
      
      fastify.log.info({
        instagramReelUrl: parsed.instagramReelUrl,
        projectId: request.user?.projectId,
      }, 'Starting keyword extraction');

      // Extract keywords
      const result = await extractKeywords({
        instagramReelUrl: parsed.instagramReelUrl,
        shortVideoUrl: parsed.shortVideoUrl,
        languageHint: parsed.languageHint,
        cookieOptions: parsed.cookieOptions,
      });
      
      const duration = Date.now() - startTime;
      fastify.log.info({
        instagramReelUrl: parsed.instagramReelUrl,
        projectId: request.user?.projectId,
        durationMs: duration,
        keywordCount: result.keywords.primary.length + result.keywords.secondary.length,
      }, 'Keyword extraction completed');

      return reply.send(result);
      
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      fastify.log.error({
        error: errorMessage,
        durationMs: duration,
        projectId: request.user?.projectId,
        instagramReelUrl: request.body?.instagramReelUrl,
      }, 'Keyword extraction failed');

      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: (error as any).errors,
        });
      }

      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Keyword extraction failed',
        details: errorMessage,
      });
    }
  });

  fastify.post('/keywords/extract-enhanced', async (request: any, reply: any) => {
    const startTime = Date.now();
    
    try {
      // Parse and validate request
      const parsed = EnhancedKeywordExtractionRequestSchema.parse(request.body);
      
      fastify.log.info({
        instagramReelUrl: parsed.instagramReelUrl,
        projectId: request.user?.projectId,
        options: parsed.options,
        async: parsed.async,
      }, 'Starting enhanced keyword extraction');

      // Extract enhanced keywords
      const result = await extractKeywordsEnhanced({
        instagramReelUrl: parsed.instagramReelUrl,
        shortVideoUrl: parsed.shortVideoUrl,
        languageHint: parsed.languageHint,
        cookieOptions: parsed.cookieOptions,
        options: parsed.options,
        async: parsed.async,
      });
      
      const duration = Date.now() - startTime;
      fastify.log.info({
        instagramReelUrl: parsed.instagramReelUrl,
        projectId: request.user?.projectId,
        durationMs: duration,
        primaryIntent: result.intent.primary,
        sentimentScore: result.sentiment.score,
        topicCategory: result.topics.primary.category,
        keywordCount: result.keywords.primary.length + result.keywords.secondary.length,
      }, 'Enhanced keyword extraction completed');

      return reply.send(result);
      
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      fastify.log.error({
        error: errorMessage,
        durationMs: duration,
        projectId: request.user?.projectId,
        instagramReelUrl: request.body?.instagramReelUrl,
      }, 'Enhanced keyword extraction failed');

      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: (error as any).errors,
        });
      }

      return reply.code(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Enhanced keyword extraction failed',
        details: errorMessage,
      });
    }
  });

  fastify.get('/keywords/health', async (request: any, reply: any) => {
    return reply.send({
      status: 'ok',
      service: 'keyword-extractor',
      timestamp: new Date().toISOString(),
    });
  });
};
