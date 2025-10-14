import { downloadInstagramReel, isValidInstagramReelUrl } from './instagram';
import { fetchAndExtract } from './media';
import { callWorkerASR } from './worker';
import { runOCR } from './ocr';
import { buildTimedDoc } from './nlp';
import { config } from '../config';
import * as natural from 'natural';
import Sentiment from 'sentiment';

export interface EnhancedKeywordExtractionRequest {
  instagramReelUrl: string;
  languageHint?: string;
  cookieOptions?: {
    browserCookies?: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'brave';
    cookiesFile?: string;
  };
  options?: {
    includeNgrams?: boolean;      // default: true
    includeSentiment?: boolean;    // default: true
    includeIntent?: boolean;       // default: true
    includeEntities?: boolean;     // default: true
  };
  async?: boolean; // default: false - if true, returns jobId and processes in background
}

export interface EnhancedKeywordExtractionResult {
  keywords: {
    primary: Array<{
      term: string;
      confidence: number;
      type: 'single' | 'phrase';
    }>;
    secondary: string[];
    phrases: Array<{
      text: string;
      frequency: number;
      significance: number;
    }>;
    hashtags: string[];
    mentions: string[];
  };
  topics: {
    primary: {
      category: string;
      subcategory: string | null;
      confidence: number;
    };
    secondary: Array<{
      category: string;
      confidence: number;
    }>;
  };
  sentiment: {
    overall: 'positive' | 'negative' | 'neutral';
    score: number; // -5 to 5
    comparative: number;
    emotions: string[];
  };
  intent: {
    primary: 'educate' | 'entertain' | 'promote' | 'inspire' | 'inform' | 'unknown';
    secondary: string[];
    confidence: number;
  };
  entities: {
    brands: string[];
    products: string[];
    people: string[];
    prices: string[];
    locations: string[];
  };
  metadata: {
    caption: string | null;
    transcript: string | null;
    ocrText: string | null;
    duration: number;
    username?: string;
    complexity: 'simple' | 'moderate' | 'complex';
  };
  searchableTerms: string[];
  timings: {
    totalMs: number;
    stages: {
      extract: number;
      asr: number;
      ocr: number;
      processing: number;
      enhancement: number;
    };
  };
}

/**
 * Extract enhanced keywords from an Instagram Reel with semantic analysis
 */
