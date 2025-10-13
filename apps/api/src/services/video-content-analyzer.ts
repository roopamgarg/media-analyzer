import { VideoContentAnalysis } from '@media-analyzer/contracts';
import { AnalysisContext } from './analyze-sync';

/**
 * Analyzes video content to provide detailed insights about the video's message, hook, and other key elements
 */
export async function analyzeVideoContent(
  ctx: AnalysisContext,
  transcript: string,
  caption: string | null,
  frames: Array<{ t: number; ocrText?: string }>
): Promise<VideoContentAnalysis> {
  
  // Combine all text content for analysis
  const allText = [transcript, caption].filter(Boolean).join(' ');
  const frameTexts = frames.map(f => f.ocrText).filter(Boolean).join(' ');
  const combinedText = [allText, frameTexts].filter(Boolean).join(' ');

  // Analyze content type and main message
  const contentAnalysis = analyzeContent(combinedText, transcript, caption);
  
  // Analyze hook and engagement elements
  const hookAnalysis = analyzeHook(transcript, caption, frames);
  
  // Analyze production quality
  const productionAnalysis = analyzeProduction(frames, transcript);
  
  // Analyze performance indicators
  const performanceAnalysis = analyzePerformance(transcript, frames);
  
  // Analyze brand alignment
  const brandAlignment = analyzeBrandAlignment(ctx, combinedText, frames);
  
  // Generate recommendations
  const recommendations = generateRecommendations(contentAnalysis, hookAnalysis, brandAlignment);

  return {
    content: contentAnalysis,
    hook: hookAnalysis,
    production: productionAnalysis,
    performance: performanceAnalysis,
    brandAlignment,
    recommendations,
  };
}

function analyzeContent(text: string, transcript: string, caption: string | null) {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Determine content type
  let contentType: 'educational' | 'entertainment' | 'promotional' | 'lifestyle' | 'tutorial' | 'story' | 'other' = 'other';
  
  const educationalKeywords = ['how to', 'learn', 'teach', 'explain', 'guide', 'tutorial', 'step by step'];
  const entertainmentKeywords = ['funny', 'joke', 'laugh', 'entertaining', 'comedy', 'dance', 'music'];
  const promotionalKeywords = ['buy', 'sale', 'discount', 'offer', 'product', 'brand', 'shop', 'purchase'];
  const lifestyleKeywords = ['day in the life', 'routine', 'lifestyle', 'daily', 'morning', 'evening'];
  const tutorialKeywords = ['tutorial', 'how to', 'step', 'guide', 'instructions', 'process'];
  const storyKeywords = ['story', 'once upon', 'happened', 'experience', 'journey', 'adventure'];
  
  if (educationalKeywords.some(keyword => text.includes(keyword))) contentType = 'educational';
  else if (entertainmentKeywords.some(keyword => text.includes(keyword))) contentType = 'entertainment';
  else if (promotionalKeywords.some(keyword => text.includes(keyword))) contentType = 'promotional';
  else if (lifestyleKeywords.some(keyword => text.includes(keyword))) contentType = 'lifestyle';
  else if (tutorialKeywords.some(keyword => text.includes(keyword))) contentType = 'tutorial';
  else if (storyKeywords.some(keyword => text.includes(keyword))) contentType = 'story';
  
  // Extract key topics
  const keyTopics = extractKeyTopics(text);
  
  // Generate summary
  const summary = generateSummary(sentences, transcript, caption);
  
  // Extract main message
  const mainMessage = extractMainMessage(sentences, keyTopics);
  
  // Determine target audience
  const targetAudience = determineTargetAudience(text, contentType);
  
  return {
    summary,
    mainMessage,
    keyTopics,
    contentType,
    targetAudience,
  };
}

