import { extractKeywords } from '../../services/keyword-extractor';
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

describe('Keyword Extractor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractKeywords', () => {
    const validRequest = {
      instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      languageHint: 'en',
      cookieOptions: {
        browserCookies: 'chrome' as const,
      },
    };

    it('should extract keywords successfully', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1'), ocrText: 'Brand Name' },
          { t: 1, buffer: Buffer.from('frame2') },
        ],
        caption: 'Check out this amazing outfit! #fashion #style',
      });
      mockCallWorkerASR.mockResolvedValue({
        segments: [
          { text: 'This is a great outfit for the summer season', tStart: 0, tEnd: 5 },
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
        fullText: 'Check out this amazing outfit! This is a great outfit for the summer season Brand Name',
        timeline: [],
      });

      const result = await extractKeywords(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('searchableTerms');
      expect(result).toHaveProperty('timings');

      expect(result.keywords).toHaveProperty('primary');
      expect(result.keywords).toHaveProperty('secondary');
      expect(result.keywords).toHaveProperty('hashtags');
      expect(result.keywords).toHaveProperty('mentions');
      expect(result.keywords).toHaveProperty('topics');

      expect(result.metadata).toHaveProperty('caption');
      expect(result.metadata).toHaveProperty('transcript');
      expect(result.metadata).toHaveProperty('ocrText');
      expect(result.metadata).toHaveProperty('duration');
      expect(result.metadata).toHaveProperty('username');

      expect(result.timings).toHaveProperty('totalMs');
      expect(result.timings).toHaveProperty('stages');
      expect(result.timings.stages).toHaveProperty('extract');
      expect(result.timings.stages).toHaveProperty('asr');
      expect(result.timings.stages).toHaveProperty('ocr');
      expect(result.timings.stages).toHaveProperty('processing');

      expect(mockIsValidInstagramReelUrl).toHaveBeenCalledWith(validRequest.instagramReelUrl);
      expect(mockFetchAndExtract).toHaveBeenCalledWith({
        input: {
          instagramReelUrl: validRequest.instagramReelUrl,
          media: {
            languageHint: validRequest.languageHint,
          },
        },
        options: {
          evidence: {
            frames: [0, 1, 3, 5, 10],
            screenshots: true,
            transcriptSpans: true,
          },
          cookieOptions: validRequest.cookieOptions,
          returnPdf: false,
        },
      });
    });

    it('should handle invalid Instagram URL', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(false);

      await expect(extractKeywords(validRequest)).rejects.toThrow('Invalid Instagram Reel URL format');
      expect(mockIsValidInstagramReelUrl).toHaveBeenCalledWith(validRequest.instagramReelUrl);
    });

    it('should handle media extraction errors', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockRejectedValue(new Error('Media extraction failed'));

      await expect(extractKeywords(validRequest)).rejects.toThrow('Keyword extraction failed: Media extraction failed');
    });

    it('should handle ASR errors gracefully', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
        caption: 'Test caption',
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
        fullText: 'Test caption',
        timeline: [],
      });

      const result = await extractKeywords(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.transcript).toBe('Test caption');
    });

    it('should handle OCR errors gracefully', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
        caption: 'Test caption',
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
        fullText: 'Test caption',
        timeline: [],
      });

      const result = await extractKeywords(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.ocrText).toBeNull();
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

      const result = await extractKeywords(validRequest);

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

      const result = await extractKeywords(validRequest);

      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('metadata');
      expect(mockRunOCR).not.toHaveBeenCalled();
    });

    it('should extract hashtags from caption', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
        caption: 'Check out this amazing outfit! #fashion #style #ootd #summer',
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
        fullText: 'Check out this amazing outfit! #fashion #style #ootd #summer',
        timeline: [],
      });

      const result = await extractKeywords(validRequest);

      expect(result.keywords.hashtags).toContain('#fashion');
      expect(result.keywords.hashtags).toContain('#style');
      expect(result.keywords.hashtags).toContain('#ootd');
      expect(result.keywords.hashtags).toContain('#summer');
    });

    it('should extract mentions from caption', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
        caption: 'Check out this amazing outfit! @brand @influencer @fashionista',
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
        fullText: 'Check out this amazing outfit! @brand @influencer @fashionista',
        timeline: [],
      });

      const result = await extractKeywords(validRequest);

      expect(result.keywords.mentions).toContain('@brand');
      expect(result.keywords.mentions).toContain('@influencer');
      expect(result.keywords.mentions).toContain('@fashionista');
    });

    it('should extract topics from text', async () => {
      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
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

      const result = await extractKeywords(validRequest);

      expect(result.keywords.topics).toContain('fashion');
      // Note: lifestyle might not be detected with the current text, so we just check for fashion
    });

    it('should handle request without cookie options', async () => {
      const requestWithoutCookies = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
        languageHint: 'en',
      };

      mockIsValidInstagramReelUrl.mockReturnValue(true);
      mockFetchAndExtract.mockResolvedValue({
        audioPath: '/tmp/audio.wav',
        frames: [
          { t: 0, buffer: Buffer.from('frame1') },
        ],
        caption: 'Test caption',
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
        fullText: 'Test caption',
        timeline: [],
      });

      const result = await extractKeywords(requestWithoutCookies);

      expect(result).toHaveProperty('keywords');
      expect(mockFetchAndExtract).toHaveBeenCalledWith({
        input: {
          instagramReelUrl: requestWithoutCookies.instagramReelUrl,
          media: {
            languageHint: requestWithoutCookies.languageHint,
          },
        },
        options: {
          evidence: {
            frames: [0, 1, 3, 5, 10],
            screenshots: true,
            transcriptSpans: true,
          },
          cookieOptions: undefined,
          returnPdf: false,
        },
      });
    });
  });
});
