import { z } from 'zod';

export const EvidenceOptions = z.object({
  screenshots: z.boolean().default(true),
  transcriptSpans: z.boolean().default(true),
  frames: z.array(z.number()).default([0, 1, 3, 5, 10]),
});

export const InlineBrandKit = z.object({
  brandName: z.string().min(1),
  category: z.enum(['Beauty', 'Health', 'Finance', 'Gaming', 'Other']).optional(),
  palette: z.array(z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)).min(1),
  doDonts: z.object({ 
    do: z.array(z.string()), 
    dont: z.array(z.string()) 
  }),
  competitors: z.array(z.string()).default([]),
  keywords: z.object({ 
    tone: z.array(z.string()).default([]), 
    avoid: z.array(z.string()).default([]) 
  }).default({ tone: [], avoid: [] })
});

export const CreateAnalysisRequest = z.object({
  input: z.object({
    url: z.string().url().optional(),
    instagramReelUrl: z.string().url().refine(
      (url) => {
        const instagramPatterns = [
          /^https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?$/,
          /^https?:\/\/(www\.)?instagram\.com\/reels\/[A-Za-z0-9_-]+\/?$/,
          /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/,
        ];
        return instagramPatterns.some(pattern => pattern.test(url));
      },
      { message: "Must be a valid Instagram Reel URL" }
    ).optional(),
    media: z.object({
      videoBase64: z.string().optional(),
      caption: z.string().nullish(),
      languageHint: z.string().optional(),
    }).partial().optional(),
  }),
  brandKit: z.object({ 
    brandKitId: z.string().optional(), 
    inline: InlineBrandKit.optional() 
  }),
  category: z.enum(['Beauty', 'Health', 'Finance', 'Gaming', 'Other']),
  options: z.object({ 
    returnPdf: z.boolean().default(false), 
    evidence: EvidenceOptions.default({}) 
  }).default({}),
  idempotencyKey: z.string().uuid().optional(),
}).refine((v) => !!(v.input.url || v.input.instagramReelUrl || v.input.media), {
  message: 'Provide input.url, input.instagramReelUrl, or input.media',
  path: ['input']
}).refine((v) => !!(v.brandKit.brandKitId || v.brandKit.inline), {
  message: 'Provide brandKitId or inline',
  path: ['brandKit']
});

export const Flag = z.object({
  type: z.enum(['disclosure', 'claim', 'brand_safety', 'competitor_conflict', 'visual_identity', 'other']),
  code: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  evidence: z.record(z.any()).optional(),
});

export const AnalysisResult = z.object({
  analysisId: z.string(),
  mode: z.literal('sync'),
  status: z.literal('completed'),
  scores: z.object({
    risk: z.number(),
    vibe: z.number(),
    labels: z.object({ risk: z.string(), vibe: z.string() }),
    components: z.record(z.number())
  }),
  flags: z.array(Flag),
  evidence: z.object({ 
    frames: z.array(z.object({ 
      t: z.number(), 
      imageUrl: z.string(), 
      ocr: z.string().optional() 
    })), 
    caption: z.string().nullish(), 
    transcript: z.string().nullish() 
  }),
  artifacts: z.object({ pdfUrl: z.string().nullable() }),
  timings: z.object({ totalMs: z.number(), stages: z.record(z.number()) }),
  version: z.string()
});

export const AnalysisAccepted = z.object({ 
  analysisId: z.string(), 
  mode: z.literal('async'), 
  status: z.literal('queued'), 
  pollAfterMs: z.number() 
});

export const AnalysisStatus = z.object({
  analysisId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  error: z.string().optional(),
  result: AnalysisResult.optional()
});

// Type exports
export type EvidenceOptions = z.infer<typeof EvidenceOptions>;
export type InlineBrandKit = z.infer<typeof InlineBrandKit>;
export type CreateAnalysisRequest = z.infer<typeof CreateAnalysisRequest>;
export type Flag = z.infer<typeof Flag>;
export type AnalysisResult = z.infer<typeof AnalysisResult>;
export type AnalysisAccepted = z.infer<typeof AnalysisAccepted>;
export type AnalysisStatus = z.infer<typeof AnalysisStatus>;
