import { downloadInstagramReel, isValidInstagramReelUrl } from './instagram';
import { fetchAndExtract } from './media';
import { callWorkerASR } from './worker';
import { runOCR } from './ocr';
import { buildTimedDoc } from './nlp';
import { config } from '../config';

export interface KeywordExtractionRequest {
  instagramReelUrl: string;
  languageHint?: string;
  cookieOptions?: {
    browserCookies?: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'brave';
    cookiesFile?: string;
  };
}

export interface KeywordExtractionResult {
  keywords: {
    primary: string[];
    secondary: string[];
    hashtags: string[];
    mentions: string[];
    topics: string[];
  };
  metadata: {
    caption: string | null;
    transcript: string | null;
    ocrText: string | null;
    duration: number;
    username?: string;
  };
  searchableTerms: string[];
  timings: {
    totalMs: number;
    stages: {
      extract: number;
      asr: number;
      ocr: number;
      processing: number;
    };
  };
}

/**
 * Extract keywords from an Instagram Reel for search purposes
 */
export async function extractKeywords(request: KeywordExtractionRequest): Promise<KeywordExtractionResult> {
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

    // Step 4: Extract keywords
    const processingStart = Date.now();
    const keywords = extractKeywordsFromText(doc.fullText, mediaData.caption || '');
    timings.processing = Date.now() - processingStart;

    // Step 5: Generate searchable terms
    const searchableTerms = generateSearchableTerms(keywords, doc.fullText);

    return {
      keywords,
      metadata: {
        caption: mediaData.caption || null,
        transcript: doc.fullText || null,
        ocrText: extractOCRText(ocr),
        duration: 0, // TODO: Extract from video metadata
        username: extractUsername(mediaData.caption || null),
      },
      searchableTerms,
      timings: {
        totalMs: Date.now() - startTime,
        stages: {
          extract: timings.extract,
          asr: timings.asr,
          ocr: timings.ocr,
          processing: timings.processing,
        },
      },
    };

  } catch (error) {
    throw new Error(`Keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract keywords from text using various techniques
 */
function extractKeywordsFromText(fullText: string, caption: string): {
  primary: string[];
  secondary: string[];
  hashtags: string[];
  mentions: string[];
  topics: string[];
} {
  const text = fullText.toLowerCase();
  const captionText = caption.toLowerCase();

  // Extract hashtags
  const hashtags = extractHashtags(caption);
  
  // Extract mentions
  const mentions = extractMentions(caption);
  
  // Extract primary keywords (most important terms)
  const primary = extractPrimaryKeywords(text, captionText);
  
  // Extract secondary keywords (supporting terms)
  const secondary = extractSecondaryKeywords(text, primary);
  
  // Extract topic categories
  const topics = extractTopics(text);

  return {
    primary,
    secondary,
    hashtags,
    mentions,
    topics,
  };
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
 * Extract primary keywords using TF-IDF-like approach
 */
function extractPrimaryKeywords(text: string, caption: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  // Extract words and count frequency
  const words = text.split(/\W+/)
    .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
    .map(word => word.toLowerCase());

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Prioritize words that appear in caption
  const captionWords = new Set(caption.split(/\W+/).map(w => w.toLowerCase()));
  
  // Sort by frequency and caption presence
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => {
      const aInCaption = captionWords.has(a[0]) ? 1 : 0;
      const bInCaption = captionWords.has(b[0]) ? 1 : 0;
      
      if (aInCaption !== bInCaption) {
        return bInCaption - aInCaption;
      }
      return b[1] - a[1];
    })
    .slice(0, 10)
    .map(([word]) => word);

  return sortedWords;
}

/**
 * Extract secondary keywords (related terms)
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
 * Extract topic categories
 */
function extractTopics(text: string): string[] {
  const topics: string[] = [];
  const lowerText = text.toLowerCase();

  // Define topic categories and their keywords
  const topicCategories = {
    'fashion': ['fashion', 'style', 'outfit', 'clothes', 'dress', 'shirt', 'pants', 'shoes', 'accessories'],
    'beauty': ['beauty', 'makeup', 'skincare', 'cosmetics', 'lipstick', 'foundation', 'mascara', 'skincare'],
    'food': ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'delicious', 'tasty', 'ingredients'],
    'travel': ['travel', 'trip', 'vacation', 'destination', 'hotel', 'flight', 'adventure', 'explore'],
    'fitness': ['fitness', 'workout', 'exercise', 'gym', 'training', 'health', 'muscle', 'cardio'],
    'technology': ['tech', 'technology', 'app', 'software', 'gadget', 'device', 'digital', 'innovation'],
    'lifestyle': ['lifestyle', 'daily', 'routine', 'home', 'family', 'life', 'personal', 'lifestyle'],
    'entertainment': ['entertainment', 'fun', 'funny', 'comedy', 'music', 'dance', 'party', 'celebration'],
    'education': ['education', 'learn', 'study', 'knowledge', 'tutorial', 'lesson', 'course', 'academic'],
    'business': ['business', 'work', 'career', 'professional', 'office', 'meeting', 'strategy', 'success'],
  };

  Object.entries(topicCategories).forEach(([category, keywords]) => {
    const matchCount = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matchCount >= 2) { // Require at least 2 keyword matches
      topics.push(category);
    }
  });

  return topics;
}

/**
 * Generate searchable terms for SEO and discovery
 */
function generateSearchableTerms(keywords: any, fullText: string): string[] {
  const terms = new Set<string>();

  // Add primary keywords
  keywords.primary.forEach((keyword: string) => terms.add(keyword));

  // Add hashtags (without #)
  keywords.hashtags.forEach((tag: string) => terms.add(tag.replace('#', '')));

  // Add mentions (without @)
  keywords.mentions.forEach((mention: string) => terms.add(mention.replace('@', '')));

  // Add topic categories
  keywords.topics.forEach((topic: string) => terms.add(topic));

  // Add common search terms
  const commonTerms = ['video', 'reel', 'instagram', 'social', 'content', 'viral', 'trending'];
  commonTerms.forEach(term => terms.add(term));

  // Add brand-related terms if found
  const brandTerms = extractBrandTerms(fullText);
  brandTerms.forEach(term => terms.add(term));

  return Array.from(terms).slice(0, 50); // Limit to 50 terms
}

/**
 * Extract brand-related terms
 */
function extractBrandTerms(text: string): string[] {
  const brands = ['nike', 'adidas', 'apple', 'google', 'microsoft', 'amazon', 'netflix', 'spotify', 'uber', 'airbnb'];
  const foundBrands: string[] = [];
  
  brands.forEach(brand => {
    if (text.toLowerCase().includes(brand)) {
      foundBrands.push(brand);
    }
  });

  return foundBrands;
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