export async function extractKeywordsEnhanced(request: EnhancedKeywordExtractionRequest): Promise<EnhancedKeywordExtractionResult> {
  const startTime = Date.now();
  const timings: Record<string, number> = {};

  try {
    // Validate Instagram URL
    if (!isValidInstagramReelUrl(request.instagramReelUrl)) {
      throw new Error('Invalid Instagram Reel URL format');
    }

    // Step 1: Download and extract media
    const extractStart = Date.now();
    const mediaData = await fetchAndExtract({
      input: {
        instagramReelUrl: request.instagramReelUrl,
        media: {
          languageHint: request.languageHint,
        },
      },
      options: {
        evidence: {
          frames: [0, 1, 3, 5, 10], // Extract key frames
          screenshots: true,
          transcriptSpans: true,
        },
        cookieOptions: request.cookieOptions,
        returnPdf: false,
      },
    });
    timings.extract = Date.now() - extractStart;

    // Step 2: Run ASR and OCR in parallel
    const [asr, ocr] = await Promise.all([
      mediaData.audioPath ? callWorkerASR(mediaData.audioPath, request.languageHint) : Promise.resolve({ segments: [], timing: 0 }),
      mediaData.frames.length > 0 ? runOCR(mediaData.frames) : Promise.resolve({ frames: [], timing: 0 })
    ]);

    timings.asr = asr.timing;
    timings.ocr = ocr.timing;

    // Step 3: Build document from all text sources
    const doc = buildTimedDoc({
      caption: mediaData.caption,
      asr,
      ocr,
    });

    // Step 4: Extract enhanced keywords
    const processingStart = Date.now();
    const enhancedKeywords = await extractEnhancedKeywordsFromText(
      doc.fullText, 
      mediaData.caption || '', 
      extractOCRText(ocr),
      request.options || {}
    );
    timings.processing = Date.now() - processingStart;

    // Step 5: Generate searchable terms
    const searchableTerms = generateEnhancedSearchableTerms(enhancedKeywords, doc.fullText);

    return {
      keywords: enhancedKeywords.keywords,
      topics: enhancedKeywords.topics,
      sentiment: enhancedKeywords.sentiment,
      intent: enhancedKeywords.intent,
      entities: enhancedKeywords.entities,
      metadata: {
        caption: mediaData.caption || null,
        transcript: doc.fullText || null,
        ocrText: extractOCRText(ocr),
        duration: 0, // TODO: Extract from video metadata
        username: extractUsername(mediaData.caption || null),
        complexity: enhancedKeywords.complexity,
      },
      searchableTerms,
      timings: {
        totalMs: Date.now() - startTime,
        stages: {
          extract: timings.extract,
          asr: timings.asr,
          ocr: timings.ocr,
          processing: timings.processing,
          enhancement: timings.processing, // Enhancement is part of processing
        },
      },
    };

  } catch (error) {
    throw new Error(`Enhanced keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract enhanced keywords with semantic analysis
 */
async function extractEnhancedKeywordsFromText(
  fullText: string, 
  caption: string, 
  ocrText: string | null,
  options: EnhancedKeywordExtractionRequest['options']
): Promise<{
  keywords: EnhancedKeywordExtractionResult['keywords'];
  topics: EnhancedKeywordExtractionResult['topics'];
  sentiment: EnhancedKeywordExtractionResult['sentiment'];
  intent: EnhancedKeywordExtractionResult['intent'];
  entities: EnhancedKeywordExtractionResult['entities'];
  complexity: 'simple' | 'moderate' | 'complex';
}> {
  const text = fullText.toLowerCase();
  const captionText = caption.toLowerCase();
  const combinedText = [fullText, caption, ocrText].filter(Boolean).join(' ');

  // Extract basic elements
  const hashtags = extractHashtags(caption);
  const mentions = extractMentions(caption);

  // Enhanced keyword extraction
  const primaryKeywords = options?.includeNgrams !== false 
    ? extractPrimaryKeywordsWithPhrases(text, captionText)
    : extractPrimaryKeywordsBasic(text, captionText);

  const secondaryKeywords = extractSecondaryKeywords(text, primaryKeywords.map(k => k.term));

  const phrases = options?.includeNgrams !== false 
    ? extractNgrams(combinedText)
    : [];

  // Topic classification with confidence
  const topics = options?.includeIntent !== false 
    ? classifyTopicsWithConfidence(combinedText)
    : { primary: { category: 'unknown', subcategory: null, confidence: 0 }, secondary: [] };

  // Sentiment analysis
  const sentiment = options?.includeSentiment !== false 
    ? analyzeSentiment(combinedText, caption)
    : { overall: 'neutral' as const, score: 0, comparative: 0, emotions: [] };

  // Intent detection
  const intent = options?.includeIntent !== false 
    ? detectIntent(combinedText, caption)
    : { primary: 'unknown' as const, secondary: [], confidence: 0 };

  // Entity extraction
  const entities = options?.includeEntities !== false 
    ? extractEntities(combinedText, caption, ocrText)
    : { brands: [], products: [], people: [], prices: [], locations: [] };

  // Content complexity
  const complexity = analyzeComplexity(combinedText);

  return {
    keywords: {
      primary: primaryKeywords,
      secondary: secondaryKeywords,
      phrases,
      hashtags,
      mentions,
    },
    topics,
    sentiment,
    intent,
    entities,
    complexity,
  };
}

/**
 * Extract primary keywords with phrase support
 */
function extractPrimaryKeywordsWithPhrases(text: string, caption: string): Array<{ term: string; confidence: number; type: 'single' | 'phrase' }> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  // Extract single words
  const words = text.split(/\W+/)
    .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .map(word => word.toLowerCase());

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Extract phrases (bigrams and trigrams)
  const phrases = extractNgrams(text);
  
  // Combine and score
  const captionWords = new Set(caption.split(/\W+/).map(w => w.toLowerCase()));
  
  const allTerms = [
    ...Array.from(wordFreq.entries()).map(([word, freq]) => ({
      term: word,
      confidence: freq / words.length + (captionWords.has(word) ? 0.3 : 0),
      type: 'single' as const
    })),
    ...phrases.slice(0, 5).map(phrase => ({
      term: phrase.text,
      confidence: phrase.significance,
      type: 'phrase' as const
    }))
  ];

  return allTerms
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
}

/**
 * Extract primary keywords (basic version)
 */
function extractPrimaryKeywordsBasic(text: string, caption: string): Array<{ term: string; confidence: number; type: 'single' | 'phrase' }> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  const words = text.split(/\W+/)
    .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .map(word => word.toLowerCase());

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  const captionWords = new Set(caption.split(/\W+/).map(w => w.toLowerCase()));
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => {
      const aInCaption = captionWords.has(a[0]) ? 1 : 0;
      const bInCaption = captionWords.has(b[0]) ? 1 : 0;
      
      if (aInCaption !== bInCaption) {
        return bInCaption - aInCaption;
      }
      return b[1] - a[1];
    })
    .slice(0, 10)
    .map(([word, freq]) => ({
      term: word,
      confidence: freq / words.length + (captionWords.has(word) ? 0.3 : 0),
      type: 'single' as const
    }));
}

/**
 * Extract secondary keywords
 */
function extractSecondaryKeywords(text: string, primary: string[]): string[] {
  const primarySet = new Set(primary);
  const words = text.split(/\W+/)
    .filter(word => word.length > 2 && !primarySet.has(word.toLowerCase()))
    .map(word => word.toLowerCase());

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

/**
 * Extract n-grams and phrases
 */
function extractNgrams(text: string): Array<{ text: string; frequency: number; significance: number }> {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  
  if (tokens.length < 2) return [];

  const bigrams = natural.NGrams.bigrams(tokens) || [];
  const trigrams = natural.NGrams.trigrams(tokens) || [];
  
  const phraseFreq = new Map<string, number>();
  
  // Count bigrams
  if (Array.isArray(bigrams)) {
    bigrams.forEach(bigram => {
      const phrase = bigram.join(' ');
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    });
  }
  
  // Count trigrams
  if (Array.isArray(trigrams)) {
    trigrams.forEach(trigram => {
      const phrase = trigram.join(' ');
      phraseFreq.set(phrase, (phraseFreq.get(phrase) || 0) + 1);
    });
  }

  // Filter and score phrases
  const totalPhrases = Array.from(phraseFreq.values()).reduce((sum, freq) => sum + freq, 0);
  
  return Array.from(phraseFreq.entries())
    .filter(([phrase, freq]) => freq > 1 && phrase.length > 3) // Only phrases that appear more than once
    .map(([phrase, freq]) => ({
      text: phrase,
      frequency: freq,
      significance: freq / totalPhrases
    }))
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 10);
}

/**
 * Analyze sentiment
 */
function analyzeSentiment(text: string, caption: string): {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  comparative: number;
  emotions: string[];
} {
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);
  
  // Detect emotions from keywords
  const emotionKeywords = {
    positive: ['amazing', 'love', 'fantastic', 'awesome', 'great', 'wonderful', 'perfect', 'excellent'],
    negative: ['terrible', 'hate', 'awful', 'bad', 'worst', 'disappointing', 'horrible', 'terrible'],
    excitement: ['wow', 'incredible', 'unbelievable', 'stunning', 'mind-blowing'],
    curiosity: ['wonder', 'curious', 'interesting', 'fascinating', 'intriguing'],
    frustration: ['annoying', 'frustrating', 'irritating', 'bothersome']
  };

  const emotions: string[] = [];
  const lowerText = text.toLowerCase();
  
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      emotions.push(emotion);
    }
  });

  let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (result.score > 1) overall = 'positive';
  else if (result.score < -1) overall = 'negative';

  return {
    overall,
    score: Math.max(-5, Math.min(5, result.score)),
    comparative: result.comparative,
    emotions
  };
}

/**
 * Detect intent
 */
function detectIntent(text: string, caption: string): {
  primary: 'educate' | 'entertain' | 'promote' | 'inspire' | 'inform' | 'unknown';
  secondary: string[];
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const lowerCaption = caption.toLowerCase();
  const combinedText = `${lowerText} ${lowerCaption}`;

  const intentSignals = {
    educate: ['how to', 'tutorial', 'learn', 'teach', 'explain', 'guide', 'step by step', 'tips', 'tricks'],
    entertain: ['funny', 'joke', 'laugh', 'entertaining', 'comedy', 'dance', 'music', 'challenge', 'prank'],
    promote: ['buy', 'sale', 'discount', 'offer', 'product', 'brand', 'shop', 'purchase', 'link in bio', 'check out'],
    inspire: ['motivation', 'inspire', 'motivational', 'success', 'achieve', 'dream', 'goal', 'mindset'],
    inform: ['news', 'update', 'information', 'fact', 'research', 'study', 'report', 'announcement']
  };

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

/**
 * Extract entities
 */
function extractEntities(text: string, caption: string, ocrText: string | null): {
  brands: string[];
  products: string[];
  people: string[];
  prices: string[];
  locations: string[];
} {
  const combinedText = [text, caption, ocrText].filter(Boolean).join(' ');
  
  // Custom brand detection
  const knownBrands = ['nike', 'adidas', 'apple', 'google', 'microsoft', 'amazon', 'netflix', 'spotify', 'uber', 'airbnb', 'tesla', 'meta', 'tiktok', 'youtube'];
  const detectedBrands = knownBrands.filter(brand => 
    combinedText.toLowerCase().includes(brand)
  );
  
  // Extract prices
  const priceRegex = /\$[\d,]+(?:\.\d{2})?|\€[\d,]+(?:\.\d{2})?|£[\d,]+(?:\.\d{2})?|\d+\s*(?:dollars?|euros?|pounds?)/gi;
  const prices = (combinedText.match(priceRegex) || []).map(price => price.trim());
  
  // Extract products (common product keywords)
  const productKeywords = ['shirt', 'dress', 'shoes', 'bag', 'phone', 'laptop', 'book', 'food', 'drink', 'car', 'house', 'furniture'];
  const products = productKeywords.filter(product => 
    combinedText.toLowerCase().includes(product)
  );

  // Simple people detection (capitalized words that could be names)
  const peopleRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const people = (combinedText.match(peopleRegex) || []).slice(0, 5); // Limit to 5 people

  // Simple location detection (common place names)
  const locationKeywords = ['new york', 'los angeles', 'london', 'paris', 'tokyo', 'miami', 'chicago', 'boston', 'seattle', 'san francisco'];
  const locations = locationKeywords.filter(location => 
    combinedText.toLowerCase().includes(location)
  );

  return {
    brands: detectedBrands,
    products,
    people,
    prices,
    locations
  };
}

/**
 * Classify topics with confidence
 */
function classifyTopicsWithConfidence(text: string): {
  primary: { category: string; subcategory: string | null; confidence: number };
  secondary: Array<{ category: string; confidence: number }>;
} {
  const lowerText = text.toLowerCase();
  
  const topicCategories = {
    'fashion': {
      keywords: ['fashion', 'style', 'outfit', 'clothes', 'dress', 'shirt', 'pants', 'shoes', 'accessories', 'beauty', 'makeup'],
      subcategories: {
        'skincare': ['skincare', 'skin', 'face', 'cleanser', 'moisturizer', 'serum'],
        'makeup': ['makeup', 'lipstick', 'foundation', 'mascara', 'eyeshadow'],
        'clothing': ['outfit', 'dress', 'shirt', 'pants', 'shoes']
      }
    },
    'food': {
      keywords: ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'delicious', 'tasty', 'ingredients', 'kitchen', 'chef'],
      subcategories: {
        'cooking': ['recipe', 'cooking', 'kitchen', 'chef', 'ingredients'],
        'restaurant': ['restaurant', 'dining', 'menu', 'food']
      }
    },
    'fitness': {
      keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'health', 'muscle', 'cardio', 'yoga', 'running'],
      subcategories: {
        'workout': ['workout', 'exercise', 'gym', 'training'],
        'yoga': ['yoga', 'meditation', 'mindfulness']
      }
    },
    'travel': {
      keywords: ['travel', 'trip', 'vacation', 'destination', 'hotel', 'flight', 'adventure', 'explore', 'journey'],
      subcategories: {
        'adventure': ['adventure', 'explore', 'hiking', 'outdoor'],
        'city': ['city', 'urban', 'downtown']
      }
    },
    'technology': {
      keywords: ['tech', 'technology', 'app', 'software', 'gadget', 'device', 'digital', 'innovation', 'ai', 'coding'],
      subcategories: {
        'software': ['app', 'software', 'coding', 'programming'],
        'gadgets': ['gadget', 'device', 'phone', 'laptop']
      }
    },
    'lifestyle': {
      keywords: ['lifestyle', 'daily', 'routine', 'home', 'family', 'life', 'personal', 'wellness', 'mindfulness'],
      subcategories: {
        'wellness': ['wellness', 'mindfulness', 'meditation', 'self-care'],
        'home': ['home', 'family', 'domestic']
      }
    }
  };

  const scores: Record<string, { score: number; subcategory: string | null; subcategoryScore: number }> = {};
  
  Object.entries(topicCategories).forEach(([category, data]) => {
    const keywordMatches = data.keywords.filter(keyword => lowerText.includes(keyword)).length;
    const score = keywordMatches / data.keywords.length;
    
    let subcategory: string | null = null;
    let subcategoryScore = 0;
    
    Object.entries(data.subcategories).forEach(([sub, subKeywords]) => {
      const subMatches = subKeywords.filter(keyword => lowerText.includes(keyword)).length;
      const subScore = subMatches / subKeywords.length;
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
    .slice(1, 4)
    .filter(([_, data]) => data.score > 0.05)
    .map(([category, data]) => ({
      category,
      confidence: data.score
    }));

  return { primary, secondary };
}

/**
 * Analyze content complexity
 */
function analyzeComplexity(text: string): 'simple' | 'moderate' | 'complex' {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Technical terms that indicate complexity
  const technicalTerms = ['algorithm', 'methodology', 'implementation', 'optimization', 'analysis', 'framework', 'architecture'];
  const technicalCount = technicalTerms.filter(term => text.toLowerCase().includes(term)).length;
  
  if (avgWordsPerSentence > 20 || avgWordLength > 6 || technicalCount > 2) {
    return 'complex';
  } else if (avgWordsPerSentence > 12 || avgWordLength > 5 || technicalCount > 0) {
    return 'moderate';
  } else {
    return 'simple';
  }
}

/**
 * Generate enhanced searchable terms
 */
function generateEnhancedSearchableTerms(keywords: any, fullText: string): string[] {
  const terms = new Set<string>();

  // Add primary keywords
  if (keywords.primary && Array.isArray(keywords.primary)) {
    keywords.primary.forEach((keyword: any) => terms.add(keyword.term));
  }

  // Add phrases
  if (keywords.phrases && Array.isArray(keywords.phrases)) {
    keywords.phrases.forEach((phrase: any) => terms.add(phrase.text));
  }

  // Add hashtags (without #)
  if (keywords.hashtags && Array.isArray(keywords.hashtags)) {
    keywords.hashtags.forEach((tag: string) => terms.add(tag.replace('#', '')));
  }

  // Add mentions (without @)
  if (keywords.mentions && Array.isArray(keywords.mentions)) {
    keywords.mentions.forEach((mention: string) => terms.add(mention.replace('@', '')));
  }

  // Add topic categories
  if (keywords.topics && keywords.topics.primary && keywords.topics.primary.category) {
    terms.add(keywords.topics.primary.category);
  }
  if (keywords.topics && keywords.topics.secondary && Array.isArray(keywords.topics.secondary)) {
    keywords.topics.secondary.forEach((topic: any) => terms.add(topic.category));
  }

  // Add entities
  if (keywords.entities && keywords.entities.brands && Array.isArray(keywords.entities.brands)) {
    keywords.entities.brands.forEach((brand: string) => terms.add(brand));
  }
  if (keywords.entities && keywords.entities.products && Array.isArray(keywords.entities.products)) {
    keywords.entities.products.forEach((product: string) => terms.add(product));
  }

  // Add common search terms
  const commonTerms = ['video', 'reel', 'instagram', 'social', 'content', 'viral', 'trending'];
  commonTerms.forEach(term => terms.add(term));

  return Array.from(terms).slice(0, 50); // Limit to 50 terms
}

/**
 * Extract hashtags from caption
 */
function extractHashtags(caption: string): string[] {
  const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
  const matches = caption.match(hashtagRegex) || [];
  return matches.map(tag => tag.toLowerCase());
}

/**
 * Extract mentions from caption
 */
function extractMentions(caption: string): string[] {
  const mentionRegex = /@[\w\u0590-\u05ff]+/g;
  const matches = caption.match(mentionRegex) || [];
  return matches.map(mention => mention.toLowerCase());
}

/**
 * Extract OCR text from OCR results
 */
function extractOCRText(ocr: any): string | null {
  if (!ocr?.frames) return null;
  
  const texts: string[] = [];
  ocr.frames.forEach((frame: any) => {
    if (frame.boxes) {
      frame.boxes.forEach((box: any) => {
        if (box.text) {
          texts.push(box.text);
        }
      });
    }
  });
  
  return texts.join(' ').trim() || null;
}

/**
 * Extract username from caption
 */
function extractUsername(caption: string | null): string | undefined {
  if (!caption) return undefined;
  
  const mentionMatch = caption.match(/@(\w+)/);
  return mentionMatch ? mentionMatch[1] : undefined;
}
