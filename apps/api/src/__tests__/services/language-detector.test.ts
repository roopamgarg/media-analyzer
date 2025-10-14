import { detectLanguage, isHinglishText } from '../../services/language/detector';

describe('Language Detector', () => {
  describe('detectLanguage', () => {
    it('should return language hint when provided', () => {
      const result = detectLanguage('Hello world', 'en');
      expect(result.language).toBe('en');
      expect(result.confidence).toBe(1.0);
    });

    it('should return language hint for Hindi', () => {
      const result = detectLanguage('नमस्ते दुनिया', 'hi');
      expect(result.language).toBe('hi');
      expect(result.confidence).toBe(1.0);
    });

    it('should auto-detect English text', () => {
      const result = detectLanguage('This is a beautiful day with amazing weather');
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should auto-detect Hindi text', () => {
      const result = detectLanguage('यह एक सुंदर दिन है और मौसम अद्भुत है');
      expect(result.language).toBe('hi');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Hinglish text', () => {
      const result = detectLanguage('यह amazing day है और weather बहुत accha है');
      expect(result.language).toBe('hi-en');
      expect(result.isHinglish).toBe(true);
    });

    it('should return unknown for unsupported language', () => {
      const result = detectLanguage('123456789');
      expect(result.language).toBe('unknown');
    });
  });

  describe('isHinglishText', () => {
    it('should detect Hinglish with mixed scripts', () => {
      const text = 'यह amazing day है और weather बहुत accha है';
      expect(isHinglishText(text)).toBe(true);
    });

    it('should detect Hinglish with common patterns', () => {
      const text = 'kya hai yeh amazing stuff aur kuch aur bhi accha hai';
      expect(isHinglishText(text)).toBe(true);
    });

    it('should not detect pure English as Hinglish', () => {
      const text = 'This is amazing and beautiful';
      expect(isHinglishText(text)).toBe(false);
    });

    it('should not detect pure Hindi as Hinglish', () => {
      const text = 'यह अद्भुत और सुंदर है';
      expect(isHinglishText(text)).toBe(false);
    });

    it('should detect Hinglish with transliterated words', () => {
      const text = 'accha badhiya amazing best good nice beautiful';
      expect(isHinglishText(text)).toBe(true);
    });
  });
});
