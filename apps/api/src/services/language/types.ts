/**
 * Language support types for multilingual keyword extraction
 */

export type SupportedLanguage = 'en' | 'hi' | 'ur' | 'hi-en' | 'ur-en' | 'unknown';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  isHinglish?: boolean;
  isMixed?: boolean;
  detectionMethod?: 'hint' | 'script' | 'pattern';
}

export interface LanguageConfig {
  stopWords: Set<string>;
  sentimentLexicon: {
    positive: string[];
    negative: string[];
  };
  intentSignals: {
    educate: string[];
    entertain: string[];
    promote: string[];
    inspire: string[];
    inform: string[];
  };
  topicKeywords: Record<string, {
    keywords: string[];
    weights: Record<string, number>;
    subcategories: Record<string, string[]>;
  }>;
}

export interface MultilingualTextAnalysis {
  language: SupportedLanguage;
  confidence: number;
  hasDevanagari: boolean;
  hasArabic: boolean;
  hasLatin: boolean;
  isMixed: boolean;
}
