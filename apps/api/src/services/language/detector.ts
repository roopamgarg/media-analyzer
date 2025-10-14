import { SupportedLanguage, LanguageDetectionResult } from './types';
import { hasDevanagariScript, hasLatinScript } from './utils';

// Simple language detection without external dependencies
function detectLanguageSimple(text: string): string {
  const hasDevanagari = hasDevanagariScript(text);
  const hasLatin = hasLatinScript(text);
  
  if (hasDevanagari && hasLatin) {
    return 'hi-en'; // Hinglish
  } else if (hasDevanagari) {
    return 'hi'; // Hindi
  } else if (hasLatin) {
    return 'en'; // English
  }
  
  return 'unknown';
}

/**
 * Detect language from text with optional language hint
 */
export function detectLanguage(text: string, languageHint?: string): LanguageDetectionResult {
  // If language hint is provided, validate and return it
  if (languageHint) {
    const normalizedHint = normalizeLanguageCode(languageHint);
    if (isValidLanguageCode(normalizedHint)) {
      return {
        language: normalizedHint,
        confidence: 1.0,
        isHinglish: normalizedHint === 'hi-en'
      };
    }
  }

  // Auto-detect language using simple heuristics
  const detectedLang = detectLanguageSimple(text);
  
  // Check for Hinglish patterns
  const isHinglish = isHinglishText(text);
  
  if (isHinglish) {
    return {
      language: 'hi-en',
      confidence: 0.8,
      isHinglish: true
    };
  }

  return {
    language: isValidLanguageCode(detectedLang) ? detectedLang : 'unknown',
    confidence: detectedLang === 'unknown' ? 0.0 : 0.7,
    isHinglish: false
  };
}

/**
 * Check if text contains Hinglish patterns
 */
export function isHinglishText(text: string): boolean {
  const hasDevanagari = hasDevanagariScript(text);
  const hasLatin = hasLatinScript(text);
  
  // Mixed script is a strong indicator of Hinglish
  if (hasDevanagari && hasLatin) {
    return true;
  }
  
  // Check for common Hinglish patterns
  const hinglishPatterns = [
    /\b(kya|hai|aur|mein|yeh|toh|ko|se|par|ke|ki|ka|ne|koi|kuch|sab|abhi|phir|bhi|ya|nahi|kyun|kaise|kahan|kab)\b/gi,
    /\b(accha|badhiya|khush|pyaar|sundar|amazing|best|good|nice|beautiful)\b/gi,
    /\b(bura|gussa|dukh|nafrat|bad|worst|hate|angry|sad)\b/gi
  ];
  
  const patternMatches = hinglishPatterns.reduce((count, pattern) => {
    return count + (text.match(pattern) || []).length;
  }, 0);
  
  // If we have significant Hinglish patterns, consider it Hinglish
  return patternMatches >= 3;
}

/**
 * Normalize language code to our supported format
 */
function normalizeLanguageCode(code: string): SupportedLanguage {
  const normalized = code.toLowerCase();
  
  switch (normalized) {
    case 'en':
    case 'eng':
      return 'en';
    case 'hi':
    case 'hin':
      return 'hi';
    default:
      return 'unknown';
  }
}

/**
 * Check if language code is valid
 */
function isValidLanguageCode(code: string): code is SupportedLanguage {
  return ['en', 'hi', 'hi-en', 'unknown'].includes(code);
}