function analyzeHook(transcript: string, caption: string | null, frames: Array<{ t: number; ocrText?: string }>) {
  const firstSentence = transcript.split(/[.!?]+/)[0]?.trim() || '';
  const captionText = caption || '';
  
  // Analyze opening hook
  const openingHook = firstSentence || captionText.split('\n')[0] || 'Visual opening';
  
  // Determine hook type
  let hookType: 'question' | 'statement' | 'visual' | 'story' | 'trend' | 'challenge' | 'other' = 'other';
  
  if (openingHook.includes('?')) hookType = 'question';
  else if (openingHook.includes('Did you know') || openingHook.includes('Here\'s')) hookType = 'statement';
  else if (openingHook.includes('story') || openingHook.includes('happened')) hookType = 'story';
  else if (openingHook.includes('trend') || openingHook.includes('viral')) hookType = 'trend';
  else if (openingHook.includes('challenge') || openingHook.includes('try this')) hookType = 'challenge';
  else if (firstSentence.length < 10) hookType = 'visual';
  
  // Identify engagement elements
  const engagementElements = [];
  const fullText = [transcript, caption].filter(Boolean).join(' ');
  
  if (fullText.includes('?')) engagementElements.push('Questions to audience');
  if (fullText.includes('like') || fullText.includes('follow')) engagementElements.push('Social engagement');
  if (fullText.includes('comment') || fullText.includes('share')) engagementElements.push('Call for interaction');
  if (fullText.includes('save') || fullText.includes('bookmark')) engagementElements.push('Save for later');
  if (frames.some(f => f.ocrText?.includes('@'))) engagementElements.push('User mentions');
  if (frames.some(f => f.ocrText?.includes('#'))) engagementElements.push('Hashtags');
  
  // Extract call to action
  const callToAction = extractCallToAction(fullText);
  
  return {
    openingHook,
    hookType,
    engagementElements,
    callToAction,
  };
}

function analyzeProduction(frames: Array<{ t: number; ocrText?: string }>, transcript: string) {
  // Analyze visual quality based on frame count and text clarity
  let visualQuality: 'low' | 'medium' | 'high' | 'professional' = 'medium';
  if (frames.length > 15) visualQuality = 'high';
  if (frames.length > 25) visualQuality = 'professional';
  if (frames.length < 5) visualQuality = 'low';
  
  // Analyze audio quality based on transcript length and clarity
  let audioQuality: 'low' | 'medium' | 'high' | 'professional' = 'medium';
  const transcriptLength = transcript.length;
  if (transcriptLength > 500) audioQuality = 'high';
  if (transcriptLength > 1000) audioQuality = 'professional';
  if (transcriptLength < 100) audioQuality = 'low';
  
  // Analyze editing style
  let editingStyle: 'minimal' | 'moderate' | 'dynamic' | 'professional' = 'moderate';
  if (frames.length > 20) editingStyle = 'dynamic';
  if (frames.length > 30) editingStyle = 'professional';
  if (frames.length < 8) editingStyle = 'minimal';
  
  // Extract color scheme from frame text (simplified)
  const colorScheme = extractColorScheme(frames);
  
  // Identify visual elements
  const visualElements = extractVisualElements(frames, transcript);
  
  return {
    visualQuality,
    audioQuality,
    editingStyle,
    colorScheme,
    visualElements,
  };
}

function analyzePerformance(transcript: string, frames: Array<{ t: number; ocrText?: string }>) {
  const wordsPerSecond = transcript.split(/\s+/).length / 30; // Assuming 30 second video
  
  // Analyze pacing
  let pacing: 'slow' | 'moderate' | 'fast' | 'varied' = 'moderate';
  if (wordsPerSecond > 3) pacing = 'fast';
  else if (wordsPerSecond < 1.5) pacing = 'slow';
  else if (frames.length > 20) pacing = 'varied';
  
  // Analyze energy level
  let energyLevel: 'low' | 'medium' | 'high' = 'medium';
  const energeticWords = ['amazing', 'incredible', 'wow', 'awesome', 'fantastic', 'excited', 'love', 'best'];
  const energeticCount = energeticWords.filter(word => transcript.toLowerCase().includes(word)).length;
  if (energeticCount > 3) energyLevel = 'high';
  else if (energeticCount < 1) energyLevel = 'low';
  
  // Analyze emotional tone
  let emotionalTone: 'positive' | 'neutral' | 'negative' | 'mixed' = 'neutral';
  const positiveWords = ['good', 'great', 'amazing', 'love', 'happy', 'excited', 'wonderful', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'hate', 'angry', 'sad', 'disappointed', 'awful', 'horrible'];
  
  const positiveCount = positiveWords.filter(word => transcript.toLowerCase().includes(word)).length;
  const negativeCount = negativeWords.filter(word => transcript.toLowerCase().includes(word)).length;
  
  if (positiveCount > negativeCount && positiveCount > 0) emotionalTone = 'positive';
  else if (negativeCount > positiveCount && negativeCount > 0) emotionalTone = 'negative';
  else if (positiveCount > 0 && negativeCount > 0) emotionalTone = 'mixed';
  
  // Analyze authenticity
  let authenticity: 'low' | 'medium' | 'high' = 'medium';
  const authenticWords = ['real', 'honest', 'genuine', 'authentic', 'personal', 'experience', 'story'];
  const authenticCount = authenticWords.filter(word => transcript.toLowerCase().includes(word)).length;
  if (authenticCount > 2) authenticity = 'high';
  else if (authenticCount < 1) authenticity = 'low';
  
  return {
    pacing,
    energyLevel,
    emotionalTone,
    authenticity,
  };
}

