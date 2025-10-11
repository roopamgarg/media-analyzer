import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CreateAnalysisRequest } from '@media-analyzer/contracts';

describe('Analyze Route', () => {
  describe('Request Validation', () => {
    it('should validate a valid request', () => {
      const validRequest = {
        input: {
          url: 'https://example.com/video.mp4'
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000', '#00FF00'],
            doDonts: {
              do: ['Use our colors'],
              dont: ['Mention competitors']
            }
          }
        },
        category: 'Beauty'
      };

      expect(() => CreateAnalysisRequest.parse(validRequest)).not.toThrow();
    });

    it('should reject request without input', () => {
      const invalidRequest = {
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Use our colors'],
              dont: ['Mention competitors']
            }
          }
        },
        category: 'Beauty'
      };

      expect(() => CreateAnalysisRequest.parse(invalidRequest)).toThrow();
    });

    it('should reject request without brandKit', () => {
      const invalidRequest = {
        input: {
          url: 'https://example.com/video.mp4'
        },
        category: 'Beauty'
      };

      expect(() => CreateAnalysisRequest.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid category', () => {
      const invalidRequest = {
        input: {
          url: 'https://example.com/video.mp4'
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['#FF0000'],
            doDonts: {
              do: ['Use our colors'],
              dont: ['Mention competitors']
            }
          }
        },
        category: 'InvalidCategory'
      };

      expect(() => CreateAnalysisRequest.parse(invalidRequest)).toThrow();
    });

    it('should reject invalid color palette', () => {
      const invalidRequest = {
        input: {
          url: 'https://example.com/video.mp4'
        },
        brandKit: {
          inline: {
            brandName: 'TestBrand',
            palette: ['invalid-color'],
            doDonts: {
              do: ['Use our colors'],
              dont: ['Mention competitors']
            }
          }
        },
        category: 'Beauty'
      };

      expect(() => CreateAnalysisRequest.parse(invalidRequest)).toThrow();
    });
  });
});
