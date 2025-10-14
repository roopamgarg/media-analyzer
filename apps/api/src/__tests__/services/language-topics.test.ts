import { classifyTopicsMultilingual } from '../../services/language/topics';

describe('Multilingual Topic Classification', () => {
  describe('English topics', () => {
    it('should classify fashion content', () => {
      const result = classifyTopicsMultilingual(
        'fashion style outfit clothes dress shirt pants shoes accessories beauty makeup trendy stylish wardrobe apparel designer brand fashionable chic elegant casual formal streetwear vintage modern', 
        'en'
      );
      expect(result.primary.category).toBe('fashion');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should classify food content', () => {
      const result = classifyTopicsMultilingual(
        'food recipe cooking restaurant meal delicious tasty ingredients kitchen chef cuisine dish flavor taste cook bake grill fry steam boil seasoning spice herb nutrition healthy organic', 
        'en'
      );
      expect(result.primary.category).toBe('food');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should classify fitness content', () => {
      const result = classifyTopicsMultilingual(
        'fitness workout exercise gym training strength cardio yoga pilates running cycling swimming weight lifting bodybuilding crossfit aerobics stretching meditation wellness health nutrition diet protein supplements recovery rest', 
        'en'
      );
      expect(result.primary.category).toBe('fitness');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });
  });

  describe('Hindi topics', () => {
    it('should classify fashion content in Hindi', () => {
      const result = classifyTopicsMultilingual(
        'फैशन स्टाइल आउटफिट कपड़े ड्रेस शर्ट पैंट जूते एक्सेसरीज ब्यूटी मेकअप ट्रेंडी स्टाइलिश वार्डरोब अपैरल डिजाइनर ब्रांड फैशनेबल चिक एलिगेंट कैजुअल फॉर्मल स्ट्रीटवियर विंटेज मॉडर्न', 
        'hi'
      );
      expect(result.primary.category).toBe('fashion');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should classify food content in Hindi', () => {
      const result = classifyTopicsMultilingual(
        'खाना रेसिपी कुकिंग रेस्टोरेंट मील डेलिशियस टेस्टी इंग्रेडिएंट्स किचन शेफ क्विज़ीन डिश फ्लेवर टेस्ट कुक बेक ग्रिल फ्राई स्टीम बॉयल सीजनिंग स्पाइस हर्ब न्यूट्रिशन हेल्दी ऑर्गेनिक', 
        'hi'
      );
      expect(result.primary.category).toBe('food');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });
  });

  describe('Hinglish topics', () => {
    it('should classify fashion content in Hinglish', () => {
      const result = classifyTopicsMultilingual(
        'fashion style outfit clothes dress shirt pants shoes accessories beauty makeup trendy stylish wardrobe apparel designer brand fashionable chic elegant casual formal streetwear vintage modern फैशन स्टाइल आउटफिट कपड़े ड्रेस शर्ट पैंट जूते एक्सेसरीज ब्यूटी मेकअप ट्रेंडी स्टाइलिश वार्डरोब अपैरल डिजाइनर ब्रांड फैशनेबल चिक एलिगेंट कैजुअल फॉर्मल स्ट्रीटवियर विंटेज मॉडर्न', 
        'hi-en'
      );
      expect(result.primary.category).toBe('fashion');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });

    it('should classify fitness content in Hinglish', () => {
      const result = classifyTopicsMultilingual(
        'fitness workout exercise gym training strength cardio yoga pilates running cycling swimming weight lifting bodybuilding crossfit aerobics stretching meditation wellness health nutrition diet protein supplements recovery rest फिटनेस वर्कआउट एक्सरसाइज जिम ट्रेनिंग स्ट्रेंथ कार्डियो योगा पिलेट्स रनिंग साइक्लिंग स्विमिंग वेट लिफ्टिंग बॉडीबिल्डिंग क्रॉसफिट एरोबिक्स स्ट्रेचिंग मेडिटेशन वेलनेस हेल्थ न्यूट्रिशन डाइट प्रोटीन सप्लीमेंट्स रिकवरी रेस्ट', 
        'hi-en'
      );
      expect(result.primary.category).toBe('fitness');
      expect(result.primary.confidence).toBeGreaterThan(0);
    });
  });
});