function analyzeBrandAlignment(ctx: AnalysisContext, text: string, frames: Array<{ t: number; ocrText?: string }>) {
  const brandKit = ctx.brandKit;
  if (!brandKit || !brandKit.inline) {
    return {
      brandFit: 5,
      messagingConsistency: 5,
      visualConsistency: 5,
      toneAlignment: 5,
    };
  }
  
  const inline = brandKit.inline;
  
  // Analyze brand fit
  let brandFit = 5;
  if (inline.brandName && text.toLowerCase().includes(inline.brandName.toLowerCase())) {
    brandFit += 2;
  }
  
  // Analyze messaging consistency
  let messagingConsistency = 5;
  const brandKeywords = inline.keywords?.tone || [];
  const brandKeywordMatches = brandKeywords.filter((keyword: string) => 
    text.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  messagingConsistency += Math.min(brandKeywordMatches, 3);
  
  // Analyze visual consistency
  let visualConsistency = 5;
  const brandColors = inline.palette || [];
  const frameTexts = frames.map(f => f.ocrText).join(' ');
  const colorMatches = brandColors.filter((color: string) => 
    frameTexts.toLowerCase().includes(color.toLowerCase())
  ).length;
  visualConsistency += Math.min(colorMatches, 2);
  
  // Analyze tone alignment
  let toneAlignment = 5;
  const avoidKeywords = inline.keywords?.avoid || [];
  const avoidMatches = avoidKeywords.filter((keyword: string) => 
    text.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  toneAlignment -= avoidMatches * 2;
  
  return {
    brandFit: Math.max(0, Math.min(10, brandFit)),
    messagingConsistency: Math.max(0, Math.min(10, messagingConsistency)),
    visualConsistency: Math.max(0, Math.min(10, visualConsistency)),
    toneAlignment: Math.max(0, Math.min(10, toneAlignment)),
  };
}

function generateRecommendations(contentAnalysis: any, hookAnalysis: any, brandAlignment: any) {
  const strengths = [];
  const improvements = [];
  const suggestedActions = [];
  
  // Analyze strengths
  if (contentAnalysis.contentType !== 'other') {
    strengths.push(`Clear content type: ${contentAnalysis.contentType}`);
  }
  if (hookAnalysis.hookType !== 'other') {
    strengths.push(`Effective hook type: ${hookAnalysis.hookType}`);
  }
  if (hookAnalysis.engagementElements.length > 0) {
    strengths.push(`Good engagement elements: ${hookAnalysis.engagementElements.join(', ')}`);
  }
  if (brandAlignment.brandFit > 7) {
    strengths.push('Strong brand alignment');
  }
  
  // Identify improvements
  if (contentAnalysis.keyTopics.length < 2) {
    improvements.push('Add more specific topics or themes');
  }
  if (!hookAnalysis.callToAction) {
    improvements.push('Include a clear call to action');
  }
  if (brandAlignment.messagingConsistency < 6) {
    improvements.push('Improve messaging consistency with brand guidelines');
  }
  if (brandAlignment.toneAlignment < 6) {
    improvements.push('Align tone better with brand voice');
  }
  
  // Suggest actions
  if (hookAnalysis.hookType === 'other') {
    suggestedActions.push('Consider adding a stronger opening hook');
  }
  if (hookAnalysis.engagementElements.length < 2) {
    suggestedActions.push('Add more engagement elements (questions, hashtags, etc.)');
  }
  if (brandAlignment.visualConsistency < 6) {
    suggestedActions.push('Use brand colors more consistently');
  }
  if (contentAnalysis.targetAudience) {
    suggestedActions.push(`Tailor content more specifically for: ${contentAnalysis.targetAudience}`);
  }
  
  return {
    strengths,
    improvements,
    suggestedActions,
  };
}

// Helper functions
function extractKeyTopics(text: string): string[] {
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word));
  
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}

