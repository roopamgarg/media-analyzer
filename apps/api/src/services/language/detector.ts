import { SupportedLanguage, LanguageDetectionResult } from './types';
import { hasDevanagariScript, hasArabicScript, hasLatinScript, analyzeTextScripts } from './utils';

// Simple language detection without external dependencies
function detectLanguageSimple(text: string): string {
  const hasDevanagari = hasDevanagariScript(text);
  const hasArabic = hasArabicScript(text);
  const hasLatin = hasLatinScript(text);
  
  // Check for mixed languages
  if (hasArabic && hasLatin) {
    return 'ur-en'; // Urdu-English
  } else if (hasDevanagari && hasLatin) {
    return 'hi-en'; // Hindi-English (Hinglish)
  } else if (hasArabic) {
    return 'ur'; // Urdu
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
  // Validate language hint against actual text content
  if (languageHint) {
    const normalizedHint = normalizeLanguageCode(languageHint);
    if (isValidLanguageCode(normalizedHint)) {
      const validationResult = validateLanguageHint(text, normalizedHint);
      if (validationResult.confidence > 0.7) {
        return validationResult;
      }
    }
  }

  // Auto-detect language using script analysis
  const scriptAnalysis = analyzeTextScripts(text);
  
  if (scriptAnalysis.isMixed) {
    return detectMixedLanguage(text, scriptAnalysis);
  }
  
  const detectedLang = detectLanguageSimple(text);
  
  // Check for Hinglish patterns (legacy support)
  const isHinglish = isHinglishText(text);
  if (isHinglish) {
    return {
      language: 'hi-en',
      confidence: 0.8,
      isHinglish: true,
      isMixed: true,
      detectionMethod: 'pattern'
    };
  }

  return {
    language: isValidLanguageCode(detectedLang) ? detectedLang : 'unknown',
    confidence: detectedLang === 'unknown' ? 0.0 : 0.7,
    isHinglish: false,
    isMixed: false,
    detectionMethod: 'script'
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
    case 'ur':
    case 'urd':
      return 'ur';
    default:
      return 'unknown';
  }
}

/**
 * Check if language code is valid
 */
function isValidLanguageCode(code: string): code is SupportedLanguage {
  return ['en', 'hi', 'ur', 'hi-en', 'ur-en', 'unknown'].includes(code);
}

/**
 * Validate language hint against actual text content
 */
function validateLanguageHint(text: string, hint: SupportedLanguage): LanguageDetectionResult {
  const scriptAnalysis = analyzeTextScripts(text);
  
  // Validate hint matches actual content
  if (hint === 'ur' && scriptAnalysis.hasArabic) {
    return {
      language: 'ur',
      confidence: 0.9,
      isMixed: false,
      detectionMethod: 'hint'
    };
  }
  
  if (hint === 'hi' && scriptAnalysis.hasDevanagari) {
    return {
      language: 'hi',
      confidence: 0.9,
      isMixed: false,
      detectionMethod: 'hint'
    };
  }
  
  if (hint === 'en' && scriptAnalysis.hasLatin && !scriptAnalysis.hasArabic && !scriptAnalysis.hasDevanagari) {
    return {
      language: 'en',
      confidence: 0.9,
      isMixed: false,
      detectionMethod: 'hint'
    };
  }
  
  if (hint === 'ur-en' && scriptAnalysis.hasArabic && scriptAnalysis.hasLatin) {
    return {
      language: 'ur-en',
      confidence: 0.9,
      isMixed: true,
      detectionMethod: 'hint'
    };
  }
  
  if (hint === 'hi-en' && scriptAnalysis.hasDevanagari && scriptAnalysis.hasLatin) {
    return {
      language: 'hi-en',
      confidence: 0.9,
      isHinglish: true,
      isMixed: true,
      detectionMethod: 'hint'
    };
  }
  
  // Hint doesn't match content - return lower confidence
  return {
    language: hint,
    confidence: 0.5,
    isMixed: scriptAnalysis.isMixed,
    detectionMethod: 'hint'
  };
}

/**
 * Detect mixed language based on script analysis
 */
function detectMixedLanguage(text: string, scriptAnalysis: any): LanguageDetectionResult {
  const { arabicRatio, devanagariRatio, latinRatio } = scriptAnalysis;
  
  // Determine primary script by ratio
  const ratios = [
    { script: 'arabic', ratio: arabicRatio },
    { script: 'devanagari', ratio: devanagariRatio },
    { script: 'latin', ratio: latinRatio }
  ].sort((a, b) => b.ratio - a.ratio);
  
  const primaryScript = ratios[0].script;
  
  // Urdu-English mix
  if (scriptAnalysis.hasArabic && scriptAnalysis.hasLatin) {
    return {
      language: 'ur-en',
      confidence: 0.8,
      isMixed: true,
      detectionMethod: 'script'
    };
  }
  
  // Hindi-English mix (Hinglish)
  if (scriptAnalysis.hasDevanagari && scriptAnalysis.hasLatin) {
    return {
      language: 'hi-en',
      confidence: 0.8,
      isHinglish: true,
      isMixed: true,
      detectionMethod: 'script'
    };
  }
  
  return {
    language: 'unknown',
    confidence: 0,
    isMixed: true,
    detectionMethod: 'script'
  };
}
