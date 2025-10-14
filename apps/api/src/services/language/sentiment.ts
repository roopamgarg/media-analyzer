import { SupportedLanguage } from './types';

/**
 * Hindi sentiment lexicon
 */
export const SENTIMENT_LEXICON_HI = {
  positive: [
    'अच्छा', 'बढ़िया', 'खुश', 'प्यार', 'सुंदर', 'शानदार', 'बेहतरीन', 'अद्भुत', 'प्रेम', 'खुशी',
    'आनंद', 'उत्साह', 'प्रसन्न', 'संतुष्ट', 'गर्व', 'उम्मीद', 'आशा', 'सफल', 'जीत', 'विजय',
    'सुख', 'आराम', 'शांति', 'सुखद', 'मनोहर', 'रमणीय', 'सुखदायक', 'आनंददायक', 'प्रिय', 'पसंद'
  ],
  negative: [
    'बुरा', 'गुस्सा', 'दुख', 'नफरत', 'दुखी', 'उदास', 'निराश', 'हताश', 'क्रोध', 'गुस्सा',
    'दुःख', 'पीड़ा', 'तकलीफ', 'चिंता', 'फिक्र', 'डर', 'भय', 'आशंका', 'निराशा', 'हताशा',
    'क्रोधित', 'गुस्से में', 'दुखी', 'उदास', 'निराश', 'हताश', 'क्रोधी', 'गुस्सैल', 'दुखी', 'उदास'
  ]
};

/**
 * Hinglish sentiment lexicon
 */
export const SENTIMENT_LEXICON_HINGLISH = {
  positive: [
    'accha', 'badhiya', 'khush', 'pyaar', 'sundar', 'amazing', 'best', 'good', 'nice', 'beautiful',
    'wonderful', 'fantastic', 'great', 'awesome', 'excellent', 'perfect', 'lovely', 'sweet', 'cute', 'charming',
    'happy', 'joy', 'love', 'enjoy', 'fun', 'exciting', 'thrilling', 'inspiring', 'motivating', 'encouraging',
    'success', 'victory', 'win', 'achieve', 'accomplish', 'succeed', 'triumph', 'conquer', 'overcome', 'master'
  ],
  negative: [
    'bura', 'gussa', 'dukh', 'nafrat', 'bad', 'worst', 'hate', 'angry', 'sad', 'upset',
    'disappointed', 'frustrated', 'annoyed', 'irritated', 'mad', 'furious', 'rage', 'anger', 'sadness', 'grief',
    'pain', 'suffering', 'hurt', 'wounded', 'broken', 'defeated', 'failed', 'lose', 'loss', 'defeat',
    'terrible', 'awful', 'horrible', 'disgusting', 'nasty', 'ugly', 'hateful', 'mean', 'cruel', 'evil'
  ]
};

/**
 * Analyze sentiment for multilingual text
 */
export function analyzeSentimentMultilingual(
  text: string, 
  caption: string, 
  language: SupportedLanguage
): {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  comparative: number;
  emotions: string[];
} {
  const combinedText = `${text} ${caption}`.toLowerCase();
  
  let positiveWords: string[] = [];
  let negativeWords: string[] = [];
  
  // Get sentiment lexicon based on language
  if (language === 'hi') {
    positiveWords = SENTIMENT_LEXICON_HI.positive;
    negativeWords = SENTIMENT_LEXICON_HI.negative;
  } else if (language === 'hi-en') {
    positiveWords = SENTIMENT_LEXICON_HINGLISH.positive;
    negativeWords = SENTIMENT_LEXICON_HINGLISH.negative;
  } else {
    // Default to English sentiment analysis
    return analyzeEnglishSentiment(combinedText);
  }
  
  // Count positive and negative words
  const positiveCount = positiveWords.reduce((count, word) => {
    return count + (combinedText.includes(word.toLowerCase()) ? 1 : 0);
  }, 0);
  
  const negativeCount = negativeWords.reduce((count, word) => {
    return count + (combinedText.includes(word.toLowerCase()) ? 1 : 0);
  }, 0);
  
  // Calculate sentiment score
  const totalWords = combinedText.split(/\s+/).length;
  const score = totalWords > 0 ? (positiveCount - negativeCount) / totalWords : 0;
  const comparative = totalWords > 0 ? (positiveCount - negativeCount) / totalWords : 0;
  
  // Determine overall sentiment
  let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (score > 0.1) overall = 'positive';
  else if (score < -0.1) overall = 'negative';
  
  // Extract emotions
  const emotions: string[] = [];
  if (positiveCount > 0) emotions.push('positive');
  if (negativeCount > 0) emotions.push('negative');
  
  return {
    overall,
    score,
    comparative,
    emotions
  };
}

/**
 * Fallback English sentiment analysis
 */
function analyzeEnglishSentiment(text: string): {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  comparative: number;
  emotions: string[];
} {
  // Simple English sentiment analysis
  const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'fantastic', 'excellent', 'perfect', 'love', 'like', 'enjoy'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'angry', 'sad', 'upset', 'frustrated'];
  
  const positiveCount = positiveWords.reduce((count, word) => {
    return count + (text.includes(word) ? 1 : 0);
  }, 0);
  
  const negativeCount = negativeWords.reduce((count, word) => {
    return count + (text.includes(word) ? 1 : 0);
  }, 0);
  
  const totalWords = text.split(/\s+/).length;
  const score = totalWords > 0 ? (positiveCount - negativeCount) / totalWords : 0;
  const comparative = totalWords > 0 ? (positiveCount - negativeCount) / totalWords : 0;
  
  let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (score > 0.1) overall = 'positive';
  else if (score < -0.1) overall = 'negative';
  
  const emotions: string[] = [];
  if (positiveCount > 0) emotions.push('positive');
  if (negativeCount > 0) emotions.push('negative');
  
  return {
    overall,
    score,
    comparative,
    emotions
  };
}
