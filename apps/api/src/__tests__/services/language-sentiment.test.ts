import { analyzeSentimentMultilingual } from '../../services/language/sentiment';

describe('Multilingual Sentiment Analysis', () => {
  describe('English sentiment', () => {
    it('should analyze positive English text', () => {
      const result = analyzeSentimentMultilingual(
        'This is amazing and wonderful!', 
        'Great content!', 
        'en'
      );
      expect(result.overall).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should analyze negative English text', () => {
      const result = analyzeSentimentMultilingual(
        'This is terrible and awful!', 
        'Bad content!', 
        'en'
      );
      expect(result.overall).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });

    it('should analyze neutral English text', () => {
      const result = analyzeSentimentMultilingual(
        'This is okay and fine.', 
        'Normal content.', 
        'en'
      );
      expect(result.overall).toBe('neutral');
    });
  });

  describe('Hindi sentiment', () => {
    it('should analyze positive Hindi text', () => {
      const result = analyzeSentimentMultilingual(
        'यह अद्भुत और शानदार है!', 
        'बहुत अच्छा कंटेंट!', 
        'hi'
      );
      expect(result.overall).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should analyze negative Hindi text', () => {
      const result = analyzeSentimentMultilingual(
        'यह बुरा और भयानक है!', 
        'खराब कंटेंट!', 
        'hi'
      );
      expect(result.overall).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });
  });

  describe('Hinglish sentiment', () => {
    it('should analyze positive Hinglish text', () => {
      const result = analyzeSentimentMultilingual(
        'यह amazing और wonderful है!', 
        'बहुत accha content!', 
        'hi-en'
      );
      expect(result.overall).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should analyze negative Hinglish text', () => {
      const result = analyzeSentimentMultilingual(
        'यह bad और terrible है!', 
        'बहुत bura content!', 
        'hi-en'
      );
      expect(result.overall).toBe('negative');
      expect(result.score).toBeLessThan(0);
    });

    it('should detect mixed positive emotions', () => {
      const result = analyzeSentimentMultilingual(
        'accha badhiya amazing best good nice beautiful', 
        'great stuff', 
        'hi-en'
      );
      expect(result.emotions).toContain('positive');
    });
  });
});
