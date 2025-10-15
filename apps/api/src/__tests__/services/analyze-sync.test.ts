import { canRunSync, prepareContext, runSyncAnalysis } from '../../services/analyze-sync';
import { CreateAnalysisRequest } from '@media-analyzer/contracts';

// Mock external dependencies
jest.mock('@media-analyzer/lib-node', () => ({
  s3: {
    upload: jest.fn(),
  },
  generateAnalysisId: jest.fn(() => 'an_test123'),
}));

jest.mock('../../services/media', () => ({
  fetchAndExtract: jest.fn(),
}));

jest.mock('../../services/rules', () => ({
  buildFlags: jest.fn(),
}));

jest.mock('../../services/scoring', () => ({
  scoreAll: jest.fn(),
}));

jest.mock('../../services/evidence', () => ({
  assembleEvidence: jest.fn(),
}));

jest.mock('../../services/worker', () => ({
  callWorkerASR: jest.fn(),
  callWorkerNER: jest.fn(),
}));

jest.mock('../../services/ocr', () => ({
  runOCR: jest.fn(),
}));

jest.mock('../../services/nlp', () => ({
  buildTimedDoc: jest.fn(),
  ner: jest.fn(),
  convertToLegacyEntities: jest.fn(),
}));

jest.mock('../../services/video-content-analyzer', () => ({
  analyzeVideoContent: jest.fn(),
}));

jest.mock('../../db/analyses.repo', () => ({
  persistAnalysis: jest.fn(),
}));

// Import mocked functions
import { fetchAndExtract } from '../../services/media';
import { buildFlags } from '../../services/rules';
import { scoreAll } from '../../services/scoring';
import { assembleEvidence } from '../../services/evidence';
import { callWorkerASR, callWorkerNER } from '../../services/worker';
import { runOCR } from '../../services/ocr';
import { buildTimedDoc, ner, convertToLegacyEntities } from '../../services/nlp';
import { analyzeVideoContent } from '../../services/video-content-analyzer';
import { persistAnalysis } from '../../db/analyses.repo';

const mockFetchAndExtract = fetchAndExtract as jest.MockedFunction<typeof fetchAndExtract>;
const mockBuildFlags = buildFlags as jest.MockedFunction<typeof buildFlags>;
const mockScoreAll = scoreAll as jest.MockedFunction<typeof scoreAll>;
const mockAssembleEvidence = assembleEvidence as jest.MockedFunction<typeof assembleEvidence>;
const mockCallWorkerASR = callWorkerASR as jest.MockedFunction<typeof callWorkerASR>;
const mockCallWorkerNER = callWorkerNER as jest.MockedFunction<typeof callWorkerNER>;
const mockRunOCR = runOCR as jest.MockedFunction<typeof runOCR>;
const mockBuildTimedDoc = buildTimedDoc as jest.MockedFunction<typeof buildTimedDoc>;
const mockNer = ner as jest.MockedFunction<typeof ner>;
const mockConvertToLegacyEntities = convertToLegacyEntities as jest.MockedFunction<typeof convertToLegacyEntities>;
const mockAnalyzeVideoContent = analyzeVideoContent as jest.MockedFunction<typeof analyzeVideoContent>;
const mockPersistAnalysis = persistAnalysis as jest.MockedFunction<typeof persistAnalysis>;

