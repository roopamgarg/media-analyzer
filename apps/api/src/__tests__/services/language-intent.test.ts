import { detectIntentMultilingual } from '../../services/language/intent';

describe('Multilingual Intent Detection', () => {
  describe('English intent', () => {
    it('should detect educational intent', () => {
      const result = detectIntentMultilingual(
        'How to learn programming step by step tutorial guide', 
        'Learn coding basics', 
        'en'
      );
      expect(result.primary).toBe('educate');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect entertainment intent', () => {
      const result = detectIntentMultilingual(
        'Funny comedy dance music challenge prank', 
        'Entertainment content', 
        'en'
      );
      expect(result.primary).toBe('entertain');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect promotional intent', () => {
      const result = detectIntentMultilingual(
        'Buy this product sale discount offer shop purchase', 
        'Check out our store', 
        'en'
      );
      expect(result.primary).toBe('promote');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Hindi intent', () => {
    it('should detect educational intent in Hindi', () => {
      const result = detectIntentMultilingual(
        'कैसे सीखना प्रोग्रामिंग स्टेप बाय स्टेप ट्यूटोरियल गाइड', 
        'कोडिंग बेसिक्स सीखें', 
        'hi'
      );
      expect(result.primary).toBe('educate');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect entertainment intent in Hindi', () => {
      const result = detectIntentMultilingual(
        'मजाक कॉमेडी डांस संगीत चैलेंज प्रैंक', 
        'मनोरंजन कंटेंट', 
        'hi'
      );
      expect(result.primary).toBe('entertain');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Hinglish intent', () => {
    it('should detect educational intent in Hinglish', () => {
      const result = detectIntentMultilingual(
        'कैसे learn करना programming step by step tutorial guide', 
        'coding basics सीखें', 
        'hi-en'
      );
      expect(result.primary).toBe('educate');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect promotional intent in Hinglish', () => {
      const result = detectIntentMultilingual(
        'buy करें यह product sale discount offer shop purchase', 
        'check out करें हमारा store', 
        'hi-en'
      );
      expect(result.primary).toBe('promote');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect inspire intent in Hinglish', () => {
      const result = detectIntentMultilingual(
        'motivation inspire success achieve dream goal mindset', 
        'be inspired and motivated', 
        'hi-en'
      );
      expect(result.primary).toBe('inspire');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
});
