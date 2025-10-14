/**
 * Language support module for multilingual keyword extraction
 */

// Export types
export * from './types';

// Export language detection
export { detectLanguage, isHinglishText } from './detector';

// Export utilities
export { 
  hasDevanagariScript, 
  hasLatinScript, 
  normalizeHinglish, 
  tokenizeMultilingual, 
  analyzeTextScripts 
} from './utils';

// Export stop words
export { getStopWords, STOP_WORDS_EN, STOP_WORDS_HI, STOP_WORDS_HINGLISH } from './stopwords';

// Export sentiment analysis
export { analyzeSentimentMultilingual, SENTIMENT_LEXICON_HI, SENTIMENT_LEXICON_HINGLISH } from './sentiment';

// Export intent detection
export { detectIntentMultilingual, INTENT_SIGNALS_HI, INTENT_SIGNALS_HINGLISH } from './intent';

// Export topic classification
export { classifyTopicsMultilingual, TOPIC_KEYWORDS_HI, TOPIC_KEYWORDS_HINGLISH } from './topics';
