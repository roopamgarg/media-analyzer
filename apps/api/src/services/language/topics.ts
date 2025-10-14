import { SupportedLanguage } from './types';

/**
 * Hindi topic keywords
 */
export const TOPIC_KEYWORDS_HI = {
  'fashion': {
    keywords: ['फैशन', 'स्टाइल', 'आउटफिट', 'कपड़े', 'ड्रेस', 'शर्ट', 'पैंट', 'जूते', 'एक्सेसरीज', 'ब्यूटी', 'मेकअप', 'ट्रेंडी', 'स्टाइलिश', 'वार्डरोब', 'अपैरल', 'डिजाइनर', 'ब्रांड', 'फैशनेबल', 'चिक', 'एलिगेंट', 'कैजुअल', 'फॉर्मल', 'स्ट्रीटवियर', 'विंटेज', 'मॉडर्न'],
    weights: { 'फैशन': 2.0, 'स्टाइल': 1.8, 'आउटफिट': 1.5, 'ब्यूटी': 1.3 },
    subcategories: {
      'skincare': ['स्किनकेयर', 'स्किन', 'फेस', 'क्लींजर', 'मॉइस्चराइजर', 'सीरम', 'टोनर', 'एक्सफोलिएंट', 'मास्क', 'रूटीन'],
      'makeup': ['मेकअप', 'लिपस्टिक', 'फाउंडेशन', 'मस्कारा', 'आईशैडो', 'ब्लश', 'कंसीलर', 'प्राइमर', 'हाईलाइटर'],
      'clothing': ['आउटफिट', 'ड्रेस', 'शर्ट', 'पैंट', 'जूते', 'जैकेट', 'स्वेटर', 'जींस', 'स्कर्ट', 'ब्लाउज']
    }
  },
  'food': {
    keywords: ['खाना', 'रेसिपी', 'कुकिंग', 'रेस्टोरेंट', 'मील', 'डेलिशियस', 'टेस्टी', 'इंग्रेडिएंट्स', 'किचन', 'शेफ', 'क्विज़ीन', 'डिश', 'फ्लेवर', 'टेस्ट', 'कुक', 'बेक', 'ग्रिल', 'फ्राई', 'स्टीम', 'बॉयल', 'सीजनिंग', 'स्पाइस', 'हर्ब', 'न्यूट्रिशन', 'हेल्दी', 'ऑर्गेनिक'],
    weights: { 'खाना': 2.0, 'रेसिपी': 1.8, 'कुकिंग': 1.5, 'डेलिशियस': 1.3 },
    subcategories: {
      'cooking': ['रेसिपी', 'कुकिंग', 'किचन', 'शेफ', 'इंग्रेडिएंट्स', 'बेक', 'ग्रिल', 'फ्राई'],
      'restaurant': ['रेस्टोरेंट', 'डाइनिंग', 'मेन्यू', 'खाना', 'क्विज़ीन', 'शेफ', 'सर्विस']
    }
  },
  'fitness': {
    keywords: ['फिटनेस', 'वर्कआउट', 'एक्सरसाइज', 'जिम', 'ट्रेनिंग', 'स्ट्रेंथ', 'कार्डियो', 'योगा', 'पिलेट्स', 'रनिंग', 'साइक्लिंग', 'स्विमिंग', 'वेट लिफ्टिंग', 'बॉडीबिल्डिंग', 'क्रॉसफिट', 'एरोबिक्स', 'स्ट्रेचिंग', 'मेडिटेशन', 'वेलनेस', 'हेल्थ', 'न्यूट्रिशन', 'डाइट', 'प्रोटीन', 'सप्लीमेंट्स', 'रिकवरी', 'रेस्ट'],
    weights: { 'फिटनेस': 2.0, 'वर्कआउट': 1.8, 'एक्सरसाइज': 1.5, 'जिम': 1.3 },
    subcategories: {
      'gym': ['जिम', 'वर्कआउट', 'एक्सरसाइज', 'ट्रेनिंग', 'वेट लिफ्टिंग', 'बॉडीबिल्डिंग'],
      'yoga': ['योगा', 'मेडिटेशन', 'स्ट्रेचिंग', 'फ्लेक्सिबिलिटी', 'बैलेंस', 'माइंडफुलनेस']
    }
  }
};

/**
 * Hinglish topic keywords
 */
