import { extractKeywordsEnhanced, EnhancedKeywordExtractionRequest } from '../../services/keyword-extractor-enhanced';

// Mock the external dependencies
jest.mock('../../services/instagram', () => ({
  isValidInstagramReelUrl: jest.fn(() => true),
}));

jest.mock('../../services/media', () => ({
  fetchAndExtract: jest.fn(() => Promise.resolve({
    audioPath: null,
    frames: [],
    caption: 'Test caption with some content',
  })),
}));

jest.mock('../../services/worker', () => ({
  callWorkerASR: jest.fn(() => Promise.reject(new Error('ASR service unavailable'))),
}));

jest.mock('../../services/ocr', () => ({
  runOCR: jest.fn(() => Promise.reject(new Error('OCR service unavailable'))),
}));

jest.mock('../../services/nlp', () => ({
  buildTimedDoc: jest.fn(() => ({
    fullText: 'Test caption with some content',
    segments: [],
    frames: [],
    timing: 0,
  })),
}));

describe('Enhanced Keyword Extractor Resilience', () => {
  it('should handle ASR service failures gracefully', async () => {
    const request: EnhancedKeywordExtractionRequest = {
      instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      languageHint: 'en',
      options: {
        includeSentiment: true,
        includeIntent: true,
        includeEntities: true,
      },
    };

    const result = await extractKeywordsEnhanced(request);

    // Should still return a valid result even with service failures
    expect(result).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.detectedLanguage).toBe('en');
    expect(result.metadata.languageConfidence).toBeGreaterThan(0.8);
    expect(result.keywords).toBeDefined();
    expect(result.topics).toBeDefined();
    expect(result.sentiment).toBeDefined();
    expect(result.intent).toBeDefined();
    expect(result.entities).toBeDefined();
    expect(result.searchableTerms).toBeDefined();
    expect(result.timings).toBeDefined();
  });

  it('should handle media extraction failures gracefully', async () => {
    // Mock media extraction failure
    const { fetchAndExtract } = require('../../services/media');
    fetchAndExtract.mockRejectedValueOnce(new Error('Media extraction failed'));

    const request: EnhancedKeywordExtractionRequest = {
      instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      languageHint: 'en',
    };

    const result = await extractKeywordsEnhanced(request);

    // Should still return a valid result even with media extraction failure
    expect(result).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.detectedLanguage).toBe('en');
    expect(result.metadata.languageConfidence).toBeGreaterThan(0.8);
  });

  it('should handle document building failures gracefully', async () => {
    // Mock document building failure
    const { buildTimedDoc } = require('../../services/nlp');
    buildTimedDoc.mockImplementationOnce(() => {
      throw new Error('Document building failed');
    });

    const request: EnhancedKeywordExtractionRequest = {
      instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      languageHint: 'en',
    };

    const result = await extractKeywordsEnhanced(request);

    // Should still return a valid result even with document building failure
    expect(result).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.detectedLanguage).toBe('en');
    expect(result.metadata.languageConfidence).toBeGreaterThan(0.8);
  });
});
