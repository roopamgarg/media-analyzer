import { SupportedLanguage } from './types';

/**
 * Hindi intent signals
 */
export const INTENT_SIGNALS_HI = {
  educate: [
    'कैसे', 'सीखना', 'सिखाना', 'समझाना', 'बताना', 'जानना', 'अध्ययन', 'शिक्षा', 'शिक्षण', 'प्रशिक्षण',
    'गाइड', 'ट्यूटोरियल', 'स्टेप', 'प्रक्रिया', 'विधि', 'तरीका', 'उपाय', 'समाधान', 'हल', 'जवाब'
  ],
  entertain: [
    'मजा', 'मनोरंजन', 'हंसी', 'कॉमेडी', 'डांस', 'संगीत', 'गाना', 'नृत्य', 'खेल', 'गेम',
    'चैलेंज', 'प्रैंक', 'मजाक', 'हंसी-मजाक', 'मनोरंजन', 'आनंद', 'खुशी', 'उत्साह', 'रोमांच', 'एडवेंचर'
  ],
  promote: [
    'खरीदना', 'बेचना', 'बिक्री', 'ऑफर', 'डिस्काउंट', 'प्रोडक्ट', 'ब्रांड', 'शॉप', 'पर्चेस', 'लिंक',
    'चेक आउट', 'विजिट', 'देखना', 'जाना', 'आना', 'मिलना', 'संपर्क', 'कॉन्टैक्ट', 'कॉल', 'मैसेज'
  ],
  inspire: [
    'प्रेरणा', 'इंस्पायर', 'मोटिवेशन', 'सफलता', 'अचीव', 'ड्रीम', 'लक्ष्य', 'गोल', 'माइंडसेट', 'सोच',
    'उम्मीद', 'आशा', 'विश्वास', 'भरोसा', 'हिम्मत', 'साहस', 'बहादुरी', 'जीत', 'विजय', 'सफल'
  ],
  inform: [
    'समाचार', 'न्यूज', 'अपडेट', 'जानकारी', 'तथ्य', 'फैक्ट', 'अध्ययन', 'रिसर्च', 'रिपोर्ट', 'घोषणा',
    'सूचना', 'जानकारी', 'डेटा', 'आंकड़े', 'स्टैटिस्टिक्स', 'तथ्य', 'सच', 'सत्य', 'वास्तविकता', 'हकीकत'
  ]
};

/**
 * Hinglish intent signals
 */
export const INTENT_SIGNALS_HINGLISH = {
  educate: [
    'how to', 'tutorial', 'learn', 'teach', 'explain', 'guide', 'step by step', 'tips', 'tricks',
    'कैसे', 'सीखना', 'सिखाना', 'समझाना', 'बताना', 'जानना', 'अध्ययन', 'शिक्षा', 'शिक्षण', 'प्रशिक्षण',
    'गाइड', 'ट्यूटोरियल', 'स्टेप', 'प्रक्रिया', 'विधि', 'तरीका', 'उपाय', 'समाधान', 'हल', 'जवाब'
  ],
  entertain: [
    'funny', 'joke', 'laugh', 'entertaining', 'comedy', 'dance', 'music', 'challenge', 'prank',
    'मजा', 'मनोरंजन', 'हंसी', 'कॉमेडी', 'डांस', 'संगीत', 'गाना', 'नृत्य', 'खेल', 'गेम',
    'चैलेंज', 'प्रैंक', 'मजाक', 'हंसी-मजाक', 'मनोरंजन', 'आनंद', 'खुशी', 'उत्साह', 'रोमांच', 'एडवेंचर'
  ],
  promote: [
    'buy', 'sale', 'discount', 'offer', 'product', 'brand', 'shop', 'purchase', 'link in bio', 'check out',
    'खरीदना', 'बेचना', 'बिक्री', 'ऑफर', 'डिस्काउंट', 'प्रोडक्ट', 'ब्रांड', 'शॉप', 'पर्चेस', 'लिंक',
    'चेक आउट', 'विजिट', 'देखना', 'जाना', 'आना', 'मिलना', 'संपर्क', 'कॉन्टैक्ट', 'कॉल', 'मैसेज'
  ],
  inspire: [
    'motivation', 'inspire', 'motivational', 'success', 'achieve', 'dream', 'goal', 'mindset',
    'प्रेरणा', 'इंस्पायर', 'मोटिवेशन', 'सफलता', 'अचीव', 'ड्रीम', 'लक्ष्य', 'गोल', 'माइंडसेट', 'सोच',
    'उम्मीद', 'आशा', 'विश्वास', 'भरोसा', 'हिम्मत', 'साहस', 'बहादुरी', 'जीत', 'विजय', 'सफल'
  ],
  inform: [
    'news', 'update', 'information', 'fact', 'research', 'study', 'report', 'announcement',
    'समाचार', 'न्यूज', 'अपडेट', 'जानकारी', 'तथ्य', 'फैक्ट', 'अध्ययन', 'रिसर्च', 'रिपोर्ट', 'घोषणा',
    'सूचना', 'जानकारी', 'डेटा', 'आंकड़े', 'स्टैटिस्टिक्स', 'तथ्य', 'सच', 'सत्य', 'वास्तविकता', 'हकीकत'
  ]
};

/**
 * Detect intent for multilingual text
 */
export function detectIntentMultilingual(
  text: string, 
  caption: string, 
  language: SupportedLanguage
): {
  primary: 'educate' | 'entertain' | 'promote' | 'inspire' | 'inform' | 'unknown';
  secondary: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const lowerCaption = caption.toLowerCase();
  const combinedText = `${lowerText} ${lowerCaption}`;

  let intentSignals: Record<string, string[]>;
  
  // Get intent signals based on language
  if (language === 'hi') {
    intentSignals = INTENT_SIGNALS_HI;
  } else if (language === 'hi-en') {
    intentSignals = INTENT_SIGNALS_HINGLISH;
  } else {
    // Default to English intent signals
    intentSignals = {
      educate: ['how to', 'tutorial', 'learn', 'teach', 'explain', 'guide', 'step by step', 'tips', 'tricks'],
      entertain: ['funny', 'joke', 'laugh', 'entertaining', 'comedy', 'dance', 'music', 'challenge', 'prank'],
      promote: ['buy', 'sale', 'discount', 'offer', 'product', 'brand', 'shop', 'purchase', 'link in bio', 'check out'],
      inspire: ['motivation', 'inspire', 'motivational', 'success', 'achieve', 'dream', 'goal', 'mindset'],
      inform: ['news', 'update', 'information', 'fact', 'research', 'study', 'report', 'announcement']
    };
  }

  const scores: Record<string, number> = {};
  
  Object.entries(intentSignals).forEach(([intent, keywords]) => {
    const matches = keywords.filter(keyword => combinedText.includes(keyword)).length;
    scores[intent] = matches / keywords.length;
  });

  const sortedIntents = Object.entries(scores)
    .sort((a, b) => b[1] - a[1]);

  const primary = sortedIntents[0][1] > 0.1 
    ? sortedIntents[0][0] as any
    : 'unknown';

  const secondary = sortedIntents
    .slice(1, 3)
    .filter(([_, score]) => score > 0.05)
    .map(([intent]) => intent);

  return {
    primary,
    secondary,
    confidence: sortedIntents[0][1]
  };
}
