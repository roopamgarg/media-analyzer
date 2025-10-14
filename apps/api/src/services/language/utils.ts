/**
 * Utility functions for multilingual text processing
 */

/**
 * Check if text contains Devanagari script (Hindi characters)
 */
export function hasDevanagariScript(text: string): boolean {
  // Devanagari Unicode range: U+0900-U+097F
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Check if text contains Latin script (English characters)
 */
export function hasLatinScript(text: string): boolean {
  // Basic Latin Unicode range: U+0020-U+007F
  return /[a-zA-Z]/.test(text);
}

/**
 * Check if text contains Arabic script (Urdu characters)
 */
export function hasArabicScript(text: string): boolean {
  // Arabic Unicode range: U+0600-U+06FF
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Normalize Hinglish text by handling common transliterations
 */
export function normalizeHinglish(text: string): string {
  const transliterations: Record<string, string> = {
    // Common Hindi to English transliterations
    'kya': 'क्या',
    'hai': 'है',
    'aur': 'और',
    'mein': 'में',
    'yeh': 'यह',
    'toh': 'तो',
    'ko': 'को',
    'se': 'से',
    'par': 'पर',
    'ke': 'के',
    'ki': 'की',
    'ka': 'का',
    'ne': 'ने',
    'koi': 'कोई',
    'kuch': 'कुछ',
    'sab': 'सब',
    'abhi': 'अभी',
    'phir': 'फिर',
    'bhi': 'भी',
    'ya': 'या',
    'nahi': 'नहीं',
    'kyun': 'क्यों',
    'kaise': 'कैसे',
    'kahan': 'कहाँ',
    'kab': 'कब'
  };

  let normalized = text;
  Object.entries(transliterations).forEach(([eng, hindi]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    normalized = normalized.replace(regex, hindi);
  });

  return normalized;
}

/**
 * Tokenize text based on language
 */
export function tokenizeMultilingual(text: string, language: string): string[] {
  if (language === 'hi' || language === 'hi-en' || language === 'ur' || language === 'ur-en') {
    // For Hindi/Hinglish/Urdu/Urdu-English, split on spaces and punctuation
    return text.split(/[\s\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\uFF00-\uFFEF]+/)
      .filter(token => token.length > 0);
  }
  
  // For English, use standard word boundary splitting
  return text.split(/\W+/).filter(word => word.length > 0);
}

/**
 * Analyze text for script composition
 */
export function analyzeTextScripts(text: string): {
  hasDevanagari: boolean;
  hasArabic: boolean;
  hasLatin: boolean;
  isMixed: boolean;
  devanagariRatio: number;
  arabicRatio: number;
  latinRatio: number;
} {
  const hasDevanagari = hasDevanagariScript(text);
  const hasArabic = hasArabicScript(text);
  const hasLatin = hasLatinScript(text);
  const isMixed = [hasDevanagari, hasArabic, hasLatin].filter(Boolean).length > 1;
  
  // Calculate character ratios
  const devanagariChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.length;
  
  return {
    hasDevanagari,
    hasArabic,
    hasLatin,
    isMixed,
    devanagariRatio: totalChars > 0 ? devanagariChars / totalChars : 0,
    arabicRatio: totalChars > 0 ? arabicChars / totalChars : 0,
    latinRatio: totalChars > 0 ? latinChars / totalChars : 0
  };
}
