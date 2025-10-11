import { Flag } from '@media-analyzer/contracts';
import { TimedDocument } from './nlp';
import { BrandKit, Scores } from '../types/services';

export interface ScoringArgs {
  flags: Flag[];
  doc: TimedDocument;
  brandKit: BrandKit;
}

export function scoreAll(args: ScoringArgs): Scores {
  const { flags, doc, brandKit } = args;
  
  const components = {
    claims: weightSum(flags, 'claim'),
    safety: weightSum(flags, 'brand_safety'),
    disclosure: weightSum(flags, 'disclosure'),
    visual: visualDelta(doc, brandKit),
    competitor: weightSum(flags, 'competitor_conflict'),
    toneMatch: toneSimilarity(doc, brandKit?.inline?.keywords?.tone || []),
  };
  
  // Risk calculation (0-100, higher is worse)
  const risk = 
    0.40 * components.claims +
    0.25 * components.safety +
    0.15 * components.disclosure +
    0.10 * components.visual +
    0.10 * components.competitor;
  
  // Vibe calculation (0-100, higher is better)
  const vibe = 
    0.40 * components.toneMatch +
    0.20 * captionStyleScore(doc) +
    0.20 * paletteScore(doc, brandKit) +
    0.20 * audienceMatchScore(doc);
  
  return {
    risk: Math.round(risk),
    vibe: Math.round(vibe),
    labels: labelize(risk, vibe),
    components,
  };
}

function weightSum(flags: Flag[], type: string): number {
  const typeFlags = flags.filter(flag => flag.type === type);
  
  return typeFlags.reduce((sum, flag) => {
    const severityWeights = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
    };
    
    return sum + severityWeights[flag.severity];
  }, 0);
}

function visualDelta(doc: TimedDocument, brandKit: BrandKit): number {
  // Placeholder for visual identity scoring
  // In a real implementation, this would compare frame colors with brand palette
  return 0;
}

function toneSimilarity(doc: TimedDocument, toneKeywords: string[]): number {
  if (toneKeywords.length === 0) {
    return 50; // Neutral score if no tone keywords defined
  }
  
  const text = doc.fullText.toLowerCase();
  const matches = toneKeywords.filter(keyword =>
    text.includes(keyword.toLowerCase())
  );
  
  return Math.round((matches.length / toneKeywords.length) * 100);
}

function captionStyleScore(doc: TimedDocument): number {
  // Simple heuristic for caption style
  const caption = doc.timeline.find(t => t.source === 'caption')?.text || '';
  
  if (caption.length === 0) {
    return 50; // Neutral if no caption
  }
  
  // Check for engagement elements
  let score = 50;
  
  if (caption.includes('?')) score += 10; // Questions
  if (caption.includes('!')) score += 5;  // Excitement
  if (caption.length > 100) score += 10;  // Detailed
  if (caption.includes('#')) score += 5;  // Hashtags
  
  return Math.min(100, score);
}

function paletteScore(doc: TimedDocument, brandKit: BrandKit): number {
  // Placeholder for palette scoring
  // In a real implementation, this would analyze frame colors
  return 50;
}

function audienceMatchScore(doc: TimedDocument): number {
  // Placeholder for audience matching
  // In a real implementation, this would analyze content for target audience
  return 50;
}

function labelize(risk: number, vibe: number): { risk: string; vibe: string } {
  const riskLabel = 
    risk >= 80 ? 'Critical' :
    risk >= 60 ? 'High' :
    risk >= 40 ? 'Medium' :
    risk >= 20 ? 'Low' : 'Minimal';
  
  const vibeLabel = 
    vibe >= 80 ? 'Excellent' :
    vibe >= 60 ? 'Good' :
    vibe >= 40 ? 'Fair' :
    vibe >= 20 ? 'Poor' : 'Very Poor';
  
  return { risk: riskLabel, vibe: vibeLabel };
}