function generateSummary(sentences: string[], transcript: string, caption: string | null): string {
  if (sentences.length === 0) return 'Visual content with minimal text';
  
  // Use the first sentence as summary, or create one from key elements
  const firstSentence = sentences[0];
  if (firstSentence.length > 20 && firstSentence.length < 100) {
    return firstSentence;
  }
  
  // Create summary from key elements
  const keyWords = extractKeyTopics([transcript, caption].filter(Boolean).join(' '));
  return `Content about ${keyWords.slice(0, 3).join(', ')}`;
}

function extractMainMessage(sentences: string[], keyTopics: string[]): string {
  if (sentences.length === 0) return 'Visual storytelling';
  
  // Find the sentence that contains the most key topics
  let bestSentence = sentences[0];
  let maxTopicMatches = 0;
  
  for (const sentence of sentences) {
    const topicMatches = keyTopics.filter(topic => 
      sentence.toLowerCase().includes(topic.toLowerCase())
    ).length;
    
    if (topicMatches > maxTopicMatches) {
      maxTopicMatches = topicMatches;
      bestSentence = sentence;
    }
  }
  
  return bestSentence.length > 150 ? bestSentence.substring(0, 147) + '...' : bestSentence;
}

function determineTargetAudience(text: string, contentType: string): string | undefined {
  const audienceKeywords = {
    'teens': ['teen', 'young', 'student', 'school'],
    'adults': ['adult', 'professional', 'work', 'career'],
    'parents': ['parent', 'family', 'child', 'kids'],
    'fitness': ['fitness', 'workout', 'gym', 'exercise'],
    'beauty': ['beauty', 'makeup', 'skincare', 'fashion'],
    'food': ['food', 'recipe', 'cooking', 'kitchen'],
    'travel': ['travel', 'vacation', 'trip', 'destination'],
  };
  
  for (const [audience, keywords] of Object.entries(audienceKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return audience;
    }
  }
  
  return undefined;
}

function extractCallToAction(text: string): string | undefined {
  const ctaPatterns = [
    /follow\s+me/i,
    /like\s+and\s+subscribe/i,
    /check\s+out/i,
    /visit\s+my/i,
    /link\s+in\s+bio/i,
    /swipe\s+up/i,
    /click\s+the\s+link/i,
    /save\s+this\s+post/i,
    /share\s+this/i,
    /comment\s+below/i,
  ];
  
  for (const pattern of ctaPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return undefined;
}

function extractColorScheme(frames: Array<{ t: number; ocrText?: string }>): string[] {
  const colors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray'];
  const foundColors = new Set<string>();
  
  frames.forEach(frame => {
    if (frame.ocrText) {
      colors.forEach(color => {
        if (frame.ocrText!.toLowerCase().includes(color)) {
          foundColors.add(color);
        }
      });
    }
  });
  
  return Array.from(foundColors);
}

function extractVisualElements(frames: Array<{ t: number; ocrText?: string }>, transcript: string): string[] {
  const elements = [];
  const frameTexts = frames.map(f => f.ocrText).join(' ');
  const allText = [transcript, frameTexts].join(' ');
  
  if (allText.includes('@')) elements.push('User mentions');
  if (allText.includes('#')) elements.push('Hashtags');
  if (allText.includes('$')) elements.push('Price tags');
  if (frames.some(f => f.ocrText?.includes('→') || f.ocrText?.includes('→'))) elements.push('Arrows');
  if (frames.some(f => f.ocrText?.includes('❤') || f.ocrText?.includes('♥'))) elements.push('Hearts');
  if (frames.some(f => f.ocrText?.includes('⭐') || f.ocrText?.includes('★'))) elements.push('Stars');
  
  return elements;
}
