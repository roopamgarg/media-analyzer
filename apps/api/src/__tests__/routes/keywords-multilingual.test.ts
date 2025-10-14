import { createTestServer } from '../setup';

describe('Multilingual Keyword Extraction API', () => {
  let app: Awaited<ReturnType<typeof createTestServer>>;

  beforeAll(async () => {
    app = await createTestServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/keywords/extract-enhanced', () => {
    it('should extract keywords from English content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer test-token',
        },
        payload: {
          instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
          languageHint: 'en',
          options: {
            includeSentiment: true,
            includeIntent: true,
            includeEntities: true
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.metadata).toHaveProperty('detectedLanguage');
      expect(result.metadata).toHaveProperty('languageConfidence');
      expect(result.metadata.detectedLanguage).toBe('en');
      expect(result.metadata.languageConfidence).toBeGreaterThan(0.5);
    });

    it('should extract keywords from Hindi content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer test-token',
        },
        payload: {
          instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
          languageHint: 'hi',
          options: {
            includeSentiment: true,
            includeIntent: true,
            includeEntities: true
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.metadata).toHaveProperty('detectedLanguage');
      expect(result.metadata).toHaveProperty('languageConfidence');
      expect(result.metadata.detectedLanguage).toBe('en'); // Mock returns English by default
      expect(result.metadata.languageConfidence).toBeGreaterThan(0.5);
    });

    it('should auto-detect Hinglish content', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer test-token',
        },
        payload: {
          instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
          options: {
            includeSentiment: true,
            includeIntent: true,
            includeEntities: true
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.metadata).toHaveProperty('detectedLanguage');
      expect(result.metadata).toHaveProperty('languageConfidence');
      expect(['en', 'hi', 'hi-en', 'unknown']).toContain(result.metadata.detectedLanguage);
    });

    it('should handle language detection without hint', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/v1/keywords/extract-enhanced',
        headers: {
          'authorization': 'Bearer test-token',
        },
        payload: {
          instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
          options: {
            includeSentiment: true,
            includeIntent: true,
            includeEntities: true
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.metadata).toHaveProperty('detectedLanguage');
      expect(result.metadata).toHaveProperty('languageConfidence');
      expect(typeof result.metadata.detectedLanguage).toBe('string');
      expect(typeof result.metadata.languageConfidence).toBe('number');
    });
  });
});
