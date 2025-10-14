import { extractKeywordsEnhanced } from '../../services/keyword-extractor-enhanced';
import { downloadInstagramReel, isValidInstagramReelUrl } from '../../services/instagram';
import { fetchAndExtract } from '../../services/media';
import { callWorkerASR } from '../../services/worker';
import { runOCR } from '../../services/ocr';
import { buildTimedDoc } from '../../services/nlp';

// Mock external dependencies
jest.mock('../../services/instagram');
jest.mock('../../services/media');
jest.mock('../../services/worker');
jest.mock('../../services/ocr');
jest.mock('../../services/nlp');

const mockDownloadInstagramReel = downloadInstagramReel as jest.MockedFunction<typeof downloadInstagramReel>;
const mockIsValidInstagramReelUrl = isValidInstagramReelUrl as jest.MockedFunction<typeof isValidInstagramReelUrl>;
const mockFetchAndExtract = fetchAndExtract as jest.MockedFunction<typeof fetchAndExtract>;
const mockCallWorkerASR = callWorkerASR as jest.MockedFunction<typeof callWorkerASR>;
const mockRunOCR = runOCR as jest.MockedFunction<typeof runOCR>;
const mockBuildTimedDoc = buildTimedDoc as jest.MockedFunction<typeof buildTimedDoc>;

