import { z } from 'zod';

export const RuleSchema = z.object({
  id: z.string(),
  type: z.enum(['disclosure', 'claim', 'brand_safety', 'competitor_conflict', 'visual_identity', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  patterns: z.array(z.string()),
  position_threshold: z.number().optional(),
  required: z.boolean().optional(),
  category: z.string().optional(),
  requires_disclaimer: z.boolean().optional(),
});

export const RulePackSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  rules: z.array(RuleSchema),
});

export const FlagSchema = z.object({
  type: z.enum(['disclosure', 'claim', 'brand_safety', 'competitor_conflict', 'visual_identity', 'other']),
  code: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  evidence: z.record(z.any()).optional(),
});

export type Rule = z.infer<typeof RuleSchema>;
export type RulePack = z.infer<typeof RulePackSchema>;
export type Flag = z.infer<typeof FlagSchema>;