export const TOPIC_KEYWORDS_HINGLISH = {
  'fashion': {
    keywords: ['fashion', 'style', 'outfit', 'clothes', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'beauty', 'makeup', 'trendy', 'stylish', 'wardrobe', 'apparel', 'designer', 'brand', 'fashionable', 'chic', 'elegant', 'casual', 'formal', 'streetwear', 'vintage', 'modern', 'फैशन', 'स्टाइल', 'आउटफिट', 'कपड़े', 'ड्रेस', 'शर्ट', 'पैंट', 'जूते', 'एक्सेसरीज', 'ब्यूटी', 'मेकअप', 'ट्रेंडी', 'स्टाइलिश', 'वार्डरोब', 'अपैरल', 'डिजाइनर', 'ब्रांड', 'फैशनेबल', 'चिक', 'एलिगेंट', 'कैजुअल', 'फॉर्मल', 'स्ट्रीटवियर', 'विंटेज', 'मॉडर्न'],
    weights: { 'fashion': 2.0, 'style': 1.8, 'outfit': 1.5, 'beauty': 1.3, 'फैशन': 2.0, 'स्टाइल': 1.8, 'आउटफिट': 1.5, 'ब्यूटी': 1.3 },
    subcategories: {
      'skincare': ['skincare', 'skin', 'face', 'cleanser', 'moisturizer', 'serum', 'toner', 'exfoliant', 'mask', 'routine', 'स्किनकेयर', 'स्किन', 'फेस', 'क्लींजर', 'मॉइस्चराइजर', 'सीरम', 'टोनर', 'एक्सफोलिएंट', 'मास्क', 'रूटीन'],
      'makeup': ['makeup', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush', 'concealer', 'primer', 'highlighter', 'मेकअप', 'लिपस्टिक', 'फाउंडेशन', 'मस्कारा', 'आईशैडो', 'ब्लश', 'कंसीलर', 'प्राइमर', 'हाईलाइटर'],
      'clothing': ['outfit', 'dress', 'shirt', 'pants', 'shoes', 'jacket', 'sweater', 'jeans', 'skirt', 'blouse', 'आउटफिट', 'ड्रेस', 'शर्ट', 'पैंट', 'जूते', 'जैकेट', 'स्वेटर', 'जींस', 'स्कर्ट', 'ब्लाउज']
    }
  },
  'food': {
    keywords: ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'delicious', 'tasty', 'ingredients', 'kitchen', 'chef', 'cuisine', 'dish', 'flavor', 'taste', 'cook', 'bake', 'grill', 'fry', 'steam', 'boil', 'seasoning', 'spice', 'herb', 'nutrition', 'healthy', 'organic', 'खाना', 'रेसिपी', 'कुकिंग', 'रेस्टोरेंट', 'मील', 'डेलिशियस', 'टेस्टी', 'इंग्रेडिएंट्स', 'किचन', 'शेफ', 'क्विज़ीन', 'डिश', 'फ्लेवर', 'टेस्ट', 'कुक', 'बेक', 'ग्रिल', 'फ्राई', 'स्टीम', 'बॉयल', 'सीजनिंग', 'स्पाइस', 'हर्ब', 'न्यूट्रिशन', 'हेल्दी', 'ऑर्गेनिक'],
    weights: { 'food': 2.0, 'recipe': 1.8, 'cooking': 1.5, 'delicious': 1.3, 'खाना': 2.0, 'रेसिपी': 1.8, 'कुकिंग': 1.5, 'डेलिशियस': 1.3 },
    subcategories: {
      'cooking': ['recipe', 'cooking', 'kitchen', 'chef', 'ingredients', 'bake', 'grill', 'fry', 'रेसिपी', 'कुकिंग', 'किचन', 'शेफ', 'इंग्रेडिएंट्स', 'बेक', 'ग्रिल', 'फ्राई'],
      'restaurant': ['restaurant', 'dining', 'menu', 'food', 'cuisine', 'chef', 'service', 'रेस्टोरेंट', 'डाइनिंग', 'मेन्यू', 'खाना', 'क्विज़ीन', 'शेफ', 'सर्विस']
    }
  },
  'fitness': {
    keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'strength', 'cardio', 'yoga', 'pilates', 'running', 'cycling', 'swimming', 'weight lifting', 'bodybuilding', 'crossfit', 'aerobics', 'stretching', 'meditation', 'wellness', 'health', 'nutrition', 'diet', 'protein', 'supplements', 'recovery', 'rest', 'फिटनेस', 'वर्कआउट', 'एक्सरसाइज', 'जिम', 'ट्रेनिंग', 'स्ट्रेंथ', 'कार्डियो', 'योगा', 'पिलेट्स', 'रनिंग', 'साइक्लिंग', 'स्विमिंग', 'वेट लिफ्टिंग', 'बॉडीबिल्डिंग', 'क्रॉसफिट', 'एरोबिक्स', 'स्ट्रेचिंग', 'मेडिटेशन', 'वेलनेस', 'हेल्थ', 'न्यूट्रिशन', 'डाइट', 'प्रोटीन', 'सप्लीमेंट्स', 'रिकवरी', 'रेस्ट'],
    weights: { 'fitness': 2.0, 'workout': 1.8, 'exercise': 1.5, 'gym': 1.3, 'फिटनेस': 2.0, 'वर्कआउट': 1.8, 'एक्सरसाइज': 1.5, 'जिम': 1.3 },
    subcategories: {
      'gym': ['gym', 'workout', 'exercise', 'training', 'weight lifting', 'bodybuilding', 'जिम', 'वर्कआउट', 'एक्सरसाइज', 'ट्रेनिंग', 'वेट लिफ्टिंग', 'बॉडीबिल्डिंग'],
      'yoga': ['yoga', 'meditation', 'stretching', 'flexibility', 'balance', 'mindfulness', 'योगा', 'मेडिटेशन', 'स्ट्रेचिंग', 'फ्लेक्सिबिलिटी', 'बैलेंस', 'माइंडफुलनेस']
    }
  }
};