describe('Enhanced Keyword Extractor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractKeywordsEnhanced', () => {
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

    it('should extract enhanced keywords successfully', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1'), ocrText: 'Brand Name' },
          { t: 1, buffer: Buffer.from('frame2') },
        ],
        caption: 'Check out this amazing skincare routine! #skincare #beauty',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'This is an amazing skincare routine for beginners', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [
          {
            t: 0,
            boxes: [
              { text: 'Brand Name', box: [0, 0, 100, 50] },
            ],
          },
        ],
        timing: 1000,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Check out this amazing skincare routine! This is an amazing skincare routine for beginners Brand Name',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('searchableTerms');
      expect(result).toHaveProperty('timings');

      // Check enhanced keyword structure
      expect(result.keywords).toHaveProperty('primary');
      expect(result.keywords).toHaveProperty('secondary');
      expect(result.keywords).toHaveProperty('phrases');
      expect(result.keywords).toHaveProperty('hashtags');
      expect(result.keywords).toHaveProperty('mentions');

      // Check primary keywords have confidence and type
      expect(result.keywords.primary[0]).toHaveProperty('term');
      expect(result.keywords.primary[0]).toHaveProperty('confidence');
      expect(result.keywords.primary[0]).toHaveProperty('type');

      // Check topics structure
      expect(result.topics).toHaveProperty('primary');
      expect(result.topics).toHaveProperty('secondary');
      expect(result.topics.primary).toHaveProperty('category');
      expect(result.topics.primary).toHaveProperty('confidence');

      // Check sentiment structure
      expect(result.sentiment).toHaveProperty('overall');
      expect(result.sentiment).toHaveProperty('score');
      expect(result.sentiment).toHaveProperty('comparative');
      expect(result.sentiment).toHaveProperty('emotions');

      // Check intent structure
      expect(result.intent).toHaveProperty('primary');
      expect(result.intent).toHaveProperty('secondary');
      expect(result.intent).toHaveProperty('confidence');

      // Check entities structure
      expect(result.entities).toHaveProperty('brands');
      expect(result.entities).toHaveProperty('products');
      expect(result.entities).toHaveProperty('people');
      expect(result.entities).toHaveProperty('prices');
      expect(result.entities).toHaveProperty('locations');

      // Check metadata includes complexity
      expect(result.metadata).toHaveProperty('complexity');
    });

    it('should handle options to disable features', async () => {
      const requestWithDisabledOptions = {
        ...validRequest,
        options: {
          includeNgrams: false,
          includeSentiment: false,
          includeIntent: false,
          includeEntities: false,
        },
      };

      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [{ t: 0, buffer: Buffer.from('frame1') }],
        caption: 'Simple caption',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [],
        timing: 0,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Simple caption',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(requestWithDisabledOptions);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('topics');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('entities');

      // With disabled options, should still have basic structure but minimal data
      expect(result.keywords.phrases).toEqual([]);
      expect(result.sentiment.overall).toBe('neutral');
      expect(result.intent.primary).toBe('unknown');
      expect(result.entities.brands).toEqual([]);
    });

    it('should extract n-grams correctly', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'Morning skincare routine is amazing',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'Morning skincare routine is amazing for your skin', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Morning skincare routine is amazing Morning skincare routine is amazing for your skin',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result.keywords.phrases.length).toBeGreaterThan(0);
      expect(result.keywords.phrases[0]).toHaveProperty('text');
      expect(result.keywords.phrases[0]).toHaveProperty('frequency');
      expect(result.keywords.phrases[0]).toHaveProperty('significance');
    });

    it('should detect sentiment correctly', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'This is absolutely terrible and disappointing',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'This product is awful and I hate it', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'This is absolutely terrible and disappointing This product is awful and I hate it',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result.sentiment.overall).toBe('negative');
      expect(result.sentiment.score).toBeLessThan(0);
    });

    it('should detect intent correctly', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'Learn how to do this amazing tutorial step by step',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'This tutorial will teach you everything you need to know', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Learn how to do this amazing tutorial step by step This tutorial will teach you everything you need to know',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result.intent.primary).toBe('educate');
      expect(result.intent.confidence).toBeGreaterThan(0);
    });

    it('should extract entities correctly', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'Check out this Nike product for $50',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'This Nike shoe is amazing and costs fifty dollars', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Check out this Nike product for $50 This Nike shoe is amazing and costs fifty dollars',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result.entities.brands).toContain('nike');
      expect(result.entities.prices.length).toBeGreaterThan(0);
    });

    it('should classify topics with confidence', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'Fashion and style tips for summer outfits',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'This is about fashion and style for summer season', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Fashion and style tips for summer outfits This is about fashion and style for summer season',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result.topics.primary.category).toBe('fashion');
      expect(result.topics.primary.confidence).toBeGreaterThan(0);
    });

    it('should analyze content complexity', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'This is a very complex algorithmic implementation with sophisticated methodology',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'The implementation requires advanced optimization techniques and complex analysis frameworks', tStart: 0, tEnd: 5 },
        ],
        timing: 1500,
        language: 'en',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'This is a very complex algorithmic implementation with sophisticated methodology The implementation requires advanced optimization techniques and complex analysis frameworks',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result.metadata.complexity).toBe('complex');
    });

    it('should handle invalid Instagram URL', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(false);

      const result = await extractKeywordsEnhanced(validRequest);
      expect(result).toBeDefined();
      expect(result.metadata.detectedLanguage).toBe('unknown');
      expect(result.metadata.languageConfidence).toBe(0);
    });

    it('should handle media extraction errors', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockRejectedValue(new Error('Media extraction failed'));

      const result = await extractKeywordsEnhanced(validRequest);
      expect(result).toBeDefined();
      expect(result.metadata.detectedLanguage).toBe('en');
      expect(result.metadata.languageConfidence).toBe(1.0);
    });

    it('should handle missing audio path', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: null as any,
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
        caption: 'Test caption',
      });
      mockRunOCR.mockResolvedValue({
        frames: [],
        timing: 0,
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Test caption',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('metadata');
      expect(mockCallWorkerASR).not.toHaveBeenCalled();
    });

    it('should handle missing frames', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [],
        caption: 'Test caption',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [],
        timing: 0,
        language: 'en',
      });
      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Test caption',
        timeline: [],
      });

      const result = await extractKeywordsEnhanced(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('metadata');
      expect(mockRunOCR).not.toHaveBeenCalled();
    });
  });
});
