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
    events: string[];
    dates: string[];
    measurements: string[];
    currencies: string[];
  };
  metadata: {
    caption: string | null;
    transcript: string | null;
    ocrText: string | null;
    duration: number;
    username?: string;
    complexity: 'simple' | 'moderate' | 'complex';
    context?: {
      domain: string;
      targetAudience: string[];
      contentStyle: string;
    };
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
        context: enhancedKeywords.context,
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
  context: {
    domain: string;
    targetAudience: string[];
    contentStyle: string;
  };
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
    : { brands: [], products: [], people: [], prices: [], locations: [], events: [], dates: [], measurements: [], currencies: [] };

  // Content complexity
  const complexity = analyzeComplexity(combinedText);

  // Content context analysis
  const context = analyzeContentContext(combinedText, topics);

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
    context,
  };
}

/**
 * Calculate position weight for a word in text
 */
function calculatePositionWeight(word: string, text: string, caption: string): number {
  const textWords = text.split(/\W+/);
  const firstOccurrence = textWords.indexOf(word);
  const positionScore = firstOccurrence < 10 ? 0.2 : (firstOccurrence < 30 ? 0.1 : 0);
  const captionBoost = caption.toLowerCase().includes(word) ? 0.3 : 0;
  return positionScore + captionBoost;
}

/**
 * Calculate context score for a word based on surrounding words
 */
function calculateContextScore(word: string, text: string): number {
  const words = text.split(/\W+/);
  const wordIndex = words.indexOf(word);
  if (wordIndex === -1) return 0;
  
  // Check for important context words nearby
  const contextWords = ['amazing', 'best', 'love', 'great', 'perfect', 'incredible', 'wow', 'awesome'];
  const window = 3; // Check 3 words before and after
  const start = Math.max(0, wordIndex - window);
  const end = Math.min(words.length, wordIndex + window + 1);
  
  const nearbyWords = words.slice(start, end);
  const contextMatches = nearbyWords.filter(w => contextWords.includes(w.toLowerCase())).length;
  
  return Math.min(0.2, contextMatches * 0.05);
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
  
  // Combine and score with enhanced multi-factor scoring
  const captionWords = new Set(caption.split(/\W+/).map(w => w.toLowerCase()));
  
  const allTerms = [
    ...Array.from(wordFreq.entries()).map(([word, freq]) => {
      const frequencyScore = freq / words.length;
      const positionWeight = calculatePositionWeight(word, text, caption);
      const contextScore = calculateContextScore(word, text);
      
      return {
        term: word,
        confidence: (frequencyScore * 0.4) + (positionWeight * 0.4) + (contextScore * 0.2),
        type: 'single' as const
      };
    }),
    ...phrases.slice(0, 5).map(phrase => ({
      term: phrase.text,
      confidence: phrase.significance,
      type: 'phrase' as const
    }))
  ];

  return allTerms
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 15); // Increased from 10 to 15
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
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);
  
  const words = text.split(/\W+/)
    .filter(word => word.length > 2 && !primarySet.has(word.toLowerCase()) && !stopWords.has(word.toLowerCase()))
    .map(word => word.toLowerCase());

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // Increased from 15 to 20
    .map(([word]) => word);
}

/**
 * Calculate PMI (Pointwise Mutual Information) for phrase quality
 */
function calculatePMI(phrase: string, corpus: string): number {
  const words = phrase.split(' ');
  if (words.length < 2) return 0;
  
  const phraseFreq = (corpus.match(new RegExp(phrase, 'gi')) || []).length;
  const word1Freq = (corpus.match(new RegExp(words[0], 'gi')) || []).length;
  const word2Freq = (corpus.match(new RegExp(words[1], 'gi')) || []).length;
  const totalWords = corpus.split(/\s+/).length;
  
  if (phraseFreq === 0 || word1Freq === 0 || word2Freq === 0) return 0;
  
  const pPhrase = phraseFreq / totalWords;
  const pWord1 = word1Freq / totalWords;
  const pWord2 = word2Freq / totalWords;
  
  return Math.log2(pPhrase / (pWord1 * pWord2));
}

/**
 * Extract n-grams and phrases with enhanced quality filtering
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

  // Filter stopwords from phrase edges
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  
  // Filter and score phrases with PMI
  const totalPhrases = Array.from(phraseFreq.values()).reduce((sum, freq) => sum + freq, 0);
  
  return Array.from(phraseFreq.entries())
    .filter(([phrase, freq]) => {
      const words = phrase.split(' ');
      return freq > 1 && 
             phrase.length > 3 && 
             !stopWords.has(words[0]) && 
             !stopWords.has(words[words.length - 1]);
    })
    .map(([phrase, freq]) => {
      const pmi = calculatePMI(phrase, text);
      const frequencyScore = freq / totalPhrases;
      return {
        text: phrase,
        frequency: freq,
        significance: (frequencyScore * 0.6) + (Math.max(0, pmi) * 0.4)
      };
    })
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 15); // Increased from 10 to 15
}

/**
 * Analyze sentiment with enhanced emotion detection
 */
