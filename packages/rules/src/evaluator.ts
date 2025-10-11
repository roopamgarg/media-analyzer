import { Rule, Flag } from './types';
import { loadRulePacks } from './loader';
import { CreateAnalysisRequest } from '@media-analyzer/contracts';

export interface EvaluationContext {
  text: string;
  category: string;
  brandKit?: CreateAnalysisRequest['brandKit'];
  entities?: {
    brands: string[];
    competitors: string[];
    regulated: string[];
  };
}

export class RuleEvaluator {
  private rules: Rule[] = [];
  
  async initialize(): Promise<void> {
    const rulePacks = await loadRulePacks();
    this.rules = rulePacks.flatMap(pack => pack.rules);
  }
  
  evaluate(context: EvaluationContext): Flag[] {
    const flags: Flag[] = [];
    
    for (const rule of this.rules) {
      // Filter rules by category if specified
      if (rule.category && rule.category !== context.category) {
        continue;
      }
      
      const flag = this.evaluateRule(rule, context);
      if (flag) {
        flags.push(flag);
      }
    }
    
    return this.dedupeAndRank(flags);
  }
  
  private evaluateRule(rule: Rule, context: EvaluationContext): Flag | null {
    const text = context.text.toLowerCase();
    
    // Check for pattern matches
    const matches = rule.patterns.filter(pattern => 
      text.includes(pattern.toLowerCase())
    );
    
    if (matches.length === 0) {
      // Check if this is a required rule that's missing
      if (rule.required && rule.type === 'disclosure') {
        return {
          type: rule.type,
          code: rule.id,
          severity: rule.severity,
          message: rule.message,
          evidence: {
            missing: true,
            patterns: rule.patterns,
          },
        };
      }
      return null;
    }
    
    // Check position threshold for disclosure rules
    if (rule.position_threshold && rule.type === 'disclosure') {
      const firstMatch = rule.patterns.find(pattern => 
        text.includes(pattern.toLowerCase())
      );
      
      if (firstMatch) {
        const position = text.indexOf(firstMatch.toLowerCase());
        if (position > rule.position_threshold) {
          return {
            type: rule.type,
            code: rule.id,
            severity: rule.severity,
            message: rule.message,
            evidence: {
              position,
              threshold: rule.position_threshold,
              pattern: firstMatch,
            },
          };
        }
      }
    }
    
    // Regular match found
    return {
      type: rule.type,
      code: rule.id,
      severity: rule.severity,
      message: rule.message,
      evidence: {
        matches,
        patterns: rule.patterns,
      },
    };
  }
  
  private dedupeAndRank(flags: Flag[]): Flag[] {
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
}

// Singleton instance
let evaluator: RuleEvaluator | null = null;

export async function getRuleEvaluator(): Promise<RuleEvaluator> {
  if (!evaluator) {
    evaluator = new RuleEvaluator();
    await evaluator.initialize();
  }
  return evaluator;
}
