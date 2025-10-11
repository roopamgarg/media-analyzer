import { getRuleEvaluator } from '@media-analyzer/rules';
import { Flag } from '@media-analyzer/contracts';
import { TimedDocument, Entities } from './nlp';
import { BrandKit } from '../types/services';

export interface BuildFlagsArgs {
  doc: TimedDocument;
  entities: Entities;
  brandKit: BrandKit;
  category: string;
}

export async function buildFlags(args: BuildFlagsArgs): Promise<Flag[]> {
  const { doc, entities, brandKit, category } = args;
  const flags: Flag[] = [];
  
  // Get rule evaluator
  const evaluator = await getRuleEvaluator();
  
  // Evaluate rules against the full text
  const ruleFlags = await evaluator.evaluate({
    text: doc.fullText,
    category,
    brandKit,
    entities,
  });
  
  flags.push(...ruleFlags);
  
  // Add competitor conflict flags
  flags.push(...competitorRules(entities, brandKit));
  
  // Add visual identity flags (placeholder)
  flags.push(...visualRules(doc, brandKit));
  
  return dedupeAndRank(flags);
}

function competitorRules(entities: Entities, brandKit: BrandKit): Flag[] {
  const flags: Flag[] = [];
  
  if (!brandKit?.inline?.competitors) {
    return flags;
  }
  
  const mentionedCompetitors = entities.competitors.filter(competitor =>
    brandKit.inline!.competitors.some((bkCompetitor: string) =>
      competitor.toLowerCase().includes(bkCompetitor.toLowerCase())
    )
  );
  
  if (mentionedCompetitors.length > 0) {
    flags.push({
      type: 'competitor_conflict',
      code: 'COMPETITOR_MENTIONED',
      severity: 'medium',
      message: `Competitor mentioned: ${mentionedCompetitors.join(', ')}`,
      evidence: {
        competitors: mentionedCompetitors,
        brandKitCompetitors: brandKit.inline!.competitors,
      },
    });
  }
  
  return flags;
}

function visualRules(doc: TimedDocument, brandKit: BrandKit): Flag[] {
  const flags: Flag[] = [];
  
  // Placeholder for visual identity rules
  // In a real implementation, this would analyze the first frame
  // and compare colors with the brand kit palette
  
  return flags;
}

function dedupeAndRank(flags: Flag[]): Flag[] {
  // Remove duplicates by code
  const unique = flags.filter((flag, index, self) =>
    index === self.findIndex(f => f.code === flag.code)
  );
  
  // Sort by severity (critical > high > medium > low)
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  return unique.sort((a, b) =>
    severityOrder[b.severity] - severityOrder[a.severity]
  );
}