function analyzeSentiment(text: string, caption: string): {
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  comparative: number;
  emotions: string[];
} {
  const sentiment = new Sentiment();
  const result = sentiment.analyze(text);
  
  // Enhanced emotion keywords with 15+ categories
  const emotionKeywords = {
    joy: ['happy', 'joyful', 'delighted', 'cheerful', 'ecstatic', 'elated', 'thrilled', 'blissful'],
    excitement: ['wow', 'incredible', 'amazing', 'unbelievable', 'stunning', 'mind-blowing', 'fantastic', 'awesome'],
    love: ['love', 'adore', 'cherish', 'treasure', 'passion', 'affection', 'romantic', 'heart'],
    trust: ['reliable', 'trustworthy', 'honest', 'genuine', 'authentic', 'credible', 'dependable'],
    anticipation: ['excited', 'looking forward', 'cant wait', 'eager', 'hopeful', 'optimistic'],
    surprise: ['surprised', 'shocked', 'astonished', 'amazed', 'bewildered', 'startled'],
    anger: ['angry', 'mad', 'furious', 'rage', 'irritated', 'annoyed', 'frustrated', 'livid'],
    fear: ['scared', 'afraid', 'terrified', 'worried', 'anxious', 'nervous', 'panic'],
    sadness: ['sad', 'depressed', 'miserable', 'gloomy', 'melancholy', 'sorrowful', 'heartbroken'],
    disgust: ['disgusted', 'revolted', 'sickened', 'repulsed', 'nauseated', 'appalled'],
    frustration: ['annoying', 'frustrating', 'irritating', 'bothersome', 'aggravating', 'infuriating'],
    curiosity: ['wonder', 'curious', 'interesting', 'fascinating', 'intriguing', 'mysterious'],
    confidence: ['confident', 'proud', 'accomplished', 'successful', 'achieved', 'victorious'],
    gratitude: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'lucky'],
    nostalgia: ['nostalgic', 'memories', 'remember', 'childhood', 'past', 'old times'],
    inspiration: ['inspired', 'motivated', 'uplifting', 'empowering', 'encouraging', 'inspiring']
  };

  // Intensity modifiers
  const intensifiers = {
    high: ['very', 'extremely', 'incredibly', 'absolutely', 'totally', 'completely', 'utterly'],
    low: ['slightly', 'somewhat', 'a bit', 'fairly', 'somewhat', 'kind of', 'sort of']
  };

  const emotions: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for intensity modifiers
  let intensityMultiplier = 1.0;
  intensifiers.high.forEach(modifier => {
    if (lowerText.includes(modifier)) {
      intensityMultiplier = 1.5;
    }
  });
  
  intensifiers.low.forEach(modifier => {
    if (lowerText.includes(modifier)) {
      intensityMultiplier = 0.7;
    }
  });
  
  // Detect emotions with intensity consideration
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > 0) {
      emotions.push(emotion);
    }
  });

  // Check for negation patterns
  const negationWords = ['not', 'no', 'never', 'dont', 'wont', 'cant', 'shouldnt'];
  const hasNegation = negationWords.some(neg => lowerText.includes(neg));
  
  let overall: 'positive' | 'negative' | 'neutral' = 'neutral';
  let adjustedScore = result.score;
  
  if (hasNegation) {
    adjustedScore = -adjustedScore * 0.8; // Reduce intensity for negated sentiment
  }
  
  if (adjustedScore > 1) overall = 'positive';
  else if (adjustedScore < -1) overall = 'negative';

  return {
    overall,
    score: Math.max(-5, Math.min(5, adjustedScore * intensityMultiplier)),
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
 * Extract entities with expanded database
 */
function extractEntities(text: string, caption: string, ocrText: string | null): {
  brands: string[];
  products: string[];
  people: string[];
  prices: string[];
  locations: string[];
  events: string[];
  dates: string[];
  measurements: string[];
  currencies: string[];
} {
  const combinedText = [text, caption, ocrText].filter(Boolean).join(' ');
  
  // Expanded brand database organized by category
  const brandDatabase = {
    tech: ['apple', 'google', 'microsoft', 'samsung', 'amazon', 'meta', 'netflix', 'spotify', 'uber', 'airbnb', 'tesla', 'tiktok', 'youtube', 'instagram', 'facebook', 'twitter', 'linkedin', 'snapchat', 'zoom', 'slack', 'discord', 'twitch', 'steam', 'epic games', 'nvidia', 'intel', 'amd', 'sony', 'nintendo', 'playstation', 'xbox'],
    fashion: ['nike', 'adidas', 'gucci', 'zara', 'h&m', 'uniqlo', 'gap', 'levis', 'calvin klein', 'tommy hilfiger', 'ralph lauren', 'versace', 'prada', 'chanel', 'louis vuitton', 'hermes', 'burberry', 'balenciaga', 'off-white', 'supreme', 'stussy', 'vans', 'converse', 'new balance', 'puma', 'reebok'],
    food: ['mcdonalds', 'starbucks', 'subway', 'dominos', 'pizza hut', 'kfc', 'burger king', 'wendys', 'taco bell', 'chipotle', 'panera', 'dunkin', 'tim hortons', 'coca cola', 'pepsi', 'red bull', 'monster', 'nescafe', 'folgers', 'maxwell house'],
    automotive: ['tesla', 'bmw', 'mercedes', 'toyota', 'honda', 'ford', 'chevrolet', 'audi', 'volkswagen', 'nissan', 'hyundai', 'kia', 'mazda', 'subaru', 'lexus', 'acura', 'infiniti', 'cadillac', 'lincoln', 'jeep', 'ram', 'dodge', 'chrysler'],
    beauty: ['loreal', 'maybelline', 'revlon', 'covergirl', 'clinique', 'estee lauder', 'mac', 'urban decay', 'too faced', 'fenty beauty', 'rare beauty', 'glossier', 'the ordinary', 'drunk elephant', 'tatcha', 'fresh', 'kiehls', 'origins', 'clinique', 'lancome', 'ysl', 'dior', 'chanel beauty'],
    sports: ['nike', 'adidas', 'puma', 'under armour', 'new balance', 'asics', 'reebok', 'converse', 'vans', 'jordan', 'wilson', 'spalding', 'rawlings', 'mizuno', 'callaway', 'taylor made', 'ping', 'titleist'],
    entertainment: ['netflix', 'disney', 'hbo', 'hulu', 'amazon prime', 'paramount', 'universal', 'warner bros', 'sony pictures', 'marvel', 'dc comics', 'pixar', 'dreamworks', 'lucasfilm', 'pixar', 'studio ghibli']
  };
  
  // Flatten all brands
  const allBrands = Object.values(brandDatabase).flat();
  const detectedBrands = allBrands.filter(brand => 
    combinedText.toLowerCase().includes(brand.toLowerCase())
  );
  
  // Enhanced price extraction with more currencies
  const priceRegex = /\$[\d,]+(?:\.\d{2})?|\€[\d,]+(?:\.\d{2})?|£[\d,]+(?:\.\d{2})?|¥[\d,]+(?:\.\d{2})?|₹[\d,]+(?:\.\d{2})?|\d+\s*(?:dollars?|euros?|pounds?|yen|rupees?|pesos?)/gi;
  const prices = (combinedText.match(priceRegex) || []).map(price => price.trim());
  
  // Enhanced product detection with categories
  const productCategories = {
    clothing: ['shirt', 'dress', 'pants', 'jeans', 'shoes', 'boots', 'sneakers', 'jacket', 'coat', 'sweater', 'hoodie', 'shorts', 'skirt', 'blouse', 'tank top', 't-shirt', 'polo', 'suit', 'tie', 'belt', 'hat', 'cap', 'scarf', 'gloves', 'socks', 'underwear', 'lingerie', 'swimwear', 'activewear', 'workout clothes'],
    electronics: ['phone', 'smartphone', 'laptop', 'computer', 'tablet', 'headphones', 'speakers', 'camera', 'tv', 'monitor', 'keyboard', 'mouse', 'charger', 'cable', 'adapter', 'battery', 'power bank', 'smartwatch', 'fitness tracker', 'gaming console', 'controller', 'vr headset'],
    beauty: ['makeup', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'blush', 'concealer', 'primer', 'highlighter', 'skincare', 'moisturizer', 'cleanser', 'serum', 'toner', 'mask', 'sunscreen', 'perfume', 'cologne', 'nail polish', 'hair care', 'shampoo', 'conditioner'],
    home: ['furniture', 'chair', 'table', 'sofa', 'bed', 'mattress', 'pillow', 'blanket', 'lamp', 'light', 'mirror', 'art', 'decoration', 'plant', 'vase', 'candle', 'rug', 'curtain', 'blinds', 'kitchen', 'appliance', 'refrigerator', 'stove', 'microwave', 'dishwasher'],
    food: ['food', 'drink', 'beverage', 'coffee', 'tea', 'juice', 'soda', 'water', 'snack', 'chocolate', 'candy', 'cake', 'bread', 'pasta', 'rice', 'meat', 'vegetable', 'fruit', 'dairy', 'milk', 'cheese', 'yogurt', 'ice cream'],
    automotive: ['car', 'vehicle', 'truck', 'suv', 'sedan', 'coupe', 'convertible', 'motorcycle', 'bike', 'bicycle', 'scooter', 'tire', 'wheel', 'engine', 'battery', 'oil', 'fuel', 'gas'],
    books: ['book', 'novel', 'magazine', 'newspaper', 'journal', 'diary', 'textbook', 'manual', 'guide', 'cookbook', 'biography', 'autobiography', 'fiction', 'non-fiction', 'poetry', 'drama', 'comic', 'manga']
  };
  
  const allProducts = Object.values(productCategories).flat();
  const products = allProducts.filter(product => 
    combinedText.toLowerCase().includes(product.toLowerCase())
  );

  // Enhanced people detection
  const peopleRegex = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const people = (combinedText.match(peopleRegex) || []).slice(0, 8); // Increased from 5 to 8

  // Enhanced location detection
  const locationCategories = {
    cities: ['new york', 'los angeles', 'london', 'paris', 'tokyo', 'miami', 'chicago', 'boston', 'seattle', 'san francisco', 'las vegas', 'atlanta', 'houston', 'dallas', 'phoenix', 'denver', 'portland', 'vancouver', 'toronto', 'montreal', 'sydney', 'melbourne', 'berlin', 'madrid', 'rome', 'milan', 'barcelona', 'amsterdam', 'brussels', 'zurich', 'vienna', 'prague', 'warsaw', 'moscow', 'beijing', 'shanghai', 'hong kong', 'singapore', 'bangkok', 'mumbai', 'delhi', 'dubai', 'cairo', 'johannesburg', 'lagos', 'nairobi', 'rio de janeiro', 'sao paulo', 'buenos aires', 'mexico city', 'montreal'],
    countries: ['usa', 'united states', 'canada', 'mexico', 'brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela', 'uk', 'united kingdom', 'france', 'germany', 'italy', 'spain', 'portugal', 'netherlands', 'belgium', 'switzerland', 'austria', 'poland', 'czech republic', 'hungary', 'romania', 'bulgaria', 'croatia', 'serbia', 'russia', 'china', 'japan', 'south korea', 'india', 'thailand', 'singapore', 'malaysia', 'indonesia', 'philippines', 'vietnam', 'australia', 'new zealand', 'south africa', 'egypt', 'nigeria', 'kenya', 'morocco', 'tunisia', 'algeria', 'israel', 'turkey', 'saudi arabia', 'uae', 'qatar', 'kuwait', 'bahrain', 'oman'],
    landmarks: ['eiffel tower', 'statue of liberty', 'big ben', 'tower bridge', 'london eye', 'colosseum', 'leaning tower of pisa', 'sagrada familia', 'acropolis', 'parthenon', 'brandenburg gate', 'neuschwanstein castle', 'machu picchu', 'christ the redeemer', 'golden gate bridge', 'hollywood sign', 'times square', 'central park', 'niagara falls', 'grand canyon', 'mount rushmore', 'liberty bell', 'white house', 'capitol building', 'lincoln memorial', 'washington monument', 'empire state building', 'chrysler building', 'one world trade center', 'brooklyn bridge', 'golden gate park', 'fishermans wharf', 'alcatraz', 'yosemite', 'yellowstone', 'glacier national park', 'rocky mountains', 'appalachian mountains', 'mississippi river', 'colorado river', 'great lakes', 'lake tahoe', 'crater lake', 'mount rainier', 'mount st helens', 'mount hood', 'mount shasta', 'mount whitney', 'death valley', 'mojave desert', 'sonoran desert', 'great basin', 'chihuahuan desert', 'great plains', 'prairie', 'savanna', 'tundra', 'taiga', 'rainforest', 'amazon rainforest', 'congo rainforest', 'borneo rainforest', 'daintree rainforest', 'atlantic ocean', 'pacific ocean', 'indian ocean', 'arctic ocean', 'southern ocean', 'mediterranean sea', 'caribbean sea', 'red sea', 'persian gulf', 'gulf of mexico', 'hudson bay', 'baffin bay', 'labrador sea', 'greenland sea', 'norwegian sea', 'north sea', 'baltic sea', 'black sea', 'caspian sea', 'aral sea', 'lake baikal', 'lake superior', 'lake michigan', 'lake huron', 'lake erie', 'lake ontario', 'great salt lake', 'lake tahoe', 'crater lake', 'lake champlain', 'lake george', 'lake placid', 'lake winnipeg', 'great bear lake', 'great slave lake', 'lake athabasca', 'reindeer lake', 'lake manitoba', 'lake of the woods', 'rainy lake', 'lake nipigon', 'lake nipissing', 'lake simcoe', 'lake muskoka', 'lake rosseau', 'lake joseph', 'lake of bays', 'lake kashagawigamog', 'lake cecebe', 'lake opeongo', 'lake temagami', 'lake nipigon', 'lake superior', 'lake michigan', 'lake huron', 'lake erie', 'lake ontario']
  };
  
  const allLocations = Object.values(locationCategories).flat();
  const locations = allLocations.filter(location => 
    combinedText.toLowerCase().includes(location.toLowerCase())
  );

  // Extract events
  const eventKeywords = ['conference', 'convention', 'festival', 'concert', 'show', 'exhibition', 'tournament', 'championship', 'olympics', 'world cup', 'super bowl', 'grammys', 'oscars', 'emmys', 'tonys', 'golden globes', 'sag awards', 'mtv awards', 'billboard awards', 'american music awards', 'country music awards', 'rock and roll hall of fame', 'hall of fame', 'induction ceremony', 'graduation', 'wedding', 'birthday', 'anniversary', 'celebration', 'party', 'gala', 'fundraiser', 'charity event', 'benefit', 'auction', 'sale', 'clearance', 'black friday', 'cyber monday', 'prime day', 'back to school', 'holiday season', 'christmas', 'thanksgiving', 'halloween', 'valentines day', 'mothers day', 'fathers day', 'easter', 'passover', 'ramadan', 'diwali', 'chinese new year', 'lunar new year', 'new years eve', 'new years day', 'independence day', 'memorial day', 'labor day', 'veterans day', 'presidents day', 'martin luther king day', 'columbus day', 'veterans day', 'armed forces day', 'flag day', 'constitution day', 'citizenship day', 'patriot day', '911', 'september 11', 'pearl harbor day', 'd-day', 'd day', 'v-e day', 'v-j day', 'armistice day', 'remembrance day', 'poppy day', 'anzac day', 'canada day', 'victoria day', 'civic holiday', 'labour day', 'thanksgiving', 'remembrance day', 'boxing day', 'new years day', 'good friday', 'easter monday', 'victoria day', 'canada day', 'civic holiday', 'labour day', 'thanksgiving', 'remembrance day', 'boxing day', 'christmas day', 'boxing day', 'new years eve', 'new years day'];
  const events = eventKeywords.filter(event => 
    combinedText.toLowerCase().includes(event.toLowerCase())
  );

  // Extract dates
  const dateRegex = /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
  const dates = (combinedText.match(dateRegex) || []).map(date => date.trim());

  // Extract measurements
  const measurementRegex = /\b\d+(?:\.\d+)?\s*(?:inches?|feet?|ft|yards?|miles?|meters?|m|centimeters?|cm|millimeters?|mm|kilometers?|km|pounds?|lbs?|ounces?|oz|grams?|g|kilograms?|kg|liters?|l|gallons?|gal|cups?|tablespoons?|tbsp|teaspoons?|tsp|degrees?|°|fahrenheit|f|celsius|c)\b/gi;
  const measurements = (combinedText.match(measurementRegex) || []).map(measurement => measurement.trim());

  // Extract currencies
  const currencyRegex = /\b(?:dollars?|euros?|pounds?|yen|rupees?|pesos?|francs?|marks?|lira|kronor?|kroner?|krona|kronur?|zloty|forint|koruna|lev|lei|dinar|dirham|riyal|rial|shekel|rand|naira|cedi|shilling|franc|pound|dollar|euro|yen|yuan|won|dong|rupiah|ringgit|baht|peso|real|sol|bolivar|guarani|uruguayan peso|chilean peso|colombian peso|peruvian sol|venezuelan bolivar|paraguayan guarani|uruguayan peso|chilean peso|colombian peso|peruvian sol|venezuelan bolivar|paraguayan guarani)\b/gi;
  const currencies = (combinedText.match(currencyRegex) || []).map(currency => currency.trim());

  return {
    brands: detectedBrands,
    products,
    people,
    prices,
    locations,
    events,
    dates,
    measurements,
    currencies
  };
}

/**
 * Classify topics with confidence - Enhanced with 10+ categories
 */
function classifyTopicsWithConfidence(text: string): {
  primary: { category: string; subcategory: string | null; confidence: number };
  secondary: Array<{ category: string; confidence: number }>;
} {
  const lowerText = text.toLowerCase();
  
  const topicCategories = {
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
      keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'health', 'muscle', 'cardio', 'yoga', 'running', 'strength', 'endurance', 'flexibility', 'stamina', 'energy', 'active', 'sport', 'athletic', 'physical', 'body', 'weight', 'diet', 'nutrition', 'wellness'],
      weights: { 'fitness': 2.0, 'workout': 1.8, 'exercise': 1.5, 'gym': 1.3 },
      subcategories: {
        'workout': ['workout', 'exercise', 'gym', 'training', 'strength', 'cardio'],
        'yoga': ['yoga', 'meditation', 'mindfulness', 'flexibility', 'balance']
      }
    },
    'travel': {
      keywords: ['travel', 'trip', 'vacation', 'destination', 'hotel', 'flight', 'adventure', 'explore', 'journey', 'tourism', 'vacation', 'holiday', 'backpacking', 'sightseeing', 'culture', 'country', 'city', 'beach', 'mountain', 'nature', 'experience', 'wanderlust'],
      weights: { 'travel': 2.0, 'trip': 1.8, 'vacation': 1.5, 'adventure': 1.3 },
      subcategories: {
        'adventure': ['adventure', 'explore', 'hiking', 'outdoor', 'backpacking', 'trekking'],
        'city': ['city', 'urban', 'downtown', 'metropolitan', 'sightseeing']
      }
    },
    'technology': {
      keywords: ['tech', 'technology', 'app', 'software', 'gadget', 'device', 'digital', 'innovation', 'ai', 'coding', 'programming', 'computer', 'smartphone', 'laptop', 'internet', 'social media', 'platform', 'startup', 'innovation', 'digital', 'cyber', 'data', 'algorithm', 'machine learning'],
      weights: { 'tech': 2.0, 'technology': 1.8, 'software': 1.5, 'digital': 1.3 },
      subcategories: {
        'software': ['app', 'software', 'coding', 'programming', 'development', 'algorithm'],
        'gadgets': ['gadget', 'device', 'phone', 'laptop', 'smartphone', 'tablet']
      }
    },
    'gaming': {
      keywords: ['gaming', 'game', 'gamer', 'esports', 'console', 'pc', 'playstation', 'xbox', 'nintendo', 'streamer', 'twitch', 'gameplay', 'multiplayer', 'tournament', 'competitive', 'strategy', 'action', 'adventure', 'rpg', 'fps', 'moba', 'indie', 'retro'],
      weights: { 'gaming': 2.0, 'game': 1.8, 'gamer': 1.5, 'esports': 1.3 },
      subcategories: {
        'console': ['console', 'playstation', 'xbox', 'nintendo', 'controller'],
        'pc': ['pc', 'computer', 'steam', 'epic', 'gog'],
        'mobile': ['mobile', 'phone', 'tablet', 'ios', 'android']
      }
    },
    'music': {
      keywords: ['music', 'song', 'artist', 'band', 'concert', 'album', 'lyrics', 'melody', 'rhythm', 'instrument', 'guitar', 'piano', 'drums', 'vocals', 'performance', 'stage', 'studio', 'recording', 'genre', 'rock', 'pop', 'jazz', 'classical', 'electronic'],
      weights: { 'music': 2.0, 'song': 1.8, 'artist': 1.5, 'concert': 1.3 },
      subcategories: {
        'live': ['concert', 'performance', 'stage', 'live', 'venue'],
        'studio': ['studio', 'recording', 'album', 'production', 'sound']
      }
    },
    'art': {
      keywords: ['art', 'artist', 'painting', 'drawing', 'sculpture', 'gallery', 'museum', 'creative', 'design', 'canvas', 'brush', 'color', 'palette', 'sketch', 'illustration', 'digital art', 'photography', 'visual', 'aesthetic', 'beautiful', 'masterpiece'],
      weights: { 'art': 2.0, 'artist': 1.8, 'painting': 1.5, 'creative': 1.3 },
      subcategories: {
        'visual': ['painting', 'drawing', 'sculpture', 'canvas', 'brush'],
        'digital': ['digital art', 'photoshop', 'illustration', 'graphic design']
      }
    },
    'education': {
      keywords: ['education', 'learn', 'study', 'school', 'university', 'student', 'teacher', 'course', 'lesson', 'knowledge', 'skill', 'training', 'tutorial', 'academic', 'research', 'science', 'math', 'history', 'literature', 'language', 'degree', 'certificate'],
      weights: { 'education': 2.0, 'learn': 1.8, 'study': 1.5, 'school': 1.3 },
      subcategories: {
        'academic': ['school', 'university', 'degree', 'research', 'academic'],
        'skills': ['skill', 'training', 'tutorial', 'course', 'workshop']
      }
    },
    'business': {
      keywords: ['business', 'entrepreneur', 'startup', 'company', 'corporate', 'finance', 'investment', 'marketing', 'sales', 'management', 'leadership', 'strategy', 'growth', 'profit', 'revenue', 'economy', 'industry', 'professional', 'career', 'success'],
      weights: { 'business': 2.0, 'entrepreneur': 1.8, 'company': 1.5, 'finance': 1.3 },
      subcategories: {
        'startup': ['startup', 'entrepreneur', 'founder', 'venture', 'innovation'],
        'corporate': ['corporate', 'company', 'management', 'leadership', 'strategy']
      }
    },
    'health': {
      keywords: ['health', 'medical', 'doctor', 'hospital', 'medicine', 'treatment', 'therapy', 'wellness', 'mental health', 'physical', 'recovery', 'healing', 'care', 'patient', 'diagnosis', 'symptoms', 'prevention', 'healthy', 'nutrition', 'exercise'],
      weights: { 'health': 2.0, 'medical': 1.8, 'wellness': 1.5, 'therapy': 1.3 },
      subcategories: {
        'medical': ['doctor', 'hospital', 'medicine', 'treatment', 'diagnosis'],
        'wellness': ['wellness', 'mental health', 'therapy', 'recovery', 'healing']
      }
    },
    'pets': {
      keywords: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten', 'veterinary', 'care', 'training', 'breed', 'adoption', 'rescue', 'companion', 'furry', 'cute', 'loyal', 'playful', 'friendly', 'loving'],
      weights: { 'pet': 2.0, 'dog': 1.8, 'cat': 1.5, 'animal': 1.3 },
      subcategories: {
        'dogs': ['dog', 'puppy', 'canine', 'breed', 'training'],
        'cats': ['cat', 'kitten', 'feline', 'purr', 'meow']
      }
    },
    'automotive': {
      keywords: ['car', 'automotive', 'vehicle', 'driving', 'road', 'highway', 'engine', 'motor', 'speed', 'racing', 'luxury', 'sports car', 'electric', 'hybrid', 'fuel', 'maintenance', 'repair', 'garage', 'mechanic'],
      weights: { 'car': 2.0, 'automotive': 1.8, 'vehicle': 1.5, 'driving': 1.3 },
      subcategories: {
        'luxury': ['luxury', 'premium', 'sports car', 'performance', 'exotic'],
        'electric': ['electric', 'hybrid', 'ev', 'battery', 'sustainable']
      }
    },
    'lifestyle': {
      keywords: ['lifestyle', 'daily', 'routine', 'home', 'family', 'life', 'personal', 'wellness', 'mindfulness', 'balance', 'happiness', 'fulfillment', 'peace', 'calm', 'relaxation', 'stress', 'work-life', 'personal growth'],
      weights: { 'lifestyle': 2.0, 'daily': 1.8, 'routine': 1.5, 'wellness': 1.3 },
      subcategories: {
        'wellness': ['wellness', 'mindfulness', 'meditation', 'self-care', 'balance'],
        'home': ['home', 'family', 'domestic', 'household', 'personal']
      }
    }
  };

  const scores: Record<string, { score: number; subcategory: string | null; subcategoryScore: number }> = {};
  
  Object.entries(topicCategories).forEach(([category, data]) => {
    // Calculate weighted score instead of simple count
    let weightedScore = 0;
    let totalWeight = 0;
    
    data.keywords.forEach(keyword => {
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
    .slice(1, 6) // Increased from 4 to 6
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
 * Analyze content context for domain and audience detection
 */
function analyzeContentContext(text: string, topics: any): {
  domain: string;
  targetAudience: string[];
  contentStyle: string;
} {
  // Determine domain based on primary topic
  const domain = topics.primary.category;
  
  // Detect audience indicators
  const audienceIndicators = {
    professional: ['business', 'career', 'professional', 'work', 'office', 'corporate', 'industry', 'executive', 'manager', 'entrepreneur'],
    casual: ['fun', 'chill', 'hang out', 'casual', 'relaxed', 'easy', 'simple', 'friendly', 'social'],
    educational: ['learn', 'tutorial', 'guide', 'how to', 'education', 'study', 'academic', 'knowledge', 'skill', 'training'],
    entertainment: ['watch', 'enjoy', 'entertainment', 'fun', 'comedy', 'music', 'dance', 'party', 'celebration', 'show'],
    young: ['teen', 'teenager', 'young', 'youth', 'student', 'school', 'college', 'university', 'campus'],
    mature: ['adult', 'grown', 'experienced', 'senior', 'elderly', 'mature', 'professional', 'established']
  };
  
  // Detect content style
  const styleIndicators = {
    formal: ['research', 'study', 'analysis', 'professional', 'academic', 'scientific', 'technical', 'official'],
    informal: ['hey', 'guys', 'yall', 'lol', 'omg', 'awesome', 'cool', 'amazing', 'wow', 'haha'],
    instructional: ['step', 'first', 'next', 'finally', 'how to', 'tutorial', 'guide', 'instructions', 'process'],
    promotional: ['buy', 'sale', 'discount', 'offer', 'deal', 'promotion', 'limited', 'exclusive', 'special'],
    personal: ['my', 'i', 'me', 'personal', 'story', 'experience', 'journey', 'life', 'daily', 'routine']
  };
  
  const lowerText = text.toLowerCase();
  
  // Determine target audience
  const targetAudience: string[] = [];
  Object.entries(audienceIndicators).forEach(([audience, keywords]) => {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      targetAudience.push(audience);
    }
  });
  
  // Determine content style
  let contentStyle = 'neutral';
  let maxScore = 0;
  Object.entries(styleIndicators).forEach(([style, keywords]) => {
    const score = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (score > maxScore) {
      contentStyle = style;
      maxScore = score;
    }
  });
  
  return { domain, targetAudience, contentStyle };
}

/**
 * Generate enhanced searchable terms with deduplication and importance weighting
 */
function generateEnhancedSearchableTerms(keywords: any, fullText: string): string[] {
  const terms = new Map<string, number>(); // term -> importance weight

  // Add primary keywords (highest weight)
  if (keywords.primary && Array.isArray(keywords.primary)) {
    keywords.primary.forEach((keyword: any) => {
      const term = keyword.term.toLowerCase().trim();
      terms.set(term, (terms.get(term) || 0) + 3.0); // High weight for primary
    });
  }

  // Add phrases (high weight)
  if (keywords.phrases && Array.isArray(keywords.phrases)) {
    keywords.phrases.forEach((phrase: any) => {
      const term = phrase.text.toLowerCase().trim();
      terms.set(term, (terms.get(term) || 0) + 2.5); // High weight for phrases
    });
  }

  // Add secondary keywords (medium weight)
  if (keywords.secondary && Array.isArray(keywords.secondary)) {
    keywords.secondary.forEach((keyword: string) => {
      const term = keyword.toLowerCase().trim();
      terms.set(term, (terms.get(term) || 0) + 1.5); // Medium weight for secondary
    });
  }

  // Add hashtags (without #) - medium weight
  if (keywords.hashtags && Array.isArray(keywords.hashtags)) {
    keywords.hashtags.forEach((tag: string) => {
      const term = tag.replace('#', '').toLowerCase().trim();
      terms.set(term, (terms.get(term) || 0) + 2.0); // Medium-high weight for hashtags
    });
  }

  // Add mentions (without @) - medium weight
  if (keywords.mentions && Array.isArray(keywords.mentions)) {
    keywords.mentions.forEach((mention: string) => {
      const term = mention.replace('@', '').toLowerCase().trim();
      terms.set(term, (terms.get(term) || 0) + 1.8); // Medium weight for mentions
    });
  }

  // Add topic categories - high weight
  if (keywords.topics && keywords.topics.primary && keywords.topics.primary.category) {
    const term = keywords.topics.primary.category.toLowerCase().trim();
    terms.set(term, (terms.get(term) || 0) + 2.2);
  }
  if (keywords.topics && keywords.topics.secondary && Array.isArray(keywords.topics.secondary)) {
    keywords.topics.secondary.forEach((topic: any) => {
      const term = topic.category.toLowerCase().trim();
      terms.set(term, (terms.get(term) || 0) + 1.8);
    });
  }

  // Add entities with different weights
  if (keywords.entities) {
    // Brands - high weight
    if (keywords.entities.brands && Array.isArray(keywords.entities.brands)) {
      keywords.entities.brands.forEach((brand: string) => {
        const term = brand.toLowerCase().trim();
        terms.set(term, (terms.get(term) || 0) + 2.0);
      });
    }
    
    // Products - medium weight
    if (keywords.entities.products && Array.isArray(keywords.entities.products)) {
      keywords.entities.products.forEach((product: string) => {
        const term = product.toLowerCase().trim();
        terms.set(term, (terms.get(term) || 0) + 1.5);
      });
    }
    
    // People - medium weight
    if (keywords.entities.people && Array.isArray(keywords.entities.people)) {
      keywords.entities.people.forEach((person: string) => {
        const term = person.toLowerCase().trim();
        terms.set(term, (terms.get(term) || 0) + 1.6);
      });
    }
    
    // Locations - medium weight
    if (keywords.entities.locations && Array.isArray(keywords.entities.locations)) {
      keywords.entities.locations.forEach((location: string) => {
        const term = location.toLowerCase().trim();
        terms.set(term, (terms.get(term) || 0) + 1.4);
      });
    }
    
    // Events - low weight
    if (keywords.entities.events && Array.isArray(keywords.entities.events)) {
      keywords.entities.events.forEach((event: string) => {
        const term = event.toLowerCase().trim();
        terms.set(term, (terms.get(term) || 0) + 1.0);
      });
    }
  }

  // Add common search terms with low weight
  const commonTerms = ['video', 'reel', 'instagram', 'social', 'content', 'viral', 'trending'];
  commonTerms.forEach(term => {
    const normalized = term.toLowerCase().trim();
    terms.set(normalized, (terms.get(normalized) || 0) + 0.5);
  });

  // Filter out generic filler terms
  const fillerTerms = new Set(['thing', 'stuff', 'something', 'anything', 'everything', 'nothing', 'someone', 'anyone', 'everyone', 'nobody']);
  
  // Sort by importance and return top terms
  return Array.from(terms.entries())
    .filter(([term, _]) => !fillerTerms.has(term) && term.length > 1)
    .sort((a, b) => b[1] - a[1])
    .map(([term, _]) => term)
    .slice(0, 60); // Increased from 50 to 60
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