/**
 * Classify topics for multilingual text
 */
export function classifyTopicsMultilingual(
  text: string, 
  language: SupportedLanguage
): {
  primary: { category: string; subcategory: string | null; confidence: number };
  secondary: Array<{ category: string; confidence: number }>;
} {
  const lowerText = text.toLowerCase();
  
  let topicCategories: Record<string, any>;
  
  // Get topic categories based on language
  if (language === 'hi') {
    topicCategories = TOPIC_KEYWORDS_HI;
  } else if (language === 'hi-en') {
    topicCategories = TOPIC_KEYWORDS_HINGLISH;
  } else {
    // Default to English topic categories (simplified)
    topicCategories = {
      'fashion': {
        keywords: ['fashion', 'style', 'outfit', 'clothes', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'beauty', 'makeup', 'trendy', 'stylish', 'wardrobe', 'apparel', 'designer', 'brand', 'fashionable', 'chic', 'elegant', 'casual', 'formal', 'streetwear', 'vintage', 'modern'],
        weights: { 'fashion': 2.0, 'style': 1.8, 'outfit': 1.5, 'beauty': 1.3 },
        subcategories: {
          'skincare': ['skincare', 'skin', 'face', 'cleanser', 'moisturizer', 'serum', 'toner', 'exfoliant', 'mask', 'routine'],
          'makeup': ['makeup', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush', 'concealer', 'primer', 'highlighter'],
          'clothing': ['outfit', 'dress', 'shirt', 'pants', 'shoes', 'jacket', 'sweater', 'jeans', 'skirt', 'blouse']
        }
      },
      'food': {
        keywords: ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'delicious', 'tasty', 'ingredients', 'kitchen', 'chef', 'cuisine', 'dish', 'flavor', 'taste', 'cook', 'bake', 'grill', 'fry', 'steam', 'boil', 'seasoning', 'spice', 'herb', 'nutrition', 'healthy', 'organic'],
        weights: { 'food': 2.0, 'recipe': 1.8, 'cooking': 1.5, 'delicious': 1.3 },
        subcategories: {
          'cooking': ['recipe', 'cooking', 'kitchen', 'chef', 'ingredients', 'bake', 'grill', 'fry'],
          'restaurant': ['restaurant', 'dining', 'menu', 'food', 'cuisine', 'chef', 'service']
        }
      },
      'fitness': {
        keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'strength', 'cardio', 'yoga', 'pilates', 'running', 'cycling', 'swimming', 'weight lifting', 'bodybuilding', 'crossfit', 'aerobics', 'stretching', 'meditation', 'wellness', 'health', 'nutrition', 'diet', 'protein', 'supplements', 'recovery', 'rest'],
        weights: { 'fitness': 2.0, 'workout': 1.8, 'exercise': 1.5, 'gym': 1.3 },
        subcategories: {
          'gym': ['gym', 'workout', 'exercise', 'training', 'weight lifting', 'bodybuilding'],
          'yoga': ['yoga', 'meditation', 'stretching', 'flexibility', 'balance', 'mindfulness']
        }
      }
    };
  }

  const scores: Record<string, { score: number; subcategory: string | null; subcategoryScore: number }> = {};
  
  Object.entries(topicCategories).forEach(([category, data]) => {
    // Calculate weighted score
    let weightedScore = 0;
    let totalWeight = 0;
    
    data.keywords.forEach((keyword: string) => {
      if (lowerText.includes(keyword)) {
        const weight = (data.weights as any)?.[keyword] || 1.0;
        weightedScore += weight;
        totalWeight += weight;
      }
    });
    
    const score = totalWeight > 0 ? weightedScore / data.keywords.length : 0;
    
    let subcategory: string | null = null;
    let subcategoryScore = 0;
    
    Object.entries(data.subcategories).forEach(([sub, subKeywords]) => {
      const subKeywordsArray = subKeywords as string[];
      const subMatches = subKeywordsArray.filter((keyword: string) => lowerText.includes(keyword)).length;
      const subScore = subMatches / subKeywordsArray.length;
      if (subScore > subcategoryScore) {
        subcategory = sub;
        subcategoryScore = subScore;
      }
    });
    
    scores[category] = { score, subcategory, subcategoryScore };
  });

  const sortedTopics = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score);

  const primary = sortedTopics[0][1].score > 0.1 
    ? {
        category: sortedTopics[0][0],
        subcategory: sortedTopics[0][1].subcategory,
        confidence: sortedTopics[0][1].score
      }
    : { category: 'unknown', subcategory: null, confidence: 0 };

  const secondary = sortedTopics
    .slice(1, 6)
    .filter(([_, data]) => data.score > 0.05)
    .map(([category, data]) => ({
      category,
      confidence: data.score
    }));

  return { primary, secondary };
}