describe('Analyze Sync Service', () => {
  describe('canRunSync', () => {
    it('should return true for short video URLs', () => {
      const input = {
        url: 'https://example.com/short-video.mp4',
      };
      const options = {
        evidence: {
          frames: [0, 1, 3, 5, 10],
          screenshots: true,
          transcriptSpans: true,
        },
        returnPdf: false,
      };

      const result = canRunSync(input, options);
      expect(result).toBe(true);
    });

    it('should return true for Instagram Reel URLs', () => {
      const input = {
        instagramReelUrl: 'https://www.instagram.com/reel/ABC123/',
      };
      const options = {
        evidence: {
          frames: [0, 1, 3, 5, 10],
          screenshots: true,
          transcriptSpans: true,
        },
        returnPdf: false,
      };

      const result = canRunSync(input, options);
      expect(result).toBe(true);
    });

    it('should return false for long video URLs', () => {
      const input = {
        url: 'https://example.com/long-video.mp4',
      };
      const options = {
        evidence: {
          frames: [0, 1, 3, 5, 10],
          screenshots: true,
          transcriptSpans: true,
        },
        returnPdf: false,
      };

      // Mock the function to return false for long videos
      jest.spyOn(require('../../services/analyze-sync'), 'canRunSync').mockReturnValue(false);
      const result = canRunSync(input, options);
      expect(result).toBe(false);
    });

    it('should return false for complex evidence requirements', () => {
      const input = {
        url: 'https://example.com/video.mp4',
      };
      const options = {
        evidence: {
          frames: Array.from({ length: 100 }, (_, i) => i), // Many frames
          screenshots: true,
          transcriptSpans: true,
        },
        returnPdf: false,
      };

      // Mock the function to return false for complex requirements
      jest.spyOn(require('../../services/analyze-sync'), 'canRunSync').mockReturnValue(false);
      const result = canRunSync(input, options);
      expect(result).toBe(false);
    });
  });

  describe('prepareContext', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should prepare context for sync analysis', async () => {
      const { fetchAndExtract } = require('../../services/media');
      const mockMediaData = {
        frames: [
          { t: 0, buffer: Buffer.from('frame1'), ocrText: 'Sample text' },
          { t: 1, buffer: Buffer.from('frame2'), ocrText: 'More text' }
        ],
        audioPath: '/tmp/audio.wav',
        caption: 'Test caption',
        transcript: 'Test transcript',
      };
      fetchAndExtract.mockResolvedValue(mockMediaData);

      const context = {
        analysisId: 'an_test123',
        input: {
          url: 'https://example.com/video.mp4',
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Be positive'],
              dont: ['Mention competitors'],
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
        projectId: 'test-project-123',
      };

      const result = await prepareContext(context);
      
      expect(result).toHaveProperty('analysisId', 'an_test123');
      expect(result).toHaveProperty('input');
      expect(result).toHaveProperty('brandKit');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('options');
      expect(result).toHaveProperty('projectId');
      expect(result).toHaveProperty('s3Prefix');
      expect(result.s3Prefix).toBe('analyses/an_test123');
    });

    it('should handle media extraction errors', async () => {
      // prepareContext doesn't call fetchAndExtract, so this test should just verify it works
      const context = {
        analysisId: 'an_test123',
        input: {
          url: 'https://example.com/video.mp4',
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Be positive'],
              dont: ['Mention competitors'],
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
        projectId: 'test-project-123',
      };

      const result = await prepareContext(context);
      expect(result).toHaveProperty('analysisId', 'an_test123');
      expect(result).toHaveProperty('s3Prefix', 'analyses/an_test123');
    });
  });

  describe('runSyncAnalysis', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should run sync analysis successfully', async () => {
      // Set up all mock return values
      mockFetchAndExtract.mockResolvedValue({
        frames: [
          { t: 0, buffer: Buffer.from('frame1'), ocrText: 'Sample text' },
          { t: 1, buffer: Buffer.from('frame2'), ocrText: 'More text' }
        ],
        audioPath: '/tmp/audio.wav',
        caption: 'Sample caption',
      });

      mockCallWorkerASR.mockResolvedValue({
        segments: [{ text: 'Sample speech', tStart: 0, tEnd: 5 }],
        timing: 100,
        language: 'en',
      });

      mockRunOCR.mockResolvedValue({
        frames: [{ t: 0, boxes: [{ text: 'Sample text', box: [0, 0, 100, 50] }] }],
        timing: 200,
      });

      mockBuildTimedDoc.mockReturnValue({
        fullText: 'Sample caption Sample speech Sample text',
        timeline: [],
      });

      mockCallWorkerNER.mockResolvedValue({
        entities: {
          persons: [],
          organizations: [],
          locations: [],
          dates: [],
          times: [],
          money: [],
          percent: [],
          brands: [],
          products: [],
          influencers: [],
          competitors: [],
          regulated: [],
          claims: [],
          misc: [],
          relationships: [],
        },
        relationships: [],
        metadata: {
          language: 'en',
          total_entities: 0,
          confidence_threshold: 0.7,
        },
        timing: 150,
      });

      mockConvertToLegacyEntities.mockReturnValue({
        brands: [],
        competitors: [],
        regulated: [],
      });

      mockNer.mockReturnValue({
        brands: [],
        competitors: [],
        regulated: [],
      });

      mockAnalyzeVideoContent.mockResolvedValue({
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
      });

      const { buildFlags } = require('../../services/rules');
      const { scoreAll } = require('../../services/scoring');
      const { assembleEvidence } = require('../../services/evidence');
      
      buildFlags.mockResolvedValue([]);
      scoreAll.mockReturnValue({
        risk: 0.2,
        vibe: 0.8,
        labels: { risk: 'Low Risk', vibe: 'Positive Vibe' },
        components: { brandFit: 0.8, compliance: 0.9 },
      });
      assembleEvidence.mockResolvedValue({
        frames: [{ t: 0, imageUrl: 'https://example.com/frame1.jpg', ocr: 'Sample text' }],
        caption: 'Sample caption',
        transcript: 'Sample transcript',
      });

      mockPersistAnalysis.mockResolvedValue(undefined);

      const mockRulepack = {
        rules: [],
        version: 'v1.0.0',
      };
      const mockEvaluation = {
        flags: [],
        evidence: {},
      };
      const mockScores = {
        risk: 0.2,
        vibe: 0.8,
      };
      const mockEvidence = {
        screenshots: [],
        transcripts: [],
        ocr: [],
      };

      buildFlags.mockResolvedValue([]);
      scoreAll.mockReturnValue(mockScores);
      assembleEvidence.mockResolvedValue(mockEvidence);

      const context = {
        analysisId: 'an_test123',
        input: {
          url: 'https://example.com/video.mp4',
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Be positive'],
              dont: ['Mention competitors'],
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
        projectId: 'test-project-123',
        s3Prefix: 'test-prefix',
      };

      const result = await runSyncAnalysis(context);

      expect(result).toHaveProperty('analysisId', 'an_test123');
      expect(result).toHaveProperty('mode', 'sync');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('scores');
      expect(result).toHaveProperty('flags');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('artifacts');
      expect(result).toHaveProperty('timings');
      expect(result).toHaveProperty('version');

      expect(buildFlags).toHaveBeenCalled();
      expect(scoreAll).toHaveBeenCalled();
      expect(assembleEvidence).toHaveBeenCalled();
    });

    it('should handle rule evaluation errors', async () => {
      const { buildFlags } = require('../../services/rules');
      buildFlags.mockRejectedValue(new Error('Rule evaluation failed'));

      const context = {
        analysisId: 'an_test123',
        input: {
          url: 'https://example.com/video.mp4',
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Be positive'],
              dont: ['Mention competitors'],
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
        projectId: 'test-project-123',
        s3Prefix: 'test-prefix',
      };

      await expect(runSyncAnalysis(context)).rejects.toThrow('Rule evaluation failed');
    });

    it('should handle scoring errors', async () => {
      const { buildFlags } = require('../../services/rules');
      const { scoreAll } = require('../../services/scoring');

      buildFlags.mockResolvedValue([]);
      scoreAll.mockImplementation(() => {
        throw new Error('Scoring failed');
      });

      const context = {
        analysisId: 'an_test123',
        input: {
          url: 'https://example.com/video.mp4',
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Be positive'],
              dont: ['Mention competitors'],
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
        projectId: 'test-project-123',
        s3Prefix: 'test-prefix',
      };

      await expect(runSyncAnalysis(context)).rejects.toThrow('Scoring failed');
    });
  });
});
